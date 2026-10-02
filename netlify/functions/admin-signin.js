const crypto = require('crypto');
const { users, upsertDocument, headers, newId } = require('../lib/appwrite');
const { originAllowed, rateLimited, clientIp } = require('../lib/security');
const log = require('../lib/log').createLogger('admin-signin');

const ADMIN_EMAIL = 'devteam@ceylonrylabs.io';
// Set ADMIN_PASSWORD_SHA256 in the Netlify environment and rotate the password.
// The literal below is only a legacy fallback so the portal keeps working until then.
const LEGACY_ADMIN_PASSWORD_SHA256 = '3a210a10d833215c3af0e59a9f172e7e0aa33f455b40aa1338177fd4baf30de7';
const ADMIN_PASSWORD_SHA256 = String(process.env.ADMIN_PASSWORD_SHA256 || LEGACY_ADMIN_PASSWORD_SHA256).trim().toLowerCase();

function response(statusCode, body) {
  return { statusCode, headers: Object.assign(headers(), { 'Cache-Control': 'no-store' }), body: JSON.stringify(body) };
}

function correctAdminCredential(email, password) {
  if (String(email || '').trim().toLowerCase() !== ADMIN_EMAIL) return false;
  const received = crypto.createHash('sha256').update(String(password || '')).digest();
  const expected = Buffer.from(ADMIN_PASSWORD_SHA256, 'hex');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function isTransient(error) {
  const status = Number(error && (error.status || error.statusCode));
  const message = String(error && error.message || '').toLowerCase();
  return status === 408 || status === 429 || status >= 500 ||
    /timeout|timed out|gateway|network|fetch|temporarily unavailable|connection/.test(message);
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' });
  if (!originAllowed(event)) log.warn('sign-in rejected', { status: 403, reason: 'origin' });
  if (!originAllowed(event)) return response(403, { error: 'Request origin is not allowed.' });
  // Brute-force protection: 5 attempts / 15 min per IP.
  if (rateLimited('admin-signin:ip:' + clientIp(event), 5, 900000)) {
    log.warn('sign-in rejected', { status: 429, reason: 'rate-limit' });
    return response(429, { error: 'Too many sign-in attempts. Please wait and try again.', code: 'auth/too-many-requests' });
  }
  try {
    const body = JSON.parse(event.body || '{}');
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    // Credentials are checked before any Appwrite call so a wrong password never touches the auth service.
    // Neither the email nor the password is logged.
    if (!correctAdminCredential(email, password)) log.warn('sign-in failed', { status: 401, reason: 'invalid-credential' });
    if (!correctAdminCredential(email, password)) return response(401, { error: 'Incorrect administrator email or password.', code: 'auth/invalid-credential' });
    const api = users();
    const listed = await api.list([], ADMIN_EMAIL);
    let user = (listed.users || []).find(item => String(item.email || '').toLowerCase() === ADMIN_EMAIL);
    if (user) {
      await api.updatePassword(user.$id, password);
      await api.updateName(user.$id, 'Ceylonry Labs Admin');
    } else {
      user = await api.create(newId('admin'), ADMIN_EMAIL, undefined, password, 'Ceylonry Labs Admin');
    }
    await upsertDocument('users', user.$id, { uid:user.$id,name:'Ceylonry Labs Admin',email:ADMIN_EMAIL,role:'platform_admin',accountType:'platform_admin',plan:'admin',currentPlan:'admin',paid:true,onboardingComplete:true,adminAccess:true,updatedAt:new Date().toISOString() }, true);
    const token = await api.createToken(user.$id, 64, 900);
    log.info('sign-in succeeded', { status: 200, uid: user.$id });
    return response(200, { ok:true,userId:user.$id,secret:token.secret });
  } catch (error) {
    console.error('admin-signin:', error);
    log.error('sign-in errored', error, { transient: isTransient(error) });
    return response(isTransient(error) ? 503 : 500, { error: isTransient(error) ? 'Sign-in service is temporarily unavailable. Please try again.' : 'Administrator sign-in could not be completed.', code: isTransient(error) ? 'auth/service-unavailable' : 'auth/admin-signin-failed' });
  }
};
