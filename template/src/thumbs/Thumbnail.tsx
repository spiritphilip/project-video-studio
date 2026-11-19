// YouTube thumbnail pattern for the series. Built for click-through from NEW viewers:
// a 2–4 word hook (not the title), one big 3D focal object, a highlight word as the series signature,
// and a colour per track so the series is recognisable in search and suggested videos. 1280×720.
// Render: npm run thumbs  → out/thumbs/<id>.jpg
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {alpha, BODY, BRAND, C, HEAD, TRACKS} from '../brand';

export type ThumbProps = {
  /** Track key from video.config.json → tracks (sets the accent colour). */
  track: string;
  /** Small tag top-left, e.g. "MEMBER · EP 2". */
  tag: string;
  /** Hook line(s). Wrap the highlight word in *stars*: "LEARN TECH *FREE*". Use | for a line break. */
  hook: string;
  /** Short proof chip next to the icon, e.g. "3 MONTHS". Optional. */
  chip?: string;
  /** 3D icon name from public/icons (without the variant suffix), or omit and pass `image`. */
  icon?: string;
  /** Any image in public/ to use as the focal object instead of an icon (e.g. a phone screenshot). */
  image?: string;
  /** Background photo or screenshot from public/ (darkened). Optional. */
  photo?: string;
};

function HookText({hook}: {hook: string}) {
  const lines = hook.split('|');
  const width = (l: string) => l.replace(/\*/g, '').length * 0.9 + (l.includes('*') ? 0.5 : 0);
  const size = Math.min(150, Math.floor(750 / Math.max(...lines.map(width))));
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: size * 0.12}}>
      {lines.map((line, i) => (
        <div key={i} style={{fontFamily: HEAD, fontWeight: 800, fontSize: size, lineHeight: 1.08, color: C.text, textTransform: 'uppercase', letterSpacing: -1, whiteSpace: 'nowrap', textShadow: '0 6px 24px rgba(0,0,0,0.55)'}}>
          {line.split(/(\*[^*]+\*)/).filter(Boolean).map((part, j) =>
            part.startsWith('*') ? (
              <span key={j} style={{background: C.highlight, color: '#14051f', padding: '2px 16px', margin: '0 2px', borderRadius: 10, display: 'inline-block', transform: 'rotate(-2deg)', textShadow: 'none', boxShadow: `0 10px 30px ${alpha(C.highlight, 0.35)}`}}>
                {part.slice(1, -1)}
              </span>
            ) : <span key={j}>{part}</span>,
          )}
        </div>
      ))}
    </div>
  );
}

export const Thumbnail: React.FC<ThumbProps> = ({track, tag, hook, chip, icon, image, photo}) => {
  const color = TRACKS[track]?.color ?? C.primary;
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      {photo && <Img src={staticFile(photo)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.38, filter: 'saturate(0.8)'}} />}
      <AbsoluteFill style={{background: `linear-gradient(90deg, ${alpha(C.bg, 0.97)} 0%, ${alpha(C.bg, 0.85)} 55%, ${alpha(C.bg, 0.35)} 100%)`}} />
      <div style={{position: 'absolute', width: 760, height: 760, right: -160, top: -40, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(color, 0.55)}, transparent 65%)`}} />
      <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, background: color}} />
      <div style={{position: 'absolute', left: 60, top: 44, display: 'flex', alignItems: 'center', gap: 14}}>
        <Img src={staticFile(BRAND.logo)} style={{height: 34}} />
        <div style={{fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 3, color, padding: '6px 14px', borderRadius: 8, background: alpha(color, 0.14), border: `2px solid ${alpha(color, 0.5)}`}}>{tag}</div>
      </div>
      <div style={{position: 'absolute', left: 60, top: 140, width: 760}}><HookText hook={hook} /></div>
      <div style={{position: 'absolute', right: 70, top: 120, width: 420, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Img src={staticFile(image ?? `icons/${icon ?? 'rocket'}--dynamic-gradient.webp`)} style={{width: '100%', height: '100%', objectFit: 'contain', filter: `drop-shadow(0 30px 60px ${alpha(color, 0.55)})`}} />
      </div>
      {chip && (
        <div style={{position: 'absolute', right: 80, bottom: 70, fontFamily: HEAD, fontWeight: 800, fontSize: 40, color: '#14051f', background: C.text, padding: '12px 26px', borderRadius: 16, transform: 'rotate(3deg)', boxShadow: '0 16px 40px rgba(0,0,0,0.45)'}}>{chip}</div>
      )}
    </AbsoluteFill>
  );
};
