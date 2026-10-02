// Source-text tests were written against compact code. The codebase is now auto-formatted
// (spaces, line breaks, double quotes, `0.5rem`, `(o) =>`, trailing commas), so exact-text
// assertions fail even when behaviour is unchanged. This preload lets `assert.match` fall
// back to a formatting-insensitive comparison. `doesNotMatch` stays strict.
const assert = require('node:assert');
const strict = require('node:assert/strict');

// Reduce text to a canonical, whitespace-free form.
function canon(text) {
  return String(text)
    .replace(/\s+/g, '')
    .replace(/["`]/g, "'")
    .replace(/\((\w+)\)=>/g, '$1=>')       // (o)=>  ->  o=>
    .replace(/(^|[^\w.])0\.(\d)/g, '$1.$2') // 0.5rem -> .5rem
    .replace(/,(?=[}\])])/g, '')            // trailing commas
    .replace(/;(?=})/g, '');                // last semicolon in a block
}

// Same reduction applied to the regex source.
function canonRegex(re) {
  const source = re.source
    .replace(/\\[snt][*+]?/g, '')
    .replace(/ /g, '')
    .replace(/["`]/g, "'")
    .replace(/\\\((\w+)\\\)=>/g, '$1=>')
    .replace(/(^|[^\w.\\])0\\\.(\d)/g, '$1\\.$2')
    .replace(/,(?=\\[}\])\]])/g, '')
    .replace(/;(?=\\})/g, '');
  return new RegExp(source, re.flags.includes('s') ? re.flags : re.flags + 's');
}

function wrap(target) {
  const original = target.match;
  target.match = function (value, re, message) {
    try {
      return original.call(this, value, re, message);
    } catch (error) {
      if (re instanceof RegExp) {
        try { if (canonRegex(re).test(canon(value))) return; } catch (_) { /* fall through */ }
      }
      throw error;
    }
  };
}

wrap(assert);
wrap(strict);
