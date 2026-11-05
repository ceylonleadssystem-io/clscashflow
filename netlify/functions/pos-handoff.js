// One-time sign-in token for the signed-in caller only, so a business can be moved between the POS addresses (main and Automobile) without
// signing in twice. The token is for the caller's own account, lives 60 seconds and works once; the other address redeems it from the URL fragment.
const { guard, reply } = require('../lib/security');
const lib = require('../lib/appwrite');
const log = require('../lib/log').createLogger('pos-handoff');

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'pos-handoff', methods: ['POST'], limit: 10, windowMs: 60000, maxBody: 1000 });
  if (blocked) return blocked;
  try {
    const user = await lib.getUserFromEvent(event);
    if (!user || !user.id) return reply(event, 401, { ok: false, error: 'Sign in first.' });
    const token = await lib.users().createToken(user.id, 64, 60);
    log.info('handoff token issued');
    return reply(event, 200, { ok: true, userId: user.id, secret: token.secret });
  } catch (err) {
    log.error('handoff failed', err);
    return reply(event, 500, { ok: false, error: 'Could not complete the request.' });
  }
};
