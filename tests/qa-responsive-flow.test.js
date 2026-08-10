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

test('Business invoice responsive cards reset desktop percentage column widths', function() {
  const page = read('growth.html');
  assert.match(page, /#view-invoices \.invoice-table th,#view-invoices \.invoice-table td[^}]+width:auto!important;max-width:none!important/);
  assert.match(page, /overflow-wrap:break-word;word-break:normal/);
});

test('invoice creation wizard stays mobile-only and restores the full desktop form', function() {
  const platform = read('assets/platform.js');
  const css = read('assets/editorial-app.css');
  assert.match(platform, /if \(!window\.matchMedia \|\| !window\.matchMedia\('\(max-width:760px\)'\)\.matches\) return;/);
  assert.match(platform, /if \(!isMobile\) \{[\s\S]*node\.hidden = false;[\s\S]*nav\.hidden = true;/);
  assert.match(platform, /invoiceWizardMedia\.addEventListener\('change', syncInvoiceWizard\)/);
  assert.match(css, /\.cls-invoice-wizard-nav\[hidden\].*display:none!important/);
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

test('Studio payroll Cash Out calculates EPF and ETF and persists salaried staff', function() {
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
  assert.match(page, /id="t-type" onchange="window\.handleTransactionPayrollChange\(\)"/);
  assert.match(page, /id="t-cat" onchange="window\.handleTransactionPayrollChange\(\)"/);
  assert.match(page, /const payroll=\(document\.getElementById\('t-type'\)\|\|\{\}\)\.value==='out'/);
  assert.match(page, /payroll=Object\.assign\(\{staffId:payrollStaffId,staffName,epfNo\},calc\)/);
  assert.match(page, /payroll:txn\.payroll\|\|null/);
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

test('Studio dashboard combines invoice, expense, and cash position metrics', function() {
  const page = read('starter.html');
  for (const id of ['kpi-month-expenses', 'kpi-net-cash', 'cashflow-chart', 'exp-chart']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
  assert.match(page, /const monthExpenses=cashOutTotal\(monthPredicate\)/);
  assert.match(page, /const netCash=recordedIncome-recordedOut/);
  assert.match(page, /cfChart=new Chart\(ctx1/);
});

test('Studio financial reports include expenses, cash position, and monthly performance', function() {
  const page = read('starter.html');
  for (const id of ['expense-report', 'cash-position-report', 'expense-category-table', 'monthly-performance-table']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
  assert.match(page, /const cashOut=cashOutTotal\(function\(item\)\{return inRange\(item\.date\);\}\)/);
  assert.match(page, /Invoice Collection Rate/);
  assert.match(page, /Supplier-linked Spend/);
  assert.match(page, /<h3>Expense Summary<\/h3>/);
  assert.match(page, /<div class="sec-title">Monthly Performance<\/div>/);
});

test('Studio Business Insights renders decision metrics and live charts', function() {
  const page = read('starter.html');
  for (const id of ['insight-metrics', 'insight-performance-chart', 'insight-expense-chart', 'insight-snapshot']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
  assert.match(page, /Business Position/);
  assert.match(page, /positionScore/);
  assert.match(page, /function buildInsightCharts\(\)/);
  assert.match(page, /label:'Cash Collected'/);
  assert.match(page, /label:'Expenses'/);
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
  assert.match(page, /window\.updatePayrollCalculation=function updatePayrollCalculation\(\)\{\s*const payroll=\(document\.getElementById\('t-type'\)\|\|\{\}\)\.value==='out'/);
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

test('Business payroll can disable EPF and ETF per employee', function() {
  const page = read('growth.html');
  assert.match(page, /id="payroll-statutory" checked/);
  assert.match(page, /statutoryEnabled=person\.statutoryEnabled!==false/);
  assert.match(page, /statutoryEnabled\?basic\*\.08:0/);
  assert.match(page, /statutoryEnabled:document\.getElementById\('payroll-statutory'\)\.checked/);
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
  assert.doesNotMatch(access, /if \(window\.clsRememberPlan\) await window\.clsRememberPlan/);
  assert.match(access, /renderTeamState\(\[\], \[\]\);/);
  assert.match(access, /loadTeam\(\)\.catch/);
  assert.match(access, /function withTeamTimeout\(promise, label\)/);
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
  assert.match(page, /out\.bankName = src\.bankName \|\| src\.bank \|\| out\.bankName \|\| ''/);
  assert.match(page, /out\.bankAccountNumber = src\.bankAccountNumber \|\| src\.accountNumber \|\| out\.bankAccountNumber \|\| ''/);
  assert.match(page, /window\.saveSettings = async function saveSettings\(\)/);
  assert.match(page, /var saved = await saveData\(\)/);
});

test('shared invoice outputs render bank details only for invoices', function() {
  const platform = read('assets/platform.js');
  assert.match(platform, /function invoiceBankRows\(settings\)/);
  assert.match(platform, /function invoiceBankEmailHtml\(settings\)/);
  const rendererCount = (platform.match(/window\.clsBuildInvoicePrintHtml = function/g) || []).length;
  const bankBlockCount = (platform.match(/var bankRows = documentLabel === 'Invoice' \? invoiceBankRows\(s\) : \[\]/g) || []).length;
  assert.equal(bankBlockCount, rendererCount, 'every invoice renderer must prepare its own bank details block');
  assert.match(platform, /class="bank-details"/);
  assert.match(platform, /var bankHtml = invoiceBankEmailHtml\(opts\.settings \|\| opts\)/);
  assert.match(platform, /bank_details_html: emailJsBankDetailsHtml\(settings\)/);
  assert.match(platform, /bank_account_number: settings\.bankAccountNumber/);
});

test('settings preview and PDF share one renderer and preserve empty notes', function() {
  const platform = read('assets/platform.js');
  const pages = ['solo.html', 'starter.html', 'growth.html'].map(read);
  assert.match(platform, /clsBuildInvoicePreviewFrame/);
  assert.match(platform, /var html = window\.clsBuildInvoicePrintHtml\(opts\)/);
  assert.match(platform, /Object\.prototype\.hasOwnProperty\.call\(inv, 'notes'\)/);
  assert.match(platform, /var notesHtml = note \?/);
  assert.equal((platform.match(/window\.clsBuildInvoicePrintHtml = function/g) || []).length, 1);
  assert.match(platform, /\^thank you for your business/);
  pages.forEach(function(page) {
    assert.match(page, /clsBuildInvoicePrintHtml/);
    assert.match(page, /clsBuildInvoicePreviewFrame/);
    assert.match(page, /\.cls-invoice-preview-frame\{[^}]*width:794px[^}]*height:1123px/);
  });
  assert.match(pages[0], /DB\.settings\.footer=document\.getElementById\('set-footer'\)\.value\.trim\(\)/);
  assert.match(pages[1], /DB\.settings\.footer=document\.getElementById\('set-footer'\)\.value\.trim\(\)/);
  assert.match(pages[2], /D\.settings\.footer = document\.getElementById\('s-footer'\)\.value\.trim\(\)/);
});

test('mobile downloads and native sharing use the same branded A4 invoice renderer', function() {
  const platform = read('assets/platform.js');
  const solo = read('solo.html');
  const studio = read('starter.html');
  const business = read('growth.html');
  assert.match(platform, /window\.clsBuildBrandedInvoicePdfFile/);
  assert.match(platform, /window\.clsBuildInvoicePrintHtml\(options\)/);
  assert.match(platform, /html2canvas\(page/);
  assert.match(platform, /format:'a4'/);
  assert.match(platform, /pdf\.addImage\(canvas\.toDataURL\('image\/jpeg'/);
  for (const page of [solo, studio, business]) {
    assert.match(page, /clsBuildBrandedInvoicePdfFile/);
    assert.match(page, /previewOptions/);
  }
  assert.match(business, /inv\.tpl != null \? inv\.tpl : D\.settings\.defaultTpl/);
});

test('invoice email line items and bank details are phone-safe presentation tables', function() {
  const platform = read('assets/platform.js');
  assert.match(platform, /colspan="4" style="padding:0 0 10px/);
  assert.match(platform, /Invoice items/);
  assert.match(platform, /table-layout:fixed/);
  assert.match(platform, /var itemRows = paymentEmailLineRows\(lines, cur, amountDue\)/);
  assert.doesNotMatch(platform, /display:flex;justify-content:space-between;gap:18px;padding:4px 0;font-size:13px/);
});

test('all application pages load the current invoice renderer without stale caching', function() {
  const version = '20260810-mobile-wizard1';
  const pages = [
    'solo.html', 'starter.html', 'growth.html', 'onboarding.html',
    'index.html', 'premium.html', 'starter_3.html', 'invoice-public.html',
    'access-admin.html', 'ceylonry-admin.html', 'mrs-gamage-story.html',
    'privacy.html', 'terms.html'
  ];
  for (const file of pages) {
    assert.match(read(file), new RegExp('assets/platform\\.js\\?v=' + version));
  }

  const netlify = read('netlify.toml');
  assert.match(netlify, /for = "\/assets\/platform\.js"[\s\S]*Cache-Control = "public, max-age=0, must-revalidate"/);
});

test('public invoice page receives bank details from the sanitized snapshot', function() {
  const page = read('invoice-public.html');
  const share = read('netlify/lib/invoice-share.js');
  for (const field of ['bankName', 'bankAccountName', 'bankAccountNumber', 'bankBranch']) {
    assert.match(page, new RegExp(field + ':data\\.' + field));
    assert.match(share, new RegExp(field + ': text\\('));
  }
});

test('customer directories provide search, filters, sorting, clear controls, and grid/table views', function() {
  ['solo.html', 'starter.html'].forEach(function(file) {
    const page = read(file);
    assert.match(page, /id="customer-search"/);
    assert.match(page, /id="customer-sort"/);
    assert.match(page, /data-customer-filter="unpaid"/);
    assert.match(page, /data-customer-filter="high-value"/);
    assert.match(page, /setCustomerView\('table'\)/);
    assert.match(page, /clearCustomerFilters/);
    assert.match(page, /function clientDirectoryMetrics/);
  });
  const business = read('growth.html');
  assert.match(business, /id="business-customer-search"/);
  assert.match(business, /id="business-customer-sort"/);
  assert.match(business, /data-business-customer-filter="unpaid"/);
  assert.match(business, /setBusinessCustomerView\('table'\)/);
  assert.match(business, /clearBusinessCustomerFilters/);
});

test('Studio exposes only the lightweight Cash Out payroll workflow', function() {
  const page = read('starter.html');
  assert.doesNotMatch(page, /data-nav="payroll"/);
  assert.doesNotMatch(page, /id="view-payroll"/);
  assert.match(page, /if\(view==='payroll'\) view='cashflow'/);
  assert.match(page, /id="payroll-staff-modal" hidden/);
  assert.match(page, /id="salary-paid-modal" hidden/);
  assert.match(page, /id="statutory-settlement-modal" hidden/);
  assert.match(page, /Small Payroll Calculator/);
  assert.match(page, /future payroll Cash Out entries/);
});

test('Business includes the full staff and payroll workflow', function() {
  const page = read('growth.html');
  assert.match(page, /data-view="payroll"/);
  assert.match(page, /id="view-payroll"/);
  assert.match(page, /id="mo-payroll"/);
  assert.match(page, /id="mo-payroll-pay"/);
  assert.match(page, /function businessPayrollCalc/);
  assert.match(page, /window\.savePayrollStaff/);
  assert.match(page, /window\.commitPayrollPayment/);
  assert.match(page, /window\.deletePayrollStaff/);
  assert.match(page, /payrollStaffId:p\.id/);
  assert.match(page, /staff: clonePlain\(D\.staff/);
  assert.match(page, /staff: D\.staff/);
  assert.match(page, /'payables','staff','editLog'/);
});

test('invoice notifications can be dismissed individually across all plans', function() {
  const platform = read('assets/platform.js');
  assert.match(platform, /cls-notify-dismiss/);
  assert.match(platform, /cls-notifications-dismissed-/);
  assert.match(platform, /data-notification-id/);
  assert.match(platform, /safeSet\(dismissKey, JSON\.stringify\(dismissed\.slice\(-200\)\)\)/);
  ['solo.html', 'starter.html', 'growth.html'].forEach(function(file) {
    assert.match(read(file), /assets\/platform\.js/);
  });
});

test('payroll and customer controls remain usable on mobile', function() {
  ['solo.html', 'starter.html'].forEach(function(file) {
    const page = read(file);
    assert.match(page, /customer-tools-main\{grid-template-columns:1fr 1fr\}/);
    assert.match(page, /customer-search\{grid-column:1\/-1\}/);
  });
  const studio = read('starter.html');
  assert.match(studio, /\.payroll-results\{grid-template-columns:1fr\}/);
  assert.match(studio, /\.modal-box\{max-width:none;width:100%;max-height:94dvh/);
});

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

test('payslip email endpoint sends a PDF attachment', function() {
  const fn = read('netlify/functions/send-payslip.js');
  assert.match(fn, /const nodemailer = require\('nodemailer'\)/);
  assert.match(fn, /attachments:\s*\[\{/);
  assert.match(fn, /contentType: 'application\/pdf'/);
  assert.match(fn, /content: pdfBuffer/);
  assert.match(fn, /pdfBuffer\.length > 4000000/);
});

test('admin dashboard loads quickly without presenting failed requests as zero data', function() {
  const page = read('ceylonry-admin.html');
  const endpoint = read('netlify/functions/admin-data.js');
  const database = read('netlify/lib/supabase.js');
  assert.match(page, /id="data-status"/);
  assert.match(page, /ADMIN_REQUEST_TIMEOUT_MS = 15000/);
  assert.match(page, /sessionStorage\.getItem\(ADMIN_CACHE_KEY\)/);
  assert.match(page, /Showing saved data while checking for updates/);
  assert.match(page, /textContent = '—'/);
  assert.match(page, /if \(cached \|\| adminHasData\)/);
  assert.match(endpoint, /const initialRows = await Promise\.all\(/);
  assert.doesNotMatch(endpoint, /const totals = await Promise\.all\(/);
  assert.match(endpoint, /readChats\(db, false\)/);
  assert.doesNotMatch(endpoint, /paymentRequestsPromise/);
  assert.match(database, /\.select\('id', \{ count: 'exact', head: true \}\)/);
});

test('public demos use fictional data and expose only Business from the landing page', function() {
  const landing = read('index.html');
  const story = read('mrs-gamage-story.html');
  const solo = read('solo.html');
  const studio = read('starter.html');
  const business = read('growth.html');

  for (const page of [landing, solo, studio, business]) {
    assert.doesNotMatch(page, /Pasan Yasas|pasan@example/i);
  }
  assert.match(solo, /Show me around/);
  assert.match(studio, /Show me around/);
  assert.match(solo, /setTimeout\(function\(\)\{ window\.startSystemTour\(\); \}, 700\)/);
  assert.match(studio, /setTimeout\(function\(\)\{ window\.startSystemTour\(\); \}, 700\)/);
  assert.match(business, /var BUSINESS_DEMO_MODE = new URLSearchParams/);
  assert.match(business, /function initBusinessDemoMode\(\)/);
  assert.match(business, /window\.startBusinessTour\(\)/);
  assert.match(landing, /growth\.html\?demo=1/);
  assert.doesNotMatch(landing, /starter\.html\?demo=1/);
  assert.doesNotMatch(story, /(?:starter|growth)\.html\?demo=1/);
});

test('all three plan dashboards greet the signed-in user by first name and local time', function() {
  const platform = read('assets/platform.js');
  const solo = read('solo.html');
  const studio = read('starter.html');
  const business = read('growth.html');

  assert.match(platform, /window\.clsUpdateTimeGreeting/);
  assert.match(platform, /hour < 12 \? 'Good morning' : hour < 17 \? 'Good afternoon' : 'Good evening'/);
  assert.match(platform, /profile\.firstName \|\| profile\.givenName/);
  assert.match(solo, /id="solo-greet-h"/);
  assert.match(solo, /clsUpdateTimeGreeting\('solo-greet-h',_profile,_auth\.currentUser,'there'\)/);
  assert.match(studio, /id="studio-greet-h"/);
  assert.match(studio, /clsUpdateTimeGreeting\('studio-greet-h',_profile,_auth\.currentUser,'there'\)/);
  assert.match(business, /id="greet-h"/);
  assert.match(business, /clsUpdateTimeGreeting\('greet-h',_profile,_fauth\.currentUser,'there'\)/);
});

test('Team Access shares the editorial UI and uses cached parallel loading', function() {
  const page = read('access-admin.html');
  assert.match(page, /editorial-app\.css\?v=20260801-team/);
  assert.match(page, /TEAM_REQUEST_TIMEOUT = 3000/);
  assert.match(page, /if\(cached\) renderTeamState\(cached\.members, cached\.pending\)/);
  assert.match(page, /var reads = await Promise\.all\(/);
});

test('Business payroll provides consolidated PDF and individual PDF email actions', function() {
  const page = read('growth.html');
  assert.match(page, /downloadMonthlyPayrollReport/);
  assert.match(page, /CONSOLIDATED MONTHLY PAYROLL/);
  assert.match(page, /downloadPayrollPayslip/);
  assert.match(page, /emailPayrollPayslip/);
  assert.match(page, /\.netlify\/functions\/send-payslip/);
  assert.match(page, /D\.settings\.logo/);
});

test('Business expenses can be viewed and exported by date range', function() {
  const page = read('growth.html');
  assert.match(page, /id="exp-from"/);
  assert.match(page, /id="exp-to"/);
  assert.match(page, /businessVisibleExpenses/);
  assert.match(page, /clearBusinessExpenseFilters/);
  assert.match(page, /businessVisibleExpenses\(\)\.forEach/);
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

test('admin console is compact, searchable, payment-aware, and date-maps visits', function() {
  const page=read('ceylonry-admin.html');
  const api=read('netlify/functions/admin-data.js');
  assert.match(page,/id="user-search"/);
  assert.match(page,/admin-action-menu/);
  assert.match(page,/id="receipt-grid"/);
  assert.match(page,/id="chat-status-filter"/);
  assert.match(page,/Archived chats/);
  assert.match(page,/id="visit-from"/);
  assert.match(page,/renderVisitMap/);
  assert.match(page,/Difference paid & apply/);
  assert.match(api,/applyTicketPlanChange/);
  assert.match(api,/accountPaused:true,paid:false,subscriptionStatus:'paused'/);
  assert.match(api,/admin\.auth\(\)\.deleteUser/);
});
