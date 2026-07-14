# Engagement polish (3b1b / Kurzgesagt-style)

Applies to `duration = standard | long` (skip for `short` — no room).

## Câu hỏi nhỏ (pre-outro scene)

Insert one scene right before Outro, using `ct-list` (1 item) or `ct-bold-poster`:
- title/kicker: `"Thử thách nhỏ"`.
- Ask ONE prediction/check-understanding question tied directly to the traced
  input (e.g. "Nếu mảng đã sắp xếp sẵn thì thuật toán này còn cần chạy hết
  không?"). Never a question the video didn't already give the viewer enough
  to answer.
- `voiceText` ends on the question mark — no spoken answer. The answer lives
  only in the on-screen `inputs` text (or is left for the viewer), per the
  3b1b principle "pose questions, make viewers curious before revealing
  answers."

## Outro CTA theo audience

Override the default `ct-outro` tagline based on `audience`:
- `cap2`: tagline hướng phụ huynh, ví dụ `"Cho ba mẹ xem cùng con nhé!"`.
- `cap3`/`chung`: tagline hướng học sinh tự học, ví dụ `"Theo dõi để học thêm thuật toán mới!"`.

Both rules are additive — they change scene count by +1 (question) and
tweak one string (CTA), they never override the TRACE or scene-count tiers
defined in the main SKILL.md.
