# Yêu Hồ — concept 5 hướng (#1096)

RAW nguyên byte từ builtin `image_gen.imagegen`; chưa crop, đổi cỡ, chuyển bảng màu hoặc nhập game. Model/seed: unknown.

## Nguồn và prompt

Prompt tự sinh bằng `node tools/assets/vohon-prompt.mjs --type phaptuong --id yeu_ho --style-ref <ảnh neo đã duyệt>`; không thêm addendum. Ảnh dẫn duy nhất: concept Hạo Thiên Chùy lượt 2, PR #1083. Không dùng ảnh cũ hay lượt lỗi làm dẫn. Mỗi lượt một lần sinh độc lập với ảnh neo duy nhất.

- `concept-attempt1.png`: 1800563 byte; SHA256 `de239894a83bfeeb5b0d099fd2869980fb2c6a6d31ea58bc18cdfe2be15624a8`; prompt SHA256 `c26e20daecdaa57bd836e45444817b4c805fecb09ee45a92301d24c261bcd0d7`.
- `candidates/concept-attempt2.png`: 1715674 byte; SHA256 `e4c6c57ea5ce273f6a3f67cc898f69e1e40b99242fd2ad08986479442b1ee79d`; prompt SHA256 `c26e20daecdaa57bd836e45444817b4c805fecb09ee45a92301d24c261bcd0d7`.
- `candidates/concept-attempt3.png`: 1653576 byte; SHA256 `9065cdbd2de0d0cac8cff277b480b07ad42b7497e5328fbbd2cc096f0096aff6`; prompt SHA256 `c26e20daecdaa57bd836e45444817b4c805fecb09ee45a92301d24c261bcd0d7`.

Công cụ dùng tạm `--type phaptuong` để sinh prompt năm hướng theo chỉ định chủ repo ở comment #6436237808 của issue #1096; đây chỉ là concept, không thay pháp tướng hiện có. Theo quyết định comment #6436570268, mẫu tốt nhất đã được chọn làm concept tham chiếu ngoại hình ở thư mục chính; các lượt còn lại giữ trong `candidates/`. Lỗi hướng không loại mẫu ngoại hình, sẽ xử lý ở khâu phụ thể có hình nộm.

## Tự soát RAW

- Số lượt: 3/3; lượt tốt nhất: 1.
- Mức: **chặn**. Lượt 1: góc ne và n không lộ mặt, nhưng thừa trang sức vàng / tua đỏ ngoài brief và các khối đuôi không nhất quán ba đuôi. Lượt 2: bỏ trang sức nhưng hình s có ít nhất bốn khối đuôi, ne lộ mặt; sát brief hơn về trang sức nhưng ne lộ mặt và hình sát nhau nên không chọn. Lượt 3: thừa trang sức, nhiều hơn ba đuôi và ne quay sai / lộ mặt. Cả ba bị chặn nhận diện.
- Lượt 1 có 5 góc thật; lượt 2 chỉ 4 góc đáp ứng (ne lộ mặt); lượt 3 không đạt ne. Không ảnh nào đạt đồng thời hướng và đúng ba đuôi.
- Không người, chữ, khung; nền alpha. Không sửa RAW để che lỗi. Chỉ concept; mẫu đã chọn chờ orchestrator duyệt ngoại hình, chưa nhập game.

- Kiểm RAW tự động: lượt 1 NHẸ (5 cụm), lượt 2 CHẶN (3 cụm), lượt 3 NHẸ (5 cụm). Chọn lại lượt 1 vì có 5 góc đúng và không lộ mặt ở ne/n; vẫn CHẶN số đuôi / trang sức ngoài brief.

## Mẫu chọn và khai báo mắt (`--eye`)

Theo [quyết định orchestrator](https://github.com/nguyenbinhanltv/soul-land-mmo/pull/1146#issuecomment-6436570268): chọn `concept-attempt1.png` để tham chiếu ngoại hình, không sinh thêm. Mức chặn RAW phía trên vẫn lưu lịch sử lỗi; không coi lỗi hướng là điều kiện loại concept ngoại hình. Góc ne/n sửa ở khâu phụ thể có hình nộm.

Các khai báo dưới đây cũng lưu trong trường `eye` của source JSON. Công cụ võ hồn hiện chưa hỗ trợ tham số `--eye`; đây là khai báo hồ sơ, không phải lệnh đã thực thi bằng công cụ hồn thú.

```text
--eye "concept-attempt1=nhận diện — các hướng — số khối đuôi chưa nhất quán ba đuôi"
--eye "concept-attempt1=motif — các hướng — trang sức vàng và tua đỏ ngoài brief"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/yeu_ho/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | 3 RAW concept Yêu Hồ; model/seed unknown; prompt, SHA256 và nguồn trong các tệp đi kèm. | 2026-10-27 | Chưa nhập game; chặn. |

## Chân dung lượt 1 — #1158

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `84094617aa8c64f9c85fd1746c1cf6662a591d123b08f1e4f1360c1819d3c85d`. Prompt CLI nguyên văn `candidates/portrait-attempt1.prompt.txt`, SHA256 `e5466acd1864c905eb0d18bf044c443a17a66f919f5b37c39544bd80a74af354`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt1.png`, SHA256 `de239894a83bfeeb5b0d099fd2869980fb2c6a6d31ea58bc18cdfe2be15624a8`. Hồ sơ lệnh và kết quả kiểm: `candidates/portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `candidates/portrait-attempt1-P1c/yeu_ho-portrait.png`, 64×64, 8 màu, giữ 8/8 điểm sáng. Xem `candidates/portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — chính diện; quầng/đuôi hồng rộng và đạo ấn sáng tranh mắt, tai sát mép; cần duyệt độ tách nền"
```

**Kết luận chân dung:** lượt 1 chưa đạt brief, toàn bộ ở `candidates/`; chưa có chân dung cuối được chọn. Prompt lưu UTF-8 LF theo Git, chỉ chuẩn hóa xuống dòng so với chuỗi CLI; SHA256 chuỗi gửi ban đầu `2d826b526b120e6b7a6c942390f594bea211b41332cf089972406c5c8b9843f0`, SHA256 file prompt Git `e5466acd1864c905eb0d18bf044c443a17a66f919f5b37c39544bd80a74af354`. Không sửa nội dung prompt.

```text
--eye "portrait-attempt1=bản P1c — 64×64 — mất nhiều khối tối; điểm mắt/đầu chưa tách rõ, chưa đạt brief; giữ làm candidate"
```


## Icon lượt 1 — #1159, chưa nhập game

Ngày 2026-10-27. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW giữ nguyên byte: `icon-attempt1.png`, SHA256 `d8244c0f5cc99bedda4e3def9ab1b00c665ca43874ed0bb0bd020f6b428daeaa`; prompt tự sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type icon --id yeu_ho --style-ref art/src/vohon-v2/yeu_ho/concept-attempt1.png`, SHA256 `2fb74aa2b2989f9cf336193f2fe3257d5adcaae1c8fc2434ac00e0798e65fdac`. Ảnh neo ngoại hình: `concept-attempt1.png`. Không viết tay prompt, không dùng lượt hỏng làm ảnh neo. Hồ sơ: `icon-attempt1.source.json`.

Chuyển bằng `vohon-pixelize --type icon --preset icon --colors 8 --merge 24 --passes 2 --protect on`. Bản 24/32 px ở `icon-attempt1-pixel/`; báo cáo JSON kèm từng ảnh. Đây là ứng viên cần duyệt, không tự tuyên bố đạt đẹp.

RAW: NHẸ; số đo `{"w":1254,"h":1254,"ratio":1,"border":{"clear":1,"flat70":0},"fill":0.93,"softness":0.928,"bigColors":110,"grid":{"period":40,"ratio":1.34},"paletteMatch":0.83,"smallAccent":"8/8"}`.

32px: NHẸ; số đo `{"w":32,"h":32,"colors":8,"outline":1,"hot":0.306,"contrast":0.24,"edge":0.41,"sep":8.6,"bgRatio":1.04,"accent":"8/8"}`.

24px: NHẸ; số đo `{"w":24,"h":24,"colors":8,"outline":1,"hot":0.284,"contrast":0.24,"edge":0.433,"sep":8.6,"bgRatio":1.03,"accent":"8/8"}`.

### Khai báo duyệt mắt icon (`--eye`)

CLI vohon:check chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên kết quả máy.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 92% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.34 ở chu kỳ 40 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (11 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — sang-tran — vùng sáng 30%: sáng tràn, mất đối lập tối / sáng của phong cách mực tối"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.41 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32px — gan-mau — hai màu lớn chỉ cách nhau 8.6 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (11 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.433 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — gan-mau — hai màu lớn chỉ cách nhau 8.6 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=duyệt mắt — Đầu hồ ly tím hồng sẫm, tai nhọn, mắt xếch; giữ biểu cảm lạnh, kiểm ấn trán và mắt ở cỡ thật."
```

```text
--eye "icon-attempt1=bố cục — đuôi/khối phụ — nhiều nhánh đuôi quanh mặt, chưa đạt biểu tượng đơn; mặt nhỏ khi thu 24 px"
```
