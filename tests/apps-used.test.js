const test = require('node:test');
const assert = require('node:assert/strict');
const { appsUsed } = require('../netlify/lib/apps-used');

test('every account uses the POS; GM and KDS only when switched on and not excluded by the plan', () => {
  assert.deepEqual(appsUsed(undefined), ['POS']);
  assert.deepEqual(appsUsed({ features: {} }), ['POS']);
  assert.deepEqual(appsUsed({ features: { 'view.guestManager': true } }), ['POS', 'GM']);
  assert.deepEqual(appsUsed({ features: { 'view.guestManager': true, 'checkout.kds': true } }), ['POS', 'GM', 'KDS']);
  // a location override counts, and KDS needs the kitchen tickets and open orders it builds on
  assert.deepEqual(appsUsed({ features: {}, locationFeatures: { L1: { 'view.guestManager': true } } }), ['POS', 'GM']);
  assert.deepEqual(appsUsed({ features: { 'checkout.kds': true, 'checkout.kitchenTickets': false } }), ['POS']);
  // the plan wins
  const sub = { enforced: true, featuresOff: ['view.guestManager'] };
  assert.deepEqual(appsUsed({ features: { 'view.guestManager': true, 'checkout.kds': true }, subscription: sub }), ['POS', 'KDS']);
  assert.deepEqual(appsUsed({ features: { 'view.guestManager': true }, subscription: { enforced: false, featuresOff: ['view.guestManager'] } }), ['POS', 'GM']);
});
