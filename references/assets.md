# Assets: open sources, licenses and credits

## Where things live
| What | Where | In git? |
|---|---|---|
| 3D icons (3dicons.co, CC0) | `template/public/icons` | yes |
| Starter sound effects (CC0) | `assets/starter/sfx` + `assets/starter/credits.json` | yes |
| Shared library: music, sfx, stock | `~/.video-studio/library/{audio/music,audio/sfx,stock}` + `credits.json` + `CREDITS.md` | no (per machine) |
| A project's media | `<project>/videos/public/{audio,stock,photos,screens,brand}` + `public/credits.json` | the project decides (stock, music and voice files are gitignored by default) |

## Building the library
```bash
node <skill>/scripts/library.mjs                 # fill everything missing (sfx, music, stock if keyed)
node <skill>/scripts/library.mjs --only music    # one section;  --force re-downloads
```
It copies the starter pack first, then downloads from:
| Source | Content | Key | License filter |
|---|---|---|---|
| [Openverse](https://openverse.org) (WordPress Foundation) | sound effects (mostly Freesound) and music (Jamendo, ccMixter, Wikimedia) | none | sfx: CC0 + public domain only; music: CC0, public domain, CC BY |
| [Freesound](https://freesound.org) | more sound effects | `FREESOUND_API_KEY` (free) | CC0 only |
| [Pexels](https://www.pexels.com/api/) | stock video | `PEXELS_API_KEY` (free) | Pexels license (free use, no attribution required) |
| [Pixabay](https://pixabay.com/api/docs/) | stock video | `PIXABAY_API_KEY` (free) | Pixabay content license |

What gets fetched is defined in `setup/library.json`: each kit sound name (`pop-click`, `whoosh-air`, `success`, …) has search queries and a duration window; music has moods (`upbeat`, `calm`, `playful`, `inspiring`). The same source file is never used twice.

## Project-specific media (from the sound brief)
```bash
node <skill>/scripts/library.mjs music "lofi chill" --name theme --project <project>/videos
node <skill>/scripts/library.mjs sfx "camera shutter" --name shutter --project <project>/videos
node <skill>/scripts/library.mjs stock "students on campus" --name campus --project <project>/videos
```
These download into the project and record the credit in `public/credits.json`.

## Credits
- Every file has an entry: title, creator, license, license URL, source, landing page and a ready-made attribution line.
- **CC BY** items require that credit wherever the video is published. `npm run seo` appends them to every YouTube description; add them by hand on other platforms.
- CC0 / public domain / Pexels / Pixabay need no credit, but the record is kept anyway.
- Avoid CC BY-SA and any NC (non-commercial) material: the library filters them out.

## Rules
- Only redistribute CC0 / public-domain files in this repo (`assets/starter`, `template/public`), each with a credit entry.
- Don't commit files from sources that forbid redistribution of standalone files (for example Mixkit). They're fine in a local library, but never in git.
- The user's own footage, photos and screenshots belong to the project, not to this repo.

## More free sources (manual)
Music: Free Music Archive (check each track's license), YouTube Audio Library (YouTube only), Incompetech (CC BY). Footage: Pexels, Pixabay, Coverr. Icons: 3dicons, Iconscout free (check license). The product's own photos and screen recordings usually beat stock.
