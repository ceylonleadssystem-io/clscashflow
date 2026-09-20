'use strict';

const crypto = require('crypto');
const { Client, Account, Databases, Users, Query, ID } = require('node-appwrite');

const APPWRITE_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6a947d6e0012c551dfde';
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'ceylonry';
const COLLECTION_ID = process.env.APPWRITE_COLLECTION_ID || 'app_documents';
const ADMIN_EMAIL = 'devteam@ceylonrylabs.io';

function clean(value, max) {
  value = String(value == null ? '' : value).trim();
  return max && value.length > max ? value.slice(0, max) : value;
}

function headers(extra) {
  return Object.assign({
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': clean(process.env.PUBLIC_SITE_URL || 'https://ceylonrylabs.io', 500).replace(/\/$/, ''),
    Vary: 'Origin',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }, extra || {});
}

function serverClient() {
  const key = process.env.APPWRITE_API_KEY || '';
  if (!key) { const error = new Error('Appwrite is not configured.'); error.statusCode = 500; throw error; }
  return new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(key);
}

function databases() { return new Databases(serverClient()); }
function users() { return new Users(serverClient()); }
function documentKey(path, id) { return crypto.createHash('sha256').update(path + '\0' + id).digest('hex').slice(0, 36); }
function normalizeData(data) { return data && typeof data === 'object' && !Array.isArray(data) ? Object.assign({}, data) : {}; }
function ownerFrom(path, id, data) {
  const match = String(path || '').match(/^users\/([^/]+)/);
  return clean(data.ownerUid || data.uid || data.userUid || (path === 'users' ? id : '') || (match && match[1]) || '', 64) || null;
}
const DOCUMENT_DATA_LIMIT = 900000;
const DOCUMENT_CHUNK_SIZE = 400000;
function utf8Length(value) { return Buffer.byteLength(String(value == null ? '' : value), 'utf8'); }
function splitUtf8(value, maxBytes) {
  value = String(value == null ? '' : value);
  const pieces = [];
  let start = 0, index = 0, bytes = 0;
  while (index < value.length) {
    const codePoint = value.codePointAt(index);
    const width = codePoint > 0xffff ? 2 : 1;
    const size = utf8Length(String.fromCodePoint(codePoint));
    if (bytes && bytes + size > maxBytes) { pieces.push(value.slice(start, index)); start = index; bytes = 0; }
    bytes += size;
    index += width;
  }
  if (start < value.length || !pieces.length) pieces.push(value.slice(start));
  return pieces;
}
function storedData(value) {
  const data = typeof value === 'string' ? value : JSON.stringify(value == null ? {} : value);
  if (utf8Length(data) > 1000000) throw new Error('Stored Appwrite data exceeded the document attribute limit.');
  return data;
}
function rowToDoc(row) { return { id: row.docId, data: JSON.parse(row.data || '{}') }; }
function chunkPath(path, id) { return path + '/__large_documents__/' + id; }
function chunkId(id, index) { return crypto.createHash('sha256').update(id + '\0chunk\0' + index).digest('hex').slice(0, 36); }
async function removeChunks(path, id, from, count) {
  await Promise.all(Array.from({ length: Number(count) || 0 }, async function(_, offset) {
    const logicalId = chunkId(id, (Number(from) || 0) + offset);
    try { await databases().deleteDocument(DATABASE_ID, COLLECTION_ID, documentKey(chunkPath(path, id), logicalId)); }
    catch (error) { if (!error || error.code !== 404) throw error; }
  }));
}
async function hydratedRowToDoc(row) {
  const parsed = JSON.parse(row.data || '{}');
  if (!parsed.__chunkedDocument) return { id: row.docId, data: parsed };
  const pieces = await Promise.all(Array.from({ length: Number(parsed.chunkCount) || 0 }, async function(_, index) {
    const logicalId = chunkId(row.docId, index);
    const chunk = await databases().getDocument(DATABASE_ID, COLLECTION_ID, documentKey(chunkPath(row.path, row.docId), logicalId));
    return JSON.parse(chunk.data || '{}').chunk || '';
  }));
  return { id: row.docId, data: JSON.parse(pieces.join('')) };
}

async function getUserFromEvent(event) {
  const auth = String((event.headers || {}).authorization || (event.headers || {}).Authorization || '').match(/^Bearer\s+(.+)$/i);
  if (!auth) return null;
  try {
    const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setJWT(auth[1]);
    const user = await new Account(client).get();
    return { id: user.$id, email: user.email || '', user_metadata: { name: user.name || '' } };
  } catch (_) { return null; }
}

async function getDocument(path, id) {
  try { return hydratedRowToDoc(await databases().getDocument(DATABASE_ID, COLLECTION_ID, documentKey(path, id))); }
  catch (error) { if (error && error.code === 404) return null; throw error; }
}

async function queryDocuments(path, options) {
  options = options || {};
  const result = await databases().listDocuments(DATABASE_ID, COLLECTION_ID, [Query.equal('path', [path]), Query.limit(Math.min(Number(options.fetchLimit || 1000), 5000))]);
  let rows = await Promise.all(result.documents.map(hydratedRowToDoc));
  (options.filters || []).forEach(function(filter) { rows = rows.filter(function(row) { return String((row.data || {})[filter.field] ?? '') === String(filter.value ?? ''); }); });
  if (options.order) rows.sort(function(a,b){ const av=(a.data||{})[options.order]||'',bv=(b.data||{})[options.order]||''; return (av < bv ? -1 : av > bv ? 1 : 0) * (options.dir === 'asc' ? 1 : -1); });
  return options.limit ? rows.slice(0, Number(options.limit)) : rows;
}

async function upsertDocument(path, id, data, merge) {
  const existing = merge ? await getDocument(path, id) : null;
  const next = Object.assign({}, existing ? existing.data : {}, normalizeData(data));
  Object.keys(next).forEach(function(key){ if(next[key] && next[key].__delete === true) delete next[key]; });
  const now = new Date().toISOString(), serialized = JSON.stringify(next);
  const payload = { path, docId:id, data:serialized, ownerUid:ownerFrom(path,id,next), email:clean(next.email,320)||null, createdAt:now, updatedAt:now };
  const key = documentKey(path,id);
  let current = null, oldChunkCount = 0;
  try {
    current = await databases().getDocument(DATABASE_ID,COLLECTION_ID,key);
    payload.createdAt = current.createdAt || now;
  } catch (error) {
    if (!error || error.code !== 404) throw error;
  }
  if (current) { try { oldChunkCount = Number(JSON.parse(current.data || '{}').chunkCount) || 0; } catch (_) {} }
  if (utf8Length(serialized) > DOCUMENT_DATA_LIMIT) {
    const pieces=splitUtf8(serialized,DOCUMENT_CHUNK_SIZE);
    await Promise.all(pieces.map(async function(piece,index){
      const logicalId=chunkId(id,index),chunkPayload={path:chunkPath(path,id),docId:logicalId,data:storedData({chunk:piece}),ownerUid:ownerFrom(path,id,next),email:null,createdAt:now,updatedAt:now},chunkKey=documentKey(chunkPayload.path,logicalId);
      try{const old=await databases().getDocument(DATABASE_ID,COLLECTION_ID,chunkKey);chunkPayload.createdAt=old.createdAt||now;await databases().updateDocument(DATABASE_ID,COLLECTION_ID,chunkKey,chunkPayload)}catch(error){if(!error||error.code!==404)throw error;await databases().createDocument(DATABASE_ID,COLLECTION_ID,chunkKey,chunkPayload,[])}
    }));
    payload.data=storedData({__chunkedDocument:true,chunkCount:pieces.length});
    if(oldChunkCount>pieces.length)await removeChunks(path,id,pieces.length,oldChunkCount-pieces.length);
  } else if(oldChunkCount) await removeChunks(path,id,0,oldChunkCount);
  payload.data=storedData(payload.data);
  const saved=current?await databases().updateDocument(DATABASE_ID,COLLECTION_ID,key,payload):await databases().createDocument(DATABASE_ID,COLLECTION_ID,key,payload,[]);
  return {id:saved.docId,data:next};
}

async function deleteDocument(path,id){
  try{
    const current=await databases().getDocument(DATABASE_ID,COLLECTION_ID,documentKey(path,id));
    let chunkCount=0;try{chunkCount=Number(JSON.parse(current.data||'{}').chunkCount)||0}catch(_){}
    await databases().deleteDocument(DATABASE_ID,COLLECTION_ID,documentKey(path,id));
    if(chunkCount)await removeChunks(path,id,0,chunkCount);
  }catch(error){if(!error||error.code!==404)throw error;}
}
function newId(prefix){return clean((prefix?prefix+'_':'')+ID.unique(),36);}
async function isAdmin(user){if(clean(user&&user.email,240).toLowerCase()===ADMIN_EMAIL)return true;const p=user&&await getDocument('users',user.id);return !!(p&&p.data&&p.data.adminAccess===true);}
function belongs(row,user){const d=row.data||{},m=String(row.path||'').match(/^users\/([^/]+)/);return !!user&&(row.id===user.id||d.uid===user.id||d.userUid===user.id||d.ownerUid===user.id||(m&&m[1]===user.id)||clean(d.email,240).toLowerCase()===clean(user.email,240).toLowerCase());}
async function linkedOwnerUid(user){if(!user)return'';const profile=await getDocument('users',user.id).catch(function(){return null});return clean(profile&&profile.data&&profile.data.ownerUid,240)||user.id;}
async function canRead(row,user){if(belongs(row,user)||await isAdmin(user))return true;const ownerUid=await linkedOwnerUid(user),pathOwner=(String(row.path||'').match(/^users\/([^/]+)/)||[])[1]||'',dataOwner=clean((row.data||{}).ownerUid,240);return ownerUid!==user.id&&(ownerUid===pathOwner||ownerUid===dataOwner);}
async function canWrite(path,id,data,user){if(belongs({path,id,data},user)||await isAdmin(user))return true;const ownerUid=await linkedOwnerUid(user),pathOwner=(String(path||'').match(/^users\/([^/]+)/)||[])[1]||'';if(ownerUid!==user.id&&(ownerUid===pathOwner||ownerUid===clean((data||{}).ownerUid,240)))return true;const old=await getDocument(path,id);return !!old&&(belongs({path,id,data:old.data},user)||(ownerUid!==user.id&&ownerUid===clean(old.data&&old.data.ownerUid,240)));}

function snap(doc){return{id:doc&&doc.id||'',exists:!!doc,data:function(){return doc?Object.assign({},doc.data):undefined}}}
function collection(path,filters,order,max){
  filters=filters||[];
  return{
    doc:function(id){id=id||newId('doc');return{id,path:path+'/'+id,collection:function(name){return collection(path+'/'+id+'/'+name)},get:async function(){return snap(await getDocument(path,id))},set:async function(data,opt){await upsertDocument(path,id,data,!!(opt&&opt.merge));return this},update:async function(data){await upsertDocument(path,id,data,true);return this},delete:async function(){await deleteDocument(path,id)}}},
    add:async function(data){var ref=this.doc();await ref.set(data);return ref},
    where:function(field,op,value){return collection(path,filters.concat([{field,op,value}]),order,max)},
    orderBy:function(field,dir){return collection(path,filters,{field,dir:dir||'asc'},max)},
    limit:function(n){return collection(path,filters,order,n)},
    get:async function(){var rows=await queryDocuments(path,{filters,order:order&&order.field,dir:order&&order.dir,limit:max,fetchLimit:Math.max(max||0,1000)}),docs=rows.map(snap);return{docs,empty:!docs.length,size:docs.length,forEach:function(fn){docs.forEach(fn)}}}
  };
}
function firebaseAdminFacade(){
  function firestore(){return{collection:function(name){return collection(name)},batch:function(){var jobs=[];return{set:function(ref,data,opts){jobs.push(function(){return ref.set(data,opts)})},delete:function(ref){jobs.push(function(){return ref.delete()})},commit:function(){return Promise.all(jobs.map(function(job){return job()}))}}}}}
  firestore.FieldValue={serverTimestamp:function(){return new Date().toISOString()},delete:function(){return{__delete:true}}};
  return{
    firestore,
    auth:function(){return{
      verifyIdToken:async function(token){var client=new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setJWT(token),u=await new Account(client).get();return{uid:u.$id,email:u.email||'',name:u.name||''}},
      deleteUser:async function(uid){return users().delete(uid)},
      listUsers:async function(max){
        var out=await users().list([Query.limit(Math.min(max||1000,5000))]);
        return{users:out.users.map(function(u){
          return{uid:u.$id,email:u.email||'',displayName:u.name||'',disabled:!u.status,metadata:{creationTime:u.$createdAt,lastSignInTime:u.accessedAt}};
        })};
      },
      generatePasswordResetLink:async function(email,opts){
        var url=(opts&&opts.url)||clean(process.env.PUBLIC_SITE_URL||'https://ceylonrylabs.io',500).replace(/\/$/,'')+'/reset-password.html';
        var response=await fetch(APPWRITE_ENDPOINT+'/account/recovery',{method:'POST',headers:{'Content-Type':'application/json','X-Appwrite-Project':APPWRITE_PROJECT_ID},body:JSON.stringify({email:email,url:url})});
        if(!response.ok){var detail=await response.text();throw new Error(detail||'Could not send password recovery email.');}
        return url;
      }
    }}
  };
}

module.exports={ADMIN_EMAIL,APPWRITE_ENDPOINT,APPWRITE_PROJECT_ID,DATABASE_ID,COLLECTION_ID,clean,headers,serverClient,databases,users,getUserFromEvent,getDocument,queryDocuments,upsertDocument,deleteDocument,newId,isAdmin,canRead,canWrite,firebaseAdminFacade};
