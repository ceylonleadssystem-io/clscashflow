const nodemailer = require('nodemailer');
const { firebaseAdminFacade } = require('../lib/supabase');

function clean(value, max = 300) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

function esc(value) {
  return clean(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function reply(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Method not allowed' });
  const token = clean((event.headers.authorization || '').replace(/^Bearer\s+/i, ''), 5000);
  if (!token) return reply(401, { error: 'POS sign-in is required' });

  try {
    const admin = firebaseAdminFacade();
    const identity = await admin.auth().verifyIdToken(token);
    const ref = admin.firestore().collection('users').doc(identity.uid);
    const snapshot = await ref.get();
    const profile = snapshot.exists ? snapshot.data() || {} : {};
    if (!profile.posEnabled && profile.plan !== 'pos') return reply(403, { error: 'POS account required' });
    if (profile.posWelcomeEmailSentAt) return reply(200, { sent: false, alreadySent: true });

    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { return reply(400, { error: 'Invalid request' }); }
    const email = clean(identity.email || profile.email || body.email).toLowerCase();
    const name = clean(profile.name || body.name || 'there');
    const business = clean(profile.posBusinessName || profile.bizName || body.business || 'Your business');
    const mobile = clean(profile.posMobile || profile.mobile || profile.phone || body.mobile || 'Not provided', 40);
    if (!email) return reply(400, { error: 'Customer email is missing' });

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!user || !pass) return reply(500, { error: 'Email service is not configured' });
    const port = Number(process.env.SMTP_PORT || 465);
    const mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port,
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
      auth: { user, pass }
    });
    const site = String(process.env.PUBLIC_SITE_URL || 'https://ceylonrylabs.io').replace(/\/$/, '');
    const from = process.env.POS_SMTP_FROM || '"Pasan Yasas · Ceylonry Labs" <pasan@ceylonrylabs.io>';

    await mailer.sendMail({
      from,
      replyTo: 'pasan@ceylonrylabs.io',
      to: email,
      subject: 'Welcome to Ceylonry POS — we are ready to help',
      text: `Hi ${name},\n\nWelcome to Ceylonry POS. Your account for ${business} is ready.\n\nOur team can help set up your categories, products and menu so you can start selling quickly.\n\nYou can email me anytime at pasan@ceylonrylabs.io. Your dedicated Customer Success Manager is Chathumi Herath, and you can reach her at chathumi@ceylonrylabs.io.\n\nOpen your POS: ${site}/pos-system/pos-system.html\n\nWarm regards,\nPasan Yasas\nDirector, Ceylonry Labs`,
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#171512"><div style="border-top:6px solid #ff5a00;padding:28px"><h1 style="margin:0 0 18px">Welcome to Ceylonry POS</h1><p>Hi <strong>${esc(name)}</strong>,</p><p>Your POS account for <strong>${esc(business)}</strong> is ready. Our team can help set up your categories, products and menu so you can start selling quickly.</p><p>You can email me anytime at <a href="mailto:pasan@ceylonrylabs.io">pasan@ceylonrylabs.io</a>. Your dedicated Customer Success Manager is <strong>Chathumi Herath</strong> — reach her at <a href="mailto:chathumi@ceylonrylabs.io">chathumi@ceylonrylabs.io</a>.</p><p style="margin:26px 0"><a href="${esc(site)}/pos-system/pos-system.html" style="background:#ff5a00;color:white;text-decoration:none;padding:13px 20px;border-radius:7px;font-weight:bold">Open Ceylonry POS</a></p><p>Warm regards,<br><strong>Pasan Yasas</strong><br>Director, Ceylonry Labs</p></div></div>`
    });

    await mailer.sendMail({
      from: process.env.POS_INTERNAL_SMTP_FROM || '"Ceylonry POS Onboarding" <hello@ceylonrylabs.io>',
      replyTo: email,
      to: 'hello@ceylonrylabs.io',
      subject: `New POS client onboarded · ${business}`,
      text: `A new Ceylonry POS client has onboarded.\n\nBusiness: ${business}\nCustomer: ${name}\nEmail: ${email}\nMobile: ${mobile}\nUser ID: ${identity.uid}`,
      html: `<div style="font-family:Arial,sans-serif"><h2>New POS client onboarded</h2><p><b>Business:</b> ${esc(business)}</p><p><b>Customer:</b> ${esc(name)}</p><p><b>Email:</b> ${esc(email)}</p><p><b>Mobile:</b> ${esc(mobile)}</p><p><b>User ID:</b> ${esc(identity.uid)}</p></div>`
    });

    await ref.set({ posWelcomeEmailSentAt: new Date().toISOString(), posOnboardingNotifiedAt: new Date().toISOString(), posMobile: mobile === 'Not provided' ? '' : mobile }, { merge: true });
    return reply(200, { sent: true });
  } catch (error) {
    console.error('pos-onboarding-email:', error);
    return reply(error.statusCode || 500, { error: error.message || 'Could not send onboarding email' });
  }
};
