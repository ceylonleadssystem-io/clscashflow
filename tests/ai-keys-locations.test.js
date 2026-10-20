const test = require('node:test');
const assert = require('node:assert');
process.env.CEYLO_KEY_SECRET = 'test-secret-that-is-at-least-32-characters-long';
// an in-memory store stands in for Appwrite (patched before ai-keys reads the helpers)
const lib = require('../netlify/lib/appwrite');
const rows = new Map();
lib.getDocument = async (path, id) => (rows.has(path + '/' + id) ? { data: rows.get(path + '/' + id) } : null);
lib.upsertDocument = async (path, id, data) => rows.set(path + '/' + id, JSON.parse(JSON.stringify(data)));
lib.deleteDocument = async (path, id) => rows.delete(path + '/' + id);
const keys = require('../netlify/lib/ai-keys');

test('each location keeps its own AI key; removing one leaves the others', async () => {
  await keys.save('biz1', 'colombo', 'anthropic', 'sk-ant-' + 'a'.repeat(30) + 'COL1', '', 'u1');
  await keys.save('biz1', 'kandy', 'openai', 'sk-' + 'b'.repeat(30) + 'KAN2', 'some-model', 'u1');
  assert.deepEqual(await keys.keyFor('biz1', 'colombo'), { provider: 'anthropic', model: 'claude-opus-5-5', key: 'sk-ant-' + 'a'.repeat(30) + 'COL1' });
  assert.equal((await keys.keyFor('biz1', 'kandy')).provider, 'openai');
  assert.equal(await keys.keyFor('biz1', 'galle'), null);
  assert.equal(await keys.keyFor('biz2', 'colombo'), null);
  const shown = await keys.statuses('biz1');
  assert.deepEqual(Object.keys(shown).sort(), ['colombo', 'kandy']);
  assert.equal(shown.kandy.last4, 'KAN2');
  assert.doesNotMatch(JSON.stringify(shown), /aaaaaaaa|bbbbbbbb/);
  assert.doesNotMatch(JSON.stringify([...rows.values()]), /aaaaaaaa|bbbbbbbb/, 'stored encrypted');
  await keys.remove('biz1', 'colombo');
  assert.equal(await keys.keyFor('biz1', 'colombo'), null);
  assert.equal((await keys.keyFor('biz1', 'kandy')).provider, 'openai');
  await keys.remove('biz1', 'kandy');
  assert.equal(rows.size, 0, 'the row goes when the last key is removed');
});

test('a location id with unexpected characters never matches a key', async () => {
  assert.equal(keys.safeLocation('../x'), '');
  assert.equal(await keys.keyFor('biz1', '../x'), null);
});
