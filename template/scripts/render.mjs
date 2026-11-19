// Render queue: renders compositions ONE AT A TIME (laptops choke on parallel renders), retries once,
// then loudness-normalises each to YouTube level (-14 LUFS, -1.5 dBTP; video stream copied).
// Usage: node scripts/render.mjs <CompId> [<CompId> ...]   (or --all for every episode)
// Env: CONC=4 (render concurrency), FORCE=1 (re-render even if out/final/<id>.mp4 exists)
// Output: out/raw/<id>.mp4 → out/final/<id>.mp4 · log: out/render.log
import {bundle} from '@remotion/bundler';
import {getCompositions, renderMedia, selectComposition} from '@remotion/renderer';
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {root} from './lib.mjs';

const out = (...p) => path.join(root, 'out', ...p);
fs.mkdirSync(out('raw'), {recursive: true});
fs.mkdirSync(out('final'), {recursive: true});
const log = (m) => { const line = `${new Date().toTimeString().slice(0, 5)} ${m}`; console.log(line); fs.appendFileSync(out('render.log'), line + '\n'); };

const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
let ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (process.argv.includes('--all')) ids = (await getCompositions(serveUrl, {timeoutInMilliseconds: 120000})).map((c) => c.id).filter((id) => !/^(Brand|Thumb|Demo|Presenter)/.test(id));
if (!ids.length) throw new Error('Usage: node scripts/render.mjs <CompId> [...] | --all');
const conc = Number(process.env.CONC || 4);

for (const id of ids) {
  const final = out('final', `${id}.mp4`);
  if (fs.existsSync(final) && !process.env.FORCE) { log(`-- ${id} already done, skipped`); continue; }
  log(`== ${id} start`);
  const composition = await selectComposition({serveUrl, id, timeoutInMilliseconds: 120000});
  let ok = false;
  for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
    try {
      let last = -1;
      await renderMedia({composition, serveUrl, codec: 'h264', timeoutInMilliseconds: 120000, outputLocation: out('raw', `${id}.mp4`), concurrency: conc,
        onProgress: ({progress}) => { const p = Math.floor(progress * 10); if (p !== last) { last = p; process.stdout.write(`  ${id} ${p * 10}%\r`); } }});
      ok = true;
    } catch (e) { log(`!! ${id} render failed (attempt ${attempt}): ${e.message.split('\n')[0]}`); }
  }
  if (!ok) { log(`!! ${id} GAVE UP`); continue; }
  try {
    execSync(`npx remotion ffmpeg -hide_banner -loglevel error -y -i "${out('raw', `${id}.mp4`)}" -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k "${final}"`, {cwd: root, stdio: 'inherit'});
    log(`== ${id} done → out/final/${id}.mp4 (${(composition.durationInFrames / composition.fps).toFixed(0)}s)`);
  } catch { log(`!! ${id} loudnorm failed (raw render is fine: out/raw/${id}.mp4)`); }
}

// Remotion leaves a full copy of public/ in the temp folder on every bundle: delete it (these add up to GBs).
fs.rmSync(serveUrl, {recursive: true, force: true});
