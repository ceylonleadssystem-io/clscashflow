const { siteOrigin } = require('../lib/security');
const { appwriteAdmin } = require('../lib/appwrite');
const { isAdminEmail, verifyToken } = require('../lib/admin-auth');
const { getAdmin, audit } = require('../lib/admin-store');
const log = require('../lib/log').createLogger('pos-admin-data');


function headers() {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Netlify-CDN-Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': siteOrigin(process.env.PUBLIC_SITE_URL || 'https://ceylonrylabs.io'),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function response(statusCode, body) {
  return { statusCode, headers: headers(), body: JSON.stringify(body) };
}

function clean(value, max) {
  const text = String(value == null ? '' : value).trim();
  return max ? text.slice(0, max) : text;
}

function serialize(value) {
  if (!value) return value;
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach(function(key) { out[key] = serialize(value[key]); });
    return out;
  }
  return value;
}

// Administrators sign in through pos-admin-login (separate admin database); this function only
// accepts the short-lived token that endpoint issues. The admin record is re-read on every
// request, so deactivating an administrator takes effect immediately.
async function verifyAdmin(event) {
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const match = String(auth).match(/^Bearer\s+(.+)$/i);
  const deny = function(status, reason, message) { log.warn('admin auth denied', { reason }); const err = new Error(message); err.statusCode = status; return err; };
  if (!match) throw deny(401, 'missing-token', 'POS admin sign-in is required.');
  const claims = verifyToken(match[1]);
  if (!claims) throw deny(401, 'invalid-or-expired-token', 'Your administrator session has expired. Please sign in again.');
  if (!isAdminEmail(claims.email)) throw deny(403, 'not-an-admin-address', 'This account is not authorized for the POS developer portal.');
  const record = await getAdmin(String(claims.sub || ''));
  if (!record || !record.active || record.email !== String(claims.email).toLowerCase()) throw deny(403, 'admin-inactive', 'This administrator account is not active.');
  return { id: record.id, email: record.email };
}

async function readRows(db, path, order, limit) {
  let query = db.collection(path);
  if (order) query = query.orderBy(order, 'desc');
  if (limit) query = query.limit(limit);
  const snap = await query.get();
  return snap.docs.map(function(doc) { return { id: doc.id, data: serialize(doc.data() || {}) }; });
}

function isPosUser(data) {
  data = data || {};
  return data.posEnabled === true || data.posPlan === 'pos' || data.plan === 'pos' || data.currentPlan === 'pos' || /(^|-)pos($|-)/i.test(String(data.product || ''));
}

function paymentState(data) {
  const status = clean(data.posSubscriptionStatus || (data.posPaid ? 'active' : 'trial')).toLowerCase();
  return {
    paid: data.posPaid === true,
    status,
    billingCycle: clean(data.posBillingCycle || 'monthly'),
    trialEnd: serialize(data.posTrialEnd || ''),
    nextPaymentDue: serialize(data.posNextPaymentDue || ''),
    lastPaymentAt: serialize(data.posLastPaymentSlipAt || data.posPaymentVerifiedAtUtc || ''),
    reminderStatus: clean(data.posPaymentReminderStatus || '')
  };
}

function isTestAccount(data) {
  return data && (data.posIsTestAccount === true || data.isTestAccount === true || String(data.customerType || '').toLowerCase() === 'test');
}

const ACCOUNT_STATUSES = ['trial', 'test', 'live'];

// Explicit posAccountStatus wins; otherwise derive from the legacy test flag, then payment.
function accountStatus(data) {
  const set = String(data.posAccountStatus || '').toLowerCase();
  if (ACCOUNT_STATUSES.includes(set)) return set;
  if (isTestAccount(data)) return 'test';
  return data.posPaid === true ? 'live' : 'trial';
}

function clampNum(v, min, max) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
}

// Validators for the newer saveSettings keys; return undefined to skip an invalid value.
const SETTING_SANITIZERS = {
  invoiceExtras: function(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return;
    return { enabled: v.enabled === true, description: clean(v.description, 200), amount: clampNum(v.amount, 0, 1e12) };
  },
  invoiceTax: function(v) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return;
    return { enabled: v.enabled === true, rate: clampNum(v.rate, 0, 100) };
  },
  businessCategory: function(v) { return typeof v === 'string' ? clean(v, 40) : undefined; }
};

function addBillingPeriod(start, cycle) {
  const date = new Date(start);
  if (cycle === 'annual') date.setUTCFullYear(date.getUTCFullYear() + 1);
  else date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString();
}

function defaultWorkspace(uid, profile) {
  return {
    accountUid: uid,
    products: [], modifiers: [], customers: [], sales: [], inventory: [], stockMovements: [],
    users: [], locations: [{ id: 'loc-main', name: 'Main Location', code: 'MAIN', active: true, createdAt: new Date().toISOString() }], locationAudit: [], stockTransfers: [], timeEntries: [], cashShifts: [], supportAudit: [], categories: [], voidOrders: [],
    openOrders: [], customerCommunications: [], appointments: [], memberships: [], prescriptions: [],
    medicineBatches: [], commissionPayments: [], kitchenTickets: [],
    settings: { business: profile.posBusinessName || profile.bizName || 'My Business', email: profile.email || '', businessType: 'other', onboardingComplete: false }
  };
}

function productKey(product) {
  return clean(product.code || product.sku).toLowerCase() || clean(product.name).toLowerCase();
}

function normalizeProduct(raw, index) {
  raw = raw || {};
  const name = clean(raw.name || raw.product || raw.item, 160);
  const category = clean(raw.category || raw.group || 'Other', 100) || 'Other';
  const price = Number(raw.price != null ? raw.price : raw.sellingPrice);
  const cost = Number(raw.cost != null ? raw.cost : raw.costPrice);
  const stock = Number(raw.stock != null ? raw.stock : raw.quantity);
  const code = clean(raw.code || raw.sku || raw.barcode, 80);
  if (!name) throw new Error('Row ' + (index + 1) + ': product name is required.');
  if (!Number.isFinite(price) || price < 0) throw new Error('Row ' + (index + 1) + ': enter a valid selling price for ' + name + '.');
  return {
    id: clean(raw.id, 100) || 'product-' + Date.now().toString(36) + '-' + index,
    name, category, code,
    type: clean(raw.type || 'Product', 60),
    price, cost: Number.isFinite(cost) && cost >= 0 ? cost : 0,
    stock: Number.isFinite(stock) && stock >= 0 ? stock : 0,
    unit: clean(raw.unit || 'item', 50),
    supplier: clean(raw.supplier, 140),
    reorderLevel: Math.max(0, Number(raw.reorderLevel || raw.reorder || 0) || 0),
    image: clean(raw.image, 700000), modifierIds: Array.isArray(raw.modifierIds)?raw.modifierIds:[], recipe: Array.isArray(raw.recipe)?raw.recipe:[], active: raw.active !== false
  };
}

async function loadWorkspace(db, uid, profile) {
  const ref = db.collection('users/' + uid + '/pos').doc('main');
  const snap = await ref.get();
  const data = snap.exists ? serialize(snap.data() || {}) : {};
  const payload = data.payload && typeof data.payload === 'object' ? data.payload : defaultWorkspace(uid, profile || {});
  return { ref, wrapper: data, payload };
}

async function handle(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  if (!['GET', 'POST'].includes(event.httpMethod)) return response(405, { ok: false, error: 'Method not allowed.' });
  try {
    const admin = appwriteAdmin();
    // ADMIN_EMAIL is the signed-in administrator; it stamps every `...By` field written below.
    const adminUser = await verifyAdmin(event);
    const ADMIN_EMAIL = adminUser.email;
    const db = admin.firestore();
    const body = event.httpMethod === 'POST' ? JSON.parse(event.body || '{}') : {};
    const params = event.queryStringParameters || {};
    const action = clean(body.action || params.action || 'list');
    // Everything that can change data is recorded in the admin audit log (read-only actions are not).
    if (!['list', 'get', 'listInvoices'].includes(action)) await audit({ adminEmail: ADMIN_EMAIL, action, target: clean(body.userId || body.uid, 120) });

    if (action === 'list') {
      const baseReads = await Promise.all([
        readRows(db, 'users', 'createdAt', 1000),
        readRows(db, 'subscriptionPayments', 'receivedAtUtc', 1000)
      ]);
      const rows = baseReads[0].filter(function(row) { return isPosUser(row.data); });
      const paymentRows = baseReads[1].filter(function(row) { return String((row.data || {}).plan || '').toLowerCase() === 'pos'; });
      let authAvailable = true, authUsers = [];
      try {
        const authPage = await admin.auth().listUsers(1000);
        authUsers = authPage.users || [];
      } catch (error) {
        authAvailable = false;
        console.error('POS auth reconciliation unavailable:', error);
        log.error('auth reconciliation unavailable', error);
      }
      const authById = new Map(authUsers.map(function(user) { return [String(user.uid), user]; }));
      const authByEmail = new Map(authUsers.map(function(user) { return [clean(user.email).toLowerCase(), user]; }));
      const users = await Promise.all(rows.map(async function(row) {
        const workspace = await loadWorkspace(db, row.id, row.data).catch(function() { return { payload: {} }; });
        const payload = workspace.payload || {};
        const email = clean(row.data.email).toLowerCase();
        const authUser = authById.get(String(row.id)) || authByEmail.get(email) || null;
        return {
          id: row.id,
          name: row.data.name || row.data.displayName || '', email: row.data.email || '', phone: row.data.posMobile || row.data.mobile || row.data.phone || '',
          business: row.data.posBusinessName || row.data.bizName || (payload.settings || {}).business || '',
          product: row.data.product || 'pos', setupStatus: row.data.posSetupStatus || ((payload.products || []).length ? 'configured' : 'not-started'),
          products: (payload.products || []).length, categories: (payload.categories || []).length,
          updatedAt: workspace.wrapper && workspace.wrapper.updatedAt || '', payment: paymentState(row.data), isTestAccount: accountStatus(row.data) === 'test', status: accountStatus(row.data), subscriptionType: clean(row.data.posBillingCycle) === 'annual' ? 'annual' : 'monthly', paused: row.data.posAccountPaused === true,
          authStatus: !authAvailable ? 'unavailable' : !authUser ? 'missing' : authUser.disabled ? 'disabled' : 'ready',
          authLastSignInAt: authUser && authUser.metadata && authUser.metadata.lastSignInTime || ''
        };
      }));
      const realIds = new Set(rows.filter(function(row){ return accountStatus(row.data) !== 'test'; }).map(function(row){ return String(row.id); }));
      const currentMonth = new Date().toISOString().slice(0, 7);
      const confirmed = paymentRows.filter(function(row){ const data=row.data||{}; return realIds.has(String(data.uid||'')) && ['paid','confirmed','verified'].includes(String(data.status||'').toLowerCase()) && String(data.verifiedAtUtc||data.receivedAtUtc||'').slice(0,7)===currentMonth; });
      const revenueThisMonth = confirmed.reduce(function(total,row){ const data=row.data||{}; return total+(Number(data.amountLkr)||((data.billingCycle==='annual')?62000:5500)); },0);
      const receipts = paymentRows.map(function(row){ const data=row.data||{}; return {id:row.id,uid:data.uid||'',email:data.email||'',businessName:data.businessName||'',billingCycle:data.billingCycle||'monthly',amountLkr:Number(data.amountLkr)||0,period:data.period||'',status:data.status||'receipt-submitted',receiptName:data.receiptName||'',receiptAvailable:!!data.receiptData,receivedAtUtc:data.receivedAtUtc||'',verifiedAtUtc:data.verifiedAtUtc||''}; });
      return response(200, { ok: true, users, receipts, stats: { realCustomers: realIds.size, testAccounts: rows.length-realIds.size, trialAccounts: users.filter(function(u){ return u.status === 'trial'; }).length, liveAccounts: users.filter(function(u){ return u.status === 'live'; }).length, revenueThisMonth, confirmedPaymentsThisMonth: confirmed.length, authAvailable, missingAuthAccounts: users.filter(function(user){ return user.authStatus === 'missing'; }).length, disabledAuthAccounts: users.filter(function(user){ return user.authStatus === 'disabled'; }).length } });
    }

    const uid = clean(body.userId || params.userId, 100);
    if (!uid) return response(400, { ok: false, error: 'Select a POS customer.' });
    const profileSnap = await db.collection('users').doc(uid).get();
    if (!profileSnap.exists || !isPosUser(profileSnap.data() || {})) return response(404, { ok: false, error: 'POS customer not found.' });
    const profile = serialize(profileSnap.data() || {});
    const workspace = await loadWorkspace(db, uid, profile);

    if (action === 'get') return response(200, { ok: true, user: { id: uid, profile, payment: paymentState(profile) }, workspace: workspace.payload });

    if (action === 'markTest') {
      const test = body.test === true;
      await db.collection('users').doc(uid).set({ posIsTestAccount:test, posAccountStatus:test ? 'test' : (profile.posPaid === true ? 'live' : 'trial'), posTestAccountUpdatedAtUtc:new Date().toISOString(), posTestAccountUpdatedBy:ADMIN_EMAIL }, { merge:true });
      return response(200,{ok:true,test});
    }

    if (action === 'setAccountStatus') {
      const status = String(body.status || '').toLowerCase();
      if (!ACCOUNT_STATUSES.includes(status)) return response(400, { ok: false, error: 'Status must be trial, test or live.' });
      await db.collection('users').doc(uid).set({ posAccountStatus:status, posIsTestAccount:status === 'test', posAccountStatusUpdatedAtUtc:new Date().toISOString(), posAccountStatusUpdatedBy:ADMIN_EMAIL }, { merge:true });
      log.info('account status set', { uid, status });
      return response(200,{ok:true,status});
    }

    if (action === 'setSubscriptionType') {
      const type = String(body.subscriptionType || '').toLowerCase();
      if (!['monthly', 'annual'].includes(type)) return response(400, { ok: false, error: 'Subscription type must be monthly or annual.' });
      await db.collection('users').doc(uid).set({ posBillingCycle:type, posBillingCycleUpdatedAtUtc:new Date().toISOString(), posBillingCycleUpdatedBy:ADMIN_EMAIL }, { merge:true });
      log.info('subscription type set', { uid, type });
      return response(200,{ok:true,subscriptionType:type});
    }

    if (action === 'setAccess') {
      const paused = body.paused === true, now = new Date().toISOString();
      await db.collection('users').doc(uid).set({ posAccountPaused:paused, posSubscriptionStatus:paused?'paused':(profile.posPaid===true?'active':'trial'), posAccessUpdatedAtUtc:now, posAccessUpdatedBy:ADMIN_EMAIL }, { merge:true });
      return response(200,{ok:true,paused});
    }

    if (action === 'confirmPayment') {
      const receiptId=clean(body.receiptId,240),cycle=body.billingCycle==='annual'?'annual':'monthly',now=new Date().toISOString(),amount=Number(body.amountLkr)|| (cycle==='annual'?62000:5500);
      if(!receiptId)return response(400,{ok:false,error:'Select a payment receipt.'});
      await db.collection('subscriptionPayments').doc(receiptId).set({status:'verified',verifiedAtUtc:now,verifiedBy:ADMIN_EMAIL,billingCycle:cycle,amountLkr:amount},{merge:true});
      await db.collection('users').doc(uid).set({posPaid:true,posAccountPaused:false,posSubscriptionStatus:'active',posBillingCycle:cycle,posPaymentVerifiedAtUtc:now,posNextPaymentDue:addBillingPeriod(now,cycle),posPaymentReminderStatus:'paid',updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
      log.info('payment confirmed',{uid,receiptId,cycle});
      return response(200,{ok:true,nextPaymentDue:addBillingPeriod(now,cycle)});
    }

    if (action === 'recordPayment') {
      const cycle=body.billingCycle==='annual'?'annual':'monthly',now=new Date().toISOString(),amount=Number(body.amountLkr)||(cycle==='annual'?62000:5500),paymentId='pos-admin-'+uid+'-'+Date.now();
      await db.collection('subscriptionPayments').doc(paymentId).set({uid,email:profile.email||'',businessName:profile.posBusinessName||profile.bizName||'',plan:'pos',status:'verified',source:'admin-confirmed',billingCycle:cycle,amountLkr:amount,period:now.slice(0,7),receivedAtUtc:now,verifiedAtUtc:now,verifiedBy:ADMIN_EMAIL});
      const nextPaymentDue=addBillingPeriod(now,cycle);await db.collection('users').doc(uid).set({posPaid:true,posAccountPaused:false,posSubscriptionStatus:'active',posBillingCycle:cycle,posPaymentVerifiedAtUtc:now,posNextPaymentDue:nextPaymentDue,posPaymentReminderStatus:'paid',updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
      log.info('payment recorded',{uid,paymentId,cycle});
      return response(200,{ok:true,nextPaymentDue,paymentId});
    }

    if (action === 'billingReminder') {
      const channel=body.channel==='whatsapp'?'whatsapp':'email',now=new Date().toISOString();
      await db.collection('users').doc(uid).set({posPaymentReminderStatus:'sent',posPaymentReminderChannel:channel,posPaymentReminderAt:now,posPaymentReminderBy:ADMIN_EMAIL},{merge:true});
      return response(200,{ok:true,channel,at:now});
    }

    if (action === 'deleteAccount') {
      if(body.confirmBusiness!==clean(profile.posBusinessName||profile.bizName||'',160))return response(400,{ok:false,error:'Business confirmation does not match.'});
      const now=new Date().toISOString(),backupId='pos-account-'+uid+'-'+Date.now();
      await db.collection('accountDeletionBackups').doc(backupId).set({uid,deletedAtUtc:now,deletedBy:ADMIN_EMAIL,profile,workspace:workspace.payload,source:'pos-admin'});
      await workspace.ref.delete();await db.collection('users').doc(uid).delete();
      // The profile/workspace are already gone and backed up; an auth failure must not fail the request, but needs manual follow-up.
      try{await admin.auth().deleteUser(uid)}catch(error){console.error('POS auth deletion requires follow-up:',error);log.error('auth user deletion needs follow-up',error,{uid,backupId})}
      log.info('pos account deleted',{uid,backupId});
      return response(200,{ok:true,backupId});
    }

    if (action === 'getReceipt') {
      const receiptId=clean(body.receiptId,240),snap=await db.collection('subscriptionPayments').doc(receiptId).get(),data=snap.exists?serialize(snap.data()||{}):{};
      if(String(data.uid||'')!==uid||!data.receiptData)return response(404,{ok:false,error:'Payment slip file is not available. Older slips were delivered by email only.'});
      return response(200,{ok:true,name:data.receiptName||'payment-slip',type:data.receiptType||'',data:data.receiptData});
    }

    if (action === 'addCategory') {
      const name=clean(body.name,100);if(!name)return response(400,{ok:false,error:'Category name is required.'});
      const categories=Array.from(new Set((workspace.payload.categories||[]).concat([name]))).sort(),payload=Object.assign({},workspace.payload,{categories});
      await workspace.ref.set({ownerUid:uid,payload,updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
      return response(200,{ok:true,categories:categories.length});
    }

    if (action === 'addProduct') {
      const item=normalizeProduct(body.product||{},0),before=Array.isArray(workspace.payload.products)?workspace.payload.products:[],match=productKey(item),products=before.filter(function(product){return productKey(product)!==match;});products.push(item);
      const categories=Array.from(new Set((workspace.payload.categories||[]).concat([item.category]))).sort(),payload=Object.assign({},workspace.payload,{products,categories});
      await workspace.ref.set({ownerUid:uid,payload,updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
      return response(200,{ok:true,products:products.length,categories:categories.length});
    }

    if (action === 'deleteProduct') {
      const id=clean(body.productId,100),before=Array.isArray(workspace.payload.products)?workspace.payload.products:[],products=before.filter(function(item){return String(item.id)!==id;});
      if(products.length===before.length)return response(404,{ok:false,error:'Product not found.'});
      const deletedIds=Object.assign({},workspace.payload.deletedIds||{});deletedIds.products=Array.from(new Set([].concat(deletedIds.products||[],[id])));
      await workspace.ref.set({ownerUid:uid,payload:Object.assign({},workspace.payload,{products,deletedIds}),updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
      return response(200,{ok:true,products:products.length});
    }

    if (action === 'renameCategory') {
      const oldName=clean(body.oldName,100),newName=clean(body.newName,100);if(!oldName||!newName)return response(400,{ok:false,error:'Both category names are required.'});
      const categories=Array.from(new Set((workspace.payload.categories||[]).map(function(name){return name===oldName?newName:name}))),products=(workspace.payload.products||[]).map(function(item){return item.category===oldName?Object.assign({},item,{category:newName}):item});
      await workspace.ref.set({ownerUid:uid,payload:Object.assign({},workspace.payload,{categories,products}),updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});return response(200,{ok:true});
    }

    if (action === 'deleteCategory') {
      const name=clean(body.name,100);if(!name)return response(400,{ok:false,error:'Category name is required.'});
      const fallback='Uncategorized',categories=(workspace.payload.categories||[]).filter(function(item){return item!==name;}),products=(workspace.payload.products||[]).map(function(item){return item.category===name?Object.assign({},item,{category:fallback}):item});if(products.some(function(item){return item.category===fallback})&&!categories.includes(fallback))categories.push(fallback);
      const deletedIds=Object.assign({},workspace.payload.deletedIds||{});deletedIds.categories=Array.from(new Set([].concat(deletedIds.categories||[],[name.toLowerCase()])));
      await workspace.ref.set({ownerUid:uid,payload:Object.assign({},workspace.payload,{categories,products,deletedIds}),updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});return response(200,{ok:true});
    }

    if (action === 'saveCatalog') {
      const incoming = Array.isArray(body.products) ? body.products.map(normalizeProduct) : [];
      if (!incoming.length) return response(400, { ok: false, error: 'The import contains no valid products.' });
      const mode = body.mode === 'replace' ? 'replace' : 'merge';
      const beforeProducts = Array.isArray(workspace.payload.products) ? workspace.payload.products : [];
      const beforeCategories = Array.isArray(workspace.payload.categories) ? workspace.payload.categories : [];
      const backupId = 'catalog-' + Date.now();
      log.info('catalog import', { uid, mode, incoming: incoming.length, before: beforeProducts.length, backupId });
      await db.collection('users/' + uid + '/posCatalogBackups').doc(backupId).set({ products: beforeProducts, categories: beforeCategories, createdAtUtc: new Date().toISOString(), createdBy: ADMIN_EMAIL });
      let products = incoming;
      if (mode === 'merge') {
        const merged = new Map(beforeProducts.map(function(item) { return [productKey(item), item]; }));
        incoming.forEach(function(item) { merged.set(productKey(item), Object.assign({}, merged.get(productKey(item)) || {}, item)); });
        products = Array.from(merged.values());
      }
      const categories = Array.from(new Set((mode === 'merge' ? beforeCategories : []).concat(body.categories || [], products.map(function(item) { return item.category; })).map(function(item) { return clean(item, 100); }).filter(Boolean))).sort();
      const now = new Date().toISOString();
      const payload = Object.assign({}, workspace.payload, { accountUid: uid, products, categories });
      payload.supportAudit = Array.isArray(payload.supportAudit) ? payload.supportAudit : [];
      payload.supportAudit.unshift({ at: now, action: 'developer-catalog-import', details: mode + ' import: ' + incoming.length + ' items', session: 'pos-admin' });
      await workspace.ref.set({ ownerUid: uid, payload, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAtUtc: now }, { merge: true });
      await db.collection('users').doc(uid).set({ posSetupStatus: clean(body.setupStatus || 'draft'), posCatalogUpdatedAtUtc: now, posCatalogUpdatedBy: ADMIN_EMAIL }, { merge: true });
      return response(200, { ok: true, products: products.length, categories: categories.length, imported: incoming.length, backupId });
    }

    if (action === 'listInvoices') {
      const rows = await readRows(db, 'users/' + uid + '/posInvoices', 'createdAtUtc', 200);
      return response(200, { ok: true, invoices: rows.map(function(row) { return Object.assign({ id: row.id }, row.data); }) });
    }

    if (action === 'saveInvoice') {
      // Subscription invoices raised by the administrator (tier price + add-on features or a fixed-amount exception).
      const inv = body.invoice && typeof body.invoice === 'object' ? body.invoice : {};
      const now = new Date().toISOString();
      const lines = (Array.isArray(inv.lines) ? inv.lines : []).slice(0, 50).map(function(l) {
        const qty = Number(l.qty) || 1, price = Number(l.price) || 0;
        return { desc: clean(l.desc, 200), qty: qty, price: price, total: Math.round(qty * price * 100) / 100 };
      });
      if (!lines.length) return response(400, { ok: false, error: 'An invoice needs at least one line.' });
      const amount = lines.reduce(function(t, l) { return t + l.total; }, 0);
      const number = clean(inv.number, 40) || ('INV-POS-' + Date.now().toString().slice(-8));
      const doc = {
        number: number, uid: uid, createdAtUtc: now, createdBy: ADMIN_EMAIL,
        tier: clean(inv.tier, 40), period: clean(inv.period, 40), exception: inv.exception === true,
        note: clean(inv.note, 500), dueDate: clean(inv.dueDate, 40), currency: 'LKR',
        lines: lines, amount: amount, status: clean(inv.status, 20) || 'unpaid',
        emailedTo: inv.emailedTo ? clean(inv.emailedTo, 200) : '', emailedAtUtc: inv.emailedTo ? now : ''
      };
      if (inv.tax && typeof inv.tax === 'object') doc.tax = { enabled: inv.tax.enabled === true, rate: clampNum(inv.tax.rate, 0, 100), amount: clampNum(inv.tax.amount, 0, 1e12) };
      if (inv.extras && typeof inv.extras === 'object') doc.extras = { description: clean(inv.extras.description, 200), amount: clampNum(inv.extras.amount, 0, 1e12) };
      await db.collection('users/' + uid + '/posInvoices').doc(number).set(doc, { merge: true });
      return response(200, { ok: true, invoice: doc });
    }

    if (action === 'saveSettings') {
      // Admin dashboard: feature switches (business + per location) and the first-login welcome message.
      // Written with per-key timestamps so the POS cloud merge accepts them as the newest value.
      const incoming = body.settings && typeof body.settings === 'object' ? body.settings : {};
      const allowedKeys = ['features', 'locationFeatures', 'welcome', 'plan'].concat(Object.keys(SETTING_SANITIZERS));
      const now = new Date().toISOString();
      const payload = Object.assign({}, workspace.payload);
      payload.settings = Object.assign({}, payload.settings);
      payload.syncMeta = Object.assign({}, payload.syncMeta);
      payload.syncMeta.settings = Object.assign({}, payload.syncMeta.settings);
      const changed = [];
      allowedKeys.forEach(function(key) {
        if (!Object.prototype.hasOwnProperty.call(incoming, key)) return;
        const value = incoming[key];
        const sanitize = SETTING_SANITIZERS[key];
        if (sanitize) {
          const clean2 = sanitize(value);
          if (clean2 === undefined) return;
          payload.settings[key] = clean2;
        } else {
          if (value === null || typeof value !== 'object' || Array.isArray(value)) return;
          payload.settings[key] = JSON.parse(JSON.stringify(value));
        }
        payload.syncMeta.settings[key] = now;
        changed.push(key);
      });
      if (!changed.length) return response(400, { ok: false, error: 'Nothing to save.' });
      payload.syncMeta.updatedAt = now;
      payload.supportAudit = Array.isArray(payload.supportAudit) ? payload.supportAudit : [];
      payload.supportAudit.unshift({ id: 'sa' + Date.now(), at: now, action: 'admin-settings', details: clean(body.summary || changed.join(', '), 400), userId: ADMIN_EMAIL, session: 'pos-admin' });
      await workspace.ref.set({ ownerUid: uid, payload, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAtUtc: now }, { merge: true });
      log.info('admin settings saved', { uid, keys: changed });
      return response(200, { ok: true, saved: changed });
    }

    if (action === 'setSetupStatus') {
      const status = ['draft', 'ready', 'approved'].includes(body.status) ? body.status : 'draft';
      await db.collection('users').doc(uid).set({ posSetupStatus: status, posCatalogUpdatedAtUtc: new Date().toISOString(), posCatalogUpdatedBy: ADMIN_EMAIL }, { merge: true });
      return response(200, { ok: true, status });
    }

    return response(400, { ok: false, error: 'Unknown POS admin action.' });
  } catch (error) {
    log.error('pos-admin action threw', error);
    return response(error.statusCode || 500, { ok: false, error: error.message || 'POS admin request failed.' });
  }
}

// Single place that records every request outcome (action, status, duration). Only the action
// name is read from the body/query here; payloads are never logged.
exports.handler = async function(event) {
  const started = Date.now();
  let action = '';
  try { action = clean((JSON.parse(event.body || '{}').action) || (event.queryStringParameters || {}).action || 'list', 40); } catch (_) { /* logging only */ }
  const res = await handle(event);
  const ctx = { action, status: res.statusCode, ms: Date.now() - started };
  if (res.statusCode === 401 || res.statusCode === 403) log.warn('pos-admin request denied', ctx);
  else if (res.statusCode >= 500) log.error('pos-admin request failed', ctx);
  else log.info('pos-admin request', ctx);
  return res;
};
