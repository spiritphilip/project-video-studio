// Motion kit: shared building blocks for every video.
// Rule of thumb: one focal point per scene, centred; something always moving.
// Layout: use useStage() (W, H, cx, cy, u) instead of hard-coded pixels so scenes work in 16:9, 9:16 and 1:1.
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {alpha, BODY, C, HEAD} from '../brand';

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Stage geometry. u = scale unit (1 at 1080 short side), vertical = portrait format. */
export const useStage = () => {
  const {width: W, height: H} = useVideoConfig();
  return {W, H, cx: W / 2, cy: H / 2, u: Math.min(W, H) / 1080, vertical: H > W};
};

/** Brand gradient text style (for *hot* words). */
export const hotText: React.CSSProperties = {
  backgroundImage: `linear-gradient(90deg, ${C.primary}, ${C.secondary} 60%, ${C.accent})`,
  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
};

/** Living backdrop: drifting brand glows, perspective grid floor, grain, vignette. */
export const Backdrop: React.FC<{grid?: boolean}> = ({grid = true}) => {
  const f = useCurrentFrame();
  const {W, H} = useStage();
  const a = Math.sin(f / 70) * 60;
  const b = Math.cos(f / 90) * 50;
  const g = Math.max(W, H) * 0.6;
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <div style={{position: 'absolute', width: g, height: g, left: W * 0.57 + a, top: -g * 0.38 + b, borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(C.primary, 0.3)}, transparent 62%)`}} />
      <div style={{position: 'absolute', width: g * 1.1, height: g * 1.1, left: -g * 0.47 - b, top: H * 0.33 + a, borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(C.secondary, 0.3)}, transparent 62%)`}} />
      {grid && (
        <div style={{position: 'absolute', left: -W * 0.25, right: -W * 0.25, bottom: -H * 0.24, height: H * 0.7,
          transform: 'perspective(700px) rotateX(62deg)', transformOrigin: '50% 100%',
          backgroundImage: `linear-gradient(${alpha(C.secondary, 0.22)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(C.secondary, 0.22)} 1px, transparent 1px)`,
          backgroundSize: '80px 80px', backgroundPosition: `0 ${(f * 1.2) % 80}px`,
          maskImage: 'linear-gradient(to top, black 10%, transparent 85%)', WebkitMaskImage: 'linear-gradient(to top, black 10%, transparent 85%)'}} />
      )}
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay'}}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={f % 8} /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

/** Slow camera push so no frame is ever static. */
export const Camera: React.FC<{children: React.ReactNode; from?: number; to?: number; origin?: string}> = ({children, from = 1, to = 1.06, origin = '50% 50%'}) => {
  const f = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const s = interpolate(f, [0, durationInFrames], [from, to]);
  return <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: origin}}>{children}</AbsoluteFill>;
};

/** Names of the bundled 3dicons (CC0) in public/icons/<name>--<variant>.webp. */
export type IconName =
  | 'dollar' | '3d-coin' | 'wallet' | 'lock' | 'locker' | 'money-bag' | 'money' | 'boy' | 'girl' | 'mobile' | 'computer'
  | 'chat-bubble' | 'chat-text' | 'trophy' | 'medal' | 'crown' | 'rocket' | 'key' | 'tick' | 'bulb' | 'notebook' | 'calendar'
  | 'bell' | 'target' | 'thumb-up' | 'gift' | 'star' | 'setting' | 'link' | 'puzzle' | 'cap' | 'calculator' | 'explorer'
  | 'location' | 'flash' | 'clock' | 'bookmark';

/** A 3D icon centred on (x, y): springs in, then floats. */
export const Icon3D: React.FC<{
  name: IconName; x: number; y: number; size?: number; delay?: number;
  variant?: 'dynamic-gradient' | 'front-gradient' | 'dynamic-premium'; float?: number; dim?: boolean; glow?: string;
}> = ({name, x, y, size = 160, delay = 0, variant = 'dynamic-gradient', float = 10, dim = false, glow = alpha(C.primary, 0.45)}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({frame: f - delay, fps, config: {damping: 11, stiffness: 140, mass: 0.8}});
  const bob = Math.sin((f + delay * 7) / 18) * float;
  const tilt = Math.sin((f + delay * 5) / 30) * 4;
  return (
    <Img
      src={staticFile(`icons/${name}--${variant}.webp`)}
      style={{
        position: 'absolute', width: size, height: size, left: x - size / 2, top: y - size / 2 + bob,
        transform: `scale(${pop}) rotate(${(1 - pop) * -18 + tilt}deg)`,
        filter: `drop-shadow(0 ${size * 0.12}px ${size * 0.22}px ${glow})${dim ? ' grayscale(0.7) brightness(0.55)' : ''}`,
      }}
    />
  );
};

/** Words rise + unblur one after another. Wrap words in *stars* to paint them in the brand gradient. */
export const Kinetic: React.FC<{
  text: string; size?: number; delay?: number; stagger?: number; font?: string; weight?: number; color?: string;
  align?: 'center' | 'left'; lineHeight?: number; maxWidth?: number; uppercase?: boolean; tracking?: number;
}> = ({text, size = 96, delay = 0, stagger = 3, font = HEAD, weight = 800, color = C.text, align = 'center', lineHeight = 1.08, maxWidth, uppercase = false, tracking = 0}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W} = useStage();
  const words = text.split(' ');
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: size * 0.28,
      maxWidth: maxWidth ?? W * 0.8, fontFamily: font, fontWeight: weight, fontSize: size, lineHeight, color, letterSpacing: tracking, textTransform: uppercase ? 'uppercase' : 'none'}}>
      {words.map((w, i) => {
        const p = spring({frame: f - delay - i * stagger, fps, config: {damping: 16, stiffness: 120}});
        const hot = w.startsWith('*');
        const clean = w.replace(/\*/g, '');
        return (
          <span key={i} style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * size * 0.5}px)`, filter: `blur(${(1 - p) * 10}px)`, ...(hot ? hotText : {})}}>
            {clean}
          </span>
        );
      })}
    </div>
  );
};

/** Small uppercase eyebrow with a growing rule on each side. */
export const Eyebrow: React.FC<{text: string; delay?: number}> = ({text, delay = 0}) => {
  const f = useCurrentFrame();
  const w = interpolate(f - delay, [0, 18], [0, 80], clamp);
  const o = interpolate(f - delay, [0, 10], [0, 1], clamp);
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 22, justifyContent: 'center', opacity: o}}>
      <div style={{width: w, height: 2, background: C.primary}} />
      <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 28, letterSpacing: 8, color: C.primary, textTransform: 'uppercase'}}>{text}</div>
      <div style={{width: w, height: 2, background: C.primary}} />
    </div>
  );
};

/** Glass pill that springs in. */
export const Pill: React.FC<{children: React.ReactNode; delay?: number; hot?: boolean; size?: number; style?: React.CSSProperties}> = ({children, delay = 0, hot = false, size = 32, style}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - delay, fps, config: {damping: 13, stiffness: 150}});
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: BODY, fontWeight: 600, fontSize: size, color: C.text,
      padding: `${size * 0.36}px ${size * 0.8}px`, borderRadius: 999, transform: `scale(${p})`, opacity: p,
      background: hot ? `linear-gradient(90deg, ${C.primary}, ${C.secondary})` : 'rgba(255,255,255,0.07)',
      border: hot ? 'none' : `1px solid ${C.line}`, boxShadow: hot ? `0 10px 40px ${alpha(C.primary, 0.45)}` : 'none', backdropFilter: 'blur(10px)', ...style}}>
      {children}
    </div>
  );
};

/** Centred stage helper: absolutely positioned column centred on x, starting at y. */
export const At: React.FC<{x: number; y: number; children: React.ReactNode; w?: number}> = ({x, y, children, w = 1600}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y, width: w, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>{children}</div>
);
