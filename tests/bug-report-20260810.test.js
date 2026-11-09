const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { pagePath } = require('./support/pages.cjs');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, pagePath(file)), 'utf8');
const sidebar = page => {
  const start = page.search(/<nav id="(?:sidebar|sb)">/);
  return page.slice(start, page.indexOf('</nav>', start) + 6);
};

test('mobile drawers expose exactly one sign-out action', () => {
  for (const file of ['solo.html', 'starter.html', 'growth.html']) {
    const nav = sidebar(read(file));
    const actions = nav.match(/(?:data-cls-fn="clsSignOut"|onclick="window\.clsSignOut\(\)")/g) || [];
    assert.equal(actions.length, 1, `${file} has one sign-out action in its drawer`);
  }
});
