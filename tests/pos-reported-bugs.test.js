const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pos = fs.readFileSync(path.join(root, 'pos-system', 'pos-system.html'), 'utf8');
const platform = fs.readFileSync(path.join(root, 'assets', 'platform.js'), 'utf8');
const mailer = fs.readFileSync(path.join(root, 'netlify', 'functions', 'send-invoice.js'), 'utf8');

test('product prices survive business type changes and cloud merges', () => {
  assert.match(pos, /createdAt:new Date\(\)\.toISOString\(\)/);
  assert.match(pos, /modifierIds:.*updatedAt:new Date\(\)\.toISOString\(\)/s);
  assert.match(pos, /Object\.assign\(product,\{name:name.*cost:cost,price:price/s);
});

test('cloud account refresh applies the saved appearance immediately', () => {
  assert.match(pos, /window\.clsApplyPosTheme=applyTheme/);
  assert.match(pos, /refreshSyncedView\(\).*clsApplyPosTheme\(db\.settings\?\.uiTheme\|\|'ceylonry',false\)/s);
});

test('POS receipts use server email first with EmailJS fallback', () => {
  assert.match(platform, /if \(isDocument \|\| isReceipt\)/);
  assert.match(platform, /sendDocumentViaSmtp\(opts, isReceipt \? 'Receipt' : documentLabel\)/);
  assert.match(mailer, /\^receipt\$\/i\.test\(rawLabel\) \? 'Receipt'/);
  assert.match(mailer, /TOTAL PAID/);
});

test('full-screen menu toggle can reveal the sidebar', () => {
  assert.match(pos, /body\.full:not\(\.sidebar-collapsed\) \.side\{display:flex!important\}/);
  assert.match(pos, /body\.full\.sidebar-collapsed:has\(#view-checkout\.active\) \.side\{display:none!important\}/);
});

test('product deletion records a cloud tombstone before syncing', () => {
  assert.match(pos, /installAccessAndDeletionEnforcement\(\).*db\.deletedIds\.products.*clsSyncPosNow/s);
});

test('POS only restores the explicitly approved business account', () => {
  assert.match(pos, /POS_LOGIN_UID_KEY='ceylonry-pos-login-uid'/);
  assert.match(pos, /approvedUid===user\.uid/);
  assert.match(pos, /sessionStorage\.removeItem\(POS_LOGIN_UID_KEY\)/);
  assert.match(pos, /if\(firebase\.auth\(\)\.currentUser\)await firebase\.auth\(\)\.signOut\(\);var cred=await firebase\.auth\(\)\.signInWithEmailAndPassword/);
});

test('role navigation remains hidden despite forced button styling', () => {
  assert.match(pos, /#nav button\[hidden\]\{display:none!important\}/);
  assert.match(pos, /button\.hidden=!canView\(button\.dataset\.view\)/);
  assert.match(pos, /cashier:\['checkout','customers','staff'\]/);
  assert.match(pos, /management\.hidden=!user\|\|!\['owner','manager'\]\.includes\(user\.role\)/);
});

test('business-specific settings hide restaurant controls from hardware shops', () => {
  assert.match(pos, /supportsFoodOrders\(\).*\['restaurant','cafe'\]/s);
  assert.match(pos, /orderSettings\.hidden=!supportsFoodOrders\(\)/);
  assert.match(pos, /serviceSettings\.hidden=!supportsServiceCharge\(\)/);
  assert.match(pos, /foodService\?enabled:\[\]/);
});

test('POS business login provides password recovery', () => {
  assert.match(pos, /id='pos-forgot-password'/);
  assert.match(pos, /firebase\.auth\(\)\.sendPasswordResetEmail\(email\)/);
  assert.match(pos, /Password reset link sent/);
});

test('catalogue recovery never restores intentionally deleted products', () => {
  assert.match(pos, /intentionallyDeleted=new Set\(current\.deletedIds\.products\.map\(String\)\)/);
  assert.match(pos, /products=\(products\|\|\[\]\)\.filter\(function\(product\)\{return!intentionallyDeleted\.has/);
  assert.doesNotMatch(pos, /restoredIds=new Set\(products\.map/);
});
