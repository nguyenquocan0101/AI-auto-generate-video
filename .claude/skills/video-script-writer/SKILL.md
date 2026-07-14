---
name: video-script-writer
description: Viết TOÀN BỘ lời thoại (voiceText) của một video dưới dạng văn bản thuần trước khi cắt thành scene/template — dùng khi wording/nhịp đọc quan trọng và user muốn duyệt lời thoại trước khi commit vào script.json (video tin tức nhạy cảm, video thuật toán khó, hoặc user đã từng phải sửa voiceText nhiều lần sau khi render). Trigger khi user nói "viết kịch bản trước", "duyệt lời thoại trước khi làm video", "script text trước đã", "chưa cắt scene vội". KHÔNG dùng cho video đơn giản/gấp — lúc đó `create-programming-video`/`create-template-video` tự viết voiceText trực tiếp trong lúc dựng scene. Output: script-draft.md (văn bản thuần, chưa map template).
---

# video-script-writer

Tách riêng "viết cái gì" khỏi "hiển thị thế nào". Viết full lời thoại tiếng Việt
trước, xin user duyệt, RỒI mới chuyển sang `create-programming-video`/
`create-template-video` để cắt thành scene và gán template.

**Vì sao tách:** sửa văn bản thuần rẻ; sửa lại sau khi đã cắt thành 12 scene JSON
kèm animation thì đắt. Nếu wording không quan trọng bằng tốc độ ra video, bỏ qua
skill này.

## Input

1. Chủ đề, hoặc `narrative-brief.md` từ `video-narrative-plan`, hoặc URL/file gốc.
2. `audience`/`duration` (kế thừa từ brief nếu có, không thì hỏi 1 câu như `video-narrative-plan` Bước 2).

## Workflow

### Bước 1 — Xác định mạch truyện

- **Entry angle**: câu hỏi, tình huống, hay thử thách mở đầu?
- **Ẩn dụ xuyên suốt** (nếu hợp chủ đề): 1 hình ảnh đời thường lặp lại xuyên video để neo trí nhớ.
- **Trật tự kiến thức nền**: liệt kê khái niệm nào phải hiểu trước khái niệm nào — không đảo thứ tự phụ thuộc.
- **Đường cong cảm xúc**: tò mò → hiểu → (nếu có) bất ngờ → hài lòng. Không bắt buộc mọi video phải có đủ 4 bước.

### Bước 2 — Viết FULL văn bản lời thoại

Viết **từng chữ sẽ được đọc** — không tóm tắt, không bullet placeholder.

- Áp dụng đúng bảng quy tắc TTS tiếng Việt đã định nghĩa trong `create-programming-video`/`create-template-video` (số viết ra chữ, không icon/ký hiệu code trong voiceText, câu kết bằng `.`/`?`).
- Đánh dấu nhịp nghỉ: `[.]` ngắn, `[..]` vừa, `[...]` dài, `[BEAT]` cho khoảnh khắc kịch tính.
- Đánh dấu nhấn bằng `**đậm**` cho từ cần nhấn giọng.
- Sau mỗi đoạn/chương, thêm 1-2 câu "Visual intent" mô tả người xem nên thấy gì — KHÔNG viết animation spec (frame, easing) ở bước này, đó là việc của bước cắt scene sau.

### Bước 3 — Tự review trước khi trình user

- Mỗi câu ≤ 20 từ (dài hơn thì tách câu).
- Thuật ngữ mới xuất hiện lần đầu → có định nghĩa đời thường ngay trong câu đó.
- Đoạn mở đầu là câu hỏi/tuyên bố mạnh, không phải câu giới thiệu chung chung ("Hôm nay chúng ta sẽ học...").
- Đoạn kết có 1 câu chốt hoặc 1 câu hỏi nhỏ cho người xem tự trả lời (không đọc đáp án).
- Nếu vi phạm, tự sửa tối đa 2 lần trước khi trình user.

### Bước 4 — Trình duyệt (gate bắt buộc)

Đưa toàn bộ script cho user xem qua tin nhắn hoặc file. **Không tự ý chuyển sang
dựng scene khi user chưa duyệt** — nếu user chỉ nói "ok tiếp tục" mà chưa đọc kỹ,
vẫn tính là duyệt hợp lệ.

### Bước 5 — Ghi file

Lưu vào `output/<slug>-<timestamp>/script-draft.md`:

```markdown
# Script draft: <tên chủ đề>

## Entry angle
<câu hỏi/tình huống mở đầu>

## Ẩn dụ xuyên suốt
<hình ảnh lặp lại, hoặc "không có">

## Lời thoại đầy đủ

### Đoạn 1 — <tên đoạn>
<toàn bộ voiceText của đoạn, có [.]/[..]/**đậm**>
Visual intent: <1-2 câu>

### Đoạn 2 — ...
```

### Bước 6 — Bàn giao

Báo: `✓ Script draft đã duyệt: script-draft.md — gọi create-programming-video (hoặc create-template-video) với file này để cắt thành scene và render.`

Không tự gọi tiếp skill dựng video trong cùng lượt trừ khi user yêu cầu rõ.
