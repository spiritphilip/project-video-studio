// Downloads the brand fonts (latin subset, the weights in video.config.json) ONCE into public/fonts/,
// so renders never depend on Google's CDN (flaky connections make renders hang on "Fetching … font").
// brand.mjs uses the local files automatically when they are all present; otherwise it falls back to Google.
// Usage: node scripts/fonts.mjs        (then: node scripts/brand.mjs)
import fs from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import {readConfig, root} from './lib.mjs';

const require = createRequire(path.join(root, 'package.json'));
const cfg = readConfig();
const dir = path.join(root, 'public', 'fonts');
fs.mkdirSync(dir, {recursive: true});
const mod = (family) => family.replace(/[^A-Za-z0-9]/g, '');

async function get(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    try {
      const r = await fetch(url, {signal: AbortSignal.timeout(12000)});
      if (r.ok) return Buffer.from(await r.arrayBuffer());
      throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      if (i === tries) throw e;
      await new Promise((res) => setTimeout(res, 800 * i));
    }
  }
}

let failed = 0;
for (const f of Object.values(cfg.brand.fonts)) {
  const info = require(`@remotion/google-fonts/${mod(f.family)}`).getInfo();
  for (const w of f.weights) {
    const out = path.join(dir, `${mod(f.family)}-${w}.woff2`);
    if (fs.existsSync(out)) { console.log('have ', path.basename(out)); continue; }
    const url = info.fonts.normal?.[w]?.latin;
    if (!url) { console.warn(`!! ${f.family} has no weight ${w} (latin)`); failed++; continue; }
    try { fs.writeFileSync(out, await get(url)); console.log('saved', path.basename(out)); }
    catch (e) { console.warn(`!! ${f.family} ${w}: ${e.message} (run again later)`); failed++; }
  }
}
console.log(failed ? `${failed} font file(s) missing: brand.ts keeps using Google Fonts until they are all here.` : 'all fonts local. Run: node scripts/brand.mjs');
