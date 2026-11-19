# Scripts

## Shape that works (60–90 s)
1. **Hook (1 line, ≤ 6 s):** the viewer's problem or the promise. Not "Welcome to episode 3".
2. **3–5 beats:** one idea per beat, each 1–3 sentences, each with its own scene.
3. **Close (1 line):** what to do next or a one-line takeaway.
About 140–160 spoken words per minute at +10% rate. Keep sentences under ~18 words.

## Rules
- **Fact-check against the current code**, not old docs: prices, limits, button labels, step order, who can do what. Use the product's exact UI labels and bold them (`*Withdraw*`).
- Present the product as fully live (no "coming soon"); videos stay up for years.
- Tone from `answers.tone`. Default formal-but-simple: plain words, local context where relevant (currency, places), no slang unless asked.
- One audience per video. If a step differs by role, make two videos.
- Money and safety get their own clear videos; never bury a warning.
- Dialogue scenes (`cast: dialogue`): 2–4 short exchanges, then the narrator explains.

## File format: `scripts/videos/<id>.json`
```json
{"id": "m2-funding", "title": "Member · Funding your wallet", "for": "Members",
 "lines": [
  {"id": "hook", "voice": "narrator", "text": "Your membership is paid in USDC. Here are three easy ways to add it."},
  {"id": "bank", "voice": "narrator", "text": "First, *bank transfer*. [pause 250] Pay in naira, and USDC arrives on its own."},
  {"id": "buyer", "voice": "second", "text": "Hello! I've sent the money.", "rate": "+4%"}
 ]}
```
- Line ids are what scenes use (`at('bank', 'naira')`), so keep them short and stable.
- One line ≈ one scene beat; a long paragraph makes timing coarse.
- Optional per-line `rate` / `pitch` overrides.

## Review doc
Also write a readable `SCRIPTS-REVIEW.md` (or add to it): per video, a title, "For:", "Voice:", "about N s" and the text with **bold** emphasis. The user approves there; then mirror the edits into the JSON.
