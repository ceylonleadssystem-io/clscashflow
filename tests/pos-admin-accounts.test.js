const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.POS_ADMIN_TOKEN_SECRET = 'test-secret-'.padEnd(48, 'x');
const auth = require('../netlify/lib/admin-auth');

// In-memory stand-in for the Appwrite-backed Firestore-style API that pos-admin-data uses (same idea as pos-admin-catalog.test.js).
const docs = new Map();
const col = (p) => ({
  orderBy: () => col(p),
  limit: () => col(p),
  get: async () => {
    const out = [...docs.keys()].filter((k) => k.startsWith(p + '/') && !k.slice(p.length + 1).includes('/')).map((k) => k.slice(p.length + 1));
    const list = out.map((id) => ({ id, data: () => JSON.parse(JSON.stringify(docs.get(p + '/' + id))) }));
    return { docs: list, empty: !list.length, size: list.length, forEach: (fn) => list.forEach(fn) };
  },
  doc: (id) => ({
    get: async () => ({ exists: docs.has(p + '/' + id), id, data: () => JSON.parse(JSON.stringify(docs.get(p + '/' + id) || {})) }),
    set: async (data, opt) => { docs.set(p + '/' + id, opt && opt.merge ? Object.assign({}, docs.get(p + '/' + id), JSON.parse(JSON.stringify(data))) : JSON.parse(JSON.stringify(data))); },
    delete: async () => { docs.delete(p + '/' + id); },
    collection: (n) => col(p + '/' + id + '/' + n)
  })
});
const lib = require('../netlify/lib/appwrite');
lib.appwriteAdmin = () => ({ firestore: Object.assign(() => ({ collection: col }), { FieldValue: { serverTimestamp: () => 'ts' } }), auth: () => ({ listUsers: async () => ({ users: [] }) }) });

// sign-ins: a map of email -> id, with the failures a test asks for
const signins = new Map();
let createFails = null;
lib.users = () => ({
  create: async ({ userId, email, password, name }) => {
    if (createFails) throw createFails;
    if ([...signins.keys()].includes(email)) throw Object.assign(new Error('exists'), { code: 409 });
    signins.set(email, { id: userId, password, name });
    return { $id: userId, email };
  },
  delete: async (id) => { for (const [k, v] of signins) if (v.id === id) signins.delete(k); }
});

// the purge itself needs the real Appwrite: replace it, keep the real name rules
const purgePath = require.resolve('../netlify/lib/account-purge');
const realPurge = require('../netlify/lib/account-purge');
const purged = [];
require.cache[purgePath].exports = Object.assign({}, realPurge, {
  realDeps: () => ({}),
  createPurger: () => ({
    inventory: async (uid) => ({ business: realPurge.businessLabel((docs.get('users/' + uid) || {}), (docs.get('users/' + uid + '/pos/main') || {}).payload), stores: [], counts: {}, warnings: [] }),
    purge: async (uid) => { purged.push(uid); return { done: {}, remaining: {}, clean: true }; }
  })
});
const storePath = require.resolve('../netlify/lib/admin-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: { getAdmin: async () => ({ id: 'a1', email: 'dev@ceylonrylabs.io', active: true }), audit: async () => {} } };
const { handler } = require('../netlify/functions/pos-admin-data');

const token = auth.signToken({ id: 'a1', email: 'dev@ceylonrylabs.io' }).token;
const call = async (body) => {
  const res = await handler({ httpMethod: 'POST', headers: { authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
  return { status: res.statusCode, json: JSON.parse(res.body) };
};
const form = { name: 'Nimal Perera', business: 'Lotus Cafe', email: 'Nimal@Example.com', mobile: '077 123 4567', businessType: 'cafe' };

test('createAccount makes the sign-in, the profile and an empty POS with the business type chosen and locked', async () => {
  docs.clear(); signins.clear(); createFails = null;
  const r = await call({ action: 'createAccount', ...form });
  assert.equal(r.status, 200);
  assert.equal(r.json.generated, true);
  assert.equal(r.json.password.length, 12);
  assert.equal(r.json.account.email, 'nimal@example.com');
  const id = r.json.account.id;
  assert.equal(signins.get('nimal@example.com').password, r.json.password);
  const profile = docs.get('users/' + id);
  assert.equal(profile.posEnabled, true);
  assert.equal(profile.posSubscriptionStatus, 'trial');
  assert.equal(profile.posBusinessName, 'Lotus Cafe');
  assert.equal(profile.posPaid, false);
  assert.ok(Date.parse(profile.posTrialEnd) > Date.now());
  assert.equal(Math.round((Date.parse(profile.posTrialEnd) - Date.parse(profile.posTrialStart)) / 86400000), 7);
  const main = docs.get('users/' + id + '/pos/main');
  assert.equal(main.ownerUid, id);
  assert.equal(main.payload.settings.businessType, 'cafe');
  assert.equal(main.payload.settings.businessTypeLocked, true);
  assert.equal(main.payload.users[0].role, 'owner');
  // it appears in the account list
  const list = await call({ action: 'list' });
  assert.ok(list.json.users.some((u) => u.id === id && u.business === 'Lotus Cafe' && u.businessType === 'cafe'));
});

test('createAccount keeps a password the administrator typed and says nothing was generated', async () => {
  docs.clear(); signins.clear();
  const r = await call({ action: 'createAccount', ...form, password: 'MyOwnPass1' });
  assert.equal(r.status, 200);
  assert.equal(r.json.generated, false);
  assert.equal(r.json.password, '');
  assert.equal(signins.get('nimal@example.com').password, 'MyOwnPass1');
});

test('createAccount refuses bad input and an e-mail that already has an account, and leaves nothing behind', async () => {
  docs.clear(); signins.clear();
  assert.equal((await call({ action: 'createAccount', ...form, email: 'not-an-email' })).status, 400);
  assert.equal((await call({ action: 'createAccount', ...form, businessType: 'spaceship' })).status, 400);
  assert.equal((await call({ action: 'createAccount', ...form, password: 'short' })).status, 400);
  assert.equal(signins.size, 0);
  assert.equal((await call({ action: 'createAccount', ...form })).status, 200);
  const again = await call({ action: 'createAccount', ...form });
  assert.equal(again.status, 409);
  assert.match(again.json.error, /already exists/);
  assert.equal(signins.size, 1);
});

test('a failure while writing the documents removes the new sign-in again', async () => {
  docs.clear(); signins.clear();
  const realSet = docs.set.bind(docs);
  docs.set = (key, value) => { if (key.endsWith('/pos/main')) throw new Error('database down'); return realSet(key, value); };
  const r = await call({ action: 'createAccount', ...form });
  docs.set = realSet;
  assert.equal(r.status >= 500, true);
  assert.equal(signins.size, 0);
  assert.equal([...docs.keys()].filter((k) => k.startsWith('users/')).length, 0);
});

test('the business type list of the server is the one the portal offers (Automobile was missing, so choosing it was dropped)', async () => {
  const presets = fs.readFileSync(path.join(__dirname, '..', 'pos-react/src/config/presets.js'), 'utf8');
  const base = /export const BUSINESS_TYPE_OPTIONS = \[([^\]]*)\]/.exec(presets)[1].match(/"(\w+)"/g).map((s) => s.replace(/"/g, ''));
  const admin = [...base.slice(0, -1), ...(/ADMIN_BUSINESS_TYPE_OPTIONS = \[\.\.\.BUSINESS_TYPE_OPTIONS\.slice\(0, -1\), ([^\]]*)\]/.exec(presets)[1].match(/"(\w+)"/g).map((s) => s.replace(/"/g, '')))];
  const { BUSINESS_TYPES } = require('../netlify/lib/new-account');
  assert.deepEqual([...BUSINESS_TYPES].sort(), [...admin].sort());
});

test('saveSettings stores Automobile as the business type and refuses an unknown one instead of saying it saved', async () => {
  docs.clear(); signins.clear();
  const made = await call({ action: 'createAccount', ...form });
  const userId = made.json.account.id;
  const ok = await call({ action: 'saveSettings', userId, settings: { businessType: 'automobile', businessTypeLocked: true }, summary: 'Business type changed' });
  assert.equal(ok.status, 200);
  assert.equal(docs.get('users/' + userId + '/pos/main').payload.settings.businessType, 'automobile');
  const bad = await call({ action: 'saveSettings', userId, settings: { businessType: 'spaceship' } });
  assert.equal(bad.status, 400);
  assert.equal(docs.get('users/' + userId + '/pos/main').payload.settings.businessType, 'automobile');
});

test('deleteAccount: the name to type is the one the portal shows, even when the profile has no business name', async () => {
  docs.clear(); signins.clear(); purged.length = 0;
  // an account whose profile has no business name: the portal shows the name inside the POS settings
  docs.set('users/c1', { email: 'o@x.lk', posEnabled: true });
  docs.set('users/c1/pos/main', { ownerUid: 'c1', payload: { accountUid: 'c1', settings: { business: 'Lotus Cafe' } } });
  const list = await call({ action: 'list' });
  assert.equal(list.json.users.find((u) => u.id === 'c1').business, 'Lotus Cafe');
  const check = await call({ action: 'previewDeleteAccount', userId: 'c1' });
  assert.equal(check.json.check.confirm, 'Lotus Cafe');
  const wrong = await call({ action: 'deleteAccount', userId: 'c1', confirmBusiness: 'Other', confirmedReview: true, confirmedFinal: true });
  assert.equal(wrong.status, 400);
  assert.match(wrong.json.error, /Type exactly: Lotus Cafe/);
  assert.deepEqual(purged, []);
  const ok = await call({ action: 'deleteAccount', userId: 'c1', confirmBusiness: '  Lotus Cafe ', confirmedReview: true, confirmedFinal: true });
  assert.equal(ok.status, 200);
  assert.deepEqual(purged, ['c1']);
});

test('deleteAccount: an account with no name at all is confirmed by typing DELETE', async () => {
  docs.clear(); purged.length = 0;
  docs.set('users/c2', { email: 'o@x.lk', posEnabled: true });
  docs.set('users/c2/pos/main', { ownerUid: 'c2', payload: { accountUid: 'c2', settings: {} } });
  const check = await call({ action: 'previewDeleteAccount', userId: 'c2' });
  assert.equal(check.json.check.confirm, 'DELETE');
  assert.equal((await call({ action: 'deleteAccount', userId: 'c2', confirmBusiness: '', confirmedReview: true, confirmedFinal: true })).status, 400);
  assert.equal((await call({ action: 'deleteAccount', userId: 'c2', confirmBusiness: 'DELETE', confirmedReview: true, confirmedFinal: true })).status, 200);
});

test('deleteAccount still needs both confirmations and refuses a platform administrator account', async () => {
  docs.clear(); purged.length = 0;
  docs.set('users/c3', { email: 'o@x.lk', posEnabled: true, posBusinessName: 'Shop' });
  docs.set('users/c3/pos/main', { ownerUid: 'c3', payload: { accountUid: 'c3', settings: {} } });
  assert.equal((await call({ action: 'deleteAccount', userId: 'c3', confirmBusiness: 'Shop', confirmedReview: true })).status, 400);
  docs.set('users/c4', { email: 'devteam@ceylonrylabs.io', posEnabled: true, posBusinessName: 'Admin' });
  docs.set('users/c4/pos/main', { ownerUid: 'c4', payload: { accountUid: 'c4', settings: {} } });
  assert.equal((await call({ action: 'deleteAccount', userId: 'c4', confirmBusiness: 'Admin', confirmedReview: true, confirmedFinal: true })).status, 400);
  assert.deepEqual(purged, []);
});
