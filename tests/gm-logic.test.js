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
  assert.deepEqual(P.tablesFor(pos, { layoutFrom: 'pos', locationId: 'L2' }).filter((t) => t.active).map((t) => t.id), ['c']);
  assert.deepEqual(P.tablesFor(pos, { layoutFrom: 'pos', locationId: 'L2' }).map((t) => t.id), ['b', 'c']); // inactive tables are kept so the editor never drops them
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

test('gmStatus says why Guest Manager is blocked', async () => {
  const P = await import('../reservation-system/js/pos.mjs');
  const id = 'view.guestManager', why = (p, loc = '') => P.gmStatus(p, loc).why;
  assert.match(why({ found: false }), /No POS data/);
  assert.match(why({ found: true, settings: { features: { other: true } } }), /not been saved/);
  assert.match(why({ found: true, settings: { features: { [id]: false } } }), /switch is off/);
  assert.match(why({ found: true, settings: { features: { [id]: true }, locationFeatures: { L1: { [id]: false } } } }, 'L1'), /location/);
  assert.match(why({ found: true, settings: { features: { [id]: true }, subscription: { enforced: true, name: 'POS Starter', featuresOff: [id] } } }), /POS Starter/);
  assert.equal(P.gmStatus({ found: true, settings: { features: { [id]: true } } }).why, '');
});

test('floors: pairs are only joined on one floor, numbers must be unique across floors, own tables get a grid per floor', async () => {
  const L = await load();
  const two = [{ id: 'a', number: '1', seats: 2, floor: 'main' }, { id: 'b', number: '2', seats: 2, floor: 'roof' }, { id: 'c', number: '3', seats: 2, floor: 'main' }];
  const q = { date: '2026-10-13', time: '19:00', party: 4, duration: 90 };
  assert.deepEqual(L.suggestTables(two, [], q).sort(), ['a', 'c']);
  assert.deepEqual(L.suggestTables(two.slice(0, 2), [], q), []); // 2 + 2 seats exist, but on different floors
  assert.equal(L.layoutError([{ id: 'main', name: 'Ground' }, { id: 'f', name: 'Roof' }], { main: [{ number: '1' }], f: [{ number: '1' }] }), 'Table 1 appears twice. Table numbers must be different on every floor.');
  assert.match(L.layoutError([{ id: 'main', name: 'A' }, { id: 'f', name: 'a' }], {}), /Two floors/);
  assert.equal(L.layoutError([{ id: 'main', name: 'A' }, { id: 'f', name: 'B' }], { main: [{ number: '1' }], f: [{ number: '2' }] }), '');
  const own = L.ownLayout([{ id: 'x', number: '1', seats: 2 }, { id: 'y', number: '2', seats: 4, floor: 'roof' }, { id: 'z', number: '3', seats: 4, floor: 'roof', x: 300, y: 200, w: 120, shape: 'round' }]);
  assert.deepEqual(own.map((t) => [t.floor, t.shape]), [['main', 'round'], ['roof', 'square'], ['roof', 'round']]);
  assert.deepEqual([own[2].x, own[2].y, own[2].w], [300, 200, 120]);
  assert.equal(L.overlapsOthers([{ id: 'a', x: 0, y: 0, w: 100, h: 100 }], { id: 'b', x: 50, y: 50, w: 100, h: 100 }), true);
  assert.equal(L.nextTableNumber([{ number: '1' }, { number: '3' }]), '2');
});

test('floors from the POS: main floor keeps the old layout key, others have their own, location defaults to the first', async () => {
  const P = await import('../reservation-system/js/pos.mjs');
  const pos = { found: true, locations: [{ id: 'L1' }], settings: { tableLayout_L1: [{ id: 'm', number: '1', seats: 2 }], tableFloors_L1: [{ id: 'main', name: 'Ground' }, { id: 'fl-a', name: 'Terrace' }], tableLayout_L1__fl_a: [], 'tableLayout_L1__fl-a': [{ id: 't', number: '11', seats: 4 }] } };
  const cfg = { layoutFrom: 'pos', locationId: '' };
  assert.equal(P.effectiveLocation(pos, cfg), 'L1');
  assert.deepEqual(P.floorsOf(pos, cfg).map((f) => f.name), ['Ground', 'Terrace']);
  assert.deepEqual(P.tablesFor(pos, cfg).map((t) => t.number + '@' + t.floor), ['1@main', '11@fl-a']);
  assert.deepEqual(P.floorsOf({ found: false, settings: {} }, { layoutFrom: 'own', ownFloors: [{ id: 'f', name: 'Roof' }] }).map((f) => f.id), ['main', 'f']);
});

test('BUG 011: GM sends each table its bookings for the given days (not cancelled, not yet seated) for the POS floor plan', async () => {
  const L = await load();
  const all = [
    res({ id: 'a', name: 'Test Customer', time: '19:00', duration: 120, tableIds: ['t4', 't5'], party: 8 }),
    res({ id: 'b', status: 'cancelled', tableIds: ['t4'] }),
    res({ id: 'c', status: 'seated', tableIds: ['t1'] }),
    res({ id: 'd', date: '2026-10-20', tableIds: ['t2'] }),
  ];
  const map = L.bookingsMap(all, ['2026-10-13', '2026-10-14']);
  assert.deepEqual(Object.keys(map).sort(), ['t4', 't5']);
  assert.deepEqual(map.t4, [{ name: 'Test', party: 8, date: '2026-10-13', time: '19:00', duration: 120, status: 'booked', resId: 'a' }]);
});
