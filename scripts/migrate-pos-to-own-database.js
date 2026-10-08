'use strict';
// Copies the POS rows (users/{uid}/pos, its split pieces and posCatalogBackups) from the main Appwrite database
// ("ceylonry" / app_documents) into the POS database ("pos" / pos_documents). It only ever COPIES: nothing is deleted,
// rows already present in the POS database are never overwritten (they may hold newer data), and row ids are kept.
//
//   APPWRITE_API_KEY=... node scripts/migrate-pos-to-own-database.js            dry run: shows what would be copied
//   APPWRITE_API_KEY=... node scripts/migrate-pos-to-own-database.js --apply    copies the missing rows
//   APPWRITE_API_KEY=... node scripts/migrate-pos-to-own-database.js --verify   compares every POS row in both databases
const { Client, Databases, Query } = require('node-appwrite');
const lib = require('../netlify/lib/appwrite');

const FIELDS = ['path', 'docId', 'data', 'ownerUid', 'email', 'createdAt', 'updatedAt'];
const PAGE = 100;

async function listPosRows(databases, store) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await databases.listDocuments(store.db, store.col, [Query.contains('path', ['/pos']), Query.limit(PAGE), Query.offset(offset)]);
    rows.push(...page.documents.filter(function(row) { return lib.isPosPath(row.path); }));
    if (page.documents.length < PAGE) return rows;
  }
}

async function readOrNull(databases, store, id) {
  try { return await databases.getDocument(store.db, store.col, id); }
  catch (error) { if (error && error.code === 404) return null; throw error; }
}

const pick = function(row) { return Object.fromEntries(FIELDS.filter(function(k) { return row[k] !== undefined; }).map(function(k) { return [k, row[k]]; })); };

// returns { found, copied, skipped, mismatched }
async function migrate(databases, options) {
  const apply = !!(options && options.apply), log = (options && options.log) || function() {};
  const from = { db: lib.DATABASE_ID, col: lib.COLLECTION_ID }, to = { db: lib.POS_DATABASE_ID, col: lib.POS_COLLECTION_ID };
  const rows = await listPosRows(databases, from);
  const result = { found: rows.length, copied: 0, skipped: 0, mismatched: 0 };
  for (const row of rows) {
    const existing = await readOrNull(databases, to, row.$id);
    if (existing) { result.skipped++; continue; } // already there (maybe newer): leave it alone
    log((apply ? 'copy  ' : 'would copy  ') + row.path + ' / ' + row.docId);
    if (!apply) continue;
    await databases.createDocument(to.db, to.col, row.$id, pick(row), []);
    const copy = await databases.getDocument(to.db, to.col, row.$id);
    if (copy.data !== row.data || copy.path !== row.path || copy.docId !== row.docId) { result.mismatched++; log('MISMATCH ' + row.$id); } else result.copied++;
  }
  return result;
}

// every POS row of the main database must exist in the POS database with the same text (rows changed since the copy are reported)
async function verify(databases, options) {
  const log = (options && options.log) || function() {};
  const from = { db: lib.DATABASE_ID, col: lib.COLLECTION_ID }, to = { db: lib.POS_DATABASE_ID, col: lib.POS_COLLECTION_ID };
  const result = { checked: 0, missing: 0, different: 0 };
  for (const row of await listPosRows(databases, from)) {
    result.checked++;
    const copy = await readOrNull(databases, to, row.$id);
    if (!copy) { result.missing++; log('MISSING   ' + row.path + ' / ' + row.docId); }
    else if (copy.data !== row.data) { result.different++; log('DIFFERENT ' + row.path + ' / ' + row.docId + ' (updated since the copy, or a mismatch)'); }
  }
  return result;
}

module.exports = { migrate, verify, listPosRows };

if (require.main === module) {
  if (!process.env.APPWRITE_API_KEY) { console.error('Set APPWRITE_API_KEY first.'); process.exit(1); }
  const databases = new Databases(new Client().setEndpoint(lib.APPWRITE_ENDPOINT).setProject(lib.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY));
  const arg = process.argv[2] || '';
  const run = arg === '--verify' ? verify(databases, { log: console.log }) : migrate(databases, { apply: arg === '--apply', log: console.log });
  run.then(function(r) { console.log(JSON.stringify(r)); if (!arg) console.log('Dry run only. Add --apply to copy.'); }, function(e) { console.error('Failed:', e.message); process.exit(1); });
}
