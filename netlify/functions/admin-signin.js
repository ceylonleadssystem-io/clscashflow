const crypto = require('crypto');
const { service, upsertDocument, headers } = require('../lib/supabase');

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

async function signInWithRetry(supabase, email, password) {
  let result;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    result = await supabase.auth.signInWithPassword({ email, password });
    if (!result.error || !isTransient(result.error)) return result;
    await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }
  return result;
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' });
  try {
    const body = JSON.parse(event.body || '{}');
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!correctAdminCredential(email, password)) return response(401, { error: 'Incorrect administrator email or password.', code: 'auth/invalid-credential' });
    const supabase = service();
    let signedIn = await signInWithRetry(supabase, email, password);
    if (signedIn.error || !signedIn.data || !signedIn.data.session) {
      const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listed.error) throw listed.error;
      let user = (listed.data.users || []).find(item => String(item.email || '').toLowerCase() === ADMIN_EMAIL);
      if (user) {
        const updated = await supabase.auth.admin.updateUserById(user.id, { password, user_metadata: Object.assign({}, user.user_metadata || {}, { name: 'Ceylonry Labs Admin' }) });
        if (updated.error) throw updated.error;
        user = updated.data.user;
      } else {
        const created = await supabase.auth.admin.createUser({ email: ADMIN_EMAIL, password, email_confirm: true, user_metadata: { name: 'Ceylonry Labs Admin' } });
        if (created.error) throw created.error;
        user = created.data.user;
      }
      await upsertDocument('users', user.id, { uid:user.id,name:'Ceylonry Labs Admin',email:ADMIN_EMAIL,role:'platform_admin',accountType:'platform_admin',plan:'admin',currentPlan:'admin',paid:true,onboardingComplete:true,adminAccess:true,updatedAt:new Date().toISOString() }, true);
      signedIn = await signInWithRetry(supabase, email, password);
    }
    if (signedIn.error || !signedIn.data || !signedIn.data.session) throw signedIn.error || new Error('Administrator session could not be created.');
    return response(200, { ok:true,access_token:signedIn.data.session.access_token,refresh_token:signedIn.data.session.refresh_token });
  } catch (error) {
    console.error('admin-signin:', error);
    return response(isTransient(error) ? 503 : 500, { error: isTransient(error) ? 'Sign-in service is temporarily unavailable. Please try again.' : 'Administrator sign-in could not be completed.', code: isTransient(error) ? 'auth/service-unavailable' : 'auth/admin-signin-failed' });
  }
};
