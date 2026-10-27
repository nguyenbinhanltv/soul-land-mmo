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

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `b10fbcbda54c9fe2d1fff908c35ab48f9c5c8a8eaf23f976742be6fc748a5c78`. Prompt CLI nguyên văn `candidates/portrait-attempt1.prompt.txt`, SHA256 `e33ecf424b7d6b6fa1b36d372278a2516efcde6ca31247187175dfd9d38aa0fd`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt1.png`, SHA256 `dbb1002c01e3a0e541c3b385405b4db54225735ed5e549aac983e4a1f1a94a56`. Hồ sơ lệnh và kết quả kiểm: `candidates/portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `candidates/portrait-attempt1-P1c/bich_lan_xa_hoang-portrait.png`, 64×64, 7 màu, giữ 7/8 điểm sáng. Xem `candidates/portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — chính diện; sừng chạm/cắt mép trên, dải khí và ngọc xanh rộng tranh điểm nhấn mắt, chi tiết vảy nhiều"
```

**Kết luận chân dung:** lượt 1 chưa đạt brief, toàn bộ ở `candidates/`; chưa có chân dung cuối được chọn. Prompt lưu UTF-8 LF theo Git, chỉ chuẩn hóa xuống dòng so với chuỗi CLI; SHA256 chuỗi gửi ban đầu `0020794298e911c1a84143d2259fe2e8a1a392b075df4158d1b0c52859ad540a`, SHA256 file prompt Git `e33ecf424b7d6b6fa1b36d372278a2516efcde6ca31247187175dfd9d38aa0fd`. Không sửa nội dung prompt.

```text
--eye "portrait-attempt1=bản P1c — 64×64 — mất nhiều khối tối; điểm mắt/đầu chưa tách rõ, chưa đạt brief; giữ làm candidate"
```


## Icon lượt 1 — #1159, chưa nhập game

Ngày 2026-10-27. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW giữ nguyên byte: `icon-attempt1.png`, SHA256 `9bb7c5b8dcb441d031526dcf48fcf23aecb16137a536bd96ee73eb2e08fe4ee6`; prompt tự sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type icon --id bich_lan_xa_hoang --style-ref art/src/vohon-v2/bich_lan_xa_hoang/concept-attempt1.png`, SHA256 `b9d8fe7c78cd95b1837fcbc11190c8e4bf1f05835fd192114acbcdb19d5a893c`. Ảnh neo ngoại hình: `concept-attempt1.png`. Không viết tay prompt, không dùng lượt hỏng làm ảnh neo. Hồ sơ: `icon-attempt1.source.json`.

Chuyển bằng `vohon-pixelize --type icon --preset icon --colors 8 --merge 24 --passes 2 --protect on`. Bản 24/32 px ở `icon-attempt1-pixel/`; báo cáo JSON kèm từng ảnh. Đây là ứng viên cần duyệt, không tự tuyên bố đạt đẹp.

RAW: NHẸ; số đo `{"w":1254,"h":1254,"ratio":1,"border":{"clear":0.99,"flat70":0.01},"fill":0.94,"softness":0.908,"bigColors":130,"grid":{"period":34,"ratio":1.24},"paletteMatch":0.67,"smallAccent":"8/8"}`.

32px: NHẸ; số đo `{"w":32,"h":32,"colors":8,"outline":1,"hot":0.271,"contrast":0.266,"edge":0.51,"sep":22,"bgRatio":1.07,"accent":"8/8"}`.

24px: NHẸ; số đo `{"w":24,"h":24,"colors":8,"outline":1,"hot":0.306,"contrast":0.279,"edge":0.557,"sep":24.2,"bgRatio":1.05,"accent":"8/8"}`.

### Khai báo duyệt mắt icon (`--eye`)

CLI vohon:check chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên kết quả máy.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 90% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.24 ở chu kỳ 34 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (14 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.51 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32px — gan-mau — hai màu lớn chỉ cách nhau 22 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (16 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — sang-tran — vùng sáng 30%: sáng tràn, mất đối lập tối / sáng của phong cách mực tối"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.557 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — gan-mau — hai màu lớn chỉ cách nhau 24.2 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=duyệt mắt — Đầu rắn lục thẫm, mào nhọn, nanh dài và mắt vàng chanh; kiểm khối đầu tách khỏi khí độc khi thu nhỏ."
```

```text
--eye "icon-attempt1=bố cục — đầu/thân/khí — còn thân cuộn và khí độc quanh đầu, chưa đạt biểu tượng đơn; mắt/nanh khó đọc ở 24 px"
```


### Hồ sơ icon để review

Số lượt icon: 1/3; chọn lượt 1 để trình duyệt. Không phải bản đã duyệt nhập game. Xem `icon-attempt1-pixel/preview/index.html` và `icon-attempt1-pixel/preview/so-sanh.png`.

SHA256 prompt trong mục icon tính trên UTF-8, xuống dòng LF, không xuống dòng cuối file; `sent_prompt` và `sent_prompt_sha256` trong source JSON giữ đúng chuỗi đã gửi công cụ (kể cả xuống dòng gốc). So sánh với đầu ra CLI sau chuẩn hóa CRLF/LF: trùng nguyên nội dung, không addendum.
