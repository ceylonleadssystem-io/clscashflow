// Settings > Ceylo AI key: a business saves, checks or removes an AI key (Claude, ChatGPT or Gemini) for each of its locations.
// The key is tested with one tiny request before it is stored encrypted (see lib/ai-keys.js); it is never returned.
const { guard, reply } = require('../lib/security');
const { getUserFromEvent, getDocument, clean } = require('../lib/appwrite');
const keys = require('../lib/ai-keys');
const log = require('../lib/log').createLogger('ceylo-ai-key');

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'ceylo-ai-key', methods: ['POST'], limit: 10, windowMs: 60000, maxBody: 4000 });
  if (blocked) return blocked;
  try {
    const user = await getUserFromEvent(event);
    if (!user) return reply(event, 401, { ok: false, error: 'Please sign in again.' });
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ }
    const profile = await getDocument('users', user.id);
    const ownerUid = clean((profile && profile.data && profile.data.ownerUid) || user.id, 240);
    const action = String(body.action || 'status');

    if (action === 'status') return reply(event, 200, { ok: true, keys: await keys.statuses(ownerUid) });
    // the location must be one of this business's own locations
    const locationId = keys.safeLocation(body.locationId);
    const workspace = await getDocument('users/' + ownerUid + '/pos', 'main').catch(function() { return null; });
    const locations = ((workspace && workspace.data && workspace.data.payload && workspace.data.payload.locations) || []).map(function(l) { return l && l.id; });
    if (!locationId || !locations.includes(locationId)) return reply(event, 400, { ok: false, error: 'Choose one of your locations.' });
    if (action === 'remove') { await keys.remove(ownerUid, locationId); log.info('key removed', { ownerUid, locationId, by: user.id }); return reply(event, 200, { ok: true, keys: await keys.statuses(ownerUid) }); }
    if (action === 'save') {
      const provider = String(body.provider || ''), key = String(body.key || '').trim(), model = String(body.model || '').trim();
      const bad = keys.validate(provider, key, model);
      if (bad) return reply(event, 400, { ok: false, error: bad });
      // one tiny request proves the key and model work before anything is stored
      await keys.ask({ provider, key, model: model || keys.PROVIDERS[provider].defaultModel, system: 'Reply with the single word OK.', messages: [{ role: 'user', content: 'Test' }], maxTokens: 16 });
      const status = await keys.save(ownerUid, locationId, provider, key, model, user.id);
      log.info('key saved', { ownerUid, locationId, by: user.id, provider, model: status.model });
      return reply(event, 200, { ok: true, key: status, keys: await keys.statuses(ownerUid) });
    }
    return reply(event, 400, { ok: false, error: 'Unknown action.' });
  } catch (err) {
    if (!err.statusCode || err.statusCode >= 500) log.error('ai key action failed', err);
    return reply(event, err.statusCode || 500, { ok: false, error: err.statusCode ? err.message : 'Could not save the key right now.' });
  }
};
