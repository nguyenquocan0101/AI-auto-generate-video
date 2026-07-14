---
description: Generate a long (~12-20min) in-depth programming/algorithm teaching video from a tutorial URL or .txt file, using the create-programming-video skill's `duration=long` tier (extended 8-12 scene TRACE, extra edge-case input, mandatory Comparison + Optimization scenes). Output: video.mp4 + voice.mp3 + script.txt.
argument-hint: <url|file.txt> [audience: cap2|cap3|chung]
---

Load the `create-programming-video` skill and run it with input `$ARGUMENTS`, forcing `duration = "long"` (per the skill's V5 duration-tier override). Keep `audience` as passed by the user, or let the skill infer it if omitted.
