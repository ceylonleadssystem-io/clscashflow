const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('Poddo success story uses its supplied brand logo and clean journey layout', () => {
  assert.match(page, /src="assets\/poddo-kids-club-logo\.png" alt="Poddo Kids Club logo"/);
  assert.match(page, /class="success-hero"/);
  assert.match(page, /class="success-journey"/);
  assert.match(page, /01 · Before/);
  assert.match(page, /02 · With Cashflow/);
  assert.match(page, /03 · Today/);
  assert.match(page, /Less admin\. <span>More time for kids\.<\/span>/);
  assert.ok(fs.existsSync(path.join(root, 'assets/poddo-kids-club-logo.png')));
});

test('Poddo story stacks into a single clean column on mobile', () => {
  assert.match(page, /\.success-hero\{grid-template-columns:1fr/);
  assert.match(page, /\.success-journey\{grid-template-columns:1fr/);
  assert.match(page, /\.success-logo-panel\{min-height:0;aspect-ratio:1/);
});
