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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function clean(value, max) {
  value = String(value == null ? '' : value).trim();
  return max && value.length > max ? value.slice(0, max) : value;
}

function normalizePlan(plan) {
  const aliases = { starter: 'studio', growth: 'business', premium: 'business' };
  plan = String(plan || '').toLowerCase();
  plan = aliases[plan] || plan;
  return Object.prototype.hasOwnProperty.call(PLANS, plan) ? plan : 'solo';
}

function siteUrl(event) {
  const host = process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || '';
  if (host) return host.replace(/\/$/, '');
  const origin = event.headers.origin || event.headers.Origin || '';
  return origin.replace(/\/$/, '');
}

function appendQuery(url, params) {
  if (!url) return '';
  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const base = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const glue = base.indexOf('?') >= 0 ? '&' : '?';
  const query = Object.keys(params || {})
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  return query ? base + glue + query + hash : url;
}

function payableWebhookUrl(baseUrl) {
  if (!baseUrl) return '';
  const url = baseUrl + '/.netlify/functions/payable-webhook';
  const secret = process.env.PAYABLE_WEBHOOK_SECRET || '';
  return secret ? appendQuery(url, { secret }) : url;
}

function findCheckoutUrl(result) {
  if (!result || typeof result !== 'object') return '';
  return result.checkoutUrl
    || result.checkout_url
    || result.paymentUrl
    || result.payment_url
    || result.redirectUrl
    || result.redirect_url
    || result.url
    || (result.data && findCheckoutUrl(result.data))
    || '';
}

function publicPayablePayload(payload) {
  const copy = Object.assign({}, payload);
  delete copy.business_token;
  delete copy.businessToken;
  delete copy.merchant_token;
  delete copy.merchantToken;
  if (copy.webhook_url) {
    copy.webhook_url = String(copy.webhook_url).replace(/([?&]secret=)[^&]*/i, '$1redacted');
  }
  return copy;
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

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Invalid request body' }) };
  }

  const admin = await getAdmin();
  if (!admin) {
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ ok: false, error: 'Supabase service role is not configured for payment verification.' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const match = String(authHeader).match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return { statusCode: 401, headers: headers(), body: JSON.stringify({ ok: false, error: 'Please sign in before starting payment.' }) };
  }

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(match[1]);
  } catch (e) {
    return { statusCode: 401, headers: headers(), body: JSON.stringify({ ok: false, error: 'Could not verify your session. Please sign in again.' }) };
  }

  const plan = normalizePlan(body.plan);
  const planInfo = PLANS[plan];
  const uid = decoded.uid;
  const email = clean(body.email || decoded.email || '', 180).toLowerCase();
  const name = clean(body.name || decoded.name || '', 180);
  const baseUrl = siteUrl(event);
  const sessionId = 'cls-' + plan + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  const amount = planInfo.price;
  const checkoutUrl = process.env.PAYABLE_CHECKOUT_URL || process.env.PAYABLE_API_URL || '';
  const returnBase = clean(body.returnUrl, 900) || (baseUrl + '/payable-return.html');
  const returnUrl = appendQuery(returnBase, { plan, session: sessionId });
  const cancelUrl = clean(body.cancelUrl, 900) || (baseUrl + '/' + (plan === 'business' ? 'growth.html' : plan === 'studio' ? 'starter.html' : 'solo.html'));
  const webhookUrl = payableWebhookUrl(baseUrl);

  const db = admin.firestore();
  const sessionRef = db.collection('payablePayments').doc(sessionId);
  await sessionRef.set({
    uid,
    email,
    name,
    plan,
    planName: planInfo.name,
    amount,
    currency: 'LKR',
    status: 'pending',
    billingProvider: 'payable',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  if (!checkoutUrl) {
    return {
      statusCode: 501,
      headers: headers(),
      body: JSON.stringify({
        ok: false,
        sessionId,
        error: 'Payable checkout endpoint is not configured. Add PAYABLE_CHECKOUT_URL in Netlify after Payable gives you the API endpoint.'
      })
    };
  }

  const businessKey = process.env.PAYABLE_BUSINESS_KEY || '';
  const businessToken = process.env.PAYABLE_BUSINESS_TOKEN || '';
  const merchantId = process.env.PAYABLE_MERCHANT_ID || '';
  const merchantToken = process.env.PAYABLE_MERCHANT_TOKEN || '';
  const authToken = merchantToken || businessToken;
  if (!businessKey || !businessToken || !merchantId || !merchantToken) {
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ ok: false, error: 'Payable credentials are missing in Netlify environment variables.' }) };
  }

  const payablePayload = {
    merchant_id: merchantId,
    merchant_token: merchantToken,
    business_key: businessKey,
    business_token: businessToken,
    order_id: sessionId,
    reference: sessionId,
    amount,
    currency: 'LKR',
    description: 'CLS ' + planInfo.name + ' Plan - Monthly Subscription',
    customer_name: name,
    customer_email: email,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    webhook_url: webhookUrl,
    metadata: { uid, plan, sessionId }
  };

  let payableResponse;
  try {
    const res = await fetch(checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + authToken,
        'X-Merchant-ID': merchantId,
        'X-Merchant-Token': merchantToken,
        'X-Business-Key': businessKey,
        'X-Business-Token': businessToken
      },
      body: JSON.stringify(payablePayload)
    });
    const text = await res.text();
    try {
      payableResponse = JSON.parse(text || '{}');
    } catch (parseErr) {
      payableResponse = { raw: text };
    }
    if (!res.ok) {
      await sessionRef.set({
        status: 'checkout_failed',
        payableStatusCode: res.status,
        payableResponse,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { statusCode: 502, headers: headers(), body: JSON.stringify({ ok: false, error: 'Payable checkout request failed.', status: res.status }) };
    }
  } catch (err) {
    await sessionRef.set({
      status: 'checkout_error',
      error: err && err.message ? err.message : 'Payable request failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { statusCode: 502, headers: headers(), body: JSON.stringify({ ok: false, error: 'Could not reach Payable checkout service.' }) };
  }

  const redirect = findCheckoutUrl(payableResponse);
  await sessionRef.set({
    status: redirect ? 'checkout_created' : 'checkout_missing_url',
    payableRequest: publicPayablePayload(payablePayload),
    payableResponse,
    checkoutUrl: redirect || '',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  if (!redirect) {
    return { statusCode: 502, headers: headers(), body: JSON.stringify({ ok: false, sessionId, error: 'Payable responded without a checkout URL. Check the Payable API field names.' }) };
  }

  return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, sessionId, checkoutUrl: redirect }) };
};
