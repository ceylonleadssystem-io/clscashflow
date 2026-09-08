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
