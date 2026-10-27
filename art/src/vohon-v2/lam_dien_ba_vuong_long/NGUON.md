# Lam Điện Bá Vương Long — concept năm hướng (#1096)

RAW nguyên byte từ builtin image_gen.imagegen, chưa crop, resize, hậu kỳ hay nhập game. Model/seed unknown.

- Số lượt đã dùng: 2/3. Bản chọn: concept-attempt2.png.
- SHA256 ảnh: d3c3d2b2d04b0eb9b0d6725092d31a5516a08c73beae294e2c6404df26babb95.
- Prompt concept-attempt2.prompt.txt; SHA256: 27079c1b3eb58600efbc2a9752bedb313aaaa65bb908e88aaf3826406069e073. Sinh nguyên văn bằng vohon-prompt.mjs, không thêm addendum.
- Neo phong cách: concept Hạo Thiên lượt 2 từ PR #1083; không dùng ảnh cũ hay ảnh lỗi.
- Số góc thật: 5; thứ tự s/se/e/ne/n. Nhận xét duyệt mắt: Lượt 1 trong candidates bị CHẶN: ne quay trái, lộ mặt. Lượt 2: ne quay phải không lộ mắt nhưng còn cạnh hàm; n nhìn lưng. e hơi chếch. Sét sáng rộng, vảy nhỏ; không người, chữ, khung.
- Chưa phải phê duyệt chính thức; không tạo asset game từ concept này.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| art/src/vohon-v2/lam_dien_ba_vuong_long/ | - | builtin image_gen.imagegen (ChatGPT / Codex) | Concept năm hướng Lam Điện Bá Vương Long; model/seed unknown; SHA256 và prompt ghi ở trên, từng lượt có source.json. | 2026-10-27 | Chỉ concept, chưa nhập game. |

## Kết quả kiểm RAW tại repo

- Bản chọn: concept-attempt2.png; kích thước 1983×793.
- vohon-check raw: **NHẸ**, tách đủ **5 hình**, chênh cỡ 1.02×, màu khớp **72%**.
- Cảnh báo máy: texture mềm, 185 màu đáng kể, chưa đúng lưới khối.
- Ảnh neo nằm ở **nhánh PR #1083**, đường dẫn art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png, chưa phải ảnh sẵn có trên main.
- Dùng --type phaptuong theo khuôn concept #1096 để sinh bố cục năm hướng; không tạo pháp tướng thay thế hoặc nhập game.
- Candidates: mỗi lượt có 5 hình nhưng góc ne sai, chỉ 4 hướng đáp ứng; không dùng làm ảnh neo.

## Khai báo --eye theo quyết định ở PR #1147

Không sinh thêm; giữ bản chọn nêu trên. Concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý khi làm phụ thể với hình nộm. Công cụ võ hồn chưa nhận cờ --eye; các khai báo dưới đây được lưu tường minh và đồng bộ trong trường eye của source.json, không phải lệnh đã chạy.

- `--eye "concept-attempt2=hướng — se/e — hai góc gần giống nhau, e chưa ngang hẳn"`
  LỖI: hướng — se/e — hai góc gần giống nhau, e chưa ngang hẳn (mắt).
- `--eye "concept-attempt2=hướng — ne — còn lộ cạnh hàm; n nhìn lưng"`
  LỖI: hướng — ne — còn lộ cạnh hàm; n nhìn lưng (mắt).


## Chân dung lô 2 — #1158, P1c2

Ngày 2026-10-27; 1/3 lượt chân dung. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte: `candidates/portrait-attempt1.png`; SHA256 `5397e7b6c1f98f07d977bc5e44a30ae47a0e42c8a92fe8bf383b7ed48348d380`. Prompt CLI nguyên văn, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`; SHA256 `28dd56828f325358aed2825f28ea6a95650f3c318214cf6019aa8f4e53983499`. Neo ngoại hình `concept-attempt2.png`, SHA256 `d3c3d2b2d04b0eb9b0d6725092d31a5516a08c73beae294e2c6404df26babb95`. Lệnh và kết quả máy ở `candidates/portrait-attempt1.source.json`.

Pixel hoá bằng `--preset portrait2` (P1c2 đã duyệt 27/10), giữ mặc định 16 màu của preset; brief RAW 6–8 mảng màu không phải giới hạn bảng màu P1c2. Bản 64×64: `candidates/portrait-attempt1-P1c2/lam_dien_ba_vuong_long-portrait.png`; xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Chỉ ứng viên trình duyệt, chưa nhập game; không chọn thay concept. Không dùng lại ảnh lỗi làm neo.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI võ hồn chưa nhận cờ này; lưu khai báo tường minh, không sửa công cụ hoặc RAW.

```text
--eye "portrait-attempt1=góc nhìn chính diện thay vì 3/4; sừng chạm mép trên; sét và lôi châu sáng rộng tranh mắt; cần duyệt độ tách nền ở 64×64"
```
