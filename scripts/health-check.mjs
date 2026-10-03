import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const ignoredDirectories = new Set(['.git', 'node_modules', 'tmp', 'output', 'dist', 'build', 'supabase', 'cls-github-upload', 'cls_site 3']);
const failures = [];
const warnings = [];
const packageTypeCache = new Map();

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

function packageType(directory) {
  if (packageTypeCache.has(directory)) return packageTypeCache.get(directory);
  const packageFile = path.join(directory, 'package.json');
  let type = null;
  if (fs.existsSync(packageFile)) {
    try {
      type = JSON.parse(fs.readFileSync(packageFile, 'utf8')).type || null;
    } catch {
      type = null;
    }
  }
  packageTypeCache.set(directory, type);
  return type;
}

function isModuleFile(file) {
  let directory = path.dirname(file);
  while (directory.startsWith(root)) {
    if (packageType(directory) === 'module') return true;
    if (directory === root) break;
    directory = path.dirname(directory);
  }
  return false;
}

const files = walk(root);
const javascriptFiles = files.filter((file) => file.endsWith('.js'));
const htmlFiles = files.filter((file) => file.endsWith('.html'));

for (const file of javascriptFiles) {
  if (isModuleFile(file)) continue;
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
    // /posv2/ is the React POS: it only exists after `pos-react` is built, and Netlify rewrites it (see netlify.toml).
    if (/^\/?posv2(?:\/|$)/.test(target)) continue;
    let resolved = target.startsWith('/')
      ? path.join(root, target.slice(1))
      : path.resolve(path.dirname(file), target);
    if (target.startsWith('/') && !fs.existsSync(resolved)) {
      resolved = path.resolve(path.dirname(file), target.slice(1));
    }
    if (!fs.existsSync(resolved)) failures.push(`${relative(file)}: missing local reference ${match[1]}`);
  }
}

const secretPatterns = [
  ['Google API key', /AIza[0-9A-Za-z_-]{20,}/],
  ['Stripe live key', /sk_live_[0-9A-Za-z]+/],
  ['Appwrite service-role JWT', /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/]
];

const generatedBinaryBundles = new Set(['assets/azure-swim-products.js']);
for (const file of files.filter((item) => /\.(?:html|js|mjs|json|toml|sql|md)$/.test(item) && !generatedBinaryBundles.has(relative(item)))) {
  const source = fs.readFileSync(file, 'utf8');
  for (const [label, pattern] of secretPatterns) {
    if (pattern.test(source)) failures.push(`${relative(file)}: possible committed ${label}`);
  }
}


if (warnings.length) console.warn(`Warnings:\n- ${warnings.join('\n- ')}`);
if (failures.length) {
  console.error(`Health check failed:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log(`Health check passed: ${javascriptFiles.length} scripts and ${htmlFiles.length} HTML pages inspected.`);
