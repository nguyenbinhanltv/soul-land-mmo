# cuu_bao_luu_ly_thap — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **3/3 lượt**, chưa chọn lượt nào vì CHẶN mắt; lượt 3 tốt nhất trong candidates để đối chiếu, chưa duyệt. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id cuu_bao_luu_ly_thap --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: khoảng 3; tháp gần đối xứng. Chọn tốt nhất trong 3 lượt về màu bảy sắc, chuông và silhouette. CHẶN mắt về nhận diện: chỉ đọc chắc khoảng 8 tầng mái, chưa đủ chín tầng; hết 3 lượt nên dừng. Vòng pháp luân còn dày, bệ đá thêm ngoài hình mẫu, chi tiết nhiều. Chưa duyệt hình mẫu chín tầng; chỉ tham chiếu ngoại hình.

Chưa chọn lượt nào vì CHẶN mắt và hết 3 lượt. Lượt tốt nhất để đối chiếu: `candidates/concept-attempt3.png`, kèm prompt và source JSON cùng tên. Tháp còn treo; cần quyết định hoặc đợt sinh mới được giao riêng để đạt nhận diện chín tầng, không chuyển lỗi thiếu tầng sang bước phụ thể.

SHA256 ảnh: `067900bfcfa13d852e79c0d692c19c339406670fc037c13eb96cc37921fd88f4`. SHA256 prompt: `1dba2a719e3481ad814b75177ef2acf8ed5d5213c452cad9aa0651b2bc009984`.

## Kiểm RAW

```text
raw concept-attempt3.png pháp tướng (cuu_bao_luu_ly_thap): NHẸ
  [NHẸ] mem: texture mềm: 70% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] nhieu-mau: 233 màu đáng kể (nên ≤ 160 để ép về ≤ 48 mà không bệt)
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.14 ở chu kỳ 31 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  [NHẸ] lech-mau: 37% điểm sáng cùng họ màu robe / col của cuu_bao_luu_ly_thap (mục 4 cần ≥ 50%)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.01,"softness":0.707,"bigColors":233,"grid":{"period":31,"ratio":1.14},"paletteMatch":0.37}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo theo khuôn, không thay kết quả máy:

```text
--eye "concept-attempt3=hướng / hình — Chọn tốt nhất trong 3 lượt về màu bảy sắc, chuông và silhouette. CHẶN mắt về nhận diện: chỉ đọc chắc khoảng 8 tầng mái, chưa đủ chín tầng; hết 3 lượt nên dừng. Vòng pháp luân còn dày, bệ đá thêm ngoài hình mẫu, chi tiết nhiều. Chưa duyệt hình mẫu chín tầng; chỉ tham chiếu ngoại hình."
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/cuu_bao_luu_ly_thap/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |

## Các lượt không chọn

- Lượt 1: candidates/concept-attempt1.png; SHA256 ảnh 94fa37bde2192b49725411937db11293b3a2648a8334c640d280cb44dd969f9c; prompt 1dba2a719e3481ad814b75177ef2acf8ed5d5213c452cad9aa0651b2bc009984. Khoảng 7 tầng mái rõ, chưa đủ chín tầng; nét khắc dày, bệ đá thêm ngoài hình mẫu. Giữ làm ứng viên, không chọn.
- Lượt 2: candidates/concept-attempt2.png; SHA256 ảnh 1f50910119a0ea9acdcee04b29cc743a0ceb3bc19d47e76ebe756565bc0266e9; prompt 1dba2a719e3481ad814b75177ef2acf8ed5d5213c452cad9aa0651b2bc009984. Tầng mái rõ hơn lượt 1 nhưng tầng đáy chưa đọc chắc là chín tầng; vòng pháp luân dày, ne còn gần e. Giữ làm ứng viên.

Prompt trong repo chuẩn hóa xuống dòng LF đúng byte Git; SHA trước chuẩn hóa CRLF giữ trong source JSON. Nội dung prompt tự sinh không sửa.
