'use strict';

// Sign-in for the POS administration portal (/posv2/admin).
// Accounts live only in the separate admin database. There is deliberately no sign-up,
// invite or password-reset endpoint: administrators are added by creating a record.

const { guard, reply } = require('../lib/security');
const { createLogger } = require('../lib/log');
const { isAdminEmail, verifyPassword, verifyAgainstDummy, signToken } = require('../lib/admin-auth');
const store = require('../lib/admin-store');

const log = createLogger('pos-admin-login');
const GENERIC = 'Incorrect email or password.';

exports.handler = async function handler(event) {
  // 8 attempts / 10 min per IP on top of the per-account lockout below.
  const blocked = guard(event, { name: 'pos-admin-login', limit: 8, windowMs: 600000, maxBody: 5000 });
  if (blocked) return blocked;
  try {
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { return reply(event, 400, { ok: false, error: 'Invalid request.' }); }
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    // The domain rule is enforced here, on the server, not only in the form.
    if (!isAdminEmail(email) || !password || password.length > 200) {
      verifyAgainstDummy(password);
      log.warn('sign-in rejected', { reason: 'not-an-admin-address' });
      return reply(event, 401, { ok: false, error: GENERIC });
    }

    const admin = await store.findAdminByEmail(email);
    if (!admin || !admin.active) {
      verifyAgainstDummy(password);
      log.warn('sign-in rejected', { reason: admin ? 'inactive' : 'unknown' });
      await store.audit({ adminEmail: email, action: 'login-failed', detail: admin ? 'inactive' : 'unknown account' });
      return reply(event, 401, { ok: false, error: GENERIC });
    }
    if (store.isLocked(admin)) {
      log.warn('sign-in rejected', { reason: 'locked', adminId: admin.id });
      return reply(event, 429, { ok: false, error: 'Too many failed attempts. Try again in ' + store.LOCK_MINUTES + ' minutes.' });
    }
    if (!verifyPassword(password, admin.passwordHash)) {
      const locked = await store.recordFailure(admin);
      await store.audit({ adminEmail: email, action: locked ? 'login-locked' : 'login-failed', detail: 'bad password' });
      log.warn('sign-in rejected', { reason: locked ? 'locked-now' : 'bad-password', adminId: admin.id });
      return reply(event, 401, { ok: false, error: GENERIC });
    }

    await store.recordSuccess(admin);
    await store.audit({ adminEmail: email, action: 'login' });
    const session = signToken(admin);
    log.info('sign-in ok', { adminId: admin.id });
    return reply(event, 200, { ok: true, token: session.token, expiresAt: session.expiresAt, email: admin.email, name: admin.name });
  } catch (error) {
    log.error('sign-in failed', error);
    return reply(event, error.statusCode || 500, { ok: false, error: 'Administrator sign-in is unavailable.' });
  }
};
