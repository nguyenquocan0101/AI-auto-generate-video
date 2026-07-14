---
name: video-critic
description: Review một script.json đã dựng xong (từ create-programming-video hoặc create-template-video) TRƯỚC khi chạy pipeline render — chấm điểm hook, mật độ visual mỗi scene, đồng bộ voiceText/animation, vi phạm quy tắc TTS tiếng Việt, và scene-count/TRACE-count theo audience+duration tier. Trigger khi user nói "review kịch bản trước khi render", "chấm video này trước khi xuất", "kiểm tra script.json", "sao thấy video hơi PPT/nhàm chán", "check lại trước khi npm run pipeline". KHÔNG sửa trực tiếp trừ khi user đồng ý áp dụng patch. Output: danh sách finding + bản vá đề xuất.
---

# video-critic

Vòng kiểm tra chất lượng độc lập cho `script.json` — chạy SAU khi
`create-programming-video`/`create-template-video` đã ghi file, TRƯỚC
`npm run pipeline`. Vai trò tương đương "Critic" trong kiến trúc
Planner→Coder→Critic: không tự sinh scene mới, chỉ chấm và đề xuất sửa.

## Input

Đường dẫn `script.json` đã tồn tại (không phải file thô/URL).

## Workflow

### Bước 1 — Đọc script.json + xác định tier

Đọc `metadata.audience`, `metadata.duration` (nếu thiếu, coi là `chung`/`standard`).
Đọc bảng scene-count/TRACE-count tương ứng trong `create-programming-video`
(v4 + v5) hoặc cấu trúc 8-12 scene của `create-template-video`.

### Bước 2 — Chấm theo 6 hạng mục

Với mỗi scene, kiểm:

1. **Cấu trúc bắt buộc**: scene đầu `type=hook`, scene cuối `type=outro`, đúng tổng số scene và số scene TRACE theo tier đã xác định ở Bước 1.
2. **Một ý mỗi scene**: `voiceText` chứa >1 ý mới rõ rệt (2 khái niệm/2 số liệu độc lập trong cùng scene) → flag tách scene.
3. **Mật độ visual ("hội chứng PPT")**: scene chỉ có text/label mà không có yếu tố hình ảnh chính (trace, biểu đồ, so sánh, card) đủ để giữ mắt người xem — không chỉ chữ trên nền màu.
4. **Đồng bộ voice–visual**: nếu scene có `changed_variables`/`animations` nhưng `voiceText` không nhắc gì tới thay đổi đó (hoặc ngược lại), flag lệch đồng bộ.
5. **Vi phạm TTS tiếng Việt**: `voiceText` còn ký hiệu `[ ] { } > < = ▶` số La Mã kiểu code, hoặc icon/emoji, hoặc URL trần.
6. **Hook & kết thúc**: hook không đặt câu hỏi/tuyên bố mạnh trong 1 câu đầu; scene gần cuối không có "câu hỏi nhỏ" hoặc CTA phù hợp audience (xem `create-programming-video/references/engagement-polish.md` nếu áp dụng được).

### Bước 3 — Báo cáo finding

Xếp theo mức nghiêm trọng, mỗi finding nêu rõ `scene id`, vấn đề cụ thể, và bản vá đề xuất (không phải chung chung "cải thiện scene này"):

```markdown
## Findings

1. [BLOCKER] scene "trace-3": tổng TRACE chỉ 2 scene, tier `cap2` yêu cầu 6-8.
   → Đề xuất: thêm 2 scene trace cho bước hoán đổi thứ 2 và thứ 3 trong vòng lặp ngoài.
2. [WARN] scene "hook": voiceText mở đầu bằng câu khẳng định thay vì câu hỏi.
   → Đề xuất: đổi thành "Bạn có biết vì sao thuật toán này chạy nhanh hơn gấp đôi không?"
3. [NIT] scene "complexity": voiceText còn ký hiệu "O(n²)" chưa viết ra chữ.
   → Đề xuất: "O của n bình phương".
```

Nếu không có finding, báo thẳng `✓ Không phát hiện vi phạm — có thể chạy npm run pipeline`. Đừng bịa finding để có nội dung báo cáo.

### Bước 4 — Áp dụng patch (chỉ khi user đồng ý)

Hỏi 1 câu: "Áp dụng các bản vá trên vào script.json luôn, hay để bạn tự sửa tay?"
Nếu user đồng ý, dùng `Edit` sửa trực tiếp từng finding đã liệt kê — không sửa gì
ngoài danh sách đã báo cáo.

## Ranh giới

- Không tự chạy `npm run pipeline` — đó là việc của skill dựng video, không phải critic.
- Không phát minh thêm tiêu chí ngoài 6 hạng mục ở Bước 2 — nếu thấy vấn đề khác rõ ràng ảnh hưởng chất lượng, nêu nhưng gắn nhãn `[NGOÀI CHECKLIST]` để user biết đây là nhận xét chủ quan thêm, không phải luật đã định.
