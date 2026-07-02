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

function envValue(name) {
  const value = clean(process.env[name] || '', 0);
  return /^PASTE_/i.test(value) ? '' : value;
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
  return result.paymentPage
    || result.payment_page
    || result.checkoutUrl
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
  if (copy.webhookUrl) {
    copy.webhookUrl = String(copy.webhookUrl).replace(/([?&]secret=)[^&]*/i, '$1redacted');
  }
  if (copy.webhook_url) {
    copy.webhook_url = String(copy.webhook_url).replace(/([?&]secret=)[^&]*/i, '$1redacted');
  }
  if (copy.checkValue) copy.checkValue = 'redacted';
  return copy;
}

function sha512Upper(value) {
  return crypto.createHash('sha512').update(String(value), 'utf8').digest('hex').toUpperCase();
}

function payableRootUrl() {
  const env = String(process.env.PAYABLE_ENV || 'sandbox').toLowerCase();
  return env === 'live' || env === 'production'
    ? 'https://ipgpayment.payable.lk'
    : 'https://sandboxipgpayment.payable.lk';
}

function payableAuthUrl() {
  return process.env.PAYABLE_AUTH_URL || (payableRootUrl() + '/ipg/auth/direct-api');
}

function payableCheckoutUrl() {
  if (process.env.PAYABLE_CHECKOUT_URL || process.env.PAYABLE_API_URL) {
    return process.env.PAYABLE_CHECKOUT_URL || process.env.PAYABLE_API_URL;
  }
  const env = String(process.env.PAYABLE_ENV || 'sandbox').toLowerCase();
  return payableRootUrl() + (env === 'live' || env === 'production' ? '/ipg/pro/direct-api' : '/ipg/sandbox/direct-api');
}

function splitName(fullName, email) {
  const fallback = email ? String(email).split('@')[0] : 'Customer';
  const parts = String(fullName || fallback).trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Customer',
    lastName: parts.slice(1).join(' ') || 'Customer'
  };
}

async function getPayableAccessToken({ authUrl, businessKey, businessToken, originDomain }) {
  const basicAuth = Buffer.from(businessKey + ':' + businessToken, 'utf8').toString('base64');
  const res = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': basicAuth
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      originDomain
    })
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text || '{}');
  } catch (e) {
    data = { raw: text };
  }
  if (!res.ok || !data.accessToken) {
    const err = new Error('Payable auth request failed.');
    err.status = res.status;
    err.response = data;
    throw err;
  }
  return { accessToken: data.accessToken, response: data };
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
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ ok: false, error: 'Firebase Admin is not configured for payment verification.' }) };
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
  const amountText = Number(amount).toFixed(2);
  const checkoutUrl = payableCheckoutUrl();
  const authUrl = payableAuthUrl();
  const returnBase = clean(body.returnUrl, 900) || (baseUrl + '/payable-return.html');
  const returnUrl = appendQuery(returnBase, { plan, session: sessionId });
  const cancelUrl = clean(body.cancelUrl, 900) || (baseUrl + '/' + (plan === 'business' ? 'growth.html' : plan === 'studio' ? 'starter.html' : 'solo.html'));
  const webhookUrl = payableWebhookUrl(baseUrl);
  const originDomain = clean(envValue('PAYABLE_ORIGIN_DOMAIN') || baseUrl, 300);

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

  const businessKey = envValue('PAYABLE_BUSINESS_KEY');
  const businessToken = envValue('PAYABLE_BUSINESS_TOKEN');
  const merchantKey = envValue('PAYABLE_MERCHANT_KEY') || envValue('PAYABLE_MERCHANT_ID');
  const merchantToken = envValue('PAYABLE_MERCHANT_TOKEN');
  if (!businessKey || !businessToken || !merchantKey || !merchantToken) {
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ ok: false, error: 'Payable credentials are missing in Netlify environment variables.' }) };
  }

  const customerName = splitName(name, email);
  const paymentType = String(process.env.PAYABLE_PAYMENT_TYPE || '1');
  const checkValue = sha512Upper([
    merchantKey,
    sessionId,
    amountText,
    'LKR',
    sha512Upper(merchantToken)
  ].join('|'));
  const payablePayload = {
    merchantKey,
    currencyCode: 'LKR',
    checkValue,
    invoiceId: sessionId,
    paymentType: Number(paymentType) || 1,
    amount: amountText,
    orderDescription: 'CLS ' + planInfo.name + ' Plan - Monthly Subscription',
    logoUrl: process.env.PAYABLE_LOGO_URL || (baseUrl + '/assets/mrs-gamage-cashflow.png'),
    returnUrl,
    cancelUrl,
    webhookUrl,
    originDomain,
    customerFirstName: clean(body.customerFirstName || customerName.firstName, 120),
    customerLastName: clean(body.customerLastName || customerName.lastName, 120),
    customerMobilePhone: clean(body.customerMobilePhone || body.phone || '0770000000', 40),
    customerEmail: email,
    billingAddressStreet: clean(body.billingAddressStreet || 'Colombo', 180),
    billingAddressCity: clean(body.billingAddressCity || 'Colombo', 120),
    billingAddressPostcodeZip: clean(body.billingAddressPostcodeZip || '00100', 40),
    billingAddressCountry: clean(body.billingAddressCountry || 'LK', 4),
    custom1: uid,
    custom2: plan
  };
  if (payablePayload.paymentType === 2) {
    payablePayload.interval = process.env.PAYABLE_RECURRING_INTERVAL || 'MONTHLY';
    payablePayload.doFirstPayment = process.env.PAYABLE_DO_FIRST_PAYMENT || '1';
    payablePayload.recurringAmount = amountText;
    payablePayload.startDate = new Date().toISOString().slice(0, 10);
    payablePayload.endDate = process.env.PAYABLE_RECURRING_END_DATE || 'FOREVER';
    payablePayload.isRetry = process.env.PAYABLE_IS_RETRY || '1';
    payablePayload.retryAttempts = process.env.PAYABLE_RETRY_ATTEMPTS || '3';
  }

  let payableResponse;
  let authResponse;
  try {
    const auth = await getPayableAccessToken({ authUrl, businessKey, businessToken, originDomain });
    authResponse = auth.response;
    const res = await fetch(checkoutUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + auth.accessToken
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
        payableAuthResponse: authResponse,
        payableResponse,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return { statusCode: 502, headers: headers(), body: JSON.stringify({ ok: false, error: 'Payable checkout request failed.', status: res.status }) };
    }
  } catch (err) {
    await sessionRef.set({
      status: 'checkout_error',
      error: err && err.message ? err.message : 'Payable request failed',
      payableStatusCode: err && err.status ? err.status : null,
      payableResponse: err && err.response ? err.response : null,
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
