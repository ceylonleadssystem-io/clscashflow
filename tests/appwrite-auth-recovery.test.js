const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const compat = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'appwrite-firebase-compat.js'),
  'utf8'
);
const pos = fs.readFileSync(
  path.join(__dirname, '..', 'pos-system', 'pos-system.html'),
  'utf8'
);

test('Appwrite document requests use a short-lived authenticated JWT', () => {
  assert.match(compat, /account\.createJWT\(\)/);
  assert.match(compat, /h\.Authorization='Bearer '/);
  assert.match(compat, /appwrite-docs/);
});

test('Appwrite password recovery uses the configured application URL', () => {
  assert.match(compat, /account\.createRecovery\(email,location\.origin\+'\/reset-password\.html'\)/);
});

test('POS stops cloud polling after confirmed session expiry', () => {
  assert.match(pos, /onAuthStateChanged\(function\(user\).*if\(syncTimer\).*clearInterval\(syncTimer\).*if\(cloudUnsubscribe\).*clearInterval\(cloudUnsubscribe\)/s);
  assert.match(pos, /Sign in again to resume cloud sync\. Changes on this device are preserved/);
});
