# Building episodes

## Anatomy
```tsx
export const EPISODE: EpisodeDef = {
  track: 'Member', episode: 'Episode 2', title: 'Fund your *wallet*',   // *word* = brand gradient
  music: 'driving-ambition',            // public/audio/music/<name>.mp3; null = no music
  coldOpen: {src: 'stock/event.mp4', fromS: 3, toS: 12, cutAtS: 9},   // optional real-footage hit before the intro
  presenter: {position: 'right'},       // optional: animated host in every scene
  scenes: [
    {name: 'Hook', lines: ['hook'], render: ({at}) => <…/>},
    {name: 'Bank', lines: ['bank', 'bank2'], transition: 'slide', render: ({at, dur}) => <…/>},
  ],
};
```
Register in `src/episodes/index.ts`: `{id: 'M2-Funding', folder: 'Member', ep: EPISODE, vo: VO, thumb: {...}}`. Composition length is computed from the voice, so never hard-code durations.

**Timing:** `at('bank')` = local frame the line starts; `at('bank', 4)` = when word #4 (0-based) is spoken; `at('bank', 'naira')` = the first word starting with "naira". Put every pop, highlight and sfx on these, usually 2–4 frames *before* the word (`at(...) - 3`).
Scene options: `transition` fade | slide | wipe | slide-up · `hold` extra frames · `captions: false` · `noLogo` · `frames` fixed length (no narration) · `duckMusic` (real speech in the scene) · `presenter: false | {...}`.

## Kit (src/kit)
| Import | Use |
|---|---|
| `index`: `Backdrop`, `Camera`, `Kinetic`, `Eyebrow`, `Pill`, `Icon3D`, `At`, `useStage`, `hotText`, `clamp` | living background, slow push, word-by-word headline, 3D icons (names in `IconName`), stage geometry (W, H, cx, cy, u, vertical) |
| `visuals`: `Phone`, `Browser`, `Montage`, `Rush`, `StepCard`, `Checklist`, `PopPill`, `CountUp`, `AppHeader`/`AppRow`/`Toast`, `FramedClip`, `BigStat`, `Stamp`, `Bubble`, `StepTrack`, `Scrim` | device frames with screenshots, photo montages, cards, ticking checklists, counters, chat bubbles, progress tracks, warning stamps |
| `media`: `StockClip`, `Soundbite`, `OverlayHeadline`, `EndCard`, `Sfx`, `MusicBed`, `VoiceLine`, `wordAt` | graded footage, real speaker clips with captions, sound effects |
| `tour`: `ZoomShot`, `Cursor`, `Spotlight`, `TalkingHead` | screen-tour zooms, clicking cursor, highlight a button; real/AI presenter clip |
| `presenter`: `Presenter` | animated host, lip-synced to `speech` |
| `bumpers`: `BrandIntro`, `BrandOutro` | locked brand intro/outro |

Sound effects (public/audio/sfx): pop-click, pop-bubble, pop-explainer, whoosh-air, whoosh-fast, sparkle, success, coin-win, coins-clink, unlock, message, riser-short, riser-synth, quick-zoom, tile-hit, intro-impact, logo-impact. Keep volume 0.25–0.45.

## Scene recipes (pick per beat)
- **Hook:** `StockClip` + `OverlayHeadline` (3–5 words), or a `BigStat`.
- **"Go here, tap this":** `ZoomShot` of the real screen + `Cursor` + `Spotlight` with the UI label.
- **Mobile flow:** `Phone` with step-by-step screens switching on words; `PopPill` labels beside it.
- **List of options:** 2–4 `StepCard`s popping on the words that name them.
- **Process:** `StepTrack` lighting up per step.
- **Money/number:** `BigStat` or `CountUp` + coin icons.
- **Warning:** `Stamp` ("NEVER") + `Bubble`s showing a scam message.
- **Dialogue:** `Phone` with `Bubble`s, `captions: false`, the two voices on alternating lines.
- **Close:** `Checklist` ticking, or `EndCard` ("Next: …").

## Layout
Design at the composition size (1920×1080, or 1080×1920 vertical). Use `useStage()` values so scenes survive a format change. Keep text ≥ 32px (≥ 44px vertical), keep the bottom ~180px clear for captions, and at most ~8 words on screen at once.

## Check
`npx tsc --noEmit` → `node scripts/stills.mjs out/stills <Id>:auto` → look at every still. Studio: `npm run dev`.
