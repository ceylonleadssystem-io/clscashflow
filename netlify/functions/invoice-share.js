const {
  clean,
  headers,
  getUserFromEvent,
  getDocument,
  queryDocuments,
  upsertDocument,
  canWrite
} = require('../lib/supabase');
const {
  normalizeWhatsAppNumber,
  generatePublicToken,
  isValidPublicToken,
  buildVersionedPublicUrl,
  selectInvoiceSource,
  sanitizePublicInvoice,
  buildReminderMessage,
  assertSourceAccess
} = require('../lib/invoice-share');

const MISSING_PHONE = 'Please add the customer\u2019s WhatsApp number before sending a reminder.';
const INVALID_PHONE = 'Please enter a valid WhatsApp number including the country code.';

function response(statusCode, body) {
  return { statusCode, headers: headers({ 'Cache-Control': 'no-store' }), body: JSON.stringify(body) };
}

function publicBase(event) {
  const configured = clean(process.env.PUBLIC_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL, 500);
  if (configured) return configured.replace(/\/$/, '');
  const host = clean(event.headers['x-forwarded-host'] || event.headers.host, 300);
  const proto = clean(event.headers['x-forwarded-proto'] || 'https', 20);
  return host ? proto + '://' + host : 'https://ceylonrylabs.io';
}

async function uniqueToken(existingToken, ownerUid, invoiceId) {
  if (isValidPublicToken(existingToken)) {
    const existing = await getDocument('publicInvoices', existingToken);
    if (!existing || (existing.data.ownerUid === ownerUid && existing.data.sourceInvoiceId === invoiceId)) {
      return existingToken;
    }
  }
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = generatePublicToken();
    if (!await getDocument('publicInvoices', token)) return token;
  }
  const error = new Error('Could not generate the public invoice link. Please try again.');
  error.statusCode = 503;
  throw error;
}

function customerMatches(invoice, customer) {
  const invName = clean(invoice.client || invoice.clientName, 180).toLowerCase();
  const invEmail = clean(invoice.cemail || invoice.email, 240).toLowerCase();
  const customerNames = [customer.biz, customer.name].map(function(value) { return clean(value, 180).toLowerCase(); });
  return (invName && customerNames.includes(invName)) ||
    (invEmail && invEmail === clean(customer.email, 240).toLowerCase());
}

async function findCustomer(ownerUid, invoice, requestedId) {
  const path = 'users/' + ownerUid + '/clients';
  if (requestedId) {
    const requested = await getDocument(path, clean(requestedId, 240));
    if (requested && customerMatches(invoice, requested.data || {})) return requested;
  }
  const rows = await queryDocuments(path, { fetchLimit: 500 });
  return rows.find(function(row) { return customerMatches(invoice, row.data || {}); }) || null;
}

async function findInvoiceSource(path, requestedId, invoiceNumber) {
  let requested = null;
  if (requestedId) {
    requested = await getDocument(path, requestedId);
  }
  const selected = selectInvoiceSource(requested, [], invoiceNumber);
  if (selected || !invoiceNumber) return selected;
  const matches = await queryDocuments(path, {
    filters: [{ field: 'num', op: '==', value: invoiceNumber }],
    fetchLimit: 2000,
    limit: 2
  });
  return selectInvoiceSource(null, matches, invoiceNumber);
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return response(200, { ok: true });
  if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'Method not allowed.' });

  try {
    const user = await getUserFromEvent(event);
    if (!user) return response(401, { ok: false, error: 'Please sign in again.' });
    const body = JSON.parse(event.body || '{}');
    const ownerUid = clean(body.ownerUid || user.id, 240);
    const requestedInvoiceId = clean(body.invoiceId, 240);
    const invoiceNumber = clean(body.invoiceNumber, 120);
    if (!/^[0-9a-f-]{36}$/i.test(ownerUid) || (!requestedInvoiceId && !invoiceNumber)) {
      return response(400, { ok: false, error: 'Could not identify this invoice.' });
    }

    const invoicePath = 'users/' + ownerUid + '/invoices';
    const source = await findInvoiceSource(invoicePath, requestedInvoiceId, invoiceNumber);
    if (!source) return response(404, { ok: false, error: 'Invoice not found.' });
    const invoiceId = source.id;
    const allowed = await canWrite(invoicePath, invoiceId, source.data || {}, user);
    assertSourceAccess(ownerUid, user, allowed);

    const invoice = Object.assign({}, source.data || {});
    const customer = await findCustomer(ownerUid, invoice, body.customerId).catch(function() { return null; });
    const rawPhone = invoice.cphone || invoice.phone || (customer && customer.data && customer.data.phone) || '';
    const phone = normalizeWhatsAppNumber(rawPhone);
    if (!rawPhone) return response(400, { ok: false, error: MISSING_PHONE, code: 'missing_phone' });
    if (!phone.ok) return response(400, { ok: false, error: INVALID_PHONE, code: 'invalid_phone' });

    const profileDoc = await getDocument('users', ownerUid);
    const profile = profileDoc ? profileDoc.data || {} : {};
    const token = await uniqueToken(invoice.publicToken, ownerUid, invoiceId);
    const now = new Date().toISOString();
    // The token remains stable, but every reminder gets a fresh path so mobile
    // browsers cannot reopen a previously cached failure document for /i/.
    const linkVersion = Date.now().toString(36);
    const publicUrl = buildVersionedPublicUrl(publicBase(event), token, linkVersion);
    const publicInvoice = sanitizePublicInvoice(invoice, profile);
    const priorHistory = Array.isArray(invoice.whatsappReminderHistory) ? invoice.whatsappReminderHistory.slice(-99) : [];
    const messageType = publicInvoice.status === 'paid' ? 'paid invoice thank-you' : (publicInvoice.status === 'partial' ? 'partial payment update' : 'payment reminder');
    const entry = {
      invoiceId,
      customerId: customer ? customer.id : '',
      initiatedBy: user.id,
      whatsappNumber: phone.number,
      reminderType: 'manual WhatsApp ' + messageType,
      publicInvoiceUrl: publicUrl,
      initiatedAt: now,
      status: 'WhatsApp opened'
    };
    const reminderCount = Math.max(0, Number(invoice.whatsappReminderCount) || 0) + 1;
    const nextInvoice = Object.assign({}, invoice, {
      publicToken: token,
      publicInvoiceActive: true,
      publicInvoiceUrl: publicUrl,
      publicInvoiceCreatedAt: invoice.publicInvoiceCreatedAt || now,
      whatsappReminderCount: reminderCount,
      lastWhatsappReminderAt: now,
      whatsappReminderHistory: priorHistory.concat(entry)
    });

    await upsertDocument('publicInvoices', token, {
      ownerUid,
      sourceInvoiceId: invoiceId,
      active: true,
      public: true,
      invoice: publicInvoice,
      createdAt: invoice.publicToken === token && invoice.publicInvoiceCreatedAt ? invoice.publicInvoiceCreatedAt : now,
      updatedAt: now
    }, true);
    await upsertDocument(invoicePath, invoiceId, nextInvoice, false);

    const message = buildReminderMessage(publicInvoice, publicUrl);
    return response(200, {
      ok: true,
      publicToken: token,
      publicInvoiceUrl: publicUrl,
      publicInvoiceCreatedAt: nextInvoice.publicInvoiceCreatedAt,
      whatsappNumber: phone.number,
      message,
      whatsappUrl: 'https://wa.me/' + phone.number + '?text=' + encodeURIComponent(message),
      reminderCount,
      lastReminderAt: now,
      reminderEntry: entry
    });
  } catch (error) {
    console.error('invoice-share error', error);
    return response(error.statusCode || 500, {
      ok: false,
      error: error.statusCode && error.statusCode < 500
        ? error.message
        : 'Could not generate the invoice link. Please try again.'
    });
  }
};
