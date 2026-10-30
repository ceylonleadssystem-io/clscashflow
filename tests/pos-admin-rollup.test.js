const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');

// pos-admin-data.js does not export its helpers: take salesRollup out of the source and run it
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'netlify', 'functions', 'pos-admin-data.js'), 'utf8');
const start = source.indexOf('function salesRollup');
const end = source.indexOf('function addBillingPeriod');
assert.ok(start > 0 && end > start, 'salesRollup is in pos-admin-data.js');
const salesRollup = new Function(source.slice(start, end) + '; return salesRollup;')();

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();
const sale = (daysAgo, total, status) => ({ date: iso(daysAgo).slice(0, 10), createdAt: iso(daysAgo), total, status });

test('the account list carries a 30 day sales rollup', () => {
  const r = salesRollup([sale(0, 500), sale(1, 300, 'partially_refunded'), sale(10, 200), sale(40, 900), sale(0, 700, 'voided'), sale(2, 100, 'refunded')]);
  assert.strictEqual(r.orders30, 3);
  assert.strictEqual(r.sales30, 1000);
  assert.strictEqual(r.orders7, 2);
  assert.strictEqual(r.sales7, 800);
  assert.strictEqual(r.daily.length, 30);
  assert.strictEqual(r.daily[29], 500);
  assert.strictEqual(r.daily[28], 300);
  assert.ok(r.lastSaleAt);
});

test('an account with no sales rolls up to zeros', () => {
  const r = salesRollup(undefined);
  assert.deepStrictEqual([r.orders30, r.sales30, r.orders7, r.sales7, r.lastSaleAt], [0, 0, 0, 0, '']);
  assert.strictEqual(r.daily.length, 30);
});

test('the rollup carries when the business trades, by hour on its own clock', () => {
  // 04:00Z is 09:30 in Colombo (UTC+5:30)
  const at = (dayOffset, z, staff) => { const d = new Date(Date.now() - dayOffset * 86400000); return { date: d.toISOString().slice(0, 10), createdAt: d.toISOString().slice(0, 10) + z, status: 'completed', total: 100, staffId: staff }; };
  const r = salesRollup([at(0, 'T04:00:00.000Z', 'a'), at(0, 'T04:10:00.000Z', 'b'), at(1, 'T04:00:00.000Z', 'a'), at(1, 'T10:00:00.000Z', 'a')]);
  assert.strictEqual(r.hourly.orders[9], 3);
  assert.strictEqual(r.hourly.orders[15], 1);
  assert.strictEqual(r.hourly.sales[9], 300);
  assert.strictEqual(r.hourly.activeDays, 2);
  assert.strictEqual(r.hourly.sellers[9], 1.5);
  assert.strictEqual(r.hourly.orders.length, 24);
});
