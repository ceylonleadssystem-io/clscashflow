const test = require('node:test');
const assert = require('node:assert/strict');

process.env.POS_ADMIN_TOKEN_SECRET = 'test-secret-'.padEnd(48, 'x');
const auth = require('../netlify/lib/admin-auth');
const kanban = require('../netlify/functions/kanban-board/kanban-board');

let record = { id: 'a1', email: 'dev@ceylonrylabs.io', active: true, role: 'admin' };
const tables = { kanban_cards: new Map(), kanban_updates: new Map() };
let nextId = 0;
const missing = () => Object.assign(new Error('missing'), { code: 404, type: 'document_not_found' });
const db = {
  listDocuments: async (_d, c) => ({ documents: [...tables[c].values()] }),
  getDocument: async (_d, c, id) => { if (!tables[c].has(id)) throw missing(); return tables[c].get(id); },
  createDocument: async (_d, c, id, data) => { const doc = { $id: c === 'kanban_updates' ? 'u' + ++nextId : id, ...data }; tables[c].set(doc.$id, doc); return doc; },
  updateDocument: async (_d, c, id, data) => { const doc = { ...tables[c].get(id), ...data }; tables[c].set(id, doc); return doc; }
};
Object.assign(kanban._deps, {
  db: () => db,
  getAdmin: async () => record,
  audit: async () => {},
  fetch: async () => ({ ok: true, json: async () => [
    { number: 1, title: 'Open feature', state: 'open', labels: [{ name: 'enhancement' }] },
    { number: 2, title: 'Built feature', state: 'open', labels: [{ name: 'Dev-enhancements' }] },
    { number: 3, title: 'Closed feature', state: 'closed', labels: [] },
    { number: 4, title: 'A pull request', state: 'open', pull_request: {}, labels: [] }
  ] })
});

const call = async (body, token = auth.signToken({ id: 'a1', email: 'dev@ceylonrylabs.io' }).token) => {
  const res = await kanban.handler({ httpMethod: 'POST', headers: token ? { authorization: 'Bearer ' + token } : {}, body: JSON.stringify(body) });
  return { status: res.statusCode, json: JSON.parse(res.body || '{}') };
};

test('only a signed-in full administrator reaches the board', async () => {
  assert.equal((await call({ action: 'kanbanList' }, '')).status, 401);
  assert.equal((await call({ action: 'kanbanList' }, 'a.b.c')).status, 401);
  record = { ...record, role: 'support' };
  assert.equal((await call({ action: 'kanbanList' })).status, 403);
  record = { ...record, role: 'admin', active: false };
  assert.equal((await call({ action: 'kanbanList' })).status, 403);
  record = { ...record, active: true };
});

test('import adds one card per feature in the matching column and keeps moved cards', async () => {
  const first = await call({ action: 'kanbanImport' });
  assert.equal(first.json.added, 3);
  assert.deepEqual(first.json.cards.map((c) => c.status), ['todo', 'built', 'done']);
  await call({ action: 'kanbanMove', cardId: 'gh_1', status: 'progress' });
  const again = await call({ action: 'kanbanImport' });
  assert.equal(again.json.added, 0);
  assert.equal(again.json.cards.find((c) => c.id === 'gh_1').status, 'progress');
});

test('updates are posted under a card with the author, and bad input is refused', async () => {
  const posted = await call({ action: 'kanbanAddUpdate', cardId: 'gh_1', message: '  Started work  ', author: 'someone@else.com' });
  assert.equal(posted.json.update.message, 'Started work');
  assert.equal(posted.json.update.author, 'dev@ceylonrylabs.io');
  assert.equal((await call({ action: 'kanbanUpdates', cardId: 'gh_1' })).json.updates.length, 1);
  assert.equal((await call({ action: 'kanbanAddUpdate', cardId: 'gh_1', message: '   ' })).status, 400);
  assert.equal((await call({ action: 'kanbanAddUpdate', cardId: 'gh_1', message: 'x'.repeat(4001) })).status, 400);
  assert.equal((await call({ action: 'kanbanAddUpdate', cardId: 'gh_99', message: 'hello' })).status, 404);
  assert.equal((await call({ action: 'kanbanMove', cardId: 'gh_1', status: 'nowhere' })).status, 400);
});

test('the board has its own address, and requests from it are allowed', () => {
  const toml = require('fs').readFileSync(require('path').join(__dirname, '..', 'netlify.toml'), 'utf8');
  assert.match(toml, /from = "https:\/\/kanban\.ceylonrylabs\.io\/"\s+to = "\/pos-react\/dist\/src\/kanban-board\/index\.html"/);
  assert.equal(require('../netlify/lib/security').originAllowed({ headers: { origin: 'https://kanban.ceylonrylabs.io' } }), true);
});
