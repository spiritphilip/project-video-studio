// Episode engine: an episode = (cold open) → brand intro → voice-driven scenes → brand outro.
// Each scene lists the voice lines it covers; its length = those lines + small gaps.
// Scene renderers get `at(lineId, word?)` = the LOCAL frame a line (or a word in it) is spoken,
// so every animation beat lands on the narration. Change the script → re-voice → timing follows.
import {TransitionSeries, linearTiming, type TransitionPresentation} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import React from 'react';
import {AbsoluteFill, interpolate, Sequence, staticFile} from 'remotion';
import {Audio, Video} from '@remotion/media';
import {BUMPERS, C, FPS, MUSIC} from '../brand';
import {BrandIntro, BrandOutro, INTRO_FRAMES, OUTRO_FRAMES} from './bumpers';
import {BrandCaptions} from './captions';
import {LogoBug, MusicBed, Sfx, toCaptions, VoiceLine, type VoLine, type Word, wordAt} from './media';
import {Presenter, type PresenterProps} from './presenter';

const LEAD = 8; // frames of picture before the first line of a scene
const GAP = 12; // frames between two lines in the same scene
const TAIL = 14; // frames after the last line
const T = 12; // transition length

export type At = (lineId: string, word?: number | string) => number;
export type SceneDef = {
  name: string;
  lines: string[];
  render: (ctx: {at: At; vo: Record<string, VoLine>; dur: number}) => React.ReactNode;
  transition?: 'fade' | 'slide' | 'wipe' | 'slide-up';
  /** Extra frames to hold after the last line (e.g. for a final animation). */
  hold?: number;
  /** Hide burned-in captions (e.g. a dialogue scene with on-screen bubbles). */
  captions?: boolean;
  /** Hide the top-left logo bug. */
  noLogo?: boolean;
  /** Fixed length for a scene with no narration (e.g. a speaker soundbite). */
  frames?: number;
  /** Real speech plays in this scene: duck the music bed. */
  duckMusic?: boolean;
  /** Presenter style: false hides the episode presenter in this scene; an object overrides its props. */
  presenter?: false | Partial<PresenterProps>;
};
/** Optional cold open: a real-footage "hit" with its OWN sound, before the brand intro.
 *  `cutAtS`: the picture ends here and the brand intro takes over while the clip's VOICE carries on to `toS`. */
export type ColdOpen = {src: string; fromS: number; toS: number; cutAtS?: number; volume?: number; words?: Word[]};
export type EpisodeDef = {
  track: string; episode: string; title: string;
  music?: string | null;
  coldOpen?: ColdOpen;
  /** Show the animated presenter in every scene (style "presenter-character"). */
  presenter?: Partial<PresenterProps>;
  scenes: SceneDef[];
};

const hasIntro = BUMPERS !== 'none';
const hasOutro = BUMPERS === 'intro-outro';
const introLen = hasIntro ? INTRO_FRAMES : 0;
const outroLen = hasOutro ? OUTRO_FRAMES : 0;
const coldFrames = (c?: ColdOpen) => (c ? Math.round(((c.cutAtS ?? c.toS) - c.fromS) * FPS) : 0); // picture
const coldAudioFrames = (c?: ColdOpen) => (c ? Math.round((c.toS - c.fromS) * FPS) : 0); // voice

const lineFrames = (vo: Record<string, VoLine>, id: string) => {
  if (!vo[id]) throw new Error(`voice line "${id}" missing — run: node scripts/tts.mjs scripts/videos/<id>.json`);
  return Math.ceil((vo[id].durationMs / 1000) * FPS);
};

/** Local start frame of each line inside its scene. */
function lineStarts(vo: Record<string, VoLine>, s: SceneDef) {
  const starts: Record<string, number> = {};
  let t = LEAD;
  for (const id of s.lines) { starts[id] = t; t += lineFrames(vo, id) + GAP; }
  return {starts, end: t - GAP};
}
const sceneLen = (vo: Record<string, VoLine>, s: SceneDef) => (s.frames ?? lineStarts(vo, s).end + TAIL) + (s.hold ?? 0);

/** Total frames: (cold open) + intro + scenes + outro, minus every transition overlap. */
export function episodeDuration(vo: Record<string, VoLine>, ep: EpisodeDef) {
  const scenes = ep.scenes.map((s) => sceneLen(vo, s));
  const cold = coldFrames(ep.coldOpen);
  const seqs = (cold ? 1 : 0) + (hasIntro ? 1 : 0) + scenes.length + (hasOutro ? 1 : 0);
  return cold + introLen + scenes.reduce((a, b) => a + b, 0) + outroLen - T * (seqs - 1);
}

type AnyPresentation = TransitionPresentation<Record<string, unknown>>;
const presentation = (t: SceneDef['transition']): AnyPresentation =>
  (t === 'slide' ? slide({direction: 'from-right'}) : t === 'slide-up' ? slide({direction: 'from-bottom'}) : t === 'wipe' ? wipe({direction: 'from-left'}) : fade()) as unknown as AnyPresentation;
// TransitionSeries only accepts its own elements as direct children, so transitions are created inline (no wrapper component).
const tr = (key: string, t?: SceneDef['transition']) => <TransitionSeries.Transition key={key} presentation={presentation(t)} timing={linearTiming({durationInFrames: T})} />;

export const Episode: React.FC<{ep: EpisodeDef; vo: Record<string, VoLine>}> = ({ep, vo}) => {
  const seq: React.ReactNode[] = [];
  const push = (node: React.ReactNode, transition?: SceneDef['transition']) => { if (seq.length) seq.push(tr(`t${seq.length}`, transition)); seq.push(node); };
  if (ep.coldOpen) push(<TransitionSeries.Sequence key="cold" name="Cold open" durationInFrames={coldFrames(ep.coldOpen)}><ColdOpenClip c={ep.coldOpen} /></TransitionSeries.Sequence>);
  if (hasIntro) push(
    <TransitionSeries.Sequence key="intro" name="Brand intro" durationInFrames={INTRO_FRAMES}>
      <BrandIntro track={ep.track} episode={ep.episode} title={ep.title} quietSfx={!!ep.coldOpen && coldAudioFrames(ep.coldOpen) > coldFrames(ep.coldOpen)} />
    </TransitionSeries.Sequence>,
  );
  ep.scenes.forEach((s, i) => {
    const {starts} = lineStarts(vo, s);
    const at: At = (lineId, word) => {
      if (starts[lineId] === undefined) throw new Error(`line "${lineId}" is not in scene "${s.name}"`);
      return starts[lineId] + (word === undefined ? 0 : wordAt(vo[lineId], word, FPS));
    };
    const dur = sceneLen(vo, s);
    const showPresenter = ep.presenter && s.presenter !== false;
    push(
      <TransitionSeries.Sequence key={s.name} name={s.name} durationInFrames={dur}>
        {s.render({at, vo, dur})}
        {showPresenter && <Presenter {...ep.presenter} {...(s.presenter || {})} speech={s.lines.map((id) => ({line: vo[id], at: starts[id]}))} />}
        {i > 0 && <Sfx src={s.transition === 'fade' ? 'whoosh-air' : 'whoosh-fast'} at={0} volume={0.28} />}
        {s.lines.map((id) => <VoiceLine key={id} line={vo[id]} at={starts[id]} captions={s.captions !== false} />)}
        {!s.noLogo && <LogoBug />}
      </TransitionSeries.Sequence>,
      i === 0 ? 'fade' : s.transition,
    );
  });
  if (hasOutro) push(<TransitionSeries.Sequence key="outro" name="Brand outro" durationInFrames={OUTRO_FRAMES}><BrandOutro /></TransitionSeries.Sequence>, 'fade');
  const music = ep.music === null ? null : ep.music ?? MUSIC.default;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <TransitionSeries>{seq}</TransitionSeries>
      {/* cold-open voice (+ captions) runs on past the picture cut, over the brand intro */}
      {ep.coldOpen && <ColdOpenVoice c={ep.coldOpen} />}
      {/* the music bed starts after the cold-open voice and ducks under real speech */}
      {music && (
        <Sequence from={musicStart(ep)} name="Music bed">
          <MusicBed src={music} volume={MUSIC.volume} duck={duckRanges(vo, ep)} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

/** Real footage with its own audio; gentle vignette, quick audio fades at both ends. */
const ColdOpenClip: React.FC<{c: ColdOpen}> = ({c}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <Video src={staticFile(c.src)} trimBefore={Math.round(c.fromS * FPS)} muted objectFit="cover" style={{width: '100%', height: '100%'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)'}} />
  </AbsoluteFill>
);
const ColdOpenVoice: React.FC<{c: ColdOpen}> = ({c}) => {
  const n = coldAudioFrames(c);
  return (
    <Sequence durationInFrames={n} name="Cold-open voice">
      <Audio src={staticFile(c.src)} trimBefore={Math.round(c.fromS * FPS)}
        volume={(f) => (c.volume ?? 0.9) * interpolate(f, [0, 6, n - 14, n], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      {c.words && <BrandCaptions captions={toCaptions(c.words)} />}
    </Sequence>
  );
};

const introStart = (ep: EpisodeDef) => (ep.coldOpen ? coldFrames(ep.coldOpen) - T : 0);
const musicStart = (ep: EpisodeDef) => (ep.coldOpen ? Math.max(introStart(ep), coldAudioFrames(ep.coldOpen)) : 0);
/** Frame ranges (relative to the music bed) of scenes that carry real speech. */
function duckRanges(vo: Record<string, VoLine>, ep: EpisodeDef): [number, number][] {
  const out: [number, number][] = [];
  let t = introStart(ep) + (hasIntro ? INTRO_FRAMES - T : 0) - musicStart(ep); // first scene start, relative to the music bed
  for (const s of ep.scenes) {
    const len = sceneLen(vo, s);
    if (s.duckMusic) out.push([t, t + len]);
    t += len - T;
  }
  return out;
}
