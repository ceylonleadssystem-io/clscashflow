'use strict';

// The POS tells a connected Shopify store what staff did with an order: accept, decline, fulfill (with tracking) or tracking.
// Signed-in staff only; the store must belong to their business and have its Admin access connected (see shopify-oauth.js).
const { guard, reply } = require('../lib/security');
const { getUserFromEvent, getDocument, clean } = require('../lib/appwrite');
const { normalizeShop, shopKey } = require('../lib/shopify');
const admin = require('../lib/shopify-admin');
const { _decrypt: decrypt } = require('../lib/ai-keys');
const log = require('../lib/log').createLogger('shopify-order-action');

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'shopify-order-action', methods: ['POST'], limit: 60, windowMs: 60000, maxBody: 6000 });
  if (blocked) return blocked;
  try {
    const user = await getUserFromEvent(event);
    if (!user) return reply(event, 401, { ok: false, error: 'Please sign in again.' });
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ }
    const profile = await getDocument('users', user.id);
    const ownerUid = clean((profile && profile.data && profile.data.ownerUid) || user.id, 240);
    const action = clean(body.action, 20);
    const shop = normalizeShop(body.shop);
    const orderId = clean(body.orderId, 40).replace(/[^0-9]/g, '');
    const o = body.options && typeof body.options === 'object' ? body.options : {};
    if (!shop || !orderId || !['accept', 'decline', 'fulfill', 'tracking'].includes(action)) return reply(event, 400, { ok: false, error: 'Could not tell which order this is.' });

    const row = await getDocument('shopifyShops', shopKey(shop));
    const data = row && row.data;
    if (!data || data.business !== ownerUid) return reply(event, 404, { ok: false, error: 'That store is not connected to this business.' });
    if (!data.adminBox) return reply(event, 409, { ok: false, code: 'no_access', error: 'Shopify access is not connected, so only the POS was updated.' });
    const token = decrypt(data.adminBox);

    let result;
    if (action === 'accept') result = await admin.acceptOrder(shop, token, orderId);
    else if (action === 'decline') result = await admin.cancelOrder(shop, token, orderId, o);
    else if (action === 'fulfill') result = await admin.fulfillOrder(shop, token, orderId, o);
    else result = await admin.updateTracking(shop, token, orderId, o);
    log.info('store updated', { ownerUid, shop, action, by: user.id });
    return reply(event, 200, Object.assign({ ok: true }, result));
  } catch (err) {
    if (err.code !== 'no_access' && (!err.statusCode || err.statusCode >= 500)) log.error('shopify action failed', err);
    return reply(event, err.statusCode || (err.code === 'no_access' ? 409 : 502), { ok: false, code: err.code, error: err.message || 'Shopify could not be updated.' });
  }
};
