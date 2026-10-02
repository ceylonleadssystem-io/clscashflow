const test = require('node:test');
const assert = require('node:assert/strict');

process.env.POS_ADMIN_TOKEN_SECRET = 'test-secret-'.padEnd(48, 'x');
const auth = require('../netlify/lib/admin-auth');

test('only @ceylonrylabs.io addresses are administrator emails', () => {
  assert.equal(auth.isAdminEmail('dev@ceylonrylabs.io'), true);
  assert.equal(auth.isAdminEmail('DEV@CeylonryLabs.io'), true);
  for (const bad of ['dev@gmail.com', 'dev@ceylonrylabs.io.evil.com', 'dev@evilceylonrylabs.io', 'a@b@ceylonrylabs.io', '', 'dev @ceylonrylabs.io']) {
    assert.equal(auth.isAdminEmail(bad), false, bad);
  }
});

test('password hashes verify only the right password and are salted', () => {
  const h1 = auth.hashPassword('correct horse battery');
  const h2 = auth.hashPassword('correct horse battery');
  assert.notEqual(h1, h2);
  assert.equal(auth.verifyPassword('correct horse battery', h1), true);
  assert.equal(auth.verifyPassword('wrong', h1), false);
  assert.equal(auth.verifyPassword('x', 'not-a-hash'), false);
  assert.equal(auth.verifyPassword('x', ''), false);
});

test('session tokens expire, and tampering or a different secret is rejected', () => {
  const { token } = auth.signToken({ id: 'a1', email: 'dev@ceylonrylabs.io' });
  assert.equal(auth.verifyToken(token).sub, 'a1');
  assert.equal(auth.verifyToken(token + 'x'), null);
  assert.equal(auth.verifyToken(token, Date.now() + 9 * 3600 * 1000), null);
  const [h, p, s] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ sub: 'a1', email: 'evil@ceylonrylabs.io', exp: 9999999999 })).toString('base64url');
  assert.equal(auth.verifyToken([h, forged, s].join('.')), null);
  process.env.POS_ADMIN_TOKEN_SECRET = 'another-secret-'.padEnd(48, 'y');
  assert.equal(auth.verifyToken(token), null);
  process.env.POS_ADMIN_TOKEN_SECRET = 'test-secret-'.padEnd(48, 'x');
});

test('login endpoint: domain rule, lockout and token issue (store stubbed)', async () => {
  const storePath = require.resolve('../netlify/lib/admin-store');
  const record = { id: 'a1', email: 'dev@ceylonrylabs.io', name: 'Dev', passwordHash: auth.hashPassword('correct horse battery'), active: true, failedAttempts: 0, lockedUntil: '' };
  const calls = { failures: 0, audit: [] };
  require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: {
    LOCK_MINUTES: 15,
    findAdminByEmail: async (e) => (e === record.email ? record : null),
    isLocked: () => false,
    recordFailure: async () => { calls.failures++; return false; },
    recordSuccess: async () => {},
    audit: async (x) => calls.audit.push(x.action)
  } };
  delete require.cache[require.resolve('../netlify/functions/pos-admin-login')];
  const { handler } = require('../netlify/functions/pos-admin-login');
  const call = (email, password, n) => handler({ httpMethod: 'POST', headers: { 'x-nf-client-connection-ip': '10.0.0.' + n }, body: JSON.stringify({ email, password }) });

  assert.equal((await call('someone@gmail.com', 'correct horse battery', 1)).statusCode, 401);
  assert.equal(calls.failures, 0);
  assert.equal((await call(record.email, 'wrong password', 2)).statusCode, 401);
  assert.equal(calls.failures, 1);
  const ok = await call(record.email, 'correct horse battery', 3);
  assert.equal(ok.statusCode, 200);
  assert.ok(auth.verifyToken(JSON.parse(ok.body).token));
  assert.equal((await handler({ httpMethod: 'GET', headers: {} })).statusCode, 405);
  assert.ok(calls.audit.includes('login'));
});

test('admin data endpoint refuses missing, malformed and forged tokens', async () => {
  const { handler } = require('../netlify/functions/pos-admin-data');
  for (const authorization of [undefined, 'Bearer abc.def.ghi', 'Bearer ' + auth.signToken({ id: 'a1', email: 'x@ceylonrylabs.io' }).token + 'x']) {
    const res = await handler({ httpMethod: 'GET', headers: authorization ? { authorization } : {}, queryStringParameters: {} });
    assert.equal(res.statusCode, 401);
  }
});
