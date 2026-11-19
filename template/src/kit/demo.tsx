// Preview of the presenter character with fake word timings, so the look can be approved
// during setup before any voice is generated (composition "PresenterDemo").
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {At, Backdrop, Kinetic, useStage} from './index';
import type {VoLine} from './media';
import {Presenter} from './presenter';

const words = 'Hi there! Let me show you how this works, step by step.'.split(' ');
const FAKE: VoLine = {
  voice: 'demo', file: '', durationMs: words.length * 380,
  words: words.map((text, i) => ({text, startMs: i * 380, endMs: i * 380 + 320})),
};

export const PresenterDemo: React.FC = () => {
  const {cx, H, vertical} = useStage();
  return (
    <AbsoluteFill>
      <Backdrop />
      <At x={vertical ? cx : cx * 0.8} y={H * 0.3}><Kinetic text="Your *presenter*" size={96} delay={6} /></At>
      <Presenter speech={[{line: FAKE, at: 20}]} />
    </AbsoluteFill>
  );
};
