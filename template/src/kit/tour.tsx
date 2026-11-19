// Screen-tour pieces (style "screen-tour") + a real/AI presenter frame:
//   <ZoomShot>     a screenshot that pans/zooms between focus boxes on cue
//   <Cursor>       an animated pointer that glides between points and clicks (ripple)
//   <Spotlight>    dims everything except one box (highlight a button or field)
//   <TalkingHead>  your own recording or an AI-avatar clip, as a bubble / side panel / full frame
// Coordinates for ZoomShot/Cursor/Spotlight are in SCREENSHOT pixels (e.g. 1920×1080 desktop captures),
// so you can read them straight off the capture.
import {Video} from '@remotion/media';
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {alpha, BODY, C} from '../brand';
import {clamp, useStage} from './index';

export type Box = {x: number; y: number; w: number; h: number};
export type Focus = Box & {at: number};

/** Screenshot that eases from focus to focus. `shot` = [width, height] of the source image. */
export const ZoomShot: React.FC<{src: string; shot?: [number, number]; focus: Focus[]; children?: React.ReactNode; radius?: number}> = ({src, shot = [1920, 1080], focus, children, radius = 0}) => {
  const f = useCurrentFrame();
  const {W, H} = useStage();
  const full: Focus = {x: 0, y: 0, w: shot[0], h: shot[1], at: 0};
  const steps = [full, ...focus].sort((a, b) => a.at - b.at);
  let i = 0;
  while (i < steps.length - 1 && f >= steps[i + 1].at) i++;
  const cur = steps[i];
  const from = steps[Math.max(0, i - 1)];
  const k = interpolate(f, [cur.at, cur.at + 22], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const box = {x: from.x + (cur.x - from.x) * k, y: from.y + (cur.y - from.y) * k, w: from.w + (cur.w - from.w) * k, h: from.h + (cur.h - from.h) * k};
  const scale = Math.min(W / box.w, H / box.h);
  const tx = W / 2 - (box.x + box.w / 2) * scale;
  const ty = H / 2 - (box.y + box.h / 2) * scale;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: C.bg}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: shot[0], height: shot[1], transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${scale})`, borderRadius: radius, overflow: 'hidden'}}>
        <Img src={staticFile(src)} style={{width: shot[0], height: shot[1]}} />
        {children}
      </div>
    </AbsoluteFill>
  );
};

/** Pointer that glides between points (screenshot pixels) and clicks where `click` is true. Put it inside <ZoomShot>. */
export const Cursor: React.FC<{path: {x: number; y: number; at: number; click?: boolean}[]; size?: number}> = ({path, size = 34}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (!path.length || f < path[0].at - 10) return null;
  let i = 0;
  while (i < path.length - 1 && f >= path[i + 1].at) i++;
  const a = path[i];
  const b = path[i + 1] ?? a;
  const k = b === a ? 1 : interpolate(f, [b.at - 18, b.at], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const x = a.x + (b.x - a.x) * k;
  const y = a.y + (b.y - a.y) * k;
  const hits = path.filter((p) => p.click && f >= p.at && f < p.at + 18);
  const clicked = hits[hits.length - 1];
  const r = clicked ? spring({frame: f - clicked.at, fps, config: {damping: 20}}) : 0;
  const press = clicked && f - clicked.at < 5 ? 0.85 : 1;
  return (
    <>
      {clicked && <div style={{position: 'absolute', left: clicked.x - 40 * r, top: clicked.y - 40 * r, width: 80 * r, height: 80 * r, borderRadius: '50%',
        border: `4px solid ${C.primary}`, opacity: 1 - r, boxShadow: `0 0 30px ${alpha(C.primary, 0.6)}`}} />}
      <svg width={size} height={size * 1.3} viewBox="0 0 24 31" style={{position: 'absolute', left: x - 3, top: y - 2, transform: `scale(${press})`, transformOrigin: '3px 2px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'}}>
        <path d="M2 1 L2 25 L8 19 L12.5 29 L17 27 L12.5 17.5 L21 17.5 Z" fill="#fff" stroke="#111" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </>
  );
};

/** Dim everything except `box` (screenshot pixels) from frame `at`. Put it inside <ZoomShot>. */
export const Spotlight: React.FC<{box: Box; at: number; until?: number; label?: string; shot?: [number, number]}> = ({box, at, until = Infinity, label, shot = [1920, 1080]}) => {
  const f = useCurrentFrame();
  const o = until === Infinity ? interpolate(f, [at, at + 10], [0, 1], clamp) : interpolate(f, [at, at + 10, until, until + 10], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  const pad = 10;
  return (
    <div style={{position: 'absolute', inset: 0, width: shot[0], height: shot[1], opacity: o, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: box.x - pad, top: box.y - pad, width: box.w + pad * 2, height: box.h + pad * 2, borderRadius: 16,
        boxShadow: `0 0 0 9999px ${alpha(C.bg, 0.68)}, 0 0 0 4px ${C.primary}, 0 0 40px ${alpha(C.primary, 0.6)}`}} />
      {label && <div style={{position: 'absolute', left: box.x, top: box.y + box.h + 26, padding: '10px 20px', borderRadius: 999, background: C.primary,
        fontFamily: BODY, fontWeight: 700, fontSize: 30, color: '#fff', whiteSpace: 'nowrap'}}>{label}</div>}
    </div>
  );
};

/** Real person or AI-avatar clip. layout: bubble (round, corner) | side (half screen) | full. Its audio plays unless muted. */
export const TalkingHead: React.FC<{src: string; fromS?: number; layout?: 'bubble' | 'side' | 'full'; corner?: 'left' | 'right'; muted?: boolean; volume?: number}> = ({
  src, fromS = 0, layout = 'bubble', corner = 'right', muted = false, volume = 1,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, H, u} = useStage();
  const p = spring({frame: f, fps, config: {damping: 15, stiffness: 120}});
  const video = <Video src={staticFile(src)} trimBefore={Math.round(fromS * fps)} muted={muted} volume={volume} objectFit="cover" style={{width: '100%', height: '100%'}} />;
  if (layout === 'full') return <AbsoluteFill>{video}</AbsoluteFill>;
  if (layout === 'side') {
    return (
      <div style={{position: 'absolute', top: 0, bottom: 0, width: W * 0.42, [corner]: 0, overflow: 'hidden', transform: `translateX(${(1 - p) * (corner === 'right' ? 1 : -1) * W * 0.42}px)`}}>
        {video}
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${corner === 'right' ? 90 : 270}deg, ${alpha(C.bg, 0.9)}, transparent 30%)`}} />
      </div>
    );
  }
  const d = Math.min(W, H) * 0.34;
  return (
    <div style={{position: 'absolute', width: d, height: d, bottom: 170 * u, [corner]: 70 * u, borderRadius: '50%', overflow: 'hidden', transform: `scale(${p})`,
      border: `6px solid ${C.primary}`, boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${alpha(C.primary, 0.4)}`}}>
      {video}
    </div>
  );
};
