const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'pos-system', 'pos-system.html'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'netlify', 'functions', 'pos-admin-data.js'), 'utf8');

test('locations are a universal POS capability rather than a business preset', () => {
  assert.match(html, /installBusinessLocations/);
  assert.match(html, /Branches are available for every business and POS type/);
  assert.doesNotMatch(html, /businessType[^\n]{0,120}locations/);
});

test('location management stays inside the Business Profile settings tab', () => {
  assert.match(html, /section=document\.getElementById\('settings-section-business'\)/);
  assert.match(html, /var host=section\|\|root/);
  assert.match(html, /if\(panel\.parentElement!==host\)/);
});

test('new and legacy accounts receive a main location', () => {
  assert.match(html, /id:'loc-main',name:'Main Location',code:'MAIN'/);
  assert.match(html, /if\(!clean\.locations\.length\)clean\.locations\.push/);
  assert.match(admin, /locations: \[\{ id: 'loc-main', name: 'Main Location'/);
});

test('staff access and sessions enforce selected locations', () => {
  assert.match(html, /locationAccess:'all'/);
  assert.match(html, /Choose at least one location for this user/);
  assert.match(html, /You do not have access to that location/);
  assert.match(html, /All Locations is available for reporting roles only/);
  assert.match(html, /Choose a real location before starting checkout/);
});

test('operational records and inventory are location aware', () => {
  assert.match(html, /\['sales','openOrders','cashShifts','timeEntries','stockMovements','voidOrders','customerCommunications','kitchenTickets'\]/);
  assert.match(html, /item\.locationQuantities\[loc\.id\]/);
  assert.match(html, /businessId=businessId;item\.locationId=loc/);
  assert.match(html, /locationAudit/);
  assert.match(html, /stockTransfers/);
});
