import type {Caption} from '@remotion/captions';
import {createTikTokStyleCaptions} from '@remotion/captions';
import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {alpha, BODY, C, CAPTIONS} from '../brand';

// Burned-in captions: one short page at a time.
// Style from video.config.json → answers.captions: "word-highlight" (spoken word lit in the primary colour),
// "subtle" (plain white, no highlight) or "none".
export const BrandCaptions: React.FC<{captions: Caption[]; bottom?: number; width?: number}> = ({captions, bottom, width}) => {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const vertical = H > W;
  const pages = useMemo(() => createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: vertical ? 900 : 1400}).pages, [captions, vertical]);
  if (CAPTIONS === 'none') return null;
  const t = (frame / fps) * 1000;
  const page = pages.find((p) => t >= p.startMs && t < p.startMs + p.durationMs);
  if (!page) return null;
  const w = width ?? W * (vertical ? 0.86 : 0.73);
  const b = bottom ?? (vertical ? H * 0.2 : 70);
  const highlight = CAPTIONS !== 'subtle';
  return (
    <div style={{position: 'absolute', left: (W - w) / 2, bottom: b, width: w, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: alpha(C.bg, 0.78), border: `1px solid ${C.line}`, borderRadius: 18, padding: '14px 28px', fontFamily: BODY, fontWeight: 600,
        fontSize: vertical ? 58 : 50, lineHeight: 1.25, color: highlight ? C.muted : C.text, textAlign: 'center', whiteSpace: 'pre-wrap', backdropFilter: 'blur(8px)'}}>
        {page.tokens.map((tok) => {
          const active = t >= tok.fromMs && t < tok.toMs;
          const spoken = t >= tok.fromMs;
          return <span key={tok.fromMs} style={{color: !highlight ? C.text : active ? C.primary : spoken ? C.text : C.muted}}>{tok.text}</span>;
        })}
      </div>
    </div>
  );
};
