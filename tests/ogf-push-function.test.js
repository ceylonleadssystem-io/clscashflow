const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const lib = require('../netlify/lib/appwrite');
const push = require('../netlify/lib/ogf-push');

// the mall: accepts one login and counts what it imports
const seen = { records: 0 };
const mall = http.createServer(async (req, res) => {
  let body = '';
  for await (const c of req) body += c;
  const out = (j) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(j)); };
  if (req.url === '/connect/token') return out(new URLSearchParams(body).get('client_secret') === 'good-secret' ? { access_token: 't' } : {});
  const b = JSON.parse(body);
  seen.records += b.PosSales.length;
  out({ BatchCode: b.BatchCode, ReturnStatus: 'Success', RecordsReceived: b.PosSales.length, RecordsImported: b.PosSales.length, ErrorDetails: '', DefectiveRowNos: '' });
});

const docs = new Map();
let caller = { id: 'owner-1', email: 'o@x.lk' };
let base;
test.before(async () => {
  await new Promise((r) => mall.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + mall.address().port;
  lib.getUserFromEvent = async () => caller;
  lib.getDocument = async (path, id) => (docs.has(path + '/' + id) ? { data: JSON.parse(JSON.stringify(docs.get(path + '/' + id))) } : null);
  lib.upsertDocument = async (path, id, data) => { docs.set(path + '/' + id, JSON.parse(JSON.stringify(data))); };
  lib.queryDocuments = async (path) => [...docs.keys()].filter((k) => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/')).map((k) => ({ id: k.split('/')[1], data: docs.get(k) }));
  const real = push.realDeps;
  push.realDeps = (l) => Object.assign(real(l), { allowAnyUrl: true }); // the stand-in mall is http on this computer
});
test.after(() => mall.close());

const { handler } = require('../netlify/functions/ogf-push');
const { handler: scheduled } = require('../netlify/functions/ogf-push-scheduled');
const call = async (body, headers) => {
  const res = await handler({ httpMethod: 'POST', headers: Object.assign({ origin: 'https://ogf.ceylonrylabs.io', authorization: 'Bearer jwt', 'x-nf-client-connection-ip': '9.9.9.' + Math.floor(Math.random() * 250) }, headers), body: JSON.stringify(body) });
  return { status: res.statusCode, json: JSON.parse(res.body || '{}') };
};
const seed = (type) => {
  docs.clear(); seen.records = 0;
  docs.set('users/owner-1', { email: 'o@x.lk' });
  docs.set('users/owner-1/pos/main', { payload: { settings: { businessType: type, ogfPush: { enabled: true, environment: 'test', testBaseUrl: base, propertyCode: 'OGF1', registers: [{ id: 'r1', name: 'Till', posInterfaceCode: 'CCB1-PS-23-00000039', clientId: 'cid' }] } },
    sales: [{ id: 's1', receipt: 'ORD-1', createdAt: '2026-11-05T05:00:00Z', date: '2026-11-05', payment: 'Cash', total: 100, locationId: 'l', lines: [{ name: 'Tea', price: 100, qty: 1 }] }] } });
};

test('a signed-in Restaurant (OGF) business can save its secret, see the status and send; the secret is never returned', async () => {
  seed('ogf');
  assert.equal((await call({ action: 'saveSecret', registerId: 'r1', secret: 'good-secret' })).status, 200);
  const status = await call({ action: 'status' });
  assert.equal(status.status, 200);
  assert.deepEqual(status.json.secrets, { r1: true });
  assert.equal(JSON.stringify(status.json).includes('good-secret'), false);
  assert.equal(status.json.waiting.sales, 1);
  assert.equal((await call({ action: 'test', registerId: 'r1' })).json.ok, true);
  const preview = await call({ action: 'preview' });
  assert.equal(preview.json.PosSales.length, 1);
  assert.equal(JSON.stringify(preview.json).includes('good-secret'), false);
  const sent = await call({ action: 'sendNow' });
  assert.equal(sent.json.ok, true);
  assert.equal(sent.json.sent, 1);
  assert.equal(seen.records, 1);
});

test('someone who is not signed in, a business that is not Restaurant (OGF), and another website are all refused', async () => {
  seed('ogf');
  caller = null;
  assert.equal((await call({ action: 'status' })).status, 401);
  caller = { id: 'owner-1', email: 'o@x.lk' };
  seed('restaurant');
  const other = await call({ action: 'status' });
  assert.equal(other.status, 403);
  assert.match(other.json.error, /only for Restaurant \(OGF\)/);
  assert.equal((await call({ action: 'sendNow' })).status, 403);
  seed('ogf');
  assert.equal((await call({ action: 'status' }, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await call({ action: 'saveSecret', registerId: 'r1', secret: '' })).status, 400);
});

test('a staff sign-in uses the owner\'s business', async () => {
  seed('ogf');
  docs.set('users/staff-1', { email: 's@x.lk', ownerUid: 'owner-1' });
  caller = { id: 'staff-1', email: 's@x.lk' };
  const r = await call({ action: 'status' });
  caller = { id: 'owner-1', email: 'o@x.lk' };
  assert.equal(r.status, 200);
});

test('the scheduled run sends for the businesses that asked for it (found through the registry) and skips the rest', async () => {
  seed('ogf');
  await call({ action: 'saveSecret', registerId: 'r1', secret: 'good-secret' }); // this also puts the business in the registry
  // a business that is registered but is not (or no longer) Restaurant (OGF) is left alone
  docs.set('users/other-1/pos/main', { payload: { settings: { businessType: 'restaurant', ogfPush: { enabled: true } }, sales: [] } });
  await push.register(push.realDeps(lib), 'other-1');
  const r = await scheduled();
  assert.equal(r.statusCode, 200);
  assert.deepEqual(JSON.parse(r.body), { businesses: 2, ran: 1, sent: 1 });
  assert.equal(seen.records, 1);
  assert.deepEqual(JSON.parse((await scheduled()).body), { businesses: 2, ran: 0, sent: 0 }); // not due again yet
});
