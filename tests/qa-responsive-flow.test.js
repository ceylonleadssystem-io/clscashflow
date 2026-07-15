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

test('Business quote rows use a dedicated mobile card layout', function() {
  const page = read('growth.html');
  assert.match(page, /@media\(max-width:760px\)[\s\S]*table:has\(#quote-body\) tbody/);
  assert.match(page, /table:has\(#quote-body\) td:nth-child\(7\)::before\{content:"Actions"\}/);
});

test('billing actions have mobile spacing and stacked controls', function() {
  const solo = read('solo.html');
  const studio = read('starter.html');
  const platform = read('assets/platform.js');
  assert.match(solo, /settings-billing-primary-actions/);
  assert.match(studio, /settings-billing-primary-actions/);
  assert.match(platform, /cls-billing-actions\{grid-template-columns:1fr;gap:\.8rem/);
});

test('password reset provides independent show and hide controls', function() {
  const page = read('reset-password.html');
  assert.equal((page.match(/data-password-target=/g) || []).length, 2);
  assert.match(page, /input\.type = revealing \? 'text' : 'password'/);
  assert.match(page, /aria-pressed/);
});

test('Studio invoice actions use the same readable labels as Solo', function() {
  const page = read('starter.html');
  assert.match(page, />↓ PDF<\/button>/);
  assert.match(page, />✉ Email<\/button>/);
  assert.match(page, />WhatsApp<\/button>/);
  assert.match(page, /aria-label="More invoice actions">More<\/summary>/);
  assert.match(page, /grid-template-columns:repeat\(4,minmax\(60px,1fr\)\)/);
});

test('Studio transactions preserve source currency and LKR conversion', function() {
  const page = read('starter.html');
  assert.match(page, /id="t-currency"/);
  assert.match(page, /id="t-rate"/);
  assert.match(page, /id="t-conversion-preview"/);
  assert.match(page, /sourceAmount,sourceCurrency,exchangeRate/);
  assert.match(page, /formatStudioTxnAmount\(t\)/);
});

test('Business Money In and Out has responsive date, sort, and type filters', function() {
  const page = read('growth.html');
  for (const id of ['cf-from', 'cf-to', 'cf-sort', 'cf-type-filter']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
  assert.match(page, /window\.clearBusinessCashflowFilters/);
  assert.match(page, /var visible = D\.txns\.filter/);
  assert.match(page, /\.cashflow-filter-tools\{grid-template-columns:1fr\}/);
});

test('Studio payroll expenses calculate EPF and ETF and persist salaried staff', function() {
  const page = read('starter.html');
  for (const id of ['payroll-panel', 'p-staff', 'p-staff-name', 'p-gross', 'p-employee-epf-rate', 'p-employer-epf-rate', 'p-etf-rate', 'payroll-results']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
  assert.match(page, /employeeEpfRate[^\n]+8/);
  assert.match(page, /employerEpfRate[^\n]+12/);
  assert.match(page, /etfRate[^\n]+3/);
  assert.match(page, /totalEmployerCost:payrollRound\(gross\+employerEpf\+etf\)/);
  assert.match(page, /netSalary:payrollRound\(Math\.max\(0,gross-employeeEpf\)\)/);
  assert.match(page, /payrollStaff: docsFor\(DB\.payrollStaff/);
  assert.match(page, /saveCollection\('payrollStaff'/);
});

test('Studio expenses synchronize into Money Out without dashboard double counting', function() {
  const page = read('starter.html');
  assert.match(page, /function syncExpenseTransaction\(expense\)/);
  assert.match(page, /source:'expense'/);
  assert.match(page, /expenseId:expense\.id/);
  assert.match(page, /if \(ensureExpenseTransactions\(\)\) _expenseSyncPending = true/);
  assert.match(page, /DB\.expenses\.unshift\(expense\);\s*syncExpenseTransaction\(expense\)/);
  assert.match(page, /const allOut=cashOutTotal\(\)/);
  assert.match(page, /outData\.push\(cashOutTotal/);
  assert.match(page, /const totalOut=cashOutTotal\(\)/);
  assert.match(page, /item\.cat=document\.getElementById\('edit-exp-cat'\)[\s\S]*syncExpenseTransaction\(item\)/);
});
