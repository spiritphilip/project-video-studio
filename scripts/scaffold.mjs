// Creates the video studio inside a project: copies the template, merges the setup answers into
// video.config.json, pulls the licensed media library from ~/.video-studio/library, writes a placeholder
// logo if none is set, and generates src/brand.ts.
//
// Usage: node <skill>/scripts/scaffold.mjs --project <path> [--dir videos] [--config answers.json] [--install] [--force]
//   --config   JSON merged into video.config.json (project, brand, answers, voices, tracks, presenter, publish …)
//   --install  run `npm install` afterwards
//   --force    overwrite template files that already exist (never touches episodes, scripts/videos, public/screens)
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const skill = path.resolve(here, '..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);

const project = path.resolve(arg('project', process.cwd()));
const dest = path.join(project, arg('dir', 'videos'));
const force = flag('force');
const home = process.env.VIDEO_STUDIO_HOME || path.join(os.homedir(), '.video-studio');
const version = fs.readFileSync(path.join(skill, 'VERSION'), 'utf8').trim();
const PROTECTED = [/^src[\\/]episodes[\\/](?!index\.ts$)/, /^scripts[\\/]videos[\\/]/, /^public[\\/](screens|photos|vo|presenter)[\\/]/, /^video\.config\.json$/, /^capture\.json$/, /^youtube[\\/]/];

let copied = 0, skipped = 0;
function copyDir(from, to, rel = '') {
  fs.mkdirSync(to, {recursive: true});
  for (const e of fs.readdirSync(from, {withFileTypes: true})) {
    const s = path.join(from, e.name), d = path.join(to, e.name), r = path.join(rel, e.name);
    if (e.isDirectory()) { copyDir(s, d, r); continue; }
    const exists = fs.existsSync(d);
    if (exists && (!force || PROTECTED.some((p) => p.test(r)))) { skipped++; continue; }
    fs.copyFileSync(s, d); copied++;
  }
}

const deepMerge = (a, b) => {
  if (Array.isArray(b) || typeof b !== 'object' || b === null) return b;
  const out = {...(a ?? {})};
  for (const [k, v] of Object.entries(b)) out[k] = deepMerge(a?.[k], v);
  return out;
};

const fresh = !fs.existsSync(path.join(dest, 'video.config.json'));
copyDir(path.join(skill, 'template'), dest);

// licensed media library (music, sfx, stock clips) lives only on this PC
const lib = path.join(home, 'library');
if (fs.existsSync(lib)) {
  for (const [from, to] of [['audio/music', 'public/audio/music'], ['audio/sfx', 'public/audio/sfx'], ['stock', 'public/stock']]) {
    const src = path.join(lib, from);
    if (!fs.existsSync(src)) continue;
    fs.mkdirSync(path.join(dest, to), {recursive: true});
    for (const f of fs.readdirSync(src)) if (!fs.existsSync(path.join(dest, to, f))) fs.copyFileSync(path.join(src, f), path.join(dest, to, f));
  }
} else {
  console.warn(`!! no media library at ${lib}: music/sfx/stock are missing. See references/assets.md to rebuild it.`);
}

// config
const cfgPath = path.join(dest, 'video.config.json');
let cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const answers = arg('config');
if (answers) cfg = deepMerge(cfg, JSON.parse(fs.readFileSync(path.resolve(answers), 'utf8')));
cfg.skillVersion = version;

// placeholder logo when the project has none yet
const logoFile = path.join(dest, 'public', cfg.brand.logo);
if (!fs.existsSync(logoFile)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="146" viewBox="0 0 1120 146"><text x="560" y="105" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="96" font-weight="900" fill="#ffffff" letter-spacing="4">${cfg.brand.wordmark.replace(/[<&>]/g, '')}</text></svg>`;
  fs.writeFileSync(path.join(dest, 'public', 'brand', 'logo.svg'), svg);
  cfg.brand.logo = 'brand/logo.svg';
  console.warn('!! no logo found: wrote a text placeholder public/brand/logo.svg (replace it with the real logo)');
}
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

execSync('node scripts/brand.mjs', {cwd: dest, stdio: 'inherit'});
if (flag('install')) execSync('npm install --loglevel=error', {cwd: dest, stdio: 'inherit'});

console.log(`\n${fresh ? 'Created' : 'Updated'} ${path.relative(process.cwd(), dest) || dest}  (template ${version}: ${copied} files copied, ${skipped} kept)`);
const rootTs = path.join(project, 'tsconfig.json');
if (fs.existsSync(rootTs) && !fs.readFileSync(rootTs, 'utf8').includes(path.basename(dest))) {
  console.log(`!! ${path.basename(dest)}/ must be excluded from the host project's tsconfig.json ("exclude": [..., "${path.basename(dest)}"]) or its type-check/build will pick it up.`);
}
console.log(`Next: cd ${path.basename(dest)} && npm install && npm run dev   (Studio at http://localhost:3000)`);
