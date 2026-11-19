// Episode registry: every entry becomes a composition in the Studio and can be rendered by id.
// Add one line per episode after its voice is generated (src/episodes/<folder>/vo.json must exist).
//
//   import {EPISODE as GET_STARTED} from './m1-get-started/Episode';
//   import GET_STARTED_VO from './m1-get-started/vo.json';
//   { id: 'M1-GetStarted', folder: 'Start-here', ep: GET_STARTED, vo: GET_STARTED_VO },
import type {EpisodeDef} from '../kit/episode';
import type {VoLine} from '../kit/media';
import type {ThumbProps} from '../thumbs/Thumbnail';

export type Entry = {id: string; folder: string; ep: EpisodeDef; vo: Record<string, VoLine>; thumb?: ThumbProps};

export const EPISODES: Entry[] = [
];
