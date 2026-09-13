const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const receiptSource = fs.readFileSync(path.join(root, 'netlify/functions/submit-subscription-receipt.js'), 'utf8');
const docsSource = fs.readFileSync(path.join(root, 'netlify/functions/supabase-docs.js'), 'utf8');
const platformSource = fs.readFileSync(path.join(root, 'assets/platform.js'), 'utf8');
const accessAdminSource = fs.readFileSync(path.join(root, 'access-admin.html'), 'utf8');

test('payment receipt upload requires authenticated identity and sends its token', () => {
  assert.match(receiptSource, /getUserFromEvent\(event\)/);
  assert.match(receiptSource, /statusCode:\s*401|json\(401/);
  assert.match(platformSource, /getIdToken\(\)/);
  assert.match(platformSource, /'Authorization':authToken\?'Bearer '/);
});

test('payment metadata is authoritative and raw receipt data is not persisted', () => {
  assert.match(receiptSource, /const PLANS =/);
  assert.match(receiptSource, /contentHash/);
  assert.match(receiptSource, /receiptSize/);
  assert.doesNotMatch(receiptSource, /receiptData\s*:/);
  assert.doesNotMatch(receiptSource, /amountLkr\s*=\s*Number\(data/);
});

test('receipt validation checks content signatures and periods', () => {
  const receipt = require('../netlify/functions/submit-subscription-receipt')._test;
  assert.equal(receipt.validPeriod('2026-09'), true);
  assert.equal(receipt.validPeriod('2026-annual'), true);
  assert.equal(receipt.validPeriod('../../etc/passwd'), false);
  assert.ok(receipt.decodedFile(Buffer.from('%PDF-1.7 test').toString('base64'), 'application/pdf'));
  assert.equal(receipt.decodedFile(Buffer.from('<script>').toString('base64'), 'application/pdf'), null);
});

test('public invite reads validate token and expose only allowlisted fields', () => {
  assert.match(docsSource, /data\.inviteToken/);
  assert.match(docsSource, /data\.status !== 'pending'/);
  assert.match(docsSource, /expiresAt <= Date\.now\(\)/);
  assert.match(docsSource, /const doc = publicInvite/);
  assert.match(accessAdminSource, /expiresAt:\s*new Date/);
  assert.doesNotMatch(docsSource, /JSON\.stringify\(\{ ok: true, exists: !!doc, doc: await getDocument/);
});
