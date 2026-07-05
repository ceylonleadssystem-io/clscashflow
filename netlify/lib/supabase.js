const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iudcinvfqbdzaptnnzqg.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_EMAIL = 'devteam@ceylonrylabs.io';

let serviceClient;

function headers(extra) {
  return Object.assign({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }, extra || {});
}

function service() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    const err = new Error('Supabase service role is not configured in Netlify.');
    err.statusCode = 500;
    throw err;
  }
  if (!serviceClient) {
    serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return serviceClient;
}

function clean(value, max) {
  value = String(value == null ? '' : value).trim();
  return max && value.length > max ? value.slice(0, max) : value;
}

function normalizeData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.assign({}, value);
}

function ownerFrom(path, id, data) {
  data = data || {};
  const pathOwner = String(path || '').match(/^users\/([^/]+)/);
  const raw = data.uid || data.userUid || data.ownerUid || (path === 'users' ? id : '') || (pathOwner && pathOwner[1]) || '';
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(raw)) ? raw : null;
}

function emailFrom(data) {
  return clean(data && data.email, 240).toLowerCase() || null;
}

function rowToDoc(row) {
  return { id: row.id, data: row.data || {} };
}

function docSnapshot(doc) {
  return {
    id: doc && doc.id ? doc.id : '',
    exists: !!doc,
    data: function() {
      return doc && doc.data ? Object.assign({}, doc.data) : undefined;
    }
  };
}

function querySnapshot(rows) {
  rows = rows || [];
  const docs = rows.map(docSnapshot);
  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: function(cb) {
      docs.forEach(cb);
    }
  };
}

async function getUserFromEvent(event) {
  const header = event.headers.authorization || event.headers.Authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const { data, error } = await service().auth.getUser(match[1]);
  if (error || !data || !data.user) return null;
  return data.user;
}

async function getDocument(path, id) {
  const { data, error } = await service()
    .from('app_documents')
    .select('*')
    .eq('path', path)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToDoc(data) : null;
}

async function queryDocuments(path, options) {
  options = options || {};
  const { data, error } = await service()
    .from('app_documents')
    .select('*')
    .eq('path', path)
    .limit(Math.min(Number(options.fetchLimit || 1000), 2000));
  if (error) throw error;
  let rows = (data || []).map(rowToDoc);
  (options.filters || []).forEach(function(filter) {
    rows = rows.filter(function(row) {
      const value = row.data ? row.data[filter.field] : undefined;
      if (filter.op === '==') return String(value == null ? '' : value) === String(filter.value == null ? '' : filter.value);
      if (filter.op === 'in' && Array.isArray(filter.value)) return filter.value.indexOf(value) !== -1;
      return true;
    });
  });
  if (options.order) {
    const dir = String(options.dir || 'desc').toLowerCase() === 'asc' ? 1 : -1;
    rows.sort(function(a, b) {
      const av = sortableValue(a.data && a.data[options.order]);
      const bv = sortableValue(b.data && b.data[options.order]);
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }
  if (options.limit) rows = rows.slice(0, Number(options.limit));
  return rows;
}

function firestoreQuery(path, filters, order, limitValue) {
  filters = filters || [];
  return {
    where: function(field, op, value) {
      return firestoreQuery(path, filters.concat([{ field, op, value }]), order, limitValue);
    },
    orderBy: function(field, dir) {
      return firestoreQuery(path, filters, { field, dir: dir || 'asc' }, limitValue);
    },
    limit: function(n) {
      return firestoreQuery(path, filters, order, Number(n) || 0);
    },
    get: async function() {
      const rows = await queryDocuments(path, {
        filters,
        order: order && order.field,
        dir: order && order.dir,
        limit: limitValue,
        fetchLimit: Math.max(Number(limitValue || 0), 1000)
      });
      return querySnapshot(rows);
    },
    count: function() {
      return {
        get: async function() {
          const rows = await queryDocuments(path, {
            filters,
            fetchLimit: 2000
          });
          return { data: function() { return { count: rows.length }; } };
        }
      };
    }
  };
}

function firestoreDocument(path, id) {
  return {
    id,
    path: path + '/' + id,
    collection: function(name) {
      return firestoreCollection(path + '/' + id + '/' + clean(name, 120));
    },
    get: async function() {
      return docSnapshot(await getDocument(path, id));
    },
    set: async function(data, opts) {
      await upsertDocument(path, id, data || {}, !!(opts && opts.merge));
      return this;
    },
    update: async function(data) {
      await upsertDocument(path, id, data || {}, true);
      return this;
    },
    delete: async function() {
      await deleteDocument(path, id);
    }
  };
}

function firestoreCollection(path) {
  const query = firestoreQuery(path, [], null, 0);
  return Object.assign({}, query, {
    doc: function(id) {
      return firestoreDocument(path, clean(id || newId('doc'), 240));
    },
    add: async function(data) {
      const id = newId('doc');
      await upsertDocument(path, id, data || {}, false);
      return firestoreDocument(path, id);
    }
  });
}

function firebaseAdminFacade() {
  function firestore() {
    return {
      collection: function(name) {
        return firestoreCollection(clean(name, 240));
      }
    };
  }
  firestore.FieldValue = {
    serverTimestamp: function() {
      return new Date().toISOString();
    },
    delete: function() {
      return { __delete: true };
    }
  };

  return {
    firestore,
    auth: function() {
      return {
        verifyIdToken: async function(token) {
          const { data, error } = await service().auth.getUser(token);
          if (error || !data || !data.user) {
            const err = new Error('Could not verify your session. Please sign in again.');
            err.statusCode = 401;
            throw err;
          }
          const meta = data.user.user_metadata || {};
          return {
            uid: data.user.id,
            email: data.user.email || '',
            name: meta.full_name || meta.name || data.user.email || ''
          };
        },
        deleteUser: async function(uid) {
          const { error } = await service().auth.admin.deleteUser(uid);
          if (error) throw error;
        },
        generatePasswordResetLink: async function(email, opts) {
          const redirectTo = opts && opts.url ? opts.url : undefined;
          const { data, error } = await service().auth.admin.generateLink({
            type: 'recovery',
            email,
            options: redirectTo ? { redirectTo } : undefined
          });
          if (error) throw error;
          return (data && data.properties && data.properties.action_link) || '';
        }
      };
    }
  };
}

function sortableValue(value) {
  if (value && typeof value.toDate === 'function') return value.toDate().getTime();
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed)) return parsed;
  if (typeof value === 'number') return value;
  return String(value == null ? '' : value);
}

async function upsertDocument(path, id, data, merge) {
  data = normalizeData(data);
  const existing = merge ? await getDocument(path, id) : null;
  const nextData = existing ? Object.assign({}, existing.data || {}, data) : data;
  Object.keys(nextData).forEach(function(key) {
    if (nextData[key] && nextData[key].__delete === true) delete nextData[key];
  });
  const now = new Date().toISOString();
  const payload = {
    path,
    id,
    data: nextData,
    owner_uid: ownerFrom(path, id, nextData),
    email: emailFrom(nextData),
    updated_at: now
  };
  if (!existing) payload.created_at = now;
  const { data: saved, error } = await service()
    .from('app_documents')
    .upsert(payload, { onConflict: 'path,id' })
    .select('*')
    .single();
  if (error) throw error;
  return rowToDoc(saved);
}

async function deleteDocument(path, id) {
  const { error } = await service().from('app_documents').delete().eq('path', path).eq('id', id);
  if (error) throw error;
}

async function replaceCollection(path, docs) {
  path = clean(path, 240);
  docs = Array.isArray(docs) ? docs : [];
  const now = new Date().toISOString();
  const rows = docs.map(function(doc) {
    const data = normalizeData(doc && doc.data);
    const id = clean((doc && doc.id) || newId('doc'), 240);
    return {
      path,
      id,
      data,
      owner_uid: ownerFrom(path, id, data),
      email: emailFrom(data),
      updated_at: now
    };
  });

  const { data: existing, error: existingError } = await service()
    .from('app_documents')
    .select('id')
    .eq('path', path)
    .limit(5000);
  if (existingError) throw existingError;

  if (rows.length) {
    const { error } = await service()
      .from('app_documents')
      .upsert(rows, { onConflict: 'path,id' });
    if (error) throw error;
  }

  const keep = new Set(rows.map(function(row) { return row.id; }));
  const obsolete = (existing || [])
    .map(function(row) { return row.id; })
    .filter(function(id) { return !keep.has(id); });
  for (let i = 0; i < obsolete.length; i += 200) {
    const chunk = obsolete.slice(i, i + 200);
    const { error } = await service()
      .from('app_documents')
      .delete()
      .eq('path', path)
      .in('id', chunk);
    if (error) throw error;
  }

  return {
    count: rows.length,
    deleted: obsolete.length
  };
}

async function replaceWorkspace(path, id, data, collections) {
  path = clean(path, 240);
  id = clean(id, 240);
  data = normalizeData(data);
  collections = collections && typeof collections === 'object' ? collections : {};
  const savedProfile = await upsertDocument(path, id, data, true);
  const basePath = path + '/' + id + '/';
  const savedCollections = {};
  let savedCount = 0;
  for (const name of Object.keys(collections)) {
    const collectionName = clean(name, 120);
    if (!collectionName) continue;
    const docs = Array.isArray(collections[name]) ? collections[name] : [];
    const result = await replaceCollection(basePath + collectionName, docs);
    savedCollections[collectionName] = result;
    savedCount += result && typeof result.count === 'number' ? result.count : docs.length;
  }
  return {
    profile: { id: savedProfile.id },
    collections: savedCollections,
    count: savedCount
  };
}

function newId(prefix) {
  return (prefix ? prefix + '_' : '') + crypto.randomUUID();
}

async function isAdmin(user) {
  const email = clean(user && user.email, 240).toLowerCase();
  if (email === ADMIN_EMAIL) return true;
  if (!user || !user.id) return false;
  const profile = await getDocument('users', user.id).catch(function() { return null; });
  return !!(profile && profile.data && profile.data.adminAccess === true);
}

function rowBelongsToUser(row, user) {
  if (!user) return false;
  const uid = user.id;
  const email = clean(user.email, 240).toLowerCase();
  const pathOwner = String(row.path || '').match(/^users\/([^/]+)/);
  const data = row.data || {};
  return row.id === uid
    || data.uid === uid
    || data.userUid === uid
    || data.ownerUid === uid
    || (pathOwner && pathOwner[1] === uid)
    || (!!email && clean(data.email, 240).toLowerCase() === email);
}

function workspaceOwnerFrom(path, id) {
  const pathOwner = String(path || '').match(/^users\/([^/]+)/);
  return (pathOwner && pathOwner[1]) || (path === 'users' ? id : '');
}

async function teamAccessFor(ownerUid, user) {
  ownerUid = clean(ownerUid, 240);
  const email = clean(user && user.email, 240).toLowerCase();
  if (!ownerUid || !email) return null;
  const invites = await queryDocuments('users/' + ownerUid + '/team', {
    filters: [{ field: 'email', op: '==', value: email }],
    fetchLimit: 100
  }).catch(function() { return []; });
  return invites.find(function(row) {
    const data = row.data || {};
    return clean(data.status || 'active', 80).toLowerCase() !== 'suspended';
  }) || null;
}

async function canRead(row, user) {
  if (await isAdmin(user)) return true;
  if (rowBelongsToUser(row, user)) return true;
  const ownerUid = workspaceOwnerFrom(row.path, row.id);
  if (ownerUid && await teamAccessFor(ownerUid, user)) return true;
  return false;
}

async function canWrite(path, id, data, user) {
  if (await isAdmin(user)) return true;
  if (rowBelongsToUser({ path, id, data: data || {} }, user)) return true;
  const existing = await getDocument(path, id).catch(function() { return null; });
  if (existing && rowBelongsToUser({ path, id, data: existing.data || {} }, user)) return true;
  const ownerUid = workspaceOwnerFrom(path, id);
  const access = ownerUid ? await teamAccessFor(ownerUid, user) : null;
  if (!access) return false;
  const role = clean(access.data && access.data.role, 80).toLowerCase();
  return role !== 'viewer' && role !== 'view only';
}

module.exports = {
  ADMIN_EMAIL,
  SUPABASE_URL,
  clean,
  headers,
  service,
  getUserFromEvent,
  getDocument,
  queryDocuments,
  upsertDocument,
  deleteDocument,
  replaceCollection,
  replaceWorkspace,
  newId,
  isAdmin,
  canRead,
  canWrite,
  firebaseAdminFacade
};
