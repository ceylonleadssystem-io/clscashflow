const test = require('node:test');
const assert = require('node:assert/strict');
process.env.APPWRITE_API_KEY = 'test-key';
const fn = require('../netlify/functions/appwrite-files');

const PNG = 'data:image/png;base64,' + Buffer.from('fakepng').toString('base64');
const call = (body) => fn.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify(body) });

function fakeStorage() {
  const files = new Map(); let bucket = false; const calls = [];
  return {
    calls, files,
    getBucket: async () => { if (!bucket) throw Object.assign(new Error('nf'), { code: 404 }); },
    createBucket: async (p) => { bucket = true; calls.push(['createBucket', p.bucketId, p.permissions]); },
    createFile: async (p) => { const f = { $id: 'f' + (files.size + 1), name: p.file.name }; files.set(f.$id, f); calls.push(['createFile', p.bucketId, p.permissions]); return f; },
      };
}

test('uploads need a signed-in user', async () => {
  fn._deps.user = async () => null; fn._deps.storage = fakeStorage;
  assert.equal((await call({ action: 'upload', data: PNG })).statusCode, 401);
});

test('upload creates the bucket once, stores the file and returns a public view URL', async () => {
  const storage = fakeStorage(); fn._deps.user = async () => ({ id: 'u1' }); fn._deps.storage = () => storage;
  const r = await call({ action: 'upload', kind: 'logo', data: PNG });
  const body = JSON.parse(r.body);
  assert.equal(r.statusCode, 200);
  assert.match(body.url, /\/storage\/buckets\/pos-images\/files\/f1\/view\?project=/);
  assert.equal(storage.files.get('f1').name, 'u1__logo.png');
  await call({ action: 'upload', kind: 'product', data: PNG });
  assert.equal(storage.calls.filter((c) => c[0] === 'createBucket').length, 1);
});

test('rejects non-images and oversized images', async () => {
  fn._deps.user = async () => ({ id: 'u1' }); fn._deps.storage = fakeStorage;
  assert.equal((await call({ action: 'upload', data: 'data:text/html;base64,PGI+' })).statusCode, 400);
  assert.equal((await call({ action: 'upload', data: 'data:image/png;base64,' + Buffer.alloc(1600000).toString('base64') })).statusCode, 413);
});
