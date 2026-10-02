'use strict';

// Structured server logging for Netlify functions: one JSON line per event, so entries are
// searchable in the Netlify function log. Secrets and personal data are redacted by key name.
//
//   const log = require('../lib/log').createLogger('hardware-order');
//   log.info('order emailed', { orderId });
//   log.error('smtp failed', error, { orderId });

const REDACT_KEY = /pass(word)?|pin|token|secret|authorization|api[-_]?key|card|cvv|otp|cookie/i;

function sanitize(value, depth) {
  depth = depth || 0;
  if (value instanceof Error) return { name: value.name, message: value.message, code: value.code, status: value.statusCode || value.status };
  if (value == null || typeof value !== 'object') return typeof value === 'string' && value.length > 300 ? value.slice(0, 300) + '…' : value;
  if (depth > 3) return '[nested]';
  if (Array.isArray(value)) return value.slice(0, 10).map(function(v) { return sanitize(v, depth + 1); });
  const out = {};
  Object.keys(value).slice(0, 25).forEach(function(key) { out[key] = REDACT_KEY.test(key) ? '[redacted]' : sanitize(value[key], depth + 1); });
  return out;
}

function createLogger(scope) {
  function write(level, message, args) {
    try {
      const entry = { t: new Date().toISOString(), level, scope, message: String(message) };
      args.forEach(function(arg) {
        if (arg instanceof Error) entry.error = sanitize(arg);
        else if (arg && typeof arg === 'object') entry.context = Object.assign(entry.context || {}, sanitize(arg));
      });
      (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(JSON.stringify(entry));
    } catch (_) { /* logging must never break a request */ }
  }
  return {
    info: function(message) { write('info', message, [].slice.call(arguments, 1)); },
    warn: function(message) { write('warn', message, [].slice.call(arguments, 1)); },
    error: function(message) { write('error', message, [].slice.call(arguments, 1)); }
  };
}

module.exports = { createLogger };
