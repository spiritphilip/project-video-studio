// Brand bumpers used by every episode (video.config.json → answers.bumpers: intro-outro | intro-only | none):
//   <BrandIntro track episode title />  — the wordmark drops in as slanted letter tiles, then hands over to the episode title.
//   <BrandOutro />                      — closing signature: burst → logo with shine → tagline + pillars → powered-by + URL.
// Only the intro's props change per video. Once the user approves the look, treat this file as LOCKED.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {alpha, BODY, BRAND, C, HEAD} from '../brand';
import {Backdrop, clamp, Kinetic, useStage} from './index';
import {Sfx} from './media';

export const INTRO_FRAMES = 165; // 5.5s
export const OUTRO_FRAMES = 210; // 7s

const ROT = [-12, 4, 10, -6, -12, -8, 8, -6, 6, -4, 8, -12, 5, -7];
const DY = [4, -6, -8, 3, 6, 4, -6, 3, -5, 2, -6, 4, -3, 5];

/** Mix two hex colours (t = 0..1) and darken; used to vary the tile gradients. */
const mix = (a: string, b: string, t: number, dark = 0) => {
  const p = (h: string) => { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  if (!a.startsWith('#') || !b.startsWith('#')) return a;
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round((v + (y[i] - v) * t) * (1 - dark))).join(',')})`;
};

const TileRow: React.FC<{start: number; text: string}> = ({start, text}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W} = useStage();
  const chars = text.split('');
  const K = Math.min(1.75, (W * 0.88) / (chars.length * 64));
  const glintPos = interpolate(f, [start + 38, start + 62], [-1.5, chars.length + 1.5], clamp);
  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {chars.map((ch, i) => {
        const at = start + i * 2.4;
        const drop = spring({frame: f - at, fps, config: {damping: 9, stiffness: 160, mass: 0.7}});
        const wave = interpolate(f - (start + 40 + i * 2), [0, 6, 14], [0, 1, 0], clamp); // ripple once landed
        const y = (1 - drop) * -520 + DY[i % DY.length] * K - wave * 26;
        const rot = ROT[i % ROT.length] + (1 - drop) * (i % 2 ? 40 : -40);
        const t = (i % 4) / 3;
        if (ch === ' ') return <div key={i} style={{width: 30 * K}} />;
        return (
          <div key={i} style={{width: 72 * K, height: 80 * K, marginRight: -7 * K, transform: `translateY(${y}px) rotate(${rot}deg)`, opacity: Math.min(1, drop * 3), zIndex: 40 - i,
            position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff',
            background: `linear-gradient(135deg, ${mix(C.primary, C.secondary, t, 0.1)} 0%, ${mix(C.primary, C.secondary, t, 0.7)} 100%)`,
            boxShadow: '0 18px 50px rgba(0,0,0,0.65), inset 0 0 18px rgba(255,255,255,0.06)'}}>
            <span style={{fontFamily: HEAD, fontWeight: 800, fontSize: 64 * K * 0.92, color: '#fff', lineHeight: 1, textShadow: '0 6px 12px rgba(0,0,0,0.5)'}}>{ch}</span>
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255,255,255,0) 20%, rgba(255,255,255,0.75) 50%, rgba(255,255,255,0) 80%)',
              opacity: Math.max(0, 1 - Math.abs(glintPos - i) / 1.4), mixBlendMode: 'screen'}} />
          </div>
        );
      })}
    </div>
  );
};

/** Branded title intro. Same every episode; only track / episode / title change.
 *  `quietSfx`: a real voice is still speaking over the intro, so its stings play softly. */
export const BrandIntro: React.FC<{track: string; episode: string; title: string; quietSfx?: boolean}> = ({track, episode, title, quietSfx = false}) => {
  const q = quietSfx ? 0.3 : 1;
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, H, vertical} = useStage();
  const lift = spring({frame: f - 66, fps, config: {damping: 16, stiffness: 90}});
  const rowScale = interpolate(lift, [0, 1], [1, 0.42]);
  const rowY = interpolate(lift, [0, 1], [0, -H * 0.28]);
  const bar = interpolate(f, [92, 120], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const exit = interpolate(f, [INTRO_FRAMES - 14, INTRO_FRAMES], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: exit}}>
      <Backdrop />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'relative', transform: `translateY(${rowY}px) scale(${rowScale})`}}>
          <TileRow start={6} text={BRAND.wordmark} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingTop: 120}}>
        <div style={{opacity: interpolate(f, [74, 86], [0, 1], clamp), fontFamily: BODY, fontWeight: 600, fontSize: 32, letterSpacing: 8,
          color: C.primary, textTransform: 'uppercase', marginBottom: 28, textAlign: 'center'}}>
          {track} <span style={{color: 'rgba(255,255,255,0.4)'}}>·</span> {episode}
        </div>
        <Kinetic text={title} size={vertical ? 96 : 112} delay={80} stagger={4} maxWidth={W * 0.86} />
        <div style={{marginTop: 40, height: 6, width: 420 * bar, borderRadius: 3, background: `linear-gradient(90deg, ${C.primary}, ${C.secondary})`}} />
      </AbsoluteFill>
      <Sfx src="riser-short" at={0} volume={0.35 * q} />
      <Sfx src="tile-hit" at={10} volume={0.25 * q} />
      <Sfx src="intro-impact" at={34} volume={0.5 * q} />
      <Sfx src="whoosh-air" at={64} volume={0.4 * q} />
      <Sfx src="pop-explainer" at={80} volume={0.35 * q} />
    </AbsoluteFill>
  );
};

/** Closing signature. Identical on every episode. */
export const BrandOutro: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {W, H, cx, vertical} = useStage();
  const cy = H * 0.4;
  const spin = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 110}});
  const toMark = spring({frame: f - 34, fps, config: {damping: 18, stiffness: 100}});
  const reveal = interpolate(f, [36, 60], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const shine = interpolate(f, [62, 92], [-20, 120], clamp);
  const fadeOut = interpolate(f, [OUTRO_FRAMES - 16, OUTRO_FRAMES], [1, 0], clamp);
  const half = (1 - reveal) * 50;
  const logoW = Math.min(1120, W * 0.8);
  const mark = BRAND.mark ?? BRAND.logo;
  return (
    <AbsoluteFill style={{opacity: fadeOut}}>
      <Backdrop grid={false} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {[0, 1, 2].map((k) => {
          const p = interpolate(f, [8 + k * 5, 44 + k * 5], [0, 1], clamp);
          return <circle key={k} cx={cx} cy={cy} r={40 + p * 520} fill="none" stroke={k === 1 ? C.secondary : C.primary} strokeWidth={6 * (1 - p)} opacity={1 - p} />;
        })}
        {Array.from({length: 18}).map((_, k) => {
          const a = (k / 18) * Math.PI * 2;
          const p = interpolate(f, [10, 46], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
          return <circle key={`p${k}`} cx={cx + Math.cos(a) * (80 + p * 420)} cy={cy + Math.sin(a) * (80 + p * 300)} r={5 * (1 - p)} fill={k % 2 ? C.primary : '#fff'} opacity={1 - p} />;
        })}
      </svg>
      {/* the mark spins in, then hands over to the full logo */}
      <Img src={staticFile(mark)} style={{position: 'absolute', left: cx - 130, top: cy - 130, width: 260, height: 260, objectFit: 'contain',
        transform: `scale(${spin * (1 - toMark * 0.6)}) rotate(${(1 - spin) * -540}deg)`, opacity: 1 - reveal, filter: `drop-shadow(0 0 40px ${alpha(C.primary, 0.7)})`}} />
      <div style={{position: 'absolute', left: cx - logoW / 2, top: cy - 73, width: logoW, height: 146, clipPath: `inset(0 ${half}% 0 ${half}%)`}}>
        <Img src={staticFile(BRAND.logo)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
        <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen',
          WebkitMaskImage: `url(${staticFile(BRAND.logo)})`, WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center',
          background: `linear-gradient(100deg, transparent ${shine - 10}%, rgba(255,255,255,0.9) ${shine}%, transparent ${shine + 10}%)`}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: cy + 130, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Kinetic text={BRAND.tagline} size={vertical ? 52 : 44} font={BODY} weight={600} delay={70} stagger={2} maxWidth={W * 0.86} color={C.text} />
        <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18, marginTop: 34, maxWidth: W * 0.9}}>
          {BRAND.pillars.map((t, i) => {
            const p = spring({frame: f - 100 - i * 5, fps, config: {damping: 14}});
            return <div key={t} style={{transform: `scale(${p})`, opacity: p, fontFamily: BODY, fontWeight: 600, fontSize: 26, color: C.text,
              padding: '10px 22px', borderRadius: 999, background: 'rgba(255,255,255,0.07)', border: `1px solid ${C.line}`}}>{t}</div>;
          })}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: vertical ? 160 : 70, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
        opacity: interpolate(f, [128, 146], [0, 1], clamp)}}>
        {BRAND.poweredBy && (
          <span style={{fontFamily: BODY, fontWeight: 500, fontSize: 24, letterSpacing: 4, color: C.muted, textTransform: 'uppercase'}}>Powered by {BRAND.poweredBy}</span>
        )}
        <span style={{fontFamily: BODY, fontWeight: 600, fontSize: 34, color: C.text, letterSpacing: 1.5, opacity: interpolate(f, [142, 158], [0, 1], clamp)}}>{BRAND.url}</span>
      </div>
      <Sfx src="whoosh-fast" at={0} volume={0.35} />
      <Sfx src="logo-impact" at={10} volume={0.55} />
      <Sfx src="sparkle" at={62} volume={0.4} />
      <Sfx src="pop-explainer" at={100} volume={0.3} />
    </AbsoluteFill>
  );
};
