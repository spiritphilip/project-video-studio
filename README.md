# project-video-studio

A skill that makes tutorial and explainer videos for any project: it reads the codebase, asks how the videos should look on first setup, then plans, scripts, captures screens, voices, builds (Remotion), renders, and prepares thumbnails and YouTube SEO.

## Install on a PC
```bash
git clone https://github.com/spiritphilip/project-video-studio ~/.claude/skills/project-video-studio
mkdir -p ~/.video-studio && cp ~/.claude/skills/project-video-studio/setup/secrets.example.env ~/.video-studio/secrets.env
# fill in the keys, rebuild ~/.video-studio/library (references/assets.md), then:
node ~/.claude/skills/project-video-studio/scripts/doctor.mjs
```
Update: `git -C ~/.claude/skills/project-video-studio pull`

## Use
In any project, ask for videos ("make tutorial videos for this app"). The first run asks the setup questions and creates `videos/` in the project.

## Layout
- `SKILL.md`: the workflow
- `setup/questions.json`: setup questionnaire (versioned, extendable)
- `references/`: understand, scripts, capture, voice, build, styles, publish, lessons, extending, assets
- `template/`: the Remotion project copied into each project (kit, scripts, icons)
- `scripts/`: scaffold.mjs, sync-kit.mjs, doctor.mjs

Secrets and licensed media are never in this repo; they live in `~/.video-studio/`.
