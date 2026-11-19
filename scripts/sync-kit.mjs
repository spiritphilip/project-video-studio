// Upgrades an existing project's video kit to this skill version WITHOUT touching its episodes,
// scripts, screens, voice-overs or config. Every file it replaces is backed up first.
// Usage: node <skill>/scripts/sync-kit.mjs --dir <project>/videos [--dry]
// Files listed in video.config.json → "lockedFiles" (e.g. a customised src/kit/bumpers.tsx) are never replaced.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const dir = path.resolve(arg('dir', 'videos'));
const dry = process.argv.includes('--dry');
const cfgPath = path.join(dir, 'video.config.json');
if (!fs.existsSync(cfgPath)) throw new Error(`${cfgPath} not found: run scaffold.mjs first`);
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const locked = new Set((cfg.lockedFiles ?? []).map((f) => f.replace(/\\/g, '/')));
const version = fs.readFileSync(path.join(skill, 'VERSION'), 'utf8').trim();

// what the kit owns (safe to upgrade)
const KIT = ['src/kit', 'src/thumbs/Thumbnail.tsx', 'src/Root.tsx', 'src/index.ts', 'scripts/brand.mjs', 'scripts/lib.mjs', 'scripts/tts.mjs', 'scripts/capture.mjs',
  'scripts/stills.mjs', 'scripts/render.mjs', 'scripts/thumbs.mjs', 'scripts/seo.mjs', 'scripts/fonts.mjs', 'scripts/edge_tts.py', 'remotion.config.ts', 'tsconfig.json', 'public/icons'];
const files = [];
const walk = (rel) => {
  const abs = path.join(skill, 'template', rel);
  if (!fs.existsSync(abs)) return;
  if (fs.statSync(abs).isDirectory()) for (const e of fs.readdirSync(abs)) walk(path.posix.join(rel, e)); else files.push(rel);
};
KIT.forEach(walk);

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const backup = path.join(dir, '.kit-backup', stamp);
const changed = [], added = [], kept = [];
for (const rel of files) {
  const src = path.join(skill, 'template', rel), dst = path.join(dir, rel);
  if (locked.has(rel)) { kept.push(rel); continue; }
  if (!fs.existsSync(dst)) { added.push(rel); if (!dry) { fs.mkdirSync(path.dirname(dst), {recursive: true}); fs.copyFileSync(src, dst); } continue; }
  if (Buffer.compare(fs.readFileSync(src), fs.readFileSync(dst)) === 0) continue;
  changed.push(rel);
  if (!dry) {
    fs.mkdirSync(path.dirname(path.join(backup, rel)), {recursive: true});
    fs.copyFileSync(dst, path.join(backup, rel));
    fs.copyFileSync(src, dst);
  }
}
if (!dry) { cfg.skillVersion = version; fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n'); }
console.log(`${dry ? '[dry run] ' : ''}kit → ${version}: ${changed.length} updated, ${added.length} added, ${kept.length} locked`);
changed.forEach((f) => console.log('  updated', f));
added.forEach((f) => console.log('  added  ', f));
kept.forEach((f) => console.log('  locked ', f));
if (changed.length && !dry) console.log(`Backups of the replaced files: ${path.relative(process.cwd(), backup)}\nNext: node scripts/brand.mjs && npx tsc --noEmit, then re-check stills of one episode.`);
