// Public pages must stay open to search engines and AI crawlers; private areas must stay out of them.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

/** Groups of robots.txt: [{ agents: [...], rules: [[directive, value]] }] */
function groups(text) {
  const out = [];
  let cur = null;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/#.*/, '').trim();
    if (!line) continue;
    const [k, ...v] = line.split(':');
    const key = k.trim().toLowerCase();
    const value = v.join(':').trim();
    if (key === 'user-agent') {
      if (!cur || cur.rules.length) out.push((cur = { agents: [], rules: [] }));
      cur.agents.push(value);
    } else if (cur && (key === 'allow' || key === 'disallow')) cur.rules.push([key, value]);
  }
  return out;
}

test('robots.txt names the AI crawlers and lets them read the public site', () => {
  const g = groups(read('robots.txt'));
  const named = g.flatMap((x) => x.agents);
  for (const bot of ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'CCBot']) {
    assert.ok(named.includes(bot), bot + ' is listed');
  }
  for (const grp of g) {
    assert.ok(grp.rules.some(([d, v]) => d === 'allow' && v === '/'), grp.agents[0] + ' may read the site');
    assert.ok(!grp.rules.some(([d, v]) => d === 'disallow' && (v === '/' || v === '')), grp.agents[0] + ' is not blocked from everything');
    for (const p of ['/admin', '/posv2/', '/GM', '/KDS']) assert.ok(grp.rules.some(([d, v]) => d === 'disallow' && v === p), p + ' is private for ' + grp.agents[0]);
  }
  assert.match(read('robots.txt'), /^Sitemap: https:\/\/www\.ceylonrylabs\.io\/sitemap\.xml$/m);
});

test('sitemap lists only pages that exist and are not blocked', () => {
  const urls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(urls.length >= 4);
  const blocked = groups(read('robots.txt')).at(-1).rules.filter(([d]) => d === 'disallow').map(([, v]) => v);
  for (const u of urls) {
    const p = new URL(u).pathname;
    assert.ok(!blocked.some((b) => b && p.startsWith(b)), p + ' is not disallowed');
    const file = p === '/' ? 'index.html' : p.replace(/^\//, '');
    const exists = fs.existsSync(path.join(root, file)) || fs.existsSync(path.join(root, file + '.html')) || /\[\[redirects\]\]\s*\n\s*from = "\/mrs-gamage-story"/.test(read('netlify.toml'));
    assert.ok(exists, p + ' exists');
  }
});

test('public pages carry no noindex, in the page or in the headers', () => {
  for (const f of ['index.html', 'pos-onboarding.html', 'mrs-gamage-story.html', 'privacy.html', 'terms.html']) {
    assert.doesNotMatch(read(f), /<meta[^>]+name=["']robots["'][^>]*noindex/i, f);
  }
  const toml = read('netlify.toml');
  const noindexPaths = [...toml.matchAll(/for = "([^"]+)"\s*\n\s*\[headers\.values\]([^[]*)/g)].filter((m) => /noindex/.test(m[2])).map((m) => m[1]);
  for (const p of ['/', '/index.html', '/pos-onboarding.html', '/mrs-gamage-story', '/privacy.html', '/terms.html', '/sitemap.xml', '/robots.txt', '/llms.txt']) {
    assert.ok(!noindexPaths.includes(p), p + ' has no X-Robots-Tag noindex');
  }
  for (const p of ['/admin', '/posv2/admin', '/GM', '/KDS']) assert.ok(noindexPaths.includes(p), p + ' stays noindex');
});
