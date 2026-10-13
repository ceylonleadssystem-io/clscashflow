'use strict';

// Handshake store for pairing a POS with a Kitchen Display (KDS). Holds ONLY a tiny WebRTC offer/answer per key for
// at most 10 minutes (checked on every read). Orders never come here: they travel browser to browser on the local Wi-Fi.
// Key = a 6-digit pairing code (first pairing) or the 24-hex pair id (reconnecting). Document id `k_<key>`.

const { Databases } = require('node-appwrite');
const { serverClient } = require('./appwrite');
const { ADMIN_DATABASE_ID } = require('./admin-store');

const COLLECTION = 'kds_pairs';
const TTL_MS = 10 * 60 * 1000;
const MAX_SDP = 8000;

const isCode = (k) => /^\d{6}$/.test(k);
// Returns the key when it is a 6-digit code or a 24-hex pair id, otherwise ''.
function safeKey(key) { const v = String(key == null ? '' : key).trim(); return isCode(v) || /^[a-f0-9]{24}$/.test(v) ? v : ''; }
const docId = (key) => 'k_' + key;
const expired = (iso) => { const t = Date.parse(iso); return !Number.isFinite(t) || Date.now() - t > TTL_MS; };
function bad(message, code) { const e = new Error(message); e.statusCode = code || 400; return e; }
function checkSdp(sdp) {
  if (typeof sdp !== 'string' || !sdp) throw bad('A connection description is required.');
  if (sdp.length > MAX_SDP) throw bad('The connection description is too large.');
  return sdp;
}

const db = () => new Databases(serverClient());
const missingDoc = (e) => e && e.code === 404 && !/collection|database/i.test(String(e.type || ''));
function wrap(e) {
  if (e && e.statusCode) return e;
  if (e && (e.code === 404 || e.code === 401 || e.code === 403)) return bad('KDS pairing is not available. Run node scripts/setup-admin-db.mjs once to create the "' + COLLECTION + '" collection.', 503);
  return e;
}

async function remove(key) {
  try { await db().deleteDocument(ADMIN_DATABASE_ID, COLLECTION, docId(key)); } catch (e) { if (!missingDoc(e)) throw wrap(e); }
}

// {key, offer, answer, pairId, createdAt} or null (expired ones are deleted on the way).
async function get(key) {
  let doc;
  try { doc = await db().getDocument(ADMIN_DATABASE_ID, COLLECTION, docId(key)); } catch (e) { if (missingDoc(e)) return null; throw wrap(e); }
  if (expired(doc.createdAt)) { await remove(key); return null; }
  return { key: doc.key, offer: doc.offer || '', answer: doc.answer || '', pairId: doc.pairId || '', createdAt: doc.createdAt };
}

// The KDS publishes its offer. A live pairing code cannot be overwritten (nobody can hijack it); a pair id is a secret, so it can be refreshed.
async function putOffer(key, offer, pairId) {
  checkSdp(offer);
  const cur = await get(key);
  if (cur && isCode(key)) throw bad('That pairing code is already in use.', 409);
  const data = { key, offer, answer: '', pairId: /^[a-f0-9]{24}$/.test(pairId || '') ? pairId : '', createdAt: new Date().toISOString() };
  try {
    if (cur) await db().updateDocument(ADMIN_DATABASE_ID, COLLECTION, docId(key), data);
    else await db().createDocument(ADMIN_DATABASE_ID, COLLECTION, docId(key), data, []);
  } catch (e) { throw wrap(e); }
}

// The POS answers a pending, unanswered offer. Returns true when stored.
async function putAnswer(key, answer) {
  checkSdp(answer);
  const cur = await get(key);
  if (!cur || !cur.offer || cur.answer) return false;
  try { await db().updateDocument(ADMIN_DATABASE_ID, COLLECTION, docId(key), { answer }); } catch (e) { throw wrap(e); }
  return true;
}

module.exports = { COLLECTION, TTL_MS, MAX_SDP, safeKey, isCode, docId, get, putOffer, putAnswer, remove };
