# Lessons (from user feedback on a real 27-video series)

1. **Screens must match the narration.** Talking about billing means showing the billing page, captured as the role that uses it. Never fill with the landing page. List the screen per beat before capturing.
2. **No slideshow.** A first proof-of-concept made of static slides plus voice was rejected as "dull, one-sided". What worked: centred motion design, 3D icons, real photos and footage, something moving in every frame, beats landing on the words.
3. **Mix real footage and screens with animation** in every video from the hook onward. A real cold open (event footage with its own sound) makes the strongest first video.
4. **Energetic voice.** Flat TTS was rejected. Use rate +8–12% and pitch +3–6% (less for calm brands), and a different narrator per audience so tracks feel distinct.
5. **Formal but simple language.** Local context (currency, places) is welcome; slang usually isn't unless the user asks for it.
6. **Show the product as fully live.** No "coming soon" and no "only on Android": videos outlive releases.
7. **Group topics by how users think:** all money topics in one video, safety on its own, one audience per video.
8. **Sound must fit the product.** Use the sound brief; keep music low (≈0.08 volume) and ducked under real speech; effects quiet (0.25–0.45).
9. **Matching loudness:** real speaker clips must sit at the narration's loudness before the final −14 LUFS normalise.
10. **Licensing:** no trial fonts (use a free look-alike); open-licensed media only, with credits kept.
11. **Laptop limits:** one render at a time, clean temp bundles (a full disk broke a render), and check RAM if another heavy build is running.
12. **Fonts from disk:** on flaky connections Google Fonts hangs renders ("Fetching … font" timeouts). Run `npm run fonts` once per project.
13. **Lock the brand bumpers** once approved; only the intro props change per video.
14. **Approve before building:** list, then scripts, then a stills check, then render. Re-renders are the expensive part.
15. **Quote the time.** Tell the user the estimated render time for a batch (from `doctor --bench`) before starting.
16. **Portrait means mobile view.** A 9:16 video shows the app the way a phone user sees it: capture the mobile layout (390×844 @2x) and show it full-height or in `<Phone>`. A desktop page scaled down into a portrait frame is unreadable and was rejected. For `format: both`, capture every beat twice (desktop for 16:9, mobile for 9:16) and pick the screenshot per format with `useStage().vertical`. Desktop-only tools (an IDE, an admin panel with no mobile layout) get zoomed crops of the part being talked about, not the whole window shrunk.
