// Creates the video studio inside a project: copies the template, merges the setup answers into
// video.config.json, copies music/sfx/stock from the shared media library (~/.video-studio/library,
// built from free open sources by library.mjs) with their credits, writes a placeholder logo if none
// is set, and generates src/brand.ts.
//
// Usage: node <skill>/scripts/scaffold.mjs --project <path> [--dir videos] [--config answers.json] [--install] [--force]
//   --config   JSON merged into video.config.json (project, brand, answers, voices, tracks, presenter, soundBrief, publish …)
//   --install  run `npm install` afterwards
//   --force    overwrite template files that already exist (never touches episodes, scripts/videos, public/screens)
// Env: VIDEO_STUDIO_HOME (default ~/.video-studio) · VIDEO_STUDIO_SKIP_LIBRARY=1 (don't fetch the library, e.g. in CI)
import {execSync, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);

const project = path.resolve(arg('project', process.cwd()));
const dest = path.join(project, arg('dir', 'videos'));
const force = flag('force');
const home = process.env.VIDEO_STUDIO_HOME || path.join(os.homedir(), '.video-studio');
const version = fs.readFileSync(path.join(skill, 'VERSION'), 'utf8').trim();
const PROTECTED = [/^src[\\/]episodes[\\/](?!index\.ts$)/, /^scripts[\\/]videos[\\/]/, /^public[\\/](screens|photos|vo|presenter)[\\/]/, /^video\.config\.json$/, /^capture\.json$/, /^youtube[\\/]/];
const readJson = (f, d = {}) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d);

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

// ---------- media: shared library (free open sources) → project, with credits ----------
const lib = path.join(home, 'library');
const libSfx = path.join(lib, 'audio', 'sfx');
const hasSfx = fs.existsSync(libSfx) && fs.readdirSync(libSfx).some((f) => f.endsWith('.mp3'));
if (!hasSfx && !process.env.VIDEO_STUDIO_SKIP_LIBRARY) {
  console.log(`No media library at ${lib} yet: building it from free open sources (Openverse / Freesound)…`);
  spawnSync(process.execPath, [path.join(skill, 'scripts', 'library.mjs')], {stdio: 'inherit', env: process.env});
}
const creditsOut = path.join(dest, 'public', 'credits.json');
const projectCredits = readJson(creditsOut);
const libCredits = readJson(path.join(lib, 'credits.json'));
const starter = path.join(skill, 'assets', 'starter');
const starterCredits = readJson(path.join(starter, 'credits.json'));
// [credit key prefix, library dir, starter dir, project dir]
const MEDIA = [
  ['music', path.join(lib, 'audio', 'music'), path.join(starter, 'music'), path.join(dest, 'public', 'audio', 'music')],
  ['sfx', path.join(lib, 'audio', 'sfx'), path.join(starter, 'sfx'), path.join(dest, 'public', 'audio', 'sfx')],
  ['stock', path.join(lib, 'stock'), null, path.join(dest, 'public', 'stock')],
];
let media = 0;
for (const [kind, libDir, starterDir, outDir] of MEDIA) {
  fs.mkdirSync(outDir, {recursive: true});
  for (const [srcDir, credits] of [[libDir, libCredits], [starterDir, starterCredits]]) {
    if (!srcDir || !fs.existsSync(srcDir)) continue;
    for (const f of fs.readdirSync(srcDir)) {
      if (!/\.(mp3|wav|ogg|mp4|webm)$/i.test(f) || fs.existsSync(path.join(outDir, f))) continue;
      fs.copyFileSync(path.join(srcDir, f), path.join(outDir, f));
      media++;
      const key = `${kind}/${f}`;
      if (credits[key] && !projectCredits[key]) projectCredits[key] = credits[key];
    }
  }
}
fs.writeFileSync(creditsOut, JSON.stringify(projectCredits, null, 2) + '\n');
if (!fs.readdirSync(path.join(dest, 'public', 'audio', 'sfx')).length) console.warn(`!! no sound effects yet: run node ${path.join(skill, 'scripts', 'library.mjs')}`);

// ---------- config ----------
const cfgPath = path.join(dest, 'video.config.json');
let cfg = readJson(cfgPath);
const answers = arg('config');
if (answers) cfg = deepMerge(cfg, readJson(path.resolve(answers)));
cfg.skillVersion = version;

// music bed from the "music" answer, if that file exists (else the first music file in the project)
const musicDir = path.join(dest, 'public', 'audio', 'music');
const musicFiles = fs.readdirSync(musicDir).filter((f) => f.endsWith('.mp3')).map((f) => f.replace(/\.mp3$/, ''));
const wanted = {upbeat: 'upbeat', calm: 'calm', playful: 'playful'}[cfg.answers?.music];
cfg.music = cfg.music ?? {volume: 0.085};
if (cfg.answers?.music === 'none') {
  console.log('music: none (episodes use music: null)');
} else if (wanted && musicFiles.includes(wanted)) {
  cfg.music.default = wanted;
} else if (!musicFiles.includes(cfg.music.default) && musicFiles.length) {
  cfg.music.default = musicFiles[0];
}

// placeholder logo when the project has none yet
const logoFile = path.join(dest, 'public', cfg.brand.logo);
if (!fs.existsSync(logoFile)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="146" viewBox="0 0 1120 146"><text x="560" y="105" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="96" font-weight="900" fill="#ffffff" letter-spacing="4">${cfg.brand.wordmark.replace(/[<&>]/g, '')}</text></svg>`;
  fs.mkdirSync(path.join(dest, 'public', 'brand'), {recursive: true});
  fs.writeFileSync(path.join(dest, 'public', 'brand', 'logo.svg'), svg);
  cfg.brand.logo = 'brand/logo.svg';
  console.warn('!! no logo found: wrote a text placeholder public/brand/logo.svg (detect-brand.mjs or the real logo replaces it)');
}
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

execSync('node scripts/brand.mjs', {cwd: dest, stdio: 'inherit'});
if (flag('install')) execSync('npm install --loglevel=error', {cwd: dest, stdio: 'inherit'});

const rel = path.relative(process.cwd(), dest) || dest;
console.log(`\n${fresh ? 'Created' : 'Updated'} ${rel}  (template ${version}: ${copied} files copied, ${skipped} kept · ${media} media files · credits in public/credits.json)`);
const rootTs = path.join(project, 'tsconfig.json');
if (fs.existsSync(rootTs) && !fs.readFileSync(rootTs, 'utf8').includes(path.basename(dest))) {
  console.log(`!! ${path.basename(dest)}/ must be excluded from the host project's tsconfig.json ("exclude": [..., "${path.basename(dest)}"]) or its type-check/build will pick it up.`);
}
console.log(`Next:
  node "${path.join(skill, 'scripts', 'detect-brand.mjs')}" --project "${project}" --write "${dest}"   (logo, colours, fonts from the project)
  cd "${rel}" && npm install
  npm run fonts      (store fonts locally so renders never wait on Google Fonts)
  npm run dev        (Remotion Studio at http://localhost:3000)`);
