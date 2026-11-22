const test = require('node:test');
const assert = require('node:assert/strict');

process.env.POS_ADMIN_TOKEN_SECRET = 'test-secret-'.padEnd(48, 'x');
const auth = require('../netlify/lib/admin-auth');

// The administrator record the functions will find. Its type is changed from test to test.
let record = { id: 'a1', email: 'dev@ceylonrylabs.io', active: true, role: 'admin' };
const lib = require('../netlify/lib/appwrite');
lib.appwriteAdmin = () => ({ firestore: Object.assign(() => ({ collection: () => ({ doc: () => ({ get: async () => ({ exists: false, data: () => ({}) }), set: async () => {} }) }) }), { FieldValue: { serverTimestamp: () => 'ts' } }), auth: () => ({}) });
const storePath = require.resolve('../netlify/lib/admin-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: { getAdmin: async () => record, audit: async () => {} } };

const data = require('../netlify/functions/pos-admin-data');
const diagnostics = require('../netlify/functions/pos-admin-diagnostics');
const support = require('../netlify/functions/support-session');

const token = () => auth.signToken({ id: 'a1', email: 'dev@ceylonrylabs.io' }).token;
const call = async (fn, body) => {
  const res = await fn.handler({ httpMethod: 'POST', headers: { authorization: 'Bearer ' + token() }, body: JSON.stringify(body) });
  return { status: res.statusCode, json: JSON.parse(res.body || '{}') };
};

test('an account with no type is a full administrator, so accounts that existed before the types keep working', () => {
  assert.equal(auth.adminRole(undefined), 'admin');
  assert.equal(auth.adminRole(''), 'admin');
  assert.equal(auth.adminRole('whatever'), 'admin');
  assert.equal(auth.adminRole('Support'), 'support');
  assert.equal(auth.canUsePortal({ role: 'admin' }), true);
  assert.equal(auth.canUsePortal({}), true);
  assert.equal(auth.canUsePortal({ role: 'support' }), false);
  assert.equal(auth.canUsePortal(null), false);
});

test('a support-only account is refused by the account and diagnostics functions', async () => {
  record = { id: 'a1', email: 'dev@ceylonrylabs.io', active: true, role: 'support' };
  for (const action of ['list', 'get', 'recordPayment', 'setAccountStatus', 'extendTrial', 'deleteAccount', 'saveCatalog']) {
    const r = await call(data, { action, userId: 'client-1' });
    assert.equal(r.status, 403, action);
    assert.match(r.json.error, /live support/i);
  }
  const d = await call(diagnostics, { userId: 'client-1' });
  assert.equal(d.status, 403);
});

test('a full administrator is not refused', async () => {
  record = { id: 'a1', email: 'dev@ceylonrylabs.io', active: true, role: 'admin' };
  const r = await call(data, { action: 'get', userId: 'client-1' });
  assert.notEqual(r.status, 403);
  assert.notEqual(r.status, 401);
});

test('both kinds of administrator may use live support, and nobody else', async () => {
  for (const role of ['admin', 'support']) {
    record = { id: 'a1', email: 'dev@ceylonrylabs.io', active: true, role };
    const r = await call(support, { action: 'agentIce' });
    assert.equal(r.status, 200, role);
    assert.ok(Array.isArray(r.json.ice));
  }
  record = { id: 'a1', email: 'dev@ceylonrylabs.io', active: false, role: 'support' };
  assert.equal((await call(support, { action: 'agentIce' })).status, 403); // an inactive account
  const none = await support.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ action: 'agentIce' }) });
  assert.equal(none.statusCode, 401); // no sign-in
});
