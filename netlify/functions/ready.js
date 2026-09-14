'use strict';

const { getUserFromEvent, databases, DATABASE_ID, COLLECTION_ID } = require('../lib/appwrite');

function response(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'GET') return response(405, { ok: false, error: 'Method not allowed.' });
  const user = await getUserFromEvent(event).catch(function() { return null; });
  if (!user) return response(401, { ok: false, error: 'Authentication required.' });
  const adminEmail = String(process.env.ADMIN_EMAIL || 'devteam@ceylonrylabs.io').toLowerCase();
  if (String(user.email || '').toLowerCase() !== adminEmail) return response(403, { ok: false, error: 'Not allowed.' });

  const checks = {
    appwriteEndpoint: !!process.env.APPWRITE_ENDPOINT,
    apiKey: !!process.env.APPWRITE_API_KEY,
    smtp: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    stripe: !!process.env.STRIPE_SECRET_KEY
  };
  try {
    await databases().listDocuments(DATABASE_ID, COLLECTION_ID, []);
    checks.database = true;
  } catch (error) {
    checks.database = false;
  }
  const ok = checks.appwriteEndpoint && checks.apiKey && checks.database;
  return response(ok ? 200 : 503, { ok, checks, time: new Date().toISOString() });
};
