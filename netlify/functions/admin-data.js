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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function serialize(value) {
  if (!value) return value;
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (Array.isArray(value)) {
    return value.map(serialize);
  }
  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(function(key) {
      out[key] = serialize(value[key]);
    });
    return out;
  }
  return value;
}

async function verifyAdmin(admin, event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  if (!match) {
    const err = new Error('Missing admin auth token.');
    err.statusCode = 401;
    throw err;
  }

  const decoded = await admin.auth().verifyIdToken(match[1]);
  const email = String(decoded.email || '').trim().toLowerCase();
  if (email !== 'devteam@ceylonrylabs.io') {
    const err = new Error('This account is not allowed to read admin data.');
    err.statusCode = 403;
    throw err;
  }
  return decoded;
}

async function readCollection(db, name, orderField, limit) {
  try {
    const snap = await db.collection(name).orderBy(orderField, 'desc').limit(limit).get();
    return snap.docs.map(function(doc) {
      return { id: doc.id, data: serialize(doc.data() || {}) };
    });
  } catch (err) {
    const snap = await db.collection(name).limit(limit).get();
    return snap.docs.map(function(doc) {
      return { id: doc.id, data: serialize(doc.data() || {}) };
    });
  }
}

function readBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (e) {
    return {};
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers(), body: '' };
  }
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers(), body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  const admin = await getAdmin();
  if (!admin) {
    return {
      statusCode: 503,
      headers: headers(),
      body: JSON.stringify({ ok: false, error: 'Firebase admin is not configured on Netlify.' })
    };
  }

  try {
    await verifyAdmin(admin, event);
    const db = admin.firestore();

    if (event.httpMethod === 'POST') {
      const body = readBody(event);
      if (body.action !== 'updateTicket') {
        return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Unknown admin action.' }) };
      }
      const id = String(body.id || '').trim();
      const status = String(body.status || '').trim().toLowerCase();
      if (!id || ['open', 'in-progress', 'closed'].indexOf(status) === -1) {
        return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Invalid ticket update.' }) };
      }
      await db.collection('supportTickets').doc(id).set({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true }) };
    }

    const users = await readCollection(db, 'users', 'createdAt', 300);
    const visits = await readCollection(db, 'platformVisits', 'createdAt', 160);
    const tickets = await readCollection(db, 'supportTickets', 'createdAt', 160);

    return {
      statusCode: 200,
      headers: headers(),
      body: JSON.stringify({ ok: true, users, visits, tickets })
    };
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: headers(),
      body: JSON.stringify({ ok: false, error: err && err.message ? err.message : 'Admin data failed.' })
    };
  }
};
