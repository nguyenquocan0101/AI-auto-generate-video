---
name: create-template-video
description: Tạo video tin tức 9:16 bằng TEMPLATE HyperFrames chuyên nghiệp từ URL bài báo hoặc file .txt tiếng Việt. Trigger khi user muốn tạo video tin tức, làm short news, video kiểu template/poster đẹp, "tạo video template", "làm bản tin kiểu poster", "video tin tức chuyên nghiệp". Output: video.mp4 + voice.mp3 + script.txt cho CapCut.
---

# Create Template Video Skill (Antigravity IDE)

Sinh video tin tức 9:16 dùng các template HyperFrames trong `templates/` (brand AI Coding).
Antigravity chỉ điền **chữ vào slot** của template — toàn bộ thiết kế/animation do template lo.

> **Tool mapping (Antigravity ≠ Claude Code):**
> - Fetch URL → `read_url_content`
> - Đọc file → `view_file`
> - Chạy lệnh → `run_command` (PowerShell, cwd = repo root)
> - Ghi file → `write_to_file`

## Input

1 tham số: URL bài báo (`http://`/`https://`) HOẶC đường dẫn file `.txt`.

---

## Workflow (theo đúng thứ tự)

### Step 1–3: Lấy nội dung + tạo output dir

- **URL** → dùng `read_url_content` để fetch, rồi tự parse:
  Trích xuất từ nội dung trả về:
  - `title`: tiêu đề bài báo
  - `content`: nội dung chính ~500-1500 từ
  - `ogImage`: null (không dùng)
  - `domain`: domain của URL

- **File `.txt`** → dùng `view_file`; title = dòng đầu ≤80 ký tự, content = phần còn lại, domain = `"local"`.

- Tạo slug + outputDir bằng `run_command`:
  ```powershell
  New-Item -ItemType Directory -Force -Path "output\<slug>-<timestamp>"
  ```
  `Cwd`: `w:\AI-auto-generate-video`

---

### Step 4: Đọc danh mục template

Dùng `view_file` đọc `w:\AI-auto-generate-video\templates\CATALOG.md`.
Chỉ dùng templateId có trong CATALOG:

**HOOK (chỉ 1):** `ct-hook-hero` — LUÔN dùng cho scene hook.

**BODY (Claude tự chọn — ưu tiên ĐA DẠNG, không lặp 1 template):**
- `ct-stat-card` — 1 con số/benchmark nền tối neon (vàng/cam + tím)
- `ct-bold-poster` — tuyên bố mạnh nhiều dòng + figure số lớn
- `ct-build-minimal` — 1 từ chốt reveal từng chữ, nền tối + amber
- `ct-voltage` — câu sáng tạo, split panel + viết tay
- `ct-glitch-title` — tin sốc/breaking cyberpunk glitch
- `ct-list` — danh sách 2–5 mục (icon + level tag)
- `ct-comparison` — so sánh 2 thứ (A vs B)

**OUTRO (chỉ 1):** `ct-outro` — mặc định.

---

### Step 5: Sinh script.json (8–12 scene)

- **Hook** → `ct-hook-hero` (slots: kicker, headline, subheadline, cta, brand)
- **Body** → Claude TỰ CHỌN template hợp nhất cho từng scene (xem CATALOG.md cho slot reference đầy đủ)
- **Outro** → `ct-outro` (slots: brand_name, tagline, primary_url)

Quy tắc body scene:
- 8–12 scene tổng; voiceText ~270–360 từ tổng (~90–120s)
- Mỗi body scene ~25–40 từ (1 ý duy nhất)
- ĐA DẠNG template — không lặp cùng template liên tiếp

Gợi ý cân bằng:
- Scene số liệu: `ct-stat-card`
- Scene không số: `ct-build-minimal`, `ct-bold-poster`, `ct-voltage`
- Scene list/comparison: `ct-list`, `ct-comparison`

---

### ⚠️ Quy tắc TTS tiếng Việt (BẮT BUỘC cho `voiceText`)

| Dạng | SAI | ĐÚNG |
|---|---|---|
| Thập phân | `5.5`, `82.7%` | `năm chấm năm`, `tám mươi hai phẩy bảy phần trăm` |
| Phiên bản | `iPhone 17` | `iPhone mười bảy` |
| Thông số | `200MP` | `hai trăm megapixel` |
| Tiền tệ | `$5` | `năm đô` |
| Bội số | `2x` | `gấp đôi` |

- `voiceText`: KHÔNG emoji, KHÔNG URL, KHÔNG `→ & % $ # + =`.
- `inputs` (màn hình): ĐƯỢC dùng emoji, giữ số đẹp (`"5.5"`, `"82%"`).
- Dùng emoji inputs vừa phải (0–1 per field). ĐỪNG nhét emoji vào `hero` của `ct-build-minimal`.

---

### Step 6: Tự kiểm tra

- `scenes[0].type === "hook"`, `scenes[-1].type === "outro"`, tổng 8–12 scene.
- Mỗi `templateId` trong CATALOG. Mỗi `inputs` đủ slot bắt buộc.
- `headline` `ct-bold-poster`: ≤3 dòng, ≤14 ký tự/dòng.
- `voiceText` không emoji, không ký hiệu, số đã viết ra chữ. Sửa thầm ≤2 lần.

---

### Step 7: Ghi script.json

Dùng `write_to_file` ghi `w:\AI-auto-generate-video\output\<slug>-<timestamp>\script.json`:

```json
{
    "version": "1.0",
    "renderer": "hyperframes",
    "aspect": "9:16",
    "metadata": {
        "title": "<title>",
        "source": { "url": "<url>", "domain": "<domain>", "image": null },
        "channel": "AI Coding"
    },
    "voice": { "provider": "omnivoice", "speed": 1.0 },
    "scenes": [ ... ]
}
```

---

### Step 8: Chạy pipeline

Dùng `run_command`:

```powershell
npm run pipeline -- output\<slug>-<timestamp>\script.json
```

`Cwd`: `w:\AI-auto-generate-video`
`WaitMsBeforeAsync`: 300000 (5 phút)

---

### Step 9: Báo kết quả

```
✓ Video: output/<slug>/video.mp4
✓ Audio: output/<slug>/voice.mp3 — cho CapCut
✓ Script: output/<slug>/script.txt — cho CapCut auto-caption
Tổng thời lượng: XX.Xs
```

---

## Ghi chú

- Render mỗi scene ~15–20s. Video 8–10 scene ≈ 3–5 phút.
- Pipeline idempotent — xoá `voice/scene-*.mp3` hoặc `clips/scene-*.mp4` để force re-render.
- Skill này dùng brand AI Coding. Để dùng brand ChuyenTin cho lập trình, dùng skill `create-programming-video`.
