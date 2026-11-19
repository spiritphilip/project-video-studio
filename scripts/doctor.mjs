// Health check for this PC (and, with --dir, a project's video folder).
// Usage: node <skill>/scripts/doctor.mjs [--dir <project>/videos]
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const skill = path.resolve(here, '..');
const home = process.env.VIDEO_STUDIO_HOME || path.join(os.homedir(), '.video-studio');
const i = process.argv.indexOf('--dir');
const dir = i > 0 ? path.resolve(process.argv[i + 1]) : null;
const ok = (b, msg, fix) => console.log(`${b ? '✓' : '✗'} ${msg}${!b && fix ? `\n    → ${fix}` : ''}`);
const run = (c) => { try { return execSync(c, {stdio: ['ignore', 'pipe', 'ignore']}).toString().trim(); } catch { return null; } };
const env = (f) => (fs.existsSync(f) ? Object.fromEntries(fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=./.test(l)).map((l) => [l.split('=')[0], true])) : {});

console.log(`project-video-studio ${fs.readFileSync(path.join(skill, 'VERSION'), 'utf8').trim()}\n`);
const node = process.versions.node.split('.').map(Number);
ok(node[0] >= 22 || (node[0] === 20 && node[1] >= 19), `Node ${process.versions.node}`, 'Remotion 4 needs Node 20.19+ or 22.13+');
ok(!!run('git --version'), 'git');
ok(!!run('gh --version'), 'GitHub CLI (for skill updates)', 'optional: https://cli.github.com');
const sec = env(path.join(home, 'secrets.env'));
ok(fs.existsSync(path.join(home, 'secrets.env')), `secrets file ${path.join(home, 'secrets.env')}`, 'copy setup/secrets.example.env there and fill the keys');
ok(sec.AZURE_SPEECH_KEY && sec.AZURE_SPEECH_REGION, 'Azure Speech key + region', 'portal.azure.com → Speech service (free F0) → Keys and Endpoint');
console.log(`  ElevenLabs key: ${sec.ELEVENLABS_API_KEY ? 'set' : 'not set (optional)'} · HeyGen: ${sec.HEYGEN_API_KEY ? 'set' : 'not set'} · D-ID: ${sec.DID_API_KEY ? 'set' : 'not set'}`);
const lib = path.join(home, 'library');
const count = (p) => (fs.existsSync(path.join(lib, p)) ? fs.readdirSync(path.join(lib, p)).filter((f) => !f.endsWith('.txt')).length : 0);
ok(count('audio/music') > 0 && count('audio/sfx') > 0, `media library: ${count('audio/music')} music, ${count('audio/sfx')} sfx, ${count('stock')} stock clips`, 'see references/assets.md (assets-manifest.json lists every file to re-download)');
ok(fs.existsSync(path.join(home, 'profile.json')), 'personal defaults (profile.json)', 'optional: written after your first setup questionnaire');

if (dir) {
  console.log(`\n${dir}`);
  const cfgFile = path.join(dir, 'video.config.json');
  ok(fs.existsSync(cfgFile), 'video.config.json', 'run the setup questionnaire + scaffold.mjs');
  if (fs.existsSync(cfgFile)) {
    const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
    const q = JSON.parse(fs.readFileSync(path.join(skill, 'setup', 'questions.json'), 'utf8'));
    ok((cfg.questionsVersion ?? 0) >= q.version, `setup answers (v${cfg.questionsVersion ?? 0} of ${q.version})`, 'new setup questions exist: ask only the new keys');
    const sv = fs.readFileSync(path.join(skill, 'VERSION'), 'utf8').trim();
    ok(cfg.skillVersion === sv, `kit version ${cfg.skillVersion} (skill ${sv})`, `node ${path.join(skill, 'scripts', 'sync-kit.mjs')} --dir "${dir}"`);
    ok(fs.existsSync(path.join(dir, 'public', cfg.brand.logo)), `logo ${cfg.brand.logo}`);
  }
  ok(fs.existsSync(path.join(dir, 'node_modules', 'remotion')), 'dependencies installed', `cd "${dir}" && npm install`);
  ok(fs.existsSync(path.join(dir, 'src', 'brand.ts')), 'src/brand.ts generated', 'npm run brand');
  const pw = fs.existsSync(path.join(dir, 'node_modules', 'playwright')) || fs.existsSync(path.join(dir, '..', 'node_modules', 'playwright')) || fs.existsSync(path.join(dir, '..', 'node_modules', '@playwright', 'test'));
  ok(pw, 'Playwright (screen capture)', 'npm i -D playwright && npx playwright install chromium');
}
