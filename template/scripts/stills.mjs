// Render sample stills of compositions for review (look at them before any full render).
// Usage: node scripts/stills.mjs <outDir> <CompId>:<f1>,<f2>,... | <CompId>:auto [...]
//   auto = 16 frames spread across the video.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {root} from './lib.mjs';

const [outDir, ...specs] = process.argv.slice(2);
if (!outDir || !specs.length) throw new Error('Usage: node scripts/stills.mjs <outDir> <CompId>:auto');
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
for (const spec of specs) {
  const [id, list = 'auto'] = spec.split(':');
  const comp = await selectComposition({serveUrl, id, timeoutInMilliseconds: 120000});
  const frames = list === 'auto' ? Array.from({length: 16}, (_, i) => Math.round(((i + 0.5) / 16) * comp.durationInFrames)) : list.split(',').map(Number);
  console.log(id, comp.durationInFrames, 'frames', (comp.durationInFrames / comp.fps).toFixed(1) + 's');
  for (const frame of frames) {
    await renderStill({composition: comp, serveUrl, frame, output: path.join(outDir, `${id}-${String(frame).padStart(5, '0')}.jpg`), imageFormat: 'jpeg', scale: 0.4, timeoutInMilliseconds: 120000});
  }
}

// Remotion leaves a full copy of public/ in the temp folder on every bundle: delete it (these add up to GBs).
fs.rmSync(serveUrl, {recursive: true, force: true});
