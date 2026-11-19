'use strict';

// Shopify orders into the POS: signature check, store names and the cut-down order the POS receives.
// Server-only rows (no owner fields, so the browser document API can neither read nor overwrite them):
//   shopifyShops/{shopKey}            one connected store: { business, shop, locationId, box (encrypted signing secret), last4, connectedAt, lastOrderAt }
//   shopifyBusinesses/{ownerUid}      what the POS may see: { shops: [{ shop, locationId, last4, connectedAt }] }
//   shopifyInbox/{ownerUid}/{orderKey}  new orders waiting for a POS: { status: new|taken, shop, locationId, order, receivedAt, cancelled }
// A store is added once and removed once; more stores can be added later without changing any of this.
const crypto = require('crypto');

const SHOP_PATTERN = /^[a-z0-9][a-z0-9-]{0,60}\.myshopify\.com$/;

function text(value, max) {
  const out = String(value == null ? '' : value).trim();
  return max && out.length > max ? out.slice(0, max) : out;
}
function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
function money(value) {
  return Math.round((number(value) + Number.EPSILON) * 100) / 100;
}

/** "My-Shop.myshopify.com", "https://my-shop.myshopify.com/admin" -> "my-shop.myshopify.com", or "" when it is not a Shopify store address. */
function normalizeShop(value) {
  const host = text(value, 200).toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
  return SHOP_PATTERN.test(host) ? host : '';
}

/** Row id of a store: the address with its dots made safe for a document id. */
const shopKey = (shop) => String(shop).replace(/\./g, '_');

/** Does the base64 signature Shopify sent match HMAC-SHA256 of the raw body under the store's signing secret? */
function verifySignature(rawBody, header, secret) {
  if (!header || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest();
  let given;
  try { given = Buffer.from(String(header), 'base64'); } catch (_) { return false; }
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/** The order as the POS needs it: no more than the items, amounts, customer contact and delivery address. */
function sanitizeOrder(order) {
  order = order && typeof order === 'object' ? order : {};
  const customer = order.customer && typeof order.customer === 'object' ? order.customer : {};
  const ship = order.shipping_address && typeof order.shipping_address === 'object' ? order.shipping_address : {};
  const lines = (Array.isArray(order.line_items) ? order.line_items : []).slice(0, 200).map(function(l) {
    l = l && typeof l === 'object' ? l : {};
    return {
      title: text(l.title || l.name, 200) || 'Item',
      variant: text(l.variant_title, 120),
      sku: text(l.sku, 80),
      qty: Math.max(1, Math.round(number(l.quantity)) || 1),
      price: money(l.price)
    };
  });
  const fullName = text([customer.first_name, customer.last_name].filter(Boolean).join(' '), 120) || text(ship.name, 120);
  return {
    id: text(order.id, 40),
    name: text(order.name || ('#' + (order.order_number || '')), 40),
    createdAt: text(order.created_at, 40),
    currency: text(order.currency, 8).toUpperCase(),
    financialStatus: text(order.financial_status, 30),
    note: text(order.note, 500),
    customer: { name: fullName, phone: text(customer.phone || ship.phone || order.phone, 40), email: text(customer.email || order.email, 160) },
    delivery: { address: text([ship.address1, ship.address2, ship.city, ship.zip].filter(Boolean).join(', '), 300), method: text(order.shipping_lines && order.shipping_lines[0] && order.shipping_lines[0].title, 120) },
    lines: lines,
    shipping: money(order.total_shipping_price_set && order.total_shipping_price_set.shop_money ? order.total_shipping_price_set.shop_money.amount : (order.shipping_lines || []).reduce(function(sum, s) { return sum + number(s && s.price); }, 0)),
    discount: money(order.total_discounts),
    tax: money(order.total_tax),
    total: money(order.total_price)
  };
}

module.exports = { SHOP_PATTERN, normalizeShop, shopKey, verifySignature, sanitizeOrder };
