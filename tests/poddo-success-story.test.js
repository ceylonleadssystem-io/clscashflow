const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('Poddo success story uses its supplied brand logo in a compact proof carousel', () => {
  assert.match(page, /src="assets\/poddo-kids-club-logo\.png" alt="Poddo Kids Club logo"/);
  assert.match(page, /class="success-hero"/);
  assert.match(page, /id="proof-slider"/);
  assert.match(page, /Verified customer story/);
  assert.match(page, /data-proof-prev/);
  assert.match(page, /data-proof-next/);
  assert.match(page, /window\.setInterval\(\(\) => showProof/);
  assert.match(page, /Less admin\. <span>More time for kids\.<\/span>/);
  assert.ok(fs.existsSync(path.join(root, 'assets/poddo-kids-club-logo.png')));
});

test('Poddo story stacks into a single clean column on mobile', () => {
  assert.match(page, /\.success-hero\{grid-template-columns:1fr/);
  assert.match(page, /\.success-logo-panel\{min-height:220px/);
  assert.match(page, /\.proof-slide\{padding:30px 22px/);
});

test('benefit slides are not misrepresented as named customer testimonials', () => {
  assert.match(page, /Other slides describe product benefits and are not presented as customer testimonials/);
  assert.doesNotMatch(page, /30\+ businesses are using us/i);
});
