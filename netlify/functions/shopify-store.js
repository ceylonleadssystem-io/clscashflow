'use strict';

// Settings > System Options > Online Store: a business connects, checks or removes a Shopify store. The store's webhook signing
// secret is stored encrypted (see lib/ai-keys.js) and is never returned; only the last 4 characters are.
const { guard, reply } = require('../lib/security');
const { getUserFromEvent, getDocument, upsertDocument, deleteDocument, clean } = require('../lib/appwrite');
const { normalizeShop, shopKey, normalizeCurrency, normalizeEmail } = require('../lib/shopify');
const { _encrypt: encrypt } = require('../lib/ai-keys');
const log = require('../lib/log').createLogger('shopify-store');

function publicBase(event) {
  const configured = clean(process.env.PUBLIC_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL, 500);
  if (configured) return configured.replace(/\/$/, '');
  const host = clean((event.headers || {})['x-forwarded-host'] || (event.headers || {}).host, 300);
  return host ? 'https://' + host : 'https://ceylonrylabs.io';
}

async function view(ownerUid, event) {
  const reg = await getDocument('shopifyBusinesses', ownerUid).catch(function() { return null; });
  const shops = (reg && reg.data && reg.data.shops) || [];
  const full = await Promise.all(shops.map(async function(s) {
    const row = await getDocument('shopifyShops', shopKey(s.shop)).catch(function() { return null; });
    return Object.assign({}, s, { lastOrderAt: (row && row.data && row.data.lastOrderAt) || '' });
  }));
  return { shops: full, webhookUrl: publicBase(event) + '/.netlify/functions/shopify-webhook' };
}

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'shopify-store', methods: ['POST'], limit: 20, windowMs: 60000, maxBody: 4000 });
  if (blocked) return blocked;
  try {
    const user = await getUserFromEvent(event);
    if (!user) return reply(event, 401, { ok: false, error: 'Please sign in again.' });
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ }
    const profile = await getDocument('users', user.id);
    const ownerUid = clean((profile && profile.data && profile.data.ownerUid) || user.id, 240);
    const action = String(body.action || 'status');
    if (action === 'status') return reply(event, 200, Object.assign({ ok: true }, await view(ownerUid, event)));

    const shop = normalizeShop(body.shop);
    if (!shop) return reply(event, 400, { ok: false, error: 'Enter the store address, like my-store.myshopify.com.' });
    const reg = await getDocument('shopifyBusinesses', ownerUid).catch(function() { return null; });
    const shops = ((reg && reg.data && reg.data.shops) || []).filter(function(s) { return s.shop !== shop; });

    if (action === 'remove') {
      const row = await getDocument('shopifyShops', shopKey(shop)).catch(function() { return null; });
      if (row && row.data && row.data.business === ownerUid) await deleteDocument('shopifyShops', shopKey(shop));
      await upsertDocument('shopifyBusinesses', ownerUid, { business: ownerUid, shops: shops }, false);
      log.info('store removed', { ownerUid, shop, by: user.id });
      return reply(event, 200, Object.assign({ ok: true }, await view(ownerUid, event)));
    }
    if (action === 'save') {
      const secret = String(body.secret || '').trim();
      if (secret.length < 16 || secret.length > 200 || /\s/.test(secret)) return reply(event, 400, { ok: false, error: 'Paste the webhook signing secret shown in Shopify (Settings > Notifications > Webhooks).' });
      // the location must be one of this business's own locations
      const locationId = String(body.locationId || '');
      const workspace = await getDocument('users/' + ownerUid + '/pos', 'main').catch(function() { return null; });
      const locations = ((workspace && workspace.data && workspace.data.payload && workspace.data.payload.locations) || []).map(function(l) { return l && l.id; });
      if (!locationId || !locations.includes(locationId)) return reply(event, 400, { ok: false, error: 'Choose the location that prepares these orders.' });
      // the POS counts in LKR: a store in another currency needs the rate (LKR for 1 unit of its currency)
      const currency = normalizeCurrency(body.currency);
      if (!currency) return reply(event, 400, { ok: false, error: 'Enter the store currency as three letters, like LKR or USD.' });
      const rate = currency === 'LKR' ? 1 : Number(body.rate);
      if (!(rate > 0 && rate < 1000000)) return reply(event, 400, { ok: false, error: 'Enter how many LKR one ' + currency + ' is worth.' });
      const notifyEmail = body.notifyEmail ? normalizeEmail(body.notifyEmail) : '';
      if (body.notifyEmail && !notifyEmail) return reply(event, 400, { ok: false, error: 'Enter a valid e-mail address, or leave it empty.' });
      // a store belongs to one business
      const taken = await getDocument('shopifyShops', shopKey(shop)).catch(function() { return null; });
      if (taken && taken.data && taken.data.business && taken.data.business !== ownerUid) return reply(event, 409, { ok: false, error: 'That store is already connected to another business.' });
      const now = new Date().toISOString();
      await upsertDocument('shopifyShops', shopKey(shop), { business: ownerUid, shop: shop, locationId: locationId, box: encrypt(secret), last4: secret.slice(-4), currency: currency, rate: rate, notifyEmail: notifyEmail, connectedAt: now, by: user.id }, true);
      await upsertDocument('shopifyBusinesses', ownerUid, { business: ownerUid, shops: shops.concat([{ shop: shop, locationId: locationId, last4: secret.slice(-4), currency: currency, rate: rate, notifyEmail: notifyEmail, connectedAt: now }]) }, false);
      log.info('store saved', { ownerUid, shop, locationId, by: user.id });
      return reply(event, 200, Object.assign({ ok: true }, await view(ownerUid, event)));
    }
    return reply(event, 400, { ok: false, error: 'Unknown action.' });
  } catch (err) {
    if (!err.statusCode || err.statusCode >= 500) log.error('shopify store action failed', err);
    return reply(event, err.statusCode || 500, { ok: false, error: err.statusCode ? err.message : 'Could not update the online store right now.' });
  }
};
