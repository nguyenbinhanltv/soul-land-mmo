# ta_hoa_phuong_hoang — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. 3/3 lượt. RAW giữ nguyên byte, không hậu kỳ, không nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong` và `--style-ref` ảnh Hạo Thiên lượt 2 đã duyệt từ PR #1083. Chỉ ảnh neo này được gửi; không dùng lượt hỏng làm tham chiếu.

## Đánh giá

**Chọn làm tham chiếu ngoại hình theo quyết định mới ở PR #1145; chưa phải phụ thể đạt năm hướng.** Lượt 1: ne lộ mặt, mép cánh bị cắt. Lượt 2: ne lộ mặt, cánh chạm nhau. Lượt 3: ne quay trái và lộ mắt, s hơi nghiêng, se/e gần nhau; chỉ khoảng 3 góc thật đúng yêu cầu. n nhìn lưng đúng. Màu đỏ thẫm/cam, ngực tối và lõi sáng nhận ra; chi tiết lông còn dày (nhẹ), thiếu vòng lửa. Không đạt bộ 5 góc.

- Lượt 1: `candidates/concept-attempt1.png`; SHA256 ảnh `46fe177f95662f388bf95b16bbae70d1093813dcf00e78c3f3c1d0f6e0f9daa6`; SHA256 prompt `b6f64c59cf895006d4afee9d4035bde8437844e1a76c2f0e00605f10cd27e3ad`.
- Lượt 2: `candidates/concept-attempt2.png`; SHA256 ảnh `86c74333a021f236522f4ad01816a12e57b4af3da884335cdc2dd3f47297e0c7`; SHA256 prompt `b6f64c59cf895006d4afee9d4035bde8437844e1a76c2f0e00605f10cd27e3ad`.
- Lượt 3: `concept-attempt3.png`; SHA256 ảnh `afbfb627a42f3f956e6749b8a92809610a700592fda556459c294f30c76d1373`; SHA256 prompt `b6f64c59cf895006d4afee9d4035bde8437844e1a76c2f0e00605f10cd27e3ad`.

Bản tốt nhất để tham chiếu ngoại hình: `concept-attempt3.png` (lượt 3), đã chọn ở thư mục chính với trạng thái `selected_appearance_reference`. Lượt 1 và 2 ở `candidates` để đối chiếu. Các lỗi còn lại của lượt 3 giữ ở mục khai báo duyệt mắt; chưa duyệt làm phụ thể năm hướng. Mỗi lượt có prompt và source JSON kèm theo. Không có NGUON phụ.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/ta_hoa_phuong_hoang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |

## Khai báo duyệt mắt (`--eye`)

Công cụ vohon-check hiện không có cờ `--eye`; các khai báo dưới đây dùng cùng khuôn lỗi mắt, không chạy bộ kiểm hồn thú cho võ hồn.

```text
--eye "concept-attempt3=hướng — ne — quay trái và lộ mắt; s hơi nghiêng; se/e gần nhau"
--eye "concept-attempt3=chi tiết — cánh — lông còn dày, thiếu vòng lửa"
```

```text
LỖI: concept-attempt3 — hướng — ne — quay trái và lộ mắt; s hơi nghiêng; se/e gần nhau (mắt)
LỖI: concept-attempt3 — chi tiết — cánh — lông còn dày, thiếu vòng lửa (mắt)
```

Theo quyết định ở PR #1145: concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý ở khâu phụ thể bằng hình nộm. Giữ nguyên kết quả kiểm RAW và mọi lỗi đã quan sát, không coi ảnh này là sheet năm hướng dùng trực tiếp. SHA256 ảnh và prompt không đổi khi chuyển vị trí.

## Chân dung `portrait-attempt2.png` — chỉ làm ảnh neo phong cách (từ PR #1083, #1024)

`portrait-attempt2.png`: 1254×1254, 2,358,606 byte, SHA256 `dd0fdb1cfeb6042cc1a2ed6f0a6c7a254005120e1eaab3fb575ca917ec7ad85f`; prompt `portrait-attempt2.prompt.txt`, SHA256 `388098da53684f73bc5ec42c768dfdc97e192234e82c4ba3179fb5a30076d89d`; nguồn `portrait-attempt2.source.json`. RAW, builtin `image_gen.imagegen`, model/seed unknown, ngày 2026-10-27.

**Chưa đạt làm chân dung cuối: thiếu tương phản** khi thu về 64×64 (lông / quầng sáng / nền đỏ cam hòa vào nhau, mắt lẫn đạo văn; texture mềm). Chỉ giữ làm ảnh neo phong cách (đã dùng làm style ref cho concept Hạo Thiên Chùy); không nhập game, không tạo icon / thẻ từ ảnh này. Lượt 1 (FAIL) không đưa vào. Muốn vẽ lại thì làm lượt 3/3 sau lô H4 đầu tiên.

## Chân dung lượt 3/3 — chưa đạt bản cuối, dừng sinh

Ngày 2026-10-27: đúng một lần gọi builtin image_gen.imagegen, model/seed unknown. RAW `portrait-attempt3.png` giữ nguyên byte, SHA256 đối chiếu bản gốc `48819bdc5430b610f3bdcd42dc326e2230583e696d03af477fbf811e97115af3`. Prompt `portrait-attempt3.prompt.txt` sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type portrait --id ta_hoa_phuong_hoang --style-ref art/src/vohon-v2/ta_hoa_phuong_hoang/portrait-attempt2.png`, SHA256 `8e02eb71065d5ab41f41a189d1b6ca8e9d8e73ba6c6e19fa9507db8f4d33c77b`. Không sửa tay, không addendum; ảnh neo lượt 2 theo yêu cầu. Hồ sơ: `portrait-attempt3.source.json`.

RAW NHẸ: texture mềm, chưa đúng lưới; màu đúng họ, giữ 8/8 điểm sáng. P1c dùng tên CLI `--preset portrait` (không có preset tên P1c), lưu ở `candidates/portrait-attempt3-P1c/`: 64×64, 6 màu, tương phản 0.196, mật độ biên 0.296, sep 50.1, giữ 7/8 điểm sáng; NHẸ `nen-chu-the`, bgRatio 1.17 < 1.4. Xem `candidates/portrait-attempt3-P1c/preview/index.html` và `so-sanh.png`.

Duyệt mắt: đúng hung điểu, mắt/mỏ còn đọc được nhưng lông và đạo văn rối ở 64×64. Nền tím lạnh, chủ thể đỏ/cam; vùng sáng ngoài mặt còn nhiều. Chưa đạt góc nghiêng và 3–5 lưỡi lông lớn. Prompt CLI yêu cầu facing the viewer; giữ nguyên theo luật không viết tay, khai rõ sai lệch. Chưa đạt bản cuối, không nhập game. Đã hết 3/3 lượt chân dung, không sinh tiếp.

Công cụ vohon:check không hỗ trợ --eye; khai cùng khuôn tại đây:

```text
--eye "portrait-attempt3=góc nhìn — đầu — gần chính diện, chưa đạt góc nghiêng"
--eye "portrait-attempt3=chi tiết — lông/đạo văn — nhiều nhánh nhỏ, chưa đạt 3–5 lưỡi lớn; rối ở 64×64"
--eye "portrait-attempt3=tương phản — nền/chủ thể — bgRatio 1.17; chưa đạt bản cuối"
```

## Icon lượt 1 — #1159, chưa nhập game

Ngày 2026-10-27. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW giữ nguyên byte: `icon-attempt1.png`, SHA256 `fd69806e9aaa3b27217e40e54d95d759cf14c1fa9bb2277d0b0bbe38d32262f2`; prompt tự sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type icon --id ta_hoa_phuong_hoang --style-ref art/src/vohon-v2/ta_hoa_phuong_hoang/concept-attempt3.png`, SHA256 `7b410360e457cc9c572a9ee82a8ce406b4acf5a51ef2b02b0fbbab7110fe9120`. Ảnh neo ngoại hình: `concept-attempt3.png`. Không viết tay prompt, không dùng lượt hỏng làm ảnh neo. Hồ sơ: `icon-attempt1.source.json`.

Chuyển bằng `vohon-pixelize --type icon --preset icon --colors 8 --merge 24 --passes 2 --protect on`. Bản 24/32 px ở `icon-attempt1-pixel/`; báo cáo JSON kèm từng ảnh. Đây là ứng viên cần duyệt, không tự tuyên bố đạt đẹp.

RAW: NHẸ; số đo `{"w":1254,"h":1254,"ratio":1,"border":{"clear":1,"flat70":0},"fill":0.89,"softness":0.871,"bigColors":90,"grid":{"period":28,"ratio":1.3},"paletteMatch":1,"smallAccent":"8/8"}`.

32px: NHẸ; số đo `{"w":32,"h":32,"colors":8,"outline":1,"hot":0.136,"contrast":0.196,"edge":0.523,"sep":32.4,"bgRatio":1.08,"accent":"8/8"}`.

24px: NHẸ; số đo `{"w":24,"h":24,"colors":7,"outline":1,"hot":0.161,"contrast":0.218,"edge":0.565,"sep":27.3,"bgRatio":1.21,"accent":"8/8"}`.

### Khai báo duyệt mắt icon (`--eye`)

CLI vohon:check chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên kết quả máy.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 87% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.3 ở chu kỳ 28 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (2 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.523 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32px — gan-mau — hai màu lớn chỉ cách nhau 32.4 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (2 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.565 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — gan-mau — hai màu lớn chỉ cách nhau 27.3 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=duyệt mắt — Đầu chim đúng họ đỏ/cam; nhiều nhánh lửa, mắt lẫn lửa ở 24 px, chưa đạt đọc nhanh."
```


## Icon lượt 2 — #1159, chưa nhập game

Ngày 2026-10-27. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW giữ nguyên byte: `icon-attempt2.png`, SHA256 `31810e24bcde97396dfbea6180ddb36b0131e93ee17963f9345ebda29c4a8f4f`; prompt tự sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type icon --id ta_hoa_phuong_hoang --style-ref art/src/vohon-v2/ta_hoa_phuong_hoang/concept-attempt3.png`, SHA256 `7b410360e457cc9c572a9ee82a8ce406b4acf5a51ef2b02b0fbbab7110fe9120`. Ảnh neo ngoại hình: `concept-attempt3.png`. Không viết tay prompt, không dùng lượt hỏng làm ảnh neo. Hồ sơ: `icon-attempt2.source.json`.

Chuyển bằng `vohon-pixelize --type icon --preset icon --colors 8 --merge 24 --passes 2 --protect on`. Bản 24/32 px ở `icon-attempt2-pixel/`; báo cáo JSON kèm từng ảnh. Đây là ứng viên cần duyệt, không tự tuyên bố đạt đẹp.

RAW: NHẸ; số đo `{"w":1254,"h":1254,"ratio":1,"border":{"clear":1,"flat70":0},"fill":0.92,"softness":0.873,"bigColors":93,"grid":{"period":36,"ratio":1.13},"paletteMatch":0.99,"smallAccent":"7/8"}`.

32px: NHẸ; số đo `{"w":32,"h":32,"colors":7,"outline":1,"hot":0,"contrast":0.145,"edge":0.476,"sep":26.4,"bgRatio":1.17,"accent":"0/8"}`.

24px: NHẸ; số đo `{"w":24,"h":24,"colors":5,"outline":1,"hot":0,"contrast":0.149,"edge":0.449,"sep":23.9,"bgRatio":1.24,"accent":"0/8"}`.

### Khai báo duyệt mắt icon (`--eye`)

CLI vohon:check chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên kết quả máy.

```text
--eye "icon-attempt2=RAW — mem — texture mềm: 87% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt2=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.13 ở chu kỳ 36 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt2=32px — cham-mep — hình chạm mép ảnh (16 điểm): viền ngoài bị cắt"
--eye "icon-attempt2=32px — mat-sang — vùng sáng chỉ 0.0%: mất điểm sáng (mắt, lõi, lưỡi), hình sẽ tối đặc"
--eye "icon-attempt2=32px — nhieu-chi-tiet — mật độ biên 0.476 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt2=32px — gan-mau — hai màu lớn chỉ cách nhau 26.4 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt2=32px — mat-mat-mo — chỉ còn 0/8 điểm sáng của ảnh nguồn (mắt, mỏ, lõi): có thể mất mắt / mỏ ở cỡ này; thử cắt gần hơn (--zoom / --crop) hoặc bản đơn giản hơn"
--eye "icon-attempt2=24px — cham-mep — hình chạm mép ảnh (15 điểm): viền ngoài bị cắt"
--eye "icon-attempt2=24px — mat-sang — vùng sáng chỉ 0.0%: mất điểm sáng (mắt, lõi, lưỡi), hình sẽ tối đặc"
--eye "icon-attempt2=24px — nhieu-chi-tiet — mật độ biên 0.449 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt2=24px — gan-mau — hai màu lớn chỉ cách nhau 23.9 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt2=24px — mat-mat-mo — chỉ còn 0/8 điểm sáng của ảnh nguồn (mắt, mỏ, lõi): có thể mất mắt / mỏ ở cỡ này; thử cắt gần hơn (--zoom / --crop) hoặc bản đơn giản hơn"
--eye "icon-attempt2=duyệt mắt — Đầu chim với mỏ móc và mào lửa; đối chiếu mắt ở 24 px, chưa tự duyệt đạt đẹp."
```

Chọn icon lượt 1 trong 2 lượt. Lượt 2 ở candidates/icon-attempt2.* và candidates/icon-attempt2-pixel/: mất điểm sáng, chỉ 5 màu ở 24 px. Lượt 1 giữ 8/8 điểm sáng nhưng chưa đạt đọc nhanh ở 24 px; các lỗi chỉ khai --eye, chưa nhập game.


### Hồ sơ icon để review

Số lượt icon: 2/3; chọn lượt 1 để trình duyệt. Lượt 2 bị loại ở candidates/. Không phải bản đã duyệt nhập game. Xem `icon-attempt1-pixel/preview/index.html` và `icon-attempt1-pixel/preview/so-sanh.png`.

SHA256 prompt trong mục icon tính trên UTF-8, xuống dòng LF, không xuống dòng cuối file; `sent_prompt` và `sent_prompt_sha256` trong source JSON giữ đúng chuỗi đã gửi công cụ (kể cả xuống dòng gốc). So sánh với đầu ra CLI sau chuẩn hóa CRLF/LF: trùng nguyên nội dung, không addendum.
