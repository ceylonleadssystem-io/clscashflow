'use strict';

// Turns the POS's completed sales into the receipt records of the One Galle Face POS interface (POS-02, "Transaction With Item", spec v2.4/2.5).
// Pure: no network, no database. The sender (ogf-push.js) calls it and the settings page's Preview shows its output.
//
// Our sale: prices are before tax; lines hold the items, an optional discount line (negative), an optional service charge line and tax lines
// (code TAX). total = items - discount + service charge + tax. OGF wants, per receipt: total before tax (plus service charge), total after tax,
// one tax rate, the service charge, the payment, and the items with their amount and discount. A void or refund is its own record with the
// same receipt number and positive amounts, sent after the original sale.

const r2 = (n) => Math.round((Number(n) || 0) * 100 + 1e-9) / 100;
const num = (n) => Number(n) || 0;

const DEFAULT_PAYMENT_NAMES = { Cash: 'Cash', Card: 'Credit Card', 'Bank Transfer': 'Bank Transfer', 'Online Payment': 'Online', 'Gift Card': 'Voucher', '3rd Party': '3rd Party' };

const DEFAULTS = {
  propertyCode: '',
  salesCurrency: 'LKR',
  itemAmountBasis: 'before-tax', // 'before-tax' (the spec's example) or 'after-tax' (the sample file's amounts)
  itemAmountsAfterDiscount: false, // false: ItemAmt is the line amount and ItemDiscountAmt the share of the discount
  noOfItems: 'quantity', // 'quantity' or 'lines'
  discountField: 'both', // 'ItemDiscountAmt' (sample file), 'ItemDiscoumtAmt' (the spec's spelling) or 'both'
  refundType: 'Refund', // what a refund of part of a sale is called: 'Refund' or 'Return'
  timeZone: 'Asia/Colombo',
  paymentMap: {}
};

const settingsOf = (cfg) => Object.assign({}, DEFAULTS, cfg || {});

/** DD/MM/YYYY and HH:MM:SS (24 hour) of an instant in the mall's time zone. */
function dateTimeOf(iso, timeZone) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const parts = {};
  new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    .formatToParts(d).forEach(function(p) { parts[p.type] = p.value; });
  return { date: parts.day + '/' + parts.month + '/' + parts.year, time: parts.hour + ':' + parts.minute + ':' + parts.second, iso: d.toISOString() };
}

/** What the lines of a sale add up to. */
function breakdown(sale) {
  const lines = Array.isArray(sale.lines) ? sale.lines : [];
  const items = [];
  let discount = 0, service = 0, tax = 0;
  lines.forEach(function(line, index) {
    if (line.isDiscount) discount += -num(line.price) * (num(line.qty) || 1);
    else if (line.isServiceCharge && line.code === 'TAX') tax += num(line.price) * (num(line.qty) || 1);
    else if (line.isServiceCharge) service += num(line.price) * (num(line.qty) || 1);
    else items.push({ index, line, value: num(line.price) * num(line.qty) });
  });
  const gross = items.reduce(function(a, x) { return a + x.value; }, 0);
  const total = r2(sale.originalTotal != null ? sale.originalTotal : sale.total);
  return { items, gross: r2(gross), discount: r2(discount), service: r2(service), tax: r2(tax), total };
}

/** The tax rate OGF gets: the single rate when there is one tax, else the effective rate of the receipt (tax / amount before tax). */
function taxRateOf(b) {
  const before = r2(b.total - b.tax);
  return before > 0 ? r2((b.tax / before) * 100) : 0;
}

function describe(line) {
  const mods = (Array.isArray(line.modifiers) ? line.modifiers : []).map(function(m) { return m && m.optionName; }).filter(Boolean);
  const qty = num(line.qty);
  const text = (qty > 1 ? qty + ' x ' : '') + String(line.name || 'Item') + (mods.length ? ' (' + mods.join(', ') + ')' : '');
  return text.slice(0, 256);
}

/** Item rows. `rows` = [{ line, value }]; amounts follow the options and the rounding remainder goes on the last row so the rows add up. */
function itemRows(rows, b, rate, cfg) {
  const factor = cfg.itemAmountBasis === 'after-tax' ? 1 + rate / 100 : 1;
  const gross = rows.reduce(function(a, x) { return a + x.value; }, 0);
  const discountTotal = gross > 0 ? b.discount * Math.min(1, gross / (b.gross || gross)) : 0;
  let usedAmt = 0, usedDisc = 0;
  const wantAmt = r2(rows.reduce(function(a, x) { return a + x.value; }, 0) * factor - (cfg.itemAmountsAfterDiscount ? discountTotal * factor : 0));
  const wantDisc = r2(discountTotal * factor);
  return rows.map(function(x, i) {
    const last = i === rows.length - 1;
    const share = gross > 0 ? x.value / gross : 0;
    const disc = last ? r2(wantDisc - usedDisc) : r2(discountTotal * share * factor);
    const amt = last ? r2(wantAmt - usedAmt) : r2((x.value - (cfg.itemAmountsAfterDiscount ? discountTotal * share : 0)) * factor);
    usedAmt = r2(usedAmt + amt);
    usedDisc = r2(usedDisc + disc);
    const out = { ItemDesc: describe(x.line), ItemAmt: Math.max(0, amt) };
    if (cfg.discountField !== 'ItemDiscoumtAmt') out.ItemDiscountAmt = Math.max(0, disc);
    if (cfg.discountField !== 'ItemDiscountAmt') out.ItemDiscoumtAmt = Math.max(0, disc);
    return out;
  });
}

/** The payment method names for a sale, in OGF's words, comma separated for a split payment. */
function paymentMethodOf(sale, cfg) {
  const map = Object.assign({}, DEFAULT_PAYMENT_NAMES, cfg.paymentMap || {});
  const name = function(m) { return map[m] || String(m || 'Cash'); };
  const list = sale.payment === 'Split' && Array.isArray(sale.payments) && sale.payments.length
    ? sale.payments.map(function(p) { return p.method; }) : [sale.payment || 'Cash'];
  // not cut to the spec's 16 characters: its own example "CASH, CREDIT CARD" is longer, and a cut name ("Credit Car") is worse than a long one
  return Array.from(new Set(list.map(name))).join(', ');
}

function header(register, cfg, when, receiptNo) {
  return { PropertyCode: cfg.propertyCode, POSInterfaceCode: register.posInterfaceCode, ReceiptDate: when.date, ReceiptTime: when.time, ReceiptNo: String(receiptNo).slice(0, 36) };
}

function record(sale, register, cfg, kind, when, parts) {
  const b = parts.b;
  const rate = taxRateOf(b);
  const rows = itemRows(parts.rows, b, rate, cfg);
  const count = cfg.noOfItems === 'lines' ? parts.rows.length : parts.rows.reduce(function(a, x) { return a + num(x.line.qty); }, 0);
  return Object.assign(header(register, cfg, when, sale.receipt || sale.orderNumber), {
    NoOfItems: Math.max(0, Math.round(count)),
    SalesCurrency: cfg.salesCurrency,
    TotalSalesAmtB4Tax: r2(parts.after - parts.tax),
    TotalSalesAmtAfterTax: r2(parts.after),
    SalesTaxRate: rate,
    ServiceChargeAmt: r2(parts.service),
    PaymentAmt: r2(parts.after),
    PaymentCurrency: cfg.salesCurrency,
    PaymentMethod: paymentMethodOf(sale, cfg),
    SalesType: kind,
    Items: rows
  });
}

/**
 * The records OGF wants for one sale: { sale, void, refunds: [{ id, record }] }. `sale` is always the original receipt; `void` exists when the sale
 * was voided; each refund of the sale gives one record. A sale without a usable date or receipt number gives { problem }.
 */
function recordsForSale(sale, register, config) {
  const cfg = settingsOf(config);
  const receipt = sale && (sale.receipt || sale.orderNumber);
  if (!receipt) return { problem: 'The sale has no receipt number.' };
  const born = dateTimeOf(sale.createdAt || (sale.date ? sale.date + 'T12:00:00+05:30' : ''), cfg.timeZone);
  if (!born) return { problem: 'The sale has no valid date.' };
  const b = breakdown(sale);
  if (!b.items.length) return { problem: 'The sale has no items.' };
  const whole = { b, rows: b.items, after: b.total, tax: b.tax, service: b.service };
  const out = { sale: record(sale, register, cfg, 'Sales', born, whole), refunds: [] };
  if (sale.status === 'voided' || sale.voidAt) {
    const at = dateTimeOf(sale.voidAt || sale.createdAt, cfg.timeZone) || born;
    out.void = record(sale, register, cfg, 'Void', at, whole);
  }
  (Array.isArray(sale.refunds) ? sale.refunds : []).forEach(function(r, i) {
    const at = dateTimeOf(r.at, cfg.timeZone) || born;
    const picked = (Array.isArray(r.lines) ? r.lines : []).map(function(l) {
      const src = b.items.find(function(x) { return x.index === l.lineIndex; });
      const line = src ? Object.assign({}, src.line, { qty: num(l.qty) }) : { name: l.name, qty: num(l.qty), price: num(l.unitPrice) };
      return { line, value: num(l.unitPrice != null ? l.unitPrice : line.price) * num(l.qty) };
    }).filter(function(x) { return x.value > 0 || num(x.line.qty) > 0; });
    const rows = picked.length ? picked : b.items;
    const share = b.gross > 0 ? Math.min(1, rows.reduce(function(a, x) { return a + x.value; }, 0) / b.gross) : 1;
    const after = Math.min(b.total, r2(r.amount));
    const parts = { b: { items: rows, gross: r2(rows.reduce(function(a, x) { return a + x.value; }, 0)), discount: r2(b.discount * share), service: r2(b.service * share), tax: r2(b.tax * share), total: after }, rows, after, tax: r2(b.tax * share), service: r2(b.service * share) };
    out.refunds.push({ id: String(r.id || ('refund-' + i)), record: record(sale, register, cfg, cfg.refundType, at, parts) });
  });
  return out;
}

module.exports = { DEFAULTS, DEFAULT_PAYMENT_NAMES, settingsOf, dateTimeOf, breakdown, taxRateOf, recordsForSale, r2 };
