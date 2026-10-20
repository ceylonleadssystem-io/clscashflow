'use strict';

// Each location's own AI key for Ceylo ("bring your own key"): Claude (Anthropic), ChatGPT (OpenAI) or Gemini (Google).
// Keys are encrypted with CEYLO_KEY_SECRET (AES-256-GCM) and kept in one server-only row per business (`ceyloAiKeys/key-{ownerUid}`,
// `{ locations: { [locationId]: { provider, model, last4, box, savedAt, savedBy } } }`, no owner field, so the browser document API
// can neither read nor overwrite it). A key is never sent back to the POS: only provider, model, last 4 characters and save date.
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');
const { getDocument, upsertDocument, deleteDocument } = require('./appwrite');

const COLLECTION = 'ceyloAiKeys';
const PROVIDERS = {
  anthropic: { label: 'Claude (Anthropic)', defaultModel: 'claude-opus-5-5', keyPattern: /^sk-ant-[A-Za-z0-9_-]{20,}$/ },
  openai: { label: 'ChatGPT (OpenAI)', defaultModel: '', keyPattern: /^sk-[A-Za-z0-9_-]{20,}$/ },
  gemini: { label: 'Gemini (Google)', defaultModel: '', keyPattern: /^[A-Za-z0-9_-]{30,}$/ },
};
const docId = (ownerUid) => 'key-' + ownerUid;

function secret() {
  const s = process.env.CEYLO_KEY_SECRET || '';
  if (s.length < 32) { const e = new Error('Saving AI keys is not set up yet. Ask Ceylonry to set CEYLO_KEY_SECRET.'); e.statusCode = 503; throw e; }
  return crypto.createHash('sha256').update(s).digest();
}
function encrypt(text) {
  const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', secret(), iv);
  const data = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), data].map(function(b) { return b.toString('base64'); }).join('.');
}
function decrypt(box) {
  const [iv, tag, data] = String(box).split('.').map(function(p) { return Buffer.from(p, 'base64'); });
  const d = crypto.createDecipheriv('aes-256-gcm', secret(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString('utf8');
}

/** What the POS may see about one saved key. */
function publicStatus(row) {
  if (!row) return { saved: false };
  return { saved: true, provider: row.provider, providerLabel: (PROVIDERS[row.provider] || {}).label || row.provider, model: row.model, last4: row.last4, savedAt: row.savedAt };
}

const safeLocation = (id) => (/^[A-Za-z0-9._-]{1,80}$/.test(String(id || '')) ? String(id) : '');

/** The saved keys of a business: { [locationId]: row }. */
async function load(ownerUid) {
  const doc = await getDocument(COLLECTION, docId(ownerUid)).catch(function() { return null; });
  return (doc && doc.data && doc.data.locations) || {};
}
/** What the POS may see about every location's key. */
async function statuses(ownerUid) {
  const all = await load(ownerUid);
  return Object.fromEntries(Object.keys(all).map(function(id) { return [id, publicStatus(all[id])]; }));
}
/** The decrypted key of one location, or null. */
async function keyFor(ownerUid, locationId) {
  const row = (await load(ownerUid))[safeLocation(locationId)];
  return row && row.box ? { provider: row.provider, model: row.model, key: decrypt(row.box) } : null;
}
function validate(provider, key, model) {
  const p = PROVIDERS[provider];
  if (!p) return 'Choose Claude, ChatGPT or Gemini.';
  if (!p.keyPattern.test(key)) return 'That does not look like a ' + p.label + ' API key.';
  if (!(model || p.defaultModel)) return 'Type the model name to use (for example the one shown in your ' + p.label + ' account).';
  if (model && !/^[A-Za-z0-9._:/-]{2,80}$/.test(model)) return 'The model name has characters that are not allowed.';
  return '';
}
async function write(ownerUid, locations) {
  if (!Object.keys(locations).length) return deleteDocument(COLLECTION, docId(ownerUid)).catch(function(e) { if (!e || e.code !== 404) throw e; });
  return upsertDocument(COLLECTION, docId(ownerUid), { business: ownerUid, locations }, false);
}
async function save(ownerUid, locationId, provider, key, model, by) {
  const all = await load(ownerUid);
  all[locationId] = { provider, model: model || PROVIDERS[provider].defaultModel, last4: key.slice(-4), box: encrypt(key), savedAt: new Date().toISOString(), savedBy: by };
  await write(ownerUid, all);
  return publicStatus(all[locationId]);
}
async function remove(ownerUid, locationId) {
  const all = await load(ownerUid);
  delete all[locationId];
  await write(ownerUid, all);
}

/**
 * One chat request to the chosen provider. `messages` are [{ role: 'user' | 'assistant', content }].
 * Returns the answer text. Errors carry `statusCode` and a message that is safe to show.
 */
async function ask({ provider, key, model, system, messages, maxTokens }) {
  const fail = function(status, text) { const e = new Error(text); e.statusCode = status; return e; };
  if (provider === 'anthropic') {
    try {
      const r = await new Anthropic({ apiKey: key }).messages.create({ model: model || PROVIDERS.anthropic.defaultModel, max_tokens: maxTokens || 2048, system, output_config: { effort: 'low' }, messages });
      if (r.stop_reason === 'refusal') return "I can't help with that one. Please contact Ceylonry support.";
      return r.content.filter(function(b) { return b.type === 'text'; }).map(function(b) { return b.text; }).join('\n').trim();
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw fail(400, 'Claude did not accept this API key.');
      if (e instanceof Anthropic.NotFoundError || e instanceof Anthropic.BadRequestError) throw fail(400, 'Claude could not use that model name.');
      if (e instanceof Anthropic.RateLimitError) throw fail(429, 'Your Claude account is busy or out of credit. Try again later.');
      throw fail(502, 'Claude could not answer right now.');
    }
  }
  let url, headers, body, read;
  if (provider === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions';
    headers = { Authorization: 'Bearer ' + key };
    body = { model, messages: [{ role: 'system', content: system }].concat(messages) };
    read = function(j) { return (((j.choices || [])[0] || {}).message || {}).content || ''; };
  } else if (provider === 'gemini') {
    url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
    headers = { 'x-goog-api-key': key };
    body = { systemInstruction: { parts: [{ text: system }] }, contents: messages.map(function(m) { return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }; }) };
    read = function(j) { return ((((j.candidates || [])[0] || {}).content || {}).parts || []).map(function(p) { return p.text || ''; }).join('').trim(); };
  } else throw fail(400, 'Unknown AI provider.');
  const label = PROVIDERS[provider].label;
  const res = await fetch(url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, headers), body: JSON.stringify(body), signal: AbortSignal.timeout(25000) }).catch(function() { throw fail(502, label + ' could not be reached.'); });
  const json = await res.json().catch(function() { return {}; });
  if (res.status === 401 || res.status === 403) throw fail(400, label + ' did not accept this API key.');
  if (res.status === 404 || res.status === 400) throw fail(400, label + ' could not use that model name.');
  if (res.status === 429) throw fail(429, 'Your ' + label + ' account is busy or out of credit. Try again later.');
  if (!res.ok) throw fail(502, label + ' could not answer right now.');
  return String(read(json) || '').trim();
}

module.exports = { PROVIDERS, publicStatus, safeLocation, load, statuses, keyFor, validate, save, remove, ask, _encrypt: encrypt, _decrypt: decrypt };
