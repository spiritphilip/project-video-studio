---
name: project-video-studio
description: Make tutorial, explainer and walkthrough videos for ANY software project. Reads the codebase to understand the product, its users, brand (logo, colours, fonts) and the sound that fits it, runs a first-time setup questionnaire (style - motion explainer, screen tour, animated presenter, real person or AI avatar; format; voice; tone; publishing), then plans the series, writes scripts, captures real app screens, generates free AI voice-over with word-timed captions, builds Remotion videos, renders, makes thumbnails and YouTube SEO. Use whenever the user asks for videos, tutorials, explainers, demos, onboarding clips, promo or YouTube content about the project they are working on.
version: 2.0.0
---

# Project Video Studio

A proven pipeline (battle-tested on a 27-video education series) that works in any project, with any coding agent:
**understand the project (brand + sound) → setup questions → video plan → scripts → screens → voice → build → stills check → render → thumbnails + SEO → publish.**

These instructions are agent-agnostic. Wherever they say "ask", use your agent's multiple-choice question tool (AskUserQuestion in Claude Code). If your agent has none, ask each round as a short numbered list in chat and wait for the answers.

`<skill>` = the folder holding this file (Claude Code: `~/.claude/skills/project-video-studio`; other agents: wherever it was cloned).
Per-machine data, never committed: `~/.video-studio/` (or `$VIDEO_STUDIO_HOME`)
- `secrets.env`: optional API keys shared by every project (template: `<skill>/setup/secrets.example.env`)
- `library/`: music, sound effects, stock clips + `credits.json` (built by `library.mjs` from free open sources)
- `profile.json`: the user's default answers and this machine's benchmark speed

Everything works for free by default: free Edge neural voices (`pip install edge-tts`), open-licensed media from Openverse, free 3D icons, Remotion (free for individuals and companies of up to 3 people).

## Step 0: System check and status
1. Run `node <skill>/scripts/doctor.mjs` (add `--dir <project>/videos` if it exists). It checks OS, CPU, RAM, disk, GPU, Node, Python, edge-tts, keys and the library against the requirements. Fix anything red, and tell the user exactly how.
2. On first use on a machine (once a `videos/` folder exists and `npm install` has run), run `node <skill>/scripts/doctor.mjs --dir <project>/videos --bench`. It renders a short test and estimates render minutes per 30 s / 60 s / 90 s / 3 min video (saved to `profile.json`). **Quote these numbers to the user before committing to a batch** (e.g. "8 videos of 90 s ≈ 2.5 hours of rendering on this PC").
3. Look for the project's video folder (default `<project>/videos/`, or any folder with `video.config.json`).
   - **Not there** → Step 1.
   - **There** → read `video.config.json` and `VIDEO-LIST.md` and continue where it stopped. If its `questionsVersion` is older than `<skill>/setup/questions.json`, ask ONLY the new questions. If `skillVersion` is older than `<skill>/VERSION`, offer `node <skill>/scripts/sync-kit.mjs --dir <videos>` (backs up what it replaces; `--dry` first).
4. Follow the user's own agent rules (commit identity, approvals, where test emails go).

## Step 1: Understand the project: product, brand, sound
Read [references/understand.md](references/understand.md). Before asking anything:
1. **Product:** read README/docs, routes and screens, roles and permissions, onboarding, pricing, the live URL. Write a short Project brief.
2. **Brand:** `node <skill>/scripts/detect-brand.mjs --project <root>` lists logo candidates, colours, fonts, name, tagline and URL. Check them against the code and pick the best logo (light version for dark backgrounds + square mark).
3. **Sound brief:** from the product type and audience, decide mood, genre, tempo and sound-effect character with the table in understand.md (a kids' app ≠ a bank ≠ a game). This drives which music and effects get fetched.
Use all three to pre-select the recommended option in every setup question.

## Step 2: First-run setup
Ask `<skill>/setup/questions.json` round by round (≤4 questions per round; put the option the project suggests first, marked "(Recommended)"; show the `preview` for the style question). Pre-fill from `~/.video-studio/profile.json`, skip what the project already answers, then run the `followUps` that apply (presenter look, avatar source, other language).
No agent? The user can run `node <skill>/scripts/setup.mjs --project <root>`, a terminal wizard that does Steps 1–2 on its own.
Then:
1. Build an answers JSON (project, brand, answers, voices, tracks, presenter, publish, soundBrief; the shape is in `<skill>/template/video.config.json`; default voices per provider and accent are in `<skill>/setup/voices.json`).
2. `node <skill>/scripts/scaffold.mjs --project <root> --config <answers.json>` creates `<root>/videos/` (it builds the media library first if it's empty).
3. `node <skill>/scripts/detect-brand.mjs --project <root> --write <root>/videos` copies the chosen logo in and merges the brand.
4. Add `videos/` to the host project's tsconfig/eslint/build `exclude`. Commit nothing until the user asks.
5. `cd videos && npm install`, then `npm run fonts` (fonts load from disk, so renders don't hang on a flaky connection).
6. **Project sound:** fetch music and effects that match the sound brief straight into the project:
   `node <skill>/scripts/library.mjs music "<query from the brief>" --name <name> --project <root>/videos` (and `sfx "<query>"` for signature sounds). Fetch 2–3 music candidates, let the user listen (files are in `public/audio/music/`), then set `music.default`. Credits land in `public/credits.json`.
7. Render `BrandPreview` stills (plus `PresenterDemo` for that style) and get the look approved. **After approval the bumpers are LOCKED** (add them to `lockedFiles`).
8. Save the answers as the user's defaults in `~/.video-studio/profile.json` (answers and voices only, no project data), and note the brief in the project's own notes so later sessions don't ask again.

## Step 3: Plan the series
Write `videos/VIDEO-LIST.md`: tracks (one per audience/role, or per feature), one topic per video, length target, narrator, status (⬜ ✍️ ✅ 🎙️ 🎬 ▶️). Group topics the way users think. Show the estimated render time from the benchmark. Get approval.

## Step 4: Scripts
Follow [references/scripts.md](references/scripts.md). Fact-check every claim against the CURRENT code. Write `scripts/videos/<id>.json` (lines with `id`, `voice`, `text`; `[pause 300]`, `*emphasis*`) and a readable review doc. Approval depends on `answers.approval`.

## Step 5: Screens and media
[references/capture.md](references/capture.md): `npm run capture` signs in as the matching role on clean demo data, desktop 1920×1080 and mobile 390×844@2x. **A screen on video must match what the voice is saying at that moment.** Need stock footage for a scene? `node <skill>/scripts/library.mjs stock "<query>" --name <n> --project <videos>` (free Pexels/Pixabay key).

## Step 6: Voice
`node scripts/tts.mjs scripts/videos/<id>.json` → `public/vo/<id>/*.mp3` + `src/episodes/<id>/vo.json` (word timings). Providers: `edge` (free, default), `azure` (free key), `elevenlabs` (paid), `recorded` (your own voice). See [references/voice.md](references/voice.md). Only changed lines are re-voiced. Play one line of each new voice to the user before voicing a whole batch.

## Step 7: Build the episode
Read [references/build.md](references/build.md) and the chosen style in [references/styles.md](references/styles.md). Copy `src/episodes/example/` as the start, register the episode in `src/episodes/index.ts`, and add a `thumb`. If a Remotion skill or docs are available to your agent, use them for API questions.
Rules: one focal point per scene, something always moving, every beat lands on a spoken word, real screens for "how to", motion graphics for concepts, never a static slide.

## Step 8: Check, render, ship
1. `npx tsc --noEmit`, then `node scripts/stills.mjs out/stills <Id>:auto` and LOOK at every still (overflowing text, empty frames, wrong screen for the line, captions over the UI). Fix and repeat.
2. `npm run render -- <Id> [...]` renders one at a time, normalised to −14 LUFS → `out/final/<Id>.mp4`. Long queues run in the background; keep the machine awake.
3. `npm run thumbs`, fill in `youtube/seo-source.json`, then `npm run seo` (CC BY credits are appended automatically). Publish per [references/publish.md](references/publish.md).
4. Update `VIDEO-LIST.md` and the project notes (what's live, ids, what's next).

## Hard-won rules
Read [references/lessons.md](references/lessons.md) once per project. The top ones:
- Screens must match the narration; never fill with the landing page.
- Show the product as fully working; videos live for years.
- Music and effects must fit the product (use the sound brief), at low volume, ducked under speech.
- Mix real screens and footage with animation; an all-animated slideshow feels dull.
- Energetic delivery: voice rate +8–12%, pitch +3–6% (less for calm brands).
- Only licensed media: open licenses with credits kept, no trial fonts.
- Render one video at a time on laptops; the scripts delete their temp bundles, which otherwise fill the disk.

## Extending
New style, voice provider, library source, question or kit component: see [references/extending.md](references/extending.md). Contributions welcome at github.com/spiritphilip/project-video-studio.
