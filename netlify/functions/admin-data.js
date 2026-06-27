const crypto = require('crypto');

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

function buildStats(users, visits, tickets, paymentRequests) {
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
    paymentRequestsTotal: paymentRequests.length,
    openPaymentRequestsTotal: paymentRequests.filter(function(row) {
      const status = String((row.data || {}).status || 'pending').toLowerCase();
      return status !== 'paid' && status !== 'closed';
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

const PLAN_DETAILS = {
  solo: { name: 'Solo', price: 3500 },
  studio: { name: 'Studio', price: 5500 },
  business: { name: 'Business', price: 8500 }
};

function normalizePlan(plan) {
  const aliases = { starter: 'studio', growth: 'business', premium: 'business' };
  plan = String(plan || '').toLowerCase();
  plan = aliases[plan] || plan;
  return Object.prototype.hasOwnProperty.call(PLAN_DETAILS, plan) ? plan : 'solo';
}

function parseTime(value) {
  if (!value) return 0;
  if (value && typeof value.toDate === 'function') return value.toDate().getTime();
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function isPaidProfile(data) {
  data = data || {};
  const status = String(data.subscriptionStatus || '').toLowerCase();
  return data.paid === true || status === 'active' || status === 'manual-paid';
}

function isPausedProfile(data) {
  data = data || {};
  const status = String(data.subscriptionStatus || '').toLowerCase();
  return data.accountPaused === true || status === 'paused';
}

function isInternalAdmin(data) {
  data = data || {};
  return String(data.role || '').toLowerCase() === 'platform_admin'
    || String(data.accountType || '').toLowerCase() === 'platform_admin'
    || String(data.currentPlan || data.plan || '').toLowerCase() === 'admin';
}

function makePaymentRequestToken(uid, plan) {
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  return 'CLS-' + String(plan || 'solo').toUpperCase().slice(0, 3) + '-' + Date.now().toString(36).toUpperCase() + '-' + suffix;
}

async function ensureExpiredTrialPaymentRequests(admin, db, users) {
  const now = Date.now();
  await Promise.all((users || []).map(async function(row) {
    const data = row.data || {};
    if (!row.id || isInternalAdmin(data) || isPaidProfile(data) || isPausedProfile(data)) return;
    const trialEndMs = parseTime(data.trialEnd);
    if (!trialEndMs || trialEndMs >= now) return;

    const plan = normalizePlan(data.currentPlan || data.plan || data.lastPlan);
    const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
    const token = String(data.paymentRequestToken || '').trim() || makePaymentRequestToken(row.id, plan);
    const ref = db.collection('paymentRequests').doc(token);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        token,
        uid: row.id,
        ownerUid: data.ownerUid || row.id,
        name: data.name || data.displayName || '',
        email: String(data.email || '').toLowerCase(),
        businessName: data.bizName || data.invoiceBiz || data.businessName || '',
        plan,
        planName: planInfo.name,
        amount: planInfo.price,
        currency: 'LKR',
        trialEnd: data.trialEnd || '',
        status: 'pending',
        source: 'admin-expired-trial-sweep',
        page: data.lastSeenPath || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAtUtc: new Date().toISOString(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtUtc: new Date().toISOString()
      }, { merge: true });
    }

    if (!data.paymentRequestToken || !data.paymentRequestStatus) {
      await db.collection('users').doc(row.id).set({
        paymentRequestToken: token,
        paymentRequestStatus: snap.exists ? ((snap.data() || {}).status || 'pending') : 'pending',
        paymentRequestPlan: plan,
        paymentRequestAmount: planInfo.price,
        manualPaymentStatus: 'payment-requested',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  }));
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
  if (updateType === 'setPlanSolo') {
    return {
      plan: 'solo',
      currentPlan: 'solo',
      lastPlan: 'solo',
      requestedPlan: 'solo',
      planPrice: 3500,
      planChangedBy: 'platform_admin',
      planChangedAt: stamp,
      updatedAt: stamp
    };
  }
  if (updateType === 'setPlanStudio') {
    return {
      plan: 'studio',
      currentPlan: 'studio',
      lastPlan: 'studio',
      requestedPlan: 'studio',
      planPrice: 5500,
      planChangedBy: 'platform_admin',
      planChangedAt: stamp,
      updatedAt: stamp
    };
  }
  if (updateType === 'setPlanBusiness') {
    return {
      plan: 'business',
      currentPlan: 'business',
      lastPlan: 'business',
      requestedPlan: 'business',
      planPrice: 8500,
      planChangedBy: 'platform_admin',
      planChangedAt: stamp,
      updatedAt: stamp
    };
  }
  return null;
}

function paymentRequestUpdateForStatus(admin, status) {
  const stamp = admin.firestore.FieldValue.serverTimestamp();
  if (status === 'pending') {
    return {
      status: 'pending',
      updatedAt: stamp,
      updatedBy: 'platform_admin'
    };
  }
  if (status === 'invoiced') {
    return {
      status: 'invoiced',
      invoiceSentAt: stamp,
      invoiceSentBy: 'platform_admin',
      updatedAt: stamp,
      updatedBy: 'platform_admin'
    };
  }
  if (status === 'paid') {
    return {
      status: 'paid',
      paidAt: stamp,
      paidBy: 'platform_admin',
      updatedAt: stamp,
      updatedBy: 'platform_admin'
    };
  }
  if (status === 'closed') {
    return {
      status: 'closed',
      closedAt: stamp,
      closedBy: 'platform_admin',
      updatedAt: stamp,
      updatedBy: 'platform_admin'
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

      if (action === 'updatePaymentRequest') {
        const id = String(body.id || '').trim();
        const status = String(body.status || '').trim().toLowerCase();
        const update = paymentRequestUpdateForStatus(admin, status);
        if (!id || !update) {
          return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Invalid payment request update.' }) };
        }
        const ref = db.collection('paymentRequests').doc(id);
        const snap = await ref.get();
        const request = snap.exists ? (snap.data() || {}) : {};
        await ref.set(update, { merge: true });
        if (request.uid) {
          const userUpdate = status === 'paid'
            ? userUpdateForAction(admin, 'markPaid')
            : {
                paymentRequestStatus: status,
                paymentRequestToken: request.token || id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              };
          if (status === 'paid') {
            userUpdate.paymentRequestStatus = 'paid';
            userUpdate.paymentRequestToken = request.token || id;
            userUpdate.paymentRequestPaidAt = admin.firestore.FieldValue.serverTimestamp();
          }
          await db.collection('users').doc(String(request.uid)).set(userUpdate, { merge: true });
        }
        return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true }) };
      }

      if (action !== 'updateTicket') {
        return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Unknown admin action.' }) };
      }
    }

    const users = await readCollection(db, 'users', 'createdAt', 500);
    const visits = await readCollection(db, 'platformVisits', 'createdAt', 500);
    const tickets = await readCollection(db, 'supportTickets', 'createdAt', 300);
    await ensureExpiredTrialPaymentRequests(admin, db, users);
    const paymentRequests = await readCollection(db, 'paymentRequests', 'createdAt', 300);
    const stats = buildStats(users, visits, tickets, paymentRequests);

    const usersTotal = await countQuery(db.collection('users'));
    const visitsTotal = await countQuery(db.collection('platformVisits'));
    const ticketsTotal = await countQuery(db.collection('supportTickets'));
    const paymentRequestsTotal = await countQuery(db.collection('paymentRequests'));
    const landingVisitsTotal = await countQuery(db.collection('platformVisits').where('isLanding', '==', true));

    if (usersTotal != null) stats.usersTotal = usersTotal;
    if (visitsTotal != null) stats.visitsTotal = visitsTotal;
    if (ticketsTotal != null) stats.ticketsTotal = ticketsTotal;
    if (paymentRequestsTotal != null) stats.paymentRequestsTotal = paymentRequestsTotal;
    if (landingVisitsTotal != null) stats.landingVisitsTotal = landingVisitsTotal;

    return {
      statusCode: 200,
      headers: headers(),
      body: JSON.stringify({ ok: true, users, visits, tickets, paymentRequests, stats })
    };
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: headers(),
      body: JSON.stringify({ ok: false, error: err && err.message ? err.message : 'Admin data failed.' })
    };
  }
};
