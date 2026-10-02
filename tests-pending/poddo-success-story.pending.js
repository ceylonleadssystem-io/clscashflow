// Parked: these tests describe features that are not in the current system.
// See docs/reference/test-audit.md (section C). Not run by `npm test`; move back to tests/ when the feature is decided.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('benefit slides are not misrepresented as named customer testimonials', () => {
  assert.match(page, /Other slides describe product benefits and are not presented as customer testimonials/);
  assert.doesNotMatch(page, /30\+ businesses are using us/i);
});
