// Runs every 15 minutes (schedule in netlify.toml) and sends the sales of every Restaurant (OGF) business whose interval (default 60 minutes) is due.
// A run is stopped before the function's time limit; the businesses left over go first next time because a business that was just run is "not due".
const lib = require('../lib/appwrite');
const push = require('../lib/ogf-push');
const log = require('../lib/log').createLogger('ogf-push-scheduled');

const BUDGET_MS = 20000;

exports.handler = async function handler() {
  const started = Date.now();
  const deps = push.realDeps(lib);
  let accounts = [];
  try { accounts = await deps.listAccounts(); } catch (error) { log.error('could not list the businesses', error); return { statusCode: 500, body: 'list failed' }; }
  let ran = 0, sent = 0;
  for (const uid of accounts) {
    if (Date.now() - started > BUDGET_MS) { log.warn('out of time; the rest wait for the next run', { left: accounts.length - ran }); break; }
    try {
      const r = await push.runPush(uid, { deps, trigger: 'schedule' });
      if (!r.skipped) { ran++; sent += r.sent || 0; }
    } catch (error) {
      log.error('sales push failed for a business', error);
    }
  }
  log.info('scheduled sales push', { businesses: accounts.length, ran, sent });
  return { statusCode: 200, body: JSON.stringify({ businesses: accounts.length, ran, sent }) };
};
