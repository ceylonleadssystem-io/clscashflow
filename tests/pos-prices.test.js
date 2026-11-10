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
