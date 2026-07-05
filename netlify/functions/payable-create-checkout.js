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

function payableEnv() {
  return String(process.env.PAYABLE_ENV || 'sandbox').toLowerCase() === 'live' ? 'live' : 'sandbox';
}

function payableAuthUrl() {
  if (process.env.PAYABLE_AUTH_URL) return process.env.PAYABLE_AUTH_URL;
  return payableEnv() === 'live'
    ? 'https://ipgpayment.payable.lk/ipg/auth/direct-api'
    : 'https://sandboxipgpayment.payable.lk/ipg/auth/direct-api';
}

function payableCheckoutUrl() {
  if (process.env.PAYABLE_CHECKOUT_URL || process.env.PAYABLE_API_URL) return process.env.PAYABLE_CHECKOUT_URL || process.env.PAYABLE_API_URL;
  return payableEnv() === 'live'
    ? 'https://ipgpayment.payable.lk/ipg/pro/direct-api'
    : 'https://sandboxipgpayment.payable.lk/ipg/sandbox/direct-api';
}

function sha512Upper(value) {
  return crypto.createHash('sha512').update(String(value || ''), 'utf8').digest('hex').toUpperCase();
}

function payableAmount(value) {
  return Number(value || 0).toFixed(2);
}

function payableCheckValue(merchantKey, invoiceId, amount, currencyCode, merchantToken) {
  return sha512Upper([merchantKey, invoiceId, amount, currencyCode, sha512Upper(merchantToken)].join('|'));
}

function splitName(name, email) {
  name = clean(name, 180);
  if (!name && email) name = String(email).split('@')[0].replace(/[._-]+/g, ' ');
  const parts = name.split(/\s+/).filter(Boolean);
  return {
    firstName: clean(parts.shift() || 'Customer', 80),
    lastName: clean(parts.join(' ') || 'User', 100)
  };
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
    || result.paymentPage
    || result.payment_page
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
  delete copy.checkValue;
  if (copy.webhookUrl) {
    copy.webhookUrl = String(copy.webhookUrl).replace(/([?&]secret=)[^&]*/i, '$1redacted');
  }
  return copy;
}

async function readJsonResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text || '{}');
  } catch (parseErr) {
    return { raw: text };
  }
}

async function obtainPayableAccessToken(authUrl, businessKey, businessToken, originDomain) {
  const authBody = {
    grant_type: 'client_credentials',
    originDomain
  };
  const basicToken = Buffer.from(businessKey + ':' + businessToken).toString('base64');
  async function request(authorization) {
    const res = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authorization
      },
      body: JSON.stringify(authBody)
    });
    return { res, json: await readJsonResponse(res) };
  }

  let out = await request(basicToken);
  if (!out.res.ok && out.res.status === 401) {
    out = await request('Basic ' + basicToken);
  }
  const accessToken = out.json && (out.json.accessToken || out.json.access_token || (out.json.data && (out.json.data.accessToken || out.json.data.access_token)));
  if (!out.res.ok || !accessToken) {
    const err = new Error('Payable auth request failed.');
    err.status = out.res.status;
    err.response = out.json;
    throw err;
  }
  return { accessToken, response: out.json };
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
  const amountText = payableAmount(amount);
  const currencyCode = 'LKR';
  const authUrl = payableAuthUrl();
  const checkoutUrl = payableCheckoutUrl();
  const originDomain = clean(process.env.PAYABLE_ORIGIN_DOMAIN || baseUrl, 900);
  const returnBase = clean(body.returnUrl, 900) || (baseUrl + '/payable-return.html');
  const returnUrl = appendQuery(returnBase, { plan, session: sessionId });
  const cancelUrl = clean(body.cancelUrl, 900) || (baseUrl + '/' + (plan === 'business' ? 'growth.html' : plan === 'studio' ? 'starter.html' : 'solo.html'));
  const webhookUrl = payableWebhookUrl(baseUrl);
  const logoUrl = clean(process.env.PAYABLE_LOGO_URL || (baseUrl + '/assets/mrs-gamage-cashflow.png'), 900);

  const db = admin.firestore();
  const sessionRef = db.collection('payablePayments').doc(sessionId);
  await sessionRef.set({
    uid,
    email,
    name,
    plan,
    planName: planInfo.name,
    amount,
    currency: currencyCode,
    status: 'pending',
    billingProvider: 'payable',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  const businessKey = process.env.PAYABLE_BUSINESS_KEY || '';
  const businessToken = process.env.PAYABLE_BUSINESS_TOKEN || '';
  const merchantKey = process.env.PAYABLE_MERCHANT_KEY || process.env.PAYABLE_MERCHANT_ID || '';
  const merchantToken = process.env.PAYABLE_MERCHANT_TOKEN || '';
  if (!businessKey || !businessToken || !merchantKey || !merchantToken) {
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ ok: false, error: 'Payable credentials are missing in Netlify environment variables.' }) };
  }
  const customer = splitName(name, email);
  const phone = clean(body.phone || decoded.phone || '0770000000', 20);

  const payablePayload = {
    merchantKey,
    currencyCode,
    checkValue: payableCheckValue(merchantKey, sessionId, amountText, currencyCode, merchantToken),
    invoiceId: sessionId,
    paymentType: Number(process.env.PAYABLE_PAYMENT_TYPE || 1),
    amount: amountText,
    orderDescription: 'CLS ' + planInfo.name + ' Plan - Monthly Subscription',
    logoUrl,
    returnUrl,
    webhookUrl,
    originDomain,
    cancelUrl,
    customerFirstName: customer.firstName,
    customerLastName: customer.lastName,
    customerMobilePhone: phone,
    customerEmail: email,
    billingAddressStreet: clean(body.billingAddressStreet || 'Online Payment', 120),
    billingAddressCity: clean(body.billingAddressCity || 'Colombo', 80),
    billingAddressCountry: clean(body.billingAddressCountry || 'LKA', 8),
    billingAddressPostcodeZip: clean(body.billingAddressPostcodeZip || '00100', 20)
  };

  let payableResponse;
  let payableAuthResponse;
  try {
    const auth = await obtainPayableAccessToken(authUrl, businessKey, businessToken, originDomain);
    payableAuthResponse = auth.response;
    const res = await fetch(checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + auth.accessToken
      },
      body: JSON.stringify(payablePayload)
    });
    payableResponse = await readJsonResponse(res);
    if (!res.ok) {
      await sessionRef.set({
        status: 'checkout_failed',
        payableAuthResponse,
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
    payableAuthResponse,
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
