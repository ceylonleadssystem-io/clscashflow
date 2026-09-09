const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const compat = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'supabase-firebase-compat.js'),
  'utf8'
);
const pos = fs.readFileSync(
  path.join(__dirname, '..', 'pos-system', 'pos-system.html'),
  'utf8'
);

test('document authorization failures force a fresh Supabase session', () => {
  assert.match(compat, /res\.status === 401 \|\| res\.status === 403/);
  assert.match(compat, /await forceRefreshAccessToken\(\)/);
  assert.doesNotMatch(compat, /if \(res\.status === 401\) \{\s*await restoreSessionFromBackup/);
});

test('a rejected refresh is not retried forever from the same backup', () => {
  assert.match(compat, /sessionBackupRejected = true/);
  assert.match(compat, /clearSessionBackup\(\)/);
  assert.match(compat, /auth\/session-expired/);
});

test('POS stops cloud polling after confirmed session expiry', () => {
  assert.match(pos, /onAuthStateChanged\(function\(user\).*if\(syncTimer\).*clearInterval\(syncTimer\).*if\(cloudUnsubscribe\).*clearInterval\(cloudUnsubscribe\)/s);
  assert.match(pos, /Sign in again to resume cloud sync\. Changes on this device are preserved/);
});
