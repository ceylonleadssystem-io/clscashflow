const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const onboarding = fs.readFileSync(path.join(root, 'onboarding.html'), 'utf8');
const welcome = fs.readFileSync(path.join(root, 'netlify/functions/send-welcome.js'), 'utf8');

test('final onboarding requires a named terms and privacy acceptance', () => {
  assert.match(onboarding, /id="acceptance-full-name"/);
  assert.match(onboarding, /id="acceptance-checkbox"/);
  assert.match(onboarding, /I Agree &amp; Start My 15-Day Free Trial/);
  assert.match(onboarding, /if\(!consent\.fullName\)/);
  assert.match(onboarding, /if\(!consent\.accepted\)/);
  assert.match(onboarding, /prepaid monthly bank transfer and payment-slip upload/);
});

test('acceptance evidence is versioned and saved as a separate historical document', () => {
  assert.match(onboarding, /TERMS-2026-08-21-V1/);
  assert.match(onboarding, /PRIVACY-2026-08-21-V1/);
  assert.match(onboarding, /collection\('termsAcceptances'\)\.doc\(acceptanceId\)\.set\(record\)/);
  assert.match(onboarding, /fullNameAtAcceptance/);
  assert.match(onboarding, /recurringBillingAuthorised:false/);
});

test('welcome function notifies the internal onboarding mailbox', () => {
  assert.match(welcome, /to: 'hello@ceylonrylabs\.io'/);
  assert.match(welcome, /New Cashflow client onboarded/);
  assert.match(welcome, /adminNotified: true/);
});
