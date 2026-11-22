// Live support sessions (see lib/support-session.js). Two kinds of caller use this one function:
//   the client (a signed-in POS user): create a code, pass the connection offer, read the answer, end the session;
//   the agent (a signed-in administrator of the admin portal): join with the code, read the offer, pass the answer, end the session.
// Everything that matters about who did what is written to the admin audit log.
const { guard, reply } = require('../lib/security');
const lib = require('../lib/appwrite');
const { verifyToken, isAdminEmail } = require('../lib/admin-auth');
const { getAdmin, audit } = require('../lib/admin-store');
const S = require('../lib/support-session');
const log = require('../lib/log').createLogger('support-session');

const limiter = S.createAttemptLimiter(5, 10 * 60 * 1000);

async function verifyAdmin(event) {
  const match = String(event.headers.authorization || event.headers.Authorization || '').match(/^Bearer\s+(.+)$/i);
  const deny = function(status, message) { const err = new Error(message); err.statusCode = status; return err; };
  if (!match) throw deny(401, 'Administrator sign-in is required.');
  const claims = verifyToken(match[1]);
  if (!claims) throw deny(401, 'Your administrator session has expired. Please sign in again.');
  if (!isAdminEmail(claims.email)) throw deny(403, 'This account is not authorized for live support.');
  const record = await getAdmin(String(claims.sub || ''));
  if (!record || !record.active || record.email !== String(claims.email).toLowerCase()) throw deny(403, 'This administrator account is not active.');
  return { id: record.id, email: record.email };
}

const load = async function(code) {
  const doc = S.isCode(code) ? await lib.getDocument(S.COLLECTION, S.codeKey(code)) : null;
  return doc && doc.data ? S.settle(doc.data, Date.now()) : null;
};
const save = function(code, session) { return lib.upsertDocument(S.COLLECTION, S.codeKey(code), session, false); };
const missing = function() { const e = new Error('This support session is not available.'); e.statusCode = 404; return e; };

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'support-session', methods: ['POST'], limit: 150, windowMs: 60000, maxBody: 70000 });
  if (blocked) return blocked;
  try {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ }
    const action = String(body.action || '');
    const code = String(body.code || '');
    const now = Date.now();

    // ---------------------------------------------------------------- the agent
    if (action === 'join' || action === 'agentPoll' || action === 'answer' || action === 'agentEnd') {
      const admin = await verifyAdmin(event);
      if (action === 'join') {
        if (limiter.blocked(admin.email, now)) return reply(event, 429, { ok: false, error: 'Too many wrong codes. Try again in a few minutes.' });
        const session = await load(code);
        const problem = S.joinProblem(session, now);
        if (problem) {
          limiter.fail(admin.email, now);
          log.warn('support code not accepted', { admin: admin.email });
          await audit({ adminEmail: admin.email, action: 'support-session-denied', target: '', detail: 'A support code was not accepted' });
          return reply(event, 400, { ok: false, error: problem });
        }
        limiter.clear(admin.email);
        const joined = S.join(session, admin.email, now);
        await save(code, joined);
        await audit({ adminEmail: admin.email, action: 'support-session-join', target: joined.ownerUid, detail: 'Joined a live support session of ' + (joined.business || 'a business') });
        return reply(event, 200, Object.assign({ ok: true }, S.agentView(joined)));
      }
      const session = await load(code);
      if (!session || session.sid !== body.sid || session.agent !== admin.email) throw missing();
      if (action === 'agentPoll') return reply(event, 200, Object.assign({ ok: true }, S.agentView(session)));
      if (action === 'answer') {
        const sdp = S.cleanSdp(body.sdp);
        if (!sdp || !S.running(session, now) || !session.offer) return reply(event, 400, { ok: false, error: 'The connection details were not accepted.' });
        await save(code, Object.assign({}, session, { answer: sdp, state: 'connected' }));
        return reply(event, 200, { ok: true });
      }
      await save(code, Object.assign({}, session, { state: 'ended', reason: 'agent-ended' }));
      await audit({ adminEmail: admin.email, action: 'support-session-end', target: session.ownerUid, detail: 'Ended a live support session of ' + (session.business || 'a business') });
      return reply(event, 200, { ok: true });
    }

    // --------------------------------------------------------------- the client
    const user = await lib.getUserFromEvent(event);
    if (!user || !user.id) return reply(event, 401, { ok: false, error: 'Please sign in again.' });
    if (action === 'create') {
      const profile = await lib.getDocument('users', user.id);
      const data = profile && profile.data ? profile.data : {};
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const fresh = S.generateCode();
        const existing = await load(fresh);
        if (existing && existing.state !== 'ended') continue; // a code in use: pick another
        const session = S.newSession({ id: user.id, ownerUid: data.ownerUid }, now, { business: data.posBusinessName || data.bizName || '' });
        await save(fresh, session);
        log.info('support code created');
        return reply(event, 200, { ok: true, code: fresh, sid: session.sid, expiresAt: session.expiresAt });
      }
      return reply(event, 503, { ok: false, error: 'Could not create a code. Please try again.' });
    }
    const session = await load(code);
    if (!session || session.sid !== body.sid || session.userId !== user.id) throw missing();
    if (action === 'poll') return reply(event, 200, Object.assign({ ok: true }, S.clientView(session)));
    if (action === 'offer') {
      const sdp = S.cleanSdp(body.sdp);
      if (!sdp || !S.running(session, now)) return reply(event, 400, { ok: false, error: 'The connection details were not accepted.' });
      await save(code, Object.assign({}, session, { offer: sdp }));
      return reply(event, 200, { ok: true });
    }
    if (action === 'end') {
      if (session.state !== 'ended') {
        await save(code, Object.assign({}, session, { state: 'ended', reason: 'client-ended' }));
        if (session.agent) await audit({ adminEmail: session.agent, action: 'support-session-end', target: session.ownerUid, detail: 'The client ended the live support session of ' + (session.business || 'a business') });
      }
      return reply(event, 200, { ok: true });
    }
    return reply(event, 400, { ok: false, error: 'Unknown action.' });
  } catch (err) {
    if (!err.statusCode || err.statusCode >= 500) log.error('support session failed', err);
    return reply(event, err.statusCode || 500, { ok: false, error: err.statusCode ? err.message : 'Could not complete the request.' });
  }
};
