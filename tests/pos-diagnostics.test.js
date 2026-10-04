const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.POS_ADMIN_TOKEN_SECRET = 'test-secret-'.padEnd(48, 'x');
process.env.APPWRITE_API_KEY = 'test-key';
const auth = require('../netlify/lib/admin-auth');

const stub = (p, exports) => { const r = require.resolve(p); require.cache[r] = { id: r, filename: r, loaded: true, exports }; };
const fresh = (p) => { delete require.cache[require.resolve(p)]; return require(p); };

// In-memory stand-in for Appwrite Databases (same 404 shapes as the real SDK).
const rows = new Map();
class FakeDatabases {
  async getDocument(db, col, id) { if (!rows.has(id)) throw Object.assign(new Error('nf'), { code: 404, type: 'document_not_found' }); return Object.assign({ $id: id }, rows.get(id)); }
  async createDocument(db, col, id, data) { rows.set(id, Object.assign({}, data)); }
  async updateDocument(db, col, id, data) { await this.getDocument(db, col, id); rows.set(id, Object.assign({}, rows.get(id), data)); }
  async deleteDocument(db, col, id) { await this.getDocument(db, col, id); rows.delete(id); }
}
stub('node-appwrite', { Databases: FakeDatabases });
let user = null; let admin = null; const audits = [];
stub('../netlify/lib/appwrite', { serverClient: () => ({}), getUserFromEvent: async () => user, getDocument: async () => null, clean: (v) => String(v || '') });
stub('../netlify/lib/admin-store', { ADMIN_DATABASE_ID: 'pos_admin', getAdmin: async () => admin, audit: async (a) => audits.push(a.action) });
const store = fresh('../netlify/lib/diagnostics-store');

test('ids are validated and fit the 36 character document limit', () => {
  assert.equal(store.safeUid('abc_123-DEF'), 'abc_123-DEF');
  for (const bad of ['', null, 'a/b', 'a b', '../x', 'a.b', 'x'.repeat(35), 'é']) assert.equal(store.safeUid(bad), '');
  assert.ok(store.docId('x'.repeat(34)).length <= 36);
  assert.equal(store.safeRequestId('r-1_a'), 'r-1_a');
  assert.equal(store.safeRequestId('x'.repeat(41)), '');
});

test('signal lifecycle: offer, answer once, overwrite, remove', async () => {
  rows.clear();
  assert.equal(await store.get('u1'), null);
  assert.equal(await store.putAnswer('u1', 'r1', 'ans'), false); // nothing pending
  await store.putOffer('u1', 'r1', 'offer-sdp');
  assert.equal((await store.get('u1')).offer, 'offer-sdp');
  assert.equal(await store.putAnswer('u1', 'wrong', 'ans'), false);
  assert.equal(await store.putAnswer('u1', 'r1', 'ans'), true);
  assert.equal(await store.putAnswer('u1', 'r1', 'ans2'), false); // already answered
  await store.putOffer('u1', 'r2', 'offer2'); // new request overwrites
  const cur = await store.get('u1');
  assert.deepEqual([cur.requestId, cur.answer], ['r2', '']);
  await store.remove('u1');
  assert.equal(await store.get('u1'), null);
  await store.remove('u1'); // removing twice is fine
});

test('10 minute TTL is enforced on read and SDP size is capped', async () => {
  rows.clear();
  await store.putOffer('u2', 'r1', 'o');
  rows.get('s_u2').createdAt = new Date(Date.now() - 11 * 60000).toISOString();
  assert.equal(await store.get('u2'), null);
  assert.equal(rows.has('s_u2'), false); // deleted lazily
  assert.equal(store.expired(new Date(Date.now() - 9 * 60000).toISOString()), false);
  await assert.rejects(store.putOffer('u2', 'r1', 'x'.repeat(store.MAX_SDP + 1)), { statusCode: 400 });
  await assert.rejects(store.putOffer('u2', 'r1', ''), { statusCode: 400 });
  assert.equal(rows.size, 0);
});

test('a missing collection gives a clear 503', async () => {
  const orig = FakeDatabases.prototype.getDocument;
  FakeDatabases.prototype.getDocument = async () => { throw Object.assign(new Error('x'), { code: 404, type: 'collection_not_found' }); };
  await assert.rejects(store.get('u3'), { statusCode: 503 });
  FakeDatabases.prototype.getDocument = orig;
});

test('admin endpoint: rejects missing/forged tokens, runs offer/status/cancel flow', async () => {
  rows.clear();
  const { handler } = fresh('../netlify/functions/pos-admin-diagnostics');
  let n = 0;
  const call = (headers, body) => handler({ httpMethod: 'POST', headers: Object.assign({ 'x-nf-client-connection-ip': '10.1.0.' + (++n) }, headers), body: JSON.stringify(body) });
  assert.equal((await call({}, { action: 'status', userId: 'u1' })).statusCode, 401);
  assert.equal((await call({ authorization: 'Bearer nope.nope.nope' }, { action: 'status', userId: 'u1' })).statusCode, 401);
  const { token } = auth.signToken({ id: 'a1', email: 'dev@ceylonrylabs.io' });
  const h = { authorization: 'Bearer ' + token };
  assert.equal((await call(h, { action: 'status', userId: 'u1' })).statusCode, 403); // admin record missing
  assert.equal((await handler({ httpMethod: 'GET', headers: {}, body: '' })).statusCode, 405);

  admin = { id: 'a1', email: 'dev@ceylonrylabs.io', active: true };
  const j = async (body) => { const r = await call(h, body); return Object.assign({ code: r.statusCode }, JSON.parse(r.body)); };
  assert.equal((await j({ action: 'status', userId: 'u1' })).state, 'idle');
  assert.equal((await j({ action: 'status', userId: 'bad/id' })).code, 400);
  assert.equal((await j({ action: 'offer', userId: 'u1', requestId: 'r1', offer: 'x'.repeat(8001) })).code, 400);
  assert.equal((await j({ action: 'offer', userId: 'u1', requestId: 'r1', offer: 'OFFER' })).state, 'waiting');
  assert.equal((await j({ action: 'status', userId: 'u1' })).state, 'waiting');
  await store.putAnswer('u1', 'r1', 'ANSWER');
  const st = await j({ action: 'status', userId: 'u1' });
  assert.deepEqual([st.state, st.answer, st.requestId], ['answered', 'ANSWER', 'r1']);
  await j({ action: 'done', userId: 'u1' });
  assert.equal((await j({ action: 'status', userId: 'u1' })).state, 'idle');
  await j({ action: 'offer', userId: 'u1', requestId: 'r2', offer: 'O2' });
  await j({ action: 'cancel', userId: 'u1' });
  assert.equal(rows.size, 0);
  assert.deepEqual(audits, ['diagnostics.request', 'diagnostics.request', 'diagnostics.cancel']);
});

test('device endpoint: auth, check, answer only against a pending offer', async () => {
  rows.clear();
  const { handler } = fresh('../netlify/functions/pos-diagnostics');
  let n = 0;
  const call = (method, action, body) => handler({ httpMethod: method, headers: { 'x-nf-client-connection-ip': '10.2.0.' + (++n) }, queryStringParameters: { action }, body: JSON.stringify(body || {}) });
  const j = async (...a) => { const r = await call(...a); return Object.assign({ code: r.statusCode }, JSON.parse(r.body)); };

  assert.equal((await call('GET', 'check')).statusCode, 401);
  user = { id: 'u1' };
  assert.equal((await j('GET', 'check')).requested, false);
  assert.equal((await j('POST', 'answer', { requestId: 'r1', answer: 'A' })).code, 409); // nothing pending
  await store.putOffer('u1', 'r1', 'OFFER');
  const c = await j('GET', 'check');
  assert.deepEqual([c.requested, c.requestId, c.offer], [true, 'r1', 'OFFER']);
  assert.equal((await j('POST', 'answer', { requestId: 'other', answer: 'A' })).code, 409);
  assert.equal((await j('POST', 'answer', { requestId: 'r1', answer: 'x'.repeat(8001) })).code, 400);
  assert.equal((await j('POST', 'answer', { requestId: 'r1', answer: 'A' })).code, 200);
  assert.equal((await j('POST', 'answer', { requestId: 'r1', answer: 'B' })).code, 409); // only one answer
  assert.equal((await j('GET', 'check')).requested, false); // answered: no longer offered
  assert.equal((await j('GET', 'bogus')).code, 400);
});

test('no file/bucket storage code remains in netlify/', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const hits = walk(path.join(__dirname, '..', 'netlify')).filter((f) => /diagnostics.*\.js$/.test(f) && /Storage|bucket|DIAGNOSTICS_BUCKET/i.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(hits, []);
});
