const { firebaseAdminFacade } = require('../lib/supabase');

function headers() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
}

function clean(value, max) {
  value = String(value == null ? '' : value).trim();
  return max && value.length > max ? value.slice(0, max) : value;
}

function dashboardFor(plan) {
  plan = String(plan || '').toLowerCase();
  if (plan === 'business' || plan === 'growth' || plan === 'premium') return 'growth.html';
  if (plan === 'studio' || plan === 'starter') return 'starter.html';
  return 'solo.html';
}

async function getAdmin() {
  try {
    return firebaseAdminFacade();
  } catch (e) {
    return null;
  }
}

async function verifyUser(event, admin) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const match = String(authHeader).match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch (e) {
    return null;
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: headers(), body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  const admin = await getAdmin();
  if (!admin) {
    return { statusCode: 500, headers: headers(), body: JSON.stringify({ ok: false, error: 'Supabase service role is not configured.' }) };
  }

  const user = await verifyUser(event, admin);
  if (!user) {
    return { statusCode: 401, headers: headers(), body: JSON.stringify({ ok: false, error: 'Please sign in again.' }) };
  }

  const sessionId = clean((event.queryStringParameters && (event.queryStringParameters.session || event.queryStringParameters.id)) || '', 180);
  if (!sessionId) {
    return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Missing payment session.' }) };
  }

  try {
    const db = admin.firestore();
    const snap = await db.collection('payablePayments').doc(sessionId).get();
    if (!snap.exists) {
      return { statusCode: 404, headers: headers(), body: JSON.stringify({ ok: false, error: 'Payment session was not found yet.' }) };
    }
    const payment = snap.data() || {};
    if (payment.uid && payment.uid !== user.uid) {
      return { statusCode: 403, headers: headers(), body: JSON.stringify({ ok: false, error: 'Payment session belongs to another account.' }) };
    }

    const profileSnap = await db.collection('users').doc(user.uid).get();
    const profile = profileSnap.exists ? (profileSnap.data() || {}) : {};
    const status = clean(payment.status || '', 80).toLowerCase();
    const paid = status === 'paid' || profile.paid === true || String(profile.subscriptionStatus || '').toLowerCase() === 'active';
    const plan = clean(payment.plan || profile.currentPlan || profile.plan || 'solo', 40).toLowerCase();

    return {
      statusCode: 200,
      headers: headers(),
      body: JSON.stringify({
        ok: true,
        sessionId,
        paid,
        status: status || 'pending',
        plan,
        planName: payment.planName || profile.planName || '',
        amount: payment.amount || profile.planPrice || 0,
        currency: payment.currency || 'LKR',
        billingCycle: payment.billingCycle || profile.billingCycle || 'annual',
        subscriptionCurrentPeriodEnd: profile.subscriptionCurrentPeriodEnd || '',
        dashboard: dashboardFor(plan)
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: headers(),
      body: JSON.stringify({ ok: false, error: err && err.message ? err.message : 'Could not read payment status.' })
    };
  }
};
