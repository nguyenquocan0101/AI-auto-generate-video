# Studio frontend

Studio là frontend vanilla ES modules. `index.html` chỉ chứa semantic shell và các dialog tĩnh; logic được chia theo trách nhiệm dưới `app/`.

## Cấu trúc

```text
studio/
├─ index.html
├─ app/
│  ├─ main.js
│  ├─ components/
│  │  └─ scene-card.js
│  ├─ controllers/
│  │  ├─ graph-controller.js
│  │  ├─ project-controller.js
│  │  ├─ render-controller.js
│  │  ├─ scene-controller.js
│  │  └─ storyboard-controller.js
│  ├─ media/
│  │  └─ media-sync.js
│  ├─ services/
│  │  └─ studio-api.js
│  └─ utils/
│     └─ dom.js
└─ styles/
   ├─ index.css
   ├─ base.css
   ├─ graph.css
   ├─ scenes.css
   └─ dialogs.css
```

## Ranh giới module

- `main.js`: giữ shared application state và nối các controller với nhau.
- `components/`: tạo markup cho component; không gọi API.
- `controllers/`: xử lý interaction và workflow của từng miền.
- `services/`: giao tiếp HTTP với Studio server.
- `media/`: đồng bộ playback video và audio.
- `utils/`: helper nhỏ không phụ thuộc business state.
- `styles/`: CSS theo khu vực giao diện; `index.css` là entrypoint duy nhất.

Khi thêm component mới, đặt markup trong `components/`, workflow trong `controllers/` và chỉ đăng ký nó một lần trong `main.js`.

## Chạy Studio

```bash
npm run studio
```

Mở `http://localhost:4173`. Studio đọc project dưới `output/` nhưng không tự render lại hoặc xoá artifact cũ khi khởi động.

Hai renderer được hỗ trợ:

- `hyperframes`: storyboard nhiều scene, voice/clip riêng và bước compose cuối.
- `ct-short-clip`: một video thuật toán, không có voice và không có composition trung gian.

CLI vẫn là đường phục hồi độc lập khi Studio không dùng được:

```bash
npm run pipeline -- output/<project>/script.json
npm run short-clip -- output/<project>/script.json
```

## Tạo project

Dialog `+ Project mới` có hai chế độ:

- **Import:** nạp `script.json` hợp lệ. Studio kiểm tra renderer, version và scene ID trước khi tạo thư mục project.
- **AI Generate:** nhập topic/URL, chọn renderer và `local`, `openai`, `claude` hoặc `gemini`. API key của provider HTTP chỉ đi qua request hiện tại, bị xoá khỏi form sau request/đóng dialog và không được ghi vào file hay browser storage.

Local generator được cấu hình ở process chạy Studio:

```env
STUDIO_GENERATOR_EXECUTABLE=node
STUDIO_GENERATOR_ARGS=["scripts/local-lesson-generator.mjs","--json"]
```

Executable nhận một JSON request qua stdin và phải trả đúng một document JSON qua stdout. Studio luôn dùng argv rõ ràng, `shell: false` và `windowsHide: true`. Nếu chưa cấu hình, provider `local` trả lỗi `Local generation is not configured` mà không tạo project dở dang.

HTTP adapters truyền URL như source context; P1 không tự fetch URL tuỳ ý từ Studio server. Một local adapter có thể tự resolve URL nếu cần.

## `studio-job.json`

`script.json` vẫn là nội dung canonical cho renderer. File sidecar `studio-job.json` chỉ lưu trạng thái điều phối:

- renderer và source metadata không bí mật;
- fingerprint hiện tại/thành công của từng artifact;
- trạng thái từng voice, clip và composition;
- lỗi gần nhất và thời điểm cập nhật.

API key, media bytes và nội dung script không được nhúng vào sidecar.

| Trạng thái | Ý nghĩa |
|---|---|
| `missing` | Chưa có file artifact. |
| `ready` | File tồn tại và fingerprint lần render thành công khớp input hiện tại. |
| `stale` | Có file cũ hoặc input đã thay đổi; cần render lại. |
| `rendering` | Artifact đang thuộc một job active. |
| `failed` | Lần render gần nhất thất bại; có thể rerender đúng unit đó. |

Project cũ chưa có sidecar được nhận diện lazily: file hiện có được giữ nguyên nhưng đánh dấu `stale`, không suy đoán `ready` từ timestamp.

## Invalidation và rerender

- Đổi `voiceText`, provider/voice/speed/instruct: voice, scene video và final composition thành `stale`.
- Đổi template/visual/aspect: scene video và final composition thành `stale`.
- Đổi SFX: chỉ final composition thành `stale`.
- Đổi cấu hình short clip: video duy nhất thành `stale`.
- Đổi vị trí node trên canvas: không invalid artifact.

Trong lúc project đang render, UI khoá chỉnh sửa và server trả `409` cho save khác. Job chỉ ghi `ready` khi fingerprint lúc hoàn tất vẫn khớp snapshot lúc bắt đầu; sửa file từ bên ngoài sẽ khiến kết quả cũ không được nhận là mới.

## Khôi phục trạng thái

- `stale`/`failed`: rerender đúng voice, scene, short clip hoặc composition bị ảnh hưởng.
- Composition bị chặn: render hết prerequisite được liệt kê rồi compose lại.
- Studio restart khi sidecar còn `rendering`: lần load tiếp theo chuyển artifact đó về `stale` với trạng thái interrupted.
- Sidecar hỏng/không hợp lệ: Studio bỏ trạng thái không đáng tin, đọc lại `script.json` và reconcile bảo thủ; không tự đánh dấu artifact là `ready`.
- Không xoá artifact stale bằng tay trừ khi muốn ép CLI tạo lại; render thành công được phép thay đúng target của nó.
