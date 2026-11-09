const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { pagePath } = require('./support/pages.cjs');
const root = path.join(__dirname, '..');
const onboarding = fs.readFileSync(path.join(root, pagePath('onboarding.html')), 'utf8');
const welcome = fs.readFileSync(path.join(root, 'netlify/functions/send-welcome.js'), 'utf8');

test('welcome function notifies the internal onboarding mailbox', () => {
  assert.match(welcome, /to: 'hello@ceylonrylabs\.io'/);
  assert.match(welcome, /New Cashflow client onboarded/);
  assert.match(welcome, /adminNotified: true/);
});
