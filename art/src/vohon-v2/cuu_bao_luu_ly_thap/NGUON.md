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
| `art/src/vohon-v2/cuu_bao_luu_ly_thap/candidates/portrait-attempt1.*` và `portrait-attempt1-P1c2/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Chân dung lô 3 #1158; prompt CLI nguyên văn, RAW + pixel preset portrait2; model/seed unknown. | 2026-10-27 | 1/3 lượt, ứng viên chưa duyệt, không nhập game; SHA256 và --eye bên dưới. |

## Các lượt không chọn

- Lượt 1: candidates/concept-attempt1.png; SHA256 ảnh 94fa37bde2192b49725411937db11293b3a2648a8334c640d280cb44dd969f9c; prompt 1dba2a719e3481ad814b75177ef2acf8ed5d5213c452cad9aa0651b2bc009984. Khoảng 7 tầng mái rõ, chưa đủ chín tầng; nét khắc dày, bệ đá thêm ngoài hình mẫu. Giữ làm ứng viên, không chọn.
- Lượt 2: candidates/concept-attempt2.png; SHA256 ảnh 1f50910119a0ea9acdcee04b29cc743a0ceb3bc19d47e76ebe756565bc0266e9; prompt 1dba2a719e3481ad814b75177ef2acf8ed5d5213c452cad9aa0651b2bc009984. Tầng mái rõ hơn lượt 1 nhưng tầng đáy chưa đọc chắc là chín tầng; vòng pháp luân dày, ne còn gần e. Giữ làm ứng viên.

Prompt trong repo chuẩn hóa xuống dòng LF đúng byte Git; SHA trước chuẩn hóa CRLF giữ trong source JSON. Nội dung prompt tự sinh không sửa.


## Đợt vẽ lại #1161 — attempt4–6

Đã dùng đủ **3/3 lượt MỚI**, tổng cộng 6 lượt lịch sử. **Không chọn lượt nào: CHẶN thiếu chín tầng ở từng hướng.** Giữ nguyên attempt1–3. Không nhập game. Ngày 2026-10-27.

Prompt nguyên bản từ `node tools/assets/vohon-prompt.mjs --type phaptuong --id cuu_bao_luu_ly_thap --out <thư mục ngoài repo>`; không thêm addendum, không sửa công cụ; không ảnh dẫn, không dùng lượt hỏng làm tham chiếu. Generator hiện không nạp lessons cho loại phaptuong, nên không thêm dòng lessons vô hiệu. Model/seed unknown; công cụ builtin `image_gen.imagegen`; RAW nguyên byte.

Đếm bằng mắt các thân tầng dưới mái, từ dưới lên; không tính chóp, bệ, pháp luân là tầng. Khoảng 3 góc thật cho tháp gần đối xứng.

- Lượt 4: `candidates/concept-attempt4.png`; s=8 rõ + mái chóp chưa chắc; se=8 rõ + mái chóp chưa chắc; e=8 rõ + mái chóp chưa chắc; ne=8 rõ + mái chóp chưa chắc; n=8 rõ + mái chóp chưa chắc. SHA256 ảnh `64cad59a74778d41b61f5bd9dd9bec41da14686c1aabb5ee9ea4aed959844bd0`; prompt `c1984bbfd398d4b06d36c5a2e0c54160e52d1b9a71fc946a71b663ccfa6e5fba`. CHẶN thiếu tầng.
  Khai `--eye "concept-attempt4=hướng / hình — ne/n còn lộ bảo quang và chi tiết mặt tương tự mặt trước; chỉ khai lỗi mắt, không dùng làm điều kiện sinh thêm."` (công cụ chưa hỗ trợ cờ; lưu khai báo, không thay kết quả máy).

- Lượt 5: `candidates/concept-attempt5.png`; s≈8; se≈8; e≈8; ne≈8; n≈8 (vòng che thân tầng thấp). SHA256 ảnh `c1a1e5cccd574298c09e5715a39ea3ca105dc9c2427c79f91ed1be7760fc6c04`; prompt `c1984bbfd398d4b06d36c5a2e0c54160e52d1b9a71fc946a71b663ccfa6e5fba`. CHẶN thiếu tầng.
  Khai `--eye "concept-attempt5=hướng / hình — ne/n còn lộ bảo quang và chi tiết mặt tương tự mặt trước; chỉ khai lỗi mắt, không dùng làm điều kiện sinh thêm."` (công cụ chưa hỗ trợ cờ; lưu khai báo, không thay kết quả máy).

- Lượt 6: `candidates/concept-attempt6.png`; s≈6; se≈6; e≈6; ne≈6; n≈6 (thân dưới dài không chia tầng rõ). SHA256 ảnh `2171615441fa252ca837aa1babe367799e358cdfb0656158f60c187d57f881ae`; prompt `c1984bbfd398d4b06d36c5a2e0c54160e52d1b9a71fc946a71b663ccfa6e5fba`. CHẶN thiếu tầng.
  Khai `--eye "concept-attempt6=hướng / hình — ne/n còn lộ bảo quang và chi tiết mặt tương tự mặt trước; chỉ khai lỗi mắt, không dùng làm điều kiện sinh thêm."` (công cụ chưa hỗ trợ cờ; lưu khai báo, không thay kết quả máy).

Lượt 4 gần yêu cầu nhất nhưng mái sát chóp không có thân tầng đọc chắc, không công nhận chín tầng. Lượt 5 vòng dày che tầng; lượt 6 bệ đá quá lớn và số tầng giảm. Dừng sau ba lượt theo giao việc; cần đợt mới được giao riêng nếu tiếp tục.

### Kiểm RAW đợt #1161

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


## Chân dung lô 3 — #1158, P1c2

Ngày 2026-10-27; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `4205c4ce17443eafdebd691e504768ec5b4e16436b2858e57546120d533e5d79`. Prompt nguyên văn từ CLI, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`, SHA256 `9e16ebd749f40f6e47a18cc8febbf44f246f2c7a6c916a56b9bb9bd60d108d2f`. Prompt lưu UTF-8 LF; chuỗi gửi gốc và SHA256 giữ trong `candidates/portrait-attempt1.source.json`, chỉ chuẩn hoá xuống dòng.

Ảnh neo: `art/src/vohon-v2/cuu_bao_luu_ly_thap/candidates/concept-attempt4.png`, SHA256 `64cad59a74778d41b61f5bd9dd9bec41da14686c1aabb5ee9ea4aed959844bd0`. Dùng lượt 4 tốt nhất trong candidates theo đánh giá đợt #1161; concept vẫn CHẶN thiếu chín tầng, chưa được chọn hay duyệt. Đây là ngoại lệ ảnh neo do chủ repo giao riêng cho lô 3. 

Pixel hoá `--preset portrait2` đã duyệt, giữ mặc định 16 màu (brief RAW 6–8 mảng màu); bản `candidates/portrait-attempt1-P1c2/cuu_bao_luu_ly_thap-portrait.png`. Xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Kết quả máy RAW/P1c2 và lệnh tái tạo trong source JSON, báo cáo pixel kèm thư mục. Chỉ ứng viên trình duyệt, **chưa duyệt, không nhập game**; không chọn thay concept.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI chưa nhận cờ `--eye`; lưu khai báo tường minh, giữ nguyên kết quả máy và RAW.

```text
--eye "portrait-attempt1=RAW/P1c2 — Cận phần trên tháp, không đọc đủ chín tầng; mái và bảo quang nhận ra, nhiều chi tiết nhỏ. P1c2 thân tối gần vòng ngoài, điểm sáng màu còn rõ; chưa đạt đầy đủ đặc tả, giữ candidate."
```


## Icon lô 3 — #1159, RAW nearest 24/32 px

Ngày 2026-10-28; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/icon-attempt1.png`, SHA256 `463d68d11d4a58095f11882d543100432c22be85fa8ff6205a5930f62f5e32a3`. Prompt CLI nguyên nội dung, không viết tay / addendum: `candidates/icon-attempt1.prompt.txt`, SHA256 `9f675b692ecc68aeeae7bf772ed46527c115db5c00c289f5f72fd75f61934d0d` (UTF-8 LF, file có xuống dòng cuối; chuỗi gửi bỏ xuống dòng cuối lưu trong source JSON).

Ảnh neo theo chỉ định lô 3: `art/src/vohon-v2/cuu_bao_luu_ly_thap/candidates/concept-attempt3.png`, SHA256 `067900bfcfa13d852e79c0d692c19c339406670fc037c13eb96cc37921fd88f4`; chỉ tham chiếu ngoại hình, không xác nhận concept đã đạt năm hướng. Hồ sơ đầy đủ và kết quả máy: `candidates/icon-attempt1.source.json`. Chuyển bằng preset `icon-nearest`: bỏ nền, cắt hộp bao, nearest-neighbor, viền mặc định; giữ màu RAW, không ép 8 màu. Bản 24/32 và báo cáo tại `candidates/icon-attempt1-nearest/`; xem [trang so sánh](candidates/icon-attempt1-nearest/preview/index.html).

Ứng viên trình duyệt, chưa duyệt nhập game. Lỗi còn lại chỉ khai dưới đây, không sửa RAW.

### Khai báo duyệt mắt icon (`--eye`)

CLI chưa nhận cờ `--eye`; giữ nguyên kết quả máy và lưu khai báo tường minh:

```text
--eye "icon-attempt1=24 — nhieu-chi-tiet — mật độ biên 0.932 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32 — nhieu-chi-tiet — mật độ biên 0.941 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=raw — mem — texture mềm: 77% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=raw — nhieu-mau — 267 màu đáng kể (nên ≤ 160 để ép về ≤ 32 mà không bệt)"
--eye "icon-attempt1=raw — luoi — chưa đúng lưới khối: tỉ số biên 1.38 ở chu kỳ 35 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=raw — lech-mau — 30% điểm sáng cùng họ màu robe / col của cuu_bao_luu_ly_thap (mục 4 cần ≥ 50%)"
--eye "icon-attempt1=duyệt mắt — Tháp lam tối, bảo quang nhiều màu và chóp vàng còn nhận ra; có vòng khí cùng chuông nhỏ làm hình rối ở 24 px; chỉ đọc chắc tám mái, chưa xác nhận chín tầng, cần chủ repo duyệt."
```

### Ghi công icon

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/cuu_bao_luu_ly_thap/candidates/icon-attempt1.*` và `candidates/icon-attempt1-nearest/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) + vohon-pixelize icon-nearest | Icon lô 3 #1159; prompt CLI nguyên văn, concept riêng làm neo; model/seed unknown. | 2026-10-28 | 1/3 lượt; ứng viên chưa duyệt, không nhập game; SHA256 ở trên. |


**Kết luận icon:** 1/3 lượt, chưa chọn bản cuối vì chưa đọc chắc chín tầng và hình còn nhiều chi tiết; giữ để đối chiếu. Toàn bộ hồ sơ icon ở `candidates/`, không có NGUON phụ; lỗi còn lại chỉ khai `--eye`, không sửa RAW.
