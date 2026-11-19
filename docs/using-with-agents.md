# Using it with your coding agent

The skill is plain markdown (`SKILL.md` + `references/`) plus Node scripts, so any agent that can read files and run terminal commands can follow it. Clone it once, then point your agent at `SKILL.md`.

Honest note on cost: rendering needs your own computer, so a browser chat (including a free claude.ai chat) can't run the pipeline. You need an agent that runs locally, or no agent at all (the wizard).

## Claude Code
```bash
git clone https://github.com/spiritphilip/project-video-studio ~/.claude/skills/project-video-studio
```
Claude Code discovers skills in `~/.claude/skills/` automatically. Ask: *"Make tutorial videos for this project."* Needs a Claude Pro/Max plan or API credits.

## Gemini CLI (free tier available)
Clone anywhere, e.g. `~/tools/project-video-studio`. In your project's (or your global) `GEMINI.md`, add:
```
For any request to make videos, tutorials or explainers about this project, read and follow
~/tools/project-video-studio/SKILL.md step by step (its scripts live next to it).
```

## Codex CLI
Same line in your `AGENTS.md` (project root or `~/.codex/AGENTS.md`).

## Cursor / Windsurf
Add a rule (`.cursor/rules/videos.mdc` or Windsurf rules) with the same text. Give it the absolute path to `SKILL.md`.

## Cline / Roo Code / OpenCode / Aider
Add the line to the agent's custom instructions / rules file, or say in your prompt: *"Follow ~/tools/project-video-studio/SKILL.md to make videos for this project."* With free or local models, keep batches small (one video at a time) and review the stills carefully.

## Questions without a question tool
SKILL.md asks the setup questions with the agent's multiple-choice tool when it has one. Otherwise the agent asks each round as a numbered list in chat; answer with the numbers.

## No agent
```bash
node ~/tools/project-video-studio/scripts/setup.mjs --project /path/to/app
```
The wizard detects the brand, asks the questions in the terminal, scaffolds `videos/`, builds the media library and downloads fonts. Then:
1. Write `videos/scripts/videos/<id>.json` (see references/scripts.md).
2. `npm run voice -- scripts/videos/<id>.json`
3. Copy `src/episodes/example` → `src/episodes/<id>`, edit the scenes, register it in `src/episodes/index.ts`.
4. `npm run dev` (preview), `npm run stills -- out/stills <Id>:auto`, `npm run render -- <Id>`.

## Updating
`git -C <where you cloned it> pull`, then in each project: `node <skill>/scripts/sync-kit.mjs --dir videos --dry` and run it again without `--dry`.
