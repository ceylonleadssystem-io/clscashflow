'use strict';

// Shared hardening helpers for the public Netlify functions: same-site origin
// checks, best-effort per-IP rate limiting, header/URL sanitising and generic
// error output. Nothing here changes a function's business behaviour.

const DEFAULT_SITE = 'https://ceylonrylabs.io';

function siteOrigin(value) {
  try { return new URL(String(value || '')).origin; } catch (_) { return ''; }
}

function allowedOrigins() {
  const list = new Set([
    siteOrigin(process.env.PUBLIC_SITE_URL || DEFAULT_SITE),
    siteOrigin(process.env.URL),
    siteOrigin(process.env.DEPLOY_PRIME_URL),
    siteOrigin(process.env.DEPLOY_URL)
  ]);
  String(process.env.EXTRA_ALLOWED_ORIGINS || '').split(',').forEach(function(item) { list.add(siteOrigin(item.trim())); });
  if (!process.env.CONTEXT || process.env.CONTEXT === 'dev' || process.env.NETLIFY_DEV) {
    list.add('http://localhost:8888'); list.add('http://localhost:5173'); list.add('http://127.0.0.1:8888');
  }
  list.delete('');
  return list;
}

function header(event, name) {
  const h = (event && event.headers) || {};
  return h[name] || h[name.toLowerCase()] || h[name.replace(/(^|-)(\w)/g, function(_, a, b) { return a + b.toUpperCase(); })] || '';
}

// Browsers always send Origin (or at least Referer) on cross-origin and POST
// fetches. A request carrying a foreign origin is rejected; a request with
// neither header (server-to-server, curl) is allowed to the rate limiter only.
function originAllowed(event) {
  const origin = siteOrigin(header(event, 'origin')) || siteOrigin(header(event, 'referer'));
  if (!origin) return true;
  return allowedOrigins().has(origin);
}

function corsHeaders(event, extra) {
  const origin = siteOrigin(header(event, 'origin'));
  const out = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
    'X-Content-Type-Options': 'nosniff'
  };
  if (origin && allowedOrigins().has(origin)) out['Access-Control-Allow-Origin'] = origin;
  return Object.assign(out, extra || {});
}

function clientIp(event) {
  const raw = header(event, 'x-nf-client-connection-ip') || header(event, 'client-ip') || String(header(event, 'x-forwarded-for')).split(',')[0];
  return String(raw || 'unknown').trim().slice(0, 64);
}

const buckets = new Map();
function rateLimited(key, limit, windowMs) {
  const now = Date.now();
  if (buckets.size > 5000) buckets.forEach(function(v, k) { if (v.reset <= now) buckets.delete(k); });
  let b = buckets.get(key);
  if (!b || b.reset <= now) { b = { count: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.count += 1;
  return b.count > limit ? Math.max(1, Math.ceil((b.reset - now) / 1000)) : 0;
}

function reply(event, statusCode, body, extra) {
  return { statusCode, headers: corsHeaders(event, extra), body: statusCode === 204 ? '' : JSON.stringify(body) };
}

// Returns null when the request may proceed, otherwise a ready response.
function guard(event, options) {
  options = options || {};
  const methods = options.methods || ['POST'];
  const allow = { 'Access-Control-Allow-Methods': methods.concat('OPTIONS').join(', '), 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
  if (event.httpMethod === 'OPTIONS') return reply(event, 204, {}, allow);
  if (methods.indexOf(event.httpMethod) === -1) return reply(event, 405, { ok: false, error: 'Method not allowed' }, allow);
  if (!originAllowed(event)) return reply(event, 403, { ok: false, error: 'Request origin is not allowed.' }, allow);
  if (String(event.body || '').length > (options.maxBody || 200000)) return reply(event, 413, { ok: false, error: 'Request is too large.' }, allow);
  const wait = rateLimited((options.name || 'fn') + ':' + clientIp(event), options.limit || 20, options.windowMs || 600000);
  if (wait) return reply(event, 429, { ok: false, error: 'Too many requests. Please try again shortly.' }, Object.assign({ 'Retry-After': String(wait) }, allow));
  return null;
}

// Strip CR/LF and angle/quote characters so values can never inject mail headers.
function headerSafe(value, max) {
  return String(value == null ? '' : value).replace(/[\r\n\u2028\u2029<>"]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 200);
}

function validEmail(value) {
  const v = String(value || '').trim();
  return v.length <= 254 && /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]+$/.test(v);
}

// Only https links on our own origins may be embedded in outgoing mail.
function trustedLink(value) {
  try {
    const u = new URL(String(value || ''));
    return u.protocol === 'https:' || (u.protocol === 'http:' && u.hostname === 'localhost') ? (allowedOrigins().has(u.origin) ? u.toString() : '') : '';
  } catch (_) { return ''; }
}

function passwordMatches(plain, expectedHex) {
  const crypto = require('crypto');
  const a = crypto.createHash('sha256').update(String(plain || '')).digest();
  const b = Buffer.from(String(expectedHex || ''), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { guard, reply, corsHeaders, originAllowed, allowedOrigins, rateLimited, clientIp, headerSafe, validEmail, trustedLink, passwordMatches, siteOrigin };
