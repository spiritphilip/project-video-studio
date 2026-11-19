---
name: project-video-studio
description: Make tutorial, explainer and walkthrough videos for ANY project. Reads the codebase to understand the product and its user roles, runs a first-time setup questionnaire (style - motion explainer, screen tour, animated presenter, real person or AI avatar; format; voice; tone; publishing), then plans the series, writes scripts, captures real app screens, generates AI voice-over with word-timed captions, builds Remotion videos, renders, makes thumbnails and YouTube SEO. Use whenever the user asks for videos, tutorials, explainers, demos, onboarding clips, promo or YouTube content about the project they are working on.
version: 1.0.0
---

# Project Video Studio

A complete, proven pipeline (it shipped 27 education videos for TechXcellence) packaged so any project can use it:
**understand the project → setup questions → video plan → scripts → screens → voice → build → stills check → render → thumbnails + SEO → publish.**

Skill folder: `~/.claude/skills/project-video-studio` (`<skill>` below). Per-PC data (never in git): `~/.video-studio/`
- `secrets.env`: API keys shared by every project (Azure Speech, ElevenLabs, HeyGen, D-ID)
- `library/`: licensed music, sound effects and stock clips (Mixkit); `scaffold.mjs` copies them into each project
- `profile.json`: the user's default answers (pre-fills the questionnaire for the next project)

## Step 0: Where are we?
1. Run `node <skill>/scripts/doctor.mjs` (add `--dir <project>/videos` if the folder exists). Fix anything red before going on; for missing keys, tell the user exactly where to get them.
2. Look for the project's video folder (default `<project>/videos/`, or any folder containing `video.config.json`).
   - **Not there** → first-time setup (Step 1).
   - **There** → read `video.config.json` + the video list (`VIDEO-LIST.md`) and continue where it stopped. If `questionsVersion` < `<skill>/setup/questions.json` version, ask ONLY the new questions. If `skillVersion` is older than `<skill>/VERSION`, offer `node <skill>/scripts/sync-kit.mjs --dir <videos>` (backs up everything it replaces).
3. Honour the user's global rules (CLAUDE.md), e.g. commit identity, "ask before designing", where test emails go.

## Step 1: Understand the project (before asking anything)
Read [references/understand.md](references/understand.md). In short: read README/docs, routes/pages, roles and permissions, onboarding flow, pricing, the brand (logo files, colours from the Tailwind/CSS theme, fonts) and the live URL. Write a short **Project brief** (what it is, who uses it, the roles, the key flows, the brand) and use it to pre-select the recommended option in every question.

## Step 2: First-run setup questionnaire
Ask `<skill>/setup/questions.json` round by round with **AskUserQuestion** (one call per round, ≤4 questions, put the option the project suggests first with "(Recommended)", use the `preview` field for the style question). Pre-fill from `~/.video-studio/profile.json` when it exists, and skip anything the project already answers. Then run the `followUps` that apply (presenter look, avatar source, other language).
Then:
1. Build an answers JSON (project, brand, answers, voices, tracks, presenter, publish; see `template/video.config.json` for the shape; pick voices with [references/voice.md](references/voice.md)).
2. `node <skill>/scripts/scaffold.mjs --project <root> --config <answers.json>` → creates `<root>/videos/`.
3. Make sure the host project's tsconfig/eslint/build ignores `videos/` (add it to `exclude`). Commit nothing until the user asks.
4. `cd videos && npm install`, then `npm run fonts` (local fonts, so renders don't hang on a flaky connection).
5. Copy the real logo into `public/brand/` and set `brand.logo` / `brand.mark`. Render `BrandPreview` stills (and `PresenterDemo` if that style was chosen) and get the user's approval of the look. **After approval the bumpers are LOCKED** (add them to `lockedFiles`).
6. Save the answers as the user's defaults in `~/.video-studio/profile.json` (answers + voices only, no project data) and record the chosen brief in the project's memory/CLAUDE.md, so later sessions don't ask again.

## Step 3: Plan the series
Write `videos/VIDEO-LIST.md`: tracks (one per audience/role, or per feature), one topic per video, length target, narrator, status column (⬜ ✍️ ✅ 🎙️ 🎬 ▶️). Group topics the way a user thinks ("all the ways to earn" in one video, safety on its own). Get approval of the list.

## Step 4: Scripts
Follow [references/scripts.md](references/scripts.md). Every claim is checked against the CURRENT code (not old docs). Write `scripts/videos/<id>.json` (lines with `id`, `voice`, `text`; `[pause 300]`, `*emphasis*`) and a readable review doc. Approval depends on `answers.approval`.

## Step 5: Screens and media
[references/capture.md](references/capture.md): capture real screens with `npm run capture` signed in as the matching role, on clean demo data, desktop 1920×1080 and mobile 390×844@2x. **A screen on video must match what the voice is saying at that moment.** Footage and photos go in `public/stock` and `public/photos`.

## Step 6: Voice
`node scripts/tts.mjs scripts/videos/<id>.json` → `public/vo/<id>/*.mp3` + `src/episodes/<id>/vo.json` (word timings). Only changed lines are re-voiced. Listen to one line of each new voice before doing a whole batch.

## Step 7: Build the episode
Read [references/build.md](references/build.md) (kit API, scene recipes, timing with `at(line, word)`), and the style guide for the chosen style in [references/styles.md](references/styles.md). Copy `src/episodes/example/` as the start, register the episode in `src/episodes/index.ts`, add a `thumb`. For Remotion API questions load the `remotion-best-practices` skill if it is installed.
Rules: one focal point per scene, something always moving, every beat lands on a spoken word, real screens for "how to", motion graphics for concepts, never a static slide.

## Step 8: Check, render, ship
1. `npx tsc --noEmit`, then `node scripts/stills.mjs out/stills <Id>:auto` and LOOK at the stills (text overflow, empty frames, wrong screen for the line, captions covering UI). Fix and repeat.
2. `npm run render -- <Id> [...]` renders one at a time and loudness-normalises to −14 LUFS → `out/final/<Id>.mp4`.
3. `npm run thumbs` → `out/thumbs/<Id>.jpg`. For SEO, fill in `youtube/seo-source.json` and run `npm run seo`. Then publish per [references/publish.md](references/publish.md).
4. Update `VIDEO-LIST.md` status, and the project memory (what's done, YouTube ids, what's next).

## Hard-won rules
Read [references/lessons.md](references/lessons.md) once per project. The top ones:
- Screens must match the narration; never fill with the landing page.
- Show the product as fully working; videos live for years.
- Formal-but-simple English by default; no slang unless the user asks.
- Mix real footage and screens with animation; an all-animated "slideshow" was rejected as dull.
- Energetic delivery: voice rate +8–12%, pitch +3–6%.
- Speech clips and TTS at the same loudness before the final normalise.
- Only use licensed fonts/media (no trial fonts in published video).
- Render one video at a time on laptops. The scripts delete their temp bundles, which otherwise eat GBs of disk.

## Extending
New style, voice provider, question or kit component: see [references/extending.md](references/extending.md). Bump `VERSION`, add a CHANGELOG line and push; projects pick it up via `sync-kit.mjs`.
