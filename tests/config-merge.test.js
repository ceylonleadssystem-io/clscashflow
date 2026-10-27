const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanConfig, applyConfig, summarize } = require('../netlify/lib/config-merge');

const NOW = '2026-10-27T10:00:00.000Z';
const payload = () => ({
  products: [{ id: 'p1', name: 'Tea', price: 300, stock: 40, modifierIds: [], updatedAt: '2026-10-01T00:00:00Z' }, { id: 'p2', name: 'Cake', price: 500, stock: 9 }],
  modifiers: [{ id: 'm1', name: 'Size', options: [] }],
  subcategories: [],
  locations: [{ id: 'l1', name: 'Main' }],
  categories: ['Drinks', 'Food'],
  sales: [{ id: 's1', total: 300 }],
  customers: [{ id: 'c1' }],
  users: [{ id: 'u1', pin: '8826' }],
  inventory: [{ id: 'i1', qty: 12 }],
  settings: { business: 'Lotus', kotPrinter: '', ownerAuth: { h: 1 } },
  syncMeta: { settings: { business: '2026-10-01T00:00:00Z' } },
  deletedIds: { products: ['old'] },
});

test('a product patch changes only the fields sent, keeps the stock the client sold down to, and is stamped so devices take it', () => {
  const cfg = cleanConfig({ rows: { products: [{ id: 'p1', price: 350, modifierIds: ['m1'] }] } });
  const out = applyConfig(payload(), cfg, NOW);
  assert.deepEqual(out.products.find((p) => p.id === 'p1'), { id: 'p1', name: 'Tea', price: 350, stock: 40, modifierIds: ['m1'], updatedAt: NOW });
  assert.equal(out.products.find((p) => p.id === 'p2').price, 500);
});

test('new rows are added whole with a creation time; removals leave a tombstone so no device brings them back', () => {
  const cfg = cleanConfig({ rows: { products: [{ id: 'p9', name: 'Latte', price: 450, category: 'Drinks' }] }, deleted: { products: ['p2'] } });
  const out = applyConfig(payload(), cfg, NOW);
  assert.deepEqual(out.products.map((p) => p.id).sort(), ['p1', 'p9']);
  assert.equal(out.products.find((p) => p.id === 'p9').createdAt, NOW);
  assert.deepEqual(out.deletedIds.products.sort(), ['old', 'p2']);
});

test('sales, customers, staff and stock are never changed, and blocked settings are dropped', () => {
  const cfg = cleanConfig({
    rows: { products: [{ id: 'p1', price: 1 }], users: [{ id: 'u1', pin: '0000' }], inventory: [{ id: 'i1', qty: 0 }] },
    settings: { kotPrinter: 'Kitchen', ownerAuth: { h: 2 }, subscription: { enforced: false }, features: {}, usbPrinter: { vendorId: 1 }, supportCode: '1', tableLayout_l1: [{ id: 't1' }], 'bad key': 1 },
  });
  assert.deepEqual(Object.keys(cfg.settings).sort(), ['kotPrinter', 'tableLayout_l1']);
  assert.deepEqual(Object.keys(cfg.rows).sort(), ['locations', 'modifiers', 'products', 'subcategories']);
  const before = payload();
  const out = applyConfig(before, cfg, NOW);
  for (const k of ['sales', 'customers', 'users', 'inventory']) assert.deepEqual(out[k], before[k]);
  assert.deepEqual(out.settings.ownerAuth, { h: 1 });
  assert.equal(out.settings.kotPrinter, 'Kitchen');
  assert.equal(out.syncMeta.settings.kotPrinter, NOW);
  assert.equal(out.syncMeta.settings.business, '2026-10-01T00:00:00Z');
  assert.equal(before.products[0].price, 300, 'the input is not modified');
});

test('categories are added without duplicates and removed with a tombstone; a re-added name is live again', () => {
  const out = applyConfig(payload(), cleanConfig({ categories: { add: ['Bakery', 'drinks'], remove: ['Food'] } }), NOW);
  assert.deepEqual(out.categories, ['Bakery', 'Drinks']);
  assert.deepEqual(out.deletedIds.categories, ['food']);
  const back = applyConfig(out, cleanConfig({ categories: { add: ['Food'] } }), NOW);
  assert.ok(back.categories.includes('Food'));
  assert.deepEqual(back.deletedIds.categories, []);
});

test('the summary counts what will change, and an oversized or malformed change is refused', () => {
  const cfg = cleanConfig({ rows: { products: [{ id: 'a' }, { id: 'b' }, { nope: 1 }], modifiers: [{ id: 'm' }] }, deleted: { products: ['x'] }, settings: { kotPrinter: 'K' } });
  assert.deepEqual(summarize(cfg), { rows: 3, deleted: 1, categories: 0, settings: 1 });
  assert.throws(() => cleanConfig({ rows: { products: Array.from({ length: 5001 }, (_, i) => ({ id: 'p' + i })) } }), /Too many/);
  assert.deepEqual(summarize(cleanConfig(null)), { rows: 0, deleted: 0, categories: 0, settings: 0 });
});
