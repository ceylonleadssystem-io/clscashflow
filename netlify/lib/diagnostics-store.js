'use strict';

// Signalling store for POS diagnostics. Holds ONLY a tiny, short-lived WebRTC handshake (one SDP offer and
// one SDP answer, no log data) per account in `diag_signals` of the admin database. Document id `s_<uid>`,
// one per account (a new request overwrites it), 10-minute TTL checked lazily on every read.

const { Databases } = require('node-appwrite');
const { serverClient } = require('./appwrite');
const { ADMIN_DATABASE_ID } = require('./admin-store');

const COLLECTION = 'diag_signals';
const TTL_MS = 10 * 60 * 1000;
const MAX_SDP = 8000;

// Document ids are <= 36 chars: "s_" + at most 34 id chars. Returns '' for anything unusable.
function safeUid(uid) {
  const v = String(uid == null ? '' : uid).trim();
  return /^[A-Za-z0-9_-]{1,34}$/.test(v) ? v : '';
}
const safeRequestId = (id) => { const v = String(id == null ? '' : id).trim(); return /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : ''; };
const docId = (uid) => 's_' + safeUid(uid);

function expired(iso, now) {
  const t = Date.parse(iso);
  return !Number.isFinite(t) || (now == null ? Date.now() : now) - t > TTL_MS;
}

function badRequest(message) { const e = new Error(message); e.statusCode = 400; return e; }
// Throws 400 unless `sdp` is a non-empty string within the cap.
function checkSdp(sdp) {
  if (typeof sdp !== 'string' || !sdp) throw badRequest('A connection description is required.');
  if (sdp.length > MAX_SDP) throw badRequest('The connection description is too large.');
  return sdp;
}

const db = () => new Databases(serverClient());
const missingDoc = (e) => e && e.code === 404 && !/collection|database/i.test(String(e.type || ''));
function unavailable(e) {
  const err = new Error('Diagnostics signalling is not available. Run node scripts/setup-admin-db.mjs once to create the "' + COLLECTION + '" collection.');
  err.statusCode = 503; err.cause = e;
  return err;
}
function wrap(e) { if (e && e.statusCode) return e; if (e && (e.code === 404 || e.code === 401 || e.code === 403)) return unavailable(e); return e; }

async function remove(uid) {
  try { await db().deleteDocument(ADMIN_DATABASE_ID, COLLECTION, docId(uid)); } catch (e) { if (!missingDoc(e)) throw wrap(e); }
}

// The live signal {uid, requestId, offer, answer, createdAt} or null. Expired ones are deleted on the way.
async function get(uid) {
  let doc;
  try { doc = await db().getDocument(ADMIN_DATABASE_ID, COLLECTION, docId(uid)); } catch (e) { if (missingDoc(e)) return null; throw wrap(e); }
  if (expired(doc.createdAt)) { await remove(uid); return null; }
  return { uid: doc.uid, requestId: doc.requestId, offer: doc.offer || '', answer: doc.answer || '', createdAt: doc.createdAt };
}

// Creates (or overwrites) the account's signal with a fresh offer.
async function putOffer(uid, requestId, offer) {
  const data = { uid, requestId, offer: checkSdp(offer), answer: '', createdAt: new Date().toISOString() };
  try {
    await db().updateDocument(ADMIN_DATABASE_ID, COLLECTION, docId(uid), data);
  } catch (e) {
    if (!missingDoc(e)) throw wrap(e);
    try { await db().createDocument(ADMIN_DATABASE_ID, COLLECTION, docId(uid), data, []); } catch (e2) { throw wrap(e2); }
  }
  return data;
}

// Accepts an answer only while a matching offer is pending and unanswered. Returns true when stored.
async function putAnswer(uid, requestId, answer) {
  checkSdp(answer);
  const cur = await get(uid);
  if (!cur || !cur.offer || cur.answer || cur.requestId !== requestId) return false;
  try { await db().updateDocument(ADMIN_DATABASE_ID, COLLECTION, docId(uid), { answer }); } catch (e) { throw wrap(e); }
  return true;
}

module.exports = { COLLECTION, TTL_MS, MAX_SDP, safeUid, safeRequestId, docId, expired, checkSdp, get, putOffer, putAnswer, remove };
