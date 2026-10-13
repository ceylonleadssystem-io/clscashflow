// Pairing handshake between a POS and a Kitchen Display. Only the WebRTC offer/answer passes here; orders never do.
//   kds -> offer {key, offer, pairId}   kds -> status {key} (answer when the POS replied)   kds -> done {key}
//   pos -> get {key} (offer; pairId too when key is a 6-digit code)   pos -> answer {key, answer}
const { guard, reply } = require('../lib/security');
const store = require('../lib/kds-store');
const log = require('../lib/log').createLogger('kds-pair');

exports.handler = async function handler(event) {
  // The KDS polls every 2 s and the POS every 5 s; devices on one site share an IP, so allow plenty.
  const blocked = guard(event, { name: 'kds-pair', methods: ['POST'], limit: 240, windowMs: 60000, maxBody: 20000 });
  if (blocked) return blocked;
  try {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ }
    const key = store.safeKey(body.key);
    if (!key) return reply(event, 400, { ok: false, error: 'Enter the 6-digit code shown on the Kitchen Display.' });
    const action = String(body.action || '');

    if (action === 'offer') { await store.putOffer(key, body.offer, body.pairId); return reply(event, 200, { ok: true }); }
    if (action === 'status') {
      const s = await store.get(key);
      return reply(event, 200, { ok: true, answered: !!(s && s.answer), answer: s ? s.answer : '' });
    }
    if (action === 'done') { await store.remove(key); return reply(event, 200, { ok: true }); }
    if (action === 'get') {
      const s = await store.get(key);
      if (!s || s.answer) return reply(event, 200, { ok: true, found: false });
      return reply(event, 200, { ok: true, found: true, offer: s.offer, pairId: store.isCode(key) ? s.pairId : '' });
    }
    if (action === 'answer') {
      if (!(await store.putAnswer(key, body.answer))) return reply(event, 409, { ok: false, error: 'That code has expired. Ask the Kitchen Display for a new one.' });
      log.info('kds paired');
      return reply(event, 200, { ok: true });
    }
    return reply(event, 400, { ok: false, error: 'Unknown action.' });
  } catch (err) {
    if (!err.statusCode || err.statusCode >= 500) log.error('kds pairing failed', err);
    return reply(event, err.statusCode || 500, { ok: false, error: err.statusCode ? err.message : 'Could not complete the request.' });
  }
};
