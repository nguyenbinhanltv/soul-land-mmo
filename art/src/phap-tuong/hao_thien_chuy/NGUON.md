# Hạo Thiên Chùy — RAW concept turnaround (#1024)

`concept-turnaround-attempt1.png`: 1983×793, 1,381,234 byte, SHA256 `9cab9a9851e7cad8727148a8d63ce687bb32e50b093af368c1392ed890cfea1e`; prompt `concept-turnaround-attempt1.prompt.txt`, prompt SHA256 `dbfa604645fbf4d82e8c6199bc732d069ec2d5b5309b4f9c084124a7c6a24cb7`.

Ảnh có năm góc nhìn liên tiếp. **FAIL cho tiêu chuẩn asset** vì texture vẽ mềm/nhiễu, không đạt pixel cứng theo STYLE/NEGATIVE. RAW giữ nguyên; chưa crop/resize/hậu kỳ, chưa duyệt và chưa nhập game. Chỉ là concept, không tạo hoạt ảnh.

Prompt dùng đúng khối STYLE + NEGATIVE tại `docs/art/vo-hon-phong-cach.md` mục 6 và mô tả Hạo Thiên Chùy mục 4.1; không dùng ảnh cũ làm ảnh dẫn. Không có ảnh tham chiếu.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phap-tuong/hao_thien_chuy/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | RAW concept turnaround 5 hướng, 1983×793; model/seed unknown. Prompt, SHA, output path và lỗi trong NGUON.md + `*.prompt.txt` + `*.source.json`. Không animation / chưa được duyệt. | 2026-10-27 | Pháp tướng Tà Hỏa không thay đổi; không sửa `art/CREDITS.md`. |
