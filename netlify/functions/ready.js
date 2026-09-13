'use strict';

const { getUserFromEvent, service } = require('../lib/supabase');

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
    supabaseUrl: !!process.env.SUPABASE_URL,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    smtp: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
    stripe: !!process.env.STRIPE_SECRET_KEY
  };
  try {
    const result = await service().from('app_documents').select('id', { head: true, count: 'exact' }).limit(1);
    checks.database = !result.error;
  } catch (error) {
    checks.database = false;
  }
  const ok = checks.supabaseUrl && checks.serviceRole && checks.database;
  return response(ok ? 200 : 503, { ok, checks, time: new Date().toISOString() });
};
