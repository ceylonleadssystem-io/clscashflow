const nodemailer = require('nodemailer');

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const to      = (data.to || '').trim();
  const name    = (data.name || '').trim();
  const rawPlan = (data.plan || 'solo').trim().toLowerCase();
  const planAliases = { starter: 'studio', growth: 'business', premium: 'business' };
  const plan    = planAliases[rawPlan] || rawPlan;
  const biz     = (data.biz || 'CLS CashFlow').trim();
  const trialStart = (data.trialStart || '').trim();
  const trialEnd = (data.trialEnd || '').trim();
  const acceptance = data.acceptance && typeof data.acceptance === 'object' ? data.acceptance : {};
  const acceptedName = String(acceptance.fullNameAtAcceptance || name || '').trim();
  const termsVersion = String(acceptance.termsVersion || '').trim();
  const acceptedAt = String(acceptance.acceptedAt || '').trim();
  const forwardedFor = event.headers && (event.headers['x-forwarded-for'] || event.headers['X-Forwarded-For']);
  const onboardingIp = String(forwardedFor || (event.headers && event.headers['client-ip']) || '').split(',')[0].trim();

  if (!to) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing recipient email' }) };
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Email not configured. Set SMTP_USER and SMTP_PASS in Netlify.' }) };
  }

  const port = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
    auth: { user, pass }
  });

  const planLabels = { solo: 'Solo', studio: 'Studio', business: 'Business' };
  const monthlyPrices = { solo: '3,500', studio: '5,500', business: '8,500' };
  const planLabel  = planLabels[plan] || planLabels.solo;
  const monthlyPrice = monthlyPrices[plan] || monthlyPrices.solo;
  const siteUrl = String(process.env.PUBLIC_SITE_URL || 'https://ceylonrylabs.io').replace(/\/$/, '');
  const loginUrl = siteUrl + '/signin.html';

  const trialEndFmt = trialEnd
    ? new Date(trialEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '15 days from today';

  const greetingName = name || 'there';
  const subject = 'Welcome to CLS CashFlow — your account is ready';

  const text =
    'Hi ' + greetingName + ',\n\n' +
    'Your CLS CashFlow account has been created successfully.\n\n' +
    '--- YOUR LOGIN DETAILS ---\n' +
    'Email:  ' + to + '\n' +
    'Login:  ' + loginUrl + '\n\n' +
    '--- YOUR PLAN ---\n' +
    planLabel + ' Plan\n' +
    'Monthly prepaid price: LKR ' + monthlyPrice + '/mo\n' +
    '15-day free trial — no payment required until: ' + trialEndFmt + '\n\n' +
    'Terms accepted by: ' + acceptedName + '\n' +
    'Terms version: ' + termsVersion + '\n\n' +
    'After your trial ends, transfer the monthly payment to our bank account and upload the payment slip to continue using the system.\n\n' +
    'If you have any questions, reply to this email or contact us on WhatsApp.\n\n' +
    'See you inside,\nThe CeylonryLabs Team';

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;background:#F5F0E8;padding:32px">' +
      '<div style="max-width:580px;margin:0 auto;background:#fff;border:1px solid #E3D9C4">' +

        // Header
        '<div style="background:#1a1714;padding:24px 32px;color:#fff">' +
          '<div style="font-size:22px;font-weight:300;letter-spacing:.5px">Ceylonry<span style="color:#C9A84C">Labs</span>.io</div>' +
          '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-top:4px">CashFlow System</div>' +
        '</div>' +

        // Body
        '<div style="padding:32px;color:#1a1714;font-size:15px;line-height:1.7">' +
          '<p style="margin:0 0 10px">Hi <strong>' + esc(greetingName) + '</strong>,</p>' +
          '<p style="margin:0 0 20px;color:#6B6258">Welcome aboard! Your CLS CashFlow account is ready. Here are your login details — save this email.</p>' +

          // Login box
          '<div style="background:#FAF7F2;border:1px solid #E3D9C4;border-left:3px solid #1a1714;padding:20px 24px;margin-bottom:24px">' +
            '<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B8922A;font-weight:600;margin-bottom:12px">Your Login Details</div>' +
            '<table style="width:100%;border-collapse:collapse;font-size:14px">' +
              '<tr><td style="padding:6px 0;color:#6B6258;width:80px">Email</td><td style="padding:6px 0;font-weight:600;color:#1a1714">' + esc(to) + '</td></tr>' +
              '<tr><td style="padding:6px 0;color:#6B6258">Password</td><td style="padding:6px 0;color:#6B6258;font-style:italic">The password you set during signup</td></tr>' +
            '</table>' +
          '</div>' +

          // Trial box
          '<div style="background:#FAF7F2;border:1px solid #E3D9C4;border-left:3px solid #B8922A;padding:20px 24px;margin-bottom:24px">' +
            '<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B8922A;font-weight:600;margin-bottom:12px">Your Plan & Trial</div>' +
            '<p style="margin:0 0 8px;font-size:14px"><strong>' + esc(planLabel) + ' Plan</strong></p>' +
            '<p style="margin:0 0 10px;font-size:13px;color:#6B6258">' +
              'Monthly prepaid price: <strong style="color:#1a1714">LKR ' + esc(monthlyPrice) + '/mo</strong>' +
            '</p>' +
            '<p style="margin:0;font-size:13px;color:#6B6258">✓ 15-day free trial · No payment required now<br>✓ Trial ends: <strong style="color:#1a1714">' + esc(trialEndFmt) + '</strong></p>' +
            '<p style="margin:10px 0 0;font-size:12px;color:#6B6258">Accepted by: <strong style="color:#1a1714">' + esc(acceptedName) + '</strong><br>Terms version: ' + esc(termsVersion) + '</p>' +
          '</div>' +

          // CTA button
          '<p style="text-align:center;margin:0 0 28px">' +
            '<a href="' + esc(loginUrl) + '" style="display:inline-block;background:#1a1714;color:#fff;text-decoration:none;padding:14px 32px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600">Sign In to Your Dashboard →</a>' +
          '</p>' +

          // What happens next
          '<div style="font-size:13px;color:#6B6258;border-top:1px solid #E3D9C4;padding-top:20px">' +
            '<strong style="color:#1a1714;display:block;margin-bottom:8px">What happens after your trial?</strong>' +
            'When your 15-day trial ends, the system will show our bank details. Transfer the monthly amount and upload the payment slip to continue. Your data stays safely stored.' +
          '</div>' +
        '</div>' +

        // Footer
        '<div style="background:#F5F0E8;padding:16px 32px;color:#A8A29A;font-size:11px;text-align:center">' +
          'Sent by CeylonryLabs.io · If you did not create this account, please ignore this email.' +
        '</div>' +

      '</div>' +
    '</div>';

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || ('"CeylonryLabs.io" <' + user + '>'),
      replyTo: process.env.SMTP_REPLY_TO || user,
      to,
      subject,
      text,
      html
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || ('"Cashflow Onboarding" <' + user + '>'),
      replyTo: to,
      to: 'hello@ceylonrylabs.io',
      subject: 'New Cashflow client onboarded · ' + planLabel + ' · ' + (biz || acceptedName),
      text: [
        'A new Cashflow System client completed onboarding.',
        'Accepted by: ' + acceptedName,
        'Customer email: ' + to,
        'Business: ' + biz,
        'Plan: ' + planLabel,
        'Monthly price: LKR ' + monthlyPrice,
        'Trial start: ' + trialStart,
        'Trial end: ' + trialEnd,
        'Accepted at: ' + acceptedAt,
        'Terms version: ' + termsVersion,
        'Onboarding IP: ' + onboardingIp,
        'Acceptance ID: ' + String(acceptance.acceptanceId || '')
      ].join('\n'),
      html: '<div style="font-family:Arial,sans-serif"><h2>New Cashflow client onboarded</h2><p><b>Accepted by:</b> '+esc(acceptedName)+'</p><p><b>Customer email:</b> '+esc(to)+'</p><p><b>Business:</b> '+esc(biz)+'</p><p><b>Plan:</b> '+esc(planLabel)+'</p><p><b>Monthly price:</b> LKR '+esc(monthlyPrice)+'</p><p><b>Trial start:</b> '+esc(trialStart)+'</p><p><b>Trial end:</b> '+esc(trialEnd)+'</p><p><b>Accepted at:</b> '+esc(acceptedAt)+'</p><p><b>Terms version:</b> '+esc(termsVersion)+'</p><p><b>Onboarding IP:</b> '+esc(onboardingIp)+'</p><p><b>Acceptance ID:</b> '+esc(acceptance.acceptanceId||'')+'</p></div>'
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent: true, adminNotified: true, to })
    };
  } catch (err) {
    console.error('send-welcome error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
