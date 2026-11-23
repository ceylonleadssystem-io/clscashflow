'use strict';

// Pulls a store's past orders into the POS's inbox, a page at a time (the POS calls this again until nothing is left). Open orders arrive as New,
// fulfilled and cancelled ones as history. Nothing is imported twice: an order already in the inbox is left as it is.
const { guard, reply } = require('../lib/security');
const { getUserFromEvent, getDocument, upsertDocument, clean } = require('../lib/appwrite');
const { normalizeShop, shopKey, sanitizeOrder } = require('../lib/shopify');
const admin = require('../lib/shopify-admin');
const { _decrypt: decrypt } = require('../lib/ai-keys');
const log = require('../lib/log').createLogger('shopify-orders-import');

const PAGE = 10;

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'shopify-orders-import', methods: ['POST'], limit: 120, windowMs: 60000, maxBody: 3000 });
  if (blocked) return blocked;
  try {
    const user = await getUserFromEvent(event);
    if (!user) return reply(event, 401, { ok: false, error: 'Please sign in again.' });
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ }
    const profile = await getDocument('users', user.id);
    const ownerUid = clean((profile && profile.data && profile.data.ownerUid) || user.id, 240);
    const shop = normalizeShop(body.shop);
    const since = /^\d{4}-\d{2}-\d{2}$/.test(String(body.since || '')) ? body.since : '';
    if (!shop) return reply(event, 400, { ok: false, error: 'Choose a store.' });
    const row = await getDocument('shopifyShops', shopKey(shop));
    const data = row && row.data;
    if (!data || data.business !== ownerUid) return reply(event, 404, { ok: false, error: 'That store is not connected to this business.' });
    if (!data.adminBox) return reply(event, 409, { ok: false, code: 'no_access', error: 'Connect Shopify access for this store first.' });

    // a small page, written in parallel: a call has to finish within the function's time limit (about 10 seconds)
    const page = await admin.listOrders(shop, decrypt(data.adminBox), { since: since, cursor: clean(body.cursor, 300), pageSize: PAGE });
    const path = 'shopifyInbox/' + ownerUid;
    const results = await Promise.all(page.orders.map(async function(item) {
      const order = sanitizeOrder(item.order);
      if (!order.id) return 'skipped';
      const id = 'o' + order.id;
      if (await getDocument(path, id)) return 'skipped';
      await upsertDocument(path, id, { status: 'new', imported: true, history: item.history, tracking: item.tracking, shop: shop, locationId: data.locationId || '', order: order, receivedAt: new Date().toISOString() }, false);
      return 'imported';
    }));
    const imported = results.filter(function(r) { return r === 'imported'; }).length;
    const skipped = results.length - imported;
    log.info('past orders imported', { ownerUid, shop, imported, skipped });
    return reply(event, 200, { ok: true, imported: imported, skipped: skipped, hasMore: page.hasMore, cursor: page.cursor });
  } catch (err) {
    if (err.code !== 'no_access' && (!err.statusCode || err.statusCode >= 500)) log.error('past orders import failed', err);
    return reply(event, err.statusCode || (err.code === 'no_access' ? 409 : 502), { ok: false, code: err.code, error: err.message || 'Could not import past orders.' });
  }
};
