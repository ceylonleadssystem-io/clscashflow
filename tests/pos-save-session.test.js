const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'pos-system', 'pos-system.html'),
  'utf8'
);

test('manual POS sign-in disables the one-time fresh-login guard before authentication', () => {
  const guard = source.indexOf('requireFreshBusinessLogin=false;var cred=await firebase.auth().signInWithEmailAndPassword');
  assert.notEqual(guard, -1, 'fresh-login guard must be cleared before Supabase emits SIGNED_IN');
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
