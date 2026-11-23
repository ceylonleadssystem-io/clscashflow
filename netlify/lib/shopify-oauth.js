'use strict';

// Connecting the POS to a store's Admin API (so it can accept, decline and fulfil orders, and pull past orders). The store owner approves the app
// once; Shopify then sends the browser back to shopify-oauth.js with a code that is exchanged for an access token.
// Which app a store uses: SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET are the POS's own (public) app, used by every merchant. A store that was set up
// with a dedicated app (a Shopify custom app can be installed on one store only) is listed in SHOPIFY_CUSTOM_APPS, a JSON object like
// {"my-shop.myshopify.com": {"id": "...", "secret": "..."}}. CEYLO_KEY_SECRET signs the "state" that ties the return to the business that asked.
const crypto = require('crypto');
const { SCOPES } = require('./shopify-admin');
const { normalizeShop } = require('./shopify');

const STATE_TTL_MS = 15 * 60 * 1000;

/** The app credentials of one store: its dedicated app when listed, else the POS's own app. */
function credentials(shop) {
  let custom = {};
  try { custom = JSON.parse(process.env.SHOPIFY_CUSTOM_APPS || '{}') || {}; } catch (_) { custom = {}; }
  const own = shop && custom[shop];
  if (own && own.id && own.secret) return { id: String(own.id), secret: String(own.secret) };
  const id = process.env.SHOPIFY_CLIENT_ID || '', secret = process.env.SHOPIFY_CLIENT_SECRET || '';
  if (!id || !secret) { const e = new Error('Shopify access is not set up yet. Ask Ceylonry to set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET.'); e.statusCode = 503; throw e; }
  return { id: id, secret: secret };
}
function stateKey() {
  const s = process.env.CEYLO_KEY_SECRET || '';
  if (s.length < 32) { const e = new Error('Saving AI keys is not set up yet. Ask Ceylonry to set CEYLO_KEY_SECRET.'); e.statusCode = 503; throw e; }
  return crypto.createHash('sha256').update(s + ':shopify-state').digest();
}
const b64 = (buf) => Buffer.from(buf).toString('base64url');

/** A signed, short-lived token naming the business and store that asked to connect. */
function makeState(ownerUid, shop, now) {
  const body = b64(JSON.stringify({ o: ownerUid, s: shop, t: now || Date.now(), n: crypto.randomBytes(8).toString('hex') }));
  return body + '.' + b64(crypto.createHmac('sha256', stateKey()).update(body).digest());
}
/** { ownerUid, shop } of a genuine, fresh state, or null. */
function readState(state, now) {
  const parts = String(state || '').split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', stateKey()).update(parts[0]).digest();
  let given;
  try { given = Buffer.from(parts[1], 'base64url'); } catch (_) { return null; }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  let data;
  try { data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')); } catch (_) { return null; }
  if (!data || !data.o || !data.s || (now || Date.now()) - Number(data.t) > STATE_TTL_MS) return null;
  return { ownerUid: String(data.o), shop: String(data.s) };
}

/** The address of Shopify's approval page for this store. */
function authorizeUrl(shop, ownerUid, redirectUri) {
  const c = credentials(shop);
  const q = new URLSearchParams({ client_id: c.id, scope: SCOPES.join(','), redirect_uri: redirectUri, state: makeState(ownerUid, shop) });
  return 'https://' + shop + '/admin/oauth/authorize?' + q.toString();
}

/** Does the signature Shopify put on the return (or launch) address match? (HMAC-SHA256 hex over the other parameters, sorted, with the app's secret.) */
function verifyReturn(query) {
  const given = String((query && query.hmac) || '');
  const shop = normalizeShop(query && query.shop);
  const message = Object.keys(query || {}).filter(function(k) { return k !== 'hmac'; }).sort().map(function(k) { return k + '=' + query[k]; }).join('&');
  const expected = crypto.createHmac('sha256', credentials(shop).secret).update(message).digest('hex');
  return given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Exchanges the one-time code for the store's access token: { token, scope }. `fetchImpl` is for tests. */
async function exchangeCode(shop, code, fetchImpl) {
  const c = credentials(shop);
  const res = await (fetchImpl || fetch)('https://' + shop + '/admin/oauth/access_token', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ client_id: c.id, client_secret: c.secret, code: code }) });
  const json = await res.json().catch(function() { return {}; });
  if (!res.ok || !json.access_token) { const e = new Error('Shopify did not give access (' + res.status + ').'); e.statusCode = 502; throw e; }
  return { token: json.access_token, scope: String(json.scope || '') };
}

/** The secret that signs webhooks the app subscribed to itself (empty when the app is not configured, so the caller can fall back). */
function appWebhookSecret(shop) {
  try { return credentials(shop).secret; } catch (_) { return ''; }
}

module.exports = { STATE_TTL_MS, appWebhookSecret, credentials, makeState, readState, authorizeUrl, verifyReturn, exchangeCode, normalizeShop };
