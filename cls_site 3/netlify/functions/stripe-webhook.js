const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
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
