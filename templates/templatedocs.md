---
name: video-template-design
description: Skill thiết kế chung áp dụng cho MỌI template ct-* trong hệ renderer HyperFrames trước khi code hoặc khi refactor template cũ. Dùng khi user nói "template đang giống web quá", "làm cho giống video hơn", "thiết kế template mới cho ChuyenTin", "template này trông tĩnh quá", hoặc bất kỳ lúc nào tạo/sửa 1 component ct-* dùng để render ra video 9:16. Không dùng cho thiết kế web app, dashboard, hay UI có tương tác người dùng thật (click/hover) — đối tượng ở đây là khung hình video, người xem không tương tác được.
---

# Video Template Design — Thiết kế template render-thành-video, không phải web UI

## Vấn đề cốt lõi cần sửa

Template HTML render ra video hiện đang bị đánh giá "giống web". Lý do gốc: HTML/CSS
mặc định được thiết kế cho **giao diện tĩnh, tương tác bằng chuột** — bố cục ổn định,
xuất hiện tức thì, người dùng tự điều khiển tốc độ đọc bằng cách scroll/click.

Video thì ngược lại: **khung hình luôn chuyển động, thời gian bị áp đặt bởi voice/nhịp
edit, người xem không điều khiển được gì**. Nếu 1 template chỉ "hiện ra rồi đứng yên"
như 1 trang web chụp màn hình, nó sẽ luôn có cảm giác web dù màu sắc/font đẹp đến đâu.

**Nguyên tắc bao trùm: mọi phần tử trên khung hình đều phải có lý do để chuyển động —
xuất hiện, tồn tại, biến mất — theo đúng nhịp thời gian của scene, không phải theo
hành vi người dùng.**

---

## Phần 1 — Danh sách "mùi web" cần loại bỏ (audit checklist)

Khi review 1 template `ct-*`, tự hỏi từng dòng sau — nếu trả lời "có" ở bất kỳ dòng nào,
đó là dấu hiệu template đang bị web hoá:

| # | Dấu hiệu "web" | Tại sao sai cho video |
|---|---|---|
| 1 | Card có `box-shadow` nhạt kiểu Bootstrap/Material (0 2px 8px rgba(0,0,0,.1)) | Shadow kiểu này là ngôn ngữ "phần tử nổi trên nền trắng chờ click", không phải ngôn ngữ điện ảnh |
| 2 | Border-radius đều 8px/12px cho mọi box, không phân cấp | Tạo cảm giác "component library mặc định", thiếu chủ đích thiết kế |
| 3 | Font hệ thống (Inter, Roboto, system-ui) không qua xử lý gì thêm | Đúng nhưng vô hồn — video cần typography có cá tính (weight tương phản mạnh, kerning cố ý) |
| 4 | Bố cục dạng list/card xếp đều tăm tắp, căn trái toàn bộ | Giống UI dashboard hơn là 1 khung hình được dàn dựng có điểm nhấn thị giác |
| 5 | Phần tử xuất hiện cùng lúc, không có stagger/delay | Mắt người xem bị choáng ngợp, không biết nhìn đâu trước — video luôn dẫn mắt người xem theo trình tự |
| 6 | Không có animation entrance/exit — element chỉ "có" hoặc "không có" | Cắt cứng giữa 2 trạng thái = cảm giác slide PowerPoint, không phải video |
| 7 | Nền phẳng 1 màu solid hoặc gradient tĩnh không đổi suốt scene | Nền tĩnh tuyệt đối trong nhiều giây khiến khung hình "chết" |
| 8 | Text block dài, căn đều (justify) như bài báo | Video không phải để đọc chữ dài — text phải được "biên tập" thành cụm ngắn, kinetic |
| 9 | Icon dùng emoji thô hoặc icon set mặc định (Font Awesome cơ bản) không đồng bộ style | Phá vỡ tính nhất quán thị giác của cả video |
| 10 | Không có yếu tố depth (mọi thứ nằm trên cùng 1 mặt phẳng z-index) | Video (đặc biệt short-form) cần cảm giác lớp lang để không phẳng |
| 11 | Transition giữa các scene là hard-cut không xử lý gì | Giống chuyển slide, không giống chuyển cảnh |
| 12 | Animation dùng easing `linear` hoặc `ease` mặc định của CSS | Chuyển động đều tay = robot; video cần easing có "trọng lượng" |

---

## Phần 2 — Nguyên tắc thiết kế thay thế (áp dụng cho mọi `ct-*`)

### 2.1 Motion-first, không phải layout-first

Khi thiết kế 1 template mới, đừng bắt đầu bằng câu hỏi "bố cục thế nào" — bắt đầu bằng
**"phần tử nào xuất hiện trước, phần tử nào xuất hiện sau, và tại sao"**. Layout tĩnh chỉ
là khung hình cuối cùng (last frame); bản thân quá trình đi tới khung hình đó mới là
thứ khiến nó thành video.

Quy tắc tối thiểu cho mọi template:
- **Không có phần tử nào xuất hiện ở frame 0.** Mọi thứ animate vào trong 100–600ms đầu.
- **Stagger bắt buộc** khi có ≥2 phần tử cùng nhóm (list item, chữ trong headline, ô
  trong bảng...): delay 60–150ms giữa mỗi phần tử, không bao giờ đồng loạt.
- **Exit animation khi chuyển scene** — không để renderer cắt cứng, cho phần tử chính
  có ít nhất 1 chuyển động thoát (fade+scale nhẹ, slide, hoặc bị "nuốt" bởi scene sau).

### 2.2 Easing có trọng lượng — không dùng easing mặc định

Cấm dùng `linear` và `ease` mặc định của CSS cho animation chính. Dùng các easing sau
tuỳ ngữ cảnh:

- **Entrance phần tử quan trọng (headline, số liệu):** `cubic-bezier(0.34, 1.56, 0.64, 1)`
  — kiểu "overshoot" nhẹ, tạo cảm giác nảy vào đúng vị trí, giống motion graphic thật.
- **Entrance phần tử phụ (bullet, tag nhỏ):** `cubic-bezier(0.16, 1, 0.3, 1)` — ease-out
  dứt khoát, không nảy, vì phần tử phụ không nên giành spotlight.
- **Exit / biến mất:** `cubic-bezier(0.7, 0, 0.84, 0)` — ease-in nhanh dần, phần tử
  "bị hút đi" chứ không trôi lờ đờ.
- **Số đếm tăng dần (stat, %):** dùng easing riêng cho counter — chạy nhanh ở đầu, chậm
  dần khi gần chạm số đích (giống đồng hồ đo tốc độ), không tăng đều tuyến tính.

### 2.3 Kinetic typography — chữ phải "diễn"

Với headline/số liệu quan trọng (không áp dụng cho caption phụ hay đoạn mô tả dài):
- Tách chữ theo từ hoặc theo ký tự, animate từng cụm vào riêng biệt thay vì cả câu
  hiện cùng lúc.
- Dùng scale + fade kết hợp (không chỉ fade đơn thuần) — chữ "phóng to nhẹ từ 0.9 → 1"
  khi xuất hiện tạo cảm giác trọng lượng.
- Với số liệu (%, complexity, thống kê): luôn animate đếm số (count-up) thay vì hiện số
  tĩnh — đây là 1 trong những chi tiết rẻ tiền nhất để tạo cảm giác "production value".
- Weight tương phản mạnh trong cùng 1 khối text: từ khoá chính dùng weight rất đậm
  (800–900), phần phụ trợ dùng weight nhẹ (400–500) — tránh toàn bộ đoạn text cùng 1 weight.

### 2.4 Nền luôn "sống" — never a dead flat background

Nền của mọi scene phải có ít nhất 1 trong các chuyển động sau chạy liên tục suốt scene
(không chỉ lúc entrance):
- Gradient dịch chuyển chậm (background-position animate trong 8-15s, loop hoặc không lặp).
- Particle/noise layer nhẹ (opacity thấp 3-8%) chuyển động chậm — tạo texture, tránh
  nền "nhựa" quá sạch.
- Hiệu ứng Ken Burns (scale nhẹ 1 → 1.05 trong suốt thời lượng scene) nếu nền là ảnh/graphic.
- Vignette nhẹ ở 4 góc — chi tiết nhỏ nhưng ngay lập tức tạo cảm giác "được quay/dựng"
  thay vì "screenshot trang web".

### 2.5 Depth — phân lớp bằng chuyển động, không chỉ z-index

Video short-form (đặc biệt dọc 9:16) cần cảm giác lớp lang để không phẳng như 1 trang web:
- Layer nền (background) di chuyển chậm nhất (parallax factor thấp).
- Layer nội dung chính di chuyển với tốc độ/entrance riêng biệt so với layer trang trí
  (đường kẻ, chấm, hình khối phụ).
- Layer trang trí (decorative shapes, glow, accent lines) nên có chuyển động độc lập,
  không đứng yên trong khi nội dung chính animate — tạo cảm giác nhiều mặt phẳng.
- Đừng lạm dụng blur/shadow để giả depth — depth thật đến từ tốc độ chuyển động khác
  nhau giữa các lớp (parallax), không phải chỉ CSS shadow.

### 2.6 Camera language — mô phỏng máy quay dù chỉ là HTML

Không có máy quay thật, nhưng có thể mô phỏng bằng CSS transform trên cả khung scene:
- **Push-in nhẹ:** toàn bộ scene scale từ 1.0 → 1.03-1.08 trong suốt thời lượng, tạo
  cảm giác camera đang tiến vào — dùng cho scene cần nhấn mạnh cảm xúc (hook, tổng kết).
- **Subtle pan:** dịch chuyển toàn khung theo 1 trục (2-4% quãng đường) trong scene dài
  — tránh khung hình đứng yên tuyệt đối quá lâu.
- Đừng lạm dụng cả push-in và pan cùng lúc trong 1 scene — chọn 1 hiệu ứng phù hợp mood.

### 2.7 Màu sắc và ánh sáng kiểu "grading", không phải "palette web"

- Tránh dùng màu phẳng thuần theo hex chuẩn (#FF0000, #0000FF) — luôn qua ít nhất 1
  bước điều chỉnh (thêm chút warm/cool tint, giảm saturation 5-10%) để có cảm giác
  "được grade" thay vì màu mặc định browser.
- Contrast giữa foreground/background nên cao hơn mức "đủ đọc được" của web accessibility
  (video xem trên mobile, ánh sáng môi trường thay đổi liên tục) — ưu tiên độ tương phản
  mạnh, rõ ràng hơn là tinh tế.
- Dùng gradient overlay (duotone nhẹ) lên background thay vì màu nền phẳng đơn sắc khi
  scene cần cảm giác điện ảnh (hook, outro, câu chốt).

### 2.8 Transition giữa scene — không hard-cut mặc định

- Mỗi cặp scene nối tiếp cần ít nhất 1 kiểu transition: crossfade có motion (không phải
  fade đơn thuần), whip-pan giả lập (blur nhanh theo hướng), scale-through (scene sau
  phóng to từ tâm scene trước), hoặc shape wipe theo brand color.
- Transition nên khác nhau tuỳ theo cặp scene liền kề có cùng "mood" hay không — 2 scene
  cùng nhịp (2 scene trace liên tiếp) có thể dùng cut nhanh có motion nhẹ; chuyển từ
  "khái niệm" sang "trace" (đổi nhịp) nên dùng transition rõ rệt hơn để báo hiệu chuyển
  giai đoạn nội dung.

### 2.9 Bố cục — dàn dựng có điểm nhấn, không phải list đều

- Tránh căn mọi thứ về 1 kiểu (toàn bộ trái, toàn bộ giữa) xuyên suốt — tạo phân cấp
  bằng cách lệch trục có chủ đích cho 1-2 phần tử làm điểm nhấn.
- Với vùng an toàn 9:16 (an toàn cho UI overlay của nền tảng: top ~12%, bottom ~15-20%
  bị che bởi caption/nút tương tác trên TikTok/Reels/Shorts) — nội dung quan trọng nhất
  luôn nằm ở 60% giữa khung hình theo chiều dọc.
- Whitespace không nên đều tăm tắp kiểu grid 8px — cho phép khoảng trắng bất đối xứng
  có chủ đích quanh phần tử chính để tạo điểm nhìn.

---

## Phần 3 — Kỹ thuật CSS/animation cụ thể (tham khảo khi code)

```css
/* Easing chuẩn cho entrance phần tử chính — có overshoot nhẹ */
.enter-primary {
  animation: enterPrimary 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes enterPrimary {
  from { opacity: 0; transform: scale(0.9) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* Stagger cho list item — mỗi item delay thêm 80ms qua nth-child hoặc JS */
.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 80ms; }
.list-item:nth-child(3) { animation-delay: 160ms; }

/* Exit nhanh dần — dùng khi element rời khung hình */
.exit-fast {
  animation: exitFast 0.35s cubic-bezier(0.7, 0, 0.84, 0) forwards;
}
@keyframes exitFast {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.92); }
}

/* Nền sống — gradient dịch chuyển chậm suốt scene */
.living-bg {
  background-size: 200% 200%;
  animation: bgShift 12s ease-in-out infinite alternate;
}
@keyframes bgShift {
  from { background-position: 0% 50%; }
  to   { background-position: 100% 50%; }
}

/* Camera push-in cho cả scene container */
.scene-pushin {
  animation: pushIn 6s linear forwards; /* linear ĐƯỢC PHÉP ở đây vì mô phỏng camera thật, không phải UI element */
}
@keyframes pushIn {
  from { transform: scale(1); }
  to   { transform: scale(1.06); }
}

/* Counter số liệu — dùng JS đếm số + easing riêng, KHÔNG chỉ đổi text tĩnh */
/* Gợi ý: dùng easeOutExpo cho hàm đếm để số "chậm dần khi gần chạm đích" */
```

**Lưu ý khi render qua pipeline video (không phải browser thật):** xác nhận trước với
đội renderer rằng `@keyframes`/`animation` CSS được hệ thống chụp frame (headless
render) đọc đúng theo timeline, không bị "nhảy cóc" — nếu renderer dùng cách chụp frame
theo thời gian cố định, animation phải khớp đúng frame rate render, không chỉ đúng khi
xem trong browser thường.

---

## Phần 4 — Checklist áp dụng khi thiết kế/refactor 1 template `ct-*`

Trước khi coi 1 template là "xong", tự chấm theo checklist sau — nếu thiếu quá 3 mục,
template đó nhiều khả năng vẫn "giống web":

- [ ] Không phần tử nào xuất hiện ở frame 0 — tất cả đều animate vào.
- [ ] Có stagger rõ ràng khi có ≥2 phần tử cùng nhóm.
- [ ] Dùng easing có overshoot hoặc ease-out rõ rệt, không dùng `linear`/`ease` mặc định
      cho UI element (trừ trường hợp mô phỏng camera).
- [ ] Nền có ít nhất 1 chuyển động chạy suốt scene, không đứng yên.
- [ ] Có ít nhất 2 lớp depth chuyển động với tốc độ khác nhau.
- [ ] Số liệu/thống kê dùng count-up animation, không hiện số tĩnh.
- [ ] Headline/từ khoá chính có kinetic typography (tách chữ/scale vào), không chỉ fade cả cụm.
- [ ] Có exit animation hoặc transition xử lý khi chuyển sang scene kế tiếp, không hard-cut trần trụi.
- [ ] Contrast màu đủ mạnh cho xem trên mobile, không dùng tông màu "web pastel an toàn".
- [ ] Bố cục có ít nhất 1 điểm nhấn lệch trục có chủ đích, không phải toàn bộ căn đều.

---

## Phần 5 — Khi nào KHÔNG áp dụng motion mạnh

Không phải mọi thứ cần chuyển động dồn dập — lạm dụng sẽ gây rối mắt, đặc biệt với
scene giáo dục cần người xem đọc/hiểu code hoặc dữ liệu (vd `ct-code-trace`):

- Trong khối trace code (đọc số liệu, biến, dòng lệnh): animation nên **tinh tế và có
  mục đích thông tin** (highlight dòng, pulse biến đổi giá trị) chứ không trang trí thêm
  hiệu ứng camera push-in hay particle nền — người xem cần tập trung đọc, không bị phân tán.
- Motion mạnh (kinetic typography, camera push-in, particle nền rõ) dành cho các scene
  **cảm xúc/định hướng** (hook, khái niệm, tổng kết, outro) — nơi mục tiêu là tạo ấn tượng,
  không phải truyền tải chi tiết kỹ thuật cần đọc kỹ.
- Quy tắc chung: **độ phức tạp thông tin tỉ lệ nghịch với độ phức tạp chuyển động** trong
  cùng 1 scene. Scene nhiều số liệu/code → motion tối giản, chỉ động ở chỗ cần chỉ dẫn mắt.
  Scene ít chữ/1 câu chốt → motion được phép mạnh tay hơn.

---

## Cách dùng skill này trong pipeline hiện tại

- Khi tạo template `ct-*` mới: đọc skill này trước, thiết kế theo Phần 2, dùng code mẫu
  ở Phần 3 làm điểm khởi đầu, tự chấm bằng checklist Phần 4 trước khi báo hoàn thành.
- Khi refactor template cũ bị chê "giống web": chạy qua bảng audit Phần 1 trước, liệt kê
  cụ thể template đang vi phạm mục nào, rồi sửa theo đúng mục tương ứng ở Phần 2 — không
  sửa tràn lan không có chẩn đoán.
- Skill này áp dụng chung cho MỌI `ct-*`, không thay thế các skill/spec riêng theo nội
  dung (vd `create-programming-video` vẫn quyết định slot data gì hiển thị) — skill này
  chỉ quyết định **cách phần tử đó chuyển động và được dàn dựng trên khung hình**.