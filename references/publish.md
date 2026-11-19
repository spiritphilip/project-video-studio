# Publish

## Render
`npm run render -- <Id> [<Id> ...]` (or `--all`): one at a time, retries once, loudness-normalised to −14 LUFS / −1.5 dBTP → `out/final/<Id>.mp4`. On a CPU-only laptop expect ~1–2 min per 15 s; run long queues in the background and keep the laptop awake. `CONC=2` if the PC struggles. Render the vertical versions separately.

## Thumbnails
Each registry entry's `thumb` → `npm run thumbs` → `out/thumbs/<Id>.jpg` (1280×720). Pattern: 2–4 word hook (NOT the title) with one *highlight* word, one big 3D object or phone screenshot, a colour per track, the brand logo + "TRACK · EP n" tag.

## YouTube SEO
Fill `youtube/seo-source.json` (title ≤ 70 chars, search-shaped: "How to … | Brand"; hook = first 150 chars of the description; points; tags long-tail; chapters from the stills timing), then `npm run seo` → `youtube/seo.json`. CC BY music/sfx credits from `public/credits.json` are appended to every description automatically; keep them when you publish elsewhere.
Privacy: public for user-facing tracks, unlisted for staff/admin tracks (ask).

## Uploading
- **YouTube connector / MCP (e.g. vidIQ), if your agent has one:** use it to upload/update titles, descriptions, tags, thumbnails and privacy from `seo.json`. It cannot create playlists, so write `youtube/playlists.md` (name, description, ordered links) for the user to create in Studio.
- **No connector:** the user bulk-uploads the MP4s in YouTube Studio; give them a copy-paste block per video from `seo.json`, plus the thumbnail and `.srt`.
- **YouTube Data API:** uploads from unverified API projects are locked to private. Use it for metadata only after the user uploads.
Record the ids in `youtube/youtube-ids.json`.

## In the product
Embed by YouTube id (store ids in the DB/CMS so an admin can swap them without a deploy), or self-host the MP4 (e.g. a public storage bucket; version the filename `name-v2-1080.mp4` on every re-render for cache busting; also make a 720p version and a poster JPG).

## After publishing
Update `VIDEO-LIST.md` statuses and the project memory (ids, what's live, next batch).
