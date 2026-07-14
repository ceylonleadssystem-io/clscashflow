const nodemailer = require('nodemailer');

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const ALLOWED_TOPICS = new Set([
  'Product question',
  'Plans and pricing',
  'Technical support',
  'Partnership',
  'Other'
]);

function response(statusCode, body) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(body)
  };
}

function clean(value, maxLength) {
  return String(value == null ? '' : value).trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>\"]/g, function(character) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[character];
  });
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'Method not allowed' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (error) {
    return response(400, { ok: false, error: 'Invalid request body' });
  }

  // Quietly accept automated submissions that fill the hidden field.
  if (clean(body.website, 200)) return response(200, { ok: true });

  const data = {
    fullName: clean(body.fullName, 100),
    email: clean(body.email, 160).toLowerCase(),
    businessName: clean(body.businessName, 120),
    topic: clean(body.topic, 80),
    message: clean(body.message, 4000)
  };

  if (!data.fullName || !data.email || !data.topic || !data.message) {
    return response(400, { ok: false, error: 'Please complete all required fields.' });
  }
  if (!validEmail(data.email)) {
    return response(400, { ok: false, error: 'Please enter a valid email address.' });
  }
  if (!ALLOWED_TOPICS.has(data.topic)) {
    return response(400, { ok: false, error: 'Please choose a valid contact topic.' });
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    return response(500, {
      ok: false,
      error: 'Contact email is not configured yet. Please email hello@ceylonrylabs.io directly.'
    });
  }

  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE !== 'false'
    : smtpPort === 465;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: smtpPort,
    secure: smtpSecure,
    auth: { user, pass }
  });

  const businessLine = data.businessName ? data.businessName : 'Not provided';
  const subject = 'Website contact - ' + data.topic;
  const text = [
    'A new message was submitted through the Cashflow System website.',
    '',
    'Name: ' + data.fullName,
    'Email: ' + data.email,
    'Business: ' + businessLine,
    'Topic: ' + data.topic,
    '',
    'Message:',
    data.message
  ].join('\n');
  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;background:#f3eadf;padding:32px">' +
      '<div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #ded3c8">' +
        '<div style="padding:28px 32px;border-bottom:1px solid #ded3c8">' +
          '<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a47917;font-weight:700">Cashflow System</div>' +
          '<h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.1;color:#2a1c13;margin:10px 0 0">New website contact</h1>' +
        '</div>' +
        '<div style="padding:28px 32px;color:#3b2b20;font-size:15px;line-height:1.7">' +
          '<p style="margin:0 0 6px"><strong>Name:</strong> ' + escapeHtml(data.fullName) + '</p>' +
          '<p style="margin:0 0 6px"><strong>Email:</strong> ' + escapeHtml(data.email) + '</p>' +
          '<p style="margin:0 0 6px"><strong>Business:</strong> ' + escapeHtml(businessLine) + '</p>' +
          '<p style="margin:0 0 20px"><strong>Topic:</strong> ' + escapeHtml(data.topic) + '</p>' +
          '<div style="white-space:pre-wrap;background:#fffcf7;border:1px solid #ded3c8;padding:18px">' + escapeHtml(data.message) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  try {
    await transporter.sendMail({
      from: '"Cashflow System Website" <' + (process.env.SMTP_FROM || user) + '>',
      to: 'hello@ceylonrylabs.io',
      replyTo: data.email,
      subject,
      text,
      html
    });
    return response(200, { ok: true, sent: true });
  } catch (error) {
    console.error('Contact email failed:', error);
    return response(502, {
      ok: false,
      error: 'Your message could not be sent. Please email hello@ceylonrylabs.io directly.'
    });
  }
};
