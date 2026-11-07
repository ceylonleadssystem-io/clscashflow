const test = require('node:test');
const assert = require('node:assert/strict');

const lib = require('../netlify/lib/appwrite');
const issued = [];
let caller = null;
lib.getUserFromEvent = async () => caller;
lib.users = () => ({ createToken: async (id, length, ttl) => { issued.push({ id, length, ttl }); return { secret: 'secret-for-' + id }; } });
const { handler } = require('../netlify/functions/pos-handoff');
const call = (headers) => handler({ httpMethod: 'POST', headers: Object.assign({ origin: 'https://ceylonrylabs.io', 'x-nf-client-connection-ip': '1.2.3.' + Math.floor(Math.random() * 250) }, headers || {}), body: '' });

test('a signed-in user gets a one-minute token for their own account only', async () => {
  caller = { id: 'user-1', email: 'a@b.c' };
  const res = await call({ authorization: 'Bearer jwt' });
  const json = JSON.parse(res.body);
  assert.equal(res.statusCode, 200);
  assert.equal(json.userId, 'user-1');
  assert.equal(json.secret, 'secret-for-user-1');
  assert.deepEqual(issued.at(-1), { id: 'user-1', length: 64, ttl: 60 });
});

test('no sign-in, no token', async () => {
  caller = null;
  const before = issued.length;
  const res = await call();
  assert.equal(res.statusCode, 401);
  assert.equal(issued.length, before);
});

test('requests from other sites are refused, and the automobile address is allowed', async () => {
  caller = { id: 'user-2' };
  assert.equal((await call({ authorization: 'Bearer jwt', origin: 'https://evil.example' })).statusCode, 403);
  assert.equal((await call({ authorization: 'Bearer jwt', origin: 'https://automobile.ceylonrylabs.io' })).statusCode, 200);
  assert.equal((await call({ authorization: 'Bearer jwt', origin: 'https://ogf.ceylonrylabs.io' })).statusCode, 200);
});
