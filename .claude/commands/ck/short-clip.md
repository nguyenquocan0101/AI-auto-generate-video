---
description: Generate a short (~20-60s) programming/algorithm teaching clip from a tutorial URL or .txt file, using the create-programming-video skill's `duration=short` tier (Hook → 2-3 core TRACE scenes → Outro, no filler scenes). Output: video.mp4 + voice.mp3 + script.txt.
argument-hint: <url|file.txt> [audience: cap2|cap3|chung]
---

Load the `create-programming-video` skill and run it with input `$ARGUMENTS`, forcing `duration = "short"` (per the skill's V5 duration-tier override). Keep `audience` as passed by the user, or let the skill infer it if omitted.
