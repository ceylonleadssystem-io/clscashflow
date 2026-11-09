const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { pagePath } = require('./support/pages.cjs');
const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, pagePath(file)), 'utf8');

test('EmailJS sends invoice, quote, and estimate documents and has a public-key fallback', function () {
  const platform = read('assets/platform.js');
  const fallback = read('netlify/functions/emailjs-reminder.js');
  assert.match(platform, /emailKind === 'invoice' \|\| emailKind === 'quote' \|\| emailKind === 'estimate'/);
  assert.match(platform, /\^invoice\$\/i\.test\(payload\.documentLabel\) \? 'invoice'/);
  assert.doesNotMatch(fallback, /EMAILJS_PRIVATE_KEY is not configured/);
  assert.match(fallback, /if \(privateKey\) body\.accessToken = privateKey/);
});

test('dark invoice templates keep Bill To details visible on white paper', function () {
  const platform = read('assets/platform.js');
  const scoped = (platform.match(/\.invoice-head \.muted\{color:#fff!important\}/g) || []).length;
  assert.ok(scoped >= 3, 'expected the three dark-header templates to scope white muted text to the header');
  assert.doesNotMatch(platform, /cls \+ ' \.muted\{color:#fff!important\}'/);
});
