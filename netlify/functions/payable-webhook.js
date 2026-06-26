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

function headers() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Payable-Webhook-Secret, X-Webhook-Secret, X-Api-Key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
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

function clean(value, max) {
  value = String(value == null ? '' : value).trim();
  return max && value.length > max ? value.slice(0, max) : value;
}

function header(headersObj, name) {
  const target = String(name || '').toLowerCase();
  const found = Object.keys(headersObj || {}).find((key) => key.toLowerCase() === target);
  return found ? String(headersObj[found] || '') : '';
}

function safeEqual(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (!a || !b) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
}

function authCandidates(event) {
  const auth = header(event.headers, 'authorization');
  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  const query = event.queryStringParameters || {};
  return [
    header(event.headers, 'x-payable-webhook-secret'),
    header(event.headers, 'x-webhook-secret'),
    header(event.headers, 'x-api-key'),
    bearer ? bearer[1] : '',
    query.secret || query.token || ''
  ].filter(Boolean);
}

function verifyWebhook(event) {
  const expected = process.env.PAYABLE_WEBHOOK_SECRET || process.env.PAYABLE_BUSINESS_TOKEN || '';
  if (!expected) {
    return { ok: false, statusCode: 500, error: 'Payable webhook secret is not configured.' };
  }
  const ok = authCandidates(event).some((candidate) => safeEqual(candidate, expected));
  return ok ? { ok: true } : { ok: false, statusCode: 401, error: 'Webhook verification failed.' };
}

function parseBody(event) {
  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '{}');
  try {
    return JSON.parse(raw || '{}');
  } catch (e) {
    return {};
  }
}

function parseMetadata(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch (e) {
    return {};
  }
}

function firstValue(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return '';
}

function webhookData(body) {
  const data = body && typeof body === 'object' && body.data && typeof body.data === 'object' ? body.data : {};
  const payment = data.payment && typeof data.payment === 'object' ? data.payment : {};
  const meta = Object.assign({},
    parseMetadata(body.metadata),
    parseMetadata(data.metadata),
    parseMetadata(payment.metadata)
  );
  return { body, data, payment, meta };
}

function sessionIdFrom(body) {
  const parts = webhookData(body);
  return clean(firstValue(parts.meta, ['sessionId', 'session_id', 'orderId', 'order_id', 'reference']), 140)
    || clean(firstValue(parts.payment, ['sessionId', 'session_id', 'orderId', 'order_id', 'reference', 'payment_reference']), 140)
    || clean(firstValue(parts.data, ['sessionId', 'session_id', 'orderId', 'order_id', 'reference', 'payment_reference']), 140)
    || clean(firstValue(parts.body, ['sessionId', 'session_id', 'orderId', 'order_id', 'reference', 'payment_reference']), 140);
}

function statusFrom(body) {
  const parts = webhookData(body);
  const status = firstValue(parts.payment, ['status', 'payment_status', 'transaction_status', 'state', 'result'])
    || firstValue(parts.data, ['status', 'payment_status', 'transaction_status', 'state', 'result'])
    || firstValue(parts.body, ['status', 'payment_status', 'transaction_status', 'state', 'result', 'event']);
  return clean(status, 80).toLowerCase();
}

function isPaid(body) {
  const parts = webhookData(body);
  const boolValue = firstValue(parts.payment, ['paid', 'success', 'approved'])
    || firstValue(parts.data, ['paid', 'success', 'approved'])
    || firstValue(parts.body, ['paid', 'success', 'approved']);
  if (boolValue === true || String(boolValue).toLowerCase() === 'true') return true;
  const status = statusFrom(body);
  return ['paid', 'success', 'successful', 'completed', 'settled', 'approved', 'authorized', 'captured'].includes(status);
}

function normalizePlan(plan) {
  const aliases = { starter: 'studio', growth: 'business', premium: 'business' };
  plan = String(plan || '').toLowerCase();
  plan = aliases[plan] || plan;
  return Object.prototype.hasOwnProperty.call(PLANS, plan) ? plan : '';
}

const PLANS = {
  solo: { name: 'Solo', price: 3500 },
  studio: { name: 'Studio', price: 5500 },
  business: { name: 'Business', price: 8500 }
};

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: headers(), body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers(), body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  const verified = verifyWebhook(event);
  if (!verified.ok) {
    return { statusCode: verified.statusCode, headers: headers(), body: JSON.stringify({ ok: false, error: verified.error }) };
  }

  const admin = await getAdmin();
  if (!admin) {
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ ok: false, error: 'Firebase Admin is not configured for payment updates.' }) };
  }

  const body = parseBody(event);
  const sessionId = sessionIdFrom(body);
  if (!sessionId) {
    return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Missing Payable session/order reference.' }) };
  }

  const db = admin.firestore();
  const paymentRef = db.collection('payablePayments').doc(sessionId);
  const snap = await paymentRef.get();
  const saved = snap.exists ? snap.data() : {};
  const parts = webhookData(body);
  const paid = isPaid(body);
  const rawStatus = statusFrom(body) || (paid ? 'paid' : 'received');
  const plan = normalizePlan(saved.plan || parts.meta.plan || parts.payment.plan || parts.data.plan || parts.body.plan) || 'solo';
  const uid = clean(saved.uid || parts.meta.uid || parts.payment.uid || parts.data.uid || parts.body.uid, 160);
  const amount = Number(saved.amount || parts.payment.amount || parts.data.amount || parts.body.amount || PLANS[plan].price || 0);
  const transactionId = clean(firstValue(parts.payment, ['id', 'transaction_id', 'payment_id'])
    || firstValue(parts.data, ['id', 'transaction_id', 'payment_id'])
    || firstValue(parts.body, ['id', 'transaction_id', 'payment_id']), 160);

  await paymentRef.set({
    uid: uid || saved.uid || '',
    plan,
    amount,
    currency: saved.currency || parts.payment.currency || parts.data.currency || parts.body.currency || 'LKR',
    status: paid ? 'paid' : rawStatus,
    payableStatus: rawStatus,
    payableTransactionId: transactionId,
    webhookPayload: body,
    webhookReceivedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  if (!paid) {
    return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, paid: false, status: rawStatus }) };
  }

  if (!uid) {
    return { statusCode: 202, headers: headers(), body: JSON.stringify({ ok: true, paid: true, warning: 'Payment recorded, but no user id was found.' }) };
  }

  const planInfo = PLANS[plan] || PLANS.solo;
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db.collection('users').doc(uid).set({
    paid: true,
    plan,
    currentPlan: plan,
    lastPlan: plan,
    planName: planInfo.name,
    planPrice: planInfo.price,
    subscriptionStatus: 'active',
    subscriptionProvider: 'payable',
    billingProvider: 'payable',
    payableLastSessionId: sessionId,
    payableLastPaymentId: transactionId,
    payableLastPaidAt: admin.firestore.FieldValue.serverTimestamp(),
    subscriptionCurrentPeriodEnd: periodEnd.toISOString(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  await db.collection('users').doc(uid).collection('billingHistory').doc(sessionId).set({
    provider: 'payable',
    sessionId,
    transactionId,
    plan,
    planName: planInfo.name,
    amount,
    currency: saved.currency || parts.payment.currency || parts.data.currency || parts.body.currency || 'LKR',
    status: 'paid',
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    rawStatus,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, paid: true, uid, plan }) };
};
