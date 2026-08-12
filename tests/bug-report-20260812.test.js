const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('document email uses the authenticated server mailbox before EmailJS', () => {
  const platform = read('assets/platform.js');
  assert.match(platform, /async function sendDocumentViaSmtp\(opts, documentLabel\)/);
  assert.match(platform, /fetch\('\/\.netlify\/functions\/send-invoice'/);
  assert.match(platform, /if \(isDocument\) \{[\s\S]*?return await sendDocumentViaSmtp\(opts, documentLabel\)/);
  assert.match(platform, /trying EmailJS fallback/);
});

test('server document email supports invoices, quotes, and estimates', () => {
  const endpoint = read('netlify/functions/send-invoice.js');
  assert.match(endpoint, /documentLabel = \/\^estimate\$\/i/);
  assert.match(endpoint, /\^quote\|quotation\$/i);
  assert.match(endpoint, /documentLabel === 'Invoice' \? 'Due Date' : 'Valid Until'/);
  assert.match(endpoint, /subject: documentLabel \+/);
});

test('quick onboarding resets page scroll and removes exiting cards from flow', () => {
  const onboarding = read('onboarding.html');
  assert.match(onboarding, /\.ob-card\.exiting\{[^}]*position:absolute/);
  assert.match(onboarding, /window\.scrollTo\(\{top:0,left:0,behavior:'auto'\}\)/);
  assert.match(onboarding, /rightPanel\.scrollTop=0/);
});
