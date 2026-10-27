# Bích Lân Xà Hoàng — concept năm hướng (#1096)

RAW nguyên byte, chưa hậu kỳ hoặc nhập game. Lượt 1/3, chọn concept-attempt1.png.

- 1983×793; SHA256 ảnh: dbb1002c01e3a0e541c3b385405b4db54225735ed5e549aac983e4a1f1a94a56.
- Prompt: concept-attempt1.prompt.txt; SHA256: d4833d060f013e64de325e3fd381c116d5fb034b6e7bb78ed01811b379b7215b. Sinh bằng vohon-prompt.mjs, không thêm addendum.
- Công cụ: builtin image_gen.imagegen; model/seed unknown.
- Neo phong cách: concept Hạo Thiên lượt 2, PR #1083; không dùng ảnh cũ.
- Kiểm RAW: NHẸ (texture mềm, chưa đúng lưới); tách đủ 5 hình, chênh cỡ 1,05×, màu khớp 73%.
- Duyệt mắt: 5 góc thật s/se/e/ne/n; e hơi chếch; ne còn lộ cạnh mõm nhưng không mắt, n không lộ mặt. Mắt vàng chanh tách thân lục; khí độc sáng khá rộng, vảy và trang trí còn nhỏ. Không chữ, người, khung. Chưa phải phê duyệt chính thức.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| art/src/vohon-v2/bich_lan_xa_hoang/ | - | builtin image_gen.imagegen (ChatGPT / Codex) | RAW concept năm hướng Bích Lân Xà Hoàng; model/seed unknown; prompt và SHA ở trên. | 2026-10-27 | Chỉ concept, chưa nhập game. |

## Kết quả kiểm RAW tại repo

- Bản chọn: concept-attempt1.png; kích thước 1983×793.
- vohon-check raw: **NHẸ**, tách đủ **5 hình**, chênh cỡ 1.05×, màu khớp **73%**.
- Cảnh báo máy: texture mềm, chưa đúng lưới khối.
- Ảnh neo nằm ở **nhánh PR #1083**, đường dẫn art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png, chưa phải ảnh sẵn có trên main.
- Dùng --type phaptuong theo khuôn concept #1096 để sinh bố cục năm hướng; không tạo pháp tướng thay thế hoặc nhập game.

## Khai báo --eye theo quyết định ở PR #1147

Không sinh thêm; giữ bản chọn nêu trên. Concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý khi làm phụ thể với hình nộm. Công cụ võ hồn chưa nhận cờ --eye; các khai báo dưới đây được lưu tường minh và đồng bộ trong trường eye của source.json, không phải lệnh đã chạy.

- `--eye "concept-attempt1=hướng — se/e — hai góc gần giống nhau, e còn chếch trước"`
  LỖI: hướng — se/e — hai góc gần giống nhau, e còn chếch trước (mắt).
- `--eye "concept-attempt1=hướng — ne — còn lộ cạnh mõm; n nhìn lưng"`
  LỖI: hướng — ne — còn lộ cạnh mõm; n nhìn lưng (mắt).

## Chân dung lượt 1 — #1158

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `portrait-attempt1.png`, SHA256 `b10fbcbda54c9fe2d1fff908c35ab48f9c5c8a8eaf23f976742be6fc748a5c78`. Prompt CLI nguyên văn `portrait-attempt1.prompt.txt`, SHA256 `0020794298e911c1a84143d2259fe2e8a1a392b075df4158d1b0c52859ad540a`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt1.png`, SHA256 `dbb1002c01e3a0e541c3b385405b4db54225735ed5e549aac983e4a1f1a94a56`. Hồ sơ lệnh và kết quả kiểm: `portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `portrait-attempt1-P1c/bich_lan_xa_hoang-portrait.png`, 64×64, 7 màu, giữ 7/8 điểm sáng. Xem `portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — chính diện; sừng chạm/cắt mép trên, dải khí và ngọc xanh rộng tranh điểm nhấn mắt, chi tiết vảy nhiều"
```
