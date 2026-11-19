// Builds the shared media library (music, sound effects, stock clips) from FREE, OPEN sources and
// records every file's license + attribution in credits.json / CREDITS.md.
//
//   node scripts/library.mjs                      fill everything missing from setup/library.json
//   node scripts/library.mjs --only sfx|music|stock   one section       --force   re-download
//   node scripts/library.mjs sfx   "glass break" --name glass        one extra sound effect
//   node scripts/library.mjs music "lofi chill"  --name lofi         one extra music bed
//   node scripts/library.mjs stock "students campus" --name campus
//   add --project <project>/videos to put a one-off item straight into that project (public/audio/…, public/stock)
//   with its credit in <project>/videos/public/credits.json; that's how project-specific music/sfx from the sound brief are fetched.
//
// Sources (no key needed unless noted):
//   Openverse (api.openverse.org): CC0 / public-domain sound effects (Freesound) and CC0 / CC-BY music (Jamendo, ccMixter)
//   Freesound (FREESOUND_API_KEY, free): more CC0 sound effects
//   Pexels (PEXELS_API_KEY, free) / Pixabay (PIXABAY_API_KEY, free): stock video
// Library location: $VIDEO_STUDIO_HOME or ~/.video-studio/library. Keys: ~/.video-studio/secrets.env or env vars.
// Starter sound effects that ship with the skill (assets/starter) are copied in first, so it works offline.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const skill = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const home = process.env.VIDEO_STUDIO_HOME || path.join(os.homedir(), '.video-studio');
const lib = path.join(home, 'library');
const catalog = JSON.parse(fs.readFileSync(path.join(skill, 'setup', 'library.json'), 'utf8'));
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
const force = args.includes('--force');

const secrets = (() => {
  const f = path.join(home, 'secrets.env');
  const fromFile = fs.existsSync(f) ? Object.fromEntries(fs.readFileSync(f, 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=./.test(l)).map((l) => [l.split('=')[0], l.slice(l.indexOf('=') + 1).trim()])) : {};
  return (k) => process.env[k] || fromFile[k] || '';
})();

const DIRS = {sfx: path.join(lib, 'audio', 'sfx'), music: path.join(lib, 'audio', 'music'), stock: path.join(lib, 'stock')};
Object.values(DIRS).forEach((d) => fs.mkdirSync(d, {recursive: true}));
const creditsFile = path.join(lib, 'credits.json');
const credits = fs.existsSync(creditsFile) ? JSON.parse(fs.readFileSync(creditsFile, 'utf8')) : {};

const credits0 = new Set(Object.keys(credits));
// never use the same source file for two names
const used = new Set(Object.values(credits).flatMap((c) => [c.url, c.landing]).filter(Boolean));
const LICENSE_URL = {cc0: 'https://creativecommons.org/publicdomain/zero/1.0/', pdm: 'https://creativecommons.org/publicdomain/mark/1.0/', by: 'https://creativecommons.org/licenses/by/4.0/'};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url, init = {}, tries = 4, timeoutMs = 30000) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, {...init, signal: AbortSignal.timeout(timeoutMs), headers: {'user-agent': 'project-video-studio (open-source video kit)', ...(init.headers ?? {})}});
      if (r.status === 429 && i < tries) { // Openverse anonymous limit: 20/min, 200/day
        const wait = Number(r.headers.get('retry-after')) * 1000 || 20000 * i;
        console.log(`  rate-limited, waiting ${Math.round(wait / 1000)}s…`);
        await sleep(wait); continue;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status} ${url.split('?')[0]}`);
      return r;
    } catch (e) {
      if (i >= tries) throw e;
      await sleep(1200 * i);
    }
  }
}

// ---------- audio providers: return candidates [{url, durationS, title, creator, license, landing, source}] ----------
async function openverse(query, {category, licenses}) {
  const p = new URLSearchParams({q: query, license: licenses.join(','), page_size: '20', ...(category ? {category} : {})});
  const j = await (await fetchRetry(`https://api.openverse.org/v1/audio/?${p}`)).json();
  return (j.results ?? []).filter((r) => r.url && /mp3/i.test(`${r.filetype} ${r.url}`)).map((r) => ({
    url: r.url, durationS: (r.duration ?? 0) / 1000, title: r.title, creator: r.creator, license: r.license, licenseVersion: r.license_version,
    landing: r.foreign_landing_url, source: `Openverse/${r.source}`,
  }));
}
async function freesound(query, {max, min = 0}) {
  const key = secrets('FREESOUND_API_KEY');
  if (!key) return [];
  const p = new URLSearchParams({query, filter: `license:"Creative Commons 0" duration:[${min} TO ${max}]`, fields: 'id,name,username,license,previews,duration,url', page_size: '15', token: key});
  const j = await (await fetchRetry(`https://freesound.org/apiv2/search/text/?${p}`)).json();
  return (j.results ?? []).map((r) => ({url: r.previews['preview-hq-mp3'], durationS: r.duration, title: r.name, creator: r.username, license: 'cc0', landing: r.url, source: 'Freesound'}));
}

// ---------- stock video providers ----------
async function pexels(query) {
  const key = secrets('PEXELS_API_KEY');
  if (!key) return [];
  const j = await (await fetchRetry(`https://api.pexels.com/videos/search?${new URLSearchParams({query, per_page: '10', orientation: 'landscape'})}`, {headers: {Authorization: key}})).json();
  return (j.videos ?? []).map((v) => {
    const files = v.video_files.filter((f) => f.file_type === 'video/mp4' && f.width && f.width <= 1920).sort((a, b) => b.width - a.width);
    return files[0] && {url: files[0].link, durationS: v.duration, title: `Pexels video ${v.id}`, creator: v.user?.name, license: 'pexels', landing: v.url, source: 'Pexels'};
  }).filter(Boolean);
}
async function pixabay(query) {
  const key = secrets('PIXABAY_API_KEY');
  if (!key) return [];
  const j = await (await fetchRetry(`https://pixabay.com/api/videos/?${new URLSearchParams({key, q: query, per_page: '10', safesearch: 'true'})}`)).json();
  return (j.hits ?? []).map((h) => {
    const v = h.videos.large?.url ? h.videos.large : h.videos.medium;
    return v?.url && {url: v.url, durationS: h.duration, title: `Pixabay video ${h.id}`, creator: h.user, license: 'pixabay', landing: h.pageURL, source: 'Pixabay'};
  }).filter(Boolean);
}

function attribution(c) {
  const lic = c.license === 'by' ? `CC BY ${c.licenseVersion ?? '4.0'}` : c.license === 'cc0' ? 'CC0' : c.license === 'pdm' ? 'Public Domain' : c.license === 'pexels' ? 'Pexels License' : c.license === 'pixabay' ? 'Pixabay Content License' : c.license;
  return `"${c.title}" by ${c.creator || 'unknown'} (${lic}) ${c.landing ?? ''}`.trim();
}

async function pick(kind, name, spec) {
  const ext = kind === 'stock' ? 'mp4' : 'mp3';
  const out = path.join(DIRS[kind], `${name}.${ext}`);
  if (fs.existsSync(out) && !force) { console.log(`have  ${kind}/${name}`); return true; }
  const licenses = spec.licenses ?? catalog[kind]?.licenses ?? ['cc0'];
  for (const q of spec.queries) {
    let cands = [];
    try {
      if (kind === 'sfx') cands = [...(await freesound(q, spec)), ...(await openverse(q, {licenses}))];
      if (kind === 'music') cands = await openverse(q, {category: 'music', licenses});
      if (kind === 'stock') cands = [...(await pexels(q)), ...(await pixabay(q))];
    } catch (e) { console.warn(`  ${q}: ${e.message}`); continue; }
    const fits = cands.filter((c) => (!spec.max || c.durationS <= spec.max) && (!spec.min || c.durationS >= spec.min) && c.durationS > 0.05);
    for (const c of fits.filter((x) => !used.has(x.url) && !used.has(x.landing)).slice(0, 4)) {
      try {
        if (used.has(c.url)) continue;
        const buf = Buffer.from(await (await fetchRetry(c.url, {}, 3, 180000)).arrayBuffer());
        if (buf.length < 2000) continue;
        fs.writeFileSync(out, buf);
        used.add(c.url); used.add(c.landing);
        credits[`${kind}/${name}.${ext}`] = {url: c.url, title: c.title, creator: c.creator, license: c.license, licenseVersion: c.licenseVersion, licenseUrl: LICENSE_URL[c.license], source: c.source, landing: c.landing, query: q, attribution: attribution(c)};
        console.log(`saved ${kind}/${name}.${ext}  ← ${attribution(c)}`);
        return true;
      } catch (e) { console.warn(`  download failed: ${e.message}`); }
    }
    await sleep(400);
  }
  console.warn(`!! ${kind}/${name}: nothing suitable found${kind === 'stock' && !secrets('PEXELS_API_KEY') && !secrets('PIXABAY_API_KEY') ? ' (stock needs a free PEXELS_API_KEY or PIXABAY_API_KEY)' : ''}`);
  return false;
}

function copyStarter() {
  const starter = path.join(skill, 'assets', 'starter');
  if (!fs.existsSync(starter)) return;
  const sc = fs.existsSync(path.join(starter, 'credits.json')) ? JSON.parse(fs.readFileSync(path.join(starter, 'credits.json'), 'utf8')) : {};
  for (const kind of ['sfx', 'music']) {
    const dir = path.join(starter, kind);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      const dst = path.join(DIRS[kind], f);
      if (fs.existsSync(dst)) continue;
      fs.copyFileSync(path.join(dir, f), dst);
      if (sc[`${kind}/${f}`]) credits[`${kind}/${f}`] = sc[`${kind}/${f}`];
    }
  }
}

let projectCredits = null;
function writeCredits() {
  if (projectCredits) {
    const pc = fs.existsSync(projectCredits) ? JSON.parse(fs.readFileSync(projectCredits, 'utf8')) : {};
    for (const [k, v] of Object.entries(credits)) if (!credits0.has(k)) pc[k] = v;
    fs.writeFileSync(projectCredits, JSON.stringify(pc, null, 2) + '\n');
    console.log('credit →', projectCredits);
    return;
  }
  fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 2) + '\n');
  const rows = Object.entries(credits).sort().map(([f, c]) => `| ${f} | ${c.attribution.replace(/\|/g, '/')} |`);
  fs.writeFileSync(path.join(lib, 'CREDITS.md'), `# Media credits\n\nEvery file here came from an open source with the license shown. CC BY items need the credit line in your video description (the kit's seo.mjs adds it).\n\n| File | Credit |\n|---|---|\n${rows.join('\n')}\n`);
}

// ---------- main ----------
const [cmd, query] = args;
if (['sfx', 'music', 'stock'].includes(cmd) && query && !query.startsWith('--')) {
  const name = opt('name') ?? query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const proj = opt('project');
  if (proj) {
    const pub = path.join(path.resolve(proj), 'public');
    DIRS[cmd] = cmd === 'stock' ? path.join(pub, 'stock') : path.join(pub, 'audio', cmd);
    projectCredits = path.join(pub, 'credits.json');
  }
  fs.mkdirSync(DIRS[cmd], {recursive: true});
  // exact phrase first, then broader fallbacks (each word, word + "background") so a sound-brief search rarely comes back empty
  const words = query.split(/\s+/).filter((w) => w.length > 3);
  const queries = [...new Set([query, ...words, ...(cmd === 'music' ? words.map((w) => `${w} background`) : [])])];
  const spec = {queries, min: opt('min') ? Number(opt('min')) : cmd === 'music' ? 45 : undefined, max: opt('max') ? Number(opt('max')) : cmd === 'sfx' ? 4 : undefined};
  await pick(cmd, name, spec);
} else {
  const only = opt('only');
  copyStarter();
  let missing = 0;
  for (const kind of ['sfx', 'music', 'stock']) {
    if (only && only !== kind) continue;
    if (kind === 'stock' && !secrets('PEXELS_API_KEY') && !secrets('PIXABAY_API_KEY')) { console.log('skip  stock (add a free PEXELS_API_KEY or PIXABAY_API_KEY to secrets.env to fetch stock clips)'); continue; }
    for (const [name, spec] of Object.entries(catalog[kind].items)) if (!(await pick(kind, name, {...spec, licenses: catalog[kind].licenses}))) missing++;
  }
  console.log(`\nLibrary: ${lib}${missing ? `  (${missing} item(s) not found: run again later or add keys)` : ''}`);
}
writeCredits();
