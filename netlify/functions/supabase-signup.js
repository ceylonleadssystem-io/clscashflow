const { headers, service, clean } = require('../lib/supabase');

function readBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (e) {
    return {};
  }
}

function authError(message, code, statusCode) {
  const err = new Error(message);
  err.code = code;
  err.statusCode = statusCode || 400;
  return err;
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers(), body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  try {
    const body = readBody(event);
    const email = clean(body.email, 240).toLowerCase();
    const password = String(body.password || '');
    const displayName = clean(body.displayName || body.name || '', 180);

    if (!email || !email.includes('@')) throw authError('Please enter a valid email address.', 'auth/invalid-email', 400);
    if (password.length < 6) throw authError('Password must be at least 6 characters.', 'auth/weak-password', 400);

    const metadata = {};
    if (displayName) {
      metadata.full_name = displayName;
      metadata.name = displayName;
    }

    const { data, error } = await service().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata
    });

    if (error) {
      const msg = String(error.message || '');
      if (/already|registered|exists/i.test(msg)) {
        throw authError('An account with this email already exists.', 'auth/email-already-in-use', 409);
      }
      throw error;
    }

    return {
      statusCode: 200,
      headers: headers(),
      body: JSON.stringify({
        ok: true,
        user: data && data.user ? { id: data.user.id, email: data.user.email || email } : null
      })
    };
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: headers(),
      body: JSON.stringify({
        ok: false,
        code: err.code || '',
        error: err && err.message ? err.message : 'Could not create account.'
      })
    };
  }
};
