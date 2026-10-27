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


## ??t v? l?i #1161 ? attempt4?6

?? d?ng ?? **3/3 l??t M?I**, t?ng c?ng 6 l??t l?ch s?. **Kh?ng ch?n l??t n?o: CH?N thi?u ch?n t?ng ? t?ng h??ng.** Gi? nguy?n attempt1?3. Kh?ng nh?p game. Ng?y 2026-10-27.

Prompt nguy?n b?n t? `node tools/assets/vohon-prompt.mjs --type phaptuong --id cuu_bao_luu_ly_thap --out <th? m?c ngo?i repo>`; kh?ng th?m addendum, kh?ng s?a c?ng c?; kh?ng ?nh d?n, kh?ng d?ng l??t h?ng l?m tham chi?u. Generator hi?n kh?ng n?p lessons cho lo?i phaptuong, n?n kh?ng th?m d?ng lessons v? hi?u. Model/seed unknown; c?ng c? builtin `image_gen.imagegen`; RAW nguy?n byte.

??m b?ng m?t c?c th?n t?ng d??i m?i, t? d??i l?n; kh?ng t?nh ch?p, b?, ph?p lu?n l? t?ng. Kho?ng 3 g?c th?t cho th?p g?n ??i x?ng.

- L??t 4: `candidates/concept-attempt4.png`; s=8 r? + m?i ch?p ch?a ch?c; se=8 r? + m?i ch?p ch?a ch?c; e=8 r? + m?i ch?p ch?a ch?c; ne=8 r? + m?i ch?p ch?a ch?c; n=8 r? + m?i ch?p ch?a ch?c. SHA256 ?nh `64cad59a74778d41b61f5bd9dd9bec41da14686c1aabb5ee9ea4aed959844bd0`; prompt `c1984bbfd398d4b06d36c5a2e0c54160e52d1b9a71fc946a71b663ccfa6e5fba`. CH?N thi?u t?ng.
  Khai `--eye "concept-attempt4=h??ng / h?nh ? ne/n c?n l? b?o quang v? chi ti?t m?t t??ng t? m?t tr??c; ch? khai l?i m?t, kh?ng d?ng l?m ?i?u ki?n sinh th?m."` (c?ng c? ch?a h? tr? c?; l?u khai b?o, kh?ng thay k?t qu? m?y).

- L??t 5: `candidates/concept-attempt5.png`; s?8; se?8; e?8; ne?8; n?8 (v?ng che th?n t?ng th?p). SHA256 ?nh `c1a1e5cccd574298c09e5715a39ea3ca105dc9c2427c79f91ed1be7760fc6c04`; prompt `c1984bbfd398d4b06d36c5a2e0c54160e52d1b9a71fc946a71b663ccfa6e5fba`. CH?N thi?u t?ng.
  Khai `--eye "concept-attempt5=h??ng / h?nh ? ne/n c?n l? b?o quang v? chi ti?t m?t t??ng t? m?t tr??c; ch? khai l?i m?t, kh?ng d?ng l?m ?i?u ki?n sinh th?m."` (c?ng c? ch?a h? tr? c?; l?u khai b?o, kh?ng thay k?t qu? m?y).

- L??t 6: `candidates/concept-attempt6.png`; s?6; se?6; e?6; ne?6; n?6 (th?n d??i d?i kh?ng chia t?ng r?). SHA256 ?nh `2171615441fa252ca837aa1babe367799e358cdfb0656158f60c187d57f881ae`; prompt `c1984bbfd398d4b06d36c5a2e0c54160e52d1b9a71fc946a71b663ccfa6e5fba`. CH?N thi?u t?ng.
  Khai `--eye "concept-attempt6=h??ng / h?nh ? ne/n c?n l? b?o quang v? chi ti?t m?t t??ng t? m?t tr??c; ch? khai l?i m?t, kh?ng d?ng l?m ?i?u ki?n sinh th?m."` (c?ng c? ch?a h? tr? c?; l?u khai b?o, kh?ng thay k?t qu? m?y).

L??t 4 g?n y?u c?u nh?t nh?ng m?i s?t ch?p kh?ng c? th?n t?ng ??c ch?c, kh?ng c?ng nh?n ch?n t?ng. L??t 5 v?ng d?y che t?ng; l??t 6 b? ?? qu? l?n v? s? t?ng gi?m. D?ng sau ba l??t theo giao vi?c; c?n ??t m?i ???c giao ri?ng n?u ti?p t?c.


### Ki?m RAW ??t #1161

```text
raw concept-attempt4.png pháp tướng (cuu_bao_luu_ly_thap): NHẸ
  [NHẸ] mem: texture mềm: 68% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] nhieu-mau: 265 màu đáng kể (nên ≤ 160 để ép về ≤ 48 mà không bệt)
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.11 ở chu kỳ 38 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  [NHẸ] lech-mau: 44% điểm sáng cùng họ màu robe / col của cuu_bao_luu_ly_thap (mục 4 cần ≥ 50%)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.01,"softness":0.684,"bigColors":265,"grid":{"period":38,"ratio":1.11},"paletteMatch":0.44}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

```text
raw concept-attempt5.png pháp tướng (cuu_bao_luu_ly_thap): NHẸ
  [NHẸ] mem: texture mềm: 64% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] nhieu-mau: 278 màu đáng kể (nên ≤ 160 để ép về ≤ 48 mà không bệt)
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.09 ở chu kỳ 27 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  [NHẸ] lech-mau: 45% điểm sáng cùng họ màu robe / col của cuu_bao_luu_ly_thap (mục 4 cần ≥ 50%)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.01,"softness":0.643,"bigColors":278,"grid":{"period":27,"ratio":1.09},"paletteMatch":0.45}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

```text
raw concept-attempt6.png pháp tướng (cuu_bao_luu_ly_thap): NHẸ
  [NHẸ] mem: texture mềm: 74% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] nhieu-mau: 227 màu đáng kể (nên ≤ 160 để ép về ≤ 48 mà không bệt)
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.11 ở chu kỳ 38 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  [NHẸ] lech-mau: 49% điểm sáng cùng họ màu robe / col của cuu_bao_luu_ly_thap (mục 4 cần ≥ 50%)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.01,"softness":0.747,"bigColors":227,"grid":{"period":38,"ratio":1.11},"paletteMatch":0.49}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```
