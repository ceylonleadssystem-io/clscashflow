const fs = require('fs');
const path = require('path');

function clean(value) {
  return String(value == null ? '' : value).trim();
}

function parseServiceAccount(raw) {
  raw = clean(raw);
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
  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  let privateKey = clean(process.env.FIREBASE_PRIVATE_KEY);

  if (!privateKey && process.env.FIREBASE_PRIVATE_KEY_B64) {
    try {
      privateKey = Buffer.from(process.env.FIREBASE_PRIVATE_KEY_B64, 'base64').toString('utf8').trim();
    } catch (e) {
      privateKey = '';
    }
  }

  privateKey = privateKey.replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) return null;

  return {
    type: 'service_account',
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey
  };
}

const account = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT) || splitServiceAccount();
const outDir = path.join(process.cwd(), 'netlify', 'functions', '_secrets');
const outFile = path.join(outDir, 'firebase-service-account.json');

if (!account) {
  console.log('Firebase Admin secret file skipped: build environment variables are not complete.');
  process.exit(0);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(account), { mode: 0o600 });
console.log('Firebase Admin secret file prepared for Netlify Functions.');
