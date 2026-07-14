---
name: video-narrative-plan
description: Research một chủ đề (lập trình, thuật toán, hoặc tin tức) để tìm khoảnh khắc "aha", ngộ nhận phổ biến và hook mở đầu mạnh nhất, TRƯỚC KHI dựng script.json — dùng khi user còn mơ hồ về chủ đề/góc nhìn, chưa chốt audience/độ dài. Trigger khi user nói "chưa biết làm video này từ góc nào", "tìm hook cho video", "research chủ đề này trước", "video này nói gì hay", "lên ý tưởng video thuật toán/tin tức". KHÔNG dùng khi user đã có URL/file rõ ràng và chỉ muốn ra video ngay — lúc đó gọi thẳng `create-programming-video`/`create-template-video`. Output: narrative-brief.md.
---

# video-narrative-plan

Nghiên cứu tìm góc nhìn hay nhất cho một video, TRƯỚC bước dựng scene. Không sinh
`script.json`, không gọi renderer — chỉ ra một bản brief ngắn để
`create-programming-video` hoặc `create-template-video` dùng làm input.

**Ranh giới:** nếu user đã đưa URL/file rõ ràng và không cần bàn góc nhìn, đừng chạy
skill này — chuyển thẳng sang skill dựng video. Skill này chỉ có giá trị khi chủ đề
còn mơ hồ hoặc user muốn video "hay hơn mức tự nhiên".

## Workflow

### Bước 1 — Research nhanh (≤3 lượt tra cứu)

Dùng `WebSearch`/`WebFetch` nếu chủ đề cần kiểm chứng thêm ngoài tài liệu user đưa. Tìm đúng 3 thứ:

1. **Aha moment**: 1 insight khiến người xem thốt lên "à, ra là vậy" — không phải định nghĩa sách giáo khoa.
2. **Ngộ nhận phổ biến**: 1 điều người học hay hiểu sai về chủ đề này (nếu có).
3. **Câu hỏi mở đầu**: 1 câu hỏi/mâu thuẫn khiến người xem tò mò muốn xem tiếp — không trả lời ngay trong hook.

Nếu research không ra gì mới so với nội dung gốc, nói thẳng "không tìm thêm được insight nào ngoài tài liệu gốc" — đừng bịa để có đủ 3 mục.

### Bước 2 — Chốt audience + duration (nếu chưa rõ)

Dùng `AskUserQuestion`, tối đa 1 câu hỏi, hỏi cả 2 tham số cùng lúc (không hỏi 2 lượt riêng):
- `audience`: `cap2 | cap3 | chung` (dùng đúng định nghĩa trong `create-programming-video` v4).
- `duration`: `short | standard | long` (dùng đúng định nghĩa trong `create-programming-video` v5).

Nếu ngữ cảnh trước đó trong hội thoại đã cho biết 1 trong 2, không hỏi lại — chỉ hỏi phần còn thiếu.

### Bước 3 — Viết narrative-brief.md

```markdown
# Narrative brief: <tên chủ đề>

## Hook
<câu hỏi/mâu thuẫn mở đầu — 1 câu, không giải đáp>

## Aha moment
<insight cốt lõi — 1-2 câu>

## Ngộ nhận cần phá (nếu có)
<1 câu, hoặc "không có">

## Audience & Duration
- audience: <cap2|cap3|chung>
- duration: <short|standard|long>

## Khoảnh khắc đắt giá nên TRACE (3-5 mục)
1. <bước/trạng thái quan trọng nhất>
2. ...

## Nguồn đã tra cứu
- <url/file gốc>
- <url research thêm, nếu có>
```

Lưu vào `output/<slug>-<timestamp>/narrative-brief.md` (tự tạo `slug`/`timestamp` giống quy ước của `create-programming-video`).

### Bước 4 — Bàn giao

Báo lại 1 dòng: `✓ Brief: narrative-brief.md — gọi create-programming-video (hoặc create-template-video) với file này để dựng script.json.`

Không tự động gọi tiếp skill kia — để user xác nhận brief trước.

## Nguyên tắc (rút từ 3b1b / manim-composer)

- Show, don't just tell — mỗi aha moment phải gắn với 1 hình ảnh/trace cụ thể, không phải khái niệm trừu tượng suông.
- Đừng trả lời câu hỏi hook ngay trong hook — để dành cho phần TRACE.
- Nếu chủ đề quá cơ bản để có "aha moment" thật sự (vd in ra 1 dòng chữ), ghi thẳng "chủ đề này không có insight bất ngờ, hook nên đi thẳng vào lợi ích thực dụng" thay vì gượng ép.
