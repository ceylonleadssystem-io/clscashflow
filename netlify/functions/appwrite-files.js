'use strict';
// Image storage for the POS: menu/product photos, the business logo and the receipt QR are kept as files in an
// Appwrite Storage bucket instead of long text strings inside the business document (which every device re-sends on
// every sync). The browser uploads a compressed image here; the function checks who is signed in, stores the file with
// the server API key and returns its public view URL. The bucket is created on first use when the key may do so.
const { Storage, Permission, Role, ID } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');
const lib = require('../lib/appwrite');
const log = require('../lib/log').createLogger('appwrite-files');

const BUCKET_ID = process.env.APPWRITE_IMAGES_BUCKET_ID || 'pos-images';
const MAX_BYTES = 1500000;
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const KINDS = ['product', 'logo', 'qr'];

// replaced in tests
const deps = { storage: function() { return new Storage(lib.serverClient()); }, user: lib.getUserFromEvent };

function response(code, body) { return { statusCode: code, headers: lib.headers(), body: JSON.stringify(body) }; }
function bodyOf(event) { try { return JSON.parse(event.body || '{}'); } catch (_) { return {}; } }
function viewUrl(id) { return lib.APPWRITE_ENDPOINT + '/storage/buckets/' + BUCKET_ID + '/files/' + id + '/view?project=' + lib.APPWRITE_PROJECT_ID; }
async function ensureBucket(storage) {
  try { await storage.getBucket({ bucketId: BUCKET_ID }); return; }
  catch (error) { if (!error || error.code !== 404) throw error; }
  await storage.createBucket({
    bucketId: BUCKET_ID, name: 'POS images', permissions: [Permission.read(Role.any())], fileSecurity: false, enabled: true,
    maximumFileSize: MAX_BYTES, allowedFileExtensions: Object.values(TYPES)
  });
  log.info('images bucket created', { bucket: BUCKET_ID });
}

async function upload(user, b) {
  const kind = KINDS.includes(b.kind) ? b.kind : 'product';
  const m = String(b.data || '').match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) return response(400, { ok: false, error: 'Send a JPEG, PNG or WebP image.' });
  const buffer = Buffer.from(m[2], 'base64');
  if (!buffer.length || buffer.length > MAX_BYTES) return response(413, { ok: false, error: 'The image is too large.' });
  const storage = deps.storage();
  await ensureBucket(storage);
  const name = user.id + '__' + kind + '.' + TYPES[m[1]];
  const file = await storage.createFile({ bucketId: BUCKET_ID, fileId: ID.unique(), file: InputFile.fromBuffer(buffer, name), permissions: [Permission.read(Role.any())] });
  return response(200, { ok: true, id: file.$id, url: viewUrl(file.$id) });
}

async function handle(event) {
  if (event.httpMethod === 'OPTIONS') return response(204, {});
  if (event.httpMethod !== 'POST') return response(405, { ok: false, error: 'Method not allowed' });
  try {
    const user = await deps.user(event);
    if (!user) return response(401, { ok: false, error: 'Please sign in again.' });
    const b = bodyOf(event);
    if (b.action === 'upload') return await upload(user, b);
    return response(400, { ok: false, error: 'Unknown action.' });
  } catch (error) {
    log.error('image request failed', error);
    return response(error && error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500, { ok: false, error: 'The image could not be stored.' });
  }
}

exports.handler = async function(event) {
  const res = await handle(event);
  let action = ''; try { action = String(bodyOf(event).action || '').slice(0, 10); } catch (_) {}
  log.info('image request', { action: action, status: res.statusCode });
  return res;
};
exports._deps = deps;
exports._viewUrl = viewUrl;
