---
description: Tạo video thuật toán 9:16 dài 20-30 giây từ URL/file/nội dung, không TTS; cột chạy thật và có beep compare/swap.
argument-hint: <url|file|nội dung về một thuật toán sắp xếp được hỗ trợ>
---

Load skill `short-clip`. Dùng agent `short-clip-script-writer` để đọc và chuyển `$ARGUMENTS` thành spec JSON tối thiểu. Nếu `$ARGUMENTS` chưa có nguồn cụ thể, hỏi người dùng gửi đúng một URL, file hoặc nội dung rồi tiếp tục.

Ghi JSON vào `output/<slug>-<timestamp>/script.json`, sau đó chạy:

```powershell
npm run short-clip -- output/<slug>-<timestamp>/script.json
```

Không gọi TTS. Sau khi render, báo đường dẫn `video.mp4`, `script.json`, `trace.json` và `beeps.wav`.
