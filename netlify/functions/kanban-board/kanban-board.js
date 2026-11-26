// Feature board of the admin portal: one card per feature (GitHub issue labelled "enhancement") with messages and
// updates under it. Everything lives in the separate administration database (collections kanban_cards and
// kanban_updates, created by scripts/setup-admin-db.mjs) and only full administrators can read or change it.
const { Databases, Query, ID } = require('node-appwrite');
const { guard, reply } = require('../../lib/security');
const { serverClient } = require('../../lib/appwrite');
const { verifyToken, isAdminEmail, canUsePortal } = require('../../lib/admin-auth');
const store = require('../../lib/admin-store');
const log = require('../../lib/log').createLogger('kanban-board');

const STATUSES = ['todo', 'progress', 'built', 'done'];
const MAX_MESSAGE = 4000;
const REPO = process.env.KANBAN_GITHUB_REPO || 'ceylonleadssystem-io/clscashflow';

// replaced in tests
const deps = { db: function() { return new Databases(serverClient()); }, getAdmin: store.getAdmin, audit: store.audit, fetch: function(url, options) { return fetch(url, options); } };

const fail = function(statusCode, message) { const e = new Error(message); e.statusCode = statusCode; return e; };

async function verifyAdmin(event) {
  const match = String(event.headers.authorization || event.headers.Authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!match) throw fail(401, 'Administrator sign-in is required.');
  const claims = verifyToken(match[1]);
  if (!claims) throw fail(401, 'Your administrator session has expired. Please sign in again.');
  if (!isAdminEmail(claims.email)) throw fail(403, 'This account is not authorized for the admin portal.');
  const record = await deps.getAdmin(String(claims.sub || ''));
  if (!record || !record.active || record.email !== String(claims.email).toLowerCase()) throw fail(403, 'This administrator account is not active.');
  if (!canUsePortal(record)) throw fail(403, 'This account can only use live support.');
  return record;
}

const database = function() { return store.ADMIN_DATABASE_ID; };
const toCard = function(d) { return { id: d.$id, issue: d.issue || 0, title: d.title || '', status: STATUSES.indexOf(d.status) >= 0 ? d.status : 'todo', lastUpdateAt: d.lastUpdateAt || '' }; };
const toUpdate = function(d) { return { id: d.$id, message: d.message || '', author: d.author || '', at: d.at || '' }; };

async function listAll(collection, queries) {
  const out = [];
  let cursor = '';
  for (;;) {
    const page = await deps.db().listDocuments(database(), collection, queries.concat([Query.limit(100)], cursor ? [Query.cursorAfter(cursor)] : []));
    out.push.apply(out, page.documents);
    if (page.documents.length < 100) return out;
    cursor = page.documents[page.documents.length - 1].$id;
  }
}

async function existingCard(id) {
  if (!/^[A-Za-z0-9_-]{1,36}$/.test(id)) throw fail(400, 'Choose a card.');
  try { return await deps.db().getDocument(database(), 'kanban_cards', id); }
  catch (e) { if (e && e.code === 404 && e.type === 'document_not_found') throw fail(404, 'This card no longer exists.'); throw e; }
}

async function featureIssues() {
  const out = [];
  for (let page = 1; page <= 10; page += 1) {
    const res = await deps.fetch('https://api.github.com/repos/' + REPO + '/issues?labels=enhancement&state=all&per_page=100&page=' + page, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ceylonry-admin' } });
    if (!res.ok) throw fail(502, 'The feature list could not be read from GitHub (' + res.status + ').');
    const rows = await res.json();
    out.push.apply(out, rows.filter(function(i) { return !i.pull_request; }));
    if (rows.length < 100) break;
  }
  return out;
}

function statusOfIssue(issue) {
  if (issue.state === 'closed') return 'done';
  return (issue.labels || []).some(function(l) { return l.name === 'Dev-enhancements'; }) ? 'built' : 'todo';
}

// Adds a card for every feature that has none yet. Cards already on the board keep the column the team put them in.
async function importFeatures() {
  const have = new Set((await listAll('kanban_cards', [])).map(function(d) { return d.$id; }));
  const missing = (await featureIssues()).filter(function(i) { return !have.has('gh_' + i.number); });
  for (let at = 0; at < missing.length; at += 10) {
    await Promise.all(missing.slice(at, at + 10).map(async function(i) {
      try {
        await deps.db().createDocument(database(), 'kanban_cards', 'gh_' + i.number, { issue: i.number, title: String(i.title || '').slice(0, 300), status: statusOfIssue(i) }, []);
      } catch (e) { if (!e || e.code !== 409) throw e; } // another administrator imported it a moment ago
    }));
  }
  return missing.length;
}

async function run(admin, body) {
  const action = String(body.action || '');
  const cardId = String(body.cardId || '');
  if (action === 'kanbanList') return { cards: (await listAll('kanban_cards', [])).map(toCard) };
  if (action === 'kanbanImport') {
    const added = await importFeatures();
    await deps.audit({ adminEmail: admin.email, action: 'kanban-import', target: '', detail: added + ' feature cards added' });
    return { added: added, cards: (await listAll('kanban_cards', [])).map(toCard) };
  }
  if (action === 'kanbanUpdates') {
    await existingCard(cardId);
    return { updates: (await listAll('kanban_updates', [Query.equal('cardId', [cardId]), Query.orderAsc('at')])).map(toUpdate) };
  }
  if (action === 'kanbanMove') {
    if (STATUSES.indexOf(body.status) < 0) throw fail(400, 'Choose a column.');
    await existingCard(cardId);
    const card = await deps.db().updateDocument(database(), 'kanban_cards', cardId, { status: body.status });
    await deps.audit({ adminEmail: admin.email, action: 'kanban-move', target: cardId, detail: 'Moved to ' + body.status });
    return { card: toCard(card) };
  }
  if (action === 'kanbanAddUpdate') {
    const message = String(body.message || '').trim();
    if (!message) throw fail(400, 'Write a message first.');
    if (message.length > MAX_MESSAGE) throw fail(400, 'The message is too long (' + MAX_MESSAGE + ' characters at most).');
    await existingCard(cardId);
    const at = new Date().toISOString();
    const update = await deps.db().createDocument(database(), 'kanban_updates', ID.unique(), { cardId: cardId, message: message, author: admin.email, at: at }, []);
    await deps.db().updateDocument(database(), 'kanban_cards', cardId, { lastUpdateAt: at });
    await deps.audit({ adminEmail: admin.email, action: 'kanban-update', target: cardId, detail: 'Posted an update' });
    return { update: toUpdate(update) };
  }
  throw fail(400, 'Unknown action.');
}

exports.handler = async function(event) {
  const blocked = guard(event, { name: 'kanban-board', methods: ['POST'], limit: 120, windowMs: 60000, maxBody: 30000 });
  if (blocked) return blocked;
  try {
    const admin = await verifyAdmin(event);
    let body = {};
    try { body = JSON.parse(event.body || '{}') || {}; } catch (_) { /* unknown action below */ }
    return reply(event, 200, Object.assign({ ok: true }, await run(admin, body)));
  } catch (error) {
    if (error && error.statusCode) return reply(event, error.statusCode, { ok: false, error: error.message });
    log.error('feature board request failed', error);
    // 404 here means the collections (or the database) do not exist yet
    if (error && error.code === 404) return reply(event, 503, { ok: false, error: 'The feature board is not set up yet. Run node scripts/setup-admin-db.mjs once.' });
    return reply(event, 500, { ok: false, error: 'The feature board request failed.' });
  }
};
exports._deps = deps;
