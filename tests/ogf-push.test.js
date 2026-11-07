const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const push = require('../netlify/lib/ogf-push');

// ---- a stand-in for the mall's server: the login and the POS-02 import, with the checks of the spec
const CLIENT = { id: 'CCB1-PS-23-00000039', secret: 's3cret+/=' };
const mall = { batches: [], tokens: 0, behavior: {} };
const server = http.createServer(async (req, res) => {
  let body = '';
  for await (const c of req) body += c;
  const send = (status, json) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(json)); };
  if (req.url === '/connect/token') {
    mall.tokens++;
    const f = new URLSearchParams(body);
    if (f.get('grant_type') !== 'client_credentials' || f.get('client_id') !== (mall.behavior.clientId || CLIENT.id) || f.get('client_secret') !== CLIENT.secret) return send(400, { error: 'invalid_client' });
    return send(200, { token_type: 'Bearer', access_token: 'tok-1', expires_in: 3600 });
  }
  if (req.url === '/api/possale/importpossaleswithitems') {
    if (mall.behavior.down) return send(500, { error: 'boom' });
    if (req.headers.authorization !== 'Bearer tok-1') return send(401, {});
    const b = JSON.parse(body);
    const problems = [];
    if (b.AppCode !== 'POS-02') problems.push('AppCode');
    if (!/^\d{14}$/.test(b.BatchCode)) problems.push('BatchCode');
    if (b.ClientSecret !== CLIENT.secret) problems.push('ClientSecret');
    const seen = new Set();
    const bad = [];
    b.PosSales.forEach((s, i) => {
      const dup = s.ReceiptNo + '|' + s.SalesType;
      const [d, m, y] = s.ReceiptDate.split('/').map(Number);
      const ok = s.PropertyCode === b.PropertyCode && s.POSInterfaceCode === b.POSInterfaceCode && !seen.has(dup) && /^\d{2}\/\d{2}\/\d{4}$/.test(s.ReceiptDate) && /^\d{2}:\d{2}:\d{2}$/.test(s.ReceiptTime) &&
        new Date(Date.UTC(y, m - 1, d)) <= new Date() && ['TotalSalesAmtB4Tax', 'TotalSalesAmtAfterTax', 'ServiceChargeAmt', 'PaymentAmt'].every((k) => s[k] >= 0) &&
        s.Items.every((x) => x.ItemAmt >= 0) && ['Sales', 'Void', 'Return', 'Refund', 'Exchange'].includes(s.SalesType) && !(mall.behavior.rejectReceipts || []).includes(s.ReceiptNo);
      seen.add(dup);
      if (!ok) bad.push(i + 1);
    });
    mall.batches.push({ batchCode: b.BatchCode, interface: b.POSInterfaceCode, records: b.PosSales, header: b });
    if (problems.length) return send(200, { BatchCode: b.BatchCode, ReturnStatus: 'Failed', RecordsReceived: b.PosSales.length, RecordsImported: 0, ErrorDetails: 'Bad header: ' + problems.join(','), DefectiveRowNos: '' });
    if (mall.behavior.ambiguous) return send(200, { BatchCode: b.BatchCode, ReturnStatus: 'Partial', RecordsReceived: b.PosSales.length, RecordsImported: 1, ErrorDetails: 'Some rows failed', DefectiveRowNos: '' });
    return send(200, { BatchCode: b.BatchCode, ReturnStatus: bad.length ? 'Partial' : 'Success', RecordsReceived: b.PosSales.length, RecordsImported: b.PosSales.length - bad.length, ErrorDetails: bad.length ? 'Row errors' : '', DefectiveRowNos: bad.join(',') });
  }
  send(404, {});
});
let base;
test.before(async () => { await new Promise((r) => server.listen(0, '127.0.0.1', r)); base = 'http://127.0.0.1:' + server.address().port; });
test.after(() => server.close());

// ---- in-memory documents and clock
const UID = 'acct-1';
let docs, clock, workspace;
const deps = () => ({
  allowAnyUrl: true, fetch: (u, i) => fetch(u, i), now: () => clock,
  getDoc: async (c, id) => (docs.has(c + '/' + id) ? JSON.parse(JSON.stringify(docs.get(c + '/' + id))) : null),
  putDoc: async (c, id, d) => { docs.set(c + '/' + id, JSON.parse(JSON.stringify(d))); },
  getPayload: async () => JSON.parse(JSON.stringify(workspace))
});
const sale = (n, extra) => Object.assign({ id: 's' + n, receipt: 'ORD-' + String(n).padStart(4, '0'), createdAt: '2026-11-07T05:' + String(10 + n).padStart(2, '0') + ':00.000Z', date: '2026-11-07', payment: 'Cash', total: 118, status: 'completed', locationId: 'loc-a',
  lines: [{ name: 'Tea', price: 100, qty: 1 }, { name: 'VAT (18%)', code: 'TAX', price: 18, qty: 1, isServiceCharge: true }] }, extra);
const config = (extra) => Object.assign({ enabled: true, environment: 'test', testBaseUrl: base, propertyCode: 'OGF1', intervalMinutes: 60, registers: [{ id: 'r1', name: 'Till 1', locationId: '', posInterfaceCode: CLIENT.id, clientId: CLIENT.id }] }, extra);
const setup = async (sales, cfg) => {
  docs = new Map(); mall.batches = []; mall.tokens = 0; mall.behavior = {}; clock = Date.parse('2026-11-07T10:00:00Z');
  workspace = { settings: { businessType: 'ogf', ogfPush: cfg || config() }, sales };
  await push.saveSecret(UID, deps(), 'r1', CLIENT.secret);
};
const run = (trigger) => push.runPush(UID, { deps: deps(), trigger: trigger || 'manual' });
const sentReceipts = () => mall.batches.flatMap((b) => b.records.map((r) => r.ReceiptNo + ':' + r.SalesType));

test('new receipts go in one batch with the spec header, and are not sent twice', async () => {
  await setup([sale(1), sale(2)]);
  const r = await run();
  assert.equal(r.sent, 2);
  assert.equal(mall.batches.length, 1);
  const b = mall.batches[0];
  assert.equal(b.header.AppCode, 'POS-02');
  assert.equal(b.header.PropertyCode, 'OGF1');
  assert.equal(b.header.POSInterfaceCode, CLIENT.id);
  assert.match(b.batchCode, /^\d{14}$/);
  assert.deepEqual(sentReceipts(), ['ORD-0001:Sales', 'ORD-0002:Sales']);
  assert.equal((await run()).sent, 0);
  assert.equal(mall.batches.length, 1);
  assert.equal((await push.statusFor(UID, deps())).lastStatus, 'Nothing to send');
});

test('a void and a refund go in a later batch than their receipt, with the same receipt number', async () => {
  await setup([sale(1)]);
  await run();
  clock += 3600000;
  workspace.sales = [sale(1, { status: 'partially_refunded', total: 59, originalTotal: 118, refunds: [{ id: 'rf1', at: '2026-11-07T06:00:00.000Z', amount: 59, lines: [{ lineIndex: 0, qty: 1, unitPrice: 100, name: 'Tea' }] }] }), sale(2, { status: 'voided', total: 0, originalTotal: 118, voidAt: '2026-11-07T06:30:00.000Z' })];
  const r = await run();
  assert.equal(r.batches.length, 2); // the new receipt, then the voids and refunds
  assert.deepEqual(sentReceipts(), ['ORD-0001:Sales', 'ORD-0002:Sales', 'ORD-0001:Refund', 'ORD-0002:Void']);
  const codes = mall.batches.map((b) => b.batchCode);
  assert.equal(new Set(codes).size, codes.length); // one batch number, one submission
  assert.equal((await run()).sent, 0); // nothing is sent twice
});

test('the mall\'s rejected rows are tried again next time, the others stay sent; after five rejections the receipt is held until released', async () => {
  await setup([sale(1), sale(2), sale(3)]);
  mall.behavior.rejectReceipts = ['ORD-0002'];
  let r = await run();
  assert.equal(r.sent, 2);
  assert.equal(r.batches[0].status, 'Partly imported');
  assert.equal(r.batches[0].defectiveRows, '2');
  for (let i = 0; i < 3; i++) { clock += 3600000; r = await run(); assert.equal(r.sent, 0); }
  assert.equal((await push.statusFor(UID, deps())).held.length, 0);
  clock += 3600000; await run(); // the fifth rejection
  const st = await push.statusFor(UID, deps());
  assert.equal(st.held.length, 1);
  assert.equal(st.held[0].receipt, 'ORD-0002');
  mall.behavior.rejectReceipts = [];
  clock += 3600000; assert.equal((await run()).sent, 0); // held: not sent again by itself
  await push.retryHeld(UID, deps());
  clock += 3600000;
  assert.equal((await run()).sent, 1);
});

test('an outage or a refused login leaves everything waiting and does not count against the receipts', async () => {
  await setup([sale(1)]);
  mall.behavior.down = true;
  let r = await run();
  assert.equal(r.sent, 0);
  assert.equal(r.batches[0].status, 'Error');
  assert.match(r.batches[0].message, /HTTP 500/);
  for (let i = 0; i < 6; i++) { clock += 3600000; await run(); }
  assert.equal((await push.statusFor(UID, deps())).held.length, 0);
  mall.behavior.down = false;
  clock += 3600000;
  assert.equal((await run()).sent, 1);
  await setup([sale(1)]);
  mall.behavior.clientId = 'someone-else';
  r = await run();
  assert.equal(r.batches[0].status, 'Error');
  assert.match(r.batches[0].message, /refused the login/);
  assert.deepEqual(sentReceipts(), []);
});

test('a partial answer that does not say which rows failed holds the batch instead of risking a receipt counted twice', async () => {
  await setup([sale(1), sale(2)]);
  mall.behavior.ambiguous = true;
  const r = await run();
  assert.equal(r.batches[0].status, 'Needs attention');
  assert.equal((await push.statusFor(UID, deps())).held.length, 2);
  mall.behavior.ambiguous = false;
  clock += 3600000;
  assert.equal((await run()).sent, 0);
});

test('each register has its own interface code and login; a location with no register is reported, not guessed', async () => {
  const cfg = config({ registers: [{ id: 'r1', name: 'Till A', locationId: 'loc-a', posInterfaceCode: 'PS-A', clientId: CLIENT.id }, { id: 'r2', name: 'Till B', locationId: 'loc-b', posInterfaceCode: 'PS-B', clientId: CLIENT.id }] });
  await setup([sale(1), sale(2, { locationId: 'loc-b' }), sale(3, { locationId: 'loc-c', locationName: 'Kiosk' })], cfg);
  await push.saveSecret(UID, deps(), 'r2', CLIENT.secret);
  await run();
  assert.deepEqual(mall.batches.map((b) => [b.interface, b.records.map((x) => x.ReceiptNo)]), [['PS-A', ['ORD-0001']], ['PS-B', ['ORD-0002']]]);
  assert.match((await push.statusFor(UID, deps())).issues[0].message, /No register is set for Kiosk/);
});

test('it only runs for a Restaurant (OGF) business that is switched on and set up, and the schedule respects the interval', async () => {
  await setup([sale(1)], config({ enabled: false }));
  assert.equal((await run()).skipped, 'disabled');
  await setup([sale(1)]);
  workspace.settings.businessType = 'restaurant';
  assert.equal((await run()).skipped, 'not-ogf');
  await setup([sale(1)], config({ propertyCode: '' }));
  const r = await run();
  assert.equal(r.skipped, 'not-set-up');
  assert.match(r.problems[0], /property code/);
  await setup([sale(1)]);
  assert.equal((await run('schedule')).sent, 1);
  workspace.sales = [sale(1), sale(2)];
  clock += 20 * 60000;
  assert.equal((await run('schedule')).skipped, 'not-due');
  assert.equal((await run('manual')).sent, 1); // a person pressing Send now does not wait
  clock += 61 * 60000;
  workspace.sales = [sale(1), sale(2), sale(3)];
  assert.equal((await run('schedule')).sent, 1);
});

test('sales before the start date, and sales dated in the future, are not sent', async () => {
  await setup([sale(1, { date: '2026-11-06', createdAt: '2026-11-06T05:00:00Z' }), sale(2), sale(3, { createdAt: '2026-11-09T05:00:00Z', date: '2026-11-09' })], config({ sendFrom: '2026-11-07' }));
  await run();
  assert.deepEqual(sentReceipts(), ['ORD-0002:Sales']);
});

test('the client secret is stored where the business\'s own browser cannot read it, and is never given back', async () => {
  await setup([sale(1)]);
  const keys = [...docs.keys()];
  assert.ok(keys.every((k) => k.startsWith(push.COLLECTION + '/')));
  const secretKey = keys.find((k) => JSON.stringify(docs.get(k)).includes(CLIENT.secret));
  assert.ok(secretKey);
  const id = secretKey.split('/')[1];
  assert.notEqual(id, UID);
  const data = docs.get(secretKey);
  for (const owner of ['uid', 'userUid', 'ownerUid', 'email']) assert.equal(owner in data, false); // belongs() in appwrite.js decides access by these
  const status = await push.statusFor(UID, deps());
  assert.deepEqual(status.secrets, { r1: true });
  assert.equal(JSON.stringify(status).includes(CLIENT.secret), false);
  const preview = await push.previewFor(UID, deps(), 3);
  assert.equal(JSON.stringify(preview).includes(CLIENT.secret), false);
  assert.equal(preview.PosSales[0].SalesType, 'Sales');
  assert.deepEqual((await push.deleteSecret(UID, deps(), 'r1')).ok, true);
  assert.deepEqual((await push.statusFor(UID, deps())).secrets, {});
  assert.match((await push.saveSecret(UID, deps(), 'r1', '   ')).error, /secret/);
});

test('the test connection says whether the mall accepted the login', async () => {
  await setup([]);
  assert.equal((await push.testConnection(UID, deps(), 'r1')).ok, true);
  mall.behavior.clientId = 'wrong';
  const bad = await push.testConnection(UID, deps(), 'r1');
  assert.equal(bad.ok, false);
  assert.match(bad.message, /refused the login/);
});

test('server addresses must be public https names, and batch numbers are unique within a second', () => {
  assert.ok(push.safeBaseUrl('https://pos-api.example.com/').url);
  assert.equal(push.safeBaseUrl('https://pos-api.example.com/api/').url, 'https://pos-api.example.com/api');
  for (const bad of ['http://pos-api.example.com', 'https://localhost', 'https://10.0.0.5', 'https://[::1]', 'https://printer.local', 'not a url', ''])
    assert.ok(push.safeBaseUrl(bad).error, bad);
  const taken = new Set();
  const a = push.batchCode(Date.parse('2026-11-07T10:00:00Z'), taken);
  const b = push.batchCode(Date.parse('2026-11-07T10:00:00Z'), taken);
  assert.equal(a, '07112026153000'); // 10:00 UTC is 15:30 in Colombo
  assert.notEqual(a, b);
  assert.equal(b, '07112026153001');
});
