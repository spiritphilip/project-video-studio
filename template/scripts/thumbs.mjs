// Renders every Thumb-* composition to out/thumbs/<id>.jpg (1280×720, YouTube-ready).
// Usage: node scripts/thumbs.mjs [<ThumbId> ...]
import {bundle} from '@remotion/bundler';
import {getCompositions, renderStill} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {root} from './lib.mjs';

const want = process.argv.slice(2);
const dir = path.join(root, 'out', 'thumbs');
fs.mkdirSync(dir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts')});
const comps = (await getCompositions(serveUrl, {timeoutInMilliseconds: 120000})).filter((c) => c.id.startsWith('Thumb-') && (!want.length || want.includes(c.id) || want.includes(c.id.slice(6))));
for (const c of comps) {
  const output = path.join(dir, `${c.id.slice(6)}.jpg`);
  await renderStill({composition: c, serveUrl, frame: 0, output, imageFormat: 'jpeg', jpegQuality: 92, timeoutInMilliseconds: 120000});
  console.log('thumb', path.relative(root, output));
}

// Remotion leaves a full copy of public/ in the temp folder on every bundle: delete it (these add up to GBs).
fs.rmSync(serveUrl, {recursive: true, force: true});
