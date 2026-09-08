const { service, headers } = require('../lib/supabase');

function isInvalidCredential(error) {
  const status = Number(error && (error.status || error.statusCode));
  const message = String(error && error.message || '').toLowerCase();
  return status === 400 || /invalid login credentials|invalid credentials/.test(message);
}

function isTransient(error) {
  const status = Number(error && (error.status || error.statusCode));
  const message = String(error && error.message || '').toLowerCase();
  return status === 408 || status === 429 || status >= 500 ||
    /timeout|timed out|gateway|network|fetch|temporarily unavailable|connection/.test(message);
}

async function signInWithRetry(email, password) {
  let result;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    result = await service().auth.signInWithPassword({ email, password });
    if (!result.error || isInvalidCredential(result.error) || !isTransient(result.error)) return result;
    await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }
  return result;
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: headers(), body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const email = String(body.email || '').trim().toLowerCase().slice(0, 240);
    const password = String(body.password || '');
    if (!email || !password) return { statusCode: 400, headers: headers(), body: JSON.stringify({ error: 'Email and password are required.' }) };
    const result = await signInWithRetry(email, password);
    if (result.error || !result.data || !result.data.session) {
      if (result.error && !isInvalidCredential(result.error)) {
        console.error('supabase-signin upstream:', result.error);
        return { statusCode: 503, headers: headers(), body: JSON.stringify({ error: 'Sign-in service is temporarily unavailable. Please try again.', code: 'auth/service-unavailable' }) };
      }
      return { statusCode: 401, headers: headers(), body: JSON.stringify({ error: 'Incorrect email or password.', code: 'auth/invalid-credential' }) };
    }
    return {
      statusCode: 200,
      headers: Object.assign(headers(), { 'Cache-Control': 'no-store' }),
      body: JSON.stringify({
        ok: true,
        access_token: result.data.session.access_token,
        refresh_token: result.data.session.refresh_token
      })
    };
  } catch (error) {
    console.error('supabase-signin:', error);
    return { statusCode: 503, headers: headers(), body: JSON.stringify({ error: 'Sign-in service is temporarily unavailable. Please try again.', code: 'auth/service-unavailable' }) };
  }
};
