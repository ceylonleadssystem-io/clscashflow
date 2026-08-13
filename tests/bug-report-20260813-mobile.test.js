const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Solo and Studio preserve selected customer table mode on mobile', () => {
  for (const file of ['solo.html', 'starter.html']) {
    const page = read(file);
    assert.match(page, /#client-grid\.customer-table-wrap\{display:block!important/);
    assert.match(page, /#client-grid\.customer-table-wrap \.customer-directory-table\{display:table!important/);
    assert.match(page, /overflow-x:auto!important/);
  }
});

test('Business customer and supplier controls stack into touch-friendly mobile rows', () => {
  const page = read('growth.html');
  assert.match(page, /#view-clients \.customer-tools-main,#view-suppliers \.customer-tools-main\{display:grid;grid-template-columns:minmax\(0,1fr\)!important/);
  assert.match(page, /#view-clients \.customer-tools \.fi,#view-suppliers \.customer-tools \.fi\{width:100%;min-height:46px;font-size:16px/);
  assert.match(page, /#view-suppliers select\.fi\{appearance:auto/);
  assert.match(page, /#view-suppliers #sup-filters\{display:flex;flex-wrap:wrap/);
});

test('Business payroll table remains horizontally accessible on mobile', () => {
  const page = read('growth.html');
  assert.match(page, /#view-payroll\[data-payroll-view="table"\] \.payroll-table-wrap\{[^}]*overflow-x:auto!important/);
  assert.match(page, /#view-payroll\[data-payroll-view="table"\] \.payroll-staff-table\{display:table!important/);
  assert.match(page, /position:sticky;left:0/);
});
