// POS device side of diagnostics: cheap `check` for a pending request, and `upload` of the log text.
const { guard, reply } = require('../lib/security');
const { getUserFromEvent, getDocument, clean } = require('../lib/appwrite');
const store = require('../lib/diagnostics-store');
const log = require('../lib/log').createLogger('pos-diagnostics');

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'pos-diagnostics', methods: ['GET', 'POST'], limit: 60, windowMs: 60000, maxBody: 2000000 });
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

    const pending = await store.getRequest(ownerUid);
    if (action === 'check') return reply(event, 200, { ok: true, requested: !!pending });
    if (action === 'upload') {
      if (event.httpMethod !== 'POST') return reply(event, 405, { ok: false, error: 'Method not allowed' });
      if (!pending) return reply(event, 409, { ok: false, error: 'No log has been requested.' });
      const text = store.capText(body.text);
      if (!text) return reply(event, 400, { ok: false, error: 'Log text is required.' });
      await store.putLog(ownerUid, text);
      await store.clearRequest(ownerUid);
      log.info('log uploaded', { ownerUid, by: user.id, size: text.length });
      return reply(event, 200, { ok: true });
    }
    return reply(event, 400, { ok: false, error: 'Unknown action.' });
  } catch (err) {
    if (!err.statusCode || err.statusCode >= 500) log.error('diagnostics device action failed', err);
    return reply(event, err.statusCode || 500, { ok: false, error: err.statusCode ? err.message : 'Could not complete the request.' });
  }
};
