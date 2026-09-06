const { firebaseAdminFacade } = require('../lib/supabase');

const ADMIN_EMAIL = 'devteam@ceylonrylabs.io';

function headers() {
  return {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Netlify-CDN-Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
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

async function verifyAdmin(admin, event) {
  const auth = event.headers.authorization || event.headers.Authorization || '';
  const match = String(auth).match(/^Bearer\s+(.+)$/i);
  if (!match) { const err = new Error('POS admin sign-in is required.'); err.statusCode = 401; throw err; }
  const decoded = await admin.auth().verifyIdToken(match[1]);
  if (clean(decoded.email).toLowerCase() !== ADMIN_EMAIL) {
    const err = new Error('This account is not authorized for the POS developer portal.'); err.statusCode = 403; throw err;
  }
  return decoded;
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

function defaultWorkspace(uid, profile) {
  return {
    accountUid: uid,
    products: [], modifiers: [], customers: [], sales: [], inventory: [], stockMovements: [],
    users: [], timeEntries: [], cashShifts: [], supportAudit: [], categories: [], voidOrders: [],
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
    image: clean(raw.image, 1000), modifierIds: [], recipe: [], active: raw.active !== false
  };
}

async function loadWorkspace(db, uid, profile) {
  const ref = db.collection('users/' + uid + '/pos').doc('main');
  const snap = await ref.get();
  const data = snap.exists ? serialize(snap.data() || {}) : {};
  const payload = data.payload && typeof data.payload === 'object' ? data.payload : defaultWorkspace(uid, profile || {});
  return { ref, wrapper: data, payload };
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  if (!['GET', 'POST'].includes(event.httpMethod)) return response(405, { ok: false, error: 'Method not allowed.' });
  try {
    const admin = firebaseAdminFacade();
    await verifyAdmin(admin, event);
    const db = admin.firestore();
    const body = event.httpMethod === 'POST' ? JSON.parse(event.body || '{}') : {};
    const params = event.queryStringParameters || {};
    const action = clean(body.action || params.action || 'list');

    if (action === 'list') {
      const rows = (await readRows(db, 'users', 'createdAt', 1000)).filter(function(row) { return isPosUser(row.data); });
      const users = await Promise.all(rows.map(async function(row) {
        const workspace = await loadWorkspace(db, row.id, row.data).catch(function() { return { payload: {} }; });
        const payload = workspace.payload || {};
        return {
          id: row.id,
          name: row.data.name || row.data.displayName || '', email: row.data.email || '',
          business: row.data.posBusinessName || row.data.bizName || (payload.settings || {}).business || '',
          product: row.data.product || 'pos', setupStatus: row.data.posSetupStatus || ((payload.products || []).length ? 'configured' : 'not-started'),
          products: (payload.products || []).length, categories: (payload.categories || []).length,
          updatedAt: workspace.wrapper && workspace.wrapper.updatedAt || '', payment: paymentState(row.data)
        };
      }));
      return response(200, { ok: true, users });
    }

    const uid = clean(body.userId || params.userId, 100);
    if (!uid) return response(400, { ok: false, error: 'Select a POS customer.' });
    const profileSnap = await db.collection('users').doc(uid).get();
    if (!profileSnap.exists || !isPosUser(profileSnap.data() || {})) return response(404, { ok: false, error: 'POS customer not found.' });
    const profile = serialize(profileSnap.data() || {});
    const workspace = await loadWorkspace(db, uid, profile);

    if (action === 'get') return response(200, { ok: true, user: { id: uid, profile, payment: paymentState(profile) }, workspace: workspace.payload });

    if (action === 'saveCatalog') {
      const incoming = Array.isArray(body.products) ? body.products.map(normalizeProduct) : [];
      if (!incoming.length) return response(400, { ok: false, error: 'The import contains no valid products.' });
      const mode = body.mode === 'replace' ? 'replace' : 'merge';
      const beforeProducts = Array.isArray(workspace.payload.products) ? workspace.payload.products : [];
      const beforeCategories = Array.isArray(workspace.payload.categories) ? workspace.payload.categories : [];
      const backupId = 'catalog-' + Date.now();
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

    if (action === 'setSetupStatus') {
      const status = ['draft', 'ready', 'approved'].includes(body.status) ? body.status : 'draft';
      await db.collection('users').doc(uid).set({ posSetupStatus: status, posCatalogUpdatedAtUtc: new Date().toISOString(), posCatalogUpdatedBy: ADMIN_EMAIL }, { merge: true });
      return response(200, { ok: true, status });
    }

    return response(400, { ok: false, error: 'Unknown POS admin action.' });
  } catch (error) {
    return response(error.statusCode || 500, { ok: false, error: error.message || 'POS admin request failed.' });
  }
};
