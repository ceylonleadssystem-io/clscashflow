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

function splitServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID || '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
  const privateKey = String(process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;
  return { type: 'service_account', project_id: projectId, client_email: clientEmail, private_key: privateKey };
}

async function getAdmin() {
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    return null;
  }

  if (!admin.apps.length) {
    const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT || '') || splitServiceAccount();
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

async function readChats(db) {
  const threads = await readCollection(db, 'chatThreads', 'lastMessageAt', 300);
  await Promise.all(threads.map(async function(row) {
    try {
      const snap = await db.collection('chatThreads').doc(row.id).collection('messages').orderBy('createdAt', 'asc').limit(80).get();
      row.data.messages = snap.docs.map(function(doc) {
        return { id: doc.id, data: serialize(doc.data() || {}) };
      });
    } catch (err) {
      row.data.messages = [];
    }
  }));
  return threads;
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

function buildStats(users, visits, tickets, paymentRequests, chats) {
  users = users || [];
  visits = visits || [];
  tickets = tickets || [];
  paymentRequests = paymentRequests || [];
  chats = chats || [];
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
    chatsTotal: chats.length,
    openChatsTotal: chats.filter(function(row) {
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
  if (updateType === 'deleteUser') {
    return {
      role: 'removed',
      accountStatus: 'deleted',
      deleted: true,
      accountPaused: true,
      paid: false,
      subscriptionStatus: 'deleted',
      manualPaymentStatus: 'deleted',
      deletedAt: stamp,
      deletedBy: 'platform_admin',
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

      if (action === 'deleteUser') {
        const id = String(body.id || '').trim();
        if (!id) {
          return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Missing user id.' }) };
        }
        const userRef = db.collection('users').doc(id);
        const snap = await userRef.get();
        const profile = snap.exists ? (snap.data() || {}) : {};
        if (String(profile.email || '').toLowerCase() === 'devteam@ceylonrylabs.io' || isInternalAdmin(profile)) {
          return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Platform admin account cannot be deleted from this panel.' }) };
        }
        await userRef.set(userUpdateForAction(admin, 'deleteUser'), { merge: true });
        let authDeleted = false;
        let authDeleteError = '';
        try {
          await admin.auth().deleteUser(id);
          authDeleted = true;
        } catch (err) {
          authDeleteError = err && err.message ? err.message : 'Auth user was not deleted.';
        }
        return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, authDeleted, authDeleteError }) };
      }

      if (action === 'resetLogin') {
        const email = String(body.email || '').trim().toLowerCase();
        if (!email) {
          return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Missing email address.' }) };
        }
        const continueUrl = String(body.continueUrl || 'https://ceylonrylabs.io/signin.html').trim();
        const resetLink = await admin.auth().generatePasswordResetLink(email, {
          url: continueUrl,
          handleCodeInApp: false
        });
        return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, resetLink }) };
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

      if (action === 'replyChat') {
        const id = String(body.id || body.threadId || '').trim();
        const message = String(body.message || '').trim();
        if (!id || !message || message.length > 1200) {
          return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Invalid chat reply.' }) };
        }
        const stamp = admin.firestore.FieldValue.serverTimestamp();
        const now = new Date().toISOString();
        const ref = db.collection('chatThreads').doc(id);
        await ref.collection('messages').add({
          authorRole: 'admin',
          authorName: 'Mrs. Gamage',
          text: message,
          createdAt: stamp,
          createdAtUtc: now
        });
        await ref.set({
          status: 'open',
          assignedTo: 'Mrs. Gamage',
          lastMessage: message.slice(0, 240),
          lastMessageBy: 'admin',
          lastMessageAt: stamp,
          lastMessageAtUtc: now,
          unreadForAdmin: false,
          unreadForUser: true,
          updatedAt: stamp,
          updatedAtUtc: now
        }, { merge: true });
        return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true }) };
      }

      if (action === 'sendPaymentRequestChat') {
        const id = String(body.id || body.threadId || '').trim();
        if (!id) {
          return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Missing chat thread id.' }) };
        }
        const stamp = admin.firestore.FieldValue.serverTimestamp();
        const now = new Date().toISOString();
        const threadRef = db.collection('chatThreads').doc(id);
        const threadSnap = await threadRef.get();
        if (!threadSnap.exists) {
          return { statusCode: 404, headers: headers(), body: JSON.stringify({ ok: false, error: 'Chat thread was not found.' }) };
        }
        const thread = threadSnap.data() || {};
        let uid = String(thread.uid || thread.userUid || thread.ownerUid || '').trim();
        let userDoc = null;
        if (uid) {
          const userSnap = await db.collection('users').doc(uid).get();
          if (userSnap.exists) userDoc = { id: userSnap.id, data: userSnap.data() || {} };
        }
        if (!userDoc && thread.email) {
          const byEmail = await db.collection('users').where('email', '==', String(thread.email).toLowerCase()).limit(1).get();
          if (!byEmail.empty) {
            const doc = byEmail.docs[0];
            userDoc = { id: doc.id, data: doc.data() || {} };
            uid = doc.id;
          }
        }
        if (!userDoc) {
          return { statusCode: 404, headers: headers(), body: JSON.stringify({ ok: false, error: 'Could not match this chat to a user account.' }) };
        }

        const profile = userDoc.data || {};
        const plan = normalizePlan(profile.currentPlan || profile.plan || profile.lastPlan || thread.plan);
        const planInfo = PLAN_DETAILS[plan] || PLAN_DETAILS.solo;
        const token = String(profile.paymentRequestToken || '').trim() || makePaymentRequestToken(userDoc.id, plan);
        const requestRef = db.collection('paymentRequests').doc(token);
        const requestSnap = await requestRef.get();
        const requestPayload = {
          token,
          uid: userDoc.id,
          ownerUid: profile.ownerUid || userDoc.id,
          name: profile.name || profile.displayName || thread.name || thread.displayName || '',
          email: String(profile.email || thread.email || '').toLowerCase(),
          businessName: profile.bizName || profile.invoiceBiz || profile.businessName || '',
          plan,
          planName: planInfo.name,
          amount: planInfo.price,
          currency: 'LKR',
          trialEnd: profile.trialEnd || '',
          status: 'invoiced',
          source: 'admin-chat-payment-request',
          page: thread.page || profile.lastSeenPath || '',
          updatedAt: stamp,
          updatedAtUtc: now
        };
        if (!requestSnap.exists) {
          requestPayload.createdAt = stamp;
          requestPayload.createdAtUtc = now;
        }
        await requestRef.set(requestPayload, { merge: true });

        const trialEndMs = parseTime(profile.trialEnd);
        const trialLine = trialEndMs && trialEndMs <= Date.now()
          ? 'Your 15-day free trial has ended.'
          : 'Your 15-day free trial is ready for activation.';
        const message = [
          'Hi ' + (profile.name || thread.name || 'there') + ',',
          '',
          trialLine,
          'Package: ' + planInfo.name + ' Plan',
          'Amount: LKR ' + Number(planInfo.price).toLocaleString('en-US') + '/month',
          'Payment request token: ' + token,
          '',
          'Our team can send the manual invoice for this package. Reply here if you want us to resend details or confirm payment.'
        ].join('\n');

        await threadRef.collection('messages').add({
          authorRole: 'admin',
          authorName: 'Mrs. Gamage',
          text: message,
          paymentRequestToken: token,
          paymentRequestPlan: plan,
          createdAt: stamp,
          createdAtUtc: now
        });
        await threadRef.set({
          status: 'open',
          assignedTo: 'Mrs. Gamage',
          paymentRequestToken: token,
          lastMessage: message.slice(0, 240),
          lastMessageBy: 'admin',
          lastMessageAt: stamp,
          lastMessageAtUtc: now,
          unreadForAdmin: false,
          unreadForUser: true,
          updatedAt: stamp,
          updatedAtUtc: now
        }, { merge: true });
        await db.collection('users').doc(userDoc.id).set({
          paymentRequestToken: token,
          paymentRequestStatus: 'invoiced',
          paymentRequestPlan: plan,
          paymentRequestAmount: planInfo.price,
          manualPaymentStatus: 'payment-requested',
          updatedAt: stamp
        }, { merge: true });
        return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, token, plan, amount: planInfo.price }) };
      }

      if (action === 'updateChat') {
        const id = String(body.id || body.threadId || '').trim();
        const status = String(body.status || '').trim().toLowerCase();
        if (!id || ['open', 'closed'].indexOf(status) === -1) {
          return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Invalid chat update.' }) };
        }
        const stamp = admin.firestore.FieldValue.serverTimestamp();
        const now = new Date().toISOString();
        const update = {
          status,
          updatedAt: stamp,
          updatedAtUtc: now
        };
        if (status === 'closed') {
          update.closedAt = stamp;
          update.closedAtUtc = now;
          update.closedBy = 'platform_admin';
        }
        await db.collection('chatThreads').doc(id).set(update, { merge: true });
        return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true }) };
      }

      return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Unknown admin action.' }) };
    }

    const users = await readCollection(db, 'users', 'createdAt', 500);
    const visits = await readCollection(db, 'platformVisits', 'createdAt', 500);
    const tickets = await readCollection(db, 'supportTickets', 'createdAt', 300);
    await ensureExpiredTrialPaymentRequests(admin, db, users);
    const paymentRequests = await readCollection(db, 'paymentRequests', 'createdAt', 300);
    const chats = await readChats(db);
    const stats = buildStats(users, visits, tickets, paymentRequests, chats);

    const usersTotal = await countQuery(db.collection('users'));
    const visitsTotal = await countQuery(db.collection('platformVisits'));
    const ticketsTotal = await countQuery(db.collection('supportTickets'));
    const paymentRequestsTotal = await countQuery(db.collection('paymentRequests'));
    const chatsTotal = await countQuery(db.collection('chatThreads'));
    const landingVisitsTotal = await countQuery(db.collection('platformVisits').where('isLanding', '==', true));

    if (usersTotal != null) stats.usersTotal = usersTotal;
    if (visitsTotal != null) stats.visitsTotal = visitsTotal;
    if (ticketsTotal != null) stats.ticketsTotal = ticketsTotal;
    if (paymentRequestsTotal != null) stats.paymentRequestsTotal = paymentRequestsTotal;
    if (chatsTotal != null) stats.chatsTotal = chatsTotal;
    if (landingVisitsTotal != null) stats.landingVisitsTotal = landingVisitsTotal;

    return {
      statusCode: 200,
      headers: headers(),
      body: JSON.stringify({ ok: true, users, visits, tickets, paymentRequests, chats, stats })
    };
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: headers(),
      body: JSON.stringify({ ok: false, error: err && err.message ? err.message : 'Admin data failed.' })
    };
  }
};
