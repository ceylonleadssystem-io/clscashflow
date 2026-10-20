const test = require('node:test');
const assert = require('node:assert');
const { _contextText } = require('../netlify/functions/ceylo-ask');

test('Ask Ceylo sends the check results and switched-off features, trimmed, and nothing else from the settings', () => {
  const text = _contextText(
    { role: 'cashier', view: 'checkout', checks: [{ status: 'warn', area: 'Printing', title: 'USB receipt printer is not connected', text: 'Check the cable.' }] },
    { business: 'Lotus Café', businessType: 'restaurant', features: { 'checkout.kds': false, 'view.sales': true }, ownerAuth: { pinHash: 'secret' }, supportCode: '998877' },
  );
  assert.match(text, /Lotus Café · type: restaurant/);
  assert.match(text, /Person asking: cashier/);
  assert.match(text, /\[warn\] Printing: USB receipt printer is not connected \(Check the cable\.\)/);
  assert.match(text, /switched off by the administrator: checkout\.kds/);
  assert.doesNotMatch(text, /view\.sales|secret|998877/);
});

test('Ask Ceylo caps the number of checks it forwards', () => {
  const checks = Array.from({ length: 100 }, (_, i) => ({ status: 'ok', area: 'A', title: 'check ' + i }));
  const text = _contextText({ checks }, {});
  assert.match(text, /check 59/);
  assert.doesNotMatch(text, /check 60/);
});
