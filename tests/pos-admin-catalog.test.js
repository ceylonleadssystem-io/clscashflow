const test = require('node:test');
const assert = require('node:assert/strict');

process.env.POS_ADMIN_TOKEN_SECRET = 'test-secret-'.padEnd(48, 'x');
const auth = require('../netlify/lib/admin-auth');

// A tiny in-memory stand-in for the Appwrite-backed Firestore-style API that pos-admin-data uses.
const docs = new Map();
const col = (path) => ({
  doc: (id) => ({
    get: async () => ({ exists: docs.has(path + '/' + id), id, data: () => JSON.parse(JSON.stringify(docs.get(path + '/' + id) || {})) }),
    set: async (data, opt) => { docs.set(path + '/' + id, opt && opt.merge ? Object.assign({}, docs.get(path + '/' + id), JSON.parse(JSON.stringify(data))) : JSON.parse(JSON.stringify(data))); },
    collection: (n) => col(path + '/' + id + '/' + n)
  })
});
const lib = require('../netlify/lib/appwrite');
lib.appwriteAdmin = () => ({ firestore: Object.assign(() => ({ collection: col }), { FieldValue: { serverTimestamp: () => 'ts' } }), auth: () => ({}) });
const storePath = require.resolve('../netlify/lib/admin-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: { getAdmin: async () => ({ id: 'a1', email: 'dev@ceylonrylabs.io', active: true }), audit: async () => {} } };
const { handler } = require('../netlify/functions/pos-admin-data');

const token = auth.signToken({ id: 'a1', email: 'dev@ceylonrylabs.io' }).token;
const call = async (body) => {
  const res = await handler({ httpMethod: 'POST', headers: { authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
  return { status: res.statusCode, json: JSON.parse(res.body) };
};
const UID = 'client-1';
const seed = () => {
  docs.clear();
  docs.set('users/' + UID, { email: 'o@x.lk', posEnabled: true, posBusinessName: 'Lotus' });
  docs.set('users/' + UID + '/pos/main', { ownerUid: UID, payload: {
    accountUid: UID,
    products: [{ id: 'p1', name: 'Tea', code: 'T1', category: 'Drinks', price: 300, stock: 40, cost: 100 }],
    categories: ['Drinks'], subcategories: [], modifiers: [], sales: [{ id: 's1', total: 300 }], users: [{ id: 'u1', pin: '8826' }], locations: [{ id: 'loc-main', name: 'Main' }], settings: { business: 'Lotus' }
  } });
};
const payload = () => docs.get('users/' + UID + '/pos/main').payload;
const items = [
  { name: 'Tea', code: 'T1', category: 'Drinks', price: 350, cost: 120, stock: 5, type: 'Product', unit: 'cup', supplier: '' },
  { name: 'Latte', code: 'L1', category: 'Drinks', subcategory: 'Hot', description: 'Milk coffee', price: 450, type: 'Product' }
];

test('import: merge updates the matching code and adds new items, stamped so devices take them, with subcategories, a backup and an audit line', async () => {
  seed();
  const r = await call({ action: 'saveCatalog', userId: UID, mode: 'merge', products: items, categories: ['Drinks'], subcategories: [{ parent: 'Drinks', name: 'Hot' }] });
  assert.equal(r.status, 200);
  assert.equal(r.json.imported, 2);
  const p = payload();
  assert.equal(p.products.length, 2);
  const tea = p.products.find((x) => x.code === 'T1');
  assert.equal(tea.price, 350);
  assert.equal(tea.id, 'p1');
  assert.ok(Date.parse(tea.updatedAt) > Date.parse('2026-01-01'));
  const latte = p.products.find((x) => x.code === 'L1');
  assert.equal(latte.subcategory, 'Hot');
  assert.equal(latte.description, 'Milk coffee');
  assert.deepEqual(p.subcategories.map((s) => s.name), ['Hot']);
  assert.equal(p.sales.length, 1);
  assert.match(p.supportAudit[0].details, /merge import: 2 items/);
  assert.ok([...docs.keys()].some((k) => k.startsWith('users/' + UID + '/posCatalogBackups/catalog-')));
});

test('import: add-only skips items already in the menu; replace swaps the whole catalogue', async () => {
  seed();
  const added = await call({ action: 'saveCatalog', userId: UID, mode: 'add', products: items, categories: ['Drinks'] });
  assert.equal(added.json.imported, 1);
  assert.equal(added.json.skipped, 1);
  assert.equal(payload().products.find((x) => x.code === 'T1').price, 300, 'the existing item is left alone');
  const replaced = await call({ action: 'saveCatalog', userId: UID, mode: 'replace', products: [items[1]], categories: ['Drinks'] });
  assert.equal(replaced.status, 200);
  assert.deepEqual(payload().products.map((x) => x.code), ['L1']);
  assert.equal((await call({ action: 'saveCatalog', userId: UID, mode: 'merge', products: [] })).status, 400);
});

test('assist config: the change is merged into the client workspace, sales, staff and stock stay, a backup and audit line are kept', async () => {
  seed();
  const r = await call({ action: 'saveConfig', userId: UID, config: { rows: { products: [{ id: 'p1', price: 360, modifierIds: ['m1'] }] }, settings: { kotPrinter: 'Kitchen', features: { 'view.sales': false } }, categories: { add: ['Bakery'], remove: [] } } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json.summary, { rows: 1, deleted: 0, categories: 1, settings: 1 });
  const p = payload();
  assert.deepEqual(p.products[0], Object.assign({ id: 'p1', name: 'Tea', code: 'T1', category: 'Drinks', price: 360, stock: 40, cost: 100, modifierIds: ['m1'] }, { updatedAt: p.products[0].updatedAt }));
  assert.equal(p.settings.kotPrinter, 'Kitchen');
  assert.equal(p.settings.features, undefined, 'a blocked setting is dropped');
  assert.deepEqual(p.categories, ['Bakery', 'Drinks']);
  assert.equal(p.users[0].pin, '8826');
  assert.equal(p.sales.length, 1);
  assert.match(p.supportAudit[0].details, /1 rows, 0 removed, 1 categories, 1 settings/);
  const backup = [...docs.entries()].find(([k]) => k.startsWith('users/' + UID + '/posCatalogBackups/config-'));
  assert.equal(backup[1].products[0].price, 300);
  assert.equal((await call({ action: 'saveConfig', userId: UID, config: { rows: {}, settings: { subscription: {} } } })).status, 400, 'nothing to send');
});

test('both actions need an administrator sign-in', async () => {
  seed();
  const res = await handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ action: 'saveConfig', userId: UID, config: {} }) });
  assert.equal(res.statusCode, 401);
});

test('openPos issues a short-lived sign-in token for the client, and only to an administrator', async () => {
  seed();
  let asked;
  lib.users = () => ({ createToken: async (uid, len, ttl) => { asked = [uid, len, ttl]; return { secret: 's3cret' }; } });
  const r = await call({ action: 'openPos', userId: UID });
  assert.equal(r.status, 200);
  assert.deepEqual([r.json.userId, r.json.secret], [UID, 's3cret']);
  assert.equal(asked[2], 300);
  const denied = await handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ action: 'openPos', userId: UID }) });
  assert.equal(denied.statusCode, 401);
});
