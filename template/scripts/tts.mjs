// Voiceover generator: script JSON → one MP3 per line + word timings (drive captions and animation beats).
// Usage: node scripts/tts.mjs scripts/videos/<id>.json [--force]
// Voices come from video.config.json → "voices" (each line names one by key). Providers:
//   edge        FREE, no key: Microsoft Edge neural voices via the open-source Python package edge-tts
//               (python -m pip install --user edge-tts). Same voice names as Azure. Unofficial endpoint.
//   azure       Azure Speech neural voices (free F0 tier is enough). Secrets: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION
//   elevenlabs  ElevenLabs (paid, most natural). Secret: ELEVENLABS_API_KEY. Voice needs "voiceId".
//   recorded    Your own recording: put public/vo/<id>/<line>.mp3 yourself + run with --words-from=<transcript json> (see references/voice.md)
// Script text supports [pause 300] and *emphasis* markers.
// Output: public/vo/<id>/<line>.mp3 and src/episodes/<id>/vo.json (cached per line: only changed lines are re-voiced).
import fs from 'node:fs';
import path from 'node:path';
import {readConfig, root, secret} from './lib.mjs';

const cfg = readConfig();
const cast = cfg.voices;
const scriptFile = process.argv[2];
if (!scriptFile) throw new Error('Usage: node scripts/tts.mjs scripts/videos/<id>.json [--force]');
const script = JSON.parse(fs.readFileSync(path.resolve(root, scriptFile), 'utf8'));
const force = process.argv.includes('--force');

const audioDir = path.join(root, 'public', 'vo', script.id);
const dataDir = path.join(root, 'src', 'episodes', script.id);
fs.mkdirSync(audioDir, {recursive: true});
fs.mkdirSync(dataDir, {recursive: true});
const outJson = path.join(dataDir, 'vo.json');
const previous = fs.existsSync(outJson) ? JSON.parse(fs.readFileSync(outJson, 'utf8')) : {};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = (s) => s.replace(/\[pause \d+\]/g, ' ').replace(/\*/g, '').replace(/\s+/g, ' ').trim();

// ---------- edge (free) ----------
const PY = process.env.PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
async function edge(line, v) {
  const {spawnSync} = await import('node:child_process');
  const file = path.join(audioDir, `${line.id}.mp3`);
  // edge-tts takes plain text: pauses become a comma break, emphasis markers are dropped
  const text = line.text.replace(/\[pause \d+\]/g, ', ').replace(/\*/g, '');
  const pct = (x, d) => String(x ?? d);
  const rate = pct(line.rate ?? v.rate, '+0%');
  // config pitch is in % (Azure style); edge-tts wants Hz: about 2 Hz per %
  const p = String(line.pitch ?? v.pitch ?? '+0%');
  const pitch = /Hz$/.test(p) ? p : `${parseFloat(p) >= 0 ? '+' : ''}${Math.round(parseFloat(p) * 2)}Hz`;
  let r;
  for (let attempt = 1; attempt <= 3; attempt++) {
    r = spawnSync(PY, ['-P', path.join(root, 'scripts', 'edge_tts.py'), v.name, rate, pitch, file], {input: text, encoding: 'utf8', timeout: 120000});
    if (r.status === 0) break;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000 * attempt); // back off on network blips
  }
  if (r.error?.code === 'ENOENT') throw new Error(`Python not found. Install Python 3 (python.org), then: ${PY} -m pip install --user edge-tts (or set PYTHON=path)`);
  if (r.status !== 0) throw new Error(`edge-tts failed: ${(r.stderr || '').split('\n').filter(Boolean).slice(-2).join(' ')}${/No module named/.test(r.stderr) ? ` → ${PY} -m pip install --user edge-tts` : ''}`);
  const {words} = JSON.parse(r.stdout.trim().split('\n').pop());
  // edge streams 24 kHz 48 kbit/s CBR mp3, so length = bytes × 8 / 48000
  const durationMs = Math.round((fs.statSync(file).size * 8) / 48);
  return {audio: null, durationMs, words};
}

// ---------- Azure ----------
async function azure(line, v) {
  const {default: sdk} = await import('microsoft-cognitiveservices-speech-sdk');
  const toSsml = (text) => esc(text).replace(/\[pause (\d+)\]/g, '<break time="$1ms"/>').replace(/\*([^*]+)\*/g, '<emphasis level="strong">$1</emphasis>');
  const sc = sdk.SpeechConfig.fromSubscription(secret('AZURE_SPEECH_KEY'), secret('AZURE_SPEECH_REGION'));
  sc.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio48Khz192KBitRateMonoMp3;
  const synth = new sdk.SpeechSynthesizer(sc, null);
  const words = [];
  synth.wordBoundary = (_s, e) => {
    const startMs = e.audioOffset / 10000;
    const durMs = e.duration > 100000 ? e.duration / 10000 : e.duration; // ticks in some SDK builds
    const type = String(e.boundaryType);
    if (/Punctuation/i.test(type)) { if (words.length) words[words.length - 1].text += e.text; return; } // keep "money." for captions
    if (/Sentence/i.test(type)) return;
    words.push({text: e.text, startMs: Math.round(startMs), endMs: Math.round(startMs + durMs)});
  };
  const rate = line.rate ?? v.rate ?? '+0%';
  const pitch = line.pitch ?? v.pitch ?? '+0%';
  const style = v.style ? `<mstts:express-as style="${v.style}">` : '';
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${v.lang}"><voice name="${v.name}">${style}<prosody rate="${rate}" pitch="${pitch}">${toSsml(line.text)}</prosody>${style ? '</mstts:express-as>' : ''}</voice></speak>`;
  return new Promise((resolve, reject) => {
    synth.speakSsmlAsync(ssml, (r) => {
      synth.close();
      if (r.reason !== sdk.ResultReason.SynthesizingAudioCompleted) return reject(new Error(r.errorDetails || 'synthesis failed'));
      resolve({audio: Buffer.from(r.audioData), durationMs: Math.round(r.audioDuration / 10000), words});
    }, (err) => { synth.close(); reject(err); });
  });
}

// ---------- ElevenLabs ----------
async function elevenlabs(line, v) {
  if (!v.voiceId) throw new Error(`voice "${line.voice}" needs a voiceId for ElevenLabs`);
  const text = line.text.replace(/\[pause (\d+)\]/g, (_m, n) => ` <break time="${(Number(n) / 1000).toFixed(1)}s" /> `).replace(/\*/g, '');
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voiceId}/with-timestamps?output_format=mp3_44100_192`, {
    method: 'POST',
    headers: {'xi-api-key': secret('ELEVENLABS_API_KEY'), 'content-type': 'application/json'},
    body: JSON.stringify({text, model_id: v.model ?? 'eleven_multilingual_v2', voice_settings: {stability: v.stability ?? 0.45, similarity_boost: v.similarity ?? 0.8, style: v.styleExaggeration ?? 0.25, speed: v.speed ?? 1.05}}),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const j = await res.json();
  const a = j.alignment ?? j.normalized_alignment;
  // characters → words
  const words = [];
  let cur = null;
  a.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } return; }
    const s = Math.round(a.character_start_times_seconds[i] * 1000);
    const e = Math.round(a.character_end_times_seconds[i] * 1000);
    if (!cur) cur = {text: ch, startMs: s, endMs: e}; else { cur.text += ch; cur.endMs = e; }
  });
  if (cur) words.push(cur);
  const clean = words.filter((w) => !/^<break|^time=|^\/>$/.test(w.text));
  const durationMs = Math.round(a.character_end_times_seconds.at(-1) * 1000) + 120;
  return {audio: Buffer.from(j.audio_base64, 'base64'), durationMs, words: clean};
}

// ---------- your own recording ----------
async function recorded(line) {
  const file = path.join(audioDir, `${line.id}.mp3`);
  if (!fs.existsSync(file)) throw new Error(`recorded voice: put your take at ${path.relative(root, file)}`);
  if (!line.words) throw new Error(`recorded voice: line "${line.id}" needs "words" timings (transcribe it, see references/05-voice.md)`);
  return {audio: null, durationMs: line.durationMs ?? line.words.at(-1).endMs + 150, words: line.words};
}

const PROVIDERS = {edge, azure, elevenlabs, recorded};

const result = {};
for (const line of script.lines) {
  const v = cast[line.voice];
  if (!v) throw new Error(`Unknown voice "${line.voice}" (see "voices" in video.config.json)`);
  const provider = PROVIDERS[v.provider ?? 'edge'];
  if (!provider) throw new Error(`Unknown provider "${v.provider}" (edge | azure | elevenlabs | recorded)`);
  const file = path.join(audioDir, `${line.id}.mp3`);
  const key = JSON.stringify([v.provider, v.name ?? v.voiceId, line.voice, line.text, line.rate, line.pitch, v.rate, v.pitch]);
  if (!force && previous[line.id]?.key === key && fs.existsSync(file)) { result[line.id] = previous[line.id]; console.log('cached', line.id); continue; }
  const {audio, durationMs, words} = await provider(line, v);
  if (audio) fs.writeFileSync(file, audio);
  result[line.id] = {key, voice: line.voice, text: plain(line.text), file: `vo/${script.id}/${line.id}.mp3`, durationMs, words};
  console.log('voiced', line.id.padEnd(14), line.voice.padEnd(10), `${(durationMs / 1000).toFixed(1)}s`, `${words.length} words`);
}
fs.writeFileSync(outJson, JSON.stringify(result, null, 1));
const total = Object.values(result).reduce((a, l) => a + l.durationMs, 0);
console.log('wrote', path.relative(root, outJson), `· narration ${(total / 1000).toFixed(1)}s`);
