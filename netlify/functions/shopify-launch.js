'use strict';

// The App URL of the POS's Shopify app: Shopify sends a merchant here right after they install it (signed with the app's secret). A store the
// business already added in the POS goes straight on to Shopify's approval page, so the connection finishes by itself; a store nobody has added
// yet is told how to connect it from the POS.
const { getDocument, clean } = require('../lib/appwrite');
const { shopKey } = require('../lib/shopify');
const oauth = require('../lib/shopify-oauth');

const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const page = (statusCode, title, message) => ({
  statusCode,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
  body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title><body style="font-family:system-ui,Arial,sans-serif;max-width:520px;margin:12vh auto;padding:0 16px;text-align:center"><h1>' + esc(title) + '</h1><p>' + message + '</p></body>'
});
const base = () => clean(process.env.PUBLIC_SITE_URL || process.env.URL || 'https://ceylonrylabs.io', 500).replace(/\/$/, '');

exports.handler = async function(event) {
  if (event.httpMethod !== 'GET') return page(405, 'Not allowed', 'Open this page from Shopify.');
  const q = event.queryStringParameters || {};
  try {
    const shop = oauth.normalizeShop(q.shop);
    if (!shop || !oauth.verifyReturn(q)) return page(400, 'Could not open the app', 'This link is not valid. Open the app again from your Shopify admin.');
    const row = await getDocument('shopifyShops', shopKey(shop));
    const owner = row && row.data && row.data.business;
    if (!owner) {
      return page(200, 'Ceylonry POS is installed', 'One more step: open your Ceylonry POS, go to <b>Settings &gt; System Options &gt; Online Store</b>, enter <b>' + esc(shop) + '</b>, choose the location that prepares these orders and press <b>Connect store</b>. Online orders will then arrive in the POS by themselves.');
    }
    return { statusCode: 302, headers: { Location: oauth.authorizeUrl(shop, owner, base() + '/.netlify/functions/shopify-oauth'), 'Cache-Control': 'no-store' }, body: '' };
  } catch (error) {
    console.error('shopify-launch error', error && error.message);
    return page(error.statusCode || 500, 'Could not open the app', esc(error.statusCode ? error.message : 'Something went wrong. Please try again.'));
  }
};
