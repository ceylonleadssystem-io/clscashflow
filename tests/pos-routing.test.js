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
const fake = { Client: function () { return chain; }, Account: function () {}, Users: function () {}, Databases: FakeDatabases, ID: { unique: () => 'id' }, Query: { equal: (a, v) => ({ m: 'equal', a, v }), contains: (a, v) => ({ m: 'contains', a, v }), select: (a) => ({ m: 'select', a }), limit: (n) => ({ m: 'limit', n }), offset: (n) => ({ m: 'offset', n }) } };
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
