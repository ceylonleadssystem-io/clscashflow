const test = require('node:test');
const assert = require('node:assert/strict');
const { createPurger, kindOf, imageIdsOf } = require('../netlify/lib/account-purge');

const UID = 'abc123';
const OTHER = 'abc1234'; // shares the prefix: must never be touched

function world() {
  const rows = {
    pos: [
      { id: 'r1', path: 'users/' + UID + '/pos', docId: 'main' },
      { id: 'r2', path: 'users/' + UID + '/pos/__large_documents__/main', docId: 'p1' },
      { id: 'r3', path: 'users/' + UID + '/pos/main/sales', docId: '2026-10' },
      { id: 'r4', path: 'users/' + OTHER + '/pos', docId: 'main' },
      { id: 'r5', path: 'users/' + UID + '/posInvoices', docId: 'INV-1' }
    ],
    main: [
      { id: 'm1', path: 'users/' + UID + '/team', docId: 't1' },
      { id: 'm2', path: 'users/' + OTHER + '/team', docId: 't1' }
    ]
  };
  const state = { profile: { id: UID, data: { posBusinessName: 'Cafe', posPaid: true, posNextPaymentDue: new Date(Date.now() + 5 * 864e5).toISOString() } }, auth: true, images: ['img1', 'img2'], payments: [{ id: 'pay1', data: { uid: UID, amountLkr: 5500 } }], deleted: [] };
  const payload = { users: [{}, {}], locations: [{}], products: [{ image: 'https://x/v1/storage/buckets/pos-images/files/img1/view?project=p' }], customers: [], sales: [{}, {}], syncMeta: { updatedAt: new Date().toISOString() } };
  const deps = {
    stores: ['pos', 'main'],
    listRows: async (name) => rows[name].slice(),
    deleteRows: async (name, ids) => { rows[name] = rows[name].filter((r) => !ids.includes(r.id)); state.deleted.push(...ids); },
    readPayload: async () => (rows.pos.some((r) => r.id === 'r1') ? payload : null),
    listPayments: async () => state.payments.slice(),
    deletePayment: async (id) => { state.payments = state.payments.filter((p) => p.id !== id); },
    listInvoices: async () => (rows.pos.some((r) => r.id === 'r5') ? [{ id: 'INV-1', data: { status: 'unpaid' } }] : []),
    listImages: async () => state.images.map((id) => ({ id, name: UID + '__product.jpg' })),
    deleteImages: async (ids) => { state.images = state.images.filter((i) => !ids.includes(i)); },
    profileRow: async () => state.profile,
    deleteProfile: async () => { state.profile = null; },
    deleteAuthUser: async () => { state.auth = false; },
    teamMembers: async () => 0
  };
  return { rows, state, deps };
}

test('classifies the rows of an account and finds image ids in the business document', () => {
  assert.equal(kindOf('users/u/pos', 'u'), 'main');
  assert.equal(kindOf('users/u/pos/__large_documents__/main', 'u'), 'pieces');
  assert.equal(kindOf('users/u/pos/main/sales', 'u'), 'salesMonths');
  assert.deepEqual(imageIdsOf({ a: 'https://h/v1/storage/buckets/pos-images/files/f1/view?project=p', b: ['https://h/v1/storage/buckets/pos-images/files/f2/view'] }).sort(), ['f1', 'f2']);
});

test('the parity check lists everything that will be deleted, only for this account, with warnings', async () => {
  const w = world();
  const found = await createPurger(w.deps).inventory(UID);
  assert.equal(found.counts.databaseRows, 5); // r1, r2, r3, r5 and m1 - not the account that shares the prefix
  assert.equal(found.counts.images, 2);
  assert.equal(found.counts.paymentRecords, 1);
  assert.equal(found.business, 'Cafe');
  const codes = found.warnings.map((x) => x.code);
  for (const c of ['paid-subscription', 'account-active', 'recent-activity', 'unpaid-invoices', 'payment-records']) assert.ok(codes.includes(c), c);
});

test('deleting removes the rows, files, payments, profile and sign-in, leaves other accounts, and verifies nothing is left', async () => {
  const w = world();
  const result = await createPurger(w.deps).purge(UID, {});
  assert.equal(result.clean, true);
  assert.deepEqual(result.remaining, { databaseRows: 0, profile: 0, images: 0, paymentRecords: 0 });
  assert.equal(w.state.auth, false);
  assert.equal(w.state.profile, null);
  assert.deepEqual(w.rows.pos.map((r) => r.id), ['r4']);
  assert.deepEqual(w.rows.main.map((r) => r.id), ['m2']);
});

test('payment records are kept on request', async () => {
  const w = world();
  const result = await createPurger(w.deps).purge(UID, { keepPayments: true });
  assert.equal(result.clean, true);
  assert.equal(w.state.payments.length, 1);
});

test('a failed run can be repeated and an account with nothing left is reported', async () => {
  const w = world();
  let first = true;
  const real = w.deps.deleteRows;
  w.deps.deleteRows = async (name, ids) => { if (first && name === 'main') { first = false; throw new Error('network'); } return real(name, ids); };
  const purger = createPurger(w.deps);
  await assert.rejects(() => purger.purge(UID, {}), /network/);
  assert.ok(w.state.profile, 'profile and sign-in are only removed after the data'); // still listed for a retry
  const again = await purger.purge(UID, {});
  assert.equal(again.clean, true);
  await assert.rejects(() => purger.purge(UID, {}), /Nothing was found/);
});

test('a sign-in that is already gone does not fail the deletion', async () => {
  const w = world();
  w.deps.deleteAuthUser = async () => { const e = new Error('not found'); e.code = 404; throw e; };
  assert.equal((await createPurger(w.deps).purge(UID, {})).clean, true);
});

test('the admin function cleans the plan it stores on an account and the founders templates', () => {
  const { _cleanSubscription, _cleanFounders } = require('../netlify/functions/pos-admin-data');
  const sub = _cleanSubscription({ planId: 'starter', name: 'POS Starter', maxUsers: '2', maxLocations: 1, featuresOff: ['view.crm', 'view.crm', '<script>'], custom: [{ label: 'Hardware', value: '1 printer' }, { label: '' }] });
  assert.deepEqual({ ...sub, assignedAt: undefined }, { enforced: true, planId: 'starter', name: 'POS Starter', maxUsers: 2, maxLocations: 1, featuresOff: ['view.crm'], custom: [{ label: 'Hardware', value: '1 printer' }], assignedAt: undefined });
  assert.equal(_cleanSubscription('nope'), undefined);
  assert.equal(_cleanSubscription({ maxUsers: '', maxLocations: null }).maxUsers, null); // blank = unlimited
  const founders = _cleanFounders([{ name: 'Founders 2026', price: '7000', maxUsers: 4, featuresOff: ['view.crm'] }, null]);
  assert.equal(founders.length, 2);
  assert.deepEqual([founders[0].name, founders[0].price, founders[0].maxUsers, founders[0].featuresOff], ['Founders 2026', 7000, 4, ['view.crm']]);
});
