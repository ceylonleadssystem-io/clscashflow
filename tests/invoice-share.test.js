const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  normalizeWhatsAppNumber,
  generatePublicToken,
  isValidPublicToken,
  publicTokenCandidates,
  buildVersionedPublicUrl,
  selectInvoiceSource,
  invoiceFinancials,
  invoiceStatus,
  sanitizePublicInvoice,
  sanitizePublicSnapshot,
  canUseMappedSource,
  buildReminderMessage,
  assertSourceAccess
} = require('../netlify/lib/invoice-share');
const { resolvePublicShare } = require('../netlify/functions/public-invoice');

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
  assert.equal(first.length, 48);
  assert.match(first, /^[A-Za-z0-9]+$/);
});

test('recovers a token with a messaging-client hyphen inserted into it', function() {
  const canonical = 'Kga1b2aE5WnXiZsXtDaXBPp9gXV0cGJw';
  const delivered = 'Kga1b2aE5WnXiZsXtDaXBPp9g-XV0cGJw';
  assert.deepEqual(publicTokenCandidates(delivered), [delivered, canonical]);
});

test('creates a unique-path public invoice URL for mobile browsers', function() {
  const token = 'Kga1b2aE5WnXiZsXtDaXBPp9gXV0cGJw';
  assert.equal(
    buildVersionedPublicUrl('https://ceylonrylabs.io/', token, 'deploy15'),
    'https://ceylonrylabs.io/invoice/' + token + '/deploy15'
  );
});

test('public invoice page loads shared assets from the site root', function() {
  const page = fs.readFileSync(path.join(__dirname, '..', 'invoice-public.html'), 'utf8');
  assert.match(page, /<script src="\/assets\/platform\.js\?v=[^"]+"><\/script>/);
  assert.doesNotMatch(page, /<script src="assets\/platform\.js/);
});

test('public lookup accepts the document shape returned by Supabase', async function() {
  const canonical = 'Kga1b2aE5WnXiZsXtDaXBPp9gXV0cGJw';
  const delivered = 'Kga1b2aE5WnXiZsXtDaXBPp9g-XV0cGJw';
  const calls = [];
  const result = await resolvePublicShare(delivered, async function(path, token) {
    calls.push([path, token]);
    return token === canonical ? { id: token, data: { active: true, public: true } } : null;
  });

  assert.equal(result.resolvedToken, canonical);
  assert.equal(result.share.id, canonical);
  assert.deepEqual(calls, [
    ['publicInvoices', delivered],
    ['publicInvoices', canonical]
  ]);
});

test('finds an existing converted invoice by its displayed invoice number', function() {
  const converted = { id: 'quote-cloud-id', data: { num: 'CS-0004', sourceQuote: 'QTE-0002' } };
  const wrongDirectMatch = { id: 'local-id', data: { num: 'CS-0003' } };
  assert.equal(selectInvoiceSource(null, [converted], 'CS-0004'), converted);
  assert.equal(selectInvoiceSource(wrongDirectMatch, [converted], 'CS-0004'), converted);
  assert.equal(selectInvoiceSource(null, [converted], 'CS-9999'), null);
  assert.equal(selectInvoiceSource(null, [converted, converted], 'CS-0004'), null);
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
  assert.match(message, /Thank you for your initial payment/);
  assert.match(message, /Amount paid: LKR 2,750\.00/);
  assert.match(message, /Remaining amount to pay: LKR 7,250\.00/);
});

test('thanks the customer and marks a fully paid invoice as settled', function() {
  const invoice = sanitizePublicInvoice({
    num: 'INV-5', client: 'Ada', amount: 10000, paidAmount: 10000, cur: 'LKR'
  }, { settings: { bizName: 'Example Studio' } });
  const message = buildReminderMessage(invoice, 'https://example.com/i/token');
  assert.match(message, /Thank you for your payment/);
  assert.match(message, /Paid amount: LKR 10,000\.00/);
  assert.match(message, /Status: Paid and settled/);
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

test('stored public snapshot is re-sanitized before being returned', function() {
  const result = sanitizePublicSnapshot({
    businessName: 'Public Business',
    invoiceNumber: 'INV-0044',
    customerName: 'Customer',
    currency: 'lkr',
    items: [{ description: 'Service', quantity: 1, unitPrice: 1200, total: 1200, privateNote: 'secret' }],
    total: 1200,
    outstanding: 1200,
    ownerUid: 'private-workspace',
    notes: 'Private bank notes'
  });
  assert.equal(result.currency, 'LKR');
  assert.equal(result.items[0].description, 'Service');
  assert.equal(Object.hasOwn(result.items[0], 'privateNote'), false);
  assert.equal(Object.hasOwn(result, 'ownerUid'), false);
  assert.equal(Object.hasOwn(result, 'notes'), false);
});

test('mapped source tolerates a missing flag but honors revocation and token replacement', function() {
  const token = generatePublicToken();
  const replacement = generatePublicToken();
  assert.equal(canUseMappedSource({ num: 'INV-1' }, token), true);
  assert.equal(canUseMappedSource({ publicInvoiceActive: true, publicToken: token }, token), true);
  assert.equal(canUseMappedSource({ publicInvoiceActive: false, publicToken: token }, token), false);
  assert.equal(canUseMappedSource({ publicInvoiceActive: true, publicToken: replacement }, token), false);
});
