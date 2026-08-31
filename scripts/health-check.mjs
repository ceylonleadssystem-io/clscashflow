import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const ignoredDirectories = new Set(['.git', 'node_modules', 'tmp', 'output', 'dist', 'build']);
const failures = [];
const warnings = [];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (ignoredDirectories.has(entry.name)) return [];
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function relative(file) {
  return path.relative(root, file) || '.';
}

const files = walk(root);
const javascriptFiles = files.filter((file) => file.endsWith('.js'));
const htmlFiles = files.filter((file) => file.endsWith('.html'));

for (const file of javascriptFiles) {
  try {
    new vm.Script(fs.readFileSync(file, 'utf8'), { filename: relative(file) });
  } catch (error) {
    failures.push(`${relative(file)}: ${error.message}`);
  }
}

for (const file of htmlFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const scripts = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const references = /(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  let match;
  let index = 0;

  while ((match = scripts.exec(source))) {
    index += 1;
    if (/\bsrc\s*=/.test(match[1]) || /type\s*=\s*["']application\/ld\+json/.test(match[1])) continue;
    try {
      new vm.Script(match[2], { filename: `${relative(file)}#inline-${index}` });
    } catch (error) {
      failures.push(`${relative(file)} inline script ${index}: ${error.message}`);
    }
  }

  while ((match = references.exec(source))) {
    let target = match[1].trim();
    if (!target || /^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(target) || /[{$]/.test(target)) continue;
    target = target.split(/[?#]/)[0];
    if (!target) continue;
    const resolved = target.startsWith('/')
      ? path.join(root, target.slice(1))
      : path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) failures.push(`${relative(file)}: missing local reference ${match[1]}`);
  }
}

const secretPatterns = [
  ['Google API key', /AIza[0-9A-Za-z_-]{20,}/],
  ['Stripe live key', /sk_live_[0-9A-Za-z]+/],
  ['Supabase service-role JWT', /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/]
];

for (const file of files.filter((item) => /\.(?:html|js|mjs|json|toml|sql|md)$/.test(item))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const [label, pattern] of secretPatterns) {
    if (pattern.test(source)) failures.push(`${relative(file)}: possible committed ${label}`);
  }
}

const primaryPos = path.join(root, 'pos-system', 'pos-system.html');
const mirrorPos = path.join(root, '.pos-system', 'pos-system.html');
if (fs.existsSync(primaryPos) && fs.existsSync(mirrorPos)) {
  if (fs.readFileSync(primaryPos, 'utf8') !== fs.readFileSync(mirrorPos, 'utf8')) {
    warnings.push('The hidden .pos-system mirror differs from pos-system/pos-system.html.');
  }
}

if (warnings.length) console.warn(`Warnings:\n- ${warnings.join('\n- ')}`);
if (failures.length) {
  console.error(`Health check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`Health check passed: ${javascriptFiles.length} scripts and ${htmlFiles.length} HTML pages inspected.`);
