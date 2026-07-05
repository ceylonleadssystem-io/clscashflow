function headers(cacheOk) {
  const base = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
  if (cacheOk) {
    base['Cache-Control'] = 'public, max-age=3600, stale-while-revalidate=86400';
    base['Netlify-CDN-Cache-Control'] = 'public, durable, max-age=3600, stale-while-revalidate=86400';
  } else {
    base['Cache-Control'] = 'no-store';
  }
  return base;
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

  return { statusCode: 200, headers: headers(true), body: JSON.stringify({ ok: true, url, anonKey }) };
};
