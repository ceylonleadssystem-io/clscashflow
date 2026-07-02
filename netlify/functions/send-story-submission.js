const nodemailer = require('nodemailer');

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function clean(s) {
  return String(s == null ? '' : s).trim();
}

function parseServiceAccount(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch (err) {
      return null;
    }
  }
}

function splitServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID || '';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
  if (!projectId || !clientEmail || !privateKey) return null;
  return { type: 'service_account', project_id: projectId, client_email: clientEmail, private_key: privateKey, projectId, clientEmail, privateKey };
}

function normalizePrivateKey(value) {
  let key = String(value || '').trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, '\n').trim();
  if (!key) return '';
  if (key.includes('-----BEGIN PRIVATE KEY-----') && key.includes('-----END PRIVATE KEY-----')) {
    const body = key
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '');
    const wrapped = body.match(/.{1,64}/g) || [];
    return '-----BEGIN PRIVATE KEY-----\n' + wrapped.join('\n') + '\n-----END PRIVATE KEY-----\n';
  }
  return key;
}

async function storeSubmission(data) {
  const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT || '') || splitServiceAccount();
  if (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { stored: false, reason: 'Firebase admin credentials not configured' };
  }

  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    return { stored: false, reason: 'firebase-admin package not installed' };
  }

  try {
    if (!admin.apps.length) {
      if (serviceAccount) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } else {
        admin.initializeApp();
      }
    }
    const doc = await admin.firestore().collection('businessStorySubmissions').add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      source: 'mrs-gamage-story'
    });
    return { stored: true, id: doc.id };
  } catch (e) {
    return { stored: false, reason: e && e.message ? e.message : 'Firestore write failed' };
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Method not allowed' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Invalid request body' })
    };
  }

  const data = {
    fullName: clean(body.fullName),
    businessName: clean(body.businessName),
    email: clean(body.email).toLowerCase(),
    whatsapp: clean(body.whatsapp),
    location: clean(body.location),
    founderType: clean(body.founderType),
    businessType: clean(body.businessType),
    businessDuration: clean(body.businessDuration),
    biggestChallenge: clean(body.biggestChallenge),
    story: clean(body.story),
    fundingInterest: clean(body.fundingInterest),
    fundingRequirement: clean(body.fundingRequirement),
    consent: body.consent === true || body.consent === 'true',
    submittedAt: new Date().toISOString()
  };

  if (!data.fullName || !data.businessName || !data.email || !data.whatsapp || !data.story || !data.consent) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Please complete the required fields and consent checkbox.' })
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

  const storeResult = await storeSubmission(data);
  const to = process.env.STORY_SUBMISSION_TO || process.env.BUSINESS_OWNER_EMAIL || 'hello@ceylonrylabs.io';
  const fromAddr = process.env.SMTP_FROM || user;
  const smtpPort = Number(process.env.SMTP_PORT || 465);
  const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE !== 'false' : smtpPort === 465;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: smtpPort,
    secure: smtpSecure,
    auth: { user, pass }
  });

  const subject = 'New Business Story Submission - Cashflow System';
  const text =
    'A new business story has been submitted.\n\n' +
    'Full Name: ' + data.fullName + '\n' +
    'Business Name: ' + data.businessName + '\n' +
    'Email: ' + data.email + '\n' +
    'WhatsApp: ' + data.whatsapp + '\n' +
    'Location: ' + data.location + '\n' +
    'Founder Type: ' + data.founderType + '\n' +
    'Business Type: ' + data.businessType + '\n' +
    'Business Duration: ' + data.businessDuration + '\n' +
    'Biggest Challenge: ' + data.biggestChallenge + '\n' +
    'Funding Interest: ' + data.fundingInterest + '\n' +
    'Estimated Funding Requirement: ' + data.fundingRequirement + '\n' +
    'Story: ' + data.story + '\n' +
    'Consent Confirmed: ' + (data.consent ? 'Yes' : 'No') + '\n\n' +
    'Database Storage: ' + (storeResult.stored ? 'Stored: ' + storeResult.id : 'Not stored: ' + storeResult.reason);

  const rows = [
    ['Full Name', data.fullName],
    ['Business Name', data.businessName],
    ['Email', data.email],
    ['WhatsApp', data.whatsapp],
    ['Location', data.location],
    ['Founder Type', data.founderType],
    ['Business Type', data.businessType],
    ['Business Duration', data.businessDuration],
    ['Biggest Challenge', data.biggestChallenge],
    ['Funding Interest', data.fundingInterest],
    ['Estimated Funding Requirement', data.fundingRequirement],
    ['Consent Confirmed', data.consent ? 'Yes' : 'No'],
    ['Database Storage', storeResult.stored ? 'Stored: ' + storeResult.id : 'Not stored: ' + storeResult.reason]
  ].map(function(row) {
    return '<tr><td style="width:210px;padding:8px 0;color:#6F6353">' + esc(row[0]) + '</td><td style="padding:8px 0;color:#4A3B2A;font-weight:600">' + esc(row[1]) + '</td></tr>';
  }).join('');

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;background:#F7F1E8;padding:32px">' +
      '<div style="max-width:680px;margin:0 auto;background:#FDFAF4;border:1px solid #e4d8c8">' +
        '<div style="padding:28px 32px;border-bottom:1px solid #e4d8c8">' +
          '<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#B8923E;font-weight:700">Cashflow System</div>' +
          '<h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.1;color:#4A3B2A;margin:10px 0 0">New Business Story Submission</h1>' +
        '</div>' +
        '<div style="padding:28px 32px;color:#4A3B2A;font-size:15px;line-height:1.7">' +
          '<p style="margin:0 0 18px">A new business story has been submitted.</p>' +
          '<table style="width:100%;border-collapse:collapse;font-size:14px;border-top:1px solid #eadfce;border-bottom:1px solid #eadfce">' + rows + '</table>' +
          '<div style="margin-top:24px">' +
            '<div style="font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#B8923E;font-weight:700;margin-bottom:8px">Story</div>' +
            '<div style="white-space:pre-wrap;background:#fff;border:1px solid #eadfce;padding:18px;color:#4A3B2A">' + esc(data.story) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  try {
    await transporter.sendMail({
      from: '"Cashflow System" <' + fromAddr + '>',
      to,
      replyTo: data.email || fromAddr,
      subject,
      text,
      html
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true, sent: true, stored: storeResult.stored, storage: storeResult })
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: err && err.message ? err.message : 'Email server rejected the message', storage: storeResult })
    };
  }
};
