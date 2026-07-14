# Tree Trace Spec (data_structure_type: "tree")

Sử dụng khi thuật toán thực thi trên cấu trúc dữ liệu dạng cây nhị phân (vd: duyệt cây in-order/pre-order/post-order, tìm kiếm trên BST).

## JSON Schema cho inputs

```json
{
  "badge": "BƯỚC 1 · DÒNG 2",
  "data_structure_type": "tree",
  "code_lines": [
    { "n": 1, "t": "void preOrder(TreeNode* root) {" },
    { "n": 2, "t": "  if (root == NULL) return;" },
    { "n": 3, "t": "  cout << root->val;" },
    { "n": 4, "t": "  preOrder(root->left);" },
    { "n": 5, "t": "  preOrder(root->right);" },
    { "n": 6, "t": "}" }
  ],
  "active_line_num": 2,
  "tree_nodes": [
    { "id": "root", "value": 10, "parent": null },
    { "id": "l1", "value": 5, "parent": "root" },
    { "id": "r1", "value": 15, "parent": "root" }
  ],
  "visited_ids": ["root"],
  "current_id": "l1",
  "traversal_order": ["root"],
  "variables": [
    { "name": "root->val", "value": "10" }
  ],
  "status": "Kiểm tra node root hiện tại khác NULL",
  "step_index": 1,
  "total_steps": 4
}
```

## Quy tắc voiceText tiếng Việt mẫu
- **voiceText**: "Chương trình kiểm tra xem node hiện tại có khác rỗng không. Lúc này node root có giá trị là mười."
- **Quy tắc**: Không đọc các ký hiệu `==`, `NULL`, `->val`, thay bằng chữ đọc tự nhiên ("bằng", "rỗng", "giá trị của node root").
