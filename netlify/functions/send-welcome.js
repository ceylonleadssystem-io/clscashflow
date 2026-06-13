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
  const plan    = (data.plan || 'starter').trim();
  const biz     = (data.biz || 'CLS CashFlow').trim();
  const trialEnd = (data.trialEnd || '').trim();

  if (!to) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing recipient email' }) };
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Email not configured. Set SMTP_USER and SMTP_PASS in Netlify.' }) };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user, pass }
  });

  const planLabels = { starter: 'Starter', growth: 'Growth', premium: 'Premium' };
  const planPrices = { starter: '5,500', growth: '12,500', premium: '18,500' };
  const planLabel  = planLabels[plan] || plan;
  const planPrice  = planPrices[plan] || '5,500';
  const loginUrl   = 'https://ceylonrylabscashflow.netlify.app/signin.html';

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
    planLabel + ' Plan (LKR ' + planPrice + '/month)\n' +
    '15-day free trial — no payment required until: ' + trialEndFmt + '\n\n' +
    'After your trial ends, you will be prompted to enter your payment details to continue using the system.\n\n' +
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
            '<p style="margin:0 0 8px;font-size:14px"><strong>' + esc(planLabel) + ' Plan</strong> — LKR ' + esc(planPrice) + '/month</p>' +
            '<p style="margin:0;font-size:13px;color:#6B6258">✓ 15-day free trial · No payment required now<br>✓ Trial ends: <strong style="color:#1a1714">' + esc(trialEndFmt) + '</strong></p>' +
          '</div>' +

          // CTA button
          '<p style="text-align:center;margin:0 0 28px">' +
            '<a href="' + esc(loginUrl) + '" style="display:inline-block;background:#1a1714;color:#fff;text-decoration:none;padding:14px 32px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600">Sign In to Your Dashboard →</a>' +
          '</p>' +

          // What happens next
          '<div style="font-size:13px;color:#6B6258;border-top:1px solid #E3D9C4;padding-top:20px">' +
            '<strong style="color:#1a1714;display:block;margin-bottom:8px">What happens after your trial?</strong>' +
            'When your 15-day trial ends, you\'ll be prompted to enter payment details to continue. Your data is safely stored and will be waiting for you.' +
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
      from: '"CeylonryLabs.io" <' + user + '>',
      to,
      subject,
      text,
      html
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent: true, to })
    };
  } catch (err) {
    console.error('send-welcome error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
