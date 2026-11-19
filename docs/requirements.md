# Requirements and speed of delivery

Run `node scripts/doctor.mjs` for a system check, and `node scripts/doctor.mjs --bench` to measure your machine's render speed (saved to `~/.video-studio/profile.json`, and quoted by the agent before a batch).

## Hardware and software
| | Minimum | Recommended | Why |
|---|---|---|---|
| CPU | 4 cores / threads | 8+ cores | Remotion renders frames in parallel on the CPU |
| RAM | 8 GB | 16 GB | each render worker is a headless Chrome tab |
| Free disk | 10 GB | 30 GB on an SSD | temp bundles, raw + final renders, voice files |
| GPU | not needed | | rendering is CPU-only |
| OS | Windows 10+, macOS 12+, Linux | | |
| Node.js | 20.19+ | 22 LTS | Remotion 4 |
| Python | 3.9+ | | only for the free `edge` voices (`pip install edge-tts`) |
| Internet | needed for voices, the media library and first font download | | renders themselves run offline after `npm run fonts` |

Below the minimum it still works, just slowly: set `CONC=2`, render one video at a time and close heavy apps.

## Render speed
Measured on a CPU-only laptop: about **1–2 minutes of rendering per 15 seconds of video** (1080p, 30 fps, with footage and effects).

| Video length | Minimum PC (4 cores, 8 GB) | Recommended PC (8+ cores, 16 GB, SSD) |
|---|---|---|
| 30 s | 4–8 min | 1–3 min |
| 60 s | 8–15 min | 2–5 min |
| 90 s | 12–20 min | 3–7 min |
| 3 min | 25–40 min | 6–14 min |

Scenes with stock footage, many layers or blur cost more; plain motion scenes cost less. Vertical and square formats render at about the same speed.

## Delivery timeline per video
| Step | Who | Typical time |
|---|---|---|
| Understand project + setup (first video only) | agent + you | 15–30 min |
| Script (write + fact-check) | agent | 5–10 min |
| Script approval | you | depends on you |
| Screen captures | agent (Playwright) | 2–10 min |
| Voice-over | edge/Azure | under 1 min |
| Build scenes | agent | 15–40 min |
| Stills check + fixes | agent | 5–15 min |
| Render + loudness | your PC | see the table above |
| Thumbnail + SEO | agent | 2–5 min |
| Upload | you or a connector | 5 min |

A realistic pace once set up: **3–6 finished 90-second videos per day** on a recommended PC, about half that on a minimum PC. Rendering can run unattended in the background (overnight for big batches).
