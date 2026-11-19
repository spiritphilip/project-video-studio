// Terminal setup wizard: sets a project up for videos WITHOUT any AI agent.
//   node <skill>/scripts/setup.mjs [--project <root>] [--yes] [--no-install]
// 1. system check  2. reads the project (brand, logo, colours, fonts)  3. asks the setup questions
// 4. picks voices + a sound that fits the product  5. creates <root>/videos, installs, fetches media + fonts.
// --yes accepts every default (useful for CI and quick trials).
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline/promises';
import {fileURLToPath} from 'node:url';

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : undefined; };
const yes = process.argv.includes('--yes');
const root = path.resolve(arg('project') ?? process.cwd());
const home = process.env.VIDEO_STUDIO_HOME || path.join(os.homedir(), '.video-studio');
const node = (script, args = [], opts = {}) => spawnSync(process.execPath, [path.join(skill, 'scripts', script), ...args], {stdio: 'inherit', ...opts});
const rl = readline.createInterface({input: process.stdin, output: process.stdout});
const ask = async (q, def = '') => (yes ? def : ((await rl.question(`${q}${def ? ` [${def}]` : ''}: `)).trim() || def));
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

console.log(bold('\nProject Video Studio · setup\n'));
console.log(dim('Step 1/5 · System check'));
node('doctor.mjs');

console.log(dim(`\nStep 2/5 · Reading ${root}`));
const det = JSON.parse(spawnSync(process.execPath, [path.join(skill, 'scripts', 'detect-brand.mjs'), '--project', root], {encoding: 'utf8', maxBuffer: 1 << 24}).stdout || '{}');
const name = await ask('Product name', det.project?.name ?? path.basename(root));
const summary = await ask('What does it do, for whom? (one sentence)', det.project?.summary ?? '');
const url = await ask('Website URL', det.project?.url ?? '');
const tagline = await ask('Tagline for the outro', det.brand?.tagline || summary.slice(0, 80));
let logo = det.brand?.logoCandidates?.[0]?.file;
if (det.brand?.logoCandidates?.length) {
  console.log('Logo candidates (light/white versions look best on the dark video background):');
  det.brand.logoCandidates.forEach((c, i) => console.log(`  ${i + 1}. ${c.file} (${c.kb} KB)`));
  const n = Number(await ask('Which logo? number, or a path', '1'));
  logo = Number.isFinite(n) && n > 0 ? det.brand.logoCandidates[n - 1]?.file : logo;
}
console.log(`Colours found: ${JSON.stringify(det.brand?.colors ?? {})} · fonts: ${(det.brand?.fonts ?? []).join(', ') || 'none'}`);

console.log(dim('\nStep 3/5 · How should the videos look and sound? (Enter = first option)'));
const Q = JSON.parse(fs.readFileSync(path.join(skill, 'setup', 'questions.json'), 'utf8'));
const answers = {};
for (const round of Q.rounds) {
  console.log(bold(`\n${round.title}`));
  for (const q of round.questions) {
    console.log(`\n${q.question}${q.multiSelect ? ' (several: e.g. 1,3)' : ''}`);
    q.options.forEach((o, i) => console.log(`  ${i + 1}. ${o.label}  ${dim(o.description)}`));
    const a = await ask('>', '1');
    const picks = a.split(/[,\s]+/).map(Number).filter((n) => n >= 1 && n <= q.options.length).map((n) => q.options[n - 1].value);
    const val = picks.length ? picks : [a]; // free text = "Other"
    answers[q.key] = q.multiSelect ? val : val[0];
  }
}

console.log(dim('\nStep 4/5 · Voices and sound'));
const V = JSON.parse(fs.readFileSync(path.join(skill, 'setup', 'voices.json'), 'utf8'));
const accent = V.accents[answers.accent] ? answers.accent : 'en-US';
const energy = V.energy[answers.energy] ?? V.energy.energetic;
const provider = ['edge', 'azure'].includes(answers.voiceProvider) ? answers.voiceProvider : answers.voiceProvider === 'elevenlabs' ? 'elevenlabs' : answers.voiceProvider === 'recorded' ? 'recorded' : 'edge';
const A = V.accents[accent];
const voices = provider === 'elevenlabs' ? {narrator: V.elevenlabs.narrator} : provider === 'recorded' ? {narrator: {provider: 'recorded'}} : {
  narrator: {provider, name: A.narrator, lang: A.lang, ...energy},
  second: {provider, name: A.second, lang: A.lang, ...energy},
};
// sound brief from a few words about the product's vibe
const vibe = (await ask('Describe the product\'s vibe in a few words (e.g. "calm fintech", "playful kids app", "youth community in Africa")', summary)).toLowerCase();
const SOUND = [
  [/kid|child|school|fun|game for/, 'playful', ['playful ukulele', 'happy kids']],
  [/game|esport|arcade/, 'energetic', ['synthwave', 'electronic energetic']],
  [/bank|fintech|finance|payment|invoice|account|insur/, 'calm corporate', ['corporate calm', 'soft piano background']],
  [/health|well|medit|therap|care|clinic/, 'calm', ['calm ambient', 'acoustic gentle']],
  [/dev|api|code|cli|infra|data/, 'focused', ['lofi chill', 'minimal electronic']],
  [/shop|fashion|store|commerce|brand/, 'trendy', ['upbeat pop', 'funk groove']],
  [/africa|nigeria|afro|youth|community|student|campus/, 'warm energetic', ['afrobeat instrumental', 'upbeat world percussion']],
  [/crypto|web3|ai |blockchain|future/, 'futuristic', ['future bass', 'modern electronic']],
  [/travel|food|restaurant|hotel/, 'sunny', ['acoustic happy', 'summer upbeat']],
];
const hit = SOUND.find(([re]) => re.test(vibe)) ?? [null, answers.music === 'calm' ? 'calm' : 'upbeat', answers.music === 'calm' ? ['calm ambient'] : ['upbeat corporate', 'inspiring background']];
const soundBrief = {mood: hit[1], genre: hit[2][0], tempo: answers.energy === 'calm' ? 'slow-medium' : 'medium-fast', sfxCharacter: answers.energy === 'calm' ? 'soft, minimal' : 'crisp pops and whooshes', musicQueries: hit[2], sfxNotes: ''};
console.log(`Sound brief: ${soundBrief.mood} · searching "${soundBrief.musicQueries.join('", "')}"`);

console.log(dim('\nStep 5/5 · Creating the video studio'));
const config = {
  questionsVersion: Q.version,
  project: {name, summary, url},
  brand: {name, wordmark: name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14), tagline, colors: det.brand?.colors ?? {}},
  answers, voices, soundBrief,
  tracks: {start: {name: 'Start here', narrator: 'narrator'}},
  publish: {site: url, seriesName: `${name} Academy`, baseTags: [name, `${name} tutorial`], hashtags: [`#${name.replace(/[^A-Za-z0-9]/g, '')}`]},
};
const tmp = path.join(os.tmpdir(), `video-studio-answers-${Date.now()}.json`);
fs.writeFileSync(tmp, JSON.stringify(config, null, 2));
if (node('scaffold.mjs', ['--project', root, '--config', tmp]).status !== 0) process.exit(1);
fs.rmSync(tmp, {force: true});
const videos = path.join(root, 'videos');
if (!process.argv.includes('--no-install') && (await ask('Install dependencies now (npm install, ~300 MB)?', 'y')).toLowerCase().startsWith('y')) {
  spawnSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], {cwd: videos, stdio: 'inherit', shell: true});
  spawnSync(process.execPath, ['scripts/fonts.mjs'], {cwd: videos, stdio: 'inherit'});
}
node('detect-brand.mjs', ['--project', root, '--write', videos, ...(logo ? ['--logo', path.join(root, logo)] : [])]);
if (answers.music !== 'none') {
  console.log('Fetching a theme track that fits the sound brief (free, open-licensed)…');
  for (const q of soundBrief.musicQueries) if (node('library.mjs', ['music', q, '--name', 'theme', '--project', videos]).status === 0 && fs.existsSync(path.join(videos, 'public', 'audio', 'music', 'theme.mp3'))) break;
  const cfgPath = path.join(videos, 'video.config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  if (fs.existsSync(path.join(videos, 'public', 'audio', 'music', 'theme.mp3'))) { cfg.music.default = 'theme'; fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n'); spawnSync(process.execPath, ['scripts/brand.mjs'], {cwd: videos, stdio: 'inherit'}); }
}
// remember the answers as this user's defaults for the next project (no project data)
fs.mkdirSync(home, {recursive: true});
const profFile = path.join(home, 'profile.json');
const prof = fs.existsSync(profFile) ? JSON.parse(fs.readFileSync(profFile, 'utf8')) : {};
fs.writeFileSync(profFile, JSON.stringify({...prof, answers, voices}, null, 2) + '\n');
rl.close();

console.log(bold('\nDone.'));
console.log(`Preview:   cd "${path.relative(process.cwd(), videos) || videos}" && npm run dev    (Remotion Studio: open BrandPreview)
Next:      write a script in scripts/videos/<id>.json → npm run voice -- scripts/videos/<id>.json → build the episode (see SKILL.md)
Speed:     node "${path.join(skill, 'scripts', 'doctor.mjs')}" --dir "${videos}" --bench   (how long renders take on this PC)
Tip:       an AI coding agent pointed at SKILL.md can write the scripts and scenes for you (docs/using-with-agents.md).`);
