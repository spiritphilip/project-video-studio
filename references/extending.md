# Extending the skill

The skill is a git repo (`~/.claude/skills/project-video-studio`, private GitHub `spiritphilip/project-video-studio`). To update another PC: `git -C ~/.claude/skills/project-video-studio pull`.

## Add a setup question or option
Edit `setup/questions.json` (a round holds ≤4 questions with 2–4 options each), bump its `version`. Projects with an older `questionsVersion` are asked only the new keys next time. If the answer changes the build, read it in `template/scripts/brand.mjs` (export a constant) or in the kit.

## Add a style
1. Add the option to the `style` question (with a `preview`).
2. Add a section to `references/styles.md`: when to use it, which kit pieces, layout rules.
3. Add components to `template/src/kit/<style>.tsx` (stage-relative with `useStage()`, colours from `C`, fonts from `HEAD`/`BODY`).
4. Optional: a demo composition in `kit/demo.tsx` so users can preview it during setup.

## Add a voice provider
Add an async `provider(line, voice)` returning `{audio: Buffer, durationMs, words: [{text, startMs, endMs}]}` to `PROVIDERS` in `template/scripts/tts.mjs`, document it in `references/voice.md`, and add the key name to `setup/secrets.example.env`.

## Release
1. Test: scaffold into a temp folder, voice `scripts/videos/example.json`, register the example, `npx tsc --noEmit`, render stills.
2. Bump `VERSION` (semver: patch = fix, minor = new style/option, major = breaking kit API) and add a `CHANGELOG.md` line.
3. Commit and push. In existing projects: `node <skill>/scripts/sync-kit.mjs --dir videos` (`--dry` first).

Never commit secrets or licensed media; they live in `~/.video-studio/`.
