# Contributing

Thanks for helping. This project is a workflow (`SKILL.md` + `references/`) plus a Remotion kit (`template/`) and Node scripts (`scripts/`). Keep changes small and tested.

## Dev setup
```bash
git clone https://github.com/spiritphilip/project-video-studio
cd project-video-studio
node scripts/doctor.mjs
pip install edge-tts         # free voices for testing
```

## Testing a change
1. Scaffold into a temp folder:
   `node scripts/scaffold.mjs --project /tmp/vs-test`
2. `cd /tmp/vs-test/videos && npm install && npm run fonts`
3. Voice the example: `node scripts/tts.mjs scripts/videos/example.json`
4. Register the example in `src/episodes/index.ts` (see the comment in that file).
5. `npx tsc --noEmit` and `npx eslint src`
6. `node scripts/stills.mjs out/stills Example:auto BrandPreview:40,120,250 PresenterDemo:47` and look at the images.
7. For kit changes, also test a vertical project (`"format": "9:16"` in `video.config.json`, then `npm run brand`).

## Adding things
- **Setup question or option:** `setup/questions.json` (≤4 questions per round, 2–4 options each), and bump its `version`.
- **Style:** an option in the `style` question, a section in `references/styles.md`, components in `template/src/kit/<style>.tsx` (use `useStage()`, `C`, `HEAD`/`BODY`), optionally a demo composition.
- **Voice provider:** an async function in `template/scripts/tts.mjs` → `PROVIDERS`, returning `{audio, durationMs, words}`; defaults in `setup/voices.json`; docs in `references/voice.md`.
- **Media source:** a provider function in `scripts/library.mjs` that returns candidates with url, duration, title, creator, license and landing page. Only add sources whose license allows use in published videos, and always record attribution.
- **Library item:** an entry in `setup/library.json`.

## Pull request checklist
- [ ] Tested as above (tsc clean, stills look right).
- [ ] Docs updated (`SKILL.md` only for workflow changes; details in `references/`).
- [ ] `CHANGELOG.md` line added.
- [ ] No API keys, `.env` files, personal data or customer screenshots.
- [ ] No media you can't redistribute. Only CC0 / public-domain assets go in `assets/starter` or `template/public`, each with a credit entry.

## Releases
Maintainers bump `VERSION` (semver: patch = fix, minor = new style/option/source, major = breaking kit API) and tag `vX.Y.Z`. Users update with `git pull` + `scripts/sync-kit.mjs`.
