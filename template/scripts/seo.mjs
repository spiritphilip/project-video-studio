// Builds youtube/seo.json (title, description, tags, privacy, chapters) for every video from
// youtube/seo-source.json + the "publish" block of video.config.json.
// Usage: node scripts/seo.mjs
//
// seo-source.json: [{ "id": "M1-GetStarted", "track": "start", "ep": "Episode 1", "privacy": "public",
//   "title": "Search-shaped title, under 70 chars", "hook": "First 150 chars = what the viewer gets.",
//   "points": ["What this video covers", "..."], "extra": "optional disclaimer", "tags": ["long-tail", "..."],
//   "chapters": [["0:00", "Intro"], ["0:06", "Sign in"]] }]
// CC BY music/sfx listed in public/credits.json get their required credit line appended to every description.
import fs from 'node:fs';
import path from 'node:path';
import {readConfig, root} from './lib.mjs';

const cfg = readConfig();
const pub = cfg.publish ?? {};
const site = (pub.site || cfg.project.url || '').replace(/\/$/, '');
const src = JSON.parse(fs.readFileSync(path.join(root, 'youtube', 'seo-source.json'), 'utf8'));
const creditsFile = path.join(root, 'public', 'credits.json');
const credits = fs.existsSync(creditsFile) ? JSON.parse(fs.readFileSync(creditsFile, 'utf8')) : {};
const byCredits = Object.values(credits).filter((c) => c.license === 'by').map((c) => `• ${c.attribution}`);
const creditBlock = byCredits.length ? ['', 'Music & sound credits:', ...byCredits] : [];
const MAX = 4900; // YouTube limit is 5000 characters

const out = src.map((v) => {
  const track = cfg.tracks?.[v.track] ?? {name: v.track};
  const link = pub.trackLinks?.[v.track] ? site + pub.trackLinks[v.track] : null;
  const lines = [
    v.hook, '',
    'In this video:', ...v.points.map((p) => `• ${p}`), '',
    ...(v.chapters?.length ? ['Chapters:', ...v.chapters.map(([t, n]) => `${t} ${n}`), ''] : []),
    ...(link ? [`▶ Watch the whole ${track.name} series: ${link}`] : []),
    ...(site ? [`🌍 ${cfg.brand.name}: ${site}`] : []),
    '',
    `${pub.seriesName ?? cfg.brand.name} · ${track.name} · ${v.ep}`,
    ...(cfg.brand.poweredBy ? [`Powered by ${cfg.brand.poweredBy}`] : []),
    ...(v.extra ? ['', v.extra] : []),
    ...creditBlock,
    '', (pub.hashtags ?? []).join(' '),
  ];
  const tags = [...new Set([...(pub.baseTags ?? []), ...(v.tags ?? [])])];
  let total = 0;
  const capped = tags.filter((t) => (total += t.length + 1) <= 480); // YouTube: 500 chars of tags
  if (v.title.length > 100) console.warn(`!! ${v.id}: title over 100 chars`);
  let description = lines.join('\n').trim();
  if (description.length > MAX) {
    // trim the body, never the credits or hashtags
    const tail = [...creditBlock, '', (pub.hashtags ?? []).join(' ')].join('\n');
    console.warn(`!! ${v.id}: description ${description.length} chars, trimmed to ${MAX}`);
    description = (description.slice(0, MAX - tail.length - 2).replace(/\n[^\n]*$/, '') + '\n' + tail).trim();
  }
  return {id: v.id, track: v.track, privacy: v.privacy ?? 'public', title: v.title, description, tags: capped};
});
fs.writeFileSync(path.join(root, 'youtube', 'seo.json'), JSON.stringify(out, null, 2));
console.log(`wrote youtube/seo.json (${out.length} videos)`);
