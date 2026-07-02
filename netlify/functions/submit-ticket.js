const nodemailer = require('nodemailer');

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

function headers() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
}

function clean(s, max) {
  s = String(s == null ? '' : s).trim();
  if (max && s.length > max) return s.slice(0, max);
  return s;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

async function getAdmin() {
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    return null;
  }

  if (!admin.apps.length) {
    const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT || '');
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

  const data = {
    name: clean(body.name, 160),
    email: clean(body.email, 180).toLowerCase(),
    type: clean(body.type, 80) || 'Question',
    priority: clean(body.priority, 50) || 'Normal',
    message: clean(body.message, 5000),
    page: clean(body.page, 800),
    uid: clean(body.uid, 120),
    displayName: clean(body.displayName, 180),
    timezone: clean(body.timezone, 120),
    utcAt: clean(body.utcAt, 80) || new Date().toISOString()
  };

  if (!data.email || !data.message) {
    return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Email and message are required.' }) };
  }

  const admin = await getAdmin();
  let storage = { stored: false };
  if (admin) {
    try {
      const doc = await admin.firestore().collection('supportTickets').add({
        ...data,
        status: 'open',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      storage = { stored: true, id: doc.id };
    } catch (err) {
      storage = { stored: false, reason: err && err.message ? err.message : 'Firestore write failed' };
    }
  } else {
    storage = { stored: false, reason: 'Firebase admin not configured' };
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.SUPPORT_TO || process.env.BUSINESS_OWNER_EMAIL || 'hello@ceylonrylabs.io';
  if (!user || !pass) {
    return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, emailed: false, storage }) };
  }

  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: smtpPort,
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE !== 'false' : smtpPort === 465,
    auth: { user, pass }
  });

  const rows = [
    ['Name', data.name],
    ['Email', data.email],
    ['Type', data.type],
    ['Priority', data.priority],
    ['Page', data.page],
    ['UID', data.uid],
    ['Timezone', data.timezone],
    ['UTC time', data.utcAt],
    ['Ticket ID', storage.id || storage.reason || 'Not stored']
  ].map(function(row) {
    return '<tr><td style="width:150px;padding:7px 0;color:#6F6353">' + esc(row[0]) + '</td><td style="padding:7px 0;color:#4A3B2A;font-weight:600">' + esc(row[1]) + '</td></tr>';
  }).join('');

  try {
    await transporter.sendMail({
      from: '"Cashflow Support" <' + (process.env.SMTP_FROM || user) + '>',
      to,
      replyTo: data.email,
      subject: 'New Cashflow Support Ticket - ' + data.type,
      text:
        'New support ticket\n\n' +
        'Name: ' + data.name + '\n' +
        'Email: ' + data.email + '\n' +
        'Type: ' + data.type + '\n' +
        'Priority: ' + data.priority + '\n' +
        'Page: ' + data.page + '\n' +
        'Message:\n' + data.message + '\n\n' +
        'Ticket: ' + (storage.id || storage.reason || 'Not stored'),
      html:
        '<div style="font-family:Arial,Helvetica,sans-serif;background:#F7F1E8;padding:28px">' +
          '<div style="max-width:680px;margin:0 auto;background:#FDFAF4;border:1px solid #e4d8c8;padding:28px">' +
            '<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#B8923E;font-weight:700">Cashflow System</div>' +
            '<h1 style="font-family:Georgia,serif;color:#4A3B2A;margin:10px 0 18px">New Support Ticket</h1>' +
            '<table style="width:100%;border-collapse:collapse;border-top:1px solid #eadfce;border-bottom:1px solid #eadfce">' + rows + '</table>' +
            '<h2 style="font-family:Georgia,serif;color:#4A3B2A;margin:24px 0 10px">Message</h2>' +
            '<div style="white-space:pre-wrap;background:#fff;border:1px solid #eadfce;padding:18px;color:#4A3B2A">' + esc(data.message) + '</div>' +
          '</div>' +
        '</div>'
    });
    return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, emailed: true, storage }) };
  } catch (err) {
    return { statusCode: 502, headers: headers(), body: JSON.stringify({ ok: false, error: err && err.message ? err.message : 'Email failed', storage }) };
  }
};
