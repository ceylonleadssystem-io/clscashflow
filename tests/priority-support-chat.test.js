const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Priority Support renders a focused chat-only widget', function() {
  const platform = read('assets/platform.js');
  const start = platform.indexOf('function mountSupportWidget()');
  const end = platform.indexOf('window.clsMountSupportWidget', start);
  const widget = platform.slice(start, end);

  assert.match(widget, /Priority Support Chat/);
  assert.match(widget, /receive a reply within 30 minutes/);
  assert.match(widget, /data-chat-list/);
  assert.match(widget, /data-chat-form/);
  assert.doesNotMatch(widget, /New Ticket|My Tickets|data-refresh-tickets|data-support-form/);
});

test('Studio opens Priority Support without the Settings chrome', function() {
  const page = read('starter.html');

  assert.match(page, /support-focus-mode \.settings-page-head\{display:none\}/);
  assert.match(page, /classList\.toggle\('support-focus-mode',view==='support'\)/);
  assert.match(page, /Replies within 30 minutes/);
  assert.match(page, /Fast response:<\/strong> receive a reply within 30 minutes/);
});
