const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
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

test('Solo does not render or route to Team Access or Edit Backlog', () => {
  const solo = read('solo.html');
  assert.doesNotMatch(solo, /<(?:a|button)[^>]+data-nav="team"/);
  assert.doesNotMatch(solo, /<(?:a|button)[^>]+data-nav="backlog"/);
  assert.doesNotMatch(solo, /id="view-team"/);
  assert.doesNotMatch(solo, /id="view-backlog"/);
  assert.match(solo, /if\(view==='team'\|\|view==='backlog'\)\{[\s\S]*?window\.nav\('dashboard'\)/);
  assert.match(read('access-admin.html'), /if\(_plan === 'solo'\)\{[\s\S]*?solo\.html\?notice=team-access-unavailable/);
});

test('plan comparisons no longer advertise Edit Backlog as a Solo feature', () => {
  assert.match(read('index.html'), /Edit Backlog[\s\S]*?plan-not-included[\s\S]*?plan-included studio/);
  assert.match(read('onboarding.html'), /<tr><td>Edit Backlog<\/td><td><span class="ob-plan-dash" aria-label="Not included">—<\/span>/);
});
