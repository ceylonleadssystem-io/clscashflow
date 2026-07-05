const crypto = require('crypto');
const {
  headers,
  getUserFromEvent,
  getDocument,
  upsertDocument,
  service,
  clean
} = require('../lib/supabase');

const OPERATIONAL_COLLECTIONS = [
  'transactions',
  'expenses',
  'invoices',
  'editBacklog',
  'editLog',
  'clients',
  'suppliers',
  'payables'
];

function response(statusCode, body) {
  return {
    statusCode,
    headers: headers({ 'Access-Control-Allow-Methods': 'POST, OPTIONS' }),
    body: JSON.stringify(body)
  };
}

function readBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (e) {
    return {};
  }
}

function nowIso() {
  return new Date().toISOString();
}

function feedbackId(action) {
  return action + '-' + Date.now() + '-' + crypto.randomUUID().slice(0, 8);
}

function normalizeAction(action) {
  action = String(action || '').trim();
  return action === 'resetData' || action === 'deleteAccount' ? action : '';
}

function requiredConfirmation(action) {
  return action === 'deleteAccount' ? 'DELETE ACCOUNT' : 'RESET DATA';
}

async function deletePath(path) {
  const { error } = await service()
    .from('app_documents')
    .delete()
    .eq('path', path);
  if (error) throw error;
}

async function deleteOperationalData(ownerUid) {
  for (const name of OPERATIONAL_COLLECTIONS) {
    await deletePath('users/' + ownerUid + '/' + name);
  }
}

async function deleteWorkspace(ownerUid, includeProfile) {
  const client = service();
  let out = await client
    .from('app_documents')
    .delete()
    .like('path', 'users/' + ownerUid + '/%');
  if (out.error) throw out.error;

  out = await client
    .from('app_documents')
    .delete()
    .eq('owner_uid', ownerUid);
  if (out.error) throw out.error;

  if (includeProfile) {
    out = await client
      .from('app_documents')
      .delete()
      .eq('path', 'users')
      .eq('id', ownerUid);
    if (out.error) throw out.error;
  }
}

async function saveFeedback(action, user, ownerUid, profile, body) {
  const stamp = nowIso();
  const data = {
    action,
    uid: user.id,
    ownerUid,
    email: clean(user.email || profile.email || '', 240).toLowerCase(),
    name: clean(profile.name || profile.username || user.email || '', 180),
    plan: clean(body.plan || profile.plan || profile.currentPlan || '', 60),
    reasonCategory: clean(body.reasonCategory, 160),
    reasonDetails: clean(body.reasonDetails, 3000),
    improvementRequest: clean(body.improvementRequest, 2000),
    page: clean(body.page, 500),
    userAgent: clean(body.userAgent, 500),
    createdAtUtc: stamp
  };
  const { error } = await service()
    .from('app_documents')
    .insert({
      path: 'accountDangerFeedback',
      id: feedbackId(action),
      data,
      owner_uid: null,
      email: data.email || null,
      created_at: stamp,
      updated_at: stamp
    });
  if (error) throw error;
}

async function resetData(ownerUid, user) {
  await deleteOperationalData(ownerUid);
  const version = Date.now();
  const snap = await getDocument('users', ownerUid);
  const profile = snap && snap.data ? snap.data : {};
  const settings = Object.assign({}, profile.settings || {});
  settings.dataVersion = version;
  settings.growthDataVersion = version;
  await upsertDocument('users', ownerUid, {
    settings,
    nextInvNum: 1,
    nextInvId: 1,
    dataVersion: version,
    growthDataVersion: version,
    dataResetAt: nowIso(),
    dataResetBy: user.id,
    updatedAt: nowIso()
  }, true);
}

async function deleteAuthUser(uid) {
  const { error } = await service().auth.admin.deleteUser(uid);
  if (error) throw error;
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'Method not allowed.' });

  try {
    const user = await getUserFromEvent(event);
    if (!user) return response(401, { ok: false, error: 'Please sign in again.' });

    const body = readBody(event);
    const action = normalizeAction(body.action);
    if (!action) return response(400, { ok: false, error: 'Choose reset data or delete account.' });

    const profileDoc = await getDocument('users', user.id);
    const profile = profileDoc && profileDoc.data ? profileDoc.data : {};
    const ownerUid = clean(profile.ownerUid || user.id, 240);
    const isTeamMember = ownerUid !== user.id;
    const email = clean(user.email || profile.email || '', 240).toLowerCase();

    if (email === 'devteam@ceylonrylabs.io' || profile.adminAccess === true || profile.role === 'platform_admin') {
      return response(400, { ok: false, error: 'Platform admin accounts cannot use this self-service danger zone.' });
    }
    if (action === 'resetData' && isTeamMember) {
      return response(403, { ok: false, error: 'Only the account owner can reset workspace data.' });
    }

    const reason = clean(body.reasonCategory, 160);
    const details = clean(body.reasonDetails, 3000);
    const confirmText = clean(body.confirmText, 80).toUpperCase();
    const expected = requiredConfirmation(action);
    if (!reason) return response(400, { ok: false, error: 'Please choose a reason.' });
    if (details.length < 12) return response(400, { ok: false, error: 'Please add a little more detail before continuing.' });
    if (confirmText !== expected) return response(400, { ok: false, error: 'Type "' + expected + '" to confirm.' });

    await saveFeedback(action, user, ownerUid, profile, body);

    if (action === 'resetData') {
      await resetData(ownerUid, user);
      return response(200, { ok: true, action, ownerUid });
    }

    if (isTeamMember) {
      await deleteWorkspace(user.id, true);
    } else {
      await deleteWorkspace(ownerUid, true);
    }
    await deleteAuthUser(user.id);
    return response(200, { ok: true, action });
  } catch (err) {
    return response(err.statusCode || 500, {
      ok: false,
      error: err && err.message ? err.message : 'Could not complete account action.'
    });
  }
};
