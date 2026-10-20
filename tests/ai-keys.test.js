const test = require('node:test');
const assert = require('node:assert');
process.env.CEYLO_KEY_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const keys = require('../netlify/lib/ai-keys');

test('a saved AI key is encrypted and only its last 4 characters are ever shown', () => {
  const box = keys._encrypt('sk-ant-abcdefghijklmnopqrstuvwxyz1234');
  assert.doesNotMatch(box, /abcdefghij/);
  assert.equal(keys._decrypt(box), 'sk-ant-abcdefghijklmnopqrstuvwxyz1234');
  const shown = keys.publicStatus({ provider: 'anthropic', model: 'claude-opus-5-5', last4: '1234', box, savedAt: '2026-10-20T00:00:00Z' });
  assert.deepEqual(Object.keys(shown).sort(), ['last4', 'model', 'provider', 'providerLabel', 'saved', 'savedAt']);
  assert.equal(keys.publicStatus(null).saved, false);
});

test('keys and model names are checked before anything is stored', () => {
  assert.match(keys.validate('other', 'x', ''), /Choose/);
  assert.match(keys.validate('anthropic', 'sk-oops', ''), /does not look like/);
  assert.equal(keys.validate('anthropic', 'sk-ant-' + 'a'.repeat(30), ''), '');
  assert.match(keys.validate('openai', 'sk-' + 'a'.repeat(30), ''), /model name/);
  assert.match(keys.validate('gemini', 'A'.repeat(39), 'bad model!'), /not allowed/);
});

test('ChatGPT and Gemini requests send the key in a header and read the answer; a rejected key gives a clear message', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    calls.push({ url, init });
    if (url.includes('openai')) return new Response(JSON.stringify({ choices: [{ message: { content: 'Check the printer cable.' } }] }), { status: 200 });
    if (init.headers['x-goog-api-key'] === 'bad'.repeat(11)) return new Response('{}', { status: 403 });
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Pair the KDS.' }] } }] }), { status: 200 });
  });
  const messages = [{ role: 'user', content: 'Hi' }];
  assert.equal(await keys.ask({ provider: 'openai', key: 'sk-x', model: 'm1', system: 'S', messages }), 'Check the printer cable.');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer sk-x');
  assert.deepEqual(JSON.parse(calls[0].init.body).messages[0], { role: 'system', content: 'S' });
  assert.equal(await keys.ask({ provider: 'gemini', key: 'g'.repeat(33), model: 'm2', system: 'S', messages }), 'Pair the KDS.');
  assert.doesNotMatch(calls[1].url, /key=/);
  await assert.rejects(keys.ask({ provider: 'gemini', key: 'bad'.repeat(11), model: 'm2', system: 'S', messages }), /did not accept this API key/);
});
