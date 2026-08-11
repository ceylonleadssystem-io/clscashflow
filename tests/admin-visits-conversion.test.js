const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('admin visit reads order newest records before applying the limit', () => {
  const endpoint = read('netlify/functions/admin-data.js');
  assert.match(endpoint, /query = query\.orderBy\(orderField, 'desc'\)/);
  assert.match(endpoint, /query\.limit\(limit\)\.get\(\)/);
});

test('visit ranges use local calendar dates and show conversion details', () => {
  const page = read('ceylonry-admin.html');
  assert.match(page, /function localDay\(ms\)/);
  assert.match(page, /function filteredSignups\(users\)/);
  assert.match(page, /Visitors today/);
  assert.match(page, /Signed up in range/);
  assert.match(page, /Conversion rate/);
  assert.match(page, /renderVisits\(visits \|\| \[\], localStats, visibleUsers\)/);
});
