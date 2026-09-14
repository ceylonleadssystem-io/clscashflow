const crypto = require('crypto');
const { users, upsertDocument, headers, newId } = require('../lib/appwrite');

const ADMIN_EMAIL = 'devteam@ceylonrylabs.io';
const ADMIN_PASSWORD_SHA256 = '3a210a10d833215c3af0e59a9f172e7e0aa33f455b40aa1338177fd4baf30de7';

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
  try {
    const body = JSON.parse(event.body || '{}');
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
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
    return response(200, { ok:true,userId:user.$id,secret:token.secret });
  } catch (error) {
    console.error('admin-signin:', error);
    return response(isTransient(error) ? 503 : 500, { error: isTransient(error) ? 'Sign-in service is temporarily unavailable. Please try again.' : 'Administrator sign-in could not be completed.', code: isTransient(error) ? 'auth/service-unavailable' : 'auth/admin-signin-failed' });
  }
};
