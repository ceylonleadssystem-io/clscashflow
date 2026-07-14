const test = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../netlify/functions/send-contact');

function parse(result) {
  return JSON.parse(result.body || '{}');
}

test('contact endpoint only accepts POST requests', async function() {
  const result = await handler({ httpMethod: 'GET', body: '' });
  assert.equal(result.statusCode, 405);
  assert.equal(parse(result).ok, false);
});

test('contact endpoint rejects incomplete submissions', async function() {
  const result = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({ fullName: 'Test User', email: 'test@example.com' })
  });
  assert.equal(result.statusCode, 400);
  assert.match(parse(result).error, /required fields/i);
});

test('contact endpoint rejects unsupported topics', async function() {
  const result = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({
      fullName: 'Test User',
      email: 'test@example.com',
      topic: 'Injected topic',
      message: 'Hello'
    })
  });
  assert.equal(result.statusCode, 400);
  assert.match(parse(result).error, /valid contact topic/i);
});

test('contact endpoint quietly accepts honeypot submissions', async function() {
  const result = await handler({
    httpMethod: 'POST',
    body: JSON.stringify({ website: 'https://spam.example' })
  });
  assert.equal(result.statusCode, 200);
  assert.equal(parse(result).ok, true);
});
