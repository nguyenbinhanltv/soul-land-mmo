# a_ngan — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **2/3 lượt**, chọn lượt 2 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id a_ngan --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: 5 hình, khoảng 4 góc rõ; s/se còn gần nhau. Chọn lượt 2 tốt hơn về khoảng cách và khối hoa/cổ thụ. ne/n nhìn phía sau không lộ nhụy chính; e vẫn hơi ba phần tư trước, s/se gần nhau. Dây vàng và hoa lam nhụy vàng trắng nhận ra; chi tiết vỏ cây còn dày, vài hạt sáng bị vẽ sẵn thay vì để code (nhẹ). Lượt 1 bị CHẶN máy do chỉ tách được 3 khối rễ, lưu ở candidates; không dùng ảnh hỏng làm ảnh dẫn.

Chọn `concept-attempt2.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `d510d4409629e9a0e18d02e1872cb9bc5b0b1c5e9ccceacba9e7c8c0984fd8db`. SHA256 prompt: `ce89d72abd8d5205b74b310105c3eebdd8f263f3f3e4e37dd48be68411920f41`.

## Kiểm RAW

```text
raw concept-attempt2.png pháp tướng (a_ngan): NHẸ
  [NHẸ] mem: texture mềm: 81% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] nhieu-mau: 166 màu đáng kể (nên ≤ 160 để ép về ≤ 48 mà không bệt)
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.09 ở chu kỳ 23 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  [NHẸ] lech-mau: 44% điểm sáng cùng họ màu robe / col của a_ngan (mục 4 cần ≥ 50%)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.01,"softness":0.814,"bigColors":166,"grid":{"period":23,"ratio":1.09},"paletteMatch":0.44}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo theo khuôn, không thay kết quả máy:

```text
--eye "concept-attempt2=hướng / hình — Chọn lượt 2 tốt hơn về khoảng cách và khối hoa/cổ thụ. ne/n nhìn phía sau không lộ nhụy chính; e vẫn hơi ba phần tư trước, s/se gần nhau. Dây vàng và hoa lam nhụy vàng trắng nhận ra; chi tiết vỏ cây còn dày, vài hạt sáng bị vẽ sẵn thay vì để code (nhẹ). Lượt 1 bị CHẶN máy do chỉ tách được 3 khối rễ, lưu ở candidates; không dùng ảnh hỏng làm ảnh dẫn."
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/a_ngan/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. |2026-10-27; chân dung lô 2 RAW/P1c2 #1158, 1/3 lượt. | Chưa duyệt, không nhập game. |

## Lượt không chọn

- Lượt 1: candidates/concept-attempt1.png; SHA256 ảnh e7850d3aa55dc567afa2d8a2a928fc8f7223f0d3b9f08ef64d071f84cf70f86f; SHA256 prompt ce89d72abd8d5205b74b310105c3eebdd8f263f3f3e4e37dd48be68411920f41. CHẶN máy: chỉ tách 3 khối. Thân cổ thụ lam xanh xoắn, hoa vàng trắng và dây vàng rủ đúng hình mẫu; ne còn thấy nhụy phía trước, n nhìn lưng đúng. Không có mặt sinh vật; lượt 2 sinh vì lỗi khoảng cách, không nhằm sửa ne/n. s/se/e còn gần nhau; dây rủ có chi tiết nhỏ, hình ngoài sát mép. Giữ làm ứng viên, không chọn.

Prompt trong repo chuẩn hóa xuống dòng LF đúng byte Git; SHA trước chuẩn hóa CRLF giữ trong source JSON. Nội dung prompt tự sinh không sửa.


## Chân dung lô 2 — #1158, P1c2

Ngày 2026-10-27; 1/3 lượt chân dung. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte: `candidates/portrait-attempt1.png`; SHA256 `a44d3cdf91c3c70f01c00c4d46783a5f6dcbdba16e164aacfbd59ff235f3c2c6`. Prompt CLI nguyên văn, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`; SHA256 `c8b8ed303b1ee691750aa7bd711df47bdbcd075e25c3734b185f0a2e550d63be`. Neo ngoại hình `concept-attempt2.png`, SHA256 `d510d4409629e9a0e18d02e1872cb9bc5b0b1c5e9ccceacba9e7c8c0984fd8db`. Lệnh và kết quả máy ở `candidates/portrait-attempt1.source.json`.

Pixel hoá bằng `--preset portrait2` (P1c2 đã duyệt 27/10), giữ mặc định 16 màu của preset; brief RAW 6–8 mảng màu không phải giới hạn bảng màu P1c2. Bản 64×64: `candidates/portrait-attempt1-P1c2/a_ngan-portrait.png`; xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Chỉ ứng viên trình duyệt, chưa nhập game; không chọn thay concept. Không dùng lại ảnh lỗi làm neo.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI võ hồn chưa nhận cờ này; lưu khai báo tường minh, không sửa công cụ hoặc RAW.

```text
--eye "portrait-attempt1=hoa nhìn chính diện thay vì 3/4; nhụy rõ nhưng dây vàng/giọt sáng nhiều và cạnh cành chạm mép; bố cục đối xứng, thân cùng gam nền; cần duyệt ở 64×64"
```

```text
--eye "portrait-attempt1=P1c2 — nhụy vàng còn rõ, dây và viền hoa thành nhiều đốm nhỏ."
```

Prompt lưu UTF-8 LF theo Git; SHA256 chuỗi gửi nguyên bản `8fb04497f9b836c429859575db63be74bbbb2e7569ef4d97474a19ea78de5f97` và `sent_prompt` ở source JSON. Chỉ chuẩn hóa xuống dòng, nội dung trùng CLI.


## Icon lô 2 — RAW nearest (#1159)

Ngày 2026-10-28; builtin `image_gen.imagegen`, model/seed `unknown`. Số lượt icon **1/3**, chọn lượt 1 trình duyệt; chưa nhập game. RAW giữ nguyên byte từ công cụ.

- RAW: `icon-attempt1.png`, SHA256 `e0c47f5a50bc63cfdbaed914477c0f6eed8df1763973776b15dab748e588a1cf`.
- Prompt: `icon-attempt1.prompt.txt`, SHA256 `4adf7289594598282973601f9ac352694c6d786426ef1e1fbcbe0004817be255`; nguyên nội dung CLI `node tools/assets/vohon-prompt.mjs --type icon --id a_ngan --style-ref art/src/vohon-v2/a_ngan/concept-attempt2.png` (bỏ newline cuối stdout); không viết tay, không addendum.
- Ảnh neo: `concept-attempt2.png`, SHA256 `d510d4409629e9a0e18d02e1872cb9bc5b0b1c5e9ccceacba9e7c8c0984fd8db`; không dùng ảnh cũ hay lượt hỏng.
- Nguồn chi tiết: `icon-attempt1.source.json`. Icon một góc, không áp dụng yêu cầu năm hướng của concept.
- Xuất: `node tools/assets/vohon-pixelize.mjs --type icon --id a_ngan --in art/src/vohon-v2/a_ngan/icon-attempt1.png --out art/src/vohon-v2/a_ngan/icon-attempt1-nearest --preset icon-nearest`; giữ màu RAW, không ép 8 màu.
- Cặp 24/32 px và report/check JSON: `icon-attempt1-nearest/`; [xem trước](icon-attempt1-nearest/preview/index.html).

### Khai báo lỗi còn lại (`--eye`)

CLI chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên báo cáo máy. Không tự tuyên bố đạt đẹp.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 84% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.27 ở chu kỳ 34 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=RAW — lech-mau — 30% điểm sáng cùng họ màu robe / col của a_ngan (mục 4 cần ≥ 50%)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (6 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.926 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (4 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.93 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=duyệt mắt — Hoa lam và nhụy vàng trắng nhận ra; dây vàng, hạt sáng vẽ sẵn làm nhiều chi tiết nhỏ ở 24 px."
```
