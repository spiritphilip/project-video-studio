import React from 'react';
import {Composition, Folder, Series} from 'remotion';
import {ALT_FORMAT, FORMAT, FPS, MUSIC} from './brand';
import {EPISODES} from './episodes';
import {BrandIntro, BrandOutro, INTRO_FRAMES, OUTRO_FRAMES} from './kit/bumpers';
import {Episode, episodeDuration} from './kit/episode';
import {MusicBed} from './kit/media';
import {Thumbnail} from './thumbs/Thumbnail';
import {PresenterDemo} from './kit/demo';

const BrandPreview: React.FC = () => (
  <>
    <Series>
      <Series.Sequence durationInFrames={INTRO_FRAMES}><BrandIntro track="Start here" episode="Episode 1" title="How it *works*" /></Series.Sequence>
      <Series.Sequence durationInFrames={OUTRO_FRAMES}><BrandOutro /></Series.Sequence>
    </Series>
    <MusicBed src={MUSIC.default} volume={MUSIC.volume} />
  </>
);

const folders = [...new Set(EPISODES.map((e) => e.folder))];

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Brand">
      <Composition id="BrandPreview" component={BrandPreview} durationInFrames={INTRO_FRAMES + OUTRO_FRAMES} fps={FPS} width={FORMAT.width} height={FORMAT.height} />
      <Composition id="BrandIntro" component={BrandIntro} durationInFrames={INTRO_FRAMES} fps={FPS} width={FORMAT.width} height={FORMAT.height}
        defaultProps={{track: 'Start here', episode: 'Episode 1', title: 'How it *works*'}} />
      <Composition id="BrandOutro" component={BrandOutro} durationInFrames={OUTRO_FRAMES} fps={FPS} width={FORMAT.width} height={FORMAT.height} />
      <Composition id="PresenterDemo" component={PresenterDemo} durationInFrames={150} fps={FPS} width={FORMAT.width} height={FORMAT.height} />
    </Folder>
    {folders.map((folder) => (
      <Folder key={folder} name={folder}>
        {EPISODES.filter((e) => e.folder === folder).map((e) => (
          <Composition key={e.id} id={e.id} component={() => <Episode ep={e.ep} vo={e.vo} />} durationInFrames={episodeDuration(e.vo, e.ep)}
            fps={FPS} width={FORMAT.width} height={FORMAT.height} />
        ))}
      </Folder>
    ))}
    {ALT_FORMAT && (
      <Folder name="Vertical">
        {EPISODES.map((e) => (
          <Composition key={e.id} id={`${e.id}-Vertical`} component={() => <Episode ep={e.ep} vo={e.vo} />} durationInFrames={episodeDuration(e.vo, e.ep)}
            fps={FPS} width={ALT_FORMAT!.width} height={ALT_FORMAT!.height} />
        ))}
      </Folder>
    )}
    <Folder name="Thumbnails">
      {EPISODES.filter((e) => e.thumb).map((e) => (
        <Composition key={e.id} id={`Thumb-${e.id}`} component={Thumbnail} durationInFrames={1} fps={FPS} width={1280} height={720} defaultProps={e.thumb!} />
      ))}
    </Folder>
  </>
);
