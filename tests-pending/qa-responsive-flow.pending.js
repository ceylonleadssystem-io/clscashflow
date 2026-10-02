// Parked: these tests describe features that are not in the current system.
// See docs/reference/test-audit.md (section C). Not run by `npm test`; move back to tests/ when the feature is decided.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

for (const file of ['solo.html', 'starter.html', 'growth.html']) {
  test(file + ' keeps sign out visible without scrolling the mobile navigation', function() {
    const page = read(file);
    assert.match(page, /class="mobile-top-sign-out"/);
    assert.match(page, /\.mobile-top-sign-out\{display:inline-flex/);
  });

  test(file + ' aligns customer report labels and numeric columns', function() {
    const page = read(file);
    assert.match(page, file === 'growth.html' ? /customer-revenue-table/ : /customer-report-table/);
    assert.match(page, /th:nth-child\(n\+2\).*td:nth-child\(n\+2\).*text-align:right!important/);
  });
}

for (const file of ['solo.html', 'starter.html']) {
  test(file + ' returns a newly saved customer to the suspended invoice draft', function() {
    const page = read(file);
    assert.match(page, /_clsReturnToInvoiceAfterCustomer=true/);
    assert.match(page, /id==='client-modal'&&window\._clsReturnToInvoiceAfterCustomer/);
    assert.match(page, /window\.fillClientFromSel\(\)/);
  });

  test(file + ' gives quote rows their own mobile labels and wrapping actions', function() {
    const page = read(file);
    assert.match(page, /document-register-table td:nth-child\(1\)::before\{content:"Document"\}/);
    assert.match(page, /table-card \.register-table tr\{display:grid;width:100%;box-sizing:border-box/);
    assert.match(page, /document-register-table \.inv-action-row\{justify-content:flex-start;flex-wrap:wrap;width:100%;max-width:none/);
  });
}

test('Business suppliers support QA-requested search, filters, sorting, balances, and aligned actions', function() {
  const page = read('growth.html');
  assert.match(page, /id="supplier-search"/);
  assert.match(page, /id="supplier-type-filter"/);
  assert.match(page, /id="supplier-sort"/);
  assert.match(page, /Highest Outstanding/);
  assert.match(page, /window\.clearSupplierFilters/);
  assert.match(page, /<th>Outstanding<\/th>/);
  assert.match(page, /display:inline-flex;gap:\.3rem;align-items:center;justify-content:flex-end/);
});

test('Business supplier payments persist paid and outstanding balances', function() {
  const page = read('growth.html');
  assert.match(page, /function supplierPaymentCapacity\(txn, existing\)/);
  assert.match(page, /supplierId:t\.supplierId \|\| ''/);
  assert.match(page, /payablePaidAmount:toNum\(s\.payablePaidAmount\)/);
  assert.match(page, /supplier\.payablePaidAmount = Math\.max\(0,/);
  assert.match(page, /supplier\.payableAmount = Math\.max\(0,/);
  assert.match(page, /Payment is higher than the supplier outstanding balance/);
  assert.match(page, /Outstanding: ['"] \+ fmt\(outstanding\) \+ ['"] · Paid: ['"] \+ fmt\(paid\)/);
  assert.match(page, /Current Outstanding Payable \(LKR\)/);
});

test('all plans use monthly bank transfer billing with receipt upload and grace period', function() {
  const platform = read('assets/platform.js');
  const onboarding = read('onboarding.html');
  const solo = read('solo.html');
  const studio = read('starter.html');
  const business = read('growth.html');
  assert.match(platform, /Ceylonry Life Care/);
  assert.match(platform, /Commercial Bank/);
  assert.match(platform, /1001069904/);
  assert.match(platform, /City Office/);
  assert.match(platform, /submit-subscription-receipt/);
  assert.match(platform, /due \+ 86400000/);
  assert.match(platform, /Trial to paid timeline/);
  assert.match(platform, /first paid month begins/i);
  assert.match(platform, /Payment opens when trial ends/);
  assert.match(platform, /clsCanDirectTrialPlanSwitch/);
  assert.match(platform, /cls-trial-ended/);
  assert.match(onboarding, /\.logo-upload-area\{[^}]*background:#f7f7f4/);
  assert.doesNotMatch(solo, /Pay Solo by Bank Transfer/);
  assert.doesNotMatch(studio, /Pay Studio by Bank Transfer/);
  assert.doesNotMatch(business, /Pay Business by Bank Transfer/);
});
