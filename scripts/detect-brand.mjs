// Reads a project and suggests its video brand: name, summary, URL, logo candidates, colours and fonts.
//   node <skill>/scripts/detect-brand.mjs --project <root>                       print JSON (review it)
//   node <skill>/scripts/detect-brand.mjs --project <root> --write <root>/videos [--logo <file>]
//        copies the logo (best candidate, or --logo) to videos/public/brand/, merges name/colours/fonts
//        into video.config.json and regenerates src/brand.ts.
// Heuristics only: an agent (or you) should check the result against the real site before approving.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined; };
const root = path.resolve(arg('project') ?? process.cwd());
const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out', '.turbo', '.vercel', 'coverage', 'videos', 'education-videos', '.expo', 'android', 'ios', 'vendor', '.cache', 'test-results', 'e2e-report']);

const files = [];
(function walk(dir, depth) {
  if (depth > 6) return;
  let entries = [];
  try { entries = fs.readdirSync(dir, {withFileTypes: true}); } catch { return; }
  for (const e of entries) {
    if (e.name.startsWith('.') && e.name !== '.env' && e.name !== '.env.local' && e.name !== '.env.example') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(p, depth + 1); } else files.push(p);
  }
})(root, 0);
const read = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
const rel = (f) => path.relative(root, f).replace(/\\/g, '/');

// ---------- name, summary, url ----------
const pkg = (() => { try { return JSON.parse(read(path.join(root, 'package.json'))); } catch { return {}; } })();
const readme = read(files.find((f) => /^readme\.md$/i.test(path.basename(f)) && path.dirname(f) === root) ?? '');
const readmeTitle = readme.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, '').trim();
const readmePara = readme.split(/\r?\n\r?\n/).map((s) => s.trim()).find((s) => s && !s.startsWith('#') && !s.startsWith('<') && !s.startsWith('[') && !s.startsWith('!') && s.length > 40 && !/^(\d+\.|[-*]|\x60\x60\x60|>)/.test(s) && !/npm |yarn |pnpm |git clone/.test(s));
const prettify = (s) => s?.replace(/^@[^/]+\//, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const name = readmeTitle && readmeTitle.length < 40 ? readmeTitle : prettify(pkg.name) ?? path.basename(root);
let url = pkg.homepage;
for (const f of files.filter((f) => /\.env(\.local|\.example|\.production)?$/.test(f))) {
  // only URL-looking keys, never secrets
  const m = read(f).match(/^(?:NEXT_PUBLIC_|VITE_|PUBLIC_)?(?:SITE|APP|BASE|PUBLIC)_URL=["']?(https?:\/\/[^\s"']+)/m);
  if (m && !/localhost|127\.0\.0\.1/.test(m[1])) { url = m[1]; break; }
}

// ---------- logo candidates ----------
const IMG = /\.(svg|png|webp|jpe?g)$/i;
const logos = files.filter((f) => IMG.test(f) && /logo|brand|wordmark|icon|favicon|apple-touch|mark/i.test(rel(f)) && !/icons?\/(?!.*logo)/i.test(rel(f)))
  .map((f) => {
    const n = rel(f).toLowerCase();
    const size = fs.statSync(f).size;
    let score = 0;
    if (/logo|wordmark/.test(path.basename(n))) score += 6;
    if (/brand/.test(n)) score += 2;
    if (/\.svg$/.test(n)) score += 3;
    if (/white|light|dark-bg|on-dark|inverse/.test(n)) score += 2;
    if (/favicon|apple-touch|icon-\d|android-chrome/.test(n)) score -= 3;
    if (/public\//.test(n)) score += 1;
    if (size > 8000) score += 1;
    if (size < 600) score -= 4;
    return {file: rel(f), score, kb: Math.round(size / 1024)};
  })
  .sort((a, b) => b.score - a.score).slice(0, 8);

// ---------- colours ----------
const hslToHex = (h, s, l) => {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, '0');
  return `#${f(0)}${f(8)}${f(4)}`;
};
const colours = {};
const styleFiles = files.filter((f) => /tailwind\.config\.(js|ts|cjs|mjs)$|\.(css|scss)$|theme\.(ts|js)$|tokens?\.(json|ts|js)$|colors?\.(ts|js)$/i.test(f)).slice(0, 40);
for (const f of styleFiles) {
  const t = read(f);
  // CSS vars: --primary: #d946ef;  or shadcn --primary: 262 83% 58%;  or oklch (skipped)
  for (const m of t.matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8}|(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%)/g)) {
    const key = m[1].toLowerCase();
    if (!colours[key]) colours[key] = m[2].startsWith('#') ? m[2] : hslToHex(+m[3], +m[4], +m[5]);
  }
  // tailwind/theme objects: primary: '#d946ef'  or  primary: { DEFAULT: '#...' }
  for (const m of t.matchAll(/['"]?([\w-]+)['"]?\s*:\s*(?:\{\s*DEFAULT\s*:\s*)?['"](#[0-9a-fA-F]{3,8})['"]/g)) {
    const key = m[1].toLowerCase();
    if (!colours[key]) colours[key] = m[2];
  }
}
const pickColour = (...keys) => keys.map((k) => colours[k]).find(Boolean);
const lum = (hex) => { const h = hex?.replace('#', ''); if (!h || h.length < 6) return 1; const n = parseInt(h.slice(0, 6), 16); return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; };
const primary = pickColour('primary', 'brand', 'brand-primary', 'accent', 'magenta', 'purple', 'blue');
const secondary = pickColour('secondary', 'brand-secondary', 'purple', 'violet', 'accent');
const bgRaw = pickColour('background', 'bg', 'dark', 'surface');
const mapped = {
  ...(primary ? {primary} : {}),
  ...(secondary && secondary !== primary ? {secondary} : {}),
  ...(colours.accent && colours.accent !== primary && lum(colours.accent) < 0.85 ? {accent: colours.accent} : {}),
  // the kit is dark-first: only take the site background if it is dark
  ...(bgRaw && lum(bgRaw) < 0.25 ? {bg: bgRaw} : {}),
  ...(colours.surface && lum(colours.surface) < 0.3 ? {surface: colours.surface} : {}),
  ...(colours.card && lum(colours.card) < 0.35 ? {card: colours.card} : {}),
};

// ---------- fonts ----------
const fonts = new Set();
for (const f of files.filter((f) => /\.(tsx?|jsx?|css|scss|html)$/.test(f)).slice(0, 4000)) {
  const t = read(f);
  if (!/next\/font\/google|fonts\.googleapis|font-family|fontFamily/.test(t)) continue;
  for (const m of t.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]next\/font\/google['"]/g)) m[1].split(',').forEach((x) => fonts.add(x.trim().split(/\s+as\s+/)[0].replace(/_/g, ' ')));
  for (const m of t.matchAll(/fonts\.googleapis\.com\/css2?\?family=([^"'&)]+)/g)) m[1].split('&family=').forEach((x) => fonts.add(decodeURIComponent(x.split(':')[0]).replace(/\+/g, ' ')));
}
const fontList = [...fonts].filter(Boolean).slice(0, 6);

const wordmark = name.toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, '').slice(0, 14);
const result = {
  project: {name, summary: pkg.description || readmePara?.replace(/\s+/g, ' ').slice(0, 220) || '', url: url || ''},
  brand: {name, wordmark, tagline: pkg.description?.slice(0, 90) || '', logoCandidates: logos, colors: mapped, fonts: fontList},
  found: {colours, styleFiles: styleFiles.map(rel)},
};

const out = arg('write');
if (!out) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }

// ---------- --write ----------
const videos = path.resolve(out);
const cfgPath = path.join(videos, 'video.config.json');
if (!fs.existsSync(cfgPath)) throw new Error(`${cfgPath} not found: scaffold first`);
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const logo = arg('logo') ? path.resolve(arg('logo')) : logos[0] ? path.join(root, logos[0].file) : null;
if (logo && fs.existsSync(logo)) {
  const dst = `brand/logo${path.extname(logo).toLowerCase()}`;
  fs.mkdirSync(path.join(videos, 'public', 'brand'), {recursive: true});
  fs.copyFileSync(logo, path.join(videos, 'public', dst));
  cfg.brand.logo = dst;
  console.log(`logo  ${rel(logo)} → public/${dst}`);
} else console.warn('!! no logo found: keep the placeholder or pass --logo <file>');
cfg.project = {...cfg.project, name, summary: result.project.summary || cfg.project.summary, url: result.project.url || cfg.project.url};
cfg.brand = {...cfg.brand, name, wordmark, ...(result.brand.tagline ? {tagline: result.brand.tagline} : {}), colors: {...cfg.brand.colors, ...mapped}};
// fonts: use detected Google families when @remotion/google-fonts has them
const gf = (fam) => fs.existsSync(path.join(videos, 'node_modules', '@remotion', 'google-fonts', 'dist', 'cjs', `${fam.replace(/[^A-Za-z0-9]/g, '')}.js`));
const usable = fontList.filter((f) => !fs.existsSync(path.join(videos, 'node_modules')) || gf(f));
if (usable[0]) cfg.brand.fonts.body = {family: usable[0], weights: ['400', '500', '600']};
if (usable[1]) cfg.brand.fonts.head = {family: usable[1], weights: ['600', '800']};
if (cfg.publish) cfg.publish.site = cfg.publish.site === 'https://example.com' ? result.project.url || cfg.publish.site : cfg.publish.site;
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
console.log(`brand ${name} · colours ${Object.keys(mapped).join(', ') || '(template defaults)'} · fonts ${usable.join(', ') || '(template defaults)'}`);
const r = spawnSync(process.execPath, ['scripts/brand.mjs'], {cwd: videos, stdio: 'inherit'});
if (r.status !== 0) process.exit(r.status ?? 1);
