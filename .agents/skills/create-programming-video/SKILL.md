---
name: create-programming-video
description: Tạo video dạy lập trình 9:16 dùng template HyperFrames ChuyenTin từ URL bài tutorial hoặc file .txt, có điều chỉnh nhịp độ/ngôn ngữ theo đối tượng học sinh cấp 2 hoặc cấp 3. Trigger khi user muốn tạo video dạy lập trình, giải thích thuật toán, tutorial code, "tạo video lập trình", "làm video thuật toán", "video dạy code", "video giáo dục lập trình", đặc biệt khi có nhắc tới học sinh, cấp 2, cấp 3, THCS, THPT. Output: video.mp4 + voice.mp3 + script.txt cho CapCut.
---

# Create Programming Video Skill (v4 — chậm lại, dễ hiểu cho học sinh cấp 2/cấp 3)

Sinh video dạy lập trình 9:16 từ nội dung tutorial (thuật toán, data structure, C++, Python…).
Dùng bộ template **ChuyenTin** (`ct-*`) làm visual identity chủ đạo. Claude chỉ điền
**chữ vào slot** — toàn bộ thiết kế/animation do template lo.

v4 kế thừa **toàn bộ** khía cạnh kỹ thuật của v3 (trace kiểu Python Tutor): schema JSON, quy tắc TTS gốc, `data_structure_type`, `algorithm_type`, Scene Render Metadata, Timeline Frames, Variable Diff, bộ template CATALOG (`ct-*`). v4 chỉ thêm **lớp sư phạm** lên trên: chậm nhịp, thêm ví dụ đời thường trước khi vào code, thêm nhịp "dự đoán trước khi xem đáp án", và tách rõ độ khó theo cấp 2 (lớp 6-9, ~11-15 tuổi) / cấp 3 (lớp 10-12, ~15-18 tuổi).

**Vì sao đổi:** v3 tối ưu cho tốc độ xem (short-form, giả định người xem đã biết code). Học sinh mới học lập trình cần thêm 4 thứ mà v3 không bắt buộc:
1. Thời gian tiêu hoá mỗi ý trước khi ý mới xuất hiện.
2. Hình ảnh đời thường neo vào trước khi gặp ký hiệu trừu tượng.
3. Được "thử đoán" thay vì chỉ xem thụ động.
4. Thuật ngữ mới phải được định nghĩa ngay lúc xuất hiện, không giả định đã biết.

---

## Input

2 tham số:
1. URL trang tutorial (`http://`/`https://`) HOẶC đường dẫn file `.txt` (bắt buộc).
2. `audience` (tuỳ chọn): `"cap2"` | `"cap3"`.
   - Nếu user không nói rõ, **suy luận từ độ khó chủ đề**: thuật toán cơ bản (sắp xếp, tìm kiếm tuyến tính, mảng, vòng lặp) → mặc định `cap2`. CTDL/thuật toán nâng cao (đệ quy nhiều lớp, cây, đồ thị, quy hoạch động) → mặc định `cap3`.
   - Nếu vẫn mơ hồ (vd chủ đề trung tính như "vòng lặp for"), hỏi đúng 1 câu: *"Video này cho học sinh cấp 2 hay cấp 3?"* — không suy diễn thêm, không hỏi thêm câu khác cùng lúc.

`audience` quyết định: tốc độ giọng đọc, mật độ thuật ngữ, số scene TRACE, việc bắt buộc scene "Ví dụ đời thường" và "Kiến thức nền".

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

### Step 5: Lập cấu trúc video (10–18 scene)

Cấu trúc phân cảnh được tối ưu hóa như sau:

```
[Hook]                    → ct-hook-hero
[Ví dụ đời thường]  MỚI   → ct-build-minimal   (BẮT BUỘC nếu cap2, khuyến khích nếu cap3)
[Kiến thức nền]           → ct-list             (BẮT BUỘC nếu cap2; v3 để tuỳ chọn cho mọi audience)
[Giới thiệu]              → ct-build-minimal
[Khái niệm]               → ct-bold-poster
[Các bước] (tổng quan)    → ct-list
[TRACE]                   → ct-code-trace × N   (xem mục TRACE & nhịp dự đoán)
[Recap nhanh]      MỚI    → ct-list
[Độ phức tạp]             → ct-stat-card        (kèm ví dụ số cụ thể)
[Lỗi thường gặp]          → ct-list             (nếu có)
[So sánh]                 → ct-comparison       (nếu có bản naive/optimized)
[Tối ưu hoá]              → ct-bold-poster      (nếu có)
[Ứng dụng thực tế]        → ct-bold-poster hoặc ct-voltage
[Tổng kết]                → ct-voltage
[Outro]                   → ct-outro
```

#### Chi tiết 2 khối mới thêm:

1. **Ví dụ đời thường** (tái dùng template `ct-build-minimal`):
   - `eyebrow`: `"Trước khi vào code..."`
   - `hero`: 1 hình ảnh/tình huống quen thuộc, ≤10 ký tự (vd `"Xếp hàng"`, `"Tìm sách"`, `"Đi tìm chìa khoá"`)
   - `desc` (~20-25 từ): mô tả tình huống đời thường ánh xạ đúng với logic thuật toán, **không nhắc code/ký hiệu**. Vd bubble sort → *"Giống như xếp học sinh theo chiều cao: so hai bạn đứng cạnh nhau, ai thấp hơn thì đổi chỗ lên trước."*
   - Mục đích: học sinh hình dung LOGIC trước khi thấy SYNTAX.

2. **Recap nhanh** (tái dùng template `ct-list`, đặt ngay sau khối TRACE, trước "Độ phức tạp"):
   - `title`: `"Tóm lại vừa xảy ra gì?"`
   - `items`: liệt kê lại từng bước TRACE vừa xem bằng đúng 1 câu cực ngắn mỗi bước — không diễn giải mới, chỉ "đọc lại nhật ký" để củng cố trí nhớ ngắn hạn.

---

### Nhịp độ (pacing)

| Chỉ số | v3 mặc định | v4 — cap3 | v4 — cap2 |
|---|---|---|---|
| Thời lượng/scene thường | 15-20s | 18-22s | 22-28s |
| Số scene TRACE | 3-5 (tối đa 6) | 4-6 | 6-8 |
| `voice.speed` trong script.json | 1.0 | 0.92 | 0.85 |
| Số ý mới/scene | không giới hạn rõ | tối đa 2 | tối đa 1 |
| Tổng thời lượng video | 4-8 phút | 6-9 phút | 8-12 phút |

**Quy tắc "1 ý/scene" (bắt buộc cap2, khuyến khích cap3):** nếu một scene đang định nói cả "biến `i` tăng lên" và "vì sao nó tăng", tách thành 2 scene. Học sinh nhỏ tuổi mất dấu ngay khi có nhiều ý xuất hiện đồng thời trên màn hình 9:16.

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

### TRACE kiểu Python Tutor & Nhịp dự đoán

Đọc chi tiết schema JSON, ví dụ voiceText tiếng Việt và quy tắc đặc thù cho từng loại cấu trúc dữ liệu tại các file tài liệu tương ứng:
* **Array (`array`)**: Đọc file [array-trace.md](file:///.agents/skills/create-programming-video/traces/array-trace.md)
* **Linked List (`linked_list`)**: Đọc file [linked-list-trace.md](file:///.agents/skills/create-programming-video/traces/linked-list-trace.md)
* **Tree (`tree`)**: Đọc file [tree-trace.md](file:///.agents/skills/create-programming-video/traces/tree-trace.md)
* **Stack/Queue (`stack_queue`)**: Đọc file [stack-queue-trace.md](file:///.agents/skills/create-programming-video/traces/stack-queue-trace.md)

#### 3 Quy tắc sư phạm mới cho khối TRACE:

1. **Không bỏ bước**: Không nhảy cóc các bước trung gian của thuật toán. Trace liên tục, kể cả bước "chưa có gì thay đổi" (ghi chú ngắn lý do chưa đổi thay vì bỏ qua scene đó).
2. **Dự đoán trước khi lộ kết quả** (bắt buộc ở mọi scene TRACE có phép so sánh hoặc gán giá trị): Thêm 1 frame đầu trong `frames[]` chỉ có `animation: "highlight"` kèm voiceText dạng câu hỏi, vd *"Trước khi xem đáp án, thử đoán: phần tử này có lớn hơn phần tử kế bên không?"* — cách 1-1.5s mới tới frame tiếp theo có `animation: "compare"` rồi `"swap"`/`"flash"` lộ kết quả. Không cần template overlay riêng.
3. **Định nghĩa thuật ngữ ngay lúc xuất hiện lần đầu**: Lần đầu voiceText nhắc một từ kỹ thuật (con trỏ, đệ quy, ngăn xếp, chỉ số...), phải giải thích trong cùng câu bằng một vế đồng nghĩa đời thường. Vd: *"con trỏ `next` — tức là mũi tên chỉ sang phần tử kế tiếp"*.

---

### Độ phức tạp (Big-O) — ví dụ số cụ thể

Không dạy công thức trần trụi. Bắt buộc thêm ví dụ số cụ thể, gắn lại với tình huống đã dựng ở scene "Ví dụ đời thường":
- Vd: *"Nếu lớp có 10 bạn, so sánh mất khoảng 100 lượt. Nếu lớp tăng lên 20 bạn — gấp đôi — số lượt so sánh không tăng gấp đôi mà tăng gấp BỐN, vì đây là độ phức tạp bậc hai."*
- **cap2**: vẫn tuân quy tắc v3 (không đọc ký hiệu `O(...)`), nhưng bắt buộc thêm ví dụ đếm tay cụ thể.
- **cap3**: có thể nói tên "độ phức tạp bậc hai" (đọc chữ, không đọc ký hiệu) nhưng vẫn phải kèm ví dụ số cụ thể.

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
- `inputs` (bullets code/biến hiển thị) ĐƯỢC giữ ký hiệu thật (`▶ if arr[j] > arr[j+1]:`, `j = 1`) vì đây là phần hiển thị trực quan, không phải giọng đọc.

#### Quy tắc ngôn ngữ mở rộng (bổ sung):

| Tình huống | cap2 | cap3 |
|---|---|---|
| Thuật ngữ mới xuất hiện | Định nghĩa bằng ví dụ đời thường ngay trong câu | Định nghĩa ngắn gọn 1 vế, có thể dùng từ chuẩn kèm chú thích |
| Câu dài, nhiều mệnh đề phụ | Tách thành 2 câu ngắn | Giữ 1 câu nếu ≤ 20 từ |
| Số liệu / độ phức tạp | Luôn kèm ví dụ đếm tay cụ thể | Kèm ví dụ, có thể ngắn hơn |
| Tên tiếng Anh (function, node...) | Đọc kèm nghĩa tiếng Việt lần đầu, sau đó dùng tên gốc | Dùng tên gốc, không cần lặp nghĩa mỗi lần |

---

### Step 6: Tự kiểm tra script.json

- [ ] `scenes[0].type === "hook"`, cuối `=== "outro"`, tổng 10–18 scene.
- [ ] Có scene "Ví dụ đời thường" trước Khái niệm/code (bắt buộc nếu `audience = cap2`).
- [ ] Có scene "Recap nhanh" ngay sau khối TRACE.
- [ ] Không scene TRACE nào "nhảy cóc" bỏ bước trung gian.
- [ ] Mỗi scene TRACE có so sánh/gán đều có nhịp dự đoán trước khi lộ kết quả.
- [ ] Thuật ngữ mới lần đầu xuất hiện đều có giải thích đồng nghĩa ngay trong câu (theo bảng quy tắc ngôn ngữ mở rộng).
- [ ] `voice.speed` trong script.json khớp bảng pacing (0.85 cap2 / 0.92 cap3).
- [ ] Không scene nào chứa quá 1 ý mới (cap2) / quá 2 ý mới (cap3).
- [ ] `data_structure_type` đã được xác định rõ và điền đầy đủ các trường tương ứng (ví dụ: `linked_list` phải điền `nodes[]`, không được nhầm lẫn sang `array_elements[]`).
- [ ] Trong khối TRACE, mảng `code_lines` phải chứa danh sách dòng mã nguồn GIỐNG HỆT nhau ở tất cả các scene. Chỉ thay đổi `active_line_num` để di chuyển highlight.
- [ ] Mỗi `templateId` có trong CATALOG, mỗi `inputs` đủ slot bắt buộc.
- [ ] `voiceText` scene trace không chứa ký hiệu code (`[`,`]`,`{`,`}`,`>`,`<`,`=`,`▶`).
- [ ] Sửa thầm tối đa 2 lần nếu vi phạm.

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
        "channel": "ChuyenTin"
    },
    "voice": { 
        "provider": "omnivoice", 
        "speed": 0.85, 
        "instruct": "young adult, male" 
    },
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

## Slot mapping gốc

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

- Render mỗi scene ~15–20s. Video 10-18 scene ~6-12 phút.
- Nếu bài toán đệ quy phức tạp hoặc cây/đồ thị, sử dụng đúng `data_structure_type` tương ứng ("tree" hoặc "stack_queue") để được vẽ trực quan tối đa thay vì chỉ hiển thị text chay.
- Nội dung tiếng Anh: dịch sang tiếng Việt cho voiceText, giữ tên hàm/biến gốc trong inputs.
