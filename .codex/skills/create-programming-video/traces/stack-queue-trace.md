# Stack & Queue Trace Spec (data_structure_type: "stack_queue")

Sử dụng khi thuật toán thực thi trên cấu trúc dữ liệu dạng Ngăn xếp (Stack) hoặc Hàng đợi (Queue), hoặc đệ quy cần mô phỏng call stack.

## JSON Schema cho inputs

```json
{
  "badge": "BƯỚC 2 · DÒNG 5",
  "data_structure_type": "stack_queue",
  "container_type": "stack",
  "code_lines": [
    { "n": 1, "t": "int factorial(int n) {" },
    { "n": 2, "t": "  if (n <= 1) return 1;" },
    { "n": 3, "t": "  return n * factorial(n - 1);" },
    { "n": 4, "t": "}" }
  ],
  "active_line_num": 3,
  "elements": [
    { "id": "f1", "value": "factorial(3)" },
    { "id": "f2", "value": "factorial(2)" }
  ],
  "top_or_front_id": "f2",
  "just_pushed_id": "f2",
  "variables": [
    { "name": "n", "value": "2" }
  ],
  "status": "Lời gọi hàm factorial(2) được đẩy vào stack",
  "step_index": 2,
  "total_steps": 3
}
```

## Quy tắc voiceText tiếng Việt mẫu
- **voiceText**: "Lúc này, lời gọi hàm factorial hai được đẩy vào ngăn xếp với tham số n bằng hai."
- **Quy tắc**: Không đọc các ký hiệu `( )`, `<=`, thay bằng chữ đọc tự nhiên ("lời gọi hàm factorial hai", "nhỏ hơn hoặc bằng").
