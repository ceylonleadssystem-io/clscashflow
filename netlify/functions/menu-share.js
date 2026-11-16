const {
  clean,
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument
} = require('../lib/appwrite');
const { generatePublicToken, isValidPublicToken } = require('../lib/invoice-share');
const { locationKey, sanitizeMenu } = require('../lib/menu-share');

// Signed-in staff publish a snapshot of the menu under one stable link per location, so the printed QR code never changes
// while the menu behind it does. The public page reads it through public-menu.js.

function response(statusCode, body) {
  return { statusCode, headers: headers({ 'Cache-Control': 'no-store' }), body: JSON.stringify(body) };
}

function publicBase(event) {
  const configured = clean(process.env.PUBLIC_SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL, 500);
  if (configured) return configured.replace(/\/$/, '');
  const host = clean(event.headers['x-forwarded-host'] || event.headers.host, 300);
  const proto = clean(event.headers['x-forwarded-proto'] || 'https', 20);
  return host ? proto + '://' + host : 'https://ceylonrylabs.io';
}

async function uniqueToken(existing) {
  if (isValidPublicToken(existing)) return existing;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const token = generatePublicToken();
    if (!await getDocument('publicMenus', token)) return token;
  }
  const error = new Error('Could not create the menu link. Please try again.');
  error.statusCode = 503;
  throw error;
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return response(200, { ok: true });
  if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'Method not allowed.' });

  try {
    const user = await getUserFromEvent(event);
    if (!user) return response(401, { ok: false, error: 'Please sign in again.' });
    const body = JSON.parse(event.body || '{}');
    const action = clean(body.action, 20);
    const profile = await getDocument('users', user.id);
    const ownerUid = clean(profile && profile.data && profile.data.ownerUid, 240) || user.id;
    const key = locationKey(body.locationId);
    const linkPath = 'users/' + ownerUid + '/menuLinks';
    const link = await getDocument(linkPath, key);
    const linked = link && link.data ? link.data : {};

    if (action === 'publish') {
      const token = await uniqueToken(clean(linked.token, 80));
      const now = new Date().toISOString();
      await upsertDocument('publicMenus', token, { ownerUid: ownerUid, locationKey: key, active: true, menu: sanitizeMenu(body.menu), updatedAt: now }, false);
      await upsertDocument(linkPath, key, { token: token, active: true, updatedAt: now }, false);
      return response(200, { ok: true, token: token, url: publicBase(event) + '/m/' + token });
    }
    if (action === 'disable') {
      if (isValidPublicToken(clean(linked.token, 80))) {
        const existing = await getDocument('publicMenus', linked.token);
        if (existing && existing.data && existing.data.ownerUid === ownerUid) {
          await upsertDocument('publicMenus', linked.token, { active: false }, true);
        }
        await upsertDocument(linkPath, key, { active: false }, true);
      }
      return response(200, { ok: true });
    }
    return response(400, { ok: false, error: 'Unknown action.' });
  } catch (error) {
    console.error('menu-share error', error);
    return response(error.statusCode || 500, { ok: false, error: error.statusCode ? error.message : 'Could not update the menu link.' });
  }
};
