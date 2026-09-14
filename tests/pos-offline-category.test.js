const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pos-system', 'pos-system.html'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('POS registers offline support when opened directly', () => {
  assert.match(html, /navigator\.serviceWorker\.register\('\/sw\.js'\)/);
});

test('category managers are isolated for Products and Settings', () => {
  assert.match(html, /function isolateCategoryManagers\(\)/);
  assert.match(html, /inputs\[0\]\.id='new-pos-category-products'/);
  assert.match(html, /inputs\[1\]\.id='new-pos-category-settings'/);
  assert.match(html, /managers\[0\]\.id='pos-category-manager-products'/);
  assert.match(html, /managers\[1\]\.id='pos-category-manager-settings'/);
  assert.match(html, /addPosCategory=function\(location\)/);
});

test('service worker retains critical libraries after an online load', () => {
  assert.match(worker, /\/assets\/appwrite-sdk\.js/);
  assert.match(worker, /xlsx@0\.18\.5\/dist\/xlsx\.full\.min\.js/);
  assert.match(worker, /EXTERNAL_ASSETS\.includes\(url\.href\)/);
  assert.match(worker, /if\(cached\).*return cached/s);
  assert.match(worker, /return refreshed/);
});
