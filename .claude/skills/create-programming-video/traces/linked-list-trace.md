# Linked List Trace Spec (data_structure_type: "linked_list")

Sử dụng khi thuật toán thực thi trên danh sách liên kết (vd: chèn node, xoá node, đảo ngược linked list).

## JSON Schema cho inputs

```json
{
  "badge": "BƯỚC 2 · DÒNG 8",
  "data_structure_type": "linked_list",
  "code_lines": [
    { "n": 6, "t": "Node* insertNode(Node* head, int value) {" },
    { "n": 7, "t": "  Node* newNode = new Node(value);" },
    { "n": 8, "t": "  newNode->next = head;" },
    { "n": 9, "t": "  return newNode;" },
    { "n": 10, "t": "}" }
  ],
  "active_line_num": 8,
  "nodes": [
    { "id": "n1", "value": 5, "next": "n2" },
    { "id": "n2", "value": 3, "next": null }
  ],
  "current_pointer": { "node_id": "n1", "label": "head" },
  "highlight_node_ids": ["n1"],
  "changed_link_from": "n1",
  "changed_link_to": "n2",
  "variables": [
    { "name": "value", "value": "5" }
  ],
  "status": "Nối node mới vào head",
  "step_index": 2,
  "total_steps": 3
}
```

## Quy tắc voiceText tiếng Việt mẫu
- **voiceText**: "Ở dòng tám, chương trình gán con trỏ next của node mới trỏ đến head."
- **Quy tắc**: Không đọc trực tiếp các ký hiệu code như `->next`, `Node*`, thay bằng chữ đọc tự nhiên ("con trỏ next", "kiểu dữ liệu node").
