const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) { return fs.readFileSync(path, 'utf8'); }

test('destructive account operations fail closed behind transactional backup RPCs', function() {
  const handler = read('netlify/functions/account-danger-zone.js');
  const schema = read('supabase/schema.sql');
  assert.match(handler, /reset_workspace_with_backup/);
  assert.match(handler, /delete_workspace_with_backup/);
  assert.match(handler, /No data was cleared/);
  assert.match(schema, /create or replace function public\.reset_workspace_with_backup/);
  assert.match(schema, /create or replace function public\.delete_workspace_with_backup/);
  assert.match(schema, /accountDangerBackups/);
  assert.match(schema, /grant execute .* to service_role/);
});

test('operational health endpoints do not expose secrets', function() {
  const health = read('netlify/functions/health.js');
  const ready = read('netlify/functions/ready.js');
  assert.match(health, /Cache-Control': 'no-store/);
  assert.match(ready, /Authentication required/);
  assert.match(ready, /Not allowed/);
  assert.match(ready, /serviceRole: !!process\.env\.SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(ready, /\{ ok, checks, time:/);
});

test('deployment applies baseline transport and browser security headers', function() {
  const config = read('netlify.toml');
  assert.match(config, /Strict-Transport-Security/);
  assert.match(config, /Permissions-Policy/);
  assert.match(config, /Content-Security-Policy-Report-Only/);
});

test('privileged API responses do not use wildcard CORS', function() {
  const facade = read('netlify/lib/supabase.js');
  assert.doesNotMatch(facade, /'Access-Control-Allow-Origin': '\*'/);
  assert.match(facade, /'Vary': 'Origin'/);
});
