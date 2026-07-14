# Kế hoạch: Xây dựng & mở rộng `ct-code-trace` + tái cấu trúc skill `create-programming-video`

## Bối cảnh (đọc trước khi giao việc)

Skill `create-programming-video` (v3) đã viết đầy đủ **spec sử dụng** template
`ct-code-trace` (badge, code_lines, active_line_num, array_elements, highlight_indices,
swap_indices, pointers, variables, status, step_index, total_steps) — nhưng cuối file
skill lại ghi rõ trong mục "Đề xuất template lý tưởng (chưa có, cần tự code — backlog)"
rằng việc code component này **nằm ngoài khả năng của skill, cần code React/animation
thật trong pipeline HyperFrames**.

→ Đây là mâu thuẫn: skill đang giả định `ct-code-trace` đã tồn tại trong CATALOG,
nhưng thực tế backlog nói chưa build. Việc đầu tiên cần làm là **xác nhận trạng thái
thật** rồi mới triển khai đúng hướng.

Ngoài ra, schema hiện tại (`array_elements`, `swap_indices`, `pointers`) chỉ phù hợp
cho thuật toán trên **mảng** (sort, search). Cần mở rộng để dùng được cho linked list,
tree/graph, stack/queue — vì skill sẽ được dùng cho nhiều dạng bài giảng DSA khác nhau,
không chỉ sort.

---

## Mục tiêu cuối cùng

1. `ct-code-trace` là 1 component thật, render được trong HyperFrames renderer, nhận
   input JSON và hiển thị: code panel (highlight dòng active) + strip trực quan dữ liệu
   (mảng/linked-list/tree/stack tuỳ loại) + panel biến — giống trải nghiệm pythontutor.com.
2. Component hỗ trợ tối thiểu 4 kiểu cấu trúc dữ liệu: `array`, `linked_list`, `tree`,
   `stack_queue` (generic fallback cho các case còn lại).
3. Skill `create-programming-video` được cập nhật để tự chọn đúng schema trace theo
   loại cấu trúc dữ liệu phát hiện được từ code, và không còn mâu thuẫn nội dung.
4. Có ít nhất 3 script.json mẫu (1 sort mảng, 1 linked list, 1 tree/recursion) chạy
   qua `npm run pipeline` ra video thật để verify.

---

## Phase 0 — Xác nhận trạng thái hiện tại (bắt buộc làm trước, ~30 phút)

- [ ] Kiểm tra `templates/CATALOG.md` — `ct-code-trace` có được liệt kê không?
- [ ] Kiểm tra source code renderer HyperFrames (thư mục components/templates) —
      có file nào tên `ct-code-trace.*` (jsx/tsx) không, hay chỉ có placeholder?
- [ ] Nếu **đã có component thật**: bỏ qua Phase 1, đi thẳng Phase 2 (mở rộng schema).
- [ ] Nếu **chưa có** (chỉ là spec/backlog): thực hiện Phase 1 (build từ đầu).
- [ ] Báo cáo lại kết quả xác nhận trước khi code tiếp — đừng giả định rồi code nhầm hướng.

---

## Phase 1 — Build component `ct-code-trace` (nếu chưa tồn tại)

### 1.1 Cấu trúc layout (canvas 9:16, dựa theo mô tả skill)

```
┌─────────────────────────┐
│   BADGE (Bước N · Dòng X)│
├─────────────────────────┤
│                         │
│   CODE PANEL (cố định)  │  ← toàn bộ code_lines, dòng active_line_num
│   - highlight dòng active│    có background màu khác + con trỏ ▶
│                         │
├─────────────────────────┤
│   DATA VISUAL STRIP     │  ← thay đổi theo data_structure_type (xem Phase 2)
│   (array/list/tree...)  │
├─────────────────────────┤
│   VARIABLES PANEL       │  ← danh sách variables[], value đổi màu nếu changed=true
├─────────────────────────┤
│   STATUS CAPTION        │  ← status text, 1 dòng
└─────────────────────────┘
```

### 1.2 Props/JSON schema (bản cho `array`, đã có sẵn trong skill — dùng làm baseline)

```json
{
  "templateId": "ct-code-trace",
  "data_structure_type": "array",
  "badge": "BƯỚC 1 · DÒNG 1",
  "code_lines": [
    { "line_num": 1, "code": "void bubbleSort(int arr[], int n) {" },
    { "line_num": 2, "code": "  for (int i = 0; i < n-1; i++) {" }
  ],
  "active_line_num": 1,
  "array_elements": [5, 3, 8, 4, 2],
  "highlight_indices": [0, 1],
  "swap_indices": [],
  "pointers": { "0": "j", "1": "j+1" },
  "variables": [
    { "name": "j", "value": "1", "old_value": "0", "changed": true }
  ],
  "status": "Khai báo hàm bubbleSort với n=5",
  "step_index": 1,
  "total_steps": 5
}
```

### 1.3 Animation yêu cầu tối thiểu

- Highlight dòng code: transition màu nền mượt (~200ms) khi `active_line_num` đổi.
- Ô mảng tại `swap_indices`: animation hoán đổi vị trí (swap transform, không chỉ đổi màu).
- Ô mảng tại `highlight_indices`: viền/glow khác màu so với ô thường.
- Biến có `changed: true`: value pulse màu (vd vàng nhạt) trong ~500ms rồi về màu thường.
- Pointer label (`pointers`): mũi tên nhỏ hoặc label text nằm dưới ô mảng tương ứng.

### 1.4 Tech stack — làm theo đúng convention hiện có

- Xem 1 template `ct-*` bất kỳ đã có sẵn trong renderer (vd `ct-list`, `ct-stat-card`)
  để bám đúng convention: cách khai báo component, cách nhận props, cách style
  (CSS variables theo theme ChuyenTin), cách đăng ký vào CATALOG.
- Đăng ký `ct-code-trace` vào `templates/CATALOG.md` sau khi code xong.

---

## Phase 2 — Mở rộng cho nhiều loại cấu trúc dữ liệu

Thêm field `data_structure_type` để component biết render vùng "DATA VISUAL STRIP"
theo layout nào. Giữ chung code panel + variables panel + status (không đổi).

### 2.1 `data_structure_type: "array"` — đã có ở Phase 1, giữ nguyên.

### 2.2 `data_structure_type: "linked_list"`

```json
{
  "data_structure_type": "linked_list",
  "nodes": [
    { "id": "n1", "value": 5, "next": "n2" },
    { "id": "n2", "value": 3, "next": "n3" },
    { "id": "n3", "value": 8, "next": null }
  ],
  "current_pointer": { "node_id": "n2", "label": "curr" },
  "highlight_node_ids": ["n2"],
  "changed_link_from": null,
  "changed_link_to": null
}
```
- Render: các node hình hộp nối bằng mũi tên `→`, node cuối có `next: null` vẽ gạch chéo/Ø.
- `current_pointer`: mũi tên từ trên rơi xuống node, label tên biến con trỏ.
- Nếu thao tác là nối/xoá link: `changed_link_from`/`changed_link_to` để animate mũi tên
  mới xuất hiện (dùng cho bài "chèn node", "xoá node", "đảo ngược linked list").

### 2.3 `data_structure_type: "tree"` (bao gồm cả trace đệ quy trên cây)

```json
{
  "data_structure_type": "tree",
  "tree_nodes": [
    { "id": "root", "value": 10, "parent": null },
    { "id": "l1", "value": 5, "parent": "root" },
    { "id": "r1", "value": 15, "parent": "root" }
  ],
  "visited_ids": ["root"],
  "current_id": "l1",
  "traversal_order": ["root"]
}
```
- Render: cây phân cấp từ trên xuống (root ở trên), node `current_id` highlight đậm,
  `visited_ids` mờ dần hoặc đổi màu nền nhạt, số thứ tự duyệt nhỏ ở góc mỗi node
  theo `traversal_order`.
- Với bài DFS/BFS: `traversal_order` giúp hiện số thứ tự "đã thăm thứ mấy" trên node.

### 2.4 `data_structure_type: "stack_queue"` (fallback chung, cũng dùng cho call stack đơn giản)

```json
{
  "data_structure_type": "stack_queue",
  "container_type": "stack",
  "elements": [
    { "value": "listSum([2,3])", "id": "f1" },
    { "value": "listSum([3])", "id": "f2" }
  ],
  "top_or_front_id": "f2",
  "just_pushed_id": "f2",
  "just_popped_id": null
}
```
- `container_type: "stack"` → vẽ chồng dọc, top ở trên; `"queue"` → vẽ ngang, front bên trái.
- `just_pushed_id`/`just_popped_id`: animation phần tử trượt vào/ra.
- Đây cũng là lựa chọn thay thế nhẹ hơn cho scene "Ngăn xếp gọi hàm" hiện đang dùng
  `ct-list` — cân nhắc dùng `ct-code-trace` với `stack_queue` để đồng bộ visual style
  với các scene trace khác, thay vì tách riêng `ct-list`. **Quyết định này để tuỳ người
  thực hiện** — nếu `ct-list` đã đủ đẹp và dễ maintain hơn thì giữ nguyên, không bắt buộc đổi.

### 2.5 Validation logic cần thêm vào component

- Nếu `data_structure_type` không khớp field nào có mặt (vd truyền `array` nhưng thiếu
  `array_elements`) → component nên render fallback rõ ràng (vd khung báo lỗi nhỏ, không
  crash toàn bộ pipeline render).

---

## Phase 3 — Cập nhật skill `create-programming-video`

### 3.1 Xoá mâu thuẫn nội dung

- Xoá hẳn mục "Đề xuất template lý tưởng (chưa có, cần tự code — backlog)" ở cuối file
  SKILL.md sau khi Phase 1 hoàn thành (component đã thật, không còn là backlog).

### 3.2 Thêm bước "5.3.5 — Xác định data_structure_type" vào Step 5, trước mục 5.4

Logic detect (Claude tự suy luận khi đọc `code_snippet`, không cần code cứng):
- Có `arr[]`, `int[]`, thao tác index/so sánh liền kề → `array`
- Có `struct Node`, `->next`, `.next`, con trỏ nối tiếp → `linked_list`
- Có `struct TreeNode`, `left`/`right`, hoặc đề cập "cây", "duyệt cây", BFS/DFS trên đồ thị → `tree`
- Đệ quy thuần không thao tác cấu trúc trực quan (vd tính giai thừa, Fibonacci) hoặc
  cần mô phỏng ngăn xếp lời gọi → `stack_queue`
- Không rõ / không khớp case nào → fallback `array` với dữ liệu tự bịa đơn giản, hoặc
  bỏ qua khối trace và ghi rõ lý do (đã có quy tắc này ở Step 6).

### 3.3 Tách phần schema chi tiết ra file riêng (giữ SKILL.md gọn)

Cấu trúc thư mục đề xuất:
```
create-programming-video/
  SKILL.md                    (giữ pipeline 9 bước + bước 5.3.5 mới, KHÔNG nhúng full schema)
  traces/
    array-trace.md            (schema + ví dụ đầy đủ, hiện đang nằm trong SKILL.md)
    linked-list-trace.md       (schema Phase 2.2 + ví dụ voiceText mẫu)
    tree-trace.md              (schema Phase 2.3 + ví dụ)
    stack-queue-trace.md        (schema Phase 2.4 + ví dụ, bao gồm cả case call stack đệ quy)
```
Trong SKILL.md, mục 5.4 chỉ cần 1 đoạn ngắn: "Đọc file `traces/<type>-trace.md` tương
ứng với `data_structure_type` đã xác định ở bước 5.3.5, làm theo schema trong đó."

### 3.4 Cập nhật Step 6 (tự kiểm tra) — thêm dòng kiểm tra mới

- [ ] `data_structure_type` đã được xác định và các field bắt buộc tương ứng đầy đủ
      (vd nếu `linked_list` thì phải có `nodes[]`, không được sót `array_elements` của
      schema array).

---

## Phase 4 — Test end-to-end

Tạo 3 file test riêng, chạy `npm run pipeline` cho từng cái, xem video render đúng:

1. **Bubble sort** (data_structure_type: array) — dùng ví dụ có sẵn trong skill hiện tại.
2. **Đảo ngược linked list hoặc chèn node** (data_structure_type: linked_list).
3. **Duyệt cây nhị phân (in-order/DFS) hoặc đệ quy listSum** (data_structure_type: tree
   hoặc stack_queue, kèm scene call stack nếu đệ quy).

Tiêu chí pass:
- Video render không lỗi, đúng 9:16.
- Animation highlight dòng code + thay đổi biến hiển thị đúng thời điểm.
- Voice tiếng Việt không đọc ký hiệu code (kiểm tra lại quy tắc TTS trong SKILL.md).

---

## Prompt bàn giao (copy nguyên văn để gửi cho người/AI thực hiện)

```
Bạn sẽ làm việc trên dự án ChuyenTin — pipeline tạo video dạy lập trình dùng renderer
HyperFrames. Nhiệm vụ của bạn được chia làm 4 phase, PHẢI làm tuần tự, không được nhảy
cóc sang Phase sau nếu Phase trước chưa xong và chưa được xác nhận.

PHASE 0 — Xác nhận trạng thái (bắt buộc, làm đầu tiên):
Kiểm tra xem template "ct-code-trace" đã tồn tại thật trong renderer chưa (tìm trong
templates/CATALOG.md và source code component). Báo cáo lại: đã có hay chưa có, kèm
đường dẫn file nếu có. KHÔNG code gì thêm cho tới khi tôi xác nhận đã đọc báo cáo này.

PHASE 1 — Build component ct-code-trace (chỉ làm nếu Phase 0 xác nhận CHƯA có):
Build 1 component mới theo đúng convention code của các template ct-* đã có sẵn trong
renderer (bám theo cách 1 template như ct-list hoặc ct-stat-card đang được viết, dùng
cùng hệ thống theme/CSS variables). Layout gồm 4 vùng dọc: badge → code panel (highlight
dòng active) → data visual strip → variables panel → status caption. Input JSON schema
baseline (cho trường hợp array) là:

[dán nguyên JSON ở mục 1.2 phía trên]

Animation bắt buộc: highlight dòng code mượt khi active_line_num đổi, animation swap
cho array_elements tại swap_indices, pulse màu cho variables có changed=true. Đăng ký
component vào CATALOG.md sau khi xong.

PHASE 2 — Mở rộng đa cấu trúc dữ liệu:
Thêm field "data_structure_type" vào input, hỗ trợ thêm 3 loại ngoài "array":
"linked_list", "tree", "stack_queue". Với mỗi loại, vùng "data visual strip" render
khác nhau theo schema dưới đây (code panel/variables/status giữ nguyên logic cũ):

[dán nguyên 3 JSON schema ở mục 2.2, 2.3, 2.4 phía trên]

Thêm validation: nếu thiếu field bắt buộc theo data_structure_type, component render
1 khung báo lỗi nhỏ thay vì crash toàn bộ trang.

PHASE 3 — Cập nhật skill create-programming-video:
File skill đang ở [ĐIỀN ĐƯỜNG DẪN SKILL.md THẬT]. Làm các việc sau:
a) Xoá mục "Đề xuất template lý tưởng (chưa có, cần tự code — backlog)" ở cuối file.
b) Thêm bước mới "5.3.5 — Xác định data_structure_type" ngay trước mục 5.4 hiện tại,
   với logic detect dựa vào code_snippet (chi tiết logic detect nằm ở mục 3.2 kế hoạch
   gốc — dán vào đây nếu người thực hiện không có file kế hoạch gốc).
c) Tách nội dung schema trace hiện tại (đang nhúng nguyên trong SKILL.md mục 5.4) ra
   4 file riêng trong thư mục con "traces/": array-trace.md, linked-list-trace.md,
   tree-trace.md, stack-queue-trace.md. Mỗi file chứa schema JSON + 1 ví dụ voiceText
   mẫu tiếng Việt tuân đúng quy tắc TTS đã có trong SKILL.md (không dùng ký hiệu code,
   không đọc chỉ số mảng trực tiếp, v.v.).
d) Trong SKILL.md, thay nội dung mục 5.4 cũ bằng 1 đoạn ngắn trỏ tới file traces/ tương
   ứng, không nhúng lại toàn bộ schema.
e) Thêm 1 dòng kiểm tra mới vào Step 6 (tự kiểm tra script.json): xác nhận
   data_structure_type đã xác định và field bắt buộc tương ứng đầy đủ, không lẫn field
   của schema khác.

PHASE 4 — Test:
Viết và chạy qua "npm run pipeline" 3 file script.json mẫu:
1. Bubble sort (array)
2. Chèn hoặc đảo ngược linked list (linked_list)
3. Duyệt cây nhị phân hoặc đệ quy tính tổng danh sách (tree hoặc stack_queue, có scene
   call stack nếu đệ quy)
Xác nhận: video render ra đúng 9:16, animation đúng, voice tiếng Việt không đọc ký hiệu
code. Báo cáo kết quả kèm đường dẫn video mẫu.

Sau mỗi Phase, dừng lại báo cáo trước khi sang Phase tiếp theo.
```

---

## Ghi chú cho bạn (người giao việc)

- Điền đường dẫn thật vào `[ĐIỀN ĐƯỜNG DẪN SKILL.md THẬT]` và đường dẫn renderer/CATALOG
  trước khi gửi prompt đi — người thực hiện (nhất là AI agent) cần path cụ thể, không suy đoán.
- Nếu người thực hiện là Claude Code, nên bảo họ đọc trực tiếp 1-2 file `ct-*.jsx` có sẵn
  trước khi code, để bám đúng convention thay vì tự nghĩ ra cấu trúc mới.
- Quyết định ở mục 2.4 (có gộp call stack vào `ct-code-trace` hay giữ `ct-list` riêng)
  nên để người thực hiện quyết dựa trên độ phức tạp thực tế khi code, không cần chốt cứng trước.