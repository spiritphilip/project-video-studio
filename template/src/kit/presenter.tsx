// Animated presenter character (style "presenter-character"): a flat-illustration host who stands beside
// the content, lip-syncs to the voice-over word timings, blinks, breathes and gestures while speaking.
// Look comes from video.config.json → "presenter" (skin, hair, hairStyle, outfit, position); override per scene.
// For a real person or an AI avatar use <TalkingHead> instead (see references/styles.md).
import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {PRESENTER} from '../brand';
import {clamp, useStage} from './index';
import type {VoLine} from './media';

export type PresenterProps = {
  /** Horizontal centre of the character; default from presenter.position (left | right | center). */
  x?: number;
  /** Character height in px (default 72% of the frame height, 40% in portrait). */
  size?: number;
  skin?: string; hair?: string; hairStyle?: 'short' | 'afro' | 'bun' | 'long' | 'bald'; outfit?: string;
  position?: 'left' | 'right' | 'center';
  /** Voice lines this character speaks in the scene (the engine fills this in). */
  speech?: {line: VoLine; at: number}[];
  /** Frame the character slides in (default 0). */
  enter?: number;
  /** Point toward the content while speaking (default true). */
  point?: boolean;
};

const shade = (hex: string, k: number) => {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `rgb(${c.join(',')})`;
};

/** 0..1 mouth opening at this frame, from word timings (about two syllable pulses per word). */
function mouthOpen(f: number, fps: number, speech: {line: VoLine; at: number}[]) {
  for (const {line, at} of speech) {
    if (!line) continue;
    const t = ((f - at) / fps) * 1000;
    if (t < 0 || t > line.durationMs) continue;
    const w = line.words.find((x) => t >= x.startMs && t <= x.endMs + 40);
    if (!w) return 0.08;
    const syll = Math.max(1, Math.round(w.text.replace(/[^aeiouy]/gi, '').length * 0.8));
    const p = (t - w.startMs) / Math.max(60, w.endMs - w.startMs);
    return 0.25 + 0.75 * Math.abs(Math.sin(p * Math.PI * syll));
  }
  return 0;
}
const talking = (f: number, fps: number, speech: {line: VoLine; at: number}[]) =>
  speech.some(({line, at}) => line && f >= at && f <= at + (line.durationMs / 1000) * fps);

export const Presenter: React.FC<PresenterProps> = (props) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, H, vertical} = useStage();
  const P = {...PRESENTER, ...props} as Required<Omit<PresenterProps, 'x' | 'size' | 'speech' | 'enter' | 'point'>> & PresenterProps;
  const speech = props.speech ?? [];
  const pos = P.position ?? 'right';
  const size = props.size ?? H * (vertical ? 0.4 : 0.72);
  const x = props.x ?? (pos === 'left' ? W * 0.16 : pos === 'center' ? W / 2 : W * 0.84);
  const enter = spring({frame: f - (props.enter ?? 0), fps, config: {damping: 16, stiffness: 110}});
  const dir = pos === 'left' ? -1 : 1;

  const open = mouthOpen(f, fps, speech);
  const isTalking = talking(f, fps, speech);
  const blink = f % 97 < 4 || f % 251 < 3 ? 0.1 : 1;
  const breathe = Math.sin(f / 22) * 2;
  const nod = isTalking ? Math.sin(f / 7) * 2.2 : Math.sin(f / 40) * 0.8;
  // arm raises while talking (smoothed), with a small wave of emphasis
  const talkAmt = interpolate(Math.sin(f / 30), [-1, 1], [0.75, 1]) * (isTalking ? 1 : 0);
  const arm = interpolate(talkAmt, [0, 1], [0, props.point === false ? 25 : 62], clamp) + (isTalking ? Math.sin(f / 9) * 6 : 0);

  const skin = P.skin ?? '#8d5524';
  const hair = P.hair ?? '#1b1b1b';
  const outfit = P.outfit ?? '#6366f1';
  const style = P.hairStyle ?? 'short';
  // the arm nearer the content points at it: for a right-side presenter that's the viewer-left arm
  const pointArm = dir === 1 ? 'left' : 'right';

  return (
    <div style={{position: 'absolute', left: x - size * 0.25 + (1 - enter) * dir * W * 0.3, top: H - size * 1.0 + (vertical ? -H * 0.03 : 0), width: size * 0.5, height: size, opacity: enter}}>
      <svg viewBox="0 0 400 800" width="100%" height="100%" style={{overflow: 'visible'}}>
        <ellipse cx={200} cy={790} rx={120} ry={14} fill="rgba(0,0,0,0.35)" />
        <g transform={`translate(0 ${breathe})`}>
          {/* legs */}
          <rect x={140} y={540} width={50} height={250} rx={22} fill={shade(outfit, 0.35)} />
          <rect x={210} y={540} width={50} height={250} rx={22} fill={shade(outfit, 0.3)} />
          {/* arms (behind torso) */}
          <Arm side="left" active={pointArm === 'left'} angle={pointArm === 'left' ? arm : 4} outfit={outfit} skin={skin} />
          <Arm side="right" active={pointArm === 'right'} angle={pointArm === 'right' ? arm : 4} outfit={outfit} skin={skin} />
          {/* torso */}
          <path d="M120 330 Q200 300 280 330 L300 560 Q200 585 100 560 Z" fill={outfit} />
          <path d="M170 318 L200 360 L230 318" fill="none" stroke={shade(outfit, 0.6)} strokeWidth={8} strokeLinejoin="round" />
          {/* neck */}
          <rect x={180} y={270} width={40} height={50} rx={14} fill={shade(skin, 0.85)} />
          {/* head */}
          <g transform={`rotate(${nod} 200 270)`}>
            {style === 'long' && <path d="M112 190 Q110 330 150 350 L250 350 Q290 330 288 190 Z" fill={hair} />}
            <ellipse cx={122} cy={200} rx={14} ry={22} fill={shade(skin, 0.9)} />
            <ellipse cx={278} cy={200} rx={14} ry={22} fill={shade(skin, 0.9)} />
            <ellipse cx={200} cy={190} rx={80} ry={95} fill={skin} />
            <Hair style={style} color={hair} />
            {/* brows lift a little on stressed words */}
            <g transform={`translate(0 ${open > 0.8 ? -4 : 0})`}>
              <rect x={150} y={150} width={34} height={7} rx={3.5} fill={shade(hair, 1.2)} />
              <rect x={216} y={150} width={34} height={7} rx={3.5} fill={shade(hair, 1.2)} />
            </g>
            {/* eyes */}
            {[167, 233].map((ex) => (
              <g key={ex} transform={`translate(${ex} 182) scale(1 ${blink})`}>
                <ellipse cx={0} cy={0} rx={13} ry={11} fill="#fff" />
                <circle cx={dir === 1 ? -3 : 3} cy={1} r={6.5} fill="#1a1a1a" />
                <circle cx={dir === 1 ? -5 : 1} cy={-2} r={2} fill="#fff" />
              </g>
            ))}
            {/* nose */}
            <path d="M200 195 Q194 220 200 224" fill="none" stroke={shade(skin, 0.7)} strokeWidth={4} strokeLinecap="round" />
            {/* mouth */}
            {open > 0.05 ? (
              <g>
                <ellipse cx={200} cy={245} rx={20 - open * 4} ry={3 + open * 13} fill="#3a0d14" />
                <ellipse cx={200} cy={250 + open * 6} rx={10} ry={open * 5} fill="#e0707a" />
              </g>
            ) : (
              <path d="M180 243 Q200 258 220 243" fill="none" stroke="#3a0d14" strokeWidth={5} strokeLinecap="round" />
            )}
          </g>
        </g>
      </svg>
    </div>
  );
};

const Arm: React.FC<{side: 'left' | 'right'; angle: number; active: boolean; outfit: string; skin: string}> = ({side, angle, outfit, skin}) => {
  const sx = side === 'left' ? 125 : 275;
  const s = side === 'left' ? 1 : -1;
  // rotate from the shoulder: positive angle lifts the arm outwards
  return (
    <g transform={`rotate(${s * angle} ${sx} 345)`}>
      <rect x={sx - 22} y={335} width={44} height={200} rx={22} fill={shade(outfit, 0.85)} />
      <circle cx={sx} cy={545} r={24} fill={skin} />
    </g>
  );
};

const Hair: React.FC<{style: string; color: string}> = ({style, color}) => {
  if (style === 'bald') return null;
  if (style === 'afro') return <path d="M105 190 Q95 70 200 60 Q305 70 295 190 Q290 140 260 125 Q200 105 140 125 Q110 140 105 190 Z" fill={color} />;
  if (style === 'bun') return (
    <g fill={color}>
      <circle cx={200} cy={78} r={34} />
      <path d="M118 175 Q120 95 200 92 Q280 95 282 175 Q260 125 200 120 Q140 125 118 175 Z" />
    </g>
  );
  if (style === 'long') return <path d="M118 185 Q118 92 200 90 Q282 92 282 185 Q262 128 200 122 Q138 128 118 185 Z" fill={color} />;
  return <path d="M120 165 Q122 96 200 94 Q278 96 280 165 Q262 122 200 118 Q138 122 120 165 Z" fill={color} />;
};
