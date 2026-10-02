'use strict';

// Credential and session helpers for the POS administration portal.
//
// The portal has its own accounts, kept in a separate Appwrite database (see admin-store.js),
// so administrators never share users, sessions or data with POS clients. There is no
// self-registration and no password reset: an administrator exists only if someone adds a
// record to the `admins` collection (the password hash is generated with
// scripts/hash-admin-password.mjs).

const crypto = require('crypto');

const ADMIN_EMAIL_DOMAIN = '@ceylonrylabs.io';
const SESSION_SECONDS = 8 * 60 * 60; // an admin session lasts one working day at most
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

function isAdminEmail(email) {
  const value = String(email || '').trim().toLowerCase();
  return value.length <= 254 && /^[^\s@]+@ceylonrylabs\.io$/.test(value) && value.endsWith(ADMIN_EMAIL_DOMAIN);
}

// Stored format: scrypt$N$r$p$<salt b64>$<hash b64>
function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(plain), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), hash.toString('base64')].join('$');
}

function verifyPassword(plain, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  try {
    const salt = Buffer.from(parts[4], 'base64');
    const expected = Buffer.from(parts[5], 'base64');
    const actual = crypto.scryptSync(String(plain), salt, expected.length, { N: +parts[1], r: +parts[2], p: +parts[3] });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch (_) { return false; }
}

// Burn the same CPU time when the account does not exist, so response time does not reveal
// which emails are administrators.
const DUMMY_HASH = hashPassword('not-a-real-password');
function verifyAgainstDummy(plain) { verifyPassword(plain, DUMMY_HASH); }

function secret() {
  const value = process.env.POS_ADMIN_TOKEN_SECRET || '';
  if (value.length < 32) { const e = new Error('POS_ADMIN_TOKEN_SECRET must be set to at least 32 characters.'); e.statusCode = 500; throw e; }
  return value;
}

function b64url(input) { return Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_'); }

// Minimal HS256 token: {sub: admin record id, email, iat, exp}
function signToken(admin, now) {
  const iat = Math.floor((now || Date.now()) / 1000);
  const body = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' + b64url(JSON.stringify({ sub: admin.id, email: admin.email, iat, exp: iat + SESSION_SECONDS }));
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return { token: body + '.' + sig, expiresAt: new Date((iat + SESSION_SECONDS) * 1000).toISOString() };
}

// Returns the claims, or null when the token is malformed, tampered with or expired.
function verifyToken(token, now) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  try {
    const expected = crypto.createHmac('sha256', secret()).update(parts[0] + '.' + parts[1]).digest();
    const given = Buffer.from(parts[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
    const claims = JSON.parse(Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    if (!claims.exp || claims.exp * 1000 <= (now || Date.now())) return null;
    return claims;
  } catch (_) { return null; }
}

module.exports = { ADMIN_EMAIL_DOMAIN, SESSION_SECONDS, isAdminEmail, hashPassword, verifyPassword, verifyAgainstDummy, signToken, verifyToken };
