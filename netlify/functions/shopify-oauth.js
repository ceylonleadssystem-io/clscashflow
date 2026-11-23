'use strict';

// Where Shopify sends the browser after the store owner approves the POS app: it checks the return, exchanges the code for the store's
// access token and keeps it (encrypted) on the store's row. Public address, but nothing happens unless Shopify's signature and the
// state signed by shopify-store.js are both genuine.
const { getDocument, upsertDocument, clean } = require('../lib/appwrite');
const { shopKey } = require('../lib/shopify');
const oauth = require('../lib/shopify-oauth');
const { _encrypt: encrypt } = require('../lib/ai-keys');

const page = (statusCode, title, message) => ({
  statusCode,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title><body style="font-family:system-ui,Arial,sans-serif;max-width:480px;margin:15vh auto;padding:0 16px;text-align:center"><h1>' + title + '</h1><p>' + message + '</p></body>'
});

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') return page(405, 'Not allowed', 'Open this page from Shopify.');
  const q = event.queryStringParameters || {};
  try {
    const shop = oauth.normalizeShop(q.shop);
    const state = oauth.readState(q.state);
    if (!shop || !state || state.shop !== shop || !q.code || !oauth.verifyReturn(q)) return page(400, 'Could not connect', 'This link is not valid or has expired. Start again from Settings > Online Store in the POS.');
    const row = await getDocument('shopifyShops', shopKey(shop));
    if (!row || !row.data || row.data.business !== state.ownerUid) return page(404, 'Could not connect', 'Connect the store in the POS first (Settings > Online Store), then approve access.');
    const out = await oauth.exchangeCode(shop, clean(q.code, 200));
    await upsertDocument('shopifyShops', shopKey(shop), { adminBox: encrypt(out.token), adminScope: out.scope, adminAt: new Date().toISOString() }, true);
    return page(200, 'Shopify access connected', 'You can close this tab and go back to the POS. Accepting, declining and fulfilling orders will now update Shopify too.');
  } catch (error) {
    console.error('shopify-oauth error', error && error.message);
    return page(error.statusCode || 500, 'Could not connect', clean(error.statusCode ? error.message : 'Something went wrong. Please try again from the POS.', 300));
  }
};
