# Understand the project

Goal: a 10–15 line **Project brief** you could hand to a scriptwriter, plus the brand tokens for the config. Spend tokens on reading, not guessing.

## Read (in this order, stop when you have enough)
1. Project memory / CLAUDE.md / AGENTS.md / README / docs folder: purpose, audience, decisions already made (a design brief or video brief may already exist).
2. Routes and screens: `app/` or `pages/` (Next.js), `src/routes`, `mobile/` screens, router config. List the user-facing flows (sign up, onboarding, the core job, payments, settings, admin).
3. Roles and permissions: role enums, middleware, guards, `role ===` checks, DB tables like `user_roles`. Each role usually becomes a track.
4. Onboarding and money: sign-up steps, plans/prices, payment methods, what's free.
5. Brand:
   - colours: `tailwind.config.*` theme, CSS variables (`--primary`), design tokens. Map them to bg/surface/card/primary/secondary/accent/text/muted/line/success/danger/highlight.
   - fonts: `next/font`, `@font-face`, Google Fonts links. Use the same family if it's on Google Fonts and licensed; otherwise the closest free match (wide display → Unbounded, geometric → Outfit/Space Grotesk/Plus Jakarta Sans).
   - logo: `public/`, `assets/`, `brand/`. Prefer a light/white version for dark backgrounds, plus a square mark.
   - tagline and pillars: hero copy on the landing page.
6. Live URL and environments (production domain, a staging/testnet with demo accounts for capture).

## Write the brief
```
Product: … (one line) · URL: …
Users/roles: member (…), admin (…), …
Key flows per role: …
Words the product uses: … (use these exact labels in scripts and on screen)
Brand: bg #…, primary #…, fonts …, logo …
Demo data/accounts for capture: …
Existing videos/brief: …
```
Show it to the user in 5–8 lines with the setup questions (Step 2), not as a separate approval round.
