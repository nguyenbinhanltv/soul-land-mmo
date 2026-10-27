# quy_mi — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id quy_mi --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: 4 đúng yêu cầu; ne còn lộ mắt. ne nhìn lưng nhưng vẫn lộ một khe mắt; n đúng nhìn lưng. Không sinh thêm chỉ để sửa ne/n. Thân tím lam tối, viền khí sáng, sừng và vuốt dài, ấn ngực và bóng quỷ đúng hình mẫu; khói ngoài chạm mép trái/phải, s/e hơi nghiêng. Chọn tham chiếu ngoại hình, chưa đạt trọn năm góc.

Chọn `concept-attempt1.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `fee15ae75afe1304660c480d2ffad5053d47b42da89338c4c32111119c11b7dc`. SHA256 prompt: `d9bbebddebb28f0339cccb83b614b09069b93ca9a443af87bbb7b95556933937`.

## Kiểm RAW

```text
raw concept-attempt1.png pháp tướng (quy_mi): NHẸ
  [NHẸ] mem: texture mềm: 92% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.13 ở chu kỳ 34 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.02,"softness":0.922,"bigColors":88,"grid":{"period":34,"ratio":1.13},"paletteMatch":0.97}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo theo khuôn, không thay kết quả máy:

```text
--eye "concept-attempt1=hướng / hình — ne nhìn lưng nhưng vẫn lộ một khe mắt; n đúng nhìn lưng. Không sinh thêm chỉ để sửa ne/n. Thân tím lam tối, viền khí sáng, sừng và vuốt dài, ấn ngực và bóng quỷ đúng hình mẫu; khói ngoài chạm mép trái/phải, s/e hơi nghiêng. Chọn tham chiếu ngoại hình, chưa đạt trọn năm góc."
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/quy_mi/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. |2026-10-27; chân dung lô 2 RAW/P1c2 #1158, 1/3 lượt. | Chưa duyệt, không nhập game. |

Prompt trong repo chuẩn hóa xuống dòng LF đúng byte Git; SHA trước chuẩn hóa CRLF giữ trong source JSON. Nội dung prompt tự sinh không sửa.


## Chân dung lô 2 — #1158, P1c2

Ngày 2026-10-27; 1/3 lượt chân dung. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte: `candidates/portrait-attempt1.png`; SHA256 `5ceaeb0dd7d1fcc35b470234bc4555e8e945688c61629493e5e28bb67eda0d09`. Prompt CLI nguyên văn, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`; SHA256 `79cbfb81137a1e8b05579d9ba5d58fabf3584cd01c8e76031548cf581a362ed0`. Neo ngoại hình `concept-attempt1.png`, SHA256 `fee15ae75afe1304660c480d2ffad5053d47b42da89338c4c32111119c11b7dc`. Lệnh và kết quả máy ở `candidates/portrait-attempt1.source.json`.

Pixel hoá bằng `--preset portrait2` (P1c2 đã duyệt 27/10), giữ mặc định 16 màu của preset; brief RAW 6–8 mảng màu không phải giới hạn bảng màu P1c2. Bản 64×64: `candidates/portrait-attempt1-P1c2/quy_mi-portrait.png`; xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Chỉ ứng viên trình duyệt, chưa nhập game; không chọn thay concept. Không dùng lại ảnh lỗi làm neo.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI võ hồn chưa nhận cờ này; lưu khai báo tường minh, không sửa công cụ hoặc RAW.

```text
--eye "portrait-attempt1=góc chính diện thay vì 3/4; sừng sát mép trên, khói và ấn trán sáng tranh khe mắt; nền/thân cùng gam lạnh; cần duyệt ở 64×64"
```

```text
--eye "portrait-attempt1=P1c2 — hai khe mắt giảm sáng rõ so với RAW, gần lẫn vào mặt nạ ở 64×64."
```

Prompt lưu UTF-8 LF theo Git; SHA256 chuỗi gửi nguyên bản `5d5f3e385bf0123f4fe21a9600d1ebe222d6d4d544023260eab2b339d493d886` và `sent_prompt` ở source JSON. Chỉ chuẩn hóa xuống dòng, nội dung trùng CLI.


## Icon lô 2 — RAW nearest (#1159)

Ngày 2026-10-28; builtin `image_gen.imagegen`, model/seed `unknown`. Số lượt icon **1/3**, chọn lượt 1 trình duyệt; chưa nhập game. RAW giữ nguyên byte từ công cụ.

- RAW: `icon-attempt1.png`, SHA256 `a81fd19f1d9209fea089e0a00e3ae3737e7f99bb8a53f6a1eb3d6a1df413cdb4`.
- Prompt: `icon-attempt1.prompt.txt`, SHA256 `c7dca6204be52da988ddb0a03e991c518218aeb47342abc7dce6cd0441c89c5d`; nguyên nội dung CLI `node tools/assets/vohon-prompt.mjs --type icon --id quy_mi --style-ref art/src/vohon-v2/quy_mi/concept-attempt1.png` (bỏ newline cuối stdout); không viết tay, không addendum.
- Ảnh neo: `concept-attempt1.png`, SHA256 `fee15ae75afe1304660c480d2ffad5053d47b42da89338c4c32111119c11b7dc`; không dùng ảnh cũ hay lượt hỏng.
- Nguồn chi tiết: `icon-attempt1.source.json`. Icon một góc, không áp dụng yêu cầu năm hướng của concept.
- Xuất: `node tools/assets/vohon-pixelize.mjs --type icon --id quy_mi --in art/src/vohon-v2/quy_mi/icon-attempt1.png --out art/src/vohon-v2/quy_mi/icon-attempt1-nearest --preset icon-nearest --crop 435,0,410,570`; giữ màu RAW, không ép 8 màu.
- Cặp 24/32 px và report/check JSON: `icon-attempt1-nearest/`; [xem trước](icon-attempt1-nearest/preview/index.html).

### Khai báo lỗi còn lại (`--eye`)

CLI chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên báo cáo máy. Không tự tuyên bố đạt đẹp.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 93% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.34 ở chu kỳ 35 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (61 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.921 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (45 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.895 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=duyệt mắt — RAW có cả thân và bóng phụ; nearest chỉ cắt vùng mặt nạ sừng, rìa dưới cắt ngang cổ. Khe mắt còn sáng; cần duyệt ở 24 px."
```
