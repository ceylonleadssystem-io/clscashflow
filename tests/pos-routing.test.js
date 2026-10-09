const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

// in-memory stand-in for Appwrite: rows are keyed by database / collection / row id
const rows = new Map();
const notFound = () => Object.assign(new Error('not found'), { code: 404 });
class FakeDatabases {
  async getDocument(db, col, id) { const r = rows.get(db + '/' + col + '/' + id); if (!r) throw notFound(); return r; }
  async createDocument(db, col, id, data) { const r = Object.assign({ $id: id }, data); rows.set(db + '/' + col + '/' + id, r); return r; }
  async updateDocument(db, col, id, data) { const k = db + '/' + col + '/' + id; if (!rows.has(k)) throw notFound(); const r = Object.assign({}, rows.get(k), data); rows.set(k, r); return r; }
  async deleteDocument(db, col, id) { if (!rows.delete(db + '/' + col + '/' + id)) throw notFound(); }
  async listDocuments(db, col, queries) {
    const eq = queries.find((q) => q.m === 'equal');
    return { documents: [...rows.entries()].filter(([k, r]) => k.startsWith(db + '/' + col + '/') && r.path === eq.v[0]).map(([, r]) => r) };
  }
}
const chain = new Proxy(function () {}, { get: () => () => chain, apply: () => chain });
const fake = { Client: function () { return chain; }, Account: function () { return { get: async () => ({ $id: 'u12', email: 'o@x.lk', name: 'Owner' }) }; }, Users: function () {}, Databases: FakeDatabases, ID: { unique: () => 'id' }, Query: { equal: (a, v) => ({ m: 'equal', a, v }), contains: (a, v) => ({ m: 'contains', a, v }), select: (a) => ({ m: 'select', a }), limit: (n) => ({ m: 'limit', n }), offset: (n) => ({ m: 'offset', n }) } };
const realLoad = Module._load;
Module._load = function (request, ...rest) { return request === 'node-appwrite' ? fake : realLoad.call(this, request, ...rest); };
process.env.APPWRITE_API_KEY = 'k';
const lib = require('../netlify/lib/appwrite');
Module._load = realLoad;

const crypto = require('node:crypto');
const keyOf = (path, id) => crypto.createHash('sha256').update(path + '\0' + id).digest('hex').slice(0, 36);
const slot = (store, path, id) => rows.get(store + '/' + (store === 'pos' ? 'pos_documents' : 'app_documents') + '/' + keyOf(path, id));
const seed = (store, path, id, data) => rows.set(store + '/' + (store === 'pos' ? 'pos_documents' : 'app_documents') + '/' + keyOf(path, id), { $id: keyOf(path, id), path, docId: id, data: JSON.stringify(data) });

test('only the POS paths are routed to the POS database', () => {
  assert.equal(lib.isPosPath('users/u1/pos'), true);
  assert.equal(lib.isPosPath('users/u1/pos/__large_documents__/main'), true);
  assert.equal(lib.isPosPath('users/u1/posCatalogBackups'), true);
  assert.equal(lib.isPosPath('users/u1/posInvoices'), false); // stays where it is
  assert.equal(lib.isPosPath('users/u1'), false);
  assert.equal(lib.isPosPath('platformVisits'), false);
  assert.equal(lib.storeFor('users/u1/pos').db, 'pos');
  assert.equal(lib.storeFor('users/u1/posInvoices').db, 'ceylonry');
});

test('writes go to the POS database; other paths stay in the main database', async () => {
  rows.clear();
  await lib.upsertDocument('users/u1/pos', 'main', { payload: { a: 1 } });
  await lib.upsertDocument('users/u1/posInvoices', 'INV-1', { n: 1 });
  await lib.upsertDocument('users/u1', 'u1', { email: 'a@b.c' });
  assert.ok(slot('pos', 'users/u1/pos', 'main'));
  assert.equal(slot('ceylonry', 'users/u1/pos', 'main'), undefined);
  assert.ok(slot('ceylonry', 'users/u1/posInvoices', 'INV-1'));
  assert.ok(slot('ceylonry', 'users/u1', 'u1'));
});

test('a POS row that has not been copied yet is still read, and the next write lands in the POS database', async () => {
  rows.clear();
  seed('ceylonry', 'users/u2/pos', 'main', { payload: { products: [1] } });
  assert.deepEqual((await lib.getDocument('users/u2/pos', 'main')).data, { payload: { products: [1] } });
  await lib.upsertDocument('users/u2/pos', 'main', { extra: true }, true); // merge with the old row
  assert.deepEqual(JSON.parse(slot('pos', 'users/u2/pos', 'main').data), { payload: { products: [1] }, extra: true });
  // once copied, the POS copy is the one read
  seed('pos', 'users/u2/pos', 'main', { payload: 'new' });
  assert.deepEqual((await lib.getDocument('users/u2/pos', 'main')).data, { payload: 'new' });
});

test('listing merges both databases and the POS copy wins', async () => {
  rows.clear();
  seed('ceylonry', 'users/u3/posCatalogBackups', 'b1', { v: 'old' });
  seed('ceylonry', 'users/u3/posCatalogBackups', 'b2', { v: 'only-old' });
  seed('pos', 'users/u3/posCatalogBackups', 'b1', { v: 'new' });
  const list = await lib.queryDocuments('users/u3/posCatalogBackups');
  assert.deepEqual(list.map((r) => [r.id, r.data.v]).sort(), [['b1', 'new'], ['b2', 'only-old']]);
});

test('deleting removes the row from both databases so it cannot come back', async () => {
  rows.clear();
  seed('ceylonry', 'users/u4/pos', 'main', { x: 1 });
  seed('pos', 'users/u4/pos', 'main', { x: 2 });
  await lib.deleteDocument('users/u4/pos', 'main');
  assert.equal(await lib.getDocument('users/u4/pos', 'main'), null);
});

test('large documents are split in the POS database and read back', async () => {
  rows.clear();
  const big = require('node:crypto').randomBytes(700000).toString('base64'); // barely compresses, so it still needs pieces
  await lib.upsertDocument('users/u5/pos', 'main', { payload: big });
  const pieces = [...rows.keys()].filter((k) => k.startsWith('pos/pos_documents/'));
  assert.ok(pieces.length >= 3, 'main row plus at least two pieces');
  assert.ok(![...rows.keys()].some((k) => k.startsWith('ceylonry/')));
  assert.equal((await lib.getDocument('users/u5/pos', 'main')).data.payload, big);
});

test('the migration script copies only missing POS rows, keeps ids, never deletes, and verify spots gaps', async () => {
  rows.clear();
  const { migrate, verify } = require('../scripts/migrate-pos-to-own-database');
  const db = new FakeDatabases();
  db.listDocuments = async (d, c, queries) => ({ documents: [...rows.entries()].filter(([k]) => k.startsWith(d + '/' + c + '/')).map(([, r]) => r).slice(queries.find((q) => q.m === 'offset')?.n || 0, (queries.find((q) => q.m === 'offset')?.n || 0) + 100) });
  seed('ceylonry', 'users/a/pos', 'main', { n: 1 });
  seed('ceylonry', 'users/a/pos/__large_documents__/main', 'p1', { chunk: 'x' });
  seed('ceylonry', 'users/a/posInvoices', 'INV', { n: 2 }); // not a POS path: untouched
  seed('ceylonry', 'users/b/pos', 'main', { n: 3 });
  seed('pos', 'users/b/pos', 'main', { n: 'newer' }); // already copied (and newer): never overwritten
  assert.deepEqual(await migrate(db, { apply: false }), { found: 3, copied: 0, skipped: 1, mismatched: 0 });
  assert.equal(slot('pos', 'users/a/pos', 'main'), undefined); // dry run wrote nothing
  assert.deepEqual(await migrate(db, { apply: true }), { found: 3, copied: 2, skipped: 1, mismatched: 0 });
  assert.equal(slot('pos', 'users/a/pos', 'main').data, slot('ceylonry', 'users/a/pos', 'main').data);
  assert.deepEqual(JSON.parse(slot('pos', 'users/b/pos', 'main').data), { n: 'newer' });
  assert.equal(slot('pos', 'users/a/posInvoices', 'INV'), undefined);
  assert.ok(slot('ceylonry', 'users/a/pos', 'main')); // nothing deleted from the source
  assert.deepEqual(await verify(db), { checked: 3, missing: 0, different: 1 }); // users/b was newer in the POS database
});

test('big documents are stored compressed and read back unchanged, small ones stay plain', async () => {
  rows.clear();
  const big = { payload: { sales: Array.from({ length: 2000 }, (_, i) => ({ id: 's' + i, total: i, note: 'cash sale number ' + i })) } };
  const saved = await lib.upsertDocument('users/u6/pos', 'main', big);
  const stored = slot('pos', 'users/u6/pos', 'main');
  assert.ok(JSON.parse(stored.data).__gz, 'stored compressed');
  assert.ok(stored.data.length < JSON.stringify(big).length / 3, 'much smaller than the plain JSON');
  assert.equal([...rows.keys()].filter((k) => k.startsWith('pos/')).length, 1, 'one row, no pieces needed');
  const back = await lib.getDocument('users/u6/pos', 'main');
  assert.deepEqual(back.data, big);
  assert.equal(back.stamp, saved.stamp);
  await lib.upsertDocument('users/u6', 'u6', { email: 'a@b.c' });
  assert.equal(JSON.parse(slot('ceylonry', 'users/u6', 'u6').data).email, 'a@b.c'); // small document: plain JSON
});

test('the stamp call returns only the last-write time and changes with every write', async () => {
  rows.clear();
  assert.deepEqual(await lib.getDocumentStamp('users/u7/pos', 'main'), { exists: false, stamp: '' });
  const first = await lib.upsertDocument('users/u7/pos', 'main', { payload: { a: 1 } });
  const head = await lib.getDocumentStamp('users/u7/pos', 'main');
  assert.equal(head.exists, true);
  assert.equal(head.stamp, first.stamp);
  await new Promise((r) => setTimeout(r, 5));
  const second = await lib.upsertDocument('users/u7/pos', 'main', { payload: { a: 2 } }, true);
  assert.notEqual(second.stamp, first.stamp);
  assert.equal((await lib.getDocumentStamp('users/u7/pos', 'main')).stamp, second.stamp);
  // a row that is still in the old table is found too (fallback), like getDocument
  seed('ceylonry', 'users/u8/pos', 'main', { x: 1 });
  rows.get('ceylonry/app_documents/' + keyOf('users/u8/pos', 'main')).updatedAt = '2026-01-01T00:00:00.000Z';
  assert.equal((await lib.getDocumentStamp('users/u8/pos', 'main')).stamp, '2026-01-01T00:00:00.000Z');
});

test('a document the caller has just read is not read again by canWrite / upsertDocument', async () => {
  rows.clear();
  await lib.upsertDocument('users/u9/pos', 'main', { payload: { a: 1 } });
  let reads = 0;
  const realGet = FakeDatabases.prototype.getDocument;
  const key = keyOf('users/u9/pos', 'main');
  FakeDatabases.prototype.getDocument = async function (...a) { if (a[2] === key) reads++; return realGet.apply(this, a); };
  try {
    const current = await lib.getDocument('users/u9/pos', 'main');
    const afterRead = reads;
    assert.equal(await lib.canWrite('users/u9/pos', 'main', {}, { id: 'u9', email: 'x@y.z' }, current), true);
    await lib.upsertDocument('users/u9/pos', 'main', { payload: { a: 2 } }, true, current);
    assert.equal(reads - afterRead, 1, 'only the row lookup inside upsertDocument (created time and piece count): the document itself is not read again');
  } finally { FakeDatabases.prototype.getDocument = realGet; }
});

test('APPWRITE_COMPRESS=off stops compressing new saves but compressed rows stay readable', async () => {
  rows.clear();
  const big = { payload: { items: Array.from({ length: 3000 }, (_, i) => 'item number ' + i) } };
  await lib.upsertDocument('users/u10/pos', 'main', big);
  assert.ok(JSON.parse(slot('pos', 'users/u10/pos', 'main').data).__gz);
  process.env.APPWRITE_COMPRESS = 'off';
  try {
    assert.deepEqual((await lib.getDocument('users/u10/pos', 'main')).data, big); // still readable
    await lib.upsertDocument('users/u10/pos', 'main', big);
    assert.deepEqual(JSON.parse(slot('pos', 'users/u10/pos', 'main').data).payload, big.payload); // plain again
  } finally { delete process.env.APPWRITE_COMPRESS; }
});

test('stamps lists the write time of every document under a path, and month documents are POS data', async () => {
  rows.clear();
  await lib.upsertDocument('users/u11/pos/main/sales', '2026-09', { rows: [{ id: 's1' }] });
  await lib.upsertDocument('users/u11/pos/main/sales', '2026-10', { rows: [{ id: 's2' }] });
  await lib.upsertDocument('users/u11/pos/main/sales', '2026-10', { rows: [{ id: 's3' }] }, true);
  const list = await lib.listStamps('users/u11/pos/main/sales');
  assert.deepEqual([...list.keys()].sort(), ['2026-09', '2026-10']);
  assert.equal(list.get('2026-10'), (await lib.getDocumentStamp('users/u11/pos/main/sales', '2026-10')).stamp);
  assert.ok(slot('pos', 'users/u11/pos/main/sales', '2026-09')); // month documents are POS data: they live in the POS database
  assert.equal(slot('ceylonry', 'users/u11/pos/main/sales', '2026-09'), undefined);
});

test('appwrite-docs: month documents union their rows, a salesSplit main document drops its sales, stamps answers without data', async () => {
  rows.clear();
  Module._load = function (request, ...rest) { return request === 'node-appwrite' ? fake : realLoad.call(this, request, ...rest); };
  const docs = require('../netlify/functions/appwrite-docs');
  Module._load = realLoad;
  const call = async (body) => { const r = await docs.handler({ httpMethod: 'POST', headers: { authorization: 'Bearer t' }, body: JSON.stringify(body) }); return { code: r.statusCode, json: JSON.parse(r.body) }; };
  const month = 'users/u12/pos/main/sales';
  const a = await call({ action: 'set', path: month, id: '2026-10', data: { rows: [{ id: 's1', updatedAt: '2026-10-01T00:00:00.000Z' }] }, merge: true });
  assert.equal(a.code, 200);
  assert.equal(a.json.previousStamp, '');
  const b = await call({ action: 'set', path: month, id: '2026-10', data: { rows: [{ id: 's2', updatedAt: '2026-10-02T00:00:00.000Z' }] }, merge: true });
  assert.equal(b.json.previousStamp, a.json.stamp); // the version it replaced
  const got = await call({ action: 'get', path: month, id: '2026-10' });
  assert.deepEqual(got.json.doc.data.rows.map((r) => r.id).sort(), ['s1', 's2']); // the second save did not drop the first sale
  const list = await call({ action: 'stamps', path: month });
  assert.deepEqual(list.json.stamps, { '2026-10': b.json.stamp });

  // the main document: a legacy copy still has sales, the split save removes them
  await call({ action: 'set', path: 'users/u12/pos', id: 'main', data: { ownerUid: 'u12', payload: { products: [{ id: 'p1', name: 'Tea' }], sales: [{ id: 'old' }] } }, merge: true });
  const main = await call({ action: 'set', path: 'users/u12/pos', id: 'main', data: { ownerUid: 'u12', payload: { products: [{ id: 'p1', name: 'Tea' }], salesSplit: 1 } }, merge: true });
  assert.equal(main.code, 200);
  const stored = await call({ action: 'get', path: 'users/u12/pos', id: 'main' });
  assert.equal(stored.json.doc.data.payload.sales, undefined);
  assert.equal(stored.json.doc.data.payload.salesSplit, 1);
  assert.equal((await call({ action: 'stamp', path: 'users/u12/pos', id: 'main' })).json.stamp, main.json.stamp);
  // another account cannot read these months
  const other = await docs.handler({ httpMethod: 'POST', headers: { authorization: 'Bearer t' }, body: JSON.stringify({ action: 'stamps', path: 'users/someone-else/pos/main/sales' }) });
  assert.equal(other.statusCode, 403);
});
