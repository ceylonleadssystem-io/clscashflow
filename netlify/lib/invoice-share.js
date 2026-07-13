const crypto = require('crypto');

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,64}$/;

function text(value, max) {
  const out = String(value == null ? '' : value).trim();
  return max && out.length > max ? out.slice(0, max) : out;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return Math.round((number(value) + Number.EPSILON) * 100) / 100;
}

function normalizeWhatsAppNumber(value) {
  const raw = text(value, 40);
  if (!raw) return { ok: false, reason: 'missing', number: '' };

  const hadPlus = /^\s*\+/.test(raw);
  const hadInternationalPrefix = /^\s*00/.test(raw);
  let digits = raw.replace(/\D/g, '');
  if (hadInternationalPrefix && digits.startsWith('00')) digits = digits.slice(2);

  // Sri Lankan domestic mobile numbers are ten digits beginning with 0.
  if (!hadPlus && !hadInternationalPrefix && /^0\d{9}$/.test(digits)) {
    digits = '94' + digits.slice(1);
  }

  if (!/^\d{8,15}$/.test(digits) || digits.startsWith('0')) {
    return { ok: false, reason: 'invalid', number: '' };
  }
  return { ok: true, reason: '', number: digits };
}

function generatePublicToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function isValidPublicToken(token) {
  return TOKEN_PATTERN.test(text(token, 80));
}

function lineItems(invoice) {
  const rows = Array.isArray(invoice && invoice.lines)
    ? invoice.lines
    : Array.isArray(invoice && invoice.items) ? invoice.items : [];
  return rows.slice(0, 250).map(function(item) {
    item = item || {};
    const quantity = Math.max(0, number(item.qty != null ? item.qty : item.quantity));
    const unitPrice = Math.max(0, number(item.price != null ? item.price : item.unitPrice));
    const total = Math.max(0, number(item.total != null ? item.total : quantity * unitPrice));
    return {
      description: text(item.desc || item.description || item.name || 'Invoice item', 500),
      quantity: money(quantity || 1),
      unitPrice: money(unitPrice),
      total: money(total || (quantity || 1) * unitPrice)
    };
  });
}

function invoiceFinancials(invoice) {
  invoice = invoice || {};
  const items = lineItems(invoice);
  const itemSubtotal = items.reduce(function(sum, item) { return sum + item.total; }, 0);
  const subtotal = Math.max(0, number(invoice.sub != null ? invoice.sub : itemSubtotal));
  const tax = Math.max(0, number(invoice.vat != null ? invoice.vat : invoice.tax));
  const total = Math.max(0, number(invoice.total != null ? invoice.total : invoice.amount));
  const paid = Math.max(0, number(invoice.paid != null ? invoice.paid : invoice.paidAmount));
  const rawDiscount = Math.max(0, number(invoice.discountAmount != null ? invoice.discountAmount : invoice.disc));
  const percentDiscount = subtotal * Math.min(rawDiscount, 100) / 100;
  const absoluteDifference = Math.abs((subtotal - rawDiscount + tax) - total);
  const percentDifference = Math.abs((subtotal - percentDiscount + tax) - total);
  const discount = rawDiscount > 0 && percentDifference + 0.01 < absoluteDifference
    ? percentDiscount
    : rawDiscount;
  const computedTotal = Math.max(0, subtotal - discount + tax);
  const finalTotal = total || computedTotal;
  return {
    items,
    subtotal: money(subtotal),
    tax: money(tax),
    discount: money(discount),
    total: money(finalTotal),
    paid: money(Math.min(paid, finalTotal || paid)),
    outstanding: money(Math.max(0, finalTotal - paid))
  };
}

function invoiceStatus(invoice, financials, now) {
  invoice = invoice || {};
  financials = financials || invoiceFinancials(invoice);
  if (financials.outstanding <= 0.01 && financials.total > 0) return 'paid';
  if (financials.paid > 0) return 'partial';
  const due = Date.parse(text(invoice.due || invoice.dueDate, 40) + 'T23:59:59');
  if (Number.isFinite(due) && due < (now || Date.now())) return 'overdue';
  return 'unpaid';
}

function safeLogo(value) {
  const logo = text(value, 2_500_000);
  if (/^https:\/\//i.test(logo)) return logo;
  if (/^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(logo)) return logo;
  return '';
}

function sanitizePublicInvoice(invoice, profile) {
  invoice = invoice || {};
  profile = profile || {};
  const settings = profile.settings && typeof profile.settings === 'object' ? profile.settings : {};
  const financials = invoiceFinancials(invoice);
  return {
    businessName: text(settings.bizName || settings.biz || profile.bizName || profile.invoiceBiz || 'Your Business', 180),
    businessLogo: safeLogo(settings.logo || profile.logo),
    invoiceNumber: text(invoice.num || invoice.id, 120),
    customerName: text(invoice.client || invoice.clientName || 'Customer', 180),
    invoiceDate: text(invoice.date, 40),
    dueDate: text(invoice.due || invoice.dueDate, 40),
    currency: text(invoice.cur || invoice.currency || 'LKR', 12).toUpperCase(),
    items: financials.items,
    subtotal: financials.subtotal,
    tax: financials.tax,
    discount: financials.discount,
    total: financials.total,
    outstanding: financials.outstanding,
    status: invoiceStatus(invoice, financials),
    updatedAt: text(invoice._ts || invoice.updatedAt || new Date().toISOString(), 80)
  };
}

function sanitizePublicSnapshot(invoice) {
  invoice = invoice && typeof invoice === 'object' ? invoice : {};
  const allowedStatuses = ['paid', 'partial', 'overdue', 'unpaid'];
  const status = text(invoice.status, 20).toLowerCase();
  const items = Array.isArray(invoice.items) ? invoice.items.slice(0, 250).map(function(item) {
    item = item && typeof item === 'object' ? item : {};
    const quantity = Math.max(0, number(item.quantity));
    const unitPrice = Math.max(0, number(item.unitPrice));
    const total = Math.max(0, number(item.total != null ? item.total : quantity * unitPrice));
    return {
      description: text(item.description || 'Invoice item', 500),
      quantity: money(quantity || 1),
      unitPrice: money(unitPrice),
      total: money(total || (quantity || 1) * unitPrice)
    };
  }) : [];
  return {
    businessName: text(invoice.businessName || 'Your Business', 180),
    businessLogo: safeLogo(invoice.businessLogo),
    invoiceNumber: text(invoice.invoiceNumber, 120),
    customerName: text(invoice.customerName || 'Customer', 180),
    invoiceDate: text(invoice.invoiceDate, 40),
    dueDate: text(invoice.dueDate, 40),
    currency: text(invoice.currency || 'LKR', 12).toUpperCase(),
    items,
    subtotal: money(Math.max(0, number(invoice.subtotal))),
    tax: money(Math.max(0, number(invoice.tax))),
    discount: money(Math.max(0, number(invoice.discount))),
    total: money(Math.max(0, number(invoice.total))),
    outstanding: money(Math.max(0, number(invoice.outstanding))),
    status: allowedStatuses.includes(status) ? status : 'unpaid',
    updatedAt: text(invoice.updatedAt || new Date().toISOString(), 80)
  };
}

function canUseMappedSource(sourceData, token) {
  sourceData = sourceData && typeof sourceData === 'object' ? sourceData : null;
  if (!sourceData || sourceData.publicInvoiceActive === false) return false;
  const sourceToken = text(sourceData.publicToken, 80);
  return !isValidPublicToken(sourceToken) || sourceToken === token;
}

function formatAmount(value) {
  return money(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  const raw = text(value, 40);
  if (!raw) return '';
  const date = new Date(raw.length <= 10 ? raw + 'T00:00:00' : raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function buildReminderMessage(invoice, publicUrl) {
  const dueLine = invoice.dueDate ? '\nDue date: ' + formatDate(invoice.dueDate) : '';
  return 'Hi ' + (invoice.customerName || 'there') + ',\n\n' +
    'This is a friendly reminder regarding Invoice #' + invoice.invoiceNumber + ' from ' + invoice.businessName + '.\n\n' +
    'Outstanding amount: ' + invoice.currency + ' ' + formatAmount(invoice.outstanding) + dueLine + '\n\n' +
    'You can view your invoice here:\n' + publicUrl + '\n\n' +
    'Please disregard this message if payment has already been completed.\n\n' +
    'Thank you,\n' + invoice.businessName;
}

function assertSourceAccess(ownerUid, user, allowed) {
  if (!user || !user.id || !ownerUid || allowed !== true) {
    const error = new Error('You do not have access to this invoice.');
    error.statusCode = 403;
    throw error;
  }
  return true;
}

module.exports = {
  TOKEN_PATTERN,
  normalizeWhatsAppNumber,
  generatePublicToken,
  isValidPublicToken,
  invoiceFinancials,
  invoiceStatus,
  sanitizePublicInvoice,
  sanitizePublicSnapshot,
  canUseMappedSource,
  buildReminderMessage,
  assertSourceAccess
};
