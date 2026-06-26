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

async function countQuery(ref) {
  try {
    if (typeof ref.count !== 'function') return null;
    const snap = await ref.count().get();
    const data = snap.data && snap.data();
    return data && typeof data.count === 'number' ? data.count : null;
  } catch (err) {
    return null;
  }
}

function parseVisitTime(data) {
  data = data || {};
  const raw = data.createdAt || data.utcAt || data.lastSeenAt || '';
  if (raw && typeof raw.toDate === 'function') return raw.toDate().getTime();
  const time = Date.parse(raw);
  return Number.isFinite(time) ? time : 0;
}

function visitorKey(data) {
  data = data || {};
  return String(data.visitorId || data.sessionId || data.uid || data.email || data.ip || '').trim();
}

function isLandingVisit(data) {
  data = data || {};
  const path = String(data.path || '').toLowerCase();
  return data.isLanding === true || path === '/' || path === '' || path.endsWith('/index.html');
}

function buildStats(users, visits, tickets) {
  const now = Date.now();
  const recentCutoff = now - 10 * 60 * 1000;
  const uniqueVisitors = new Set();
  const liveVisitors = new Set();
  let landingVisitsRecent = 0;
  let lastVisitAt = '';

  visits.forEach(function(row) {
    const data = row.data || {};
    const key = visitorKey(data);
    const time = parseVisitTime(data);
    if (key) uniqueVisitors.add(key);
    if (key && time >= recentCutoff) liveVisitors.add(key);
    if (isLandingVisit(data)) landingVisitsRecent += 1;
    if (!lastVisitAt || time > Date.parse(lastVisitAt)) {
      lastVisitAt = data.utcAt || data.createdAt || data.lastSeenAt || '';
    }
  });

  return {
    usersTotal: users.length,
    visitsTotal: visits.length,
    uniqueVisitorsTotal: uniqueVisitors.size,
    recentVisitsShown: visits.length,
    ticketsTotal: tickets.length,
    openTicketsTotal: tickets.filter(function(row) {
      return String((row.data || {}).status || 'open').toLowerCase() !== 'closed';
    }).length,
    uniqueVisitorsRecent: uniqueVisitors.size,
    liveVisitorsLast10Min: liveVisitors.size,
    landingVisitsTotal: landingVisitsRecent,
    landingVisitsRecent,
    lastVisitAt
  };
}

function readBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (e) {
    return {};
  }
}

function userUpdateForAction(admin, updateType) {
  const stamp = admin.firestore.FieldValue.serverTimestamp();
  if (updateType === 'pause') {
    return {
      accountPaused: true,
      paid: false,
      subscriptionStatus: 'paused',
      manualPaymentStatus: 'paused',
      pausedAt: stamp,
      pausedBy: 'platform_admin',
      updatedAt: stamp
    };
  }
  if (updateType === 'unpause') {
    return {
      accountPaused: false,
      subscriptionStatus: 'active',
      manualPaymentStatus: 'unpaused',
      unpausedAt: stamp,
      unpausedBy: 'platform_admin',
      updatedAt: stamp
    };
  }
  if (updateType === 'markPaid') {
    return {
      paid: true,
      accountPaused: false,
      subscriptionStatus: 'manual-paid',
      manualPaymentStatus: 'paid',
      paidManually: true,
      manualPaidAt: stamp,
      lastManualPaymentAt: stamp,
      manualPaymentBy: 'platform_admin',
      updatedAt: stamp
    };
  }
  if (updateType === 'markUnpaid') {
    return {
      paid: false,
      subscriptionStatus: 'manual-unpaid',
      manualPaymentStatus: 'unpaid',
      paidManually: false,
      manualUnpaidAt: stamp,
      manualPaymentBy: 'platform_admin',
      updatedAt: stamp
    };
  }
  return null;
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
      const action = String(body.action || '').trim();
      if (action === 'updateTicket') {
        const id = String(body.id || '').trim();
        const status = String(body.status || '').trim().toLowerCase();
        if (!id || ['open', 'in-progress', 'closed'].indexOf(status) === -1) {
          return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Invalid ticket update.' }) };
        }
        const update = {
          status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (status === 'closed') {
          update.closedAt = admin.firestore.FieldValue.serverTimestamp();
          update.closedBy = 'platform_admin';
        }
        await db.collection('supportTickets').doc(id).set(update, { merge: true });
        return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true }) };
      }

      if (action === 'updateUser') {
        const id = String(body.id || '').trim();
        const updateType = String(body.updateType || '').trim();
        const update = userUpdateForAction(admin, updateType);
        if (!id || !update) {
          return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Invalid user update.' }) };
        }
        await db.collection('users').doc(id).set(update, { merge: true });
        return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true }) };
      }

      if (action !== 'updateTicket') {
        return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Unknown admin action.' }) };
      }
    }

    const users = await readCollection(db, 'users', 'createdAt', 500);
    const visits = await readCollection(db, 'platformVisits', 'createdAt', 500);
    const tickets = await readCollection(db, 'supportTickets', 'createdAt', 300);
    const stats = buildStats(users, visits, tickets);

    const usersTotal = await countQuery(db.collection('users'));
    const visitsTotal = await countQuery(db.collection('platformVisits'));
    const ticketsTotal = await countQuery(db.collection('supportTickets'));
    const landingVisitsTotal = await countQuery(db.collection('platformVisits').where('isLanding', '==', true));

    if (usersTotal != null) stats.usersTotal = usersTotal;
    if (visitsTotal != null) stats.visitsTotal = visitsTotal;
    if (ticketsTotal != null) stats.ticketsTotal = ticketsTotal;
    if (landingVisitsTotal != null) stats.landingVisitsTotal = landingVisitsTotal;

    return {
      statusCode: 200,
      headers: headers(),
      body: JSON.stringify({ ok: true, users, visits, tickets, stats })
    };
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: headers(),
      body: JSON.stringify({ ok: false, error: err && err.message ? err.message : 'Admin data failed.' })
    };
  }
};
