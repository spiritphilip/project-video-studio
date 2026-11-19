# Changelog

## 2.0.0 (2026-11-19): open-source release
- **Open source** under MIT. Proper README, CONTRIBUTING, LICENSE, docs/using-with-agents.md, docs/requirements.md.
- **Works with any coding agent** (Claude Code, Codex CLI, Gemini CLI, Cursor, Cline/Roo, OpenCode, Aider, Windsurf) and **without an agent**: `scripts/setup.mjs` terminal wizard. SKILL.md is agent-agnostic (multiple-choice tool if available, numbered questions in chat otherwise).
- **Free by default:** new `edge` voice provider (Microsoft Edge neural voices via the open-source `edge-tts` package, no key, word timings). Azure, ElevenLabs and recorded voices stay as options. Default voices per provider and accent in `setup/voices.json`.
- **Media library from open sources:** `scripts/library.mjs` builds music, sound effects and stock clips from Openverse (no key; CC0/public domain/CC BY), with optional Freesound, Pexels and Pixabay keys. It records license and attribution per file (`credits.json`, `CREDITS.md`), and `seo.mjs` appends CC BY credits to YouTube descriptions. The catalogue lives in `setup/library.json` and replaces `assets-manifest.json`.
- **Starter pack:** CC0 sound effects ship in `assets/starter/`, so the kit works offline after cloning.
- **Project-aware brand + sound:** `scripts/detect-brand.mjs` finds the logo, colours, fonts, name and URL in any codebase. A sound brief (`soundBrief` in video.config.json) maps the product type and audience to music and effects, fetched per project with `library.mjs … --project <videos>`.
- **System check + speed of delivery:** `doctor.mjs` reports OS, CPU, RAM, disk, GPU, Node, Python and edge-tts against minimum/recommended requirements, and `--bench` measures render speed and estimates render time per video length (saved to profile.json).
- Generic music names (upbeat, calm, playful, inspiring); scaffold builds the library when it's empty and copies credits into the project.
- References generalised (no project-specific examples).

## 1.0.0 (2026-11-19)
- First release, generalised from a real 27-video education series.
- First-run setup questionnaire (16 questions in 4 rounds + follow-ups), data-driven and versioned.
- Styles: motion explainer, screen tour (ZoomShot/Cursor/Spotlight), animated presenter (lip-synced SVG host), real person / AI avatar (TalkingHead), kinetic.
- Formats 16:9, 9:16, 1:1 and both (auto vertical compositions).
- Voices: Azure (word timings), ElevenLabs (with-timestamps), own recordings.
- Scripts: scaffold, sync-kit (safe upgrades with backups), doctor, fonts (local), capture (Playwright per role), stills, render queue with loudnorm, thumbnails, YouTube SEO.
- Temp bundle cleanup after every render (they filled the disk).
