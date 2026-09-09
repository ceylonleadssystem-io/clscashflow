const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'pos-system', 'pos-system.html'), 'utf8');

test('core POS actions have reliable delegated handlers', () => {
  for (const action of ['openProduct', 'deleteProduct', 'openModifier', 'posDeleteModifierGroup', 'saveModifier', 'openCustomer', 'saveCustomer', 'loadOpenOrder', 'voidOpenOrder', 'openSaleAction', 'confirmSaleAction']) {
    assert.match(html, new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(html, /addEventListener\('click'.*stopImmediatePropagation/s);
});

test('legacy saved orders are normalized into the open order queue', () => {
  assert.match(html, /db\.openOrders\.forEach\(function\(order\).*if\(!order\.status\)order\.status='open'/s);
  assert.match(html, /function renderOrders\(\).*db\.openOrders\.filter\(o=>o\.status==='open'\)/s);
});

test('catalogue importer supports Excel mapping, preview, merge and template download', () => {
  assert.match(html, /xlsx\.full\.min\.js/);
  assert.match(html, /Download Ceylonry Excel Template/);
  assert.match(html, /function parseCatalogueRows\(matrix\)/);
  assert.match(html, /Square catalogue format is detected automatically/);
  assert.match(html, /Add new items and update matching SKU \/ Code/);
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'pos-system', 'assets', 'Ceylonry-POS-Catalogue-Template.xlsx')));
});

test('imported products remain editable and retain image controls', () => {
  assert.match(html, /Images can be added from Edit Item afterwards/);
  assert.match(html, /imageFit:'cover',imagePositionX:50,imagePositionY:50/);
  assert.match(html, /id="p-image-fit"/);
});

test('catalogue list and thumbnail views are mutually exclusive', () => {
  assert.match(html, /#view-products \.table-wrap\[hidden\],#product-management-grid\[hidden\]\{display:none!important\}/);
  assert.match(html, /productManagementView=mode/);
});

test('product images can be positioned by dragging the preview', () => {
  assert.match(html, /draggable-image-preview/);
  assert.match(html, /addEventListener\('pointerdown'/);
  assert.match(html, /addEventListener\('pointermove'/);
  assert.match(html, /data-image-move="0,-10"/);
  assert.match(html, /style\.setProperty\('object-position'.*'important'\)/s);
  assert.match(html, /imagePositionX:Number\.isFinite\(imageX\)\?imageX:50/);
});

test('cloud merge preserves catalogue, category and inventory deletions', () => {
  assert.match(html, /deletedIds:\{products:\[\],modifiers:\[\],inventory:\[\],categories:\[\],subcategories:\[\]\}/);
  assert.match(html, /function markDeleted\(group,id\)/);
  assert.match(html, /merged\.deletedIds\.categories/);
  assert.match(html, /deletePosCategory=function\(name\).*db\.deletedIds\.categories/s);
  assert.match(html, /window\.deletePosSubcategory=function\(id\).*db\.deletedIds\.subcategories/s);
  assert.match(html, /saveCloudSnapshotLocally/);
});

test('sync saves offline first and cannot remain stuck indefinitely', () => {
  assert.match(html, /Offline · saved on this device/);
  assert.match(html, /withSyncTimeout/);
  assert.match(html, /cloudUnsubscribe=setInterval\(pull,5000\)/);
});

test('split bill takes and records every payment separately', () => {
  assert.match(html, /function installSplitPaymentCheckout/);
  assert.match(html, /takeSplitPayment/);
  assert.match(html, /payment\.paid=true/);
  assert.match(html, /Take each split payment before completing the sale/);
});

test('modern UI is additive and offers three cached themes', () => {
  assert.match(html, /assets\/pos-modern\.css/);
  assert.match(html, /id:'ceylonry'/);
  assert.match(html, /id:'graphite'/);
  assert.match(html, /id:'sand'/);
  const css = fs.readFileSync(path.join(__dirname, '..', 'assets', 'pos-modern.css'), 'utf8');
  assert.match(css, /data-pos-theme="ceylonry"/);
  assert.match(css, /data-pos-theme="graphite"/);
  assert.match(css, /data-pos-theme="sand"/);
  assert.match(html, /id='pos-theme-settings'/);
  assert.match(html, /settings-theme-picker/);
  assert.match(html, /db\.settings\.uiTheme=id;save\(\)/);
  const worker = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.match(worker, /\/assets\/pos-modern\.css/);
});
