# Voice

`video.config.json → voices` maps a key (used by script lines) to a provider voice:
```json
"voices": {
  "narrator": {"provider": "azure", "name": "en-NG-AbeoNeural", "lang": "en-NG", "rate": "+12%", "pitch": "+5%"},
  "second":   {"provider": "elevenlabs", "voiceId": "<id>", "model": "eleven_multilingual_v2", "speed": 1.05},
  "me":       {"provider": "recorded"}
}
```
`tracks.<key>.narrator` says which voice narrates a track. Keys live in `~/.video-studio/secrets.env` (or the project's `videos/.env`).

## Azure Speech (default, free tier is enough)
Azure portal → create a **Speech** resource (F0) → Keys and Endpoint → `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`. Gives word timings for captions.
Good voices to audition (full list: `curl -H "Ocp-Apim-Subscription-Key: $KEY" https://$REGION.tts.speech.microsoft.com/cognitiveservices/voices/list`):
| Accent | Male | Female |
|---|---|---|
| Nigerian | en-NG-AbeoNeural | en-NG-EzinneNeural |
| Kenyan | en-KE-ChilembaNeural | en-KE-AsiliaNeural |
| US | en-US-AndrewMultilingualNeural, en-US-BrianMultilingualNeural | en-US-AvaMultilingualNeural, en-US-EmmaMultilingualNeural |
| UK | en-GB-RyanNeural | en-GB-SoniaNeural |
| South Africa | en-ZA-LukeNeural | en-ZA-LeahNeural |
| India | en-IN-PrabhatNeural | en-IN-NeerjaNeural |
Some voices take `"style": "cheerful"` (mstts:express-as).
**Energy:** flat delivery gets rejected. Use rate +8–12% and pitch +3–6% for "energetic", +0–4% for "calm".

## Auditioning
Render the same 2 lines with 4–6 candidate voices into `out/voice-samples/` (a throwaway script JSON per voice), play them to the user, and let them rank. Assign rank 1 to the main track. Save the cast in config and `profile.json`.

## ElevenLabs
`ELEVENLABS_API_KEY`; voice needs a `voiceId` (Voice Library → "ID"). Uses the `/with-timestamps` endpoint for word timings. Most natural; costs credits per character, so voice a single test line first.

## Your own voice (`recorded`)
Record each line as `public/vo/<id>/<line>.mp3` (quiet room, phone 20 cm away). Word timings come from a transcription: use Remotion's Whisper captions (`@remotion/install-whisper-cpp`, see the remotion-best-practices skill → captions), then put each line's `words` (and `durationMs`) into the script JSON and run tts.mjs, which only indexes them.

## Captions
Captions come from the word timings automatically (`answers.captions`: word-highlight | subtle | none). Upload an `.srt` to YouTube as well for accessibility and SEO.
