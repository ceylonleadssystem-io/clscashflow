const crypto = require('crypto');
const { firebaseAdminFacade } = require('../lib/supabase');

async function getAdmin() {
  try {
    return firebaseAdminFacade();
  } catch (e) {
    return null;
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

function sha512Upper(value) {
  return crypto.createHash('sha512').update(String(value || ''), 'utf8').digest('hex').toUpperCase();
}

function authCandidates(event) {
  const auth = header(event.headers, 'authorization');
  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  const query = event.queryStringParameters || {};
  return [
    header(event.headers, 'x-payable-webhook-secret'),
    header(event.headers, 'x-webhook-secret'),
    header(event.headers, 'x-api-key'),
    header(event.headers, 'x-merchant-token'),
    header(event.headers, 'x-business-token'),
    bearer ? bearer[1] : '',
    query.secret || query.token || ''
  ].filter(Boolean);
}

function verifyWebhook(event) {
  const expected = [
    process.env.PAYABLE_WEBHOOK_SECRET,
    process.env.PAYABLE_BUSINESS_TOKEN,
    process.env.PAYABLE_MERCHANT_TOKEN
  ].filter(Boolean);
  if (!expected.length) {
    return { ok: false, statusCode: 500, error: 'Payable webhook secret is not configured.' };
  }
  const candidates = authCandidates(event);
  const ok = expected.some((secret) => candidates.some((candidate) => safeEqual(candidate, secret)));
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
  return clean(firstValue(parts.meta, ['sessionId', 'session_id', 'invoiceId', 'invoice_id', 'invoiceNo', 'invoice_no', 'orderId', 'order_id', 'reference']), 140)
    || clean(firstValue(parts.payment, ['sessionId', 'session_id', 'invoiceId', 'invoice_id', 'invoiceNo', 'invoice_no', 'orderId', 'order_id', 'reference', 'payment_reference']), 140)
    || clean(firstValue(parts.data, ['sessionId', 'session_id', 'invoiceId', 'invoice_id', 'invoiceNo', 'invoice_no', 'orderId', 'order_id', 'reference', 'payment_reference']), 140)
    || clean(firstValue(parts.body, ['sessionId', 'session_id', 'invoiceId', 'invoice_id', 'invoiceNo', 'invoice_no', 'orderId', 'order_id', 'reference', 'payment_reference']), 140);
}

function statusFrom(body) {
  const parts = webhookData(body);
  const status = firstValue(parts.payment, ['statusMessage', 'status_message', 'status', 'statusCode', 'status_code', 'payment_status', 'transaction_status', 'state', 'result'])
    || firstValue(parts.data, ['statusMessage', 'status_message', 'status', 'statusCode', 'status_code', 'payment_status', 'transaction_status', 'state', 'result'])
    || firstValue(parts.body, ['statusMessage', 'status_message', 'status', 'statusCode', 'status_code', 'payment_status', 'transaction_status', 'state', 'result', 'event']);
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

function payableWebhookCheck(body) {
  const parts = webhookData(body);
  const token = process.env.PAYABLE_MERCHANT_TOKEN || '';
  const supplied = clean(firstValue(parts.payment, ['checkValue', 'check_value'])
    || firstValue(parts.data, ['checkValue', 'check_value'])
    || firstValue(parts.body, ['checkValue', 'check_value']), 200);
  if (!token || !supplied) return { ok: true, skipped: true };
  const merchantKey = clean(firstValue(parts.payment, ['merchantKey', 'merchant_key'])
    || firstValue(parts.data, ['merchantKey', 'merchant_key'])
    || firstValue(parts.body, ['merchantKey', 'merchant_key'])
    || process.env.PAYABLE_MERCHANT_KEY
    || process.env.PAYABLE_MERCHANT_ID, 120);
  const payableOrderId = clean(firstValue(parts.payment, ['payableOrderId', 'payable_order_id'])
    || firstValue(parts.data, ['payableOrderId', 'payable_order_id'])
    || firstValue(parts.body, ['payableOrderId', 'payable_order_id']), 160);
  const payableTransactionId = clean(firstValue(parts.payment, ['payableTransactionId', 'payable_transaction_id', 'transaction_id', 'payment_id'])
    || firstValue(parts.data, ['payableTransactionId', 'payable_transaction_id', 'transaction_id', 'payment_id'])
    || firstValue(parts.body, ['payableTransactionId', 'payable_transaction_id', 'transaction_id', 'payment_id']), 160);
  const payableAmount = clean(firstValue(parts.payment, ['payableAmount', 'payable_amount', 'amount'])
    || firstValue(parts.data, ['payableAmount', 'payable_amount', 'amount'])
    || firstValue(parts.body, ['payableAmount', 'payable_amount', 'amount']), 40);
  const currency = clean(firstValue(parts.payment, ['payableCurrency', 'payable_currency', 'currencyCode', 'currency_code', 'currency'])
    || firstValue(parts.data, ['payableCurrency', 'payable_currency', 'currencyCode', 'currency_code', 'currency'])
    || firstValue(parts.body, ['payableCurrency', 'payable_currency', 'currencyCode', 'currency_code', 'currency']), 8);
  const invoiceNo = clean(firstValue(parts.payment, ['invoiceNo', 'invoice_no', 'invoiceId', 'invoice_id'])
    || firstValue(parts.data, ['invoiceNo', 'invoice_no', 'invoiceId', 'invoice_id'])
    || firstValue(parts.body, ['invoiceNo', 'invoice_no', 'invoiceId', 'invoice_id']), 140);
  const statusCode = clean(firstValue(parts.payment, ['statusCode', 'status_code'])
    || firstValue(parts.data, ['statusCode', 'status_code'])
    || firstValue(parts.body, ['statusCode', 'status_code']), 40);
  if (!merchantKey || !payableOrderId || !payableTransactionId || !payableAmount || !currency || !invoiceNo || !statusCode) {
    return { ok: true, skipped: true };
  }
  const expected = sha512Upper([merchantKey, payableOrderId, payableTransactionId, payableAmount, currency, invoiceNo, statusCode, sha512Upper(token)].join('|'));
  return safeEqual(expected, supplied) ? { ok: true } : { ok: false };
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
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ ok: false, error: 'Supabase service role is not configured for payment updates.' }) };
  }

  const body = parseBody(event);
  const payableCheck = payableWebhookCheck(body);
  if (!payableCheck.ok) {
    return { statusCode: 401, headers: headers(), body: JSON.stringify({ ok: false, Status: 401, error: 'Payable checkValue verification failed.' }) };
  }
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
  const amount = Number(saved.amount || parts.payment.payableAmount || parts.payment.amount || parts.data.payableAmount || parts.data.amount || parts.body.payableAmount || parts.body.amount || PLANS[plan].price || 0);
  const transactionId = clean(firstValue(parts.payment, ['payableTransactionId', 'payable_transaction_id', 'id', 'transaction_id', 'payment_id'])
    || firstValue(parts.data, ['payableTransactionId', 'payable_transaction_id', 'id', 'transaction_id', 'payment_id'])
    || firstValue(parts.body, ['payableTransactionId', 'payable_transaction_id', 'id', 'transaction_id', 'payment_id']), 160);
  const payableOrderId = clean(firstValue(parts.payment, ['payableOrderId', 'payable_order_id'])
    || firstValue(parts.data, ['payableOrderId', 'payable_order_id'])
    || firstValue(parts.body, ['payableOrderId', 'payable_order_id']), 160);

  await paymentRef.set({
    uid: uid || saved.uid || '',
    plan,
    amount,
    currency: saved.currency || parts.payment.currency || parts.data.currency || parts.body.currency || 'LKR',
    status: paid ? 'paid' : rawStatus,
    payableStatus: rawStatus,
    payableOrderId,
    payableTransactionId: transactionId,
    webhookPayload: body,
    webhookReceivedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  if (!paid) {
    return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, Status: 200, paid: false, status: rawStatus }) };
  }

  if (!uid) {
    return { statusCode: 202, headers: headers(), body: JSON.stringify({ ok: true, Status: 202, paid: true, warning: 'Payment recorded, but no user id was found.' }) };
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
    currency: saved.currency || parts.payment.payableCurrency || parts.payment.currency || parts.data.payableCurrency || parts.data.currency || parts.body.payableCurrency || parts.body.currency || 'LKR',
    status: 'paid',
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    rawStatus,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, Status: 200, paid: true, uid, plan }) };
};
