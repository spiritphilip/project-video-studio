# Screen capture

`npm run capture` (scripts/capture.mjs) drives Playwright from `capture.json` and writes `public/screens/<name>.png`.

## Setup
- Playwright: reuse the host project's (`NODE_PATH=../node_modules node scripts/capture.mjs`) or `npm i -D playwright && npx playwright install chromium`.
- Point `baseUrl` at a running dev server or a staging site with **clean demo data** (no "test123" or "E2E Club" names; realistic names, amounts and dates).
- **Never capture production with real users' personal data.**

## Signing in as each role
`auth.<role>` is either:
- `{"storageState": "auth/member.json"}`: log in once by hand (`npx playwright codegen --save-storage=auth/member.json <url>`) and reuse the file. `auth/` is gitignored.
- `{"script": "scripts/capture-auth.mjs"}`: a module `export default async (page, role, baseUrl) => {...}` that logs in however the app allows it (a dev token endpoint, a magic-link API, a seeded password, or a wallet test key). Read the project's E2E tests first; they usually already solve login.

## What to capture
For each video, list the exact screen per beat **before** capturing: "club money talk → the club wallet page as a club leader", not the landing page. Desktop (1920×1080) for `<Browser>` / `<ZoomShot>`, mobile (390×844 @2x) for `<Phone>`. Use `actions` to open menus/modals, `hide` for cookie banners and chat widgets, `waitFor` for data to load.

## No running app?
Use the live site for public pages, or build the screen as a styled mock with the kit's `AppHeader`/`AppRow`/`Toast` inside `<Phone>`, matching the real UI labels.
