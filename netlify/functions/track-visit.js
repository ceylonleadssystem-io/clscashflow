function parseServiceAccount(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (err) {
      return null;
    }
  }
}

async function getAdmin() {
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    return null;
  }

  if (!admin.apps.length) {
    const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT || '');
    if (serviceAccount) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
    } else {
      return null;
    }
  }
  return admin;
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function clean(s, max) {
  s = String(s == null ? '' : s).trim();
  if (max && s.length > max) return s.slice(0, max);
  return s;
}

function bool(v) {
  return v === true || v === 'true';
}

function isLandingPath(path) {
  path = clean(path, 300).toLowerCase();
  return path === '/' || path === '' || path.endsWith('/index.html');
}

exports.handler = async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers(), body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    body = {};
  }

  const forwarded = event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For'] || '';
  const ip = clean(event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || forwarded.split(',')[0] || '', 120);
  const geo = (context && context.geo) || {};
  const payload = {
    eventType: clean(body.eventType, 40) || 'page_view',
    visitId: clean(body.visitId, 120),
    visitorId: clean(body.visitorId, 160),
    sessionId: clean(body.sessionId, 160),
    uid: clean(body.uid, 120),
    email: clean(body.email, 180),
    displayName: clean(body.displayName, 180),
    path: clean(body.path, 300),
    url: clean(body.url, 800),
    title: clean(body.title, 220),
    referrer: clean(body.referrer, 800),
    timezone: clean(body.timezone, 120),
    language: clean(body.language, 60),
    userAgent: clean(body.userAgent, 500),
    screen: clean(body.screen, 80),
    lastPlan: clean(body.lastPlan, 40),
    pageKind: clean(body.pageKind, 80),
    isLanding: bool(body.isLanding) || isLandingPath(body.path),
    isPortal: bool(body.isPortal),
    utcAt: clean(body.utcAt, 80) || new Date().toISOString(),
    localAt: clean(body.localAt, 160),
    firstSeenAt: clean(body.firstSeenAt, 80),
    ip,
    geo: {
      country: clean(geo.country && (geo.country.name || geo.country.code || geo.country), 120),
      subdivision: clean(geo.subdivision && (geo.subdivision.name || geo.subdivision.code || geo.subdivision), 120),
      city: clean(geo.city, 120),
      timezone: clean(geo.timezone, 120),
      latitude: geo.latitude || null,
      longitude: geo.longitude || null
    },
    source: 'website'
  };

  const admin = await getAdmin();
  if (!admin) {
    return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, stored: false, reason: 'Firebase admin not configured' }) };
  }

  try {
    const doc = await admin.firestore().collection('platformVisits').add({
      ...payload,
      lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, stored: true, id: doc.id }) };
  } catch (err) {
    return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, stored: false, error: err && err.message ? err.message : 'Storage failed' }) };
  }
};
