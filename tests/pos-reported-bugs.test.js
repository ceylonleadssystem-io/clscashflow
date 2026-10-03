const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const platform = fs.readFileSync(path.join(root, 'assets', 'platform.js'), 'utf8');
const mailer = fs.readFileSync(path.join(root, 'netlify', 'functions', 'send-invoice.js'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const config = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');

test('POS receipts use server email first with EmailJS fallback', () => {
  assert.match(platform, /if \(isDocument \|\| isReceipt\)/);
  assert.match(platform, /sendDocumentViaSmtp\(opts, isReceipt \? 'Receipt' : documentLabel\)/);
  assert.match(mailer, /\^receipt\$\/i\.test\(rawLabel\) \? 'Receipt'/);
  assert.match(mailer, /TOTAL PAID/);
});

