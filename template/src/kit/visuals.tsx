// Reusable scene visuals: phone + browser frames, photo montage, checklist, step cards, app UI bits.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import {alpha, BODY, C, HEAD} from '../brand';
import {clamp, Icon3D, IconName} from './index';

const sp = (f: number, at: number, fps: number, damping = 14, stiffness = 140) => spring({frame: f - at, fps, config: {damping, stiffness}});

/** A phone (390×844 screen ratio) centred on (x, y) with any screen content; slides up on `enter`. */
export const Phone: React.FC<{x?: number; y?: number; h?: number; enter?: number; tilt?: number; children: React.ReactNode}> = ({x = 960, y = 500, h = 760, enter = 0, tilt = 0, children}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f, enter, fps, 18, 90);
  const w = h * (390 / 844);
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2 + (1 - p) * 260, width: w, height: h, opacity: p, perspective: 1600}}>
      <div style={{width: '100%', height: '100%', borderRadius: h * 0.07, padding: h * 0.015, background: `linear-gradient(145deg, ${C.card}, ${C.bg})`,
        boxShadow: '0 60px 120px rgba(0,0,0,0.65), inset 0 0 0 2px rgba(255,255,255,0.08)', transform: `rotateY(${tilt + Math.sin(f / 45) * 2}deg)`}}>
        <div style={{width: '100%', height: '100%', borderRadius: h * 0.058, overflow: 'hidden', position: 'relative', background: C.bg}}>
          {children}
          <div style={{position: 'absolute', top: h * 0.012, left: '50%', width: w * 0.3, height: h * 0.036, marginLeft: -w * 0.15, borderRadius: 20, background: '#000'}} />
        </div>
      </div>
    </div>
  );
};

/** Desktop browser window with a screenshot, slow push-in. */
export const Browser: React.FC<{src: string; url: string; x?: number; y?: number; w?: number; enter?: number; zoomTo?: number; origin?: string}> = ({src, url, x = 960, y = 470, w = 1500, enter = 0, zoomTo = 1.06, origin = '50% 30%'}) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const p = sp(f, enter, fps, 18, 90);
  const h = w * (1080 / 1920) + 44;
  const z = interpolate(f, [enter, durationInFrames], [1, zoomTo], clamp);
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2 + (1 - p) * 120, width: w, height: h, opacity: p, borderRadius: 20, overflow: 'hidden',
      border: `1px solid ${C.line}`, background: '#000', boxShadow: '0 40px 120px rgba(0,0,0,0.6)'}}>
      <div style={{height: 44, background: C.surface, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px'}}>
        {['#f87171', '#fbbf24', '#34d399'].map((c) => <div key={c} style={{width: 13, height: 13, borderRadius: 7, background: c}} />)}
        <div style={{marginLeft: 18, padding: '5px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', fontFamily: BODY, fontSize: 19, color: C.muted}}>{url}</div>
      </div>
      <div style={{position: 'relative', height: h - 44, overflow: 'hidden'}}>
        <Img src={staticFile(src)} style={{width: '100%', transform: `scale(${z})`, transformOrigin: origin}} />
      </div>
    </div>
  );
};

/** Ken-burns photo montage: photos cross-fade, each slowly pushes in, brand duotone. */
export const Montage: React.FC<{photos: string[]; every: number; duo?: boolean}> = ({photos, every, duo = true}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      {photos.map((src, i) => {
        const start = i * every;
        const o = interpolate(f, [start - 12, start + 6, start + every, start + every + 12], [0, 1, 1, i === photos.length - 1 ? 1 : 0], clamp);
        const s = interpolate(f, [start - 12, start + every + 12], [1.12, 1.0], clamp);
        return (
          <AbsoluteFill key={src} style={{opacity: o}}>
            <Img src={staticFile(src)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})`, filter: duo ? 'grayscale(1) contrast(1.12)' : undefined}} />
          </AbsoluteFill>
        );
      })}
      {duo && <AbsoluteFill style={{background: `linear-gradient(135deg, ${alpha(C.secondary, 0.78)}, ${alpha(C.primary, 0.5)})`, mixBlendMode: 'multiply'}} />}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, ${alpha(C.bg, 0.3)}, ${alpha(C.bg, 0.9)} 80%)`}} />
    </AbsoluteFill>
  );
};

/** Glass card with a 3D icon, title and text; springs in at `at`. */
export const StepCard: React.FC<{icon: IconName; n?: number; title: string; body?: string; at: number; w?: number; hot?: boolean}> = ({icon, n, title, body, at, w = 420, hot = false}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f, at, fps, 13, 130);
  return (
    <div style={{width: w, transform: `translateY(${(1 - p) * 60}px) scale(${0.9 + p * 0.1})`, opacity: p, borderRadius: 30, padding: '30px 30px 34px',
      background: hot ? `linear-gradient(160deg, ${alpha(C.primary, 0.28)}, ${alpha(C.secondary, 0.18)})` : 'rgba(255,255,255,0.06)',
      border: `1px solid ${hot ? `${alpha(C.primary, 0.55)}` : C.line}`, boxShadow: hot ? `0 20px 60px ${alpha(C.primary, 0.25)}` : 'none', textAlign: 'center', position: 'relative'}}>
      {n !== undefined && <div style={{position: 'absolute', top: 18, left: 22, fontFamily: HEAD, fontWeight: 800, fontSize: 30, color: 'rgba(255,255,255,0.25)'}}>{n}</div>}
      <div style={{position: 'relative', height: 150}}>
        <Icon3D name={icon} x={w / 2 - 30} y={70} size={150} delay={at} float={6} />
      </div>
      <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 36, color: C.text, marginTop: 8}}>{title}</div>
      {body && <div style={{fontFamily: BODY, fontWeight: 500, fontSize: 26, color: C.muted, marginTop: 10, lineHeight: 1.3}}>{body}</div>}
    </div>
  );
};

/** Animated checklist: items appear and tick at their own frames. */
export const Checklist: React.FC<{items: {label: string; at: number}[]; title?: string; w?: number}> = ({items, title, w = 760}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const done = items.filter((it) => f >= it.at + 10).length;
  return (
    <div style={{width: w, borderRadius: 32, padding: '34px 38px', background: `${alpha(C.surface, 0.92)}`, border: `1px solid ${C.line}`, boxShadow: '0 40px 100px rgba(0,0,0,0.55)'}}>
      {title && (
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18}}>
          <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 38, color: C.text}}>{title}</div>
          <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 26, color: C.primary}}>{done} of {items.length} done</div>
        </div>
      )}
      <div style={{height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', marginBottom: 22, overflow: 'hidden'}}>
        <div style={{height: '100%', width: `${(done / items.length) * 100}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`, transition: 'none'}} />
      </div>
      {items.map((it, i) => {
        const show = sp(f, it.at - 8, fps, 16, 140);
        const tick = sp(f, it.at + 4, fps, 10, 170);
        return (
          <div key={it.label} style={{display: 'flex', alignItems: 'center', gap: 20, padding: '12px 0', opacity: 0.35 + show * 0.65, borderTop: i ? `1px solid ${C.line}` : 'none'}}>
            <div style={{width: 46, height: 46, borderRadius: 23, flexShrink: 0, border: `3px solid ${tick > 0.5 ? C.success : 'rgba(255,255,255,0.25)'}`,
              background: tick > 0.5 ? C.success : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, color: '#04261a', transform: `scale(${0.8 + tick * 0.2})`}}>{tick > 0.5 ? '✓' : ''}</div>
            <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 32, color: C.text}}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Pill that pops at `at` (absolute positioned by the caller). */
export const PopPill: React.FC<{at: number; hot?: boolean; children: React.ReactNode; size?: number}> = ({at, hot, children, size = 32}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f, at, fps, 12, 150);
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: 12, transform: `scale(${p})`, opacity: p, fontFamily: BODY, fontWeight: 600, fontSize: size, color: C.text,
      padding: `${size * 0.36}px ${size * 0.8}px`, borderRadius: 999, whiteSpace: 'nowrap',
      background: hot ? `linear-gradient(90deg, ${C.primary}, ${C.secondary})` : `${alpha(C.surface, 0.88)}`,
      border: hot ? 'none' : `1px solid ${C.line}`, boxShadow: hot ? `0 10px 40px ${alpha(C.primary, 0.45)}` : '0 10px 30px rgba(0,0,0,0.35)'}}>
      {children}
    </div>
  );
};

/** Animated number count-up. */
export const CountUp: React.FC<{to: number; from?: number; at: number; dur?: number; prefix?: string; suffix?: string; decimals?: number; style?: React.CSSProperties}> = ({to, from = 0, at, dur = 24, prefix = '', suffix = '', decimals = 0, style}) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [at, at + dur], [from, to], {...clamp, easing: Easing.out(Easing.cubic)});
  const txt = v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
  return <span style={style}>{prefix}{txt}{suffix}</span>;
};

/** In-app style UI pieces for phone mockups. */
export const AppHeader: React.FC<{title: string; sub?: string}> = ({title, sub}) => (
  <div style={{padding: '70px 26px 16px'}}>
    <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: 34, color: C.text}}>{title}</div>
    {sub && <div style={{fontFamily: BODY, fontSize: 20, color: C.muted, marginTop: 6}}>{sub}</div>}
  </div>
);
export const AppRow: React.FC<{icon: IconName; title: string; sub: string; at: number; active?: boolean; badge?: string}> = ({icon, title, sub, at, active, badge}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f, at, fps, 16, 140);
  return (
    <div style={{margin: '0 18px 14px', padding: '16px 18px', borderRadius: 22, display: 'flex', alignItems: 'center', gap: 16, opacity: p, transform: `translateX(${(1 - p) * 40}px)`,
      background: active ? `linear-gradient(135deg, ${alpha(C.primary, 0.3)}, ${alpha(C.secondary, 0.22)})` : 'rgba(255,255,255,0.06)',
      border: `1.5px solid ${active ? C.primary : C.line}`, boxShadow: active ? `0 0 30px ${alpha(C.primary, 0.35)}` : 'none'}}>
      <Img src={staticFile(`icons/${icon}--dynamic-gradient.webp`)} style={{width: 64, height: 64}} />
      <div style={{flex: 1}}>
        <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 24, color: C.text}}>{title}</div>
        <div style={{fontFamily: BODY, fontSize: 18, color: C.muted, marginTop: 2}}>{sub}</div>
      </div>
      {badge && <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 16, color: C.success, padding: '4px 10px', borderRadius: 999, background: `${alpha(C.success, 0.15)}`}}>{badge}</div>}
    </div>
  );
};
export const Toast: React.FC<{at: number; title: string; sub: string; y?: number}> = ({at, title, sub, y = 640}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = sp(f, at, fps, 13, 130);
  return (
    <div style={{position: 'absolute', left: 18, right: 18, top: y + (1 - p) * 40, opacity: p, padding: '16px 18px', borderRadius: 22,
      background: `${alpha(C.surface, 0.97)}`, border: `1px solid ${alpha(C.success, 0.5)}`, display: 'flex', gap: 14, alignItems: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.6)'}}>
      <div style={{width: 52, height: 52, borderRadius: 16, background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: '#04261a', fontWeight: 800}}>✓</div>
      <div>
        <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 22, color: C.success}}>{title}</div>
        <div style={{fontFamily: BODY, fontSize: 17, color: C.muted}}>{sub}</div>
      </div>
    </div>
  );
};

/** Fast photo rush: hard cuts every `per` frames with a punch-in zoom and a quick flash; brand-tinted. */
export const Rush: React.FC<{photos: string[]; start?: number; per?: number; tint?: boolean}> = ({photos, start = 0, per = 7, tint = true}) => {
  const f = useCurrentFrame();
  const i = Math.max(0, Math.min(photos.length - 1, Math.floor((f - start) / per)));
  const local = (f - start) - i * per;
  const z = interpolate(local, [0, per], [1.14, 1.04], clamp);
  const flash = interpolate(local, [0, 2], [0.35, 0], clamp);
  return (
    <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
      <Img src={staticFile(photos[i])} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z}) rotate(${(i % 2 ? 1 : -1) * 0.6}deg)`}} />
      {tint && <AbsoluteFill style={{background: `linear-gradient(135deg, ${alpha(C.secondary, 0.35)}, ${alpha(C.primary, 0.2)})`, mixBlendMode: 'multiply'}} />}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, ${alpha(C.bg, 0.15)}, ${alpha(C.bg, 0.8)} 85%)`}} />
      <AbsoluteFill style={{background: '#fff', opacity: f >= start ? flash : 0}} />
    </AbsoluteFill>
  );
};

// ---- Scene pieces: framed footage, big stat, stamp, chat bubble, step tracker, scrim ----
export const RED = C.danger;

/** Real footage in a rounded glass frame (muted), slides in at `at`. */
export const FramedClip: React.FC<{src: string; fromS: number; x: number; y: number; w: number; h: number; at?: number; label?: string}> = ({src, fromS, x, y, w, h, at = 0, label}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 18, stiffness: 100}});
  const z = interpolate(f, [at, at + 300], [1.08, 1.0], clamp);
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2 + (1 - p) * 80, width: w, height: h, opacity: p, borderRadius: 34, overflow: 'hidden',
      border: `1.5px solid ${C.line}`, boxShadow: `0 40px 110px rgba(0,0,0,0.6), 0 0 60px ${alpha(C.primary, 0.18)}`}}>
      <div style={{position: 'absolute', inset: 0, transform: `scale(${z})`}}>
        <Video src={staticFile(src)} trimBefore={Math.round(fromS * fps)} muted objectFit="cover" style={{width: '100%', height: '100%', filter: 'saturate(1.1) contrast(1.05)'}} />
      </div>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 60%, ${alpha(C.bg, 0.75)})`}} />
      {label && <div style={{position: 'absolute', left: 26, bottom: 22, fontFamily: BODY, fontWeight: 600, fontSize: 26, color: C.text, display: 'flex', alignItems: 'center', gap: 12}}>
        <span style={{width: 10, height: 10, borderRadius: 5, background: C.primary}} />{label}</div>}
    </div>
  );
};

/** Huge gradient number/word that punches in. */
export const BigStat: React.FC<{text: string; at: number; size?: number; sub?: string}> = ({text, at, size = 260, sub}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 10, stiffness: 160}});
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: Math.min(1, p * 1.4), transform: `scale(${0.6 + p * 0.4})`}}>
      <div style={{fontFamily: HEAD, fontWeight: 800, fontSize: size, lineHeight: 1, backgroundImage: `linear-gradient(90deg, ${C.primary}, ${C.secondary} 60%, ${C.accent})`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 20px 60px ${alpha(C.primary, 0.35)})`}}>{text}</div>
      {sub && <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 40, color: C.text, marginTop: 10}}>{sub}</div>}
    </div>
  );
};

/** Rubber-stamp (e.g. SCAM, NEVER) that slams in rotated. */
export const Stamp: React.FC<{text: string; at: number; color?: string; size?: number; rotate?: number}> = ({text, at, color = RED, size = 120, rotate = -10}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 9, stiffness: 220}});
  return (
    <div style={{opacity: f >= at ? 1 : 0, transform: `rotate(${rotate}deg) scale(${2.2 - p * 1.2})`, padding: `${size * 0.12}px ${size * 0.35}px`, border: `${size * 0.07}px solid ${color}`,
      borderRadius: size * 0.14, fontFamily: HEAD, fontWeight: 800, fontSize: size, letterSpacing: size * 0.06, color, background: `${alpha(C.bg, 0.55)}`, boxShadow: `0 0 50px ${color}55`}}>
      {text}
    </div>
  );
};

/** Chat bubble for phone mocks. */
export const Bubble: React.FC<{at: number; from?: string; me?: boolean; children: React.ReactNode; danger?: boolean}> = ({at, from, me, children, danger}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: f - at, fps, config: {damping: 14, stiffness: 150}});
  return (
    <div style={{display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', margin: '0 18px 14px', opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${0.9 + p * 0.1})`}}>
      <div style={{maxWidth: '82%', padding: '14px 18px', borderRadius: 22, borderTopLeftRadius: me ? 22 : 6, borderTopRightRadius: me ? 6 : 22,
        background: me ? `linear-gradient(135deg, ${C.primary}, ${C.secondary})` : 'rgba(255,255,255,0.09)', border: danger ? `1.5px solid ${RED}` : 'none'}}>
        {from && <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 17, color: danger ? RED : C.primary, marginBottom: 4}}>{from}</div>}
        <div style={{fontFamily: BODY, fontSize: 22, color: C.text, lineHeight: 1.3}}>{children}</div>
      </div>
    </div>
  );
};

/** Horizontal progress tracker: each step lights up at its frame. */
export const StepTrack: React.FC<{steps: {label: string; at: number}[]; w?: number}> = ({steps, w = 1500}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const lit = steps.filter((s) => f >= s.at).length;
  const fill = lit <= 1 ? 0 : (lit - 1) / (steps.length - 1);
  const last = steps[Math.max(0, lit - 1)];
  const grow = lit ? interpolate(f, [last.at, last.at + 14], [lit <= 1 ? 0 : (lit - 2) / (steps.length - 1), fill], clamp) : 0;
  return (
    <div style={{position: 'relative', width: w, height: 170}}>
      <div style={{position: 'absolute', left: 50, right: 50, top: 40, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)'}} />
      <div style={{position: 'absolute', left: 50, top: 40, height: 8, borderRadius: 4, width: (w - 100) * grow, background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`}} />
      {steps.map((s, i) => {
        const p = spring({frame: f - s.at, fps, config: {damping: 11, stiffness: 170}});
        const on = f >= s.at;
        const x = 50 + ((w - 100) * i) / (steps.length - 1);
        const final = i === steps.length - 1;
        return (
          <div key={s.label} style={{position: 'absolute', left: x - 120, top: 0, width: 240, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{width: 88, height: 88, borderRadius: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800,
              background: on ? (final ? C.success : `linear-gradient(135deg, ${C.primary}, ${C.secondary})`) : C.surface, border: `3px solid ${on ? 'transparent' : C.line}`,
              color: final && on ? '#04261a' : C.text, transform: `scale(${on ? 0.85 + p * 0.15 : 0.85})`, boxShadow: on ? `0 10px 40px ${alpha(C.primary, 0.4)}` : 'none', fontFamily: BODY}}>
              {on ? '✓' : i + 1}
            </div>
            <div style={{fontFamily: BODY, fontWeight: 600, fontSize: 30, color: on ? C.text : C.muted, marginTop: 16, whiteSpace: 'nowrap'}}>{s.label}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Dark scrim so text sits on top of footage. */
export const Scrim: React.FC<{side?: 'left' | 'right' | 'all'; strength?: number}> = ({side = 'all', strength = 0.7}) => (
  <AbsoluteFill style={{background: side === 'all' ? `${alpha(C.bg, strength)}` : `linear-gradient(${side === 'left' ? 90 : 270}deg, ${alpha(C.bg, strength + 0.2)} 0%, ${alpha(C.bg, strength)} 45%, transparent 75%)`}} />
);
