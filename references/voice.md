# Voice

`video.config.json → voices` maps a key (used by script lines) to a provider voice:
```json
"voices": {
  "narrator": {"provider": "edge", "name": "en-US-AndrewMultilingualNeural", "lang": "en-US", "rate": "+10%", "pitch": "+4%"},
  "second":   {"provider": "azure", "name": "en-NG-EzinneNeural", "lang": "en-NG", "rate": "+12%", "pitch": "+6%"},
  "pro":      {"provider": "elevenlabs", "voiceId": "<id>", "model": "eleven_multilingual_v2", "speed": 1.05},
  "me":       {"provider": "recorded"}
}
```
`tracks.<key>.narrator` says which voice narrates a track. Default voices per provider and accent are in `setup/voices.json`. Keys (only for azure/elevenlabs) live in `~/.video-studio/secrets.env` or the project's `videos/.env`.

## edge (default, free, no key)
Microsoft Edge's neural voices through the open-source Python package [`edge-tts`](https://github.com/rany2/edge-tts). Same voices as Azure, with word timings for captions.
```bash
python -m pip install --user edge-tts      # Windows: py -m pip install --user edge-tts
edge-tts --list-voices                     # every voice and locale
```
It uses the endpoint behind Edge's Read Aloud feature, which is unofficial: fine for most use, but for commercial-critical or high-volume work use `azure` (same voice names, official API, free tier). `[pause 300]` becomes a short pause; `*emphasis*` is read normally (no SSML).

## azure (free tier key)
Azure portal → create a **Speech** resource (F0, free) → Keys and Endpoint → `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`. Supports `[pause]`, `*emphasis*` and `"style": "cheerful"` (express-as) on voices that have styles.

## Voices to audition (work for edge and azure)
| Accent | Male | Female |
|---|---|---|
| US | en-US-AndrewMultilingualNeural, en-US-BrianMultilingualNeural | en-US-AvaMultilingualNeural, en-US-EmmaMultilingualNeural |
| UK | en-GB-RyanNeural | en-GB-SoniaNeural |
| Nigeria | en-NG-AbeoNeural | en-NG-EzinneNeural |
| Kenya | en-KE-ChilembaNeural | en-KE-AsiliaNeural |
| South Africa | en-ZA-LukeNeural | en-ZA-LeahNeural |
| India | en-IN-PrabhatNeural | en-IN-NeerjaNeural |
| Australia | en-AU-WilliamNeural | en-AU-NatashaNeural |
| French / Spanish / Portuguese / German | fr-FR-HenriNeural, es-ES-AlvaroNeural, pt-BR-AntonioNeural, de-DE-ConradNeural | fr-FR-DeniseNeural, es-ES-ElviraNeural, pt-BR-FranciscaNeural, de-DE-KatjaNeural |

**Energy:** flat delivery gets rejected. Use rate +8–12% and pitch +3–6% for "energetic", +0–4% for "calm".

## Auditioning
Voice the same 2 lines with 4–6 candidate voices into `out/voice-samples/` (a throwaway script JSON per voice), let the user listen, and have them rank. Assign rank 1 to the main track. Save the cast in the config and in `profile.json`.

## elevenlabs (paid)
`ELEVENLABS_API_KEY`; each voice needs a `voiceId` (Voice Library → ID). Uses the `/with-timestamps` endpoint for word timings. Most natural; costs credits per character, so voice one test line first.

## recorded (your own voice)
Record each line as `public/vo/<id>/<line>.mp3` (quiet room, phone ~20 cm away). Word timings come from a transcription (for example Whisper: Remotion's `@remotion/install-whisper-cpp` captions guide). Put each line's `words` (and `durationMs`) into the script JSON; tts.mjs then only indexes them.

## Captions
Captions come from the word timings automatically (`answers.captions`: word-highlight | subtle | none). Also upload an `.srt` to YouTube for accessibility and SEO.
