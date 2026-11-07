// What the Sales push settings page (Restaurant (OGF) businesses) calls: status, saving the client secret, test connection, preview, send now.
// The business is the signed-in caller's (or its owner's, for staff). Only a business whose type is Restaurant (OGF) may use it, so the function
// cannot be used by other businesses to send requests anywhere.
const { guard, reply } = require('../lib/security');
const lib = require('../lib/appwrite');
const push = require('../lib/ogf-push');
const log = require('../lib/log').createLogger('ogf-push');

const WHY = {
  disabled: 'Switch the sales push on first.',
  'not-ogf': 'The sales push is only for Restaurant (OGF) businesses.',
  'not-set-up': 'The sales push is not fully set up yet.',
  busy: 'A send is already running. Try again in a minute.',
  'no-workspace': 'The business has not synced yet.'
};

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'ogf-push', methods: ['POST'], limit: 40, windowMs: 600000, maxBody: 20000 });
  if (blocked) return blocked;
  try {
    const user = await lib.getUserFromEvent(event);
    if (!user || !user.id) return reply(event, 401, { ok: false, error: 'Sign in first.' });
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ }
    const profile = await lib.getDocument('users', user.id).catch(function() { return null; });
    const uid = lib.clean(profile && profile.data && profile.data.ownerUid, 240) || user.id;
    const deps = push.realDeps(lib);
    const payload = await deps.getPayload(uid);
    if (!payload || (payload.settings || {}).businessType !== 'ogf') return reply(event, 403, { ok: false, error: WHY['not-ogf'] });
    await push.register(deps, uid); // the scheduled run finds the business through this
    const action = String(body.action || 'status');
    if (action === 'status') return reply(event, 200, Object.assign({ ok: true }, await push.statusFor(uid, deps)));
    if (action === 'saveSecret') { const r = await push.saveSecret(uid, deps, body.registerId, body.secret); return reply(event, r.error ? 400 : 200, r.error ? { ok: false, error: r.error } : { ok: true }); }
    if (action === 'deleteSecret') return reply(event, 200, await push.deleteSecret(uid, deps, body.registerId));
    if (action === 'test') return reply(event, 200, await push.testConnection(uid, deps, body.registerId));
    if (action === 'preview') return reply(event, 200, Object.assign({ ok: true }, await push.previewFor(uid, deps, Number(body.count) || 3)));
    if (action === 'retryHeld') return reply(event, 200, await push.retryHeld(uid, deps));
    if (action === 'sendNow') {
      const r = await push.runPush(uid, { deps, trigger: 'manual' });
      log.info('manual push', { skipped: r.skipped || '', sent: r.sent || 0 });
      if (r.skipped) return reply(event, 200, { ok: false, message: (r.problems && r.problems[0]) || WHY[r.skipped] || 'Nothing was sent.' });
      return reply(event, 200, { ok: true, sent: r.sent, status: r.status, message: r.message, batches: r.batches });
    }
    return reply(event, 400, { ok: false, error: 'Unknown action.' });
  } catch (error) {
    log.error('ogf push request failed', error);
    return reply(event, 500, { ok: false, error: 'Could not complete the request.' });
  }
};
