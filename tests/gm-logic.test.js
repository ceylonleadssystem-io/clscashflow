const test = require('node:test');
const assert = require('node:assert/strict');

const load = () => import('../reservation-system/js/logic.mjs');
const T = [{ id: 't1', number: '1', seats: 2 }, { id: 't2', number: '2', seats: 4 }, { id: 't3', number: '3', seats: 4 }];
const res = (o) => Object.assign({ id: 'r' + Math.random(), date: '2026-10-13', time: '19:00', duration: 90, party: 2, status: 'booked', tableIds: ['t1'] }, o);

test('overlap includes the turnaround buffer and ignores cancelled bookings', async () => {
  const L = await load();
  const all = [res({ id: 'a' }), res({ id: 'b', tableIds: ['t2'], status: 'cancelled' })];
  assert.equal(L.isFree('t1', '2026-10-13', '20:30', 90, all, { buffer: 0 }), true);
  assert.equal(L.isFree('t1', '2026-10-13', '20:30', 90, all, { buffer: 15 }), false);
  assert.equal(L.isFree('t2', '2026-10-13', '19:00', 90, all), true);
  assert.equal(L.isFree('t1', '2026-10-13', '19:00', 90, all, { exclude: 'a' }), true);
});

test('suggestTables picks the smallest fit, then a pair, then nothing', async () => {
  const L = await load();
  const q = (party, all) => L.suggestTables(T, all || [], { date: '2026-10-13', time: '19:00', party, duration: 90 });
  assert.deepEqual(q(2), ['t1']);
  assert.deepEqual(q(4), ['t2']);
  assert.deepEqual(q(6), ['t1', 't2']);
  assert.deepEqual(q(9, [res({ tableIds: ['t1'] })]), []);
});

test('slotsFor lists only times a table is free; waitMinutes counts down to the earliest free table', async () => {
  const L = await load();
  const svc = { name: 'Dinner', start: '18:00', end: '21:00', duration: 90 };
  const all = [res({ tableIds: ['t1'], time: '18:00' })];
  const slots = L.slotsFor(svc, [T[0]], all, { date: '2026-10-13', party: 2, step: 30 });
  assert.deepEqual(slots.map((s) => s.time), ['19:30']);
  assert.equal(L.waitMinutes([T[0]], all, { date: '2026-10-13', party: 2, now: L.toMin('18:30'), duration: 30 }), 60);
  assert.equal(L.waitMinutes([T[0]], all, { date: '2026-10-13', party: 5, now: 0 }), null);
});

test('guest stats: visits, no-shows, loyalty tier and risk flag', async () => {
  const L = await load();
  const s = Object.assign({}, L.DEFAULT_SETTINGS, { silverVisits: 2, noShowLimit: 1 });
  const rs = [res({ guestId: 'g', status: 'completed' }), res({ guestId: 'g', status: 'completed' }), res({ guestId: 'g', status: 'no_show' })];
  const st = L.guestStats({ id: 'g' }, rs, s, 250);
  assert.deepEqual([st.visits, st.noShows, st.tier, st.risky, st.points], [2, 1, 'Silver', true, 22]);
});

test('billsFor matches table checks after seating; totals include discount and refunds', async () => {
  const L = await load();
  const seated = new Date(Date.now() - 3600000).toISOString();
  const r = res({ seatedAt: seated, status: 'seated' });
  const sales = [
    { receipt: '1', orderReference: 'Table 1', createdAt: new Date().toISOString(), total: 90, discount: { amount: 10 }, refunds: [{ amount: 5 }] },
    { receipt: '2', orderReference: 'Table 2', createdAt: new Date().toISOString(), total: 50 },
    { receipt: '3', orderReference: 'Table 1', createdAt: new Date(Date.now() - 86400000).toISOString(), total: 70 },
  ];
  const bills = L.billsFor(r, sales, null, { t1: '1' });
  assert.deepEqual(bills.map((b) => b.receipt), ['1']);
  assert.deepEqual(L.billTotals(bills), { count: 1, paid: 90, discount: 10, refunded: 5 });
});

test('report counts statuses, source revenue, utilisation and repeat guests', async () => {
  const L = await load();
  const rs = [res({ id: 'a', guestId: 'g', status: 'completed', source: 'Phone' }), res({ id: 'b', guestId: 'g', status: 'completed', source: 'Phone', date: '2026-10-14' }), res({ id: 'c', status: 'cancelled', cancelReason: 'Weather', source: 'Web' }), res({ id: 'd', status: 'no_show' })];
  const r = L.buildReport(rs, T, L.DEFAULT_SETTINGS, { from: '2026-10-13', to: '2026-10-14', revenue: { a: 100, b: 50 } });
  assert.deepEqual([r.total, r.cancelled, r.noShows, r.repeatGuests, r.revenue], [4, 1, 1, 1, 150]);
  assert.equal(r.bySource.Phone.revenue, 150);
  assert.equal(r.reasons.Weather, 1);
});

test('phone matching, WhatsApp numbers and message templates', async () => {
  const L = await load();
  assert.equal(L.samePhone('077 123 4567', '+94771234567'), true);
  assert.equal(L.waPhone('0771234567', '94'), '94771234567');
  assert.equal(L.fill('Hi {name}, {party}', { name: 'Sam', party: 4 }), 'Hi Sam, 4');
});

test('POS bridge: layout per location with shared fallback, and idempotent customer write-back', async () => {
  const P = await import('../reservation-system/js/pos.mjs');
  const pos = { found: true, settings: { tableLayout: [{ id: 'a', number: '1', seats: 2 }], tableLayout_L2: [{ id: 'b', number: '9', seats: 4, active: false }, { id: 'c', number: '8', seats: 6 }] } };
  assert.deepEqual(P.tablesFor(pos, { layoutFrom: 'pos', locationId: '' }).map((t) => t.id), ['a']);
  assert.deepEqual(P.tablesFor(pos, { layoutFrom: 'pos', locationId: 'L2' }).map((t) => t.id), ['c']);
  assert.equal(P.tablesFor(pos, { layoutFrom: 'own', ownTables: [{ id: 'g1', number: '1', seats: 2 }] })[0].id, 'g1');
  const existing = { id: 'c1', name: 'Old', phone: '0771234567', tags: 'vip, GM:Bronze', notes: 'Likes tea', discountEligible: true, discountValue: 10, createdAt: 'x' };
  const g = { id: 'g1', name: 'Nimal', phone: '0771234567', email: 'n@x.lk', allergies: 'nuts', preferences: '' };
  const once = P.toPosCustomer(g, existing, 'Gold');
  const twice = P.toPosCustomer(g, once, 'Gold');
  assert.equal(once.discountValue, 10);
  assert.equal(once.tags, 'vip, GM:Gold');
  assert.equal(once.notes, 'Likes tea\n[GM]\nAllergies: nuts\n[/GM]');
  assert.equal(twice.notes, once.notes);
  assert.equal(P.toPosCustomer(g, null, 'Bronze').id, 'c-gm-g1');
});

test('Guest Manager feature switch: off unless switched on, per-location override and plan exclusion win', async () => {
  const P = await import('../reservation-system/js/pos.mjs');
  const id = 'view.guestManager', on = { found: true, settings: { features: { [id]: true } } };
  assert.equal(P.gmAllowed(on, ''), true);
  assert.equal(P.gmAllowed({ found: true, settings: {} }, ''), false); // never switched on
  assert.equal(P.gmAllowed({ found: false, settings: { features: { [id]: true } } }, ''), false);
  assert.equal(P.gmAllowed({ found: true, settings: { features: { [id]: true }, locationFeatures: { L1: { [id]: false } } } }, 'L1'), false);
  assert.equal(P.gmAllowed({ found: true, settings: { features: { [id]: true }, locationFeatures: { L1: { [id]: false } } } }, ''), true);
  assert.equal(P.gmAllowed({ found: true, settings: { features: { [id]: true }, subscription: { enforced: true, featuresOff: [id] } } }, ''), false);
  assert.equal(P.gmAllowed({ found: true, settings: { features: { [id]: true }, subscription: { enforced: false, featuresOff: [id] } } }, ''), true);
});

test('seatingMap: first name, POS customer and every table of a seated party; others are left out', async () => {
  const L = await load();
  const rs = [
    res({ id: 'a', guestId: 'g', name: 'Nimal Perera', status: 'seated', tableIds: ['t1', 't2'], seatedAt: '2026-10-13T12:00:00Z' }),
    res({ id: 'b', guestId: 'g', status: 'completed' }),
    res({ id: 'c', name: 'Walk-in', status: 'seated', tableIds: ['t3'], seatedAt: '2026-10-13T12:05:00Z' }),
    res({ id: 'd', status: 'booked', tableIds: ['t9'] }),
  ];
  const m = L.seatingMap(rs, [{ id: 'g', name: 'Nimal Perera', phone: '0771234567', email: 'n@x.lk' }]);
  assert.deepEqual(Object.keys(m).sort(), ['t1', 't2', 't3']);
  assert.deepEqual([m.t1.name, m.t1.customerId, m.t1.phone, m.t2.resId], ['Nimal', 'c-gm-g', '0771234567', 'a']);
  assert.equal(m.t1.fullName, 'Nimal Perera');
  assert.equal(m.t3.customerId, undefined);
  assert.equal(m.t1.tier, undefined);
});
