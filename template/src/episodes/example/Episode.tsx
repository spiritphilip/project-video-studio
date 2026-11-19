// EXAMPLE episode: shows one scene of each kind. Copy this folder as the starting point for a real episode,
// then delete it. Voice it first: node scripts/tts.mjs scripts/videos/example.json
// Every animation beat is placed with at(lineId, word) so it lands on the narration.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {At, Backdrop, Camera, Icon3D, Kinetic, useStage} from '../../kit';
import type {EpisodeDef} from '../../kit/episode';
import {OverlayHeadline, Sfx} from '../../kit/media';
import {Cursor, Spotlight, ZoomShot} from '../../kit/tour';
import {Browser, Checklist, PopPill, StepCard} from '../../kit/visuals';

/** A big 3D rocket centred above the headline. */
const Hero: React.FC<{at: number}> = ({at}) => {
  const {cx, cy, u} = useStage();
  return <Icon3D name="rocket" x={cx} y={cy - 250 * u} size={260 * u} delay={at} />;
};

const Steps: React.FC<{w: (n: number) => number}> = ({w}) => {
  const {cx, vertical} = useStage();
  return (
    <AbsoluteFill>
      <Backdrop />
      <Camera to={1.03}>
        <At x={cx} y={vertical ? 260 : 90}><Kinetic text="Three *simple* steps" size={84} delay={w(0)} /></At>
        <div style={{position: 'absolute', top: vertical ? 520 : 300, left: 0, right: 0, display: 'flex', flexDirection: vertical ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 34}}>
          <StepCard n={1} icon="setting" title="Profile" body="Your name and photo" at={w(6) - 4} />
          <StepCard n={2} icon="medal" title="Plan" body="Free or Pro" at={w(10) - 4} hot />
          <StepCard n={3} icon="chat-bubble" title="Team" body="Invite by email" at={w(13) - 4} />
        </div>
      </Camera>
      <Sfx src="pop-explainer" at={w(6)} volume={0.35} />
      <Sfx src="pop-explainer" at={w(10)} volume={0.35} />
      <Sfx src="pop-explainer" at={w(13)} volume={0.35} />
    </AbsoluteFill>
  );
};

export const EPISODE: EpisodeDef = {
  track: 'Start here', episode: 'Episode 1', title: 'How it *works*',
  // presenter: {position: 'right'},   // ← uncomment for the "presenter-character" style
  scenes: [
    {
      name: 'Hook', lines: ['hook'],
      render: ({at}) => (
        // No stock footage needed. With a clip in public/stock, swap <Backdrop/> for:
        // <StockClip src="stock/typing-phone.mp4" grade="dark" zoom={[1.0, 1.08]} />
        <AbsoluteFill>
          <Backdrop />
          <Hero at={at('hook', 1)} />
          <OverlayHeadline text="Get started in *one* *minute*" at={at('hook', 4) - 4} size={100} />
          <Sfx src="pop-explainer" at={at('hook', 4)} volume={0.35} />
        </AbsoluteFill>
      ),
    },
    {
      name: 'Sign in', lines: ['signin'], transition: 'wipe',
      render: ({at}) => (
        <AbsoluteFill>
          <Backdrop />
          <Browser src="screens/example-signin.png" url="example.com/sign-in" y={470} w={1320} />
          <div style={{position: 'absolute', top: 860, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 22}}>
            <PopPill at={at('signin', 'email')}>Your email</PopPill>
            <PopPill at={at('signin', 'six')} hot>6-digit code</PopPill>
          </div>
          <Sfx src="pop-click" at={at('signin', 'six')} volume={0.4} />
        </AbsoluteFill>
      ),
    },
    {name: 'Steps', lines: ['steps'], transition: 'slide', render: ({at}) => <Steps w={(n) => at('steps', n)} />},
    {
      name: 'Dashboard tour', lines: ['tour'], transition: 'slide',
      render: ({at}) => (
        <ZoomShot src="screens/example-dashboard.png" focus={[{x: 1240, y: 40, w: 640, h: 360, at: at('tour', 'new')}]}>
          <Cursor path={[{x: 900, y: 600, at: at('tour', 0)}, {x: 1700, y: 110, at: at('tour', 'new'), click: true}]} />
          <Spotlight box={{x: 1560, y: 80, w: 280, h: 64}} at={at('tour', 'new') + 6} label="New project" />
        </ZoomShot>
      ),
    },
    {
      name: 'Close', lines: ['close'], transition: 'slide-up',
      render: ({at}) => (
        <AbsoluteFill>
          <Backdrop />
          <Camera to={1.03}>
            <At x={960} y={200}>
              <Checklist title="You're ready" items={[
                {label: 'Signed in', at: at('close', 0)},
                {label: 'Profile set up', at: at('close', 2) + 4},
                {label: 'Team invited', at: at('close', 'ready')},
              ]} />
            </At>
          </Camera>
          <Sfx src="success" at={at('close', 'ready')} volume={0.35} />
        </AbsoluteFill>
      ),
    },
  ],
};
