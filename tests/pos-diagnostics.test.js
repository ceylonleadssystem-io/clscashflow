const test = require('node:test');
const assert = require('node:assert/strict');

process.env.POS_ADMIN_TOKEN_SECRET = 'test-secret-'.padEnd(48, 'x');
const auth = require('../netlify/lib/admin-auth');
const store = require('../netlify/lib/diagnostics-store');

const stub = (path, exports) => { const p = require.resolve(path); require.cache[p] = { id: p, filename: p, loaded: true, exports }; };

test('file ids are validated and fit the Appwrite limit', () => {
  assert.equal(store.safeUid('abc123.DEF_-'), 'abc123.DEF_-');
  for (const bad of ['', null, 'a/b', 'a b', '../x', 'x'.repeat(35), 'é']) assert.equal(store.safeUid(bad), '');
  assert.ok(store.logId('x'.repeat(34)).length <= 36);
  assert.equal(store.requestId('u1'), 'r_u1');
});

test('24 h expiry and log capping keep the tail', () => {
  const now = Date.now();
  assert.equal(store.expired(new Date(now - 3600e3).toISOString(), now), false);
  assert.equal(store.expired(new Date(now - 25 * 3600e3).toISOString(), now), true);
  assert.equal(store.expired('garbage', now), true);
  assert.equal(store.capText('abcdef', 3), 'def');
  assert.equal(store.capText({ a: 1 }), '');
  assert.equal(store.capText('x'.repeat(store.MAX_LOG_CHARS + 5)).length, store.MAX_LOG_CHARS);
});

test('admin diagnostics endpoint rejects missing and forged tokens', async () => {
  stub('../netlify/lib/admin-store', { getAdmin: async () => null, audit: async () => {} });
  delete require.cache[require.resolve('../netlify/functions/pos-admin-diagnostics')];
  const { handler } = require('../netlify/functions/pos-admin-diagnostics');
  const call = (headers, n) => handler({ httpMethod: 'POST', headers: Object.assign({ 'x-nf-client-connection-ip': '10.1.0.' + n }, headers), body: JSON.stringify({ action: 'status', userId: 'u1' }) });
  assert.equal((await call({}, 1)).statusCode, 401);
  assert.equal((await call({ authorization: 'Bearer nope.nope.nope' }, 2)).statusCode, 401);
  const { token } = auth.signToken({ id: 'a1', email: 'dev@ceylonrylabs.io' });
  assert.equal((await call({ authorization: 'Bearer ' + token }, 3)).statusCode, 403); // admin record missing
  assert.equal((await handler({ httpMethod: 'GET', headers: {}, body: '' })).statusCode, 405);
});

test('device endpoint: rejects unsigned calls; upload needs a pending request', async () => {
  let user = null; let pending = null; const saved = [];
  stub('../netlify/lib/appwrite', { getUserFromEvent: async () => user, getDocument: async () => null, clean: (v) => String(v || '') });
  stub('../netlify/lib/diagnostics-store', Object.assign({}, store, {
    getRequest: async () => pending, putLog: async (u, t) => saved.push([u, t]), clearRequest: async () => { pending = null; }
  }));
  delete require.cache[require.resolve('../netlify/functions/pos-diagnostics')];
  const { handler } = require('../netlify/functions/pos-diagnostics');
  const call = (method, action, body, n) => handler({ httpMethod: method, headers: { 'x-nf-client-connection-ip': '10.2.0.' + n }, queryStringParameters: { action }, body: JSON.stringify(body || {}) });

  assert.equal((await call('GET', 'check', null, 1)).statusCode, 401);
  user = { id: 'u1' };
  assert.deepEqual(JSON.parse((await call('GET', 'check', null, 2)).body), { ok: true, requested: false });
  assert.equal((await call('POST', 'upload', { text: 'hi' }, 3)).statusCode, 409);
  pending = { requestedAt: new Date().toISOString() };
  assert.equal(JSON.parse((await call('GET', 'check', null, 4)).body).requested, true);
  assert.equal((await call('POST', 'upload', { text: 'hello' }, 5)).statusCode, 200);
  assert.deepEqual(saved, [['u1', 'hello']]);
  assert.equal(pending, null);
});
