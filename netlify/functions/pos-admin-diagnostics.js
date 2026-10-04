// Admin side of POS diagnostics: request a device log, see its status, download it once.
// Auth is identical to pos-admin-data (admin HS256 token + active admin record).
const { guard, reply } = require('../lib/security');
const { isAdminEmail, verifyToken } = require('../lib/admin-auth');
const { getAdmin, audit } = require('../lib/admin-store');
const store = require('../lib/diagnostics-store');
const log = require('../lib/log').createLogger('pos-admin-diagnostics');

async function verifyAdmin(event) {
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
  const match = String(auth).match(/^Bearer\s+(.+)$/i);
  const deny = function(status, reason, message) { log.warn('admin auth denied', { reason }); const err = new Error(message); err.statusCode = status; return err; };
  if (!match) throw deny(401, 'missing-token', 'POS admin sign-in is required.');
  const claims = verifyToken(match[1]);
  if (!claims) throw deny(401, 'invalid-or-expired-token', 'Your administrator session has expired. Please sign in again.');
  if (!isAdminEmail(claims.email)) throw deny(403, 'not-an-admin-address', 'This account is not authorized for the POS developer portal.');
  const record = await getAdmin(String(claims.sub || ''));
  if (!record || !record.active || record.email !== String(claims.email).toLowerCase()) throw deny(403, 'admin-inactive', 'This administrator account is not active.');
  return { id: record.id, email: record.email };
}

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'pos-admin-diagnostics', methods: ['POST'], limit: 120, windowMs: 600000 });
  if (blocked) return blocked;
  try {
    const admin = await verifyAdmin(event);
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ }
    const uid = store.safeUid(body.userId);
    if (!uid) return reply(event, 400, { ok: false, error: 'A valid account id is required.' });
    const action = String(body.action || '');

    if (action === 'status') return reply(event, 200, Object.assign({ ok: true }, await store.status(uid)));
    if (action === 'request') {
      await store.clearLog(uid);
      const r = await store.setRequest(uid, admin.email);
      await audit({ adminEmail: admin.email, action: 'diagnostics.request', target: uid });
      log.info('log requested', { uid, by: admin.email });
      return reply(event, 200, { ok: true, state: 'waiting', requestedAt: r.requestedAt });
    }
    if (action === 'cancel') { await store.clearRequest(uid); return reply(event, 200, { ok: true, state: 'none' }); }
    if (action === 'download') {
      const got = await store.getLog(uid);
      if (!got) return reply(event, 404, { ok: false, error: 'No log has been received (it may have expired).' });
      await store.clearLog(uid);
      await audit({ adminEmail: admin.email, action: 'diagnostics.download', target: uid, detail: got.size + ' bytes' });
      log.info('log downloaded', { uid, by: admin.email, size: got.size });
      return reply(event, 200, { ok: true, filename: 'pos-log-' + uid + '-' + new Date().toISOString().slice(0, 10) + '.log', text: got.text });
    }
    return reply(event, 400, { ok: false, error: 'Unknown action.' });
  } catch (err) {
    if (!err.statusCode || err.statusCode >= 500) log.error('diagnostics admin action failed', err);
    return reply(event, err.statusCode || 500, { ok: false, error: err.statusCode ? err.message : 'Could not complete the request.' });
  }
};
