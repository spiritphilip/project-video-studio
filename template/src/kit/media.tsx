// Media kit: logo bug, voice + synced captions, music bed with ducking, sound effects, graded footage, soundbites.
import type {Caption} from '@remotion/captions';
import {Audio, Video} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {alpha, BODY, BRAND, C} from '../brand';
import {BrandCaptions} from './captions';
import {clamp, Kinetic, Pill, useStage} from './index';

export type Word = {text: string; startMs: number; endMs: number};
export type VoLine = {voice: string; file: string; durationMs: number; words: Word[]; text?: string};
export type SpokenWord = Word;

/** Small brand logo, top-left, on every scene. */
export const LogoBug: React.FC = () => {
  const f = useCurrentFrame();
  const {u} = useStage();
  return (
    <Img src={staticFile(BRAND.logo)}
      style={{position: 'absolute', top: 54 * u, left: 72 * u, height: 38 * u, opacity: interpolate(f, [0, 12], [0, 0.92], clamp),
        filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.6))'}} />
  );
};

/** One-shot sound effect at a local frame (files in public/audio/sfx/<name>.mp3). */
export const Sfx: React.FC<{src: string; at: number; volume?: number}> = ({src, at, volume = 0.5}) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={150} layout="none" name={`sfx ${src}`}>
    <Audio src={staticFile(`audio/sfx/${src}.mp3`)} volume={volume} />
  </Sequence>
);

/** Music bed: fades in/out, sits under the voice. `duck` = [from, to] frame ranges with real speech: music drops to 25%. */
export const MusicBed: React.FC<{src: string; volume?: number; duck?: [number, number][]}> = ({src, volume = 0.1, duck = []}) => {
  const {durationInFrames} = useVideoConfig();
  const duckAt = (f: number) => duck.reduce((m, [a, b]) => Math.min(m, interpolate(f, [a - 10, a, b, b + 10], [1, 0.25, 0.25, 1], clamp)), 1);
  return (
    <Audio src={staticFile(`audio/music/${src}.mp3`)} loop
      volume={(f) => volume * duckAt(f) * interpolate(f, [0, 30, durationInFrames - 50, durationInFrames], [0, 1, 1, 0], clamp)} />
  );
};

/** Words → captions, a new caption page at each sentence end or long pause. */
export const toCaptions = (words: Word[]): Caption[] => words.map((w, i) => {
  const next = words[i + 1];
  return {
    text: (i ? ' ' : '') + w.text, startMs: w.startMs, endMs: w.endMs, timestampMs: (w.startMs + w.endMs) / 2, confidence: null,
    ...(next && (/[.!?]$/.test(w.text) || next.startMs - w.endMs > 350) ? {pageBreakAfter: true} : {}),
  };
});

/** Voice line + its synced captions, starting at a local frame. */
export const VoiceLine: React.FC<{line: VoLine; at: number; captions?: boolean}> = ({line, at, captions = true}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={at} durationInFrames={Math.ceil((line.durationMs / 1000) * fps) + 6} layout="none" name={`vo ${line.file}`}>
      <Audio src={staticFile(line.file)} volume={1} />
      {captions && <BrandCaptions captions={toCaptions(line.words)} />}
    </Sequence>
  );
};

/** Frame (local to the line's start) at which word #n (0-based, or the first word starting with `match`) is spoken. */
export const wordAt = (line: VoLine, match: number | string, fps = 30): number => {
  const i = typeof match === 'number' ? match : line.words.findIndex((w) => w.text.toLowerCase().replace(/[^a-z0-9']/g, '').startsWith(match.toLowerCase()));
  if (i < 0 || !line.words[i]) throw new Error(`word "${match}" not found in ${line.file}`);
  return Math.round((line.words[i].startMs / 1000) * fps);
};

/** Stock / event footage, cover-fit, slow push, brand colour grade so it sits with the animation. */
export const StockClip: React.FC<{src: string; trimBefore?: number; grade?: 'duo' | 'dark' | 'none'; zoom?: [number, number]; rate?: number}> = ({
  src, trimBefore = 0, grade = 'dark', zoom = [1.06, 1.0], rate = 1,
}) => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const s = interpolate(f, [0, durationInFrames], zoom);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: C.bg}}>
      <AbsoluteFill style={{transform: `scale(${s})`}}>
        <Video src={staticFile(src)} trimBefore={trimBefore} muted playbackRate={rate} objectFit="cover"
          style={{width: '100%', height: '100%', filter: grade === 'duo' ? 'grayscale(1) contrast(1.15)' : 'saturate(1.1) contrast(1.05)'}} />
      </AbsoluteFill>
      {grade === 'duo' && <AbsoluteFill style={{background: `linear-gradient(135deg, ${alpha(C.secondary, 0.8)}, ${alpha(C.primary, 0.55)})`, mixBlendMode: 'multiply'}} />}
      {grade !== 'none' && <AbsoluteFill style={{background: `radial-gradient(ellipse at center, ${alpha(C.bg, 0.35)}, ${alpha(C.bg, 0.88)} 80%)`}} />}
    </AbsoluteFill>
  );
};

/** A real speaker clip with its own voice: light grade, vignette, a name label and burned-in captions. */
export const Soundbite: React.FC<{src: string; fromS: number; toS: number; words: Word[]; label?: string; volume?: number}> = ({src, fromS, toS, words, label, volume = 1}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {u} = useStage();
  const n = Math.round((toS - fromS) * fps);
  const z = interpolate(f, [0, n], [1.0, 1.05]);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${z})`}}>
        <Video src={staticFile(src)} trimBefore={Math.round(fromS * fps)} objectFit="cover" style={{width: '100%', height: '100%', filter: 'saturate(1.08) contrast(1.05)'}}
          volume={(fr) => volume * interpolate(fr, [0, 4, n - 6, n], [0, 1, 1, 0], clamp)} />
      </AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, transparent 50%, ${alpha(C.bg, 0.6)} 100%)`}} />
      {label && (
        <div style={{position: 'absolute', left: 72 * u, bottom: 180 * u, opacity: interpolate(f, [4, 14], [0, 1], clamp), display: 'flex', alignItems: 'center', gap: 14,
          padding: '10px 22px', borderRadius: 999, background: alpha(C.bg, 0.75), border: `1px solid ${C.line}`, fontFamily: BODY, fontWeight: 600, fontSize: 26 * u, color: C.text}}>
          <span style={{width: 10, height: 10, borderRadius: 5, background: C.primary}} /> {label}
        </div>
      )}
      <BrandCaptions captions={toCaptions(words)} />
    </AbsoluteFill>
  );
};

/** Closing card: big logo, next-up pill, URL. */
export const EndCard: React.FC<{next: string; url?: string}> = ({next, url = BRAND.url}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f, fps, config: {damping: 14, stiffness: 110}});
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div style={{position: 'absolute', width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(C.primary, 0.35)}, transparent 65%)`, transform: `scale(${0.6 + p * 0.5})`}} />
      <Img src={staticFile(BRAND.logo)} style={{height: 120, transform: `scale(${0.7 + p * 0.3})`, opacity: p}} />
      <div style={{height: 46}} />
      <Pill delay={14} hot size={34}>Next: {next}</Pill>
      <div style={{height: 34}} />
      <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 32, letterSpacing: 2, color: C.muted, opacity: interpolate(f, [24, 40], [0, 1], clamp)}}>{url}</div>
    </AbsoluteFill>
  );
};

/** Centred headline over footage. */
export const OverlayHeadline: React.FC<{text: string; at: number; sub?: string; subAt?: number; size?: number}> = ({text, at, sub, subAt = at + 20, size = 104}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 90}}>
      <Kinetic text={text} size={size} delay={at} />
      {sub && <div style={{marginTop: 28, fontFamily: BODY, fontWeight: 500, fontSize: 38, color: C.muted, opacity: interpolate(f, [subAt, subAt + 14], [0, 1], clamp)}}>{sub}</div>}
    </AbsoluteFill>
  );
};
