# Assets

| What | Where | In git? |
|---|---|---|
| 3D icons (3dicons.co, CC0) | `template/public/icons` | yes |
| Music + sound effects (Mixkit free license: commercial use OK, but not redistributable as standalone files) | `~/.video-studio/library/audio/{music,sfx}` | **no** |
| Stock clips (Mixkit stock video license) | `~/.video-studio/library/stock` | **no** |
| Project screens, photos, logo, voice-overs | the project's `videos/public/` | the project decides (voice-overs and stock are gitignored) |

`scaffold.mjs` copies the library into each new project.

## Rebuilding the library on a new PC
`assets-manifest.json` lists every file the kit expects. Download each from mixkit.co (search the title, free download) and save it under the listed name, or copy `~/.video-studio/` across from the old PC (it also holds `secrets.env`). The kit refers to sfx by file name (`<Sfx src="pop-click">`), so keep the names.

## More free sources
Music/SFX: mixkit.co, pixabay.com/music · Footage: mixkit.co, pexels.com/videos, pixabay.com/videos · Icons: 3dicons.co, iconscout (check license) · Photos: the project's own event/team photos beat stock.
