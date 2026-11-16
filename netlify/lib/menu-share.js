'use strict';

// QR digital menu: what a customer may see. The POS sends a snapshot of the menu; everything is re-checked and cut down here
// so the public page can never show more than a name, description, price, picture and category.

const MAX_CATEGORIES = 60;
const MAX_ITEMS = 1500;

function text(value, max) {
  const out = String(value == null ? '' : value).trim();
  return max && out.length > max ? out.slice(0, max) : out;
}

function price(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : 0;
}

function safeImage(value) {
  const url = text(value, 600);
  return /^https:\/\/[^\s"'<>]+$/i.test(url) ? url : '';
}

// Link key of a location: "all" or the location id, limited to characters that are safe in a document id.
function locationKey(value) {
  const key = text(value, 64).replace(/[^A-Za-z0-9_-]/g, '');
  return key && key !== 'all' ? key : 'all';
}

function sanitizeMenu(menu) {
  menu = menu && typeof menu === 'object' ? menu : {};
  let count = 0;
  const categories = (Array.isArray(menu.categories) ? menu.categories : []).slice(0, MAX_CATEGORIES).map(function(category) {
    category = category && typeof category === 'object' ? category : {};
    const items = (Array.isArray(category.items) ? category.items : []).map(function(item) {
      item = item && typeof item === 'object' ? item : {};
      return {
        name: text(item.name, 120),
        description: text(item.description, 300),
        price: price(item.price),
        sub: text(item.sub, 80),
        image: safeImage(item.image)
      };
    }).filter(function(item) { return item.name; }).slice(0, Math.max(0, MAX_ITEMS - count));
    count += items.length;
    return { name: text(category.name, 80), items: items };
  }).filter(function(category) { return category.name && category.items.length; });
  return {
    business: text(menu.business, 120) || 'Menu',
    location: text(menu.location, 120),
    currency: text(menu.currency, 12).toUpperCase() || 'LKR',
    updatedAt: text(menu.updatedAt, 40) || new Date().toISOString(),
    categories: categories
  };
}

module.exports = { MAX_CATEGORIES, MAX_ITEMS, locationKey, sanitizeMenu, safeImage };
