---
name: create-programming-video
description: Tạo video dạy lập trình 9:16 dùng template HyperFrames ChuyenTin từ URL bài tutorial hoặc file .txt, có điều chỉnh nhịp độ/ngôn ngữ theo đối tượng (học sinh cấp 2, cấp 3, hoặc video chung) và theo độ dài mong muốn (short/standard/long). Trigger khi user muốn tạo video dạy lập trình, giải thích thuật toán, tutorial code, "tạo video lập trình", "làm video thuật toán", "video dạy code", "video giáo dục lập trình", "video ngắn về thuật toán", "video dài vài phút". Output: video.mp4 + voice.mp3 + script.txt cho CapCut.
---

# V5 AUTHORITATIVE OVERRIDE - duration tier

Áp dụng trước cả v4. `duration` chọn tier tổng thời lượng; v4 (audience) vẫn quyết định
ngôn ngữ/nhịp độ giảng dạy bên trong tier đó. Nếu có mâu thuẫn giữa v5 và v4 về **số scene,
số scene TRACE, danh sách scene bị cắt/thêm, `voice.speed`, tổng thời lượng**, v5 thắng.

## Input v5

Tham số:
1. URL tutorial hoặc file `.txt`.
2. `audience` tùy chọn: `"cap2" | "cap3" | "chung"` (xem v4).
3. `duration` tùy chọn: `"short" | "standard" | "long"`. Mặc định `standard`.

Nếu user nói rõ độ dài bằng số ("30 giây", "1 phút", "video ngắn", "clip dưới 1 phút") →
`short`. Nếu nói "video dài", "vài phút", "giải thích kỹ", "chi tiết đầy đủ" → `long`.
Nếu không nói gì → `standard` (dùng bảng v4 theo `audience`).

## Bảng scene theo duration tier

| | `short` | `standard` (bảng v4 theo audience) | `long` |
|---|---|---|---|
| Tổng số scene | 4-7 | 10-22 (xem v4) | 20-30 |
| Số scene TRACE | 2-3 | 3-8 (xem v4) | 8-12 |
| Scene bắt buộc | Hook, TRACE lõi, Outro | như v4 | Hook, Kiến thức nền, TRACE mở rộng (nhiều bước hơn + case biên), So sánh, Ứng dụng thực tế, Recap, Outro |
| Scene bị cắt | Kiến thức nền, Các bước tổng quan, Recap, So sánh, Tối ưu hóa, Ứng dụng thực tế — chỉ giữ 1 định nghĩa ngắn trong voiceText của Hook/TRACE | không cắt gì ngoài quy tắc v4 | không cắt; thêm 1-2 scene ví dụ biến thể/case biên ngoài TRACE gốc nếu thuật toán cho phép |
| `voice.speed` | 1.05 | theo bảng v4 (`audience`) | theo bảng v4 (`audience`), không vượt 0.85 |
| Tổng thời lượng | 20-60 giây | 4-12 phút (theo `audience`) | 12-20 phút |

Quy tắc `short`:
- Không bao giờ cắt khối TRACE — đây là phần cốt lõi giúp hiểu thuật toán, kể cả video ngắn nhất.
- Cấu trúc tối thiểu: `[Hook] → [TRACE 2-3 scene] → [Tổng kết 1 câu] → [Outro]`. Nếu thuật toán cần 1 câu khái niệm để TRACE không bị hụt ngữ cảnh, cho phép thêm đúng 1 scene `ct-build-minimal` ngay sau Hook.
- TRACE chọn đúng 2-3 bước "đắt giá nhất" (bước đầu, bước có so sánh/thay đổi quan trọng, bước kết thúc) — không trace tuần tự từng dòng.
- `voiceText` mỗi scene ngắn hơn mức thường (~10-18 từ) vì tổng thời lượng rất hẹp.

Quy tắc `long`:
- Giữ nguyên toàn bộ cấu trúc `standard` của audience tương ứng, KHÔNG cắt bớt.
- Mở rộng TRACE lên 8-12 scene bằng cách trace đầy đủ hơn (ít gộp bước lặp giống hệt nhau hơn so với `standard`) và/hoặc thêm 1 input thứ hai (case biên: mảng đã sắp xếp sẵn, input rỗng, giá trị trùng lặp…) để trace thêm 2-4 scene.
- Thêm scene "So sánh" và "Tối ưu hóa" nếu `optimization` có dữ liệu (bắt buộc ở tier này, không còn là tùy chọn).
- Không tăng `voice.speed` so với bảng v4 của audience — video dài không có nghĩa là đọc nhanh hơn.

## Input v4

Tham số:
1. URL tutorial hoặc file `.txt`.
2. `audience` tùy chọn: `"cap2" | "cap3" | "chung"`.

Nếu user không nói rõ:
- Chủ đề cơ bản cho học sinh (mảng, vòng lặp, tìm kiếm tuyến tính, sắp xếp cơ bản): `cap2`.
- Chủ đề nâng hơn (đệ quy nhiều lớp, cây, đồ thị, quy hoạch động): `cap3`.
- Video kênh chung, không nhắm học sinh phổ thông: `chung`.
- Nếu mơ hồ, hỏi đúng một câu: "Video này cho học sinh cấp 2, cấp 3, hay video chung?"

## Scene count và pacing v4 (áp dụng khi `duration = standard`)

| | `chung` | `cap3` | `cap2` |
|---|---|---|---|
| Tổng số scene | 10-16 | 12-20 | 16-22 |
| Số scene TRACE | 3-5, tối đa 6 | 4-6 | 6-8 |
| Ví dụ đời thường | không có | tùy chọn | bắt buộc |
| Kiến thức nền | tùy chọn | tùy chọn | bắt buộc |
| Recap nhanh | không có | bắt buộc | bắt buộc |
| `voice.speed` | 1.0 | 0.92 | 0.85 |
| Số ý mới mỗi scene | không giới hạn rõ | tối đa 2 | tối đa 1 |
| Tổng thời lượng | 4-8 phút | 6-9 phút | 8-12 phút |

## TRACE v4

Đọc tài liệu trace bằng đường dẫn tương đối trong folder skill:
- `traces/array-trace.md`
- `traces/linked-list-trace.md`
- `traces/tree-trace.md`
- `traces/stack-queue-trace.md`

Không hard-code `.agents/`, `.codex/`, hoặc `.claude/`.

Quy tắc:
- `chung`: được chọn khoảnh khắc đắt giá, không trace từng dòng.
- `cap2`/`cap3`: không bỏ bước biến đổi trạng thái, kể cả bước "chưa có gì đổi"; ghi lý do ngắn nếu chưa đổi.
- Ngoại lệ graph/tree/vòng lặp dài: minh họa đầy đủ 2-3 lượt đầu, sau đó được gom các lượt lặp giống hệt vào 1 scene tóm tắt.
- Với `cap2`/`cap3`, scene trace có so sánh hoặc gán phải mở đầu `voiceText` bằng câu hỏi dự đoán, sau đó mới đọc kết quả. Frame đầu chỉ `highlight` trong 1-1.5s; frame sau mới `compare`, `swap` hoặc `flash`.
- `frames[]` không có voice riêng; toàn bộ giọng đọc nằm ở `voiceText` cấp scene.
- Với `cap2`/`cap3`, thuật ngữ mới lần đầu xuất hiện phải được định nghĩa ngay trong cùng câu bằng một vế đời thường.
- Với `cap2`/`cap3`, scene độ phức tạp phải kèm ví dụ số cụ thể, không chỉ đọc ký hiệu Big-O.

## Self-check v5 (duration, kiểm trước v4)

- `duration = short`: tổng 4-7 scene, TRACE 2-3 scene, không có Kiến thức nền/Các bước tổng quan/Recap/So sánh/Tối ưu hóa/Ứng dụng thực tế, `voice.speed` 1.05, tổng thời lượng 20-60s.
- `duration = long`: tổng 20-30 scene, TRACE 8-12 scene, có So sánh + Tối ưu hóa, `voice.speed` theo audience (không vượt 0.85), tổng thời lượng 12-20 phút.
- `duration = standard` (mặc định): áp dụng nguyên self-check v4 bên dưới.
- Sinh `metadata.duration` (`"short"|"standard"|"long"`) trong script.json.

## Self-check v4 (áp dụng khi `duration = standard`)

- Tổng scene: `chung` 10-16, `cap3` 12-20, `cap2` 16-22.
- TRACE count: `chung` 3-5, `cap3` 4-6, `cap2` 6-8.
- `cap2` có Ví dụ đời thường trước code/khái niệm.
- `cap2`/`cap3` có Recap nhanh ngay sau TRACE.
- `voice.speed`: 1.0 `chung`, 0.92 `cap3`, 0.85 `cap2`.
- Sinh `metadata.audience` trong script.json.

# Create Programming Video Skill (v3 — trace kiểu Python Tutor)

Sinh video dạy lập trình 9:16 từ nội dung tutorial (thuật toán, data structure, C++, Python…).
Dùng bộ template **ChuyenTin** (`ct-*`) làm visual identity chủ đạo. Claude chỉ điền
**chữ vào slot** — toàn bộ thiết kế/animation do template lo.

**Khác biệt so với v2:** khối "Trace từng bước" được viết lại theo đúng tinh thần
[pythontutor.com](https://pythontutor.com) — mỗi bước hiển thị **đồng thời** dòng code
đang chạy + trạng thái biến + call stack (nếu có đệ quy), thay vì chỉ mô tả bằng lời.
Đây là kỹ thuật giúp người xem "nhìn thấy chương trình chạy trong đầu" thay vì học vẹt.

## Input

1 tham số: URL trang tutorial (`http://`/`https://`) HOẶC đường dẫn file `.txt`.

---

## Workflow (theo đúng thứ tự)

### Step 1–3: Lấy nội dung + tạo output dir

- **URL** → `WebFetch` với prompt:
    ```
    Trích xuất từ trang tutorial lập trình này:
    - title, concept, prerequisites (string[])
    - steps (string[])
    - code_snippet (string): đoạn code chính, rút gọn còn phần lõi
    - trace_input (string|null): 1 input cụ thể nhỏ dùng để trace (vd mảng [5,2,4,1], hoặc chuỗi/đệ quy nhỏ) — nếu bài không có, để null, Claude tự bịa ở Step 5.4
    - is_recursive (boolean): thuật toán có đệ quy/gọi hàm lồng không
    - complexity_time, complexity_space (string)
    - common_mistakes (string[]|null)
    - real_world_use (string|null)
    - optimization (string|null)
    - language, domain (string)
    Trả về JSON.
    ```
    Fail → bảo user lưu vào `.txt` rồi gọi lại. Stop.
- **File `.txt`** → `Read`, parse thủ công; field thiếu thì Claude tự suy ra từ kiến thức chung.
- slug ASCII không dấu ≤40 ký tự; timestamp `YYYYMMDD-HHmm`; `outputDir = output/<slug>-<timestamp>/`; `mkdir -p`.

---

### Step 4: Đọc danh mục template

Đọc `templates/CATALOG.md`. Chỉ dùng templateId có trong CATALOG.

**HOOK:** `ct-hook-hero`
**OUTRO:** `ct-outro`
**BODY (Sử dụng hoàn toàn các template ct-* mới dựng):**
- `ct-stat-card` — độ phức tạp
- `ct-list` — danh sách bước / kiến thức nền / lỗi thường gặp / **call stack**
- `ct-build-minimal` — 1 từ khoá chốt
- `ct-bold-poster` — nhận định mạnh / ứng dụng thực tế
- `ct-comparison` — so sánh naive vs optimized
- `ct-code-trace` — **mỗi bước trace (code vs biến dọc giống Python Tutor)**
- `ct-glitch-title` — tên hàm/section header
- `ct-voltage` — câu chốt

---

### Step 5: Lập cấu trúc video (10–16 scene)

```
[Hook]                → ct-hook-hero
[Kiến thức nền]        → ct-list                    (nếu cần)
[Giới thiệu]           → ct-build-minimal
[Khái niệm]            → ct-bold-poster
[Các bước] (tổng quan) → ct-list
```

Slot mapping cho các scene không đổi (Hook, Giới thiệu, Khái niệm, Các bước, Độ phức tạp,
So sánh, Tối ưu hóa, Tổng kết, Outro, Kiến thức nền, Lỗi thường gặp, Ứng dụng thực tế) —
xem "Slot mapping gốc" ở cuối file. Phần dưới đây tập trung vào khối TRACE.

---

### 5.3.5 Xác định data_structure_type (Bắt buộc)
Trước khi dựng khối TRACE, bạn cần đọc `code_snippet` để tự xác định cấu trúc dữ liệu chính đang được thao tác:
* **`array`**: Code thao tác trên mảng (vd: `arr[j]`, `int[]`, chỉ số liền kề).
* **`linked_list`**: Code định nghĩa/sử dụng node liên kết (vd: `struct Node`, `->next`, `.next`, con trỏ).
* **`tree`**: Code làm việc trên cấu trúc cây nhị phân (vd: `TreeNode*`, `left`/`right`, DFS/BFS trên cây).
* **`stack_queue`**: Đệ quy thuần cần mô phỏng call stack, hoặc thuật toán trên cấu trúc Ngăn xếp / Hàng đợi.
* **Không xác định**: Fallback về `array`.

---

### 5.3.6 Xác định algorithm_type (BẮT BUỘC)
Ngoài data_structure_type, bạn cần xác định chính xác loại thuật toán đang được giảng dạy.
Chọn một trong các giá trị sau cho `algorithm_type` (đặt trong `inputs` của scene trace):
- sorting
- binary_search
- linear_search
- recursion
- dynamic_programming
- greedy
- graph
- bfs
- dfs
- backtracking
- sliding_window
- two_pointer
- prefix_sum
- union_find
- heap
- trie
- string
- math
- bitmask
- hash
- queue_stack
- linked_list
- tree
- matrix
- simulation
- custom

Nếu không chắc chắn, hãy chọn `custom`.
Renderer sẽ dùng `algorithm_type` để quyết định cách sinh hoạt ảnh (animation).

---

### 5.3.7 Scene Render Metadata, Timeline & Variable Diff (BẮT BUỘC)
Mỗi scene trong mảng `scenes` của video đều phải sinh thêm các thông tin metadata và timeline chi tiết dưới đây để phục vụ cho bộ renderer tự động:

#### 1. Scene Render Metadata (camera, pointer, animations, transition)
Đặt trực tiếp ở cấp độ scene (cấp ngoài cùng của mỗi phần tử trong mảng `scenes`):
```json
{
  "camera": {
    "focus": "code",
    "zoom": 1.0
  },
  "pointer": {
    "type": "arrow",
    "target": "line3"
  },
  "animations": [
    "highlight",
    "compare"
  ],
  "transition": "fade"
}
```
* **`camera.focus`**: chỉ được chọn một trong: `code`, `variables`, `array`, `linked_list`, `tree`, `stack`, `queue`, `graph`, `console`.
* **`pointer.target`**: chuỗi định danh đối tượng cần trỏ tới (ví dụ: `line3` cho dòng code số 3, `variable_i` cho biến i, `node_0x1004` cho node liên kết, `array_index_2` cho phần tử mảng, `tree_node_left`, `stack_frame_0`).
* **`transition`**: chỉ được chọn một trong: `fade`, `slide`, `zoom`, `dissolve`.
* **`animations`**: mảng các từ khóa (keyword) chỉ định hoạt ảnh của scene. CHỈ dùng các từ khóa sau, tuyệt đối không viết mô tả tự nhiên:
  `"flash"`, `"compare"`, `"swap"`, `"fade"`, `"grow"`, `"slide"`, `"zoom"`, `"push"`, `"pop"`, `"highlight"`, `"pulse"`.

#### 2. Timeline Frames (`frames`)
Mỗi scene có thể chứa nhiều frame chuyển cảnh nhỏ hơn để mô tả chi tiết quá trình chạy từng bước. Sinh thêm trường `frames` ở cấp độ scene (không tạo quá 5 frame cho mỗi scene):
```json
"frames": [
  {
    "duration": 0.6,
    "active_line": 3,
    "animation": "highlight"
  },
  {
    "duration": 0.8,
    "animation": "compare"
  },
  {
    "duration": 0.8,
    "animation": "swap"
  }
]
```

#### 3. Variable Diff (`changed_variables`)
Mỗi khi biến thay đổi giá trị tại scene này so với scene trước đó, sinh thêm trường `changed_variables` ở cấp độ scene dưới dạng mảng:
```json
"changed_variables": [
  {
    "name": "i",
    "old": "2",
    "new": "3"
  }
]
```
Renderer sẽ tự động animate riêng phần thay đổi này.

---

---

#### 5.4 TRACE kiểu Python Tutor — QUAN TRỌNG NHẤT, làm kỹ

**Mục tiêu:** mô phỏng cách pythontutor.com dạy — mỗi bước hiển thị **cùng lúc** 3 thứ:
(1) dòng code đang chạy, (2) trạng thái biến tại thời điểm đó, (3) call stack/cấu trúc trực quan dữ liệu.

Đọc chi tiết schema JSON, ví dụ voiceText tiếng Việt và quy tắc đặc thù cho từng loại cấu trúc dữ liệu tại các file tài liệu tương ứng:
* **Array (`array`)**: Đọc file [array-trace.md](file:///.claude/skills/create-programming-video/traces/array-trace.md)
* **Linked List (`linked_list`)**: Đọc file [linked-list-trace.md](file:///.claude/skills/create-programming-video/traces/linked-list-trace.md)
* **Tree (`tree`)**: Đọc file [tree-trace.md](file:///.claude/skills/create-programming-video/traces/tree-trace.md)
* **Stack/Queue (`stack_queue`)**: Đọc file [stack-queue-trace.md](file:///.claude/skills/create-programming-video/traces/stack-queue-trace.md)

**Số scene trace:** 3–5 scene. Không vượt quá 6 — video ngắn, chọn khoảnh khắc đắt giá nhất, không trace từng dòng một. Bắt buộc phải giữ đầy đủ định nghĩa hàm ở dòng số 1 để người xem có ngữ cảnh tham số đầu vào.

---

### ⚠️ Quy tắc TTS tiếng Việt (BẮT BUỘC)

| Dạng | SAI | ĐÚNG |
|---|---|---|
| Big-O | `O(n²)` | `O của n bình phương` |
| Chỉ số mảng | `arr[j]` | `phần tử thứ j` |
| Gán giá trị | `j = 1` | `j bằng một` |
| Mảng cụ thể | `[5, 2, 4, 1]` | `năm, hai, bốn, một` |
| So sánh | `arr[j] > arr[j+1]` | `phần tử thứ j lớn hơn phần tử kế tiếp` |
| Tên hàm | `listSum()` | `hàm list sum` |

- `voiceText` KHÔNG emoji, KHÔNG ký hiệu code (`[`, `]`, `{`, `}`, `>`, `<`, `=`), KHÔNG URL.
- `inputs` (bullets code/biến hiển thị) ĐƯỢC giữ ký hiệu thật (`▶ if arr[j] > arr[j+1]:`,
  `j = 1`) vì đây là phần hiển thị trực quan, không phải giọng đọc.
- Mỗi scene trace ~15–25 từ voiceText (ngắn hơn scene thường vì hình đã nói nhiều rồi).

---

### Step 6: Tự kiểm tra script.json

- `scenes[0].type === "hook"`, cuối `=== "outro"`, tổng 10–16 scene.
- Có khối TRACE 3–5 scene (bắt buộc, đây là phần lõi của v3) — nếu thật sự không trace được (thuật toán quá trừu tượng, không có input cụ thể) thì ghi rõ lý do bỏ qua trong lúc tự kiểm tra, không im lặng bỏ.
- `data_structure_type` đã được xác định rõ và điền đầy đủ các trường tương ứng (ví dụ: `linked_list` phải điền `nodes[]`, không được nhầm lẫn sang `array_elements[]`).
- Trong khối TRACE, mảng `code_lines` phải chứa danh sách dòng mã nguồn GIỐNG HỆT nhau ở tất cả các scene. Chỉ thay đổi `active_line_num` để di chuyển highlight, tuyệt đối không cắt xén, tăng giảm hay thay đổi nội dung code giữa các bước của cùng một video.
- Mỗi `templateId` có trong CATALOG, mỗi `inputs` đủ slot bắt buộc.
- `voiceText` scene trace không chứa ký hiệu code (`[`,`]`,`{`,`}`,`>`,`<`,`=`,`▶`).
- Sửa thầm tối đa 2 lần nếu vi phạm.

---

### Step 7: Ghi script.json

```json
{
    "version": "1.0",
    "renderer": "hyperframes",
    "aspect": "9:16",
    "metadata": {
        "title": "<title>",
        "source": { "url": "<url hoặc local>", "domain": "<domain>", "image": null },
        "channel": "ChuyenTin",
        "audience": "<cap2|cap3|chung>",
        "duration": "<short|standard|long>"
    },
    "voice": { "provider": "omnivoice", "speed": 1.0 },
    "scenes": [ ... ]
}
```

Ghi vào `<outputDir>/script.json`.

### Step 8: Chạy pipeline

```bash
npm run pipeline -- <outputDir>/script.json
```

### Step 9: Báo kết quả

```markdown
✓ Video: [video.mp4](output/<slug>/video.mp4)
✓ Audio: [voice.mp3](output/<slug>/voice.mp3) — cho CapCut
✓ Script: [script.txt](output/<slug>/script.txt) — cho CapCut auto-caption
Tổng thời lượng: XX.Xs
```

---

## Slot mapping gốc (không đổi so với v2)

**Hook** (`ct-hook-hero`): kicker `"⚡ Lập trình · <lang>"`, headline (≤50 ký tự), subheadline (~20-30 từ), cta `"Học ngay →"`, brand `"ChuyenTin"`.

**Kiến thức nền** (`ct-list`): title `"Cần biết trước"`, accent = tên thuật toán, accent_from/to tông trung tính, subtitle `"Ôn lại nhanh trước khi vào bài"`, items 2-4 khái niệm (icon+title+desc+tag `"Cơ bản"`+level `"info"`).

**Giới thiệu** (`ct-build-minimal`): eyebrow `"THUẬT TOÁN · <lang>"`, hero (≤10 ký tự không emoji), desc (~15-20 từ), side_left `"ChuyenTin"`, side_right = language.

**Khái niệm** (`ct-bold-poster`): kicker `"Khái niệm cơ bản"`, date `"<lang> · 2026"`, figure (≤4 ký tự), headline (3 dòng ≤14 ký tự), standfirst (~30-40 từ), footer_left `"ChuyenTin"`, footer_right = domain.

**Các bước** (`ct-list`): title `"Cách thực hiện"`, accent = tên thuật toán, items 3-5 bước (tag `"B1"/"B2"...`, level `"info"`, bước cuối `"good"`).

**Độ phức tạp** (`ct-stat-card`): label `"Phân tích · Độ phức tạp"`, headline = complexity, subtitle (~20-30 từ), anchor (≤4 ký tự), footer_right `"Time Complexity"`.

**Lỗi thường gặp** (`ct-list`): title `"Lỗi hay gặp"`, accent_from/to tông cảnh báo đỏ/cam, items 2-3 lỗi (icon ⚠️/🚫, tag `"Lỗi"`, level `"danger"`).

**So sánh** (`ct-comparison`, nếu có optimization): badge `"Tối ưu hóa"`; left = bản cơ bản (xám, icon ⚠️, win false); right = bản tối ưu (màu tích cực, icon ✅, win true).

**Tối ưu hóa** (`ct-bold-poster`, nếu có optimization): kicker `"Cải tiến"`, figure `"v2"`/`"↑"`, headline 3 dòng, standfirst (~30-40 từ).

**Ứng dụng thực tế** (`ct-bold-poster` hoặc `ct-voltage`): kicker `"Ứng dụng thực tế"`, nêu 1-2 use-case thật.

**Tổng kết** (`ct-voltage`): meta `"// TAKEAWAY · <LANG>"`, display_lines 2-4 dòng, script 1 từ tiếng Anh, caption `"chuyentin.com · Lập trình mỗi ngày"`.

**Outro** (`ct-outro`): brand_name `"ChuyenTin"`, tagline phù hợp bài, primary_url `"chuyentin.com"`.

---

## Ghi chú

- Render mỗi scene ~10–15s. Video 10-16 scene ~2-4 phút — nếu cần short-form dưới 60s, chịu khó cắt [Kiến thức nền]/[Ứng dụng thực tế] trước, KHÔNG cắt khối TRACE (đây là phần cốt lõi giúp hiểu).
- Nếu bài toán đệ quy phức tạp hoặc cây/đồ thị, sử dụng đúng `data_structure_type` tương ứng ("tree" hoặc "stack_queue") để được vẽ trực quan tối đa thay vì chỉ hiển thị text chay.
- Nội dung tiếng Anh: dịch sang tiếng Việt cho voiceText, giữ tên hàm/biến gốc trong inputs.
- Với `duration = standard | long`: đọc [engagement-polish.md](references/engagement-polish.md) trước Step 7 — thêm scene "Thử thách nhỏ" trước Outro và chỉnh CTA outro theo `audience`.





