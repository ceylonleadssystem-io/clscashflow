const { clean, headers, getDocument } = require('../lib/appwrite');
const { isValidPublicToken } = require('../lib/invoice-share');
const { sanitizeMenu } = require('../lib/menu-share');

const requests = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 120;

function response(statusCode, body) {
  return {
    statusCode,
    headers: headers({
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'noindex, nofollow'
    }),
    body: JSON.stringify(body)
  };
}

function permitted(event, token) {
  const now = Date.now();
  const ip = clean(event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown', 120).split(',')[0];
  const key = ip + '|' + token;
  const current = requests.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    requests.set(key, { startedAt: now, count: 1 });
    return true;
  }
  current.count += 1;
  if (requests.size > 2000) {
    requests.forEach(function(value, mapKey) {
      if (now - value.startedAt >= WINDOW_MS) requests.delete(mapKey);
    });
  }
  return current.count <= MAX_REQUESTS;
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return response(200, { ok: true });
  if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'Method not allowed.' });
  const token = clean(event.queryStringParameters && event.queryStringParameters.token, 80);
  if (!isValidPublicToken(token)) return response(404, { ok: false, error: 'Menu not found or unavailable.' });
  if (!permitted(event, token)) return response(429, { ok: false, error: 'Too many requests. Please try again shortly.' });
  try {
    const share = await getDocument('publicMenus', token);
    const data = share && share.data ? share.data : {};
    if (!share || data.active !== true || !data.menu) return response(404, { ok: false, error: 'Menu not found or unavailable.' });
    return response(200, { ok: true, menu: sanitizeMenu(data.menu) });
  } catch (error) {
    console.error('public-menu error', error);
    return response(500, { ok: false, error: 'Menu not found or unavailable.' });
  }
};
