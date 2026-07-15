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

## ct-hook-hero

**Role:** hook.
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
| `brand`       | string | ≤24   | top-left label next to the logo badge (channel/source) |

> Palette: Deep Navy `#191127` · Brand Purple `#7726B6` · Golden Yellow `#F5BE2B`
> Fonts: Quicksand 900 (headline) · Be Vietnam Pro 700 (UI)

---

## ct-stat-card

**Role:** body / stat.
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

**Role:** outro / brand end-card.
Deep-purple radial canvas, animated spinning logo mark, brand name with shimmer
sweep, tagline, and a footer URL.
**Best for:** the final scene (`type: "outro"`) for ChuyenTin-branded videos.

| slot          | type   | limit | notes                                                       |
| ------------- | ------ | ----- | ----------------------------------------------------------- |
| `brand_name`  | string | ≤60   | channel/brand name (big, shimmering — e.g. "ChuyenTin")    |
| `tagline`     | string | ≤120  | one line under the name                                     |
| `primary_url` | string | ≤40   | footer URL / source (e.g. "chuyentin.com")                  |
| `cta`         | string | ≤32   | badge label above the logo (optional; default "Theo dõi ngay") |

> Palette: Deep Navy `#191127` · Brand Purple `#7726B6` · Golden Yellow `#F5BE2B`

---

## ct-list

**Role:** body / list.
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

**Role:** body / bold statement.
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

**Role:** hook / strong statement.
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

**Role:** body / head-to-head comparison.
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

**Role:** code title.
Cyberpunk scanlines and grid over a deep navy purple canvas, split glitch layers in gold `#F5BE2B` and purple `#9B4DE8` for a premium code demo transition.
**Best for:** code/function name headers.

| slot       | type   | limit | notes                                                            |
| ---------- | ------ | ----- | ---------------------------------------------------------------- |
| `title`    | string | ≤40   | uppercase function/algorithm name                                |
| `subtitle` | string | ≤120  | description or programming language info                         |
| `overline` | string | ≤40   | small mono label above the title (optional; default "— Code Source —") |

---

## ct-voltage

**Role:** body / creative takeaway.
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
