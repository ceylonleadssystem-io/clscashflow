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

test('premium cashflow accounts hydrate onboarding details and save settings directly', function() {
  const premium = read('premium.html');
  assert.match(premium, /function premiumProfileSettings\(profile, user\)/);
  assert.match(premium, /profile\.invoiceBiz \|\| profile\.bizName \|\| profile\.businessName/);
  assert.match(premium, /function clearPremiumBusinessRecords\(\)/);
  assert.match(premium, /if \(!loadedAnyCollection && !usedCached\) clearPremiumBusinessRecords\(\)/);
  assert.match(premium, /async function saveSettingsNow\(\)/);
  assert.match(premium, /profilePayloadFromSettings\(savedSettings\)/);
  assert.match(premium, /var saved = await saveSettingsNow\(\)/);
  assert.doesNotMatch(premium, /var saved = await saveData\(\);\n  if \(saved\) showToast\('Settings saved and synced!'/);
});

test('Appwrite Firestore shim supports Cashflow bulk workspace sync', function() {
  const compat = read('assets/appwrite-firebase-compat.js');
  const docs = read('netlify/functions/appwrite-docs.js');
  assert.match(compat, /DocRef\.prototype\.getCollections=async function/);
  assert.match(compat, /action:'bulkGet'/);
  assert.match(compat, /DocRef\.prototype\.replaceCollections=async function/);
  assert.match(compat, /action:'bulkReplace'/);
  assert.match(docs, /if\(action==='bulkGet'\)/);
  assert.match(docs, /if\(action==='bulkReplace'\)/);
  assert.match(docs, /async function replaceCollection/);
});

test('the central Ceylonry account always routes to Business', function() {
  const signin = read('signin.html');
  assert.match(signin, /accounts@ceylonrylabs\.io': 'business'/);
  assert.match(signin, /function emailDashboardPlan\(email\)/);
  assert.match(signin, /const accountPlan = emailDashboardPlan\(user\.email\)/);
  assert.match(signin, /currentPlan: accountPlan/);
});
