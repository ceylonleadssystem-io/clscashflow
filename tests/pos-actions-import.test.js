const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('POS landing page offers a hardware cart and emailed order form', () => {
  const landing = fs.readFileSync(path.join(__dirname, '..', 'pos.html'), 'utf8');
  const orderApi = fs.readFileSync(path.join(__dirname, '..', 'netlify', 'functions', 'hardware-order.js'), 'utf8');
  for (const model of ['Ceylonry POS Lite', 'Ceylonry POS Lite · Black', 'Ceylonry POS Pro · White', 'Ceylonry POS Pro · Black']) {
    assert.match(landing, new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(landing, /Receipt Printer/);
  assert.equal((landing.match(/data-hardware-id=/g) || []).length, 7);
  assert.match(landing, /id="hardware-order-form"/);
  for (const field of ['name', 'email', 'mobile', 'address']) assert.match(landing, new RegExp(`name="${field}"`));
  assert.match(landing, /Have something else you want to add\?/);
  assert.match(landing, /id="hardware-add-more"/);
  assert.match(landing, /scrollIntoView\(\{behavior:'smooth',block:'start'\}\)/);
  assert.match(landing, /\.netlify\/functions\/hardware-order/);
  assert.match(orderApi, /to: 'hello@ceylonrylabs\.io'/);
  assert.match(orderApi, /Delivery address:/);
  assert.match(orderApi, /items\.reduce/);
  for (const image of ['hw-lite.jpg', 'hw-lite-black.jpg', 'hw-pro-white.jpg', 'hw-pro-black.jpg', 'hw-printer.jpg', 'hw-barcode-wired.jpg', 'hw-barcode-wireless.jpg', 'ceylonry-pos-lite-industries.jpg']) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', image)));
    assert.match(landing, new RegExp(`assets/${image}`));
  }
});

