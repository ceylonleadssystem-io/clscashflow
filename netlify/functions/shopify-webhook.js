'use strict';

// Public endpoint Shopify calls for each order (topics orders/create and orders/cancelled). It only verifies the signature,
// stores the order in the business's inbox and answers 200 at once (Shopify gives 5 seconds). A POS picks it up from there.
const { getDocument, upsertDocument, clean } = require('../lib/appwrite');
const { normalizeShop, shopKey, verifySignature, sanitizeOrder } = require('../lib/shopify');
const { _decrypt: decrypt } = require('../lib/ai-keys');
const { posAway, sendNewOrderEmail } = require('../lib/shopify-notify');
const { appWebhookSecret } = require('../lib/shopify-oauth');

const hits = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_HITS = 300;

function limited(event) {
  const now = Date.now();
  const ip = clean(event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown', 120).split(',')[0];
  const cur = hits.get(ip);
  if (hits.size > 2000) hits.forEach(function(v, k) { if (now - v.at >= WINDOW_MS) hits.delete(k); });
  if (!cur || now - cur.at >= WINDOW_MS) { hits.set(ip, { at: now, n: 1 }); return false; }
  cur.n += 1;
  return cur.n > MAX_HITS;
}

const reply = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') return reply(405, { ok: false });
  if (limited(event)) return reply(429, { ok: false });
  const h = event.headers || {};
  const shop = normalizeShop(h['x-shopify-shop-domain']);
  if (!shop) return reply(400, { ok: false });
  try {
    const row = await getDocument('shopifyShops', shopKey(shop));
    const data = row && row.data;
    if (!data || !data.business || !(data.box || data.adminBox)) return reply(404, { ok: false });
    // the signature covers the exact bytes Shopify sent
    const raw = Buffer.from(event.body || '', event.isBase64Encoded ? 'base64' : 'utf8');
    // webhooks made by hand in the store are signed with the store's signing secret, those the app subscribed to with the app's secret
    const secrets = [];
    if (data.box) { try { secrets.push(decrypt(data.box)); } catch (_) { /* unreadable: the app secret may still match */ } }
    const app = appWebhookSecret(shop);
    if (app) secrets.push(app);
    if (!secrets.length) return reply(503, { ok: false });
    if (!secrets.some(function(secret) { return verifySignature(raw, h['x-shopify-hmac-sha256'], secret); })) return reply(401, { ok: false });

    const topic = clean(h['x-shopify-topic'], 60);
    let order;
    try { order = JSON.parse(raw.toString('utf8')); } catch (_) { return reply(400, { ok: false }); }
    const orderId = clean(order && order.id, 40).replace(/[^0-9]/g, '');
    if (!orderId) return reply(200, { ok: true });
    const path = 'shopifyInbox/' + data.business;
    const id = 'o' + orderId;
    const existing = await getDocument(path, id);

    if (topic === 'orders/create') {
      // Shopify can deliver the same order more than once: a stored order is left as it is
      if (!existing) {
        await upsertDocument(path, id, { status: 'new', shop: shop, locationId: data.locationId || '', order: sanitizeOrder(order), receivedAt: new Date().toISOString() }, false);
        await upsertDocument('shopifyShops', shopKey(shop), { lastOrderAt: new Date().toISOString() }, true);
        // closed shop: no POS has looked for orders lately, so the owner is e-mailed
        if (data.notifyEmail) {
          const reg = await getDocument('shopifyBusinesses', data.business).catch(function() { return null; });
          // never hold the answer to Shopify for the mail server: Shopify gives 5 seconds
          if (posAway(reg && reg.data && reg.data.lastPollAt)) await Promise.race([sendNewOrderEmail(data.notifyEmail, shop, sanitizeOrder(order)), new Promise(function(resolve) { setTimeout(resolve, 2500); })]);
        }
      }
    } else if (topic === 'orders/cancelled') {
      // cancelled before any POS took it: nothing to prepare, nobody to tell. Cancelled after: the POS that took it is told once.
      if (existing) await upsertDocument(path, id, existing.data.status === 'new' ? { status: 'taken', cancelled: true, cancelNotified: true } : { cancelled: true, cancelNotified: false }, true);
      else await upsertDocument(path, id, { status: 'taken', cancelled: true, cancelNotified: true, shop: shop, locationId: data.locationId || '', order: sanitizeOrder(order), receivedAt: new Date().toISOString() }, false); // cancelled before any POS saw it: nothing to prepare
    }
    return reply(200, { ok: true });
  } catch (error) {
    console.error('shopify-webhook error', error && error.message);
    return reply(500, { ok: false });
  }
};
