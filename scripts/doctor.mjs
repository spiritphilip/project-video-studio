// System check for this PC (and, with --dir, a project's video folder).
// Usage: node <skill>/scripts/doctor.mjs [--dir <project>/videos] [--bench]
//   --bench  renders 90 frames of BrandIntro to measure this PC's render speed and estimate delivery times
//            (needs --dir with node_modules installed). Result is saved to ~/.video-studio/profile.json → benchmark.
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const home = process.env.VIDEO_STUDIO_HOME || path.join(os.homedir(), '.video-studio');
const i = process.argv.indexOf('--dir');
const dir = i > 0 ? path.resolve(process.argv[i + 1]) : null;
const bench = process.argv.includes('--bench');
const ok = (b, msg, fix) => console.log(`${b === 'warn' ? '!' : b ? '✓' : '✗'} ${msg}${b !== true && fix ? `\n    → ${fix}` : ''}`);
const run = (c) => { try { return execSync(c, {stdio: ['ignore', 'pipe', 'ignore'], timeout: 15000}).toString().trim(); } catch { return null; } };
const env = (f) => (fs.existsSync(f) ? Object.fromEntries(fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=./.test(l)).map((l) => [l.split('=')[0], true])) : {});
const GB = 1024 ** 3;
const version = fs.readFileSync(path.join(skill, 'VERSION'), 'utf8').trim();

console.log(`project-video-studio ${version}\n\n== System ==`);
const cpus = os.cpus();
const cores = cpus.length;
const ramGB = os.totalmem() / GB;
const freeRamGB = os.freemem() / GB;
let diskFreeGB = null;
try { const s = fs.statfsSync(os.homedir()); diskFreeGB = (s.bavail * s.bsize) / GB; } catch { /* old Node */ }
const gpu = (() => {
  if (process.platform === 'win32') {
    return run('powershell -NoProfile -Command "(Get-CimInstance Win32_VideoController).Name -join \', \'"') || run('wmic path win32_VideoController get name')?.split(/\r?\n/).slice(1).map((s) => s.trim()).filter(Boolean).join(', ');
  }
  if (process.platform === 'darwin') return run('system_profiler SPDisplaysDataType')?.match(/Chipset Model: (.+)/g)?.map((s) => s.replace('Chipset Model: ', '')).join(', ');
  return run('lspci')?.split('\n').filter((l) => /vga|3d|display/i.test(l)).map((l) => l.split(': ').slice(1).join(': ')).join(', ');
})();
const ssd = (() => {
  if (process.platform === 'win32') return run('powershell -NoProfile -Command "(Get-PhysicalDisk | Select-Object -ExpandProperty MediaType) -join \',\'"');
  if (process.platform === 'linux') return run('lsblk -d -o rota')?.includes('0') ? 'SSD' : null;
  return 'SSD';
})();
console.log(`  OS      ${os.type()} ${os.release()} (${process.arch})`);
console.log(`  CPU     ${cpus[0]?.model?.trim()} · ${cores} threads`);
console.log(`  RAM     ${ramGB.toFixed(1)} GB total · ${freeRamGB.toFixed(1)} GB free now`);
console.log(`  Disk    ${diskFreeGB === null ? 'unknown' : `${diskFreeGB.toFixed(1)} GB free`} (home drive)${ssd ? ` · ${ssd}` : ''}`);
console.log(`  GPU     ${gpu || 'unknown'} (not required: Remotion renders on the CPU)`);

const node = process.versions.node.split('.').map(Number);
const nodeOk = node[0] >= 23 || (node[0] === 22 && node[1] >= 13) || (node[0] === 20 && node[1] >= 19);
console.log('\n== Requirements (minimum · recommended) ==');
ok(nodeOk, `Node ${process.versions.node} (20.19+ or 22.13+)`, 'install Node 22 LTS from https://nodejs.org');
ok(cores >= 8 ? true : cores >= 4 ? 'warn' : false, `CPU ${cores} threads (min 4 · rec 8+)`, cores >= 4 ? 'works; renders are slower, use CONC=2 and render one video at a time' : 'below minimum: renders will be very slow');
ok(ramGB >= 16 ? true : ramGB >= 8 ? 'warn' : false, `RAM ${ramGB.toFixed(0)} GB (min 8 · rec 16)`, ramGB >= 8 ? 'works; close heavy apps while rendering' : 'below minimum: renders may crash');
if (diskFreeGB !== null) ok(diskFreeGB >= 30 ? true : diskFreeGB >= 10 ? 'warn' : false, `Free disk ${diskFreeGB.toFixed(0)} GB (min 10 · rec 30)`, diskFreeGB >= 10 ? 'works; clear out/raw and the OS temp folder now and then' : 'free some space first: bundles + renders need several GB');
ok(!!run('git --version'), 'git');
const py = run('python --version') ? 'python' : run('python3 --version') ? 'python3' : null;
ok(py ? true : 'warn', `Python 3 ${py ? `(${run(`${py} --version`)})` : 'not found'}`, 'needed only for the free "edge" voices: https://www.python.org/downloads/');
const edge = py && (run(`${py} -m pip show edge-tts`) || run(`${py} -m edge_tts --help`));
ok(edge ? true : 'warn', `edge-tts ${edge ? 'installed' : 'not installed'} (free voices, no key)`, `${py ?? 'python'} -m pip install --user edge-tts`);
console.log('  ffmpeg: not needed (Remotion ships its own)');

console.log('\n== Keys and media ==');
const sec = env(path.join(home, 'secrets.env'));
ok(fs.existsSync(path.join(home, 'secrets.env')) ? true : 'warn', `secrets file ${path.join(home, 'secrets.env')}`, `optional for the free path; copy ${path.join(skill, 'setup', 'secrets.example.env')} there to add keys`);
console.log(`  Free path: "edge" voices need no key. Optional: Azure ${sec.AZURE_SPEECH_KEY && sec.AZURE_SPEECH_REGION ? 'set' : 'not set'} · ElevenLabs ${sec.ELEVENLABS_API_KEY ? 'set' : 'not set'} · Freesound ${sec.FREESOUND_API_KEY ? 'set' : 'not set'} · Pexels ${sec.PEXELS_API_KEY ? 'set' : 'not set'} · Pixabay ${sec.PIXABAY_API_KEY ? 'set' : 'not set'} · HeyGen ${sec.HEYGEN_API_KEY ? 'set' : 'not set'} · D-ID ${sec.DID_API_KEY ? 'set' : 'not set'}`);
const lib = path.join(home, 'library');
const count = (p) => (fs.existsSync(path.join(lib, p)) ? fs.readdirSync(path.join(lib, p)).filter((f) => /\.(mp3|mp4|wav|ogg)$/.test(f)).length : 0);
ok(count('audio/sfx') > 0 ? true : false, `media library ${lib}: ${count('audio/music')} music, ${count('audio/sfx')} sfx, ${count('stock')} stock clips`, `node ${path.join(skill, 'scripts', 'library.mjs')}   (free open sources, no key needed)`);
ok(fs.existsSync(path.join(lib, 'credits.json')) ? true : 'warn', 'library credits.json (license + attribution per file)', `node ${path.join(skill, 'scripts', 'library.mjs')}`);
const profileFile = path.join(home, 'profile.json');
const profile = fs.existsSync(profileFile) ? JSON.parse(fs.readFileSync(profileFile, 'utf8')) : null;
ok(profile ? true : 'warn', 'personal defaults (profile.json)', 'optional: written after your first setup questionnaire');
if (profile?.benchmark) console.log(`  last benchmark: ${profile.benchmark.fps} fps on ${profile.benchmark.cpu} (${profile.benchmark.date})`);

if (dir) {
  console.log(`\n== Project ${dir} ==`);
  const cfgFile = path.join(dir, 'video.config.json');
  ok(fs.existsSync(cfgFile), 'video.config.json', 'run the setup questionnaire + scaffold.mjs');
  if (fs.existsSync(cfgFile)) {
    const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
    const q = JSON.parse(fs.readFileSync(path.join(skill, 'setup', 'questions.json'), 'utf8'));
    ok((cfg.questionsVersion ?? 0) >= q.version, `setup answers (v${cfg.questionsVersion ?? 0} of ${q.version})`, 'new setup questions exist: ask only the new keys');
    ok(cfg.skillVersion === version, `kit version ${cfg.skillVersion} (skill ${version})`, `node ${path.join(skill, 'scripts', 'sync-kit.mjs')} --dir "${dir}"`);
    ok(fs.existsSync(path.join(dir, 'public', cfg.brand.logo)), `logo ${cfg.brand.logo}`, `node ${path.join(skill, 'scripts', 'detect-brand.mjs')} --project "${path.dirname(dir)}" --write "${dir}"`);
    const sb = cfg.soundBrief;
    ok(sb && (sb.mood || sb.musicQueries?.length) ? true : 'warn', 'sound brief (music/sfx chosen to fit the project)', 'read the project, fill soundBrief in video.config.json, fetch with library.mjs --project');
  }
  ok(fs.existsSync(path.join(dir, 'node_modules', 'remotion')), 'dependencies installed', `cd "${dir}" && npm install`);
  ok(fs.existsSync(path.join(dir, 'src', 'brand.ts')), 'src/brand.ts generated', 'npm run brand');
  ok(fs.existsSync(path.join(dir, 'public', 'fonts')) && fs.readdirSync(path.join(dir, 'public', 'fonts')).length ? true : 'warn', 'fonts stored locally', 'npm run fonts  (renders stop depending on Google Fonts)');
  const pw = ['node_modules/playwright', '../node_modules/playwright', '../node_modules/@playwright/test'].some((p) => fs.existsSync(path.join(dir, p)));
  ok(pw ? true : 'warn', 'Playwright (screen capture)', 'npm i -D playwright && npx playwright install chromium');
}

if (bench) {
  console.log('\n== Speed benchmark ==');
  if (!dir || !fs.existsSync(path.join(dir, 'node_modules', 'remotion'))) {
    console.log('✗ --bench needs --dir <project>/videos with dependencies installed');
    process.exit(1);
  }
  // Remotion caches its headless Chrome under <cwd>/node_modules/.remotion, so run from the project
  process.chdir(dir);
  const req = createRequire(path.join(dir, 'package.json'));
  const {bundle} = await import(pathToFileURL(req.resolve('@remotion/bundler')).href);
  const {ensureBrowser, renderMedia, selectComposition} = await import(pathToFileURL(req.resolve('@remotion/renderer')).href);
  try { await ensureBrowser(); } catch (e) {
    console.log(`✗ could not download Remotion's headless Chrome (${e.message.split(String.fromCharCode(10))[0]}). Check the connection and run again.`);
    process.exit(1);
  }
  const out = path.join(os.tmpdir(), `pvs-bench-${Date.now()}.mp4`);
  const FRAMES = 90;
  const conc = Math.max(1, Math.floor(cores / 2));
  let serveUrl;
  try {
    process.stdout.write('  bundling… ');
    serveUrl = await bundle({entryPoint: path.join(dir, 'src', 'index.ts')});
    const composition = await selectComposition({serveUrl, id: 'BrandIntro', timeoutInMilliseconds: 120000});
    process.stdout.write(`rendering ${FRAMES} frames (concurrency ${conc})… `);
    const t0 = Date.now();
    await renderMedia({composition, serveUrl, codec: 'h264', outputLocation: out, concurrency: conc, timeoutInMilliseconds: 120000, frameRange: [0, Math.min(FRAMES, composition.durationInFrames) - 1]});
    const secs = (Date.now() - t0) / 1000;
    const fps = Math.min(FRAMES, composition.durationInFrames) / secs;
    console.log(`${secs.toFixed(1)} s → ${fps.toFixed(1)} frames/s (${(fps / 30).toFixed(2)}× real time)`);
    const mins = (s) => ((s * 30) / fps / 60) * 1.15;
    const fmt = (m) => (m < 1 ? `${Math.round(m * 60)} s` : `${m.toFixed(1)} min`);
    console.log('\n== Speed of delivery on this PC ==');
    console.log('  Render time (incl. ~15% for loudness + encode):');
    for (const [label, s] of [['30 s video', 30], ['60 s video', 60], ['90 s video', 90], ['3 min video', 180]]) console.log(`    ${label.padEnd(12)} ≈ ${fmt(mins(s))}`);
    console.log('  Voice-over: ~2–4 s per line (edge/Azure) → ~30–60 s per 90 s video; ElevenLabs similar.');
    console.log('  Per 90 s video, agent + you:');
    console.log('    script (written, fact-checked) 5–10 min · screens 5–15 min · build 10–30 min · stills check 2–5 min');
    console.log(`    render ${fmt(mins(90))} · total ≈ ${Math.round(22 + mins(90))}–${Math.round(60 + mins(90))} min (batches overlap: script the next while one renders)`);
    const p = fs.existsSync(profileFile) ? JSON.parse(fs.readFileSync(profileFile, 'utf8')) : {};
    p.benchmark = {fps: Number(fps.toFixed(2)), date: new Date().toISOString().slice(0, 10), cpu: `${cpus[0]?.model?.trim()} (${cores} threads)`, concurrency: conc, ramGB: Number(ramGB.toFixed(1))};
    fs.mkdirSync(home, {recursive: true});
    fs.writeFileSync(profileFile, JSON.stringify(p, null, 2) + '\n');
    console.log(`\n  saved to ${profileFile} → benchmark`);
  } finally {
    if (serveUrl) fs.rmSync(serveUrl, {recursive: true, force: true});
    fs.rmSync(out, {force: true});
  }
}
