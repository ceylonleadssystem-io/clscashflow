'use strict';

// The POS collects its business's new Shopify orders here. `pull` lists them (and cancellations) for one location, `ack` marks the ones
// a POS has saved, so no other device takes them again.
const { guard, reply } = require('../lib/security');
const { getUserFromEvent, getDocument, upsertDocument, queryDocuments, clean } = require('../lib/appwrite');
const log = require('../lib/log').createLogger('shopify-inbox');

const MAX_ROWS = 25;

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'shopify-inbox', methods: ['POST'], limit: 120, windowMs: 60000, maxBody: 4000 });
  if (blocked) return blocked;
  try {
    const user = await getUserFromEvent(event);
    if (!user) return reply(event, 401, { ok: false, error: 'Please sign in again.' });
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ }
    const profile = await getDocument('users', user.id);
    const ownerUid = clean((profile && profile.data && profile.data.ownerUid) || user.id, 240);
    const path = 'shopifyInbox/' + ownerUid;
    const action = String(body.action || 'pull');

    if (action === 'pull') {
      const locationId = clean(body.locationId, 80);
      const rows = await queryDocuments(path, { fetchLimit: 500 });
      const mine = rows.filter(function(r) { return !locationId || !r.data.locationId || r.data.locationId === locationId; });
      const fresh = mine.filter(function(r) { return r.data.status === 'new' && !r.data.cancelled; }).sort(function(a, b) { return String(a.data.receivedAt).localeCompare(String(b.data.receivedAt)); }).slice(0, MAX_ROWS);
      const cancelled = mine.filter(function(r) { return r.data.cancelled && r.data.cancelNotified === false; }).slice(0, MAX_ROWS);
      return reply(event, 200, { ok: true, orders: fresh.map(function(r) { return { id: r.id, shop: r.data.shop, receivedAt: r.data.receivedAt, order: r.data.order }; }), cancelled: cancelled.map(function(r) { return { id: r.id, name: r.data.order && r.data.order.name }; }) });
    }
    if (action === 'ack') {
      const ids = (Array.isArray(body.ids) ? body.ids : []).map(function(id) { return clean(id, 60); }).filter(function(id) { return /^o[0-9]{1,40}$/.test(id); }).slice(0, MAX_ROWS);
      const cancelIds = (Array.isArray(body.cancelledIds) ? body.cancelledIds : []).map(function(id) { return clean(id, 60); }).filter(function(id) { return /^o[0-9]{1,40}$/.test(id); }).slice(0, MAX_ROWS);
      const now = new Date().toISOString();
      for (const id of ids) await upsertDocument(path, id, { status: 'taken', takenAt: now, takenBy: user.id }, true);
      for (const id of cancelIds) await upsertDocument(path, id, { cancelNotified: true }, true);
      log.info('orders taken', { ownerUid, taken: ids.length, cancelled: cancelIds.length });
      return reply(event, 200, { ok: true });
    }
    return reply(event, 400, { ok: false, error: 'Unknown action.' });
  } catch (err) {
    if (!err.statusCode || err.statusCode >= 500) log.error('shopify inbox failed', err);
    return reply(event, err.statusCode || 500, { ok: false, error: err.statusCode ? err.message : 'Could not check online orders right now.' });
  }
};
