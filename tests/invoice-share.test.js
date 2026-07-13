const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeWhatsAppNumber,
  generatePublicToken,
  isValidPublicToken,
  invoiceFinancials,
  invoiceStatus,
  sanitizePublicInvoice,
  buildReminderMessage,
  assertSourceAccess
} = require('../netlify/lib/invoice-share');

test('normalizes a Sri Lankan domestic mobile number', function() {
  assert.deepEqual(normalizeWhatsAppNumber('077 123-4567'), {
    ok: true,
    reason: '',
    number: '94771234567'
  });
});

test('preserves an international country code', function() {
  assert.deepEqual(normalizeWhatsAppNumber('+44 (7700) 900123'), {
    ok: true,
    reason: '',
    number: '447700900123'
  });
  assert.equal(normalizeWhatsAppNumber('+94 77 123 4567').number, '94771234567');
});

test('distinguishes missing and invalid phone numbers', function() {
  assert.equal(normalizeWhatsAppNumber('').reason, 'missing');
  assert.equal(normalizeWhatsAppNumber('12-34').reason, 'invalid');
});

test('creates a secure token when an invoice has none', function() {
  const first = generatePublicToken();
  const second = generatePublicToken();
  assert.equal(isValidPublicToken(first), true);
  assert.equal(isValidPublicToken(second), true);
  assert.notEqual(first, second);
  assert.equal(first.length, 32);
});

test('recognizes a paid invoice', function() {
  const invoice = { amount: 5000, paidAmount: 5000, status: 'paid' };
  const financials = invoiceFinancials(invoice);
  assert.equal(financials.outstanding, 0);
  assert.equal(invoiceStatus(invoice, financials), 'paid');
});

test('uses the outstanding balance for a partially paid invoice', function() {
  const invoice = {
    num: 'INV-4',
    client: 'Ada',
    amount: 10000,
    paidAmount: 2750,
    cur: 'LKR',
    due: '2026-07-30',
    lines: [{ desc: 'Design', qty: 1, price: 10000, total: 10000 }]
  };
  const publicInvoice = sanitizePublicInvoice(invoice, { settings: { bizName: 'Example Studio' } });
  const message = buildReminderMessage(publicInvoice, 'https://example.com/i/token');
  assert.equal(publicInvoice.outstanding, 7250);
  assert.equal(publicInvoice.status, 'partial');
  assert.match(message, /Outstanding amount: LKR 7,250\.00/);
});

test('rejects malformed public tokens', function() {
  assert.equal(isValidPublicToken('1048'), false);
  assert.equal(isValidPublicToken('../another-invoice'), false);
  assert.equal(isValidPublicToken('short-token'), false);
});

test('rejects a cross-business source access attempt', function() {
  assert.throws(function() {
    assertSourceAccess('workspace-b', { id: 'user-a' }, false);
  }, function(error) {
    return error.statusCode === 403 && /do not have access/.test(error.message);
  });
  assert.equal(assertSourceAccess('workspace-a', { id: 'user-a' }, true), true);
});

test('public sanitizer excludes private invoice and account fields', function() {
  const result = sanitizePublicInvoice({
    id: 'internal-44',
    num: 'INV-0044',
    client: 'Customer',
    amount: 1200,
    notes: 'Private bank notes',
    editorUid: 'secret-user',
    lines: [{ desc: 'Service', qty: 1, price: 1200 }]
  }, {
    ownerUid: 'private-workspace',
    settings: { bizName: 'Public Business' }
  });
  assert.equal(result.invoiceNumber, 'INV-0044');
  assert.equal(Object.hasOwn(result, 'notes'), false);
  assert.equal(Object.hasOwn(result, 'ownerUid'), false);
  assert.equal(Object.hasOwn(result, 'editorUid'), false);
});
