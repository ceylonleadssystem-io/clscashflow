const {
  headers,
  getUserFromEvent,
  getDocument,
  queryDocuments,
  upsertDocument,
  deleteDocument,
  replaceCollection,
  replaceWorkspace,
  newId,
  canRead,
  canWrite
} = require('../lib/supabase');

function readBody(event) {
  try {
    return JSON.parse(event.body || '{}');
  } catch (e) {
    return {};
  }
}

async function requireUser(event) {
  const user = await getUserFromEvent(event);
  if (!user) {
    const err = new Error('Please sign in again.');
    err.statusCode = 401;
    throw err;
  }
  return user;
}

function isPublicInviteRead(action, path, id) {
  return action === 'get' && !!id && /^users\/[^/]+\/team$/.test(path);
}

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: headers(), body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: headers(), body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  }

  try {
    const body = readBody(event);
    const action = String(body.action || '');
    const path = String(body.path || '').replace(/^\/+|\/+$/g, '');
    const id = String(body.id || '').trim();
    const data = body.data && typeof body.data === 'object' ? body.data : {};

    if (!path) throw new Error('Missing document path.');

    if (isPublicInviteRead(action, path, id)) {
      const doc = await getDocument(path, id);
      return {
        statusCode: 200,
        headers: headers(),
        body: JSON.stringify({ ok: true, exists: !!doc, doc: doc || null })
      };
    }

    const user = await requireUser(event);

    if (action === 'get') {
      if (!id) throw new Error('Missing document id.');
      const doc = await getDocument(path, id);
      if (!doc) return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, exists: false, doc: null }) };
      const allowed = await canRead({ path, id: doc.id, data: doc.data }, user);
      if (!allowed) return { statusCode: 403, headers: headers(), body: JSON.stringify({ ok: false, error: 'Not allowed.' }) };
      return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, exists: true, doc }) };
    }

    if (action === 'query') {
      const rows = await queryDocuments(path, body.options || {});
      const allowed = [];
      for (const row of rows) {
        if (await canRead({ path, id: row.id, data: row.data }, user)) allowed.push(row);
      }
      return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, docs: allowed }) };
    }

    if (action === 'getWorkspace') {
      if (!id) throw new Error('Missing document id.');
      const doc = await getDocument(path, id);
      const allowed = doc
        ? await canRead({ path, id: doc.id, data: doc.data }, user)
        : await canWrite(path, id, {}, user);
      if (!allowed) return { statusCode: 403, headers: headers(), body: JSON.stringify({ ok: false, error: 'Not allowed.' }) };
      const requested = Array.isArray(body.collections) ? body.collections : [];
      const collections = {};
      await Promise.all(requested.map(async function(name) {
        name = String(name || '').replace(/^\/+|\/+$/g, '');
        if (!name || name.indexOf('/') !== -1) return;
        collections[name] = await queryDocuments(path + '/' + id + '/' + name, { fetchLimit: 5000 });
      }));
      return {
        statusCode: 200,
        headers: headers(),
        body: JSON.stringify({ ok: true, exists: !!doc, doc: doc || null, collections })
      };
    }

    if (action === 'set' || action === 'update') {
      if (!id) throw new Error('Missing document id.');
      const allowed = await canWrite(path, id, data, user);
      if (!allowed) return { statusCode: 403, headers: headers(), body: JSON.stringify({ ok: false, error: 'Not allowed.' }) };
      const doc = await upsertDocument(path, id, data, action === 'update' || body.merge !== false);
      return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, doc }) };
    }

    if (action === 'add') {
      const docId = id || newId('doc');
      const allowed = await canWrite(path, docId, data, user);
      if (!allowed) return { statusCode: 403, headers: headers(), body: JSON.stringify({ ok: false, error: 'Not allowed.' }) };
      const doc = await upsertDocument(path, docId, data, false);
      return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, doc }) };
    }

    if (action === 'delete') {
      if (!id) throw new Error('Missing document id.');
      const doc = await getDocument(path, id);
      if (!doc || !(await canWrite(path, id, doc.data, user))) {
        return { statusCode: 403, headers: headers(), body: JSON.stringify({ ok: false, error: 'Not allowed.' }) };
      }
      await deleteDocument(path, id);
      return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true }) };
    }

    if (action === 'replaceCollection') {
      const docs = Array.isArray(body.docs) ? body.docs : [];
      const sample = docs[0] || { id: '__empty__', data: {} };
      const sampleId = String(sample.id || '__empty__');
      const sampleData = sample.data && typeof sample.data === 'object' ? sample.data : {};
      const allowed = await canWrite(path, sampleId, sampleData, user);
      if (!allowed) return { statusCode: 403, headers: headers(), body: JSON.stringify({ ok: false, error: 'Not allowed.' }) };
      const savedDocs = await replaceCollection(path, docs);
      return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, docs: savedDocs }) };
    }

    if (action === 'replaceWorkspace') {
      if (!id) throw new Error('Missing document id.');
      const collections = body.collections && typeof body.collections === 'object' ? body.collections : {};
      const allowed = await canWrite(path, id, data, user);
      if (!allowed) return { statusCode: 403, headers: headers(), body: JSON.stringify({ ok: false, error: 'Not allowed.' }) };
      for (const name of Object.keys(collections)) {
        const docs = Array.isArray(collections[name]) ? collections[name] : [];
        const childPath = path + '/' + id + '/' + name;
        const sample = docs[0] || { id: '__empty__', data: {} };
        const sampleId = String(sample.id || '__empty__');
        const sampleData = sample.data && typeof sample.data === 'object' ? sample.data : {};
        const childAllowed = await canWrite(childPath, sampleId, sampleData, user);
        if (!childAllowed) return { statusCode: 403, headers: headers(), body: JSON.stringify({ ok: false, error: 'Not allowed.' }) };
      }
      const saved = await replaceWorkspace(path, id, data, collections);
      return { statusCode: 200, headers: headers(), body: JSON.stringify({ ok: true, saved }) };
    }

    return { statusCode: 400, headers: headers(), body: JSON.stringify({ ok: false, error: 'Unknown document action.' }) };
  } catch (err) {
    return {
      statusCode: err.statusCode || 500,
      headers: headers(),
      body: JSON.stringify({ ok: false, error: err && err.message ? err.message : 'Supabase document request failed.' })
    };
  }
};
