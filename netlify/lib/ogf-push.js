'use strict';

// The OGF sales push: sends a Restaurant (OGF) business's completed sales to the mall's POS interface (POS-02) and remembers what was sent.
//
//   runPush(uid, { trigger })   one run: new receipts first (one batch per register), then the voids and refunds of receipts already sent
//   previewFor / testConnection / saveSecret / status   what the Sales push settings page uses
//
// Everything outside (documents, the network, the clock) comes in through `deps`, so the rules are tested against a stand-in for the mall's server;
// realDeps(lib) builds the live ones. The client secret and the sent-receipt records live in documents the business's own browser cannot read
// (collection `ogfPrivate`, ids from a hash, no owner field: see canRead in appwrite.js).

const crypto = require('crypto');
const { recordsForSale, settingsOf, dateTimeOf, DEFAULTS } = require('./ogf-sales');

const COLLECTION = 'ogfPrivate';
const BATCH_SIZE = 100;
const RETRIES = 5; // a receipt the mall refuses this many times is held for a person to look at
const KEEP_BATCHES = 60;
const KEEP_SENT = 20000;
const LOCK_MS = 4 * 60 * 1000;
const APP_CODE = 'POS-02';

const idOf = (uid, kind) => crypto.createHash('sha256').update('ogf:' + kind + ':' + uid).digest('hex').slice(0, 36);
const text = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const slash = (p) => (p.charAt(0) === '/' ? p : '/' + p);

// ------------------------------------------------------------------ settings
/** The saved Sales push settings, made safe. Anything missing or odd falls back to the default. */
function cleanConfig(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  const pick = (v, list, d) => (list.indexOf(v) >= 0 ? v : d);
  // a POS interface code may be longer than the spec's 16 characters: OGF's own (CCB1-PS-23-00000039) are
  const registers = (Array.isArray(raw.registers) ? raw.registers : []).slice(0, 20).map(function(r, i) {
    r = r || {};
    return { id: text(r.id, 40) || 'reg' + (i + 1), name: text(r.name, 60), locationId: text(r.locationId, 60), deviceId: text(r.deviceId, 80), posInterfaceCode: text(r.posInterfaceCode, 40), clientId: text(r.clientId, 200) };
  });
  const map = {};
  Object.keys(raw.paymentMap && typeof raw.paymentMap === 'object' ? raw.paymentMap : {}).slice(0, 30).forEach(function(k) { const v = text(raw.paymentMap[k], 32); if (v) map[text(k, 40)] = v; });
  const interval = Number(raw.intervalMinutes);
  return {
    enabled: raw.enabled === true,
    environment: pick(raw.environment, ['test', 'live'], 'test'),
    testBaseUrl: text(raw.testBaseUrl, 300),
    liveBaseUrl: text(raw.liveBaseUrl, 300),
    propertyCode: text(raw.propertyCode, 8),
    tokenPath: slash(text(raw.tokenPath, 120) || '/connect/token'),
    importPath: slash(text(raw.importPath, 160) || '/api/possale/importpossaleswithitems'),
    intervalMinutes: Number.isFinite(interval) ? Math.max(15, Math.min(1440, Math.round(interval))) : 60,
    sendFrom: /^\d{4}-\d{2}-\d{2}$/.test(String(raw.sendFrom || '')) ? raw.sendFrom : '',
    salesCurrency: text(raw.salesCurrency, 8).toUpperCase() || DEFAULTS.salesCurrency,
    itemAmountBasis: pick(raw.itemAmountBasis, ['before-tax', 'after-tax'], DEFAULTS.itemAmountBasis),
    itemAmountsAfterDiscount: raw.itemAmountsAfterDiscount === true,
    noOfItems: pick(raw.noOfItems, ['quantity', 'lines'], DEFAULTS.noOfItems),
    discountField: pick(raw.discountField, ['both', 'ItemDiscountAmt', 'ItemDiscoumtAmt'], DEFAULTS.discountField),
    refundType: pick(raw.refundType, ['Refund', 'Return'], DEFAULTS.refundType),
    paymentMap: map,
    registers
  };
}

/** What still has to be filled in before anything can be sent (empty list = ready). */
function configProblems(cfg, secrets) {
  const out = [];
  if (!cfg.propertyCode) out.push('Enter the property code OGF gave you.');
  if (!(cfg.environment === 'live' ? cfg.liveBaseUrl : cfg.testBaseUrl)) out.push('Enter the ' + cfg.environment + ' server address.');
  if (!cfg.registers.length) out.push('Add at least one register with its POS interface code and login.');
  cfg.registers.forEach(function(r) {
    const label = r.name || r.posInterfaceCode || r.id;
    if (!r.posInterfaceCode) out.push('Register ' + label + ': enter the POS interface code.');
    if (!r.clientId) out.push('Register ' + label + ': enter the client ID.');
    if (!(secrets && secrets[r.id])) out.push('Register ' + label + ': enter the client secret.');
  });
  return out;
}

/** Only public https addresses: the push must not be pointed at this server's own network. */
function safeBaseUrl(value, options) {
  let u;
  try { u = new URL(String(value || '')); } catch (_) { return { error: 'The server address is not a valid web address.' }; }
  if (options && options.allowAny) return { url: u.origin + u.pathname.replace(/\/+$/, '') };
  const host = u.hostname.toLowerCase();
  if (u.protocol !== 'https:') return { error: 'The server address must start with https://.' };
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/.test(host) || /^[\d.]+$/.test(host) || host.indexOf(':') >= 0 || host.indexOf('[') >= 0) return { error: 'Use the server\'s name, not a local or numeric address.' };
  return { url: u.origin + u.pathname.replace(/\/+$/, '') };
}

const pickRegister = (registers, sale) =>
  registers.find(function(r) { return r.deviceId && r.deviceId === sale.deviceId; }) ||
  registers.find(function(r) { return !r.deviceId && r.locationId && r.locationId === sale.locationId; }) ||
  registers.find(function(r) { return !r.deviceId && !r.locationId; }) || null;

/** ddmmyyyyhhmmss in the mall's time, made unique and increasing within a run (one batch number, one submission). */
function batchCode(now, taken, timeZone) {
  let t = new Date(now).getTime();
  for (;;) {
    const p = dateTimeOf(new Date(t).toISOString(), timeZone || 'Asia/Colombo');
    const code = p.date.replace(/\//g, '') + p.time.replace(/:/g, '');
    if (!taken.has(code)) { taken.add(code); return code; }
    t += 1000;
  }
}

// ------------------------------------------------------------------- network
async function postJson(deps, url, init) {
  const res = await deps.fetch(url, Object.assign({ signal: AbortSignal.timeout(20000) }, init));
  const body = await res.text();
  let json = null;
  try { json = JSON.parse(body); } catch (_) { /* not JSON */ }
  return { ok: res.ok, status: res.status, json, text: body.slice(0, 300) };
}

async function getToken(deps, base, cfg, register, secret) {
  const form = new URLSearchParams({ grant_type: 'client_credentials', client_id: register.clientId, client_secret: secret }).toString();
  const r = await postJson(deps, base + cfg.tokenPath, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form });
  if (!r.ok || !r.json || !r.json.access_token) throw new Error(r.status === 400 || r.status === 401 ? 'The mall refused the login (client ID or secret).' : 'The mall did not give a token (' + (r.status || 'no answer') + ').');
  return r.json.access_token;
}

/** The mall's answer to one batch, as what happened to each row: { sent: [rowIndex], failed: [{ index, message }], held: bool, message }. */
function readAnswer(answer, count) {
  const j = answer.json || {};
  const status = String(j.ReturnStatus || '').toLowerCase();
  const imported = Number(j.RecordsImported);
  const all = Array.from({ length: count }, function(_, i) { return i; });
  if (answer.ok && status === 'success' && (!Number.isFinite(imported) || imported >= count)) return { sent: all, failed: [], message: 'Success' };
  const defective = Array.from(new Set(String(j.DefectiveRowNos || '').match(/\d+/g) || [])).map(function(n) { return Number(n) - 1; }).filter(function(i) { return i >= 0 && i < count; });
  const message = text(j.ErrorDetails, 300) || text(j.ReturnStatus, 60) || ('HTTP ' + answer.status);
  if (answer.ok && Number.isFinite(imported) && imported > 0 && imported < count) {
    // some rows went in: only when it is clear which ones did not is it safe to try again, otherwise a retry could count a receipt twice
    if (defective.length && imported === count - defective.length)
      return { sent: all.filter(function(i) { return defective.indexOf(i) < 0; }), failed: defective.map(function(i) { return { index: i, message }; }), message };
    return { sent: [], failed: [], held: true, message: 'Part of the batch was imported but the answer does not say which rows: ' + message };
  }
  return { sent: [], failed: all.map(function(i) { return { index: i, message }; }), message };
}

// ----------------------------------------------------------------- the state
const emptyState = () => ({ sent: {}, failed: {}, held: {}, batches: [], lastRunAt: '', lastStatus: '', lastMessage: '' });
const keyOf = (sale) => (sale.locationId || '-') + '|' + (sale.receipt || sale.orderNumber);

async function loadState(deps, uid) {
  const s = await deps.getDoc(COLLECTION, idOf(uid, 'state'));
  return Object.assign(emptyState(), s || {});
}
const saveState = (deps, uid, state) => {
  const keys = Object.keys(state.sent);
  if (keys.length > KEEP_SENT) keys.slice(0, keys.length - KEEP_SENT).forEach(function(k) { delete state.sent[k]; });
  state.batches = state.batches.slice(-KEEP_BATCHES);
  return deps.putDoc(COLLECTION, idOf(uid, 'state'), state);
};
const loadSecrets = async (deps, uid) => (await deps.getDoc(COLLECTION, idOf(uid, 'secrets'))) || {};

/** Makes sure the scheduled run knows about this business. */
const register = (deps, uid) => deps.putDoc(COLLECTION, idOf(uid, 'registry'), { kind: 'registry', acct: uid, at: new Date(deps.now()).toISOString() });

// ----------------------------------------------------------------- selection
/** The records waiting to go: { newSales: [{ key, register, record }], reversals: [{ key, register, record, kind, refundId }], problems: [{ key, message }] }. */
function collect(payload, cfg, state, now) {
  const out = { newSales: [], reversals: [], problems: [] };
  (Array.isArray(payload.sales) ? payload.sales : []).forEach(function(sale) {
    if (!sale || sale.status === 'held' || sale.status === 'cancelled') return;
    const born = dateTimeOf(sale.createdAt || '', 'Asia/Colombo');
    const day = born ? born.iso.slice(0, 10) : String(sale.date || '');
    if (cfg.sendFrom && day && sale.date && String(sale.date) < cfg.sendFrom) return;
    if (born && new Date(born.iso).getTime() > now + 60000) return; // dated in the future (clock): the mall refuses it, so wait
    const key = keyOf(sale);
    if (state.held[key]) return;
    const reg = pickRegister(cfg.registers, sale);
    if (!reg) { out.problems.push({ key, message: 'No register is set for ' + (sale.locationName || sale.locationId || 'this location') + '.' }); return; }
    const built = recordsForSale(sale, reg, cfg);
    if (built.problem) { out.problems.push({ key, message: built.problem }); return; }
    const done = state.sent[key] || {};
    if (!done.s) out.newSales.push({ key, register: reg, record: built.sale });
    if (built.void && !(done.v)) out.reversals.push({ key, register: reg, record: built.void, kind: 'v' });
    built.refunds.forEach(function(r) { if (!(done.r && done.r[r.id])) out.reversals.push({ key, register: reg, record: r.record, kind: 'r', refundId: r.id }); });
  });
  return out;
}

// ---------------------------------------------------------------- one batch
async function sendBatch(deps, uid, cfg, state, secrets, base, reg, entries, phase, taken, trigger) {
  const code = batchCode(deps.now(), taken, 'Asia/Colombo');
  const log = { batchCode: code, at: new Date(deps.now()).toISOString(), trigger, phase, register: reg.name || reg.posInterfaceCode, environment: cfg.environment, records: entries.length, imported: 0, status: '', message: '' };
  try {
    const token = await getToken(deps, base, cfg, reg, secrets[reg.id]);
    const body = { AppCode: APP_CODE, PropertyCode: cfg.propertyCode, ClientID: reg.clientId, ClientSecret: secrets[reg.id], POSInterfaceCode: reg.posInterfaceCode, BatchCode: code, PosSales: entries.map(function(e) { return e.record; }) };
    const answer = await postJson(deps, base + cfg.importPath, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
    // only an answer from the import itself (HTTP 200) says anything about the receipts; an HTTP error is the mall being unavailable
    if (!answer.ok) throw new Error('The mall answered with an error (HTTP ' + answer.status + ')' + (answer.json && answer.json.ErrorDetails ? ': ' + answer.json.ErrorDetails : '') + '.');
    const result = readAnswer(answer, entries.length);
    result.sent.forEach(function(i) {
      const e = entries[i];
      const done = (state.sent[e.key] = state.sent[e.key] || {});
      if (phase === 'sale') done.s = code;
      else if (e.kind === 'v') done.v = code;
      else (done.r = done.r || {})[e.refundId] = code;
      delete state.failed[e.key];
    });
    result.failed.forEach(function(f) {
      const e = entries[f.index];
      const k = e.key + (e.kind ? '|' + (e.refundId || e.kind) : '');
      const n = ((state.failed[k] || {}).n || 0) + 1;
      state.failed[k] = { n, message: f.message, at: log.at };
      if (n >= RETRIES) state.held[e.key] = { message: f.message, at: log.at };
    });
    if (result.held) entries.forEach(function(e) { state.held[e.key] = { message: result.message, at: log.at }; });
    log.imported = result.sent.length;
    log.status = result.sent.length === entries.length ? 'Success' : result.held ? 'Needs attention' : result.sent.length ? 'Partly imported' : 'Rejected';
    log.message = result.message;
    if (answer.json && answer.json.DefectiveRowNos) log.defectiveRows = text(answer.json.DefectiveRowNos, 200);
  } catch (error) {
    log.status = 'Error';
    log.message = String((error && error.message) || error).slice(0, 300);
    // an outage or a refused login says nothing about the receipts, so they stay waiting and are not counted toward being held
  }
  state.batches.push(log);
  return log;
}

// ------------------------------------------------------------------ the run
/** One run for one business. Returns { skipped } or { ok, sent, batches }. */
async function runPush(uid, options) {
  options = options || {};
  const deps = options.deps;
  const trigger = options.trigger || 'schedule';
  const now = deps.now();
  const payload = await deps.getPayload(uid, null);
  if (!payload) return { skipped: 'no-workspace' };
  const settings = payload.settings || {};
  if (settings.businessType !== 'ogf') return { skipped: 'not-ogf' };
  const cfg = cleanConfig(settings.ogfPush);
  if (!cfg.enabled) return { skipped: 'disabled' };
  const state = await loadState(deps, uid);
  if (trigger === 'schedule' && state.lastRunAt && now - Date.parse(state.lastRunAt) < cfg.intervalMinutes * 60000 - 90000) return { skipped: 'not-due' };
  if (state.lock && state.lock > now) return { skipped: 'busy' };
  const secrets = await loadSecrets(deps, uid);
  const problems = configProblems(cfg, secrets.registers);
  const stamp = new Date(now).toISOString();
  if (problems.length) {
    state.lastRunAt = stamp; state.lastStatus = 'Not set up'; state.lastMessage = problems[0];
    await saveState(deps, uid, state);
    return { skipped: 'not-set-up', problems };
  }
  const base = safeBaseUrl(cfg.environment === 'live' ? cfg.liveBaseUrl : cfg.testBaseUrl, { allowAny: deps.allowAnyUrl });
  if (base.error) { state.lastRunAt = stamp; state.lastStatus = 'Not set up'; state.lastMessage = base.error; await saveState(deps, uid, state); return { skipped: 'not-set-up', problems: [base.error] }; }
  state.lock = now + LOCK_MS;
  await saveState(deps, uid, state);
  const logs = [];
  let sent = 0;
  try {
    const sales = deps.getPayloadSales ? await deps.getPayloadSales(uid, payload, cfg.sendFrom) : payload;
    const waiting = collect(sales, cfg, state, now);
    const taken = new Set(state.batches.map(function(b) { return b.batchCode; }));
    const phase = async function(name, entries) {
      const byRegister = new Map();
      entries.forEach(function(e) { if (!byRegister.has(e.register.id)) byRegister.set(e.register.id, []); byRegister.get(e.register.id).push(e); });
      for (const [, list] of byRegister)
        for (let i = 0; i < list.length; i += BATCH_SIZE) {
          const log = await sendBatch(deps, uid, cfg, state, secrets.registers || {}, base.url, list[i].register, list.slice(i, i + BATCH_SIZE), name, taken, trigger);
          logs.push(log);
          sent += log.imported;
        }
    };
    await phase('sale', waiting.newSales);
    // a void or refund goes in a later batch than the receipt it belongs to, so the receipt must already be at the mall
    await phase('reversal', waiting.reversals.filter(function(e) { return (state.sent[e.key] || {}).s; }));
    state.problems = waiting.problems.slice(0, 50);
  } finally {
    state.lock = 0;
    state.lastRunAt = new Date(deps.now()).toISOString();
    const bad = logs.find(function(l) { return l.status !== 'Success'; });
    state.lastStatus = logs.length ? (bad ? bad.status : 'Success') : 'Nothing to send';
    state.lastMessage = bad ? bad.message : logs.length ? sent + ' record' + (sent === 1 ? '' : 's') + ' sent.' : 'Everything is already sent.';
    await saveState(deps, uid, state);
  }
  return { ok: true, sent, batches: logs, status: state.lastStatus, message: state.lastMessage };
}

// ------------------------------------------- what the settings page asks for
async function statusFor(uid, deps) {
  const payload = await deps.getPayload(uid, null);
  const state = await loadState(deps, uid);
  const secrets = await loadSecrets(deps, uid);
  const cfg = cleanConfig(((payload || {}).settings || {}).ogfPush);
  const sales = payload ? (deps.getPayloadSales ? await deps.getPayloadSales(uid, payload, cfg.sendFrom) : payload) : { sales: [] };
  const waiting = payload ? collect(sales, cfg, state, deps.now()) : { newSales: [], reversals: [], problems: [] };
  return {
    secrets: Object.fromEntries(Object.keys(secrets.registers || {}).map(function(k) { return [k, true]; })),
    problems: configProblems(cfg, secrets.registers),
    lastRunAt: state.lastRunAt, lastStatus: state.lastStatus, lastMessage: state.lastMessage,
    waiting: { sales: waiting.newSales.length, reversals: waiting.reversals.length },
    held: Object.keys(state.held).map(function(k) { return { receipt: k.split('|').slice(1).join('|'), message: state.held[k].message, at: state.held[k].at }; }).slice(0, 50),
    issues: (waiting.problems || []).slice(0, 20),
    sentCount: Object.keys(state.sent).length,
    batches: state.batches.slice(-20).reverse()
  };
}

async function saveSecret(uid, deps, registerId, secret) {
  registerId = text(registerId, 40);
  secret = String(secret || '').trim();
  if (!registerId) return { error: 'Choose a register.' };
  if (!secret || secret.length > 200) return { error: 'Enter the client secret (up to 200 characters).' };
  const cur = await loadSecrets(deps, uid);
  const registers = Object.assign({}, cur.registers, { [registerId]: secret });
  await deps.putDoc(COLLECTION, idOf(uid, 'secrets'), { registers });
  await register(deps, uid);
  return { ok: true };
}

async function deleteSecret(uid, deps, registerId) {
  const cur = await loadSecrets(deps, uid);
  const registers = Object.assign({}, cur.registers);
  delete registers[text(registerId, 40)];
  await deps.putDoc(COLLECTION, idOf(uid, 'secrets'), { registers });
  return { ok: true };
}

async function testConnection(uid, deps, registerId) {
  const payload = await deps.getPayload(uid, null);
  const cfg = cleanConfig(((payload || {}).settings || {}).ogfPush);
  const reg = cfg.registers.find(function(r) { return r.id === registerId; }) || cfg.registers[0];
  const secrets = await loadSecrets(deps, uid);
  if (!reg) return { ok: false, message: 'Add a register first.' };
  if (!cfg.propertyCode && !(cfg.environment === 'live' ? cfg.liveBaseUrl : cfg.testBaseUrl)) return { ok: false, message: 'Enter the server address first.' };
  const base = safeBaseUrl(cfg.environment === 'live' ? cfg.liveBaseUrl : cfg.testBaseUrl, { allowAny: deps.allowAnyUrl });
  if (base.error) return { ok: false, message: base.error };
  if (!reg.clientId || !(secrets.registers || {})[reg.id]) return { ok: false, message: 'Enter the client ID and the client secret for this register first.' };
  try {
    await getToken(deps, base.url, cfg, reg, secrets.registers[reg.id]);
    return { ok: true, message: 'Connected: the mall accepted the login for ' + (reg.name || reg.posInterfaceCode) + '.' };
  } catch (error) {
    return { ok: false, message: String((error && error.message) || error) };
  }
}

/** What would be sent for the latest sales, without sending anything (the secret and login are not part of it). */
async function previewFor(uid, deps, count) {
  const payload = await deps.getPayload(uid, null);
  const cfg = cleanConfig(((payload || {}).settings || {}).ogfPush);
  const sales = (payload && Array.isArray(payload.sales) ? payload.sales : []).slice().sort(function(a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); }).slice(0, Math.max(1, Math.min(10, count || 3)));
  const records = [];
  const issues = [];
  sales.forEach(function(sale) {
    const reg = pickRegister(cfg.registers, sale) || { posInterfaceCode: '(no register for this location)' };
    const built = recordsForSale(sale, reg, cfg);
    if (built.problem) return issues.push({ key: keyOf(sale), message: built.problem });
    records.push(built.sale);
    if (built.void) records.push(built.void);
    built.refunds.forEach(function(r) { records.push(r.record); });
  });
  return { header: { AppCode: APP_CODE, PropertyCode: cfg.propertyCode, POSInterfaceCode: (cfg.registers[0] || {}).posInterfaceCode || '', BatchCode: '(made when sent)' }, PosSales: records, issues };
}

/** Lets held receipts go again (after a person fixed what the mall complained about). */
async function retryHeld(uid, deps) {
  const state = await loadState(deps, uid);
  const n = Object.keys(state.held).length;
  state.held = {};
  state.failed = {};
  await saveState(deps, uid, state);
  return { ok: true, released: n };
}

// -------------------------------------------------------------------- live
function realDeps(lib) {
  const monthsFrom = function(sendFrom, now) {
    const out = [];
    const d = new Date((sendFrom || new Date(now).toISOString().slice(0, 10)).slice(0, 7) + '-01T00:00:00Z');
    const end = new Date(now);
    for (let x = d; x <= end && out.length < 36; x = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 1))) out.push(x.toISOString().slice(0, 7));
    return out;
  };
  return {
    now: function() { return Date.now(); },
    fetch: function(url, init) { return fetch(url, init); },
    async getDoc(collection, id) { const doc = await lib.getDocument(collection, id).catch(function() { return null; }); return doc && doc.data ? doc.data : null; },
    async putDoc(collection, id, data) { await lib.upsertDocument(collection, id, data, false); },
    async getPayload(uid) {
      const doc = await lib.getDocument('users/' + uid + '/pos', 'main').catch(function() { return null; });
      return doc && doc.data && doc.data.payload || null;
    },
    // with the sales split by month the sales are not in the main document: read the months from the first day to send
    async getPayloadSales(uid, payload, sendFrom) {
      if (!payload.salesSplit) return payload;
      const byId = new Map();
      for (const m of monthsFrom(sendFrom, Date.now())) {
        const doc = await lib.getDocument('users/' + uid + '/pos/main/sales', m).catch(function() { return null; });
        ((doc && doc.data && doc.data.rows) || []).forEach(function(s) { byId.set(s.id || s.receipt, s); });
      }
      return Object.assign({}, payload, { sales: [...byId.values()] });
    },
    async listAccounts() {
      const rows = await lib.queryDocuments(COLLECTION, { fetchLimit: 1000 }).catch(function() { return []; });
      return rows.filter(function(r) { return r.data && r.data.kind === 'registry' && r.data.acct; }).map(function(r) { return r.data.acct; });
    }
  };
}

module.exports = { cleanConfig, configProblems, safeBaseUrl, batchCode, readAnswer, collect, runPush, statusFor, saveSecret, deleteSecret, testConnection, previewFor, retryHeld, register, realDeps, idOf, COLLECTION, pickRegister };
