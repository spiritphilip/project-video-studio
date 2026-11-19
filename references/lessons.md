# Lessons (from user feedback on real series)

1. **Screens must match the narration.** Talking about the club wallet means showing the club leader's wallet page, captured as that role. Never fill with the landing page. List the screen per beat before capturing.
2. **No slideshow.** The first proof-of-concept (static slides plus voice) was rejected as "dull, one-sided". What worked: centred motion design, 3D icons, real photos and footage, something moving in every frame, beats on the words.
3. **Mix real footage with animation** in every video from the hook onward; a real cold open (event footage with its own sound) makes the strongest first video.
4. **Energetic voice.** Flat TTS was rejected. Use rate +8–12%, pitch +3–6%, and a different narrator per audience so tracks feel distinct.
5. **Formal but simple English.** The user first asked for "more local", then corrected "no slang, formal but simple". Use local context (currency, places), not slang.
6. **Show the product as fully live.** No "coming soon", no "Android only": videos outlive releases.
7. **Group by how users think:** all money topics in one video, safety on its own, one audience per video.
8. **Matching loudness:** real speaker clips must sit at the narration's loudness before the final −14 LUFS normalise, and music ducks under real speech (`duckMusic`).
9. **Licensing:** no trial fonts (use a free look-alike), Mixkit/3dicons/own footage only, and keep license notes in the folders.
10. **Laptop limits:** one render at a time; clean temp bundles (a full C: drive broke a render); check RAM if another heavy build is running.
11. **Fonts from disk:** on flaky connections Google Fonts hangs renders ("Fetching … font" timeouts). Run `npm run fonts` once per project.
12. **Lock the brand bumpers** once approved; only the intro props change per video.
13. **Approve before building:** list, then scripts, then a stills check, then render. Re-renders are the expensive part.
