'use strict';

// Live support sessions: a client creates a one-time 6-digit code in the POS, a signed-in administrator joins with it, and the two browsers
// then connect directly (WebRTC). This file holds the rules (code, expiry, who may do what) and clean-up of what is passed between the two sides;
// the function support-session.js stores the session and answers the requests. The server only hands over the connection details: the live view
// and the drawings travel between the browsers.
const crypto = require('crypto');

const OPEN_MS = 10 * 60 * 1000; // a code can be used for 10 minutes
const RUN_MS = 60 * 60 * 1000; // a joined session lasts at most 60 minutes
const MAX_SDP = 60000;
const COLLECTION = 'supportSessions';

const text = function(value, max) { const out = String(value == null ? '' : value).trim(); return max && out.length > max ? out.slice(0, max) : out; };

function generateCode() { return String(crypto.randomInt(100000, 1000000)); }
function isCode(value) { return /^\d{6}$/.test(String(value || '')); }
// The session is stored under a hash of its code, so a code is looked up directly and is not kept in the clear.
function codeKey(code) { return crypto.createHash('sha256').update('support-code:' + code).digest('hex').slice(0, 36); }
function newSessionId() { return crypto.randomBytes(16).toString('hex'); }
const isSessionId = function(value) { return /^[a-f0-9]{32}$/.test(String(value || '')); };

// A connection description (SDP) must look like one and stay small; anything else is dropped.
function cleanSdp(value) {
  const sdp = String(value || '');
  return sdp.startsWith('v=0') && sdp.length <= MAX_SDP && /^[\x09\x0a\x0d\x20-\x7e]+$/.test(sdp) ? sdp : '';
}

/** A new session for a signed-in POS user. */
function newSession(user, now, profile) {
  return {
    sid: newSessionId(),
    ownerUid: text(user.ownerUid || user.id, 240),
    userId: text(user.id, 240),
    business: text(profile && profile.business, 160),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + OPEN_MS).toISOString(),
    endsAt: '',
    state: 'open',
    agent: '',
    offer: '',
    answer: ''
  };
}

/** Why an administrator cannot join with this session, or "" when they can. The same wording whatever the reason, so codes cannot be probed. */
function joinProblem(session, now) {
  if (!session || session.state !== 'open' || Date.parse(session.expiresAt) <= now) return 'That code is not valid or has expired.';
  return '';
}

function join(session, agentEmail, now) {
  return Object.assign({}, session, { state: 'joined', agent: text(agentEmail, 254), joinedAt: new Date(now).toISOString(), endsAt: new Date(now + RUN_MS).toISOString() });
}

const running = function(session, now) { return !!session && (session.state === 'joined' || session.state === 'connected') && Date.parse(session.endsAt) > now; };

/** A session that has run out is treated as ended. */
function settle(session, now) {
  if (!session) return session;
  if (session.state === 'open' && Date.parse(session.expiresAt) <= now) return Object.assign({}, session, { state: 'ended', reason: 'expired' });
  if ((session.state === 'joined' || session.state === 'connected') && Date.parse(session.endsAt) <= now) return Object.assign({}, session, { state: 'ended', reason: 'time-limit' });
  return session;
}

/** What each side may see of the session. */
function clientView(session) {
  return { sid: session.sid, state: session.state, agent: session.agent ? 'Ceylonry Support' : '', expiresAt: session.expiresAt, endsAt: session.endsAt, answer: session.answer || '' };
}
function agentView(session) {
  return { sid: session.sid, state: session.state, business: session.business, endsAt: session.endsAt, offer: session.offer || '' };
}

// Wrong codes are limited per administrator: 5 in 10 minutes, then a pause (kept in memory: enough to stop guessing from one place).
function createAttemptLimiter(max, windowMs) {
  const tries = new Map();
  return {
    blocked: function(who, now) { const list = (tries.get(who) || []).filter(function(t) { return now - t < windowMs; }); tries.set(who, list); return list.length >= max; },
    fail: function(who, now) { const list = (tries.get(who) || []).filter(function(t) { return now - t < windowMs; }); list.push(now); tries.set(who, list); },
    clear: function(who) { tries.delete(who); }
  };
}

module.exports = { OPEN_MS, RUN_MS, COLLECTION, generateCode, isCode, codeKey, newSessionId, isSessionId, cleanSdp, newSession, joinProblem, join, running, settle, clientView, agentView, createAttemptLimiter };
