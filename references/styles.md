# Styles

Chosen in setup (`answers.style`). Mix freely inside an episode; the style is the default look.

## motion-explainer (default)
Animated concept scenes (3D icons, kinetic headlines, cards, counters) + real screens in `Browser`/`Phone` frames + stock footage for hooks. Voice-over with word-highlight captions. Proven on a 27-video education series.

## screen-tour
For "how do I…" tutorials. Mostly real captured screens: `ZoomShot` eases into the area being talked about, `Cursor` moves and clicks on the word, `Spotlight` dims the rest with the UI label. Brief motion scenes only for hook and close. Capture at desktop 1920×1080; use the screenshot's pixel coordinates (open the PNG and read them).

## presenter-character
Set `presenter: {}` on the EpisodeDef (or per scene). The host stands on the side given by `presenter.position`, lip-syncs to that scene's lines, blinks, breathes and points at the content while speaking. Keep content in the other ~65% of the frame (`At x={W*0.4}`). Hide it with `presenter: false` on full-screen footage scenes. Look (skin, hair, hairStyle short|afro|bun|long|bald, outfit) is set in the config; preview it with the `PresenterDemo` composition. Want a richer character? Replace the SVG in `kit/presenter.tsx` (keep the `speech` → `mouthOpen` logic) or use a Lottie/Rive file driven by the same mouth value.

## real-presenter
- **You on camera:** record each beat (phone landscape, eye level, window light, lapel mic). Put the clips in `public/presenter/`. Use `<TalkingHead src layout="bubble|side|full">`. For voice, use the clip's own audio (`provider: recorded` with transcribed timings) so captions still work.
- **AI avatar (HeyGen / D-ID / Synthesia):** generate one clip per script line from the approved text (key in `~/.video-studio/secrets.env`; use their API or web app), download to `public/presenter/<id>-<line>.mp4`, and place with `<TalkingHead muted={false}>`. Paid: confirm cost with the user first. The avatar's audio is the voice-over; still run tts with `recorded` timings for captions.

## kinetic (voice provider "none")
Text-led: `Kinetic` headlines carry the message beat by beat on music; use scene `frames` for fixed lengths. Best for Shorts and ads.

## Vertical / Shorts (format 9:16 or both)
Everything centred and stacked; text bigger; captions sit higher (handled by the kit). **Screens come from the mobile captures** (390×844), shown full-height or in `<Phone>`; never scale a desktop screenshot or `<Browser>` down into the portrait frame. Screen-tour zooms in vertical use the mobile screenshot too (`ZoomShot shot={[780, 1688]}` for a 2x capture). With `format: both`, each episode also gets `<Id>-Vertical`. Check its stills separately, and for Shorts cut a 30–45 s version (hook + the single best beat + CTA).

## Adding a style
See extending.md.
