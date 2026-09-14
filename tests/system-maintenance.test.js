const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) { return fs.readFileSync(path, 'utf8'); }

test('destructive account operations create an Appwrite backup before deleting records', function() {
  const handler = read('netlify/functions/account-danger-zone.js');
  assert.match(handler, /await upsertDocument\('accountDataBackups'/);
  assert.match(handler, /for \(const row of rows\) await deleteDocument/);
});

test('operational health endpoints do not expose secrets', function() {
  const health = read('netlify/functions/health.js');
  const ready = read('netlify/functions/ready.js');
  assert.match(health, /Cache-Control': 'no-store/);
  assert.match(ready, /Authentication required/);
  assert.match(ready, /Not allowed/);
  assert.match(ready, /apiKey: !!process\.env\.APPWRITE_API_KEY/);
  assert.match(ready, /\{ ok, checks, time:/);
});

test('deployment applies baseline transport and browser security headers', function() {
  const config = read('netlify.toml');
  assert.match(config, /Strict-Transport-Security/);
  assert.match(config, /Permissions-Policy/);
  assert.match(config, /Content-Security-Policy-Report-Only/);
});

test('privileged API responses do not use wildcard CORS', function() {
  const facade = read('netlify/lib/appwrite.js');
  assert.doesNotMatch(facade, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(facade, /Vary: 'Origin'/);
});
