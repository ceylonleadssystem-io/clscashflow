const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

// the document store is loaded with Appwrite stubbed out: only the routing rules are checked
const chain = new Proxy(function () {}, { get: () => () => chain, apply: () => chain });
const fake = { Client: function () { return chain; }, Account: function () {}, Users: function () {}, Databases: function () {}, ID: { unique: () => 'id' }, Query: {} };
const realLoad = Module._load;
Module._load = function (request, ...rest) { return request === 'node-appwrite' ? fake : realLoad.call(this, request, ...rest); };
const lib = require('../netlify/lib/appwrite');
Module._load = realLoad;

const gm = 'users/u1/gm', piece = 'users/u1/gm/res-2026-10/__large_documents__/x';

test('GM paths are recognised and others are not', () => {
  assert.equal(lib.isGmPath(gm), true);
  assert.equal(lib.isGmPath(piece), true);
  assert.equal(lib.isGmPath('users/u1/gmx'), false);
  assert.equal(lib.isGmPath('users/u1/pos'), false);
});

test('GM rows go to gm / gm_documents; APPWRITE_GM_ROUTING=off sends them to the main database', () => {
  delete process.env.APPWRITE_GM_ROUTING;
  assert.deepEqual(lib.storeFor(gm), { db: 'gm', col: 'gm_documents' });
  assert.deepEqual(lib.storeFor(piece), { db: 'gm', col: 'gm_documents' });
  assert.equal(lib.storeFor('users/u1/pos').db, lib.POS_DATABASE_ID);
  assert.equal(lib.storeFor('users/u1/team').db, lib.DATABASE_ID);
  process.env.APPWRITE_GM_ROUTING = 'off';
  try { assert.equal(lib.storeFor(gm).db, lib.DATABASE_ID); } finally { delete process.env.APPWRITE_GM_ROUTING; }
});
