# Extending the skill

Public repo: <https://github.com/spiritphilip/project-video-studio> (MIT). To update a machine: `git -C <clone dir> pull`; then in each project `node <skill>/scripts/sync-kit.mjs --dir videos --dry`, and run it again without `--dry`. See also CONTRIBUTING.md.

## Add a setup question or option
Edit `setup/questions.json` (a round holds ≤4 questions with 2–4 options each) and bump its `version`. Projects with an older `questionsVersion` are asked only the new keys. If the answer changes the build, read it in `template/scripts/brand.mjs` (export a constant) or in the kit. The terminal wizard (`scripts/setup.mjs`) reads the same file, so it picks the new question up automatically.

## Add a style
1. Add the option to the `style` question (with a `preview`).
2. Add a section to `references/styles.md`: when to use it, which kit pieces, layout rules.
3. Add components in `template/src/kit/<style>.tsx` (stage-relative with `useStage()`, colours from `C`, fonts from `HEAD`/`BODY`).
4. Optional: a demo composition in `kit/demo.tsx` so users can preview it during setup.

## Add a voice provider
Add an async `provider(line, voice)` returning `{audio: Buffer, durationMs, words: [{text, startMs, endMs}]}` to `PROVIDERS` in `template/scripts/tts.mjs`. Add default voices to `setup/voices.json`, document it in `references/voice.md`, and add its key name to `setup/secrets.example.env`.

## Add a media source
Add a provider function in `scripts/library.mjs` that returns candidates `{url, durationS, title, creator, license, landing, source}`, and call it in `pick()` for the right kind. Only use sources whose license allows use in published videos, filter licenses at the API level, and never drop the attribution fields. New catalogue items go in `setup/library.json`.

## Add a starter asset
Only CC0 / public-domain files, small (a few hundred KB at most), in `assets/starter/<kind>/`, with an entry in `assets/starter/credits.json`.

## Release
1. Test: scaffold into a temp folder, voice `scripts/videos/example.json`, register the example, `npx tsc --noEmit`, render stills (see CONTRIBUTING.md).
2. Bump `VERSION` (semver: patch = fix, minor = new style/option/source, major = breaking kit API) and the `version` in SKILL.md's frontmatter, and add a `CHANGELOG.md` entry.
3. Commit, tag `vX.Y.Z`, push.

Never commit secrets or media that can't be redistributed; they live in `~/.video-studio/`.
