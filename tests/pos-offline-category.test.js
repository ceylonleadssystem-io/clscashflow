const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('service worker retains critical libraries after an online load', () => {
  assert.match(worker, /\/assets\/appwrite-sdk\.js/);
  assert.match(worker, /xlsx@0\.18\.5\/dist\/xlsx\.full\.min\.js/);
  assert.match(worker, /EXTERNAL_ASSETS\.includes\(url\.href\)/);
  assert.match(worker, /if\(cached\).*return cached/s);
  assert.match(worker, /return refreshed/);
});

