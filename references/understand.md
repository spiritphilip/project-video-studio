# Understand the project: product, brand, sound

Goal before any question: a short **Project brief**, the **brand tokens** for the config, and a **sound brief**. Spend effort on reading, not guessing.

## 1. Product
Read, in this order, and stop when you have enough:
1. The project's notes, README and docs folder: purpose, audience, decisions already made (a video or design brief may exist).
2. Routes and screens: `app/` or `pages/` (Next.js), `src/routes`, router config, mobile screens. List the user-facing flows (sign up, onboarding, the core job, payments, settings, admin).
3. Roles and permissions: role enums, middleware, guards, `role ===` checks, role tables. Each role usually becomes a track.
4. Onboarding and money: sign-up steps, plans and prices, what's free.
5. Live URL and environments (production domain, a staging site with demo accounts for screen capture).

## 2. Brand
Run `node <skill>/scripts/detect-brand.mjs --project <root>`. It prints JSON with:
- **logo candidates:** `logo*.svg|png`, `public/brand/*`, favicon, apple-touch-icon, `assets/`. Prefer an SVG or large PNG wordmark in a light version for dark backgrounds, plus a square mark for the outro.
- **colours:** Tailwind theme, CSS variables (`--primary`, `--background`), design tokens. Map them to bg / surface / card / primary / secondary / accent / text / muted / line / success / danger / highlight. The kit is designed dark-first; for a light brand use a deep tint of the brand colour as `bg`.
- **fonts:** `next/font`, Google Fonts links, `@font-face`. Use the same family if it's on Google Fonts; otherwise the closest free match (wide display → Unbounded, geometric → Outfit / Space Grotesk / Plus Jakarta Sans, humanist → Nunito / Source Sans 3). Never use trial or unlicensed fonts in published video.
- **name, description, tagline, URL** from `package.json`, the README and the landing hero.

Check the result against the code, confirm the logo with the user (show the file), then `--write <root>/videos` to copy it in and merge the brand into `video.config.json`.

## 3. Sound brief
Music and effects must fit the product and its audience. Decide this from what you read, not from personal taste, and write it to `video.config.json → soundBrief`:
```json
"soundBrief": {"mood": "warm, confident", "genre": "afrobeats-inspired upbeat", "tempo": "100-115 bpm",
  "sfxCharacter": "soft pops, light percussion", "musicQueries": ["afrobeat instrumental", "upbeat world percussion"],
  "sfxNotes": "no harsh impacts; coins only on money scenes"}
```

| Product type / audience | Music mood and genre | Music search queries | Sound-effect character |
|---|---|---|---|
| Fintech, banking, payments | calm, confident, trustworthy corporate | "corporate calm", "soft piano background", "ambient corporate" | subtle clicks, soft chimes; coins only on money beats |
| Kids, early learning | playful, bright | "playful ukulele", "glockenspiel happy", "kids fun" | bouncy pops, cartoon boings, sparkles |
| Education, students, youth community | upbeat, hopeful | "upbeat positive", "inspiring background" | friendly pops, success chimes |
| Africa-focused youth / community | warm, energetic | "afrobeat instrumental", "world percussion upbeat" | light percussion hits, pops |
| Gaming, esports | energetic, intense | "synthwave", "electronic energetic", "chiptune" | punchy hits, arcade blips, risers |
| Health, wellness, therapy | calm, gentle | "calm ambient", "meditation soft", "acoustic gentle" | soft chimes, airy whooshes; no impacts |
| Developer tools, APIs, infra | focused, modern | "lofi chill", "minimal electronic" | crisp UI clicks, keyboard taps, short swooshes |
| E-commerce, fashion, lifestyle | trendy, upbeat | "upbeat pop", "funk groove", "fashion house" | shimmer, cash-register, pops |
| Enterprise B2B, SaaS | inspiring, professional | "inspiring corporate", "motivational background" | clean clicks, gentle risers |
| Crypto, web3, AI | futuristic, modern | "modern electronic", "future bass", "tech background" | digital glitches, futuristic risers, synth hits |
| Travel, food, hospitality | warm, sunny | "acoustic happy", "summer upbeat", "latin guitar" | light whooshes, pops |
| Non-profit, civic, health campaigns | sincere, uplifting | "emotional piano", "hopeful cinematic" | minimal effects |

Adjust with the setup answers: "calm" energy → slower and softer even for youth products; "no music" → effects only. Then fetch candidates straight into the project:
```bash
node <skill>/scripts/library.mjs music "<query 1>" --name brand-theme   --project <root>/videos
node <skill>/scripts/library.mjs music "<query 2>" --name brand-theme-2 --project <root>/videos
node <skill>/scripts/library.mjs sfx   "<signature sound>" --name brand-hit --project <root>/videos
```
Let the user listen to 2–3 music candidates (`videos/public/audio/music/`) before locking one in as `music.default`. Credits go to `public/credits.json` automatically.

## 4. Write the brief
```
Product: … (one line) · URL: …
Users/roles: member (…), admin (…), …
Key flows per role: …
Words the product uses: … (use these exact labels in scripts and on screen)
Brand: bg #…, primary #…, fonts …, logo …
Sound: mood …, genre …, effects …
Demo data/accounts for capture: …
Existing videos/brief: …
```
Show it to the user in 5–8 lines together with the first round of setup questions, not as a separate approval round.
