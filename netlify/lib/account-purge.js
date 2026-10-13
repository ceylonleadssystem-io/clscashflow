'use strict';

// Removes one POS account completely so old data does not pile up in the databases, and reports what it found and what is left.
//
//   inventory(uid)  read-only "parity check": every row, file and record that belongs to the account, plus warnings
//   purge(uid)      deletes them (bulky data first, the profile and the sign-in last, so a failed run can simply be repeated),
//                   then counts again: `remaining` must be zero
//
// All access goes through `deps` so the rules can be tested without Appwrite; `realDeps(lib)` builds the live ones.

const IMAGE_URL = /\/storage\/buckets\/[A-Za-z0-9._-]+\/files\/([A-Za-z0-9._-]+)\/view/g;

function kindOf(path, uid) {
  const rest = path.slice(('users/' + uid).length);
  if (rest === '/pos') return 'main';
  if (rest.includes('/__large_documents__/')) return 'pieces';
  if (/^\/pos\/main\/sales$/.test(rest)) return 'salesMonths';
  if (rest.startsWith('/posInvoices')) return 'invoices';
  if (rest.startsWith('/team')) return 'team';
  if (rest.startsWith('/posCatalogBackups')) return 'catalogBackups';
  return 'other';
}

function imageIdsOf(payload) {
  if (!payload) return [];
  const ids = new Set();
  const text = JSON.stringify(payload);
  let m;
  IMAGE_URL.lastIndex = 0;
  while ((m = IMAGE_URL.exec(text))) ids.add(m[1]);
  return [...ids];
}

function createPurger(deps) {
  async function inventory(uid, options) {
    options = options || {};
    const stores = [];
    for (const name of deps.stores) {
      const rows = (await deps.listRows(name, uid)).filter(function(r) { return r.path === 'users/' + uid || r.path.startsWith('users/' + uid + '/'); });
      const byKind = {};
      // the main document goes last: while it exists the account is still listed and a repeated run finds the rest
      rows.sort(function(a, b) { return (kindOf(a.path, uid) === 'main') - (kindOf(b.path, uid) === 'main'); });
      rows.forEach(function(r) { const k = kindOf(r.path, uid); byKind[k] = (byKind[k] || 0) + 1; });
      stores.push({ name, rows: rows.length, byKind, ids: rows.map(function(r) { return r.id; }) });
    }
    const payload = await deps.readPayload(uid);
    const payments = options.skipPayments ? [] : await deps.listPayments(uid);
    const invoices = await deps.listInvoices(uid);
    const named = await deps.listImages(uid);
    const imageIds = [...new Set(imageIdsOf(payload).concat(named.map(function(f) { return f.id; })))];
    const profile = await deps.profileRow(uid);
    const unpaid = invoices.filter(function(i) { return !['paid', 'void', 'cancelled'].includes(String((i.data || {}).status || '').toLowerCase()); });
    const paymentTotal = payments.reduce(function(t, p) { return t + (Number((p.data || {}).amountLkr) || 0); }, 0);
    const salesMonthRows = stores.reduce(function(n, s) { return n + (s.byKind.salesMonths || 0); }, 0);
    const profileData = (profile && profile.data) || {};
    const warnings = [];
    const nextDue = Date.parse(profileData.posNextPaymentDue || '');
    if (profileData.posPaid === true && nextDue > Date.now()) warnings.push({ code: 'paid-subscription', text: 'The subscription is paid until ' + new Date(nextDue).toISOString().slice(0, 10) + '. Deleting the account ends it with no refund.' });
    if (profileData.posAccountPaused !== true) warnings.push({ code: 'account-active', text: 'The account is not disabled. Staff may still be using it right now.' });
    const updated = Date.parse((payload && payload.syncMeta && payload.syncMeta.updatedAt) || '');
    if (updated && Date.now() - updated < 24 * 3600 * 1000) warnings.push({ code: 'recent-activity', text: 'The business synced within the last 24 hours (' + new Date(updated).toISOString().slice(0, 16).replace('T', ' ') + ' UTC).' });
    if (unpaid.length) warnings.push({ code: 'unpaid-invoices', text: unpaid.length + ' invoice' + (unpaid.length === 1 ? ' is' : 's are') + ' not marked paid.' });
    if (payments.length && !options.keepPayments) warnings.push({ code: 'payment-records', text: payments.length + ' payment record' + (payments.length === 1 ? '' : 's') + ' (LKR ' + Math.round(paymentTotal).toLocaleString('en-US') + ') will be deleted and revenue reports will drop by that amount. Tick "Keep payment records" to retain them.' });
    const team = await deps.teamMembers(uid);
    if (team) warnings.push({ code: 'team-members', text: team + ' team member sign-in' + (team === 1 ? ' is' : 's are') + ' linked to this account. Their sign-ins are not deleted but they lose access.' });
    return {
      uid,
      exists: !!profile || stores.some(function(s) { return s.rows; }),
      business: String(profileData.posBusinessName || profileData.bizName || (payload && payload.settings && payload.settings.business) || ''),
      stores: stores.map(function(s) { return { name: s.name, rows: s.rows, byKind: s.byKind }; }),
      rowIds: stores.map(function(s) { return { name: s.name, ids: s.ids }; }),
      counts: {
        databaseRows: stores.reduce(function(n, s) { return n + s.rows; }, 0),
        staffUsers: payload && Array.isArray(payload.users) ? payload.users.length : 0,
        locations: payload && Array.isArray(payload.locations) ? payload.locations.length : 0,
        products: payload && Array.isArray(payload.products) ? payload.products.length : 0,
        customers: payload && Array.isArray(payload.customers) ? payload.customers.length : 0,
        sales: (payload && Array.isArray(payload.sales) ? payload.sales.length : 0) + (salesMonthRows ? salesMonthRows + ' monthly sales documents' : ''),
        invoices: invoices.length,
        paymentRecords: payments.length,
        images: imageIds.length,
        profile: profile ? 1 : 0
      },
      imageIds,
      payments: payments.map(function(p) { return p.id; }),
      warnings
    };
  }

  async function purge(uid, options) {
    options = options || {};
    const found = await inventory(uid, options);
    if (!found.exists) { const err = new Error('Nothing was found for this account.'); err.statusCode = 404; throw err; }
    const done = { images: 0, payments: 0, rows: 0, profile: false, authUser: false };
    if (found.imageIds.length) { await deps.deleteImages(found.imageIds); done.images = found.imageIds.length; }
    if (!options.keepPayments) { for (const id of found.payments) { await deps.deletePayment(id); done.payments++; } }
    for (const store of found.rowIds) {
      await deps.deleteRows(store.name, store.ids);
      done.rows += store.ids.length;
    }
    // the sign-in goes before the profile: if it fails the profile stays, the account is still listed and the delete can be repeated
    try { await deps.deleteAuthUser(uid); done.authUser = true; }
    catch (error) { if (!error || error.code !== 404) done.authError = String((error && error.message) || error); else done.authUser = true; }
    if (!done.authError && found.counts.profile) { await deps.deleteProfile(uid); done.profile = true; }
    const left = await inventory(uid, { keepPayments: true, skipPayments: !!options.keepPayments });
    const remaining = { databaseRows: left.counts.databaseRows, profile: left.counts.profile, images: left.imageIds.length, paymentRecords: options.keepPayments ? 0 : left.counts.paymentRecords };
    const clean = !remaining.databaseRows && !remaining.profile && !remaining.images && !remaining.paymentRecords && !done.authError;
    return { done, remaining, clean, found: { databaseRows: found.counts.databaseRows, images: found.counts.images, paymentRecords: found.counts.paymentRecords } };
  }

  return { inventory, purge };
}

// Live access built on the shared Appwrite helpers.
function realDeps(lib, env) {
  const { Query, Storage } = require('node-appwrite');
  const BUCKET = (env && env.APPWRITE_IMAGES_BUCKET_ID) || process.env.APPWRITE_IMAGES_BUCKET_ID || 'pos-images';
  const stores = [{ name: 'pos', db: lib.POS_DATABASE_ID, col: lib.POS_COLLECTION_ID }];
  if (lib.DATABASE_ID !== lib.POS_DATABASE_ID || lib.COLLECTION_ID !== lib.POS_COLLECTION_ID) stores.push({ name: 'main', db: lib.DATABASE_ID, col: lib.COLLECTION_ID });
  if (process.env.APPWRITE_GM_ROUTING !== 'off') stores.push({ name: 'gm', db: lib.GM_DATABASE_ID, col: lib.GM_COLLECTION_ID });
  const store = function(name) { return stores.find(function(s) { return s.name === name; }); };
  const bounded = function(row, uid) { return row.path === 'users/' + uid || String(row.path || '').startsWith('users/' + uid + '/'); };
  return {
    stores: stores.map(function(s) { return s.name; }),
    async listRows(name, uid) {
      const s = store(name), out = [];
      for (let cursor = ''; ;) {
        const queries = [Query.contains('path', ['users/' + uid]), Query.select(['$id', 'path', 'docId']), Query.limit(100)];
        if (cursor) queries.push(Query.cursorAfter(cursor));
        const page = await lib.databases().listDocuments(s.db, s.col, queries);
        page.documents.forEach(function(r) { if (bounded(r, uid)) out.push({ id: r.$id, path: r.path, docId: r.docId }); });
        if (page.documents.length < 100) return out;
        cursor = page.documents[page.documents.length - 1].$id;
      }
    },
    async deleteRows(name, ids) {
      const s = store(name);
      for (let i = 0; i < ids.length; i += 10)
        await Promise.all(ids.slice(i, i + 10).map(async function(id) {
          try { await lib.databases().deleteDocument(s.db, s.col, id); } catch (error) { if (!error || error.code !== 404) throw error; }
        }));
    },
    async readPayload(uid) {
      const doc = await lib.getDocument('users/' + uid + '/pos', 'main').catch(function() { return null; });
      return doc && doc.data && doc.data.payload || null;
    },
    async listPayments(uid) {
      const rows = await lib.queryDocuments('subscriptionPayments', { fetchLimit: 5000 }).catch(function() { return []; });
      return rows.filter(function(r) { return String((r.data || {}).uid || '') === uid; });
    },
    async deletePayment(id) { return lib.deleteDocument('subscriptionPayments', id); },
    async listInvoices(uid) { return lib.queryDocuments('users/' + uid + '/posInvoices', { fetchLimit: 5000 }).catch(function() { return []; }); },
    async listImages(uid) {
      try {
        const storage = new Storage(lib.serverClient()), out = [];
        for (let cursor = ''; ;) {
          const queries = [Query.startsWith('name', uid + '__'), Query.limit(100)];
          if (cursor) queries.push(Query.cursorAfter(cursor));
          const page = await storage.listFiles({ bucketId: BUCKET, queries });
          page.files.forEach(function(f) { out.push({ id: f.$id, name: f.name }); });
          if (page.files.length < 100) return out;
          cursor = page.files[page.files.length - 1].$id;
        }
      } catch (_) { return []; }
    },
    async deleteImages(ids) {
      const storage = new Storage(lib.serverClient());
      for (const id of ids) { try { await storage.deleteFile({ bucketId: BUCKET, fileId: id }); } catch (error) { if (!error || error.code !== 404) throw error; } }
    },
    async profileRow(uid) { return lib.getDocument('users', uid).catch(function() { return null; }); },
    async deleteProfile(uid) { return lib.deleteDocument('users', uid); },
    async deleteAuthUser(uid) { return lib.users().delete(uid); },
    async teamMembers(uid) {
      const rows = await lib.queryDocuments('users/' + uid + '/team', { fetchLimit: 1000 }).catch(function() { return []; });
      return rows.filter(function(r) { return (r.data || {}).status === 'accepted' || (r.data || {}).acceptedUid; }).length;
    }
  };
}

module.exports = { createPurger, realDeps, kindOf, imageIdsOf };
