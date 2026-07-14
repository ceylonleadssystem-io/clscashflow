const {
  clean,
  headers,
  getDocument
} = require('../lib/supabase');
const {
  isValidPublicToken,
  publicTokenCandidates,
  sanitizePublicInvoice,
  sanitizePublicSnapshot,
  canUseMappedSource
} = require('../lib/invoice-share');

const requests = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 60;

function response(statusCode, body) {
  return {
    statusCode,
    headers: headers({
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
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

async function resolvePublicShare(token, readDocument) {
  const getter = readDocument || getDocument;
  const candidates = publicTokenCandidates(token);
  const shares = await Promise.all(candidates.map(function(candidate) {
    return getter('publicInvoices', candidate);
  }));
  const foundAt = shares.findIndex(Boolean);
  if (foundAt !== -1) return { share: shares[foundAt], resolvedToken: candidates[foundAt] };
  return { share: null, resolvedToken: token };
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return response(200, { ok: true });
  if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'Method not allowed.' });
  const token = clean(event.queryStringParameters && event.queryStringParameters.token, 80);
  if (!isValidPublicToken(token)) {
    return response(404, { ok: false, error: 'Invoice not found or unavailable.' });
  }
  if (!permitted(event, token)) {
    return response(429, { ok: false, error: 'Too many requests. Please try again shortly.' });
  }

  try {
    const resolved = await resolvePublicShare(token);
    const share = resolved.share;
    const resolvedToken = resolved.resolvedToken;
    const shareData = share && share.data ? share.data : {};
    if (!share || shareData.active !== true || shareData.public !== true) {
      return response(404, { ok: false, error: 'Invoice not found or unavailable.' });
    }
    const ownerUid = clean(shareData.ownerUid, 240);
    const sourceInvoiceId = clean(shareData.sourceInvoiceId, 240);
    if (!ownerUid || !sourceInvoiceId) {
      return response(404, { ok: false, error: 'Invoice not found or unavailable.' });
    }

    // Every share stores a sanitized public snapshot. It is the fastest and
    // most reliable response, and it exactly matches the reminder that was
    // sent. Source reads below are retained only for older mappings.
    if (shareData.invoice && typeof shareData.invoice === 'object') {
      return response(200, {
        ok: true,
        invoice: sanitizePublicSnapshot(shareData.invoice)
      });
    }

    const [source, profile] = await Promise.all([
      getDocument('users/' + ownerUid + '/invoices', sourceInvoiceId),
      getDocument('users', ownerUid)
    ]);
    if (source && canUseMappedSource(source.data, resolvedToken)) {
      return response(200, {
        ok: true,
        invoice: sanitizePublicInvoice(source.data || {}, profile ? profile.data || {} : {})
      });
    }
    return response(404, { ok: false, error: 'Invoice not found or unavailable.' });
  } catch (error) {
    console.error('public-invoice error', error);
    return response(500, { ok: false, error: 'Invoice not found or unavailable.' });
  }
};

exports.resolvePublicShare = resolvePublicShare;
