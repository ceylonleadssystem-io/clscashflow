const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const toml = read('netlify.toml');
const block = (kind) => toml.split('[[' + kind + ']]').slice(1).map((chunk) => {
  const field = (name) => (new RegExp('^\\s*' + name + '\\s*=\\s*"?([^"\\n]*)"?', 'm').exec(chunk) || [])[1];
  return { from: field('from'), to: field('to'), status: field('status'), force: field('force'), for: field('for'), chunk };
});
const redirects = block('redirects');
const rule = (from) => redirects.find((r) => r.from === from);

test('pos.ceylonrylabs.io opens the POS app, ahead of the generic /posv2/* rule', () => {
  const r = rule('https://pos.ceylonrylabs.io/');
  assert.equal(r.to, '/pos-react/dist/index.html');
  assert.equal(r.status, '200');
  assert.equal(r.force, 'true');
  assert.ok(redirects.indexOf(r) < redirects.indexOf(rule('/posv2/*')));
});

test('the old ceylonrylabs.io/posv2/ moves to the POS address, on the main address only', () => {
  for (const from of ['https://ceylonrylabs.io/posv2', 'https://ceylonrylabs.io/posv2/']) {
    const r = rule(from);
    assert.ok(r, from);
    assert.equal(r.to, 'https://pos.ceylonrylabs.io/');
    assert.equal(r.status, '301');
  }
  // no rule for a bare /posv2/ path: the other addresses still load the POS files and pages from it
  assert.ok(redirects.find((r) => r.from === '/posv2/' && r.status === '200'));
  assert.equal(redirects.find((r) => r.from === '/posv2/*').status, '200');
});

test('the administration portal is only served at admin.ceylonrylabs.io; its old paths redirect there', () => {
  assert.equal(rule('https://admin.ceylonrylabs.io/').to, '/pos-react/dist/admin.html');
  for (const from of ['/posv2/admin', '/posv2/admin/', '/posv2/admin.html', '/pos-react/dist/admin.html']) {
    const r = rule(from);
    assert.ok(r, from);
    assert.equal(r.to, 'https://admin.ceylonrylabs.io/');
    assert.equal(r.status, '301');
    assert.equal(r.force, 'true');
    assert.ok(redirects.indexOf(r) < redirects.indexOf(rule('/posv2/*')), from + ' must come before /posv2/*');
  }
  // nothing else serves the admin file with a 200
  assert.deepEqual(redirects.filter((r) => /admin\.html$/.test(r.to || '') && r.status === '200').map((r) => r.from), ['https://admin.ceylonrylabs.io/']);
});

test('the service worker may control a whole POS address', () => {
  const h = block('headers').find((x) => x.for === '/posv2/sw.js');
  assert.match(h.chunk, /Service-Worker-Allowed\s*=\s*"\/"/);
});

test('pages no longer link to the old /posv2/ address', () => {
  const files = ['index.html', 'cashflow-home.html', 'pos-onboarding.html', 'app/index.html', 'manifest.webmanifest', 'cashflow/signin.html', 'assets/platform.js', 'pos-react/public/assets/platform.js', 'reservation-system/js/app.mjs', 'netlify/functions/pos-onboarding-email.js'];
  for (const f of files) assert.doesNotMatch(read(f), /posv2/, f + ' still mentions posv2');
  for (const f of ['index.html', 'cashflow-home.html', 'pos-onboarding.html', 'assets/platform.js']) assert.match(read(f), /https:\/\/pos\.ceylonrylabs\.io\//, f);
});
