const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

function parseServiceAccount(raw) {
  if (!raw) return serviceAccountFromSplitEnv();
  try {
    return JSON.parse(raw);
  } catch (e) {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (err) {
      return serviceAccountFromSplitEnv();
    }
  }
}

function serviceAccountFromSplitEnv() {
  const fileAccount = serviceAccountFromSecretFile();
  if (fileAccount) return fileAccount;
  const projectId = String(process.env.FIREBASE_PROJECT_ID || '').trim();
  const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  let privateKey = String(process.env.FIREBASE_PRIVATE_KEY || '').trim();
  if (!privateKey && process.env.FIREBASE_PRIVATE_KEY_B64) {
    try {
      privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8').trim();
    } catch (e) {
      privateKey = '';
    }
  }
  privateKey = privateKey.replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;
  return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
}

function serviceAccountFromSecretFile() {
  try {
    return require('./_secrets/firebase-service-account.json');
  } catch (e) {
    return null;
  }
}

if (!admin.apps.length) {
  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT || '');
  if (serviceAccount) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp();
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let stripeEvent;
  try {
    const signature = event.headers['stripe-signature'];
    stripeEvent = stripe.webhooks.constructEvent(event.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return { statusCode: 400, body: 'Webhook signature verification failed: ' + err.message };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    if (session.payment_status === 'paid') {
      const uid = session.client_reference_id || (session.metadata && session.metadata.uid);
      const plan = (session.metadata && session.metadata.plan) || inferPlan(session.amount_total);
      if (uid) {
        await admin.firestore().collection('users').doc(uid).set({
          paid: true,
          plan: plan,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
          stripeCustomerId: session.customer || null,
          stripeSessionId: session.id || null
        }, { merge: true });
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};

function inferPlan(amountTotal) {
  if (amountTotal === 1550000) return 'premium';
  if (amountTotal === 1250000) return 'growth';
  return 'starter';
}
