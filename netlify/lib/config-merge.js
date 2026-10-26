'use strict';

// Applies a configuration change sent from the admin portal's "assist" copy of a client's POS onto the client's real workspace
// payload, without touching sales, customers, staff, stock levels or anything else that changes while the client is trading.
//
//   cfg = {
//     rows:       { products | modifiers | subcategories | locations: [ { id, ...fields } ] }   new rows in full, existing rows as a patch of the changed fields
//     deleted:    { products | modifiers | subcategories: [ids] }
//     categories: { add: [names], remove: [names] }
//     settings:   { key: value }                                                                 only keys the business may change (see BLOCKED_SETTINGS)
//   }
//
// Every row and setting written gets the current time as its timestamp, so the client's own sync (last writer wins per row and per
// setting) takes the change on its next pull. A mirror of the sending side lives in pos-react/src/domain/assistConfig.js.

const ROW_TYPES = ['products', 'modifiers', 'subcategories', 'locations'];
const DELETE_TYPES = ['products', 'modifiers', 'subcategories'];
const MAX_ROWS = 5000;
// settings that belong to a device, to the platform or to the account, never to the menu and shop configuration
const BLOCKED_SETTINGS = /^(ownerAuth|subscription|features|locationFeatures|plan|welcome|businessCategory|support.*|gm.*|dev.*|usbPrinter|barcodePrinter|usbScanner|ceylo.*|invoice.*|onboardingComplete)$/;

const text = (v, max) => String(v == null ? '' : v).slice(0, max);
const plain = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const idOf = (row) => text(row && row.id, 100);

/** A safe copy of what the sender asked for: known sections only, bounded sizes. Throws an Error with a message for the admin. */
function cleanConfig(cfg) {
  cfg = plain(cfg);
  const out = { rows: {}, deleted: {}, categories: { add: [], remove: [] }, settings: {} };
  for (const type of ROW_TYPES) {
    const list = Array.isArray(plain(cfg.rows)[type]) ? cfg.rows[type] : [];
    if (list.length > MAX_ROWS) throw new Error('Too many ' + type + ' in one change.');
    out.rows[type] = list.filter((r) => r && typeof r === 'object' && idOf(r)).map((r) => Object.assign({}, r, { id: idOf(r) }));
  }
  for (const type of DELETE_TYPES) {
    const list = Array.isArray(plain(cfg.deleted)[type]) ? cfg.deleted[type] : [];
    out.deleted[type] = list.slice(0, MAX_ROWS).map((id) => text(id, 100)).filter(Boolean);
  }
  const cats = plain(cfg.categories);
  out.categories.add = (Array.isArray(cats.add) ? cats.add : []).slice(0, 1000).map((n) => text(n, 100).trim()).filter(Boolean);
  out.categories.remove = (Array.isArray(cats.remove) ? cats.remove : []).slice(0, 1000).map((n) => text(n, 100).trim()).filter(Boolean);
  for (const key of Object.keys(plain(cfg.settings))) {
    if (/^[A-Za-z0-9_.-]{1,80}$/.test(key) && !BLOCKED_SETTINGS.test(key)) out.settings[key] = cfg.settings[key];
  }
  return out;
}

/** What a cleaned change would do, for the audit log and the admin's confirmation. */
function summarize(cfg) {
  const rows = ROW_TYPES.reduce((n, t) => n + cfg.rows[t].length, 0);
  const deleted = DELETE_TYPES.reduce((n, t) => n + cfg.deleted[t].length, 0);
  return { rows, deleted, categories: cfg.categories.add.length + cfg.categories.remove.length, settings: Object.keys(cfg.settings).length };
}

/** Returns the payload with the change applied (the input is not modified). `now` is an ISO time. */
function applyConfig(payload, cfg, now) {
  const out = Object.assign({}, payload);
  const deletedIds = Object.assign({}, plain(payload.deletedIds));
  for (const type of ROW_TYPES) {
    const byId = new Map((Array.isArray(payload[type]) ? payload[type] : []).map((r) => [String(r.id), r]));
    for (const row of cfg.rows[type]) {
      const old = byId.get(row.id);
      byId.set(row.id, Object.assign({}, old || { createdAt: now }, row, { id: row.id, updatedAt: now }));
    }
    for (const id of cfg.deleted[type] || []) {
      byId.delete(id);
      deletedIds[type] = Array.from(new Set([].concat(deletedIds[type] || [], [id]).map(String)));
    }
    out[type] = Array.from(byId.values());
  }
  const removed = new Set(cfg.categories.remove.map((n) => n.toLowerCase()));
  const categories = (Array.isArray(payload.categories) ? payload.categories : []).filter((n) => !removed.has(String(n).trim().toLowerCase()));
  for (const name of cfg.categories.add) if (!categories.some((n) => String(n).trim().toLowerCase() === name.toLowerCase())) categories.push(name);
  out.categories = categories.sort();
  deletedIds.categories = Array.from(new Set([].concat(deletedIds.categories || [], cfg.categories.remove.map((n) => n.toLowerCase())).map(String)));
  for (const name of cfg.categories.add) deletedIds.categories = deletedIds.categories.filter((n) => n !== name.toLowerCase());
  out.deletedIds = deletedIds;
  const settings = Object.assign({}, plain(payload.settings), cfg.settings);
  const times = Object.assign({}, plain(plain(payload.syncMeta).settings));
  for (const key of Object.keys(cfg.settings)) times[key] = now;
  out.settings = settings;
  out.syncMeta = Object.assign({}, plain(payload.syncMeta), { settings: times, updatedAt: now });
  return out;
}

module.exports = { ROW_TYPES, DELETE_TYPES, BLOCKED_SETTINGS, cleanConfig, summarize, applyConfig };
