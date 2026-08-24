const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'ceylonry-admin.html'), 'utf8');
const endpoint = fs.readFileSync(path.join(root, 'netlify/functions/admin-data.js'), 'utf8');
const onboardingApi = fs.readFileSync(path.join(root, 'netlify/functions/growth-partner-code.js'), 'utf8');

test('Growth Partners have email, deletion, and immediate dashboard visibility', () => {
  assert.match(admin, /Growth Partner email \(commission notifications\)/);
  assert.match(admin, /data-delete-partner/);
  assert.match(endpoint, /action === 'deleteGrowthPartner'/);
  assert.match(endpoint, /status: 'REVOKED'/);
  assert.match(onboardingApi, /String\(partner\.status \|\| ''\)\.toLowerCase\(\) !== 'active'/);
});

test('commissions are payment-triggered, deduplicated, and capped at six paid months', () => {
  assert.match(endpoint, /PARTNER_COMMISSION_LKR = 1000/);
  assert.match(endpoint, /PARTNER_COMMISSION_MONTHS = 6/);
  assert.match(endpoint, /\[partnerId, uid, period\]\.join\('__'\)/);
  assert.match(endpoint, /earnedMonths >= PARTNER_COMMISSION_MONTHS/);
  assert.match(endpoint, /if \(status === 'paid'\) await createPartnerCommission/);
  assert.match(endpoint, /status: 'payable'/);
  assert.match(admin, /Commission payments/);
  assert.match(admin, /data-commission-status="paid"/);
});

test('partner notifications promise next-day payout and departed customers stop earning', () => {
  assert.match(endpoint, /payableByUtc: due\.toISOString\(\)/);
  assert.match(endpoint, /will be paid within the next day/);
  assert.match(endpoint, /voidedReason: 'Customer left'/);
  assert.match(endpoint, /user\.deleted === true/);
});

test('admin refresh avoids synchronizing the full authentication directory', () => {
  assert.match(endpoint, /const users = initialRows\[0\]/);
  assert.doesNotMatch(endpoint, /const users = await synchronizedUsers/);
});
