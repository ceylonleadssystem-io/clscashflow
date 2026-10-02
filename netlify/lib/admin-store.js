'use strict';

// Access to the separate administration database. It is a different Appwrite database from
// the one that holds client workspaces (`ceylonry` / `app_documents`), so nothing a client
// can reach, and nothing in their data, can touch an administrator record.
//
// Collections (created by scripts/setup-admin-db.mjs):
//   admins     one record per administrator: email, name, passwordHash, active, failedAttempts,
//              lockedUntil, lastLoginAt, createdAt
//   audit_log  append-only trail of sign-ins and admin actions

const { Databases, Query, ID } = require('node-appwrite');
const { serverClient, clean } = require('./appwrite');

const ADMIN_DATABASE_ID = process.env.APPWRITE_ADMIN_DATABASE_ID || 'pos_admin';
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

function db() { return new Databases(serverClient()); }

function toAdmin(doc) {
  return doc && { id: doc.$id, email: String(doc.email || '').toLowerCase(), name: doc.name || '', passwordHash: doc.passwordHash || '', active: doc.active === true, failedAttempts: Number(doc.failedAttempts) || 0, lockedUntil: doc.lockedUntil || '' };
}

async function findAdminByEmail(email) {
  const res = await db().listDocuments(ADMIN_DATABASE_ID, 'admins', [Query.equal('email', [String(email).toLowerCase()]), Query.limit(1)]);
  return toAdmin(res.documents[0]);
}

async function getAdmin(id) {
  try { return toAdmin(await db().getDocument(ADMIN_DATABASE_ID, 'admins', id)); }
  catch (error) { if (error && error.code === 404) return null; throw error; }
}

function isLocked(admin, now) { return !!admin.lockedUntil && Date.parse(admin.lockedUntil) > (now || Date.now()); }

async function recordFailure(admin) {
  const failed = admin.failedAttempts + 1;
  const patch = { failedAttempts: failed };
  if (failed >= MAX_FAILED) { patch.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString(); patch.failedAttempts = 0; }
  await db().updateDocument(ADMIN_DATABASE_ID, 'admins', admin.id, patch);
  return !!patch.lockedUntil;
}

async function recordSuccess(admin) {
  await db().updateDocument(ADMIN_DATABASE_ID, 'admins', admin.id, { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date().toISOString() });
}

// Best effort: an unavailable audit log must never block an administrator, but it is logged.
async function audit(entry) {
  try {
    await db().createDocument(ADMIN_DATABASE_ID, 'audit_log', ID.unique(), {
      at: new Date().toISOString(),
      adminEmail: clean(entry.adminEmail, 254),
      action: clean(entry.action, 80),
      target: clean(entry.target, 120),
      detail: clean(entry.detail, 900)
    }, []);
  } catch (error) { console.error(JSON.stringify({ level: 'error', scope: 'admin-store', message: 'audit write failed', error: error && error.message })); }
}

module.exports = { ADMIN_DATABASE_ID, MAX_FAILED, LOCK_MINUTES, findAdminByEmail, getAdmin, isLocked, recordFailure, recordSuccess, audit };
