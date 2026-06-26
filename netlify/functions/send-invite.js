const nodemailer = require('nodemailer');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Method not allowed' })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid request body' })
    };
  }

  const to = String(data.to || '').trim().toLowerCase();
  const inviteLink = String(data.inviteLink || '').trim();
  const bizName = String(data.bizName || 'CeylonryLabs CashFlow').trim();
  const ownerName = String(data.ownerName || '').trim();
  const role = String(data.role || 'team member').trim();
  const rawPlan = String(data.plan || 'solo').trim().toLowerCase();
  const planAliases = { starter: 'studio', growth: 'business', premium: 'business' };
  const plan = planAliases[rawPlan] || rawPlan;

  if (!to || !inviteLink) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Missing recipient email or invite link' })
    };
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Email not configured. Set SMTP_USER and SMTP_PASS in Netlify.' })
    };
  }

  const fromAddr = process.env.SMTP_FROM || user;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user, pass }
  });

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const planLabels = { solo: 'Solo', studio: 'Studio', business: 'Business' };
  const planLabel = planLabels[plan] || 'Solo';
  const subject = 'You have been invited to ' + bizName + ' on CLS CashFlow';

  const text =
    'Hi,\n\n' +
    (ownerName ? ownerName + ' has invited you' : 'You have been invited') +
    ' to join ' + bizName + ' on CLS CashFlow.\n\n' +
    'Role: ' + roleLabel + '\n' +
    'Plan: ' + planLabel + '\n\n' +
    'Create your access here:\n' + inviteLink + '\n\n' +
    'You can create a password or continue with Google using the invited email address.\n\n' +
    'CeylonryLabs.io';

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;background:#F5F0E8;padding:32px">' +
      '<div style="max-width:580px;margin:0 auto;background:#fff;border:1px solid #E3D9C4">' +
        '<div style="background:#1a1714;padding:24px 32px;color:#fff">' +
          '<div style="font-size:22px;font-weight:300;letter-spacing:.5px">Ceylonry<span style="color:#C9A84C">Labs</span>.io</div>' +
          '<div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.45);margin-top:4px">CashFlow Team Access</div>' +
        '</div>' +
        '<div style="padding:32px;color:#1a1714;font-size:15px;line-height:1.7">' +
          '<p style="margin:0 0 10px">Hi,</p>' +
          '<p style="margin:0 0 20px;color:#6B6258">' +
            (ownerName ? '<strong>' + esc(ownerName) + '</strong> has invited you' : 'You have been invited') +
            ' to join <strong>' + esc(bizName) + '</strong> on CLS CashFlow.</p>' +
          '<div style="background:#FAF7F2;border:1px solid #E3D9C4;border-left:3px solid #B8922A;padding:20px 24px;margin-bottom:24px">' +
            '<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B8922A;font-weight:600;margin-bottom:12px">Your Access</div>' +
            '<table style="width:100%;border-collapse:collapse;font-size:14px">' +
              '<tr><td style="padding:6px 0;color:#6B6258;width:80px">Email</td><td style="padding:6px 0;font-weight:600;color:#1a1714">' + esc(to) + '</td></tr>' +
              '<tr><td style="padding:6px 0;color:#6B6258">Role</td><td style="padding:6px 0;font-weight:600;color:#1a1714">' + esc(roleLabel) + '</td></tr>' +
              '<tr><td style="padding:6px 0;color:#6B6258">Plan</td><td style="padding:6px 0;color:#1a1714">' + esc(planLabel) + '</td></tr>' +
            '</table>' +
          '</div>' +
          '<p style="text-align:center;margin:0 0 24px">' +
            '<a href="' + esc(inviteLink) + '" style="display:inline-block;background:#1a1714;color:#fff;text-decoration:none;padding:14px 30px;font-size:13px;letter-spacing:1.4px;text-transform:uppercase;font-weight:600">Create Your Access</a>' +
          '</p>' +
          '<p style="margin:0;color:#6B6258;font-size:13px">Use the invited email address. You can create a password or continue with Google.</p>' +
        '</div>' +
        '<div style="background:#F5F0E8;padding:16px 32px;color:#A8A29A;font-size:11px;text-align:center">Sent by CeylonryLabs.io</div>' +
      '</div>' +
    '</div>';

  try {
    await transporter.sendMail({
      from: '"CeylonryLabs.io" <' + fromAddr + '>',
      to,
      replyTo: fromAddr,
      subject,
      text,
      html
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, sent: true, to })
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err && err.message ? err.message : 'Email server rejected the message' })
    };
  }
};
