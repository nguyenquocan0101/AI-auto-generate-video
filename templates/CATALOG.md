# Template Catalog (HyperFrames, renderer: "hyperframes")

Each scene in a template-mode `script.json` names a `templateId` below and fills
`inputs` with the listed slots. The template owns all visual design; you only
write text. Keep text SHORT — these are poster layouts, not paragraphs.

Render aspect is set once per script (`"aspect": "9:16"` for TikTok/Shorts).

> Vietnamese: visual text (inputs) keeps normal formatting ("5.5", "82.7%").
> Only `voiceText` must spell numbers out phonetically (see the skill rules).
> Emoji/icons (🔥 🚀 → …) are allowed in on-screen `inputs` (they render in colour),
> but NEVER in `voiceText`. Don't put emoji in char-by-char animated fields
> (e.g. `hero` of build-minimal).

---

## frame-bold-poster

**Role:** hook / strong statement. 1970s editorial poster — giant red figure,
3-line tilted headline (middle line auto-red), serif standfirst.
**Best for:** the opening hook, or a punchy single-claim body beat.

| slot           | type     | limit                    | notes                                                |
| -------------- | -------- | ------------------------ | ---------------------------------------------------- |
| `kicker`       | string   | ≤24                      | small uppercase label, top-left (e.g. "AI Coding")   |
| `date`         | string   | ≤24                      | top-right metadata (e.g. "12 · 06 · 2026")           |
| `figure`       | string   | ≤4                       | giant red figure — a number/stat (e.g. "5.5", "200") |
| `headline`     | string[] | ≤3 lines, ≤14 chars/line | line 2 renders red                                   |
| `standfirst`   | string   | ≤160                     | italic serif sub-line                                |
| `footer_left`  | string   | ≤32                      | channel name                                         |
| `footer_right` | string   | ≤32                      | source domain (renders red)                          |

---

## frame-statement-outro

**Role:** outro / closing CTA. Paper card: red rule, CTA, giant red channel
name, muted source, ink rule.
**Best for:** the final scene (always `type: "outro"`).

| slot      | type   | limit | notes                                                                  |
| --------- | ------ | ----- | ---------------------------------------------------------------------- |
| `cta`     | string | ≤60   | uppercase call-to-action (e.g. "Theo dõi để xem bản tin mới mỗi ngày") |
| `channel` | string | ≤24   | channel name (giant red)                                               |
| `source`  | string | ≤40   | "Nguồn: <domain>"                                                      |

---

## frame-pentagram-stat

**Role:** body / stat. Swiss-grid data anchor on a **dark neon** canvas
(`#0a0c12` + blue ambient glow) — giant glowing amber number, cyan eyebrow label,
faint oversized cyan number bleeding off the right, a small bar chart (cyan hero
bar), dark footer bar with a cyan rule.
**Best for:** a single hero statistic / benchmark / percentage with a premium,
high-tech dark look.

| slot           | type   | limit | notes                                                      |
| -------------- | ------ | ----- | ---------------------------------------------------------- |
| `label`        | string | ≤40   | small cyan uppercase eyebrow (e.g. "Hiệu năng · Coding")   |
| `headline`     | string | ≤12   | the giant glowing amber stat (e.g. "82%", "1M", "200")     |
| `subtitle`     | string | ≤120  | one supporting sentence under the stat                     |
| `anchor`       | string | ≤4    | faint giant number behind it (usually = the stat's digits) |
| `footer_left`  | string | ≤32   | channel name (on the dark footer bar)                      |
| `footer_right` | string | ≤32   | source domain                                              |

---

## frame-build-minimal

**Role:** body / bold statement. Dark cinematic canvas (`#0b0a09` + a warm amber
ambient glow) — one **big bold word** revealed letter-by-letter (glowing warm
white), an amber eyebrow, an amber hairline, a two-line description, rotated side
labels.
**Best for:** a punchy single-concept beat (a verdict, a theme, a turning point)
with a premium dark/amber look.

| slot         | type   | limit | notes                                                         |
| ------------ | ------ | ----- | ------------------------------------------------------------- |
| `eyebrow`    | string | ≤20   | small uppercase label above the word                          |
| `hero`       | string | ≤10   | ONE short word/phrase (revealed char-by-char — keep it short) |
| `desc`       | string | ≤90   | one supporting sentence below                                 |
| `side_left`  | string | ≤20   | rotated label on the left edge (e.g. channel)                 |
| `side_right` | string | ≤20   | rotated label on the right edge                               |

---

## frame-vignelli

**Role:** body / bold stat hero. Massimo Vignelli editorial — **dark charcoal**
canvas, a single red accent column on the right, 6-column grid, a giant white
number, uppercase label, footer wordmark with red underline.
**Best for:** a striking single statistic when you want a dark, high-contrast
beat (variety vs the white/paper templates).

| slot     | type   | limit | notes                                                            |
| -------- | ------ | ----- | ---------------------------------------------------------------- |
| `kicker` | string | ≤30   | small uppercase label next to a red bar (e.g. "Khảo sát · 2026") |
| `number` | string | ≤6    | the giant white stat (e.g. "62%", "3/4", "1M")                   |
| `label`  | string | ≤40   | uppercase white label under the number (≤2 short lines)          |
| `note`   | string | ≤120  | one muted supporting sentence                                    |
| `brand`  | string | ≤24   | footer wordmark (channel name)                                   |

---

## frame-logo-outro

**Role:** outro / brand end-card (**default outro**). Deep-violet radial canvas,
a glowing segmented logo mark that assembles in, brand name with a shimmer
sweep, tagline, and a footer URL.
**Best for:** the final scene (`type: "outro"`) — a polished brand sign-off.

| slot          | type   | limit | notes                                                       |
| ------------- | ------ | ----- | ----------------------------------------------------------- |
| `brand_name`  | string | ≤60   | channel/brand name (big, shimmering)                        |
| `tagline`     | string | ≤120  | one line under the name                                     |
| `primary_url` | string | ≤40   | footer URL / source (e.g. "https://aicodingvn.vercel.app/") |

---

## frame-liquid-bg-hero

**Role:** hook / hero (**default hook**). "Aurora Violet" — deep-indigo canvas
with large soft floating colour blobs + faint grid; a centred white headline,
subheadline and a rounded CTA pill.
**Best for:** the opening hook (`type: "hook"`) — a modern, premium intro.

| slot          | type   | limit | notes                                              |
| ------------- | ------ | ----- | -------------------------------------------------- |
| `kicker`        | string | ≤24  | small uppercase label, top-left (e.g. "AI Coding")            |
| `headline`      | string | ≤60  | the hook line (keep punchy, ~2 short lines) — shown in a vivid gradient |
| `headline_from` | string | hex  | headline gradient start (optional; default vivid gold→purple) |
| `headline_to`   | string | hex  | headline gradient end (optional)                              |
| `subheadline`   | string | ≤120 | one supporting sentence                                       |
| `cta`           | string | ≤24  | rounded pill label (e.g. "Theo dõi ngay")                    |
| `brand`         | string | ≤24  | footer-left label (channel/source)                           |

> Headline renders in an eye-catching gradient (default gold→orange→pink→purple).
> Override with `headline_from`/`headline_to` to fit the tone if you want.

---

## frame-creative-voltage
**Role:** hook / creative statement (alternative). Electric split — an electric-
blue panel (mono meta + a handwritten script accent + hand-drawn underline) and
a dark panel with a stacked display title, one line outlined in electric blue.
Bold, energetic, design-forward.
**Best for:** a punchy hook or a strong creative body statement (a few short words).

| slot            | type     | limit            | notes                                                            |
| --------------- | -------- | ---------------- | ---------------------------------------------------------------- |
| `meta`          | string   | ≤40              | mono label on the blue panel (e.g. "// CHE_DO_SANG_TAO · ON")    |
| `display_lines` | string[] | ≤4 lines, short  | the big title, one line per word/phrase                          |
| `accent_index`  | number   | 0-based          | which `display_lines` line gets the electric blue outline (default 1) |
| `script`        | string   | ≤20              | handwritten accent on the blue panel (Dancing Script)            |
| `caption`       | string   | ≤60              | mono caption, bottom-right                                       |

---

## frame-glitch-title
**Role:** hook / cyberpunk glitch (alternative). Dark signal-noise canvas —
scanlines, grid, grain, vignette, mono "REC"/timecode chrome, and a big title
with a cyan×magenta RGB-split glitch. High-energy, edgy.
**Best for:** a dramatic/breaking or tech hook (a short shouty title).

| slot       | type   | limit | notes                                                  |
| ---------- | ------ | ----- | ------------------------------------------------------ |
| `title`    | string | ≤40   | the big glitch title (short; uppercased automatically) |
| `subtitle` | string | ≤80   | mono line under the title                              |

---

## frame-aicoding-list
**Role:** body / list · comparison (original). Dark canvas with a warm gradient
glow, a big gradient-accent title + subtitle, then a stack of rounded item cards
— each with a coloured icon chip, title + description, and a coloured level tag.
**Best for:** any scene that is a **list / ranking / comparison of 2–5 items**
(who's affected, pros vs cons, tiers, a checklist).

| slot       | type     | limit       | notes                                                        |
| ---------- | -------- | ----------- | ------------------------------------------------------------ |
| `title`       | string   | ≤40       | big headline (text before the accent)                          |
| `accent`      | string   | ≤20       | trailing word shown in a gradient (optional)                   |
| `accent_from` | string   | hex       | gradient start colour for `accent` (optional; default `#ff9a3d`) |
| `accent_to`   | string   | hex       | gradient end colour for `accent` (optional; default `#ff2d55`)   |
| `subtitle`    | string   | ≤60       | muted line under the title                                     |
| `items`       | object[] | 2–5 items | each: `{ icon, title, desc, tag, level }`                      |

Each `items[]` entry:
- `icon` — **you choose** an emoji that fits the item (🚫 ⚠️ ✅ 🔴 📈 ❌ 💡 🔒 🚀 …), shown in a tinted chip. Not fixed.
- `title` — bold item name (≤24). `desc` — small muted line (≤40).
- `tag` — short right-hand label (≤6, e.g. "Nguy", "Cao", "Lợi").
- `level` — `danger` (red) · `warn` (amber) · `good` (green) · `info` (blue); sets the icon/tag/bar colour.

> The accent gradient colours (`accent_from`/`accent_to`) are free to choose to fit the tone
> (e.g. warm `#ff9a3d`→`#ff2d55`, cool `#7c5cff`→`#22d3ee`, green `#34d399`→`#22c55e`).

---

## frame-aicoding-comparison
**Role:** body / head-to-head comparison (original). Dark canvas with a teal
glow, a pill badge, a "X vs Y" headline with two differently-coloured gradient
sides, two framed cards (big gradient label + bullets, a WIN badge on the winner)
and an optional stat row.
**Best for:** comparing **two things** (old vs new, A vs B, before vs after).

| slot       | type   | limit | notes                                                            |
| ---------- | ------ | ----- | ---------------------------------------------------------------- |
| `badge`    | string | ≤16   | pill label (e.g. "Đối đầu", "HEAD TO HEAD")                      |
| `pre`      | string | ≤16   | plain word before the left side in the headline (optional)       |
| `vs`       | string | ≤6    | middle word (default "vs")                                       |
| `post`     | string | ≤16   | plain word after the right side in the headline (optional)       |
| `left`     | object | —     | left side (see below)                                            |
| `right`    | object | —     | right side (see below)                                           |

Each side (`left` / `right`) object:
- `label` — short name (≤8, e.g. "LMS", "AI") shown gradient in the headline + big on the card.
- `from` / `to` — **caller-chosen** gradient hex for that side (e.g. left warm `#ffb020`→`#ff7a3d`, right teal `#34e0c0`→`#22d3ee`).
- `icon` — optional emoji shown above the card label.
- `bullets` — array of short lines (use "/" inside a line, e.g. "Khoá cố định / lộ trình tuyến tính").
- `stat` + `stat_label` — optional stat chip under the card (e.g. "88%" + "Ưa nền tảng mới").
- `win` — `true` (or a custom badge string) marks the winning side (teal border + WIN badge).

---

## ct-hook-hero

**Role:** hook (**ChuyenTin brand** — alternative to `frame-liquid-bg-hero`).
Deep navy purple canvas (`#191127`) with floating soft blobs (purple + gold glow),
headline in a vivid gold→purple gradient, golden CTA pill.
**Best for:** the opening hook (`type: "hook"`) for ChuyenTin-branded videos.

| slot          | type   | limit | notes                                              |
| ------------- | ------ | ----- | -------------------------------------------------- |
| `kicker`      | string | ≤24   | small uppercase label (e.g. "🔥 Tin nóng")         |
| `headline`    | string | ≤60   | the hook line — shown in gold→purple gradient      |
| `headline_from` | string | hex | gradient start (optional; default `#F5BE2B`)      |
| `headline_to`   | string | hex | gradient end (optional; default `#7726B6`)        |
| `subheadline` | string | ≤120  | one supporting sentence                            |
| `cta`         | string | ≤24   | golden pill label (e.g. "Theo dõi ngay")           |
| `brand`       | string | ≤24   | footer-right label (channel/source)                |

> Palette: Deep Navy `#191127` · Brand Purple `#7726B6` · Golden Yellow `#F5BE2B`
> Fonts: Quicksand 900 (headline) · Be Vietnam Pro 700 (UI)

---

## ct-stat-card

**Role:** body / stat (**ChuyenTin brand** — alternative to `frame-pentagram-stat`).
Dark navy canvas with a glowing amber/gold hero number, purple eyebrow label,
faint oversized anchor number in background, horizontal gradient rule.
**Best for:** a single hero statistic / benchmark with ChuyenTin branding.

| slot           | type   | limit | notes                                                       |
| -------------- | ------ | ----- | ----------------------------------------------------------- |
| `label`        | string | ≤40   | small purple uppercase eyebrow (e.g. "Thống kê · 2026")    |
| `headline`     | string | ≤12   | the giant glowing golden stat (e.g. "82%", "1M", "200")    |
| `subtitle`     | string | ≤120  | one supporting sentence under the stat                      |
| `anchor`       | string | ≤4    | faint giant number behind it (usually = the stat's digits)  |
| `footer_left`  | string | ≤32   | channel name (on the dark footer bar)                       |
| `footer_right` | string | ≤32   | source domain                                               |

> Palette: Deep Navy `#191127` · Golden Yellow `#F5BE2B` (hero) · Medium Purple `#9B4DE8` (label)

---

## ct-outro

**Role:** outro / brand end-card (**ChuyenTin brand** — alternative to `frame-logo-outro`).
Deep-purple radial canvas, animated spinning logo mark, brand name with shimmer
sweep, tagline, and a footer URL. Same structure as `frame-logo-outro`.
**Best for:** the final scene (`type: "outro"`) for ChuyenTin-branded videos.

| slot          | type   | limit | notes                                                       |
| ------------- | ------ | ----- | ----------------------------------------------------------- |
| `brand_name`  | string | ≤60   | channel/brand name (big, shimmering — e.g. "ChuyenTin")    |
| `tagline`     | string | ≤120  | one line under the name                                     |
| `primary_url` | string | ≤40   | footer URL / source (e.g. "chuyentin.com")                  |

> Palette: Deep Navy `#191127` · Brand Purple `#7726B6` · Golden Yellow `#F5BE2B`

---

## ct-list

**Role:** body / list (**ChuyenTin brand** — alternative to `frame-aicoding-list`).
Deep navy purple canvas (`#191127`), head with Quicksand 900 title and gradient accent, list items using deep purple background `#2A1045` and ChuyenTin brand colors.
**Best for:** lists, prerequisites, and steps.

| slot           | type     | limit                    | notes                                                         |
| -------------- | -------- | ------------------------ | ------------------------------------------------------------- |
| `title`        | string   | ≤40                      | big headline (text before the accent)                         |
| `accent`       | string   | ≤20                      | trailing word shown in a gradient (optional)                  |
| `accent_from`  | string   | hex                      | gradient start colour for `accent` (optional; default gold)   |
| `accent_to`    | string   | hex                      | gradient end colour for `accent` (optional; default purple)  |
| `subtitle`     | string   | ≤60                      | muted line under the title                                    |
| `items`        | object[] | 2–5 items                | each: `{ icon, title, desc, tag, level }`                     |

---

## ct-build-minimal

**Role:** body / bold statement (**ChuyenTin brand** — alternative to `frame-build-minimal`).
Deep navy purple canvas (`#191127`), a warm amber and purple glow, letter-by-letter reveal of a hero word using Quicksand font, rotated side labels.
**Best for:** punchy single-concept beats.

| slot         | type   | limit | notes                                                         |
| ------------ | ------ | ----- | ------------------------------------------------------------- |
| `eyebrow`    | string | ≤20   | small uppercase label above the word (e.g., "THUẬT TOÁN")     |
| `hero`       | string | ≤10   | ONE short word/phrase (revealed char-by-char — keep it short) |
| `desc`       | string | ≤90   | one supporting sentence below                                 |
| `side_left`  | string | ≤20   | rotated label on the left edge (e.g. channel)                 |
| `side_right` | string | ≤20   | rotated label on the right edge                               |

---

## ct-bold-poster

**Role:** hook / strong statement (**ChuyenTin brand** — alternative to `frame-bold-poster`).
Deep navy purple canvas (`#191127`), Quicksand headline/figure, 3-line tilted headline (middle line auto-gold), italic Be Vietnam Pro standfirst.
**Best for:** the opening hook or a punchy claims beat.

| slot           | type     | limit                    | notes                                                |
| -------------- | -------- | ------------------------ | ---------------------------------------------------- |
| `kicker`       | string   | ≤24                      | small uppercase label, top-left (e.g. "ChuyenTin")    |
| `date`         | string   | ≤24                      | top-right metadata                                   |
| `figure`       | string   | ≤4                       | giant gold figure — a number/stat (e.g. "03", "B1")  |
| `headline`     | string[] | ≤3 lines, ≤14 chars/line | line 2 renders gold                                  |
| `standfirst`   | string   | ≤160                     | italic sub-line                                      |
| `footer_left`  | string   | ≤32                      | channel name                                         |
| `footer_right` | string   | ≤32                      | source domain                                        |

---

## ct-comparison

**Role:** body / head-to-head comparison (**ChuyenTin brand** — alternative to `frame-aicoding-comparison`).
Deep navy purple canvas (`#191127`), Quicksand title and labels, cards styled in dark purple `#2A1045`, gold winner borders and win badge.
**Best for:** comparing two states (e.g. Before vs After, Basic vs Optimized).

| slot       | type   | limit | notes                                                            |
| ---------- | ------ | ----- | ---------------------------------------------------------------- |
| `badge`    | string | ≤16   | pill label (e.g. "Bước 1", "Tối ưu")                             |
| `pre`      | string | ≤16   | plain word before the left side in the headline (optional)       |
| `vs`       | string | ≤6    | middle word (default "vs" or "→")                                |
| `post`     | string | ≤16   | plain word after the right side in the headline (optional)       |
| `left`     | object | —     | left side (label, bullets, stat, stat_label)                     |
| `right`    | object | —     | right side (label, bullets, stat, stat_label, win)               |

---

## ct-glitch-title

**Role:** code title (**ChuyenTin brand** — alternative to `frame-glitch-title`).
Cyberpunk scanlines and grid over a deep navy purple canvas, split glitch layers in gold `#F5BE2B` and purple `#9B4DE8` for a premium code demo transition.
**Best for:** code/function name headers.

| slot       | type   | limit | notes                                                            |
| ---------- | ------ | ----- | ---------------------------------------------------------------- |
| `title`    | string | ≤40   | uppercase function/algorithm name                                |
| `subtitle` | string | ≤120  | description or programming language info                         |

---

## ct-voltage

**Role:** body / creative takeaway (**ChuyenTin brand** — alternative to `frame-creative-voltage`).
Split panel design using brand purple and deep navy, handwritten script in gold, auto-draw underline, and top panel sparks.
**Best for:** final takeaways or creative voltage statements.

| slot            | type     | limit | notes                                                |
| --------------- | -------- | ----- | ---------------------------------------------------- |
| `meta`          | string   | ≤40   | code-style uppercase meta (e.g. "// TAKEAWAY · C++") |
| `display_lines` | string[] | ≤3    | 3 display lines, one line highlighted in gold        |
| `accent_index`  | number   | —     | index of the highlighted line (0, 1, or 2)           |
| `script`        | string   | ≤40   | handwritten script text in gold                      |
| `caption`       | string   | ≤60   | bottom-right caption                                 |

---

## ct-code-trace

**Role:** code trace / IDE simulator (**ChuyenTin brand** — vertical Python Tutor alternative).
Deep navy purple canvas (`#191127`), IDE-style code box with active line highlighting, visualization of different data structures, and a bottom variable inspector detailing values.
**Best for:** step-by-step code execution tracing for arrays, linked lists, trees, and stack/queues.

| slot | type | notes |
| --- | --- | --- |
| `badge` | string | pill label (e.g. "Bước 1 · Dòng 4") |
| `code_lines` | object[] | array of `{ n, t }` where `n` is line number, `t` is code text |
| `active_line_num` | number | 1-indexed line number to highlight |
| `variables` | object[] | array of `{ name, value, old_value, changed }` |
| `status` | string | step description/verdict |
| `step_index` | number | current step index |
| `total_steps` | number | total steps in trace |
| `data_structure_type` | string | `"array"`, `"linked_list"`, `"tree"`, or `"stack_queue"` |
| `array_elements` | number[] | (For `"array"`) array values |
| `highlight_indices` | number[] | (For `"array"`) active indices |
| `swap_indices` | number[] | (For `"array"`) indices swapping |
| `pointers` | object | (For `"array"`) mapping of index to pointer label, e.g. `{"0":"j"}` |
| `nodes` | object[] | (For `"linked_list"`) array of `{ id, value, next }` |
| `current_pointer` | object | (For `"linked_list"`) `{ node_id, label }` |
| `highlight_node_ids` | string[] | (For `"linked_list"`) highlighted node IDs |
| `changed_link_from` | string | (For `"linked_list"`) start node ID of changed link |
| `changed_link_to` | string | (For `"linked_list"`) end node ID of changed link |
| `tree_nodes` | object[] | (For `"tree"`) array of `{ id, value, parent }` |
| `visited_ids` | string[] | (For `"tree"`) list of visited node IDs |
| `current_id` | string | (For `"tree"`) active node ID |
| `traversal_order` | string[] | (For `"tree"`) visited node order |
| `container_type` | string | (For `"stack_queue"`) `"stack"` or `"queue"` |
| `elements` | object[] | (For `"stack_queue"`) array of `{ id, value }` |
| `top_or_front_id` | string | (For `"stack_queue"`) ID at top/front |
| `just_pushed_id` | string | (For `"stack_queue"`) ID of element just pushed |
| `just_popped_id` | string | (For `"stack_queue"`) ID of element just popped |

---

## ct-tree-cinema-trace

**Role:** premium tree trace / BST simulator. Bright cinematic debugger layout with a large tree stage, code panel, state inspector, and progress rail.
**Best for:** Binary Search Tree, Tree Sort, tree traversal, and insertion lessons where the tree should feel persistent and polished.

Uses the same core slots as `ct-code-trace`, with focus on tree inputs:

| slot | type | notes |
| --- | --- | --- |
| `badge` | string | pill label, e.g. `"BƯỚC 2 · CHÈN 4, 9"` |
| `code_lines` | object[] | array of `{ n, t }` where `n` is line number and `t` is code text |
| `active_line_num` | number | active code line |
| `variables` | object[] | array of `{ name, value, old_value, changed }` |
| `status` | string | step verdict shown as a large status card |
| `step_index` | number | current step |
| `total_steps` | number | total trace steps |
| `data_structure_type` | string | expected `"tree"` |
| `tree_nodes` | object[] | array of `{ id, value, parent }` |
| `visited_ids` | string[] | stable nodes/edges already present or visited |
| `current_id` | string | active node ID; only this/new nodes animate |
| `traversal_order` | string[] | optional inorder output display |

---

## ct-chuyentin-cinema

**Role:** universal ChuyenTin cinematic template. Uses the official ChuyenTin design tokens: Deep Navy Purple `#191127`, Brand Purple `#7726B6`, Medium Purple `#9B4DE8`, Golden Yellow `#F5BE2B`, Light Lavender `#F1ECFB`, and border `#E0DBE9`.
**Best for:** applying one consistent visual system across a whole video: hook, list, concept, poster, title, stat, outro, and tree trace scenes.

This template auto-detects the scene layout from the provided slots:

| input pattern | rendered layout |
| --- | --- |
| `tree_nodes[]` | BST/tree trace with code and state panels |
| `items[]` | list/checklist scene |
| `brand_name` | outro scene |
| `label` + `headline` | stat/analysis scene |
| `title` + `subtitle` | title transition scene |
| `headline[]` | poster statement scene |
| `headline` or `hero` | hook/concept scene |

---

## Adding a template

Drop a folder `templates/<id>/` with `index.html` (16:9 root, `data-composition-id`),
`compositions/portrait.html` (9:16), `hyperframes.json`, `meta.json`, and a
`NOTICE.md` if vendored. Use a Vietnamese-capable font stack (Alfa Slab One /
Lora / Be Vietnam Pro are known-good). Then add a row here.
