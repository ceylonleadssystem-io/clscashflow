function headers() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: headers(), body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  const url = process.env.SUPABASE_URL || 'https://iudcinvfqbdzaptnnzqg.supabase.co';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!anonKey) {
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ ok: false, error: 'SUPABASE_ANON_KEY is not configured in Netlify.' }) };
  }

  return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, url, anonKey }) };
};
