// Ask Ceylo: answers a POS owner's or cashier's question about their setup with Claude.
// The POS sends the question, the last few chat turns and Ceylo's own check results (titles and plain sentences, never PINs,
// keys or customer data). The server checks the sign-in and that the administrator switched "Ceylo AI answers" on for
// this business, then asks Claude. Needs ANTHROPIC_API_KEY in the Netlify environment (server only).
const Anthropic = require('@anthropic-ai/sdk');
const { guard, reply } = require('../lib/security');
const { getUserFromEvent, getDocument, clean } = require('../lib/appwrite');
const log = require('../lib/log').createLogger('ceylo-ask');

const MODEL = 'claude-opus-5-5';
const MAX_QUESTION = 600;
const MAX_TURNS = 6;

// Stable text first so it can be cached; everything that changes per request goes in the messages.
const SYSTEM = `You are Ceylo, the setup assistant inside Ceylonry POS, a point-of-sale app used by restaurants, cafés, shops, salons and pharmacies in Sri Lanka (prices in LKR).
You help owners, managers and cashiers understand their POS configuration and fix problems.

How to answer:
- Answer in short, plain sentences a shop owner understands. No technical terms (no "sync payload", "JWT", "API").
- Use the setup check results you are given as the source of truth about this business. Do not invent settings you were not shown.
- When something needs changing, name the screen the way the POS does, for example "Settings > Receipt Printing", "Settings > KDS", "Products & Services", "Staff & Shifts", "Settings > Plan & Support".
- Only suggest features listed as switched on. If a feature is off, say the Ceylonry team can switch it on; do not explain how to use it.
- If the person is a cashier, keep to what a cashier can do and suggest asking a manager for settings.
- Never ask for or repeat PINs, passwords, card numbers or API keys.
- If you are not sure, say so and suggest contacting Ceylonry support.
- Keep answers under 120 words unless the person asks for step-by-step instructions.`;

let client;
const anthropic = () => (client = client || new Anthropic());

const line = (r) => `- [${clean(r.status, 10)}] ${clean(r.area, 40)}: ${clean(r.title, 160)}${r.text ? ' (' + clean(r.text, 240) + ')' : ''}`;

function contextText(body, settings) {
  const checks = (Array.isArray(body.checks) ? body.checks : []).slice(0, 60).map(line).join('\n') || '- (no check results sent)';
  const features = Object.entries((settings && settings.features) || {}).filter(function(e) { return e[1] === false; }).map(function(e) { return clean(e[0], 60); }).slice(0, 120);
  return [
    'Business: ' + clean(settings.business || 'not set', 120) + ' · type: ' + clean(settings.businessType || 'not set', 40),
    'Person asking: ' + (body.role ? clean(body.role, 20) : 'unknown role'),
    'Screen they are on: ' + clean(body.view || 'unknown', 40),
    'Features switched off by the administrator: ' + (features.length ? features.join(', ') : 'none'),
    'Setup check results:',
    checks,
  ].join('\n');
}

exports.handler = async function handler(event) {
  const blocked = guard(event, { name: 'ceylo-ask', methods: ['POST'], limit: 20, windowMs: 60000, maxBody: 30000 });
  if (blocked) return blocked;
  try {
    if (!process.env.ANTHROPIC_API_KEY) return reply(event, 503, { ok: false, error: 'Ceylo AI answers are not set up yet.' });
    const user = await getUserFromEvent(event);
    if (!user) return reply(event, 401, { ok: false, error: 'Please sign in again.' });
    let body = {};
    try { body = JSON.parse(event.body || '{}'); } catch (_) { /* empty */ }
    const question = String(body.question || '').trim().slice(0, MAX_QUESTION);
    if (!question) return reply(event, 400, { ok: false, error: 'Type a question first.' });

    // the business's own settings decide whether AI answers are allowed (the administrator's switch)
    const profile = await getDocument('users', user.id);
    const ownerUid = clean((profile && profile.data && profile.data.ownerUid) || user.id, 240);
    const workspace = await getDocument('users/' + ownerUid + '/pos', 'main').catch(function() { return null; });
    const settings = (workspace && workspace.data && workspace.data.payload && workspace.data.payload.settings) || {};
    const features = settings.features || {};
    if (features['settings.ceylo'] === false || features['settings.ceyloAi'] !== true) return reply(event, 403, { ok: false, error: 'Ceylo AI answers are switched off for this business.' });

    const history = (Array.isArray(body.history) ? body.history : []).slice(-MAX_TURNS)
      .filter(function(m) { return m && (m.role === 'user' || m.role === 'assistant') && String(m.text || '').trim(); })
      .map(function(m) { return { role: m.role, content: String(m.text).slice(0, 2000) }; });
    while (history.length && history[0].role !== 'user') history.shift();
    const messages = history.concat([{ role: 'user', content: contextText(body, settings) + '\n\nQuestion: ' + question }]);

    const response = await anthropic().beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages,
    });
    if (response.stop_reason === 'refusal') return reply(event, 200, { ok: true, answer: "I can't help with that one. Please contact Ceylonry support." });
    const answer = response.content.filter(function(b) { return b.type === 'text'; }).map(function(b) { return b.text; }).join('\n').trim();
    log.info('answered', { ownerUid, by: user.id, inTokens: response.usage && response.usage.input_tokens, outTokens: response.usage && response.usage.output_tokens });
    return reply(event, 200, { ok: true, answer: answer || "Sorry, I don't have an answer for that. Please try asking another way." });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return reply(event, 429, { ok: false, error: 'Ceylo is busy. Try again in a minute.' });
    if (err instanceof Anthropic.APIError) { log.error('claude request failed', err, { status: err.status }); return reply(event, 502, { ok: false, error: 'Ceylo could not answer right now. Try again shortly.' }); }
    log.error('ceylo ask failed', err);
    return reply(event, err.statusCode || 500, { ok: false, error: err.statusCode ? err.message : 'Ceylo could not answer right now.' });
  }
};

exports._contextText = contextText;
