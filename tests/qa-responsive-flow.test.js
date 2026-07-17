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

test('Studio manual Money Out records synchronize back into Expenses', function() {
  const page = read('starter.html');
  assert.match(page, /function transactionExpenseFields\(txn\)/);
  assert.match(page, /source:'transaction'/);
  assert.match(page, /sourceTransactionId:txn\.id/);
  assert.match(page, /function syncTransactionExpense\(txn\)/);
  assert.match(page, /if\(txn\.type!==['"]out['"]\)[\s\S]*DB\.expenses=DB\.expenses\.filter/);
  assert.match(page, /if \(ensureTransactionExpenses\(\)\) _expenseSyncPending = true/);
  assert.match(page, /DB\.transactions\.unshift\(transaction\);\s*syncTransactionExpense\(transaction\)/);
});

test('Studio expense modal opens defensively and historical backlog dates are normalized', function() {
  const page = read('starter.html');
  assert.match(page, /window\.openExpenseModal=function openExpenseModal\(\)\{[\s\S]*window\.openModal\('exp-modal'\)/);
  assert.match(page, /window\.updatePayrollCalculation=function updatePayrollCalculation\(\)\{\s*const payroll=\(document\.getElementById\('e-cat'\)\|\|\{\}\)\.value==='Payroll';/);
  assert.match(page, /function backlogDateValue\(log\)/);
  assert.match(page, /log\.editedAt\|\|log\.date\|\|log\.createdAt\|\|log\.timestamp/);
  assert.match(page, /DB\.editBacklog\.sort\(\(a,b\) => backlogDateValue\(b\) - backlogDateValue\(a\)\)/);
  assert.match(page, /const logs=\[\.\.\.\(DB\.editBacklog\|\|\[\]\)\]\.sort\(function\(a,b\)\{return backlogDateValue\(b\)-backlogDateValue\(a\);\}\)/);
});

test('Business report PDF waits for charts and replaces canvases with captured images', function() {
  const page = read('growth.html');
  assert.match(page, /window\.exportReportPDF = async function exportReportPDF\(\)/);
  assert.match(page, /await loadChartLibrary\(\)/);
  assert.match(page, /requestAnimationFrame\(function\(\) \{\s*requestAnimationFrame/);
  assert.match(page, /CH\[key\]\.update\('none'\)/);
  assert.match(page, /sourceCanvases\[idx\]\.toDataURL\('image\/png'\)/);
  assert.match(page, /canvas\.replaceWith\(img\)/);
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

for (const file of ['solo.html', 'starter.html', 'growth.html']) {
  test(file + ' applies default payment notes to new invoices and customer messages', function() {
    const page = read(file);
    if (file === 'growth.html') {
      assert.match(page, /setFieldValue\('inv-notes', D\.settings\.footer \|\| ''\)/);
      assert.match(page, /function combinedInvoiceNotesBusiness\(primary, fallback\)/);
      assert.match(page, /Payment details \/ notes:\\n/);
      assert.match(page, /notes: combinedInvoiceNotesBusiness\(inv\.notes, D\.settings\.footer\)/);
    } else {
      assert.match(page, /defaultNotes\.value=DB\.settings\.footer\|\|''/);
      assert.match(page, /function combinedInvoiceNotes\(primary,fallback\)/);
      assert.match(page, /Payment details \/ notes:\\n/);
      assert.match(page, /notes:combinedInvoiceNotes\(inv\.notes,s\.footer\)/);
    }
  });
}

test('plan user limits are displayed consistently and enforced by team access', function() {
  const platform = read('assets/platform.js');
  const landing = read('index.html');
  const onboarding = read('onboarding.html');
  const access = read('access-admin.html');

  assert.match(platform, /solo:\s*\{[\s\S]*?userLimit:\s*1[\s\S]*?userLabel:\s*'1 user only'/);
  assert.match(platform, /studio:\s*\{[\s\S]*?userLimit:\s*5[\s\S]*?userLabel:\s*'Up to 5 users'/);
  assert.match(platform, /business:\s*\{[\s\S]*?userLimit:\s*Infinity[\s\S]*?userLabel:\s*'Unlimited users'/);
  assert.match(landing, /<td>Users<\/td><td><strong>1 user only<\/strong><\/td><td><strong>Up to 5 users<\/strong><\/td><td><strong>Unlimited users<\/strong><\/td>/);
  assert.match(onboarding, /<td>Users<\/td><td><strong>1 user only<\/strong><\/td><td><strong>Up to 5 users<\/strong><\/td><td><strong>Unlimited users<\/strong><\/td>/);
  assert.match(access, /var used = 1 \+ activeCount \+ pendingCount;/);
  assert.match(access, /if\(s\.full\)\{[\s\S]*?btn\.disabled = true;/);
});

test('Solo mobile invoice More actions expand inside the invoice card', function() {
  const page = read('solo.html');
  assert.match(page, /\.invoice-more\[open\]\{grid-column:1\/-1;height:auto\}/);
  assert.match(page, /\.invoice-more-menu\{position:static;width:100%;margin-top:\.35rem;box-shadow:none\}/);
  assert.match(page, /td:has\(\.invoice-more\[open\]\)\{overflow:visible!important\}/);
});

test('Business mobile data tables scroll instead of crushing their columns', function() {
  const page = read('growth.html');
  for (const bodyId of ['cf-body', 'exp-body', 'sup-body', 'team-body', 'backlog-body', 'an-cli']) {
    assert.match(page, new RegExp('class="table-wrap"[\\s\\S]{0,1800}id="' + bodyId + '"'));
  }
  assert.match(page, /\.table-wrap\{width:100%;max-width:100%;overflow-x:auto/);
  assert.match(page, /\.card table:not\(\.invoice-table\)\{min-width:720px;table-layout:auto\}/);
  assert.doesNotMatch(page, /\.table-wrap\{overflow-x:hidden\}/);
});

test('Business mobile modal actions remain above the bottom navigation', function() {
  const page = read('growth.html');
  assert.match(page, /\.mo\{inset:0 0 74px;align-items:flex-end;padding:\.5rem;z-index:650\}/);
  assert.match(page, /max-height:calc\(100dvh - 74px - 1rem\)/);
  assert.match(page, /\.mo-bd\{padding:1rem;overflow-y:auto;min-height:0;overscroll-behavior:contain\}/);
  assert.match(page, /\.mo-ft\{position:static;flex:0 0 auto;/);
  assert.match(page, /#mo-inv \.invoice-mob\{height:calc\(100dvh - 74px - 1rem\);max-height:calc\(100dvh - 74px - 1rem\)/);
});

test('onboarding captures optional bank details for invoice defaults', function() {
  const page = read('onboarding.html');
  for (const id of ['s4-bank-name', 's4-bank-account-name', 's4-bank-account-number', 's4-bank-branch']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
  assert.match(page, /bankName: state\.bankName/);
  assert.match(page, /bankAccountName: state\.bankAccountName/);
  assert.match(page, /bankAccountNumber: state\.bankAccountNumber/);
  assert.match(page, /bankBranch: state\.bankBranch/);
  assert.match(page, /id="invoice-preview-bank-block"/);
});

for (const file of ['solo.html', 'starter.html']) {
  test(file + ' stores optional bank details in invoice settings', function() {
    const page = read(file);
    for (const id of ['set-bank-name', 'set-bank-account-name', 'set-bank-account-number', 'set-bank-branch']) {
      assert.match(page, new RegExp('id="' + id + '"'));
    }
    assert.match(page, /settings\.bankName=document\.getElementById\('set-bank-name'\)\.value\.trim\(\)/);
    assert.match(page, /settings\.bankAccountNumber=document\.getElementById\('set-bank-account-number'\)\.value\.trim\(\)/);
  });
}

test('Business stores optional bank details in invoice settings', function() {
  const page = read('growth.html');
  for (const id of ['s-bank-name', 's-bank-account-name', 's-bank-account-number', 's-bank-branch']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
  assert.match(page, /settings\.bankName = document\.getElementById\('s-bank-name'\)\.value\.trim\(\)/);
  assert.match(page, /settings\.bankAccountNumber = document\.getElementById\('s-bank-account-number'\)\.value\.trim\(\)/);
});

test('shared invoice outputs render bank details only for invoices', function() {
  const platform = read('assets/platform.js');
  assert.match(platform, /function invoiceBankRows\(settings\)/);
  assert.match(platform, /function invoiceBankEmailHtml\(settings\)/);
  assert.match(platform, /documentLabel === 'Invoice' \? invoiceBankRows\(s\) : \[\]/);
  assert.match(platform, /class="bank-details"/);
  assert.match(platform, /var bankHtml = invoiceBankEmailHtml\(opts\.settings \|\| opts\)/);
});

test('public invoice page receives bank details from the sanitized snapshot', function() {
  const page = read('invoice-public.html');
  const share = read('netlify/lib/invoice-share.js');
  for (const field of ['bankName', 'bankAccountName', 'bankAccountNumber', 'bankBranch']) {
    assert.match(page, new RegExp(field + ':data\\.' + field));
    assert.match(share, new RegExp(field + ': text\\('));
  }
});
