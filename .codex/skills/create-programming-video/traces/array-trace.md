# Array Trace Spec (data_structure_type: "array")

Sử dụng khi thuật toán thực thi trên mảng dữ liệu tuyến tính (vd: Bubble Sort, Quick Sort, Binary Search).

## JSON Schema cho inputs

```json
{
  "badge": "BƯỚC 2 · DÒNG 4",
  "data_structure_type": "array",
  "code_lines": [
    { "n": 1, "t": "void bubbleSort(int arr[], int n) {" },
    { "n": 2, "t": "  for (int i=0; i<n-1; i++) {" },
    { "n": 3, "t": "    for (int j=0; j<n-i-1; j++) {" },
    { "n": 4, "t": "      if (arr[j] > arr[j+1]) {" }
  ],
  "active_line_num": 4,
  "array_elements": [5, 3, 8, 4, 2],
  "highlight_indices": [0, 1],
  "swap_indices": [],
  "pointers": { "0": "j", "1": "j+1" },
  "variables": [
    { "name": "i", "value": "0" },
    { "name": "j", "value": "0", "changed": true },
    { "name": "n", "value": "5" }
  ],
  "status": "So sánh 5 và 3 → Đúng, cần hoán đổi",
  "step_index": 2,
  "total_steps": 4
}
```

## Quy tắc voiceText tiếng Việt mẫu
- **voiceText**: "Ở dòng bốn, chương trình so sánh phần tử thứ j với phần tử kế tiếp. Lúc này j bằng không, ta so sánh năm và ba."
- **Quy tắc**: Không đọc trực tiếp các ký hiệu code như `[ ]`, `>`, `=`, thay bằng chữ đọc tự nhiên ("phần tử thứ j", "lớn hơn", "bằng không").
