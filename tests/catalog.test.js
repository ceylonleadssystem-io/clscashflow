const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Products & Services is directly below Invoices in all three navigation menus', () => {
  const plans = [
    ['solo.html', 'data-nav="invoices"', 'data-nav="catalog"'],
    ['starter.html', 'data-nav="invoices"', 'data-nav="catalog"'],
    ['growth.html', 'data-view="invoices"', 'data-view="catalog"']
  ];
  for (const [file, invoices, catalog] of plans) {
    const html = read(file);
    const invoicePos = html.indexOf(invoices);
    const catalogPos = html.indexOf(catalog);
    assert.ok(invoicePos >= 0 && catalogPos > invoicePos, `${file} includes catalog after invoices`);
    assert.ok(catalogPos - invoicePos < 220, `${file} keeps catalog immediately beneath invoices`);
  }
});

test('Solo receives the limited catalog and Studio and Business receive the full catalog', () => {
  assert.match(read('solo.html'), /root:'#solo-catalog-root',level:'basic'/);
  assert.match(read('starter.html'), /root:'#studio-catalog-root',level:'full'/);
  assert.match(read('growth.html'), /root:'#business-catalog-root',level:'business'/);
  const module = read('assets/catalog.js');
  assert.match(module, /Solo Basic supports up to 30 active catalog items/);
  assert.match(module, /Export CSV/);
  assert.match(module, /Import CSV/);
  assert.match(module, /Product &amp; Service Performance/);
});

test('catalog records persist per tenant and invoice lines retain catalog snapshots', () => {
  for (const file of ['solo.html', 'starter.html']) {
    const html = read(file);
    assert.match(html, /saveCollection\('catalog', DB\.catalog \|\| \[\]\)/, `${file} saves catalog collection`);
    assert.match(html, /DB\.catalog = results\[4\]\.docs\.map/, `${file} loads catalog collection`);
    assert.match(html, /catalogItemId.*itemType.*itemName.*itemCode.*billingUnit.*taxRate/s, `${file} stores line snapshots`);
  }
  const business = read('growth.html');
  assert.match(business, /catalog: D\.catalog/);
  assert.match(business, /'quotes','catalog','clients'/);
  assert.match(business, /Object\.assign\(\{\},it,\{desc:/, 'Business normalization preserves catalog snapshot fields');
});

test('invoice, quote and estimate editors can browse the shared catalog on every plan', () => {
  for (const file of ['solo.html', 'starter.html', 'growth.html']) {
    const html = read(file);
    assert.match(html, /Browse Products &amp; Services/, `${file} exposes the selector in its shared document editor`);
    assert.match(html, /openCatalogSelector/, `${file} wires the selector`);
  }
  const module = read('assets/catalog.js');
  assert.match(module, /Saved documents retain their original item details/);
  assert.match(module, /catalogItemId:i\.id/);
});

test('catalog switches to mobile cards instead of forcing a horizontal page scroll', () => {
  const css = read('assets/catalog.css');
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /\.cls-cat-table-wrap\{display:none\}/);
  assert.match(css, /\.cls-cat-mobile\{display:grid/);
  assert.match(css, /\.cls-cat-form,\.cls-cat-choice\{grid-template-columns:1fr\}/);
});

test('landing page clearly describes the catalog differences between plans', () => {
  const landing = read('index.html');
  assert.match(landing, /Basic Products &amp; Services catalog <strong>\(up to 30 active items\)<\/strong>/);
  assert.match(landing, /Full Products &amp; Services catalog with CSV tools and performance insights/);
  assert.match(landing, /Full catalog analytics with team activity audit/);
  assert.match(landing, /Products &amp; Services Catalog/);
  assert.match(landing, /CSV \+ performance \+ team audit/);
});

test('product and service forms provide ready-made categories and comma-formatted amounts', () => {
  const module = read('assets/catalog.js');
  assert.match(module, /General Products.*Digital Products.*Equipment.*Materials/);
  assert.match(module, /General Services.*Consulting.*Professional Services.*Technology & IT/);
  assert.match(module, /id="cat-category-select"/);
  assert.match(module, /Create new category/);
  assert.match(module, /id="cat-category-new"/);
  assert.match(module, /Select an existing category or create a new one/);
  assert.match(module, /data-cat-money="true"/);
  assert.match(module, /toLocaleString\('en-US'\)/);
});
