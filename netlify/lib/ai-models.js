'use strict';

// The models an AI account can use (Claude, ChatGPT or Gemini), read from the provider with the account's own API key, so the POS
// can offer them in a list instead of asking someone to type a model name. Only chat-capable models are returned: [{ id, label }].
const MAX_MODELS = 100;

const fail = function(status, text) { const e = new Error(text); e.statusCode = status; return e; };

// OpenAI lists every model it has; keep the ones that answer chat messages.
const OPENAI_CHAT = /^(gpt-|o\d|chatgpt-)/;
const OPENAI_OTHER = /(audio|realtime|transcribe|tts|image|embedding|moderation|search|instruct|codex|dall-e|whisper|computer-use)/;

function normalize(provider, json) {
  if (provider === 'anthropic') {
    return (json.data || []).map(function(m) { return { id: m.id, label: m.display_name || m.id }; });
  }
  if (provider === 'openai') {
    return (json.data || []).filter(function(m) { return OPENAI_CHAT.test(m.id) && !OPENAI_OTHER.test(m.id); })
      .sort(function(a, b) { return (b.created || 0) - (a.created || 0); })
      .map(function(m) { return { id: m.id, label: m.id }; });
  }
  return (json.models || []).filter(function(m) { return (m.supportedGenerationMethods || []).includes('generateContent'); })
    .map(function(m) { const id = String(m.name || '').replace(/^models\//, ''); return { id: id, label: m.displayName || id }; });
}

const REQUESTS = {
  anthropic: function(key) { return { url: 'https://api.anthropic.com/v1/models?limit=100', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' } }; },
  openai: function(key) { return { url: 'https://api.openai.com/v1/models', headers: { Authorization: 'Bearer ' + key } }; },
  gemini: function(key) { return { url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', headers: { 'x-goog-api-key': key } }; }
};
const LABELS = { anthropic: 'Claude', openai: 'ChatGPT', gemini: 'Gemini' };

async function listModels(provider, key, fetchImpl) {
  const build = REQUESTS[provider];
  if (!build) throw fail(400, 'Choose Claude, ChatGPT or Gemini.');
  const label = LABELS[provider];
  const req = build(key);
  const res = await (fetchImpl || fetch)(req.url, { headers: req.headers, signal: AbortSignal.timeout(15000) }).catch(function() { throw fail(502, label + ' could not be reached.'); });
  if (res.status === 401 || res.status === 403) throw fail(400, label + ' did not accept this API key.');
  if (res.status === 429) throw fail(429, 'Your ' + label + ' account is busy. Try again in a moment.');
  const json = await res.json().catch(function() { return {}; });
  if (!res.ok) throw fail(502, label + ' could not list its models right now.');
  const seen = new Set();
  return normalize(provider, json).filter(function(m) { if (!m.id || seen.has(m.id)) return false; seen.add(m.id); return true; }).slice(0, MAX_MODELS);
}

module.exports = { listModels, normalize };
