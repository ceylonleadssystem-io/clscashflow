const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('shared platform exposes quote and estimate email support', function() {
  const platform = read('assets/platform.js');
  assert.match(platform, /window\.clsSendDocumentEmail\s*=/);
  assert.match(platform, /function documentEmailHtml\s*\(/);
  assert.match(platform, /Quote total|label \+ ' total/);
});

for (const file of ['solo.html', 'starter.html', 'growth.html']) {
  test(file + ' provides document email, filters, and mobile sign out', function() {
    const page = read(file);
    assert.match(page, /id="quote-from"/);
    assert.match(page, /id="quote-to"/);
    assert.match(page, /id="quote-sort"/);
    assert.match(page, /id="quote-type-filter"/);
    assert.match(page, /id="quote-status-filter"/);
    assert.match(page, /mobile-sign-out/);
    assert.match(page, file === 'growth.html' ? /emailBusinessQuote/ : /emailQuote/);
    assert.match(page, /clsSendDocumentEmail/);
  });

  test(file + ' keeps register actions visible at scaled laptop widths', function() {
    const page = read(file);
    assert.match(page, /@media\(min-width:761px\) and \(max-width:1600px\)/);
    assert.match(page, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
    assert.match(page, file === 'growth.html' ? /table:has\(#quote-body\)/ : /document-register-table/);
    assert.match(page, /grid-column:1\/-1/);
  });
}
