const { service, headers } = require('../lib/supabase');

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: headers(), body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const body = JSON.parse(event.body || '{}');
    const email = String(body.email || '').trim().toLowerCase().slice(0, 240);
    const password = String(body.password || '');
    if (!email || !password) return { statusCode: 400, headers: headers(), body: JSON.stringify({ error: 'Email and password are required.' }) };
    const result = await service().auth.signInWithPassword({ email, password });
    if (result.error || !result.data || !result.data.session) {
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
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ error: 'Sign-in service is temporarily unavailable.' }) };
  }
};
