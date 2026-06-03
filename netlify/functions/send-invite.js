const nodemailer = require('nodemailer');

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, function (c) {
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

  const to = (data.to || '').trim();
  const name = (data.name || '').trim();
  const role = (data.role || 'team member').trim();
  const link = (data.link || '').trim();
  const biz = (data.biz || 'CLS CashFlow').trim();

  if (!to || !link) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing recipient email or invite link' }) };
  }

  // Credentials live in Netlify environment variables, never in the code.
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Email is not configured. Set SMTP_USER and SMTP_PASS in Netlify.' }) };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: true, // SSL on 465
    auth: { user: user, pass: pass }
  });

  const greetingName = name || 'there';
  const subject = "You're invited to join " + biz + ' on CLS CashFlow';

  const text =
    'Hi ' + greetingName + ',\n\n' +
    'You have been invited to join ' + biz + ' as a ' + role + ' on CLS CashFlow.\n\n' +
    'Open this link to create your account and accept access:\n' + link + '\n\n' +
    'Please sign up using this email address: ' + to + '\n\n' +
    'See you inside,\n' + biz;

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;background:#f5f0e8;padding:32px">' +
      '<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e3d9c4">' +
        '<div style="background:#1a1714;padding:22px 28px;color:#fff;font-size:20px;letter-spacing:.5px">' +
          esc(biz) + ' <span style="color:#c9a84c">&middot; CLS CashFlow</span>' +
        '</div>' +
        '<div style="padding:30px 28px;color:#1a1714;line-height:1.7;font-size:15px">' +
          '<p style="margin:0 0 14px">Hi ' + esc(greetingName) + ',</p>' +
          '<p style="margin:0 0 14px">You have been invited to join <strong>' + esc(biz) + '</strong> as a <strong>' + esc(role) + '</strong>.</p>' +
          '<p style="margin:0 0 22px">Click the button below to create your account and accept access. Please sign up using <strong>' + esc(to) + '</strong>.</p>' +
          '<p style="margin:0 0 26px;text-align:center">' +
            '<a href="' + esc(link) + '" style="background:#1a1714;color:#fff;text-decoration:none;padding:13px 26px;font-size:13px;letter-spacing:1px;text-transform:uppercase;display:inline-block">Accept Invite</a>' +
          '</p>' +
          '<p style="margin:0 0 6px;color:#6b6258;font-size:12px">If the button does not work, paste this link into your browser:</p>' +
          '<p style="margin:0;color:#6b6258;font-size:12px;word-break:break-all">' + esc(link) + '</p>' +
        '</div>' +
        '<div style="background:#f5f0e8;padding:14px 28px;color:#6b6258;font-size:11px">Sent by ' + esc(biz) + ' via CeylonryLabs.io</div>' +
      '</div>' +
    '</div>';

  try {
    await transporter.sendMail({
      from: '"' + biz + '" <' + user + '>',
      to: to,
      subject: subject,
      text: text,
      html: html
    });
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sent: true, to: to })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
