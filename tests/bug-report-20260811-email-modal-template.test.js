const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('EmailJS sends invoice, quote, and estimate documents and has a public-key fallback', function () {
  const platform = read('assets/platform.js');
  const fallback = read('netlify/functions/emailjs-reminder.js');
  assert.match(platform, /emailKind === 'invoice' \|\| emailKind === 'quote' \|\| emailKind === 'estimate'/);
  assert.match(platform, /\^invoice\$\/i\.test\(payload\.documentLabel\) \? 'invoice'/);
  assert.doesNotMatch(fallback, /EMAILJS_PRIVATE_KEY is not configured/);
  assert.match(fallback, /if \(privateKey\) body\.accessToken = privateKey/);
});

test('Studio Add Transaction keeps its body independently scrollable', function () {
  const studio = read('starter.html');
  assert.match(studio, /#txn-modal \.modal-box\{display:flex;flex-direction:column;overflow:hidden\}/);
  assert.match(studio, /#txn-modal \.modal-body\{[^}]*min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch/);
  assert.match(studio, /modalBody\.scrollTop=0/);
});

test('dark invoice templates keep Bill To details visible on white paper', function () {
  const platform = read('assets/platform.js');
  const scoped = (platform.match(/\.invoice-head \.muted\{color:#fff!important\}/g) || []).length;
  assert.ok(scoped >= 3, 'expected the three dark-header templates to scope white muted text to the header');
  assert.doesNotMatch(platform, /cls \+ ' \.muted\{color:#fff!important\}'/);
});
