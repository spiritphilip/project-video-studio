"""Free neural voice-over via the open-source `edge-tts` package (no account, no key).
Called by scripts/tts.mjs:  python edge_tts.py <voice> <rate> <pitch> <out.mp3>   (text on stdin)
Prints JSON {"words": [{"text", "startMs", "endMs"}]} with word timings for captions.
Install once:  python -m pip install --user edge-tts
"""
import asyncio
import json
import sys

import edge_tts


async def main() -> None:
    voice, rate, pitch, out = sys.argv[1:5]
    text = sys.stdin.read()
    try:  # edge-tts >= 7 needs WordBoundary asked for explicitly
        comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, boundary="WordBoundary")
    except TypeError:  # older versions emit word boundaries by default
        comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
    words = []
    with open(out, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10000
                words.append({"text": chunk["text"], "startMs": round(start), "endMs": round(start + chunk["duration"] / 10000)})
    print(json.dumps({"words": words}))


asyncio.run(main())
