// POS device side of diagnostics signalling: `check` for a pending WebRTC offer, `answer` to reply to it.
// Only the connection handshake passes here; the log itself travels browser to browser.
const { guard, reply } = require('../lib/security');
const { getUserFromEvent, getDocument, clean } = require('../lib/appwrite');
const store = require('../lib/diagnostics-store');
const log = require('../lib/log').createLogger('pos-diagnostics');

exports.handler = async function handler(event) {
  // The device polls `check` every 15 s (4/min), so 120/min per IP leaves room for shared networks.
  const blocked = guard(event, { name: 'pos-diagnostics', methods: ['GET', 'POST'], limit: 120, windowMs: 60000, maxBody: 20000 });
  if (blocked) return blocked;
  try {
    const user = await getUserFromEvent(event);
    if (!user) return reply(event, 401, { ok: false, error: 'Please sign in again.' });
    let body = {};
    if (event.httpMethod === 'POST') { try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ } }
    const action = String((event.queryStringParameters || {}).action || body.action || 'check');
    const profileDoc = await getDocument('users', user.id);
    const ownerUid = store.safeUid(clean((profileDoc && profileDoc.data && profileDoc.data.ownerUid) || user.id, 240));
    if (!ownerUid) return reply(event, 400, { ok: false, error: 'Invalid account.' });

    if (action === 'check') {
      const sig = await store.get(ownerUid);
      if (!sig || !sig.offer || sig.answer) return reply(event, 200, { ok: true, requested: false });
      return reply(event, 200, { ok: true, requested: true, requestId: sig.requestId, offer: sig.offer });
    }
    if (action === 'answer') {
      if (event.httpMethod !== 'POST') return reply(event, 405, { ok: false, error: 'Method not allowed' });
      const requestId = store.safeRequestId(body.requestId);
      if (!requestId) return reply(event, 400, { ok: false, error: 'A valid request id is required.' });
      const stored = await store.putAnswer(ownerUid, requestId, body.answer);
      if (!stored) return reply(event, 409, { ok: false, error: 'No matching log request is pending.' });
      log.info('answer stored', { ownerUid, by: user.id });
      return reply(event, 200, { ok: true });
    }
    return reply(event, 400, { ok: false, error: 'Unknown action.' });
  } catch (err) {
    if (!err.statusCode || err.statusCode >= 500) log.error('diagnostics device action failed', err);
    return reply(event, err.statusCode || 500, { ok: false, error: err.statusCode ? err.message : 'Could not complete the request.' });
  }
};
