'use strict';

// POS diagnostics exchange kept in Appwrite Storage (never the database): per account a tiny
// request marker `r_<uid>` and, once the POS device answers, the log text `l_<uid>`.
// The bucket has no client permissions, so only the server API key can touch it.

const { Storage } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');
const { serverClient } = require('./appwrite');

const BUCKET_ID = process.env.APPWRITE_DIAGNOSTICS_BUCKET_ID || 'pos_diagnostics';
const EXPIRY_MS = 24 * 3600 * 1000; // unanswered request / undownloaded log lifetime
const MAX_LOG_CHARS = 1500000;

// Appwrite file ids: <= 36 chars of [a-zA-Z0-9._-]. Returns '' for anything unusable.
function safeUid(uid) {
  const v = String(uid == null ? '' : uid).trim();
  return /^[a-zA-Z0-9._-]{1,34}$/.test(v) ? v : '';
}
const requestId = (uid) => 'r_' + safeUid(uid);
const logId = (uid) => 'l_' + safeUid(uid);

function expired(iso, now) {
  const t = Date.parse(iso);
  return !Number.isFinite(t) || (now == null ? Date.now() : now) - t > EXPIRY_MS;
}

// Text only, capped; when too long the newest lines (the tail) are kept.
function capText(text, max) {
  text = typeof text === 'string' ? text : '';
  max = max || MAX_LOG_CHARS;
  return text.length > max ? text.slice(text.length - max) : text;
}

function storage() { return new Storage(serverClient()); }
const isMissing = (e) => e && (e.code === 404 || e.type === 'storage_file_not_found');

function unavailable(e) {
  const err = new Error('Diagnostics storage is not available. Create the "' + BUCKET_ID + '" bucket (node scripts/setup-admin-db.mjs).');
  err.statusCode = 503; err.cause = e;
  return err;
}
// Bucket missing/misconfigured (404 on bucket, 401/403) -> clear 503 instead of a crash.
function wrap(e) { if (e && e.statusCode === 503) return e; if (e && (e.code === 404 || e.code === 401 || e.code === 403 || e.type === 'storage_bucket_not_found')) return unavailable(e); return e; }

async function remove(id) {
  try { await storage().deleteFile(BUCKET_ID, id); } catch (e) { if (!isMissing(e)) throw wrap(e); }
}
async function put(id, text, name) {
  await remove(id);
  try { await storage().createFile(BUCKET_ID, id, InputFile.fromBuffer(Buffer.from(text, 'utf8'), name)); } catch (e) { throw wrap(e); }
}
async function read(id) {
  try {
    const st = storage();
    const meta = await st.getFile(BUCKET_ID, id);
    const buf = await st.getFileDownload(BUCKET_ID, id);
    return { createdAt: meta.$createdAt, size: meta.sizeOriginal, text: Buffer.from(buf).toString('utf8') };
  } catch (e) { if (isMissing(e)) return null; throw wrap(e); }
}

// Pending request marker, or null. Expired markers are deleted on the way.
async function getRequest(uid) {
  const got = await read(requestId(uid));
  if (!got) return null;
  let data = {};
  try { data = JSON.parse(got.text); } catch (_) { /* treated as expired below */ }
  if (expired(data.requestedAt)) { await remove(requestId(uid)); return null; }
  return { requestedAt: data.requestedAt, requestedBy: data.requestedBy || '' };
}
async function setRequest(uid, by) {
  const data = { requestedAt: new Date().toISOString(), requestedBy: String(by || '').slice(0, 254) };
  await put(requestId(uid), JSON.stringify(data), 'request.json');
  return data;
}
const clearRequest = (uid) => remove(requestId(uid));

async function putLog(uid, text) { await put(logId(uid), capText(text), 'log.txt'); }
// Received log {receivedAt, size, text} or null; expired logs are deleted on the way.
async function getLog(uid) {
  const got = await read(logId(uid));
  if (!got) return null;
  if (expired(got.createdAt)) { await remove(logId(uid)); return null; }
  return { receivedAt: got.createdAt, size: got.size, text: got.text };
}
// Cheap status for the admin tab: reads metadata only for the log, marker content for the request.
async function status(uid) {
  const log = await (async () => {
    try {
      const meta = await storage().getFile(BUCKET_ID, logId(uid));
      if (expired(meta.$createdAt)) { await remove(logId(uid)); return null; }
      return { receivedAt: meta.$createdAt, size: meta.sizeOriginal };
    } catch (e) { if (isMissing(e)) return null; throw wrap(e); }
  })();
  if (log) return { state: 'received', receivedAt: log.receivedAt, size: log.size };
  const req = await getRequest(uid);
  return req ? { state: 'waiting', requestedAt: req.requestedAt } : { state: 'none' };
}
const clearLog = (uid) => remove(logId(uid));

module.exports = { BUCKET_ID, EXPIRY_MS, MAX_LOG_CHARS, safeUid, requestId, logId, expired, capText, getRequest, setRequest, clearRequest, putLog, getLog, clearLog, status };
