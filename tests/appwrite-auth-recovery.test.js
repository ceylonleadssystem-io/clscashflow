const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const compat = fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'appwrite-compat.js'),
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

