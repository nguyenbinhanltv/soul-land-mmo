# Nhu Cốt Thố — concept 5 hướng (#1096)

RAW nguyên byte từ builtin `image_gen.imagegen`; chưa crop, đổi cỡ, chuyển bảng màu hoặc nhập game. Model/seed: unknown.

## Nguồn và prompt

Prompt tự sinh bằng `node tools/assets/vohon-prompt.mjs --type phaptuong --id nhu_cot_tho --style-ref <ảnh neo đã duyệt>`; không thêm addendum. Ảnh dẫn duy nhất: concept Hạo Thiên Chùy lượt 2, PR #1083. Không dùng ảnh cũ hay lượt lỗi làm dẫn. Mỗi lượt một lần sinh độc lập với ảnh neo duy nhất.

- `candidates/concept-attempt1.png`: 2115857 byte; SHA256 `4b3c59a2f815c8638406e72bbdc7da2845dfd725217bf31ec2a0ce74fbf17db9`; prompt SHA256 `298658c86df26ae5e89544b6360c99ae3d1528e9f89fe2f0a9862fbbbc531c68`.
- `candidates/concept-attempt2.png`: 2078875 byte; SHA256 `7f2be5e3022117fb3e59ab29ff7f037e55a0c80f8e194780dbc03ba472ee3893`; prompt SHA256 `298658c86df26ae5e89544b6360c99ae3d1528e9f89fe2f0a9862fbbbc531c68`.
- `concept-attempt3.png`: 1824410 byte; SHA256 `e4d6cfb04c501f29f0bbbe1c24f04040b1c1167ab5ce2739f9e5660d12f90aa3`; prompt SHA256 `298658c86df26ae5e89544b6360c99ae3d1528e9f89fe2f0a9862fbbbc531c68`.

Công cụ dùng tạm `--type phaptuong` để sinh prompt năm hướng theo chỉ định chủ repo ở comment #6436237808 của issue #1096; đây chỉ là concept, không thay pháp tướng hiện có. Theo quyết định comment #6436570268, mẫu tốt nhất đã được chọn làm concept tham chiếu ngoại hình ở thư mục chính; các lượt còn lại giữ trong `candidates/`. Lỗi hướng không loại mẫu ngoại hình, sẽ xử lý ở khâu phụ thể có hình nộm.

## Tự soát RAW

- Số lượt: 3/3; lượt tốt nhất: 3.
- Mức: **chặn**. Tạo hình thỏ hung: tai dài nhọn, chân sau lớn, mắt đỏ hẹp; thân tím hồng sẫm, không dễ thương. Lượt 1: ne quay trái còn lộ mõm, tai / khí sát hoặc cắt mép. Lượt 2: se quay trái, ne còn mắt. Lượt 3 tốt nhất về bố cục, se đúng phải và không cắt tai, nhưng ne vẫn lộ mắt / răng. Không lượt nào đạt đủ góc lưng.
- Lượt 3 có 5 tư thế khác nhau nhưng chỉ 4 góc đáp ứng s, se, e, n; ne lộ mắt. Các lượt 1 và 2 còn sai phía hướng chéo.
- Không người, chữ, khung; nền alpha. Không sửa RAW để che lỗi. Chỉ concept; mẫu đã chọn chờ orchestrator duyệt ngoại hình, chưa nhập game.

- Kiểm RAW tự động: cả ba lượt NHẸ, tách được 5 cụm; lượt 2 có tỉ lệ 3:1, các lượt còn lại khoảng 5:2. Kết luận duyệt mắt vẫn CHẶN vì hướng chéo không đạt.

## Mẫu chọn và khai báo mắt (`--eye`)

Theo [quyết định orchestrator](https://github.com/nguyenbinhanltv/soul-land-mmo/pull/1146#issuecomment-6436570268): chọn `concept-attempt3.png` để tham chiếu ngoại hình, không sinh thêm. Mức chặn RAW phía trên vẫn lưu lịch sử lỗi; không coi lỗi hướng là điều kiện loại concept ngoại hình. Góc ne/n sửa ở khâu phụ thể có hình nộm.

Các khai báo dưới đây cũng lưu trong trường `eye` của source JSON. Công cụ võ hồn hiện chưa hỗ trợ tham số `--eye`; đây là khai báo hồ sơ, không phải lệnh đã thực thi bằng công cụ hồn thú.

```text
--eye "concept-attempt3=hướng — ne — còn lộ mắt / răng"
--eye "concept-attempt3=hướng — se/e — góc chéo và ngang còn gần nhau"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/nhu_cot_tho/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | 3 RAW concept Nhu Cốt Thố; model/seed unknown; prompt, SHA256 và nguồn trong các tệp đi kèm. | 2026-10-27 | Chưa nhập game; chặn. |

## Chân dung lượt 1 — #1158

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `045d5d8ebfd9c698cce021b7fc32711c7a2640021c6b8e1bfd3be62dfd2288f5`. Prompt CLI nguyên văn `candidates/portrait-attempt1.prompt.txt`, SHA256 `fa3a50fc902692a55eb570e334e6a9b74f5f099219330d3f0059a7cb932e50ac`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt3.png`, SHA256 `e4d6cfb04c501f29f0bbbe1c24f04040b1c1167ab5ce2739f9e5660d12f90aa3`. Hồ sơ lệnh và kết quả kiểm: `candidates/portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `candidates/portrait-attempt1-P1c/nhu_cot_tho-portrait.png`, 64×64, 7 màu, giữ 8/8 điểm sáng. Xem `candidates/portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — chính diện; đầu tai bị cắt mép trên; dải khí hồng rộng tranh mắt đỏ, lông nhiều nhánh"
```

**Kết luận chân dung:** lượt 1 chưa đạt brief, toàn bộ ở `candidates/`; chưa có chân dung cuối được chọn. Prompt lưu UTF-8 LF theo Git, chỉ chuẩn hóa xuống dòng so với chuỗi CLI; SHA256 chuỗi gửi ban đầu `148ff68335bdc148d18850da69bbeaa1b3cd1c5e2752e4ebdffcc051a2f66142`, SHA256 file prompt Git `fa3a50fc902692a55eb570e334e6a9b74f5f099219330d3f0059a7cb932e50ac`. Không sửa nội dung prompt.

```text
--eye "portrait-attempt1=bản P1c — 64×64 — mất nhiều khối tối; điểm mắt/đầu chưa tách rõ, chưa đạt brief; giữ làm candidate"
```


## Icon lượt 1 — #1159, chưa nhập game

Ngày 2026-10-27. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW giữ nguyên byte: `icon-attempt1.png`, SHA256 `765db7a756fb9fdd5a1a7e0f35cebc1b4dea0aedeb6fafe34b02dd8ee978bb26`; prompt tự sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type icon --id nhu_cot_tho --style-ref art/src/vohon-v2/nhu_cot_tho/concept-attempt3.png`, SHA256 `e87b69b7559c8f8528c3f377c628b7c984721f83fc8fceab4e45d76fa1e6b576`. Ảnh neo ngoại hình: `concept-attempt3.png`. Không viết tay prompt, không dùng lượt hỏng làm ảnh neo. Hồ sơ: `icon-attempt1.source.json`.

Chuyển bằng `vohon-pixelize --type icon --preset icon --colors 8 --merge 24 --passes 2 --protect on`. Bản 24/32 px ở `icon-attempt1-pixel/`; báo cáo JSON kèm từng ảnh. Đây là ứng viên cần duyệt, không tự tuyên bố đạt đẹp.

RAW: NHẸ; số đo `{"w":1254,"h":1254,"ratio":1,"border":{"clear":1,"flat70":0},"fill":0.89,"softness":0.936,"bigColors":101,"grid":{"period":35,"ratio":1.25},"paletteMatch":1,"smallAccent":"8/8"}`.

32px: NHẸ; số đo `{"w":32,"h":32,"colors":8,"outline":1,"hot":0.274,"contrast":0.291,"edge":0.505,"sep":8.1,"bgRatio":1.09,"accent":"8/8"}`.

24px: NHẸ; số đo `{"w":24,"h":24,"colors":7,"outline":1,"hot":0.353,"contrast":0.319,"edge":0.557,"sep":8.1,"bgRatio":1.27,"accent":"8/8"}`.

### Khai báo duyệt mắt icon (`--eye`)

CLI vohon:check chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên kết quả máy.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 93% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.25 ở chu kỳ 35 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (6 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.505 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32px — gan-mau — hai màu lớn chỉ cách nhau 8.1 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (6 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — sang-tran — vùng sáng 35%: sáng tràn, mất đối lập tối / sáng của phong cách mực tối"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.557 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — gan-mau — hai màu lớn chỉ cách nhau 8.1 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=duyệt mắt — Đầu thỏ tai dài nhọn, tím hồng sẫm và mắt đỏ; không biểu cảm dễ thương, kiểm điểm mắt khi thu nhỏ."
```

```text
--eye "icon-attempt1=đọc nhỏ — mắt/răng — tai dài nhận ra nhưng mắt đỏ và răng yếu ở 24 px; còn khí quanh tai và nhiều mảng lông nhỏ"
```
