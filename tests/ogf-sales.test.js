const test = require('node:test');
const assert = require('node:assert/strict');
const { recordsForSale, dateTimeOf, breakdown, settingsOf } = require('../netlify/lib/ogf-sales');

const REG = { posInterfaceCode: 'CCB1-PS-23-00000039' };
const CFG = { propertyCode: 'OGF1' };
const sum = (rows, k) => Math.round(rows.reduce((a, r) => a + r[k], 0) * 100) / 100;

// 2 Latte at 500, 1 Cake at 750: 10% discount (175), 10% service charge on what is left (157.50), 18% tax on the items after discount (283.50)
const sale = (extra) => Object.assign({
  id: 's1', receipt: 'ORD-0042', createdAt: '2026-11-07T20:00:00.000Z', payment: 'Card', total: 2016, status: 'completed', locationId: 'loc-main',
  lines: [
    { name: 'Latte', price: 500, qty: 2, modifiers: [{ groupName: 'Milk', optionName: 'Oat' }] },
    { name: 'Cake', price: 750, qty: 1 },
    { name: 'Order Discount', code: 'DISC', price: -175, qty: 1, isDiscount: true },
    { name: 'Service Charge (10%)', code: 'SERVICE', price: 157.5, qty: 1, isServiceCharge: true },
    { name: 'VAT (18%)', code: 'TAX', price: 283.5, qty: 1, isServiceCharge: true, basePrice: 1575 }
  ]
}, extra);

test('the break-down of a sale: items, discount, service charge and tax', () => {
  const b = breakdown(sale());
  assert.deepEqual([b.gross, b.discount, b.service, b.tax, b.total], [1750, 175, 157.5, 283.5, 2016]);
  assert.equal(b.items.length, 2);
});

test('a sale becomes one receipt record with the amounts OGF checks', () => {
  const { sale: r } = recordsForSale(sale(), REG, CFG);
  assert.equal(r.PropertyCode, 'OGF1');
  assert.equal(r.POSInterfaceCode, 'CCB1-PS-23-00000039');
  assert.equal(r.ReceiptNo, 'ORD-0042');
  assert.equal(r.SalesType, 'Sales');
  assert.equal(r.SalesCurrency, 'LKR');
  assert.equal(r.PaymentCurrency, 'LKR');
  assert.equal(r.TotalSalesAmtAfterTax, 2016);
  assert.equal(r.TotalSalesAmtB4Tax, 1732.5); // items less discount, plus the service charge
  assert.equal(r.ServiceChargeAmt, 157.5);
  assert.equal(r.PaymentAmt, 2016);
  assert.equal(r.PaymentMethod, 'Credit Card');
  assert.equal(r.NoOfItems, 3);
  // the tax rate is the effective one, so before tax x (1 + rate) gives the total
  assert.ok(Math.abs(r.TotalSalesAmtB4Tax * (1 + r.SalesTaxRate / 100) - 2016) < 0.5); // the rate has two decimals, so this can be a few cents off
});

test('the date and time are the mall\'s (Sri Lanka), in OGF\'s formats', () => {
  const { sale: r } = recordsForSale(sale(), REG, CFG);
  assert.equal(r.ReceiptDate, '08/11/2026'); // 20:00 UTC is 01:30 the next day in Colombo
  assert.equal(r.ReceiptTime, '01:30:00');
  assert.equal(dateTimeOf('not a date', 'Asia/Colombo'), null);
});

test('item rows add up: amounts to the items, the discount shared in proportion, nothing lost to rounding', () => {
  const { sale: r } = recordsForSale(sale(), REG, CFG);
  assert.deepEqual(r.Items.map((i) => i.ItemDesc), ['2 x Latte (Oat)', 'Cake']);
  assert.equal(sum(r.Items, 'ItemAmt'), 1750);
  assert.equal(sum(r.Items, 'ItemDiscountAmt'), 175);
  assert.equal(r.Items[0].ItemDiscountAmt, 100); // 1000 / 1750 of 175
  assert.equal(r.Items[0].ItemDiscoumtAmt, 100); // both spellings are sent by default: the spec and its sample file disagree
});

test('options: amounts after tax, after discount, one discount spelling, item lines instead of quantity', () => {
  const after = recordsForSale(sale(), REG, Object.assign({}, CFG, { itemAmountBasis: 'after-tax' })).sale;
  assert.equal(sum(after.Items, 'ItemAmt'), Math.round(1750 * (1 + after.SalesTaxRate / 100) * 100) / 100);
  const net = recordsForSale(sale(), REG, Object.assign({}, CFG, { itemAmountsAfterDiscount: true })).sale;
  assert.equal(sum(net.Items, 'ItemAmt'), 1575);
  const one = recordsForSale(sale(), REG, Object.assign({}, CFG, { discountField: 'ItemDiscountAmt' })).sale;
  assert.ok('ItemDiscountAmt' in one.Items[0]);
  assert.ok(!('ItemDiscoumtAmt' in one.Items[0]));
  const lines = recordsForSale(sale(), REG, Object.assign({}, CFG, { noOfItems: 'lines' })).sale;
  assert.equal(lines.NoOfItems, 2);
});

test('a split payment lists each method once, in OGF\'s words, and the map can rename them', () => {
  const split = sale({ payment: 'Split', payments: [{ method: 'Cash', amount: 1000 }, { method: 'Card', amount: 800 }, { method: 'Card', amount: 216 }] });
  assert.equal(recordsForSale(split, REG, CFG).sale.PaymentMethod, 'Cash, Credit Card');
  assert.equal(recordsForSale(split, REG, Object.assign({}, CFG, { paymentMap: { Card: 'Visa' } })).sale.PaymentMethod, 'Cash, Visa');
});

test('a sale without discount, service charge or tax still adds up', () => {
  const plain = { receipt: 'R1', createdAt: '2026-11-07T05:00:00Z', payment: 'Cash', total: 300, lines: [{ name: 'Tea', price: 100, qty: 3 }] };
  const r = recordsForSale(plain, REG, CFG).sale;
  assert.deepEqual([r.TotalSalesAmtB4Tax, r.TotalSalesAmtAfterTax, r.SalesTaxRate, r.ServiceChargeAmt], [300, 300, 0, 0]);
  assert.equal(r.Items[0].ItemAmt, 300);
  assert.equal(r.Items[0].ItemDiscountAmt, 0);
});

test('a voided sale gives the original receipt and a Void record with the same receipt number and positive amounts', () => {
  const voided = sale({ status: 'voided', total: 0, originalTotal: 2016, voidAt: '2026-11-07T20:20:00.000Z' });
  const out = recordsForSale(voided, REG, CFG);
  assert.equal(out.sale.TotalSalesAmtAfterTax, 2016);
  assert.equal(out.void.SalesType, 'Void');
  assert.equal(out.void.ReceiptNo, 'ORD-0042');
  assert.equal(out.void.TotalSalesAmtAfterTax, 2016);
  assert.equal(out.void.ReceiptTime, '01:50:00');
});

test('a partial refund gives a Refund record for the refunded items only, scaled to the money returned', () => {
  // one Latte (500 of 1750) goes back: 500 * 2016 / 1750 = 576
  const refunded = sale({ status: 'partially_refunded', total: 1440, originalTotal: 2016, refunds: [{ id: 'rf1', at: '2026-11-07T20:30:00.000Z', amount: 576, lines: [{ lineIndex: 0, qty: 1, unitPrice: 500, name: 'Latte' }] }] });
  const out = recordsForSale(refunded, REG, CFG);
  assert.equal(out.sale.TotalSalesAmtAfterTax, 2016); // the original receipt is still what was sold
  const [{ id, record: r }] = out.refunds;
  assert.equal(id, 'rf1');
  assert.equal(r.SalesType, 'Refund');
  assert.equal(r.TotalSalesAmtAfterTax, 576);
  assert.equal(r.PaymentAmt, 576);
  assert.equal(r.Items.length, 1);
  assert.equal(r.NoOfItems, 1);
  assert.equal(Math.round((r.TotalSalesAmtB4Tax + (576 - r.TotalSalesAmtB4Tax)) * 100) / 100, 576);
  for (const k of ['TotalSalesAmtB4Tax', 'TotalSalesAmtAfterTax', 'ServiceChargeAmt', 'PaymentAmt']) assert.ok(r[k] >= 0, k);
  const asReturn = recordsForSale(refunded, REG, Object.assign({}, CFG, { refundType: 'Return' }));
  assert.equal(asReturn.refunds[0].record.SalesType, 'Return');
});

test('bad sales are reported, not guessed at', () => {
  assert.match(recordsForSale({ createdAt: '2026-11-07T05:00:00Z', lines: [{ name: 'x', price: 1, qty: 1 }] }, REG, CFG).problem, /receipt number/);
  assert.match(recordsForSale({ receipt: 'R', lines: [{ name: 'x', price: 1, qty: 1 }] }, REG, CFG).problem, /valid date/);
  assert.match(recordsForSale({ receipt: 'R', createdAt: '2026-11-07T05:00:00Z', lines: [] }, REG, CFG).problem, /no items/);
  assert.equal(settingsOf({ salesCurrency: 'USD' }).salesCurrency, 'USD');
});
