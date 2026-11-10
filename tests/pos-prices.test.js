const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const { POS_PLANS } = require('../netlify/functions/submit-subscription-receipt')._test;

// The POS tiers (LKR) exist in the app's pricing sheet, the billing widget on the static pages and the server that checks payment slips.
test('POS tier prices are the same in the pricing sheet, the billing widget and the receipt check', () => {
  const sheet = {};
  for (const m of read('pos-react/src/config/plans.js').matchAll(/id: "(starter|business|pro)"[\s\S]*?price: (\d+),\s*annual: (\d+),/g)) sheet[m[1]] = { monthly: +m[2], annual: +m[3] };
  const widget = {};
  for (const m of read('assets/platform.js').matchAll(/(starter|business|pro): \{ name: 'POS [^']+', userLimit: [^,]+, userLabel: '[^']+', monthlyPrice: (\d+), price: (\d+)/g)) widget[m[1]] = { monthly: +m[2], annual: +m[3] };
  const server = Object.fromEntries(Object.entries(POS_PLANS).map(([k, v]) => [k, { monthly: v.monthly, annual: v.annual }]));
  assert.deepEqual(Object.keys(sheet).sort(), ['business', 'pro', 'starter']);
  assert.deepEqual(widget, sheet);
  assert.deepEqual(server, sheet);
});

const { PLANS } = require('../netlify/functions/submit-subscription-receipt')._test;

// CashFlow Studio and Business: the billing widget, the admin data function and the receipt check state the same prices.
test('CashFlow Studio and Business prices are the same in the billing widget, the admin data and the receipt check', () => {
  const widget = read('assets/platform.js');
  const admin = read('netlify/functions/admin-data.js');
  for (const [key, name] of [['studio', 'Studio'], ['business', 'Business']]) {
    const w = new RegExp("name: '" + name + "',[\\s\\S]*?monthlyPrice: (\\d+),\\s*price: (\\d+)").exec(widget);
    assert.deepEqual([+w[1], +w[2]], [PLANS[key].monthly, PLANS[key].annual], name + ' in assets/platform.js');
    assert.ok(admin.includes('plan === ' + "'" + key + "' ? " + PLANS[key].monthly), name + ' monthly price in admin-data.js');
    assert.ok(new RegExp('price: ' + PLANS[key].annual + ',\\s*monthlyPrice: ' + PLANS[key].monthly).test(admin), name + ' price table in admin-data.js');
  }
});
