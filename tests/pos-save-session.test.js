const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'pos-system', 'pos-system.html'),
  'utf8'
);

test('refreshing the business-login URL never invalidates an authenticated session', () => {
  assert.match(source, /var requireFreshBusinessLogin=false/);
  assert.doesNotMatch(source, /if\(requireFreshBusinessLogin\).*firebase\.auth\(\)\.signOut/s);
});

test('only explicit business logout signs out of Supabase', () => {
  assert.match(source, /businessLogout=async function\(\).*firebase\.auth\(\)\.signOut\(\)/s);
});

test('POS saves locally and immediately queues cloud persistence', () => {
  assert.match(source, /localStorage\.setItem\(storageKey,json\)/);
  assert.match(source, /localStorage\.setItem\(storageKey\+'-pending-sync','1'\)/);
  assert.match(source, /setTimeout\(window\.clsSyncPosNow,0\)/);
});

test('temporary device-storage errors do not discard the in-memory POS change', () => {
  assert.match(source, /catch\(error\)\{console\.error\('POS device storage failed'/);
  assert.match(source, /return savedLocally/);
});
