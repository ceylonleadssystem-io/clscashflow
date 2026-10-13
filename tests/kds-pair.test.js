const test = require('node:test');
const assert = require('node:assert/strict');

const stub = (p, exports) => { const r = require.resolve(p); require.cache[r] = { id: r, filename: r, loaded: true, exports }; };
const rows = new Map();
class FakeDatabases {
  async getDocument(db, col, id) { if (!rows.has(id)) throw Object.assign(new Error('nf'), { code: 404, type: 'document_not_found' }); return Object.assign({ $id: id }, rows.get(id)); }
  async createDocument(db, col, id, data) { rows.set(id, Object.assign({}, data)); }
  async updateDocument(db, col, id, data) { await this.getDocument(db, col, id); rows.set(id, Object.assign({}, rows.get(id), data)); }
  async deleteDocument(db, col, id) { await this.getDocument(db, col, id); rows.delete(id); }
}
stub('node-appwrite', { Databases: FakeDatabases });
stub('../netlify/lib/appwrite', { serverClient: () => ({}) });
stub('../netlify/lib/admin-store', { ADMIN_DATABASE_ID: 'pos_admin' });
const store = require('../netlify/lib/kds-store');

test('keys: 6-digit codes and 24-hex pair ids only', () => {
  assert.equal(store.safeKey('123456'), '123456');
  assert.equal(store.safeKey('a'.repeat(24)), 'a'.repeat(24));
  for (const bad of ['', '12345', '1234567', 'abc', '../x', null, 'A'.repeat(24)]) assert.equal(store.safeKey(bad), '');
});

test('offer -> get -> answer, and a live code cannot be hijacked', async () => {
  const pairId = 'b'.repeat(24);
  await store.putOffer('111222', 'v=0 offer', pairId);
  await assert.rejects(store.putOffer('111222', 'evil', pairId), { statusCode: 409 });
  assert.equal((await store.get('111222')).pairId, pairId);
  assert.equal(await store.putAnswer('111222', 'v=0 answer'), true);
  assert.equal(await store.putAnswer('111222', 'second'), false);
  assert.equal((await store.get('111222')).answer, 'v=0 answer');
  await store.remove('111222');
  assert.equal(await store.get('111222'), null);
});

test('a pair id offer can be refreshed and an expired offer is gone', async () => {
  const k = 'c'.repeat(24);
  await store.putOffer(k, 'one');
  await store.putOffer(k, 'two');
  assert.equal((await store.get(k)).offer, 'two');
  rows.get(store.docId(k)).createdAt = new Date(Date.now() - store.TTL_MS - 1000).toISOString();
  assert.equal(await store.get(k), null);
});
