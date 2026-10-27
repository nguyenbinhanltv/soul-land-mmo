# kim_vu_mieu_ung — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. 3/3 lượt. RAW giữ nguyên byte, không hậu kỳ, không nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong` và `--style-ref` ảnh Hạo Thiên lượt 2 đã duyệt từ PR #1083. Chỉ ảnh neo này được gửi; không dùng lượt hỏng làm tham chiếu.

## Đánh giá

**Chọn làm tham chiếu ngoại hình theo quyết định mới ở PR #1145; chưa phải phụ thể đạt năm hướng.** Lượt 1: ne quay trái và lộ mắt, s/n cánh rủ. Lượt 2: ne/n giấu mặt đúng, cánh s/n cắt biên, se/e quá giống. Lượt 3: ne/n không lộ mặt, đủ 5 tư thế gần đúng nhưng se/e khác ít, khoảng trống giữa cánh quá hẹp/có chỗ gần chạm; không đạt tách năm cột. Khoảng 4 góc thật phân biệt rõ. Màu nâu vàng, đen cánh, mắt dọc đúng; chi tiết lông dày (nhẹ), thiếu mây/vòng sét. Chưa đạt.

- Lượt 1: `concept-attempt1.png`; SHA256 ảnh `f5acaf93bb42da33603d5d94d9a56fefba8667ba8a9e99d048ca2e70a9f029b9`; SHA256 prompt `7c49d626a6fdda8d005dae0e80f757645ac5fd0e3ebc4d4e2c2383ec4efcd1a3`.
- Lượt 2: `candidates/concept-attempt2.png`; SHA256 ảnh `07dbb9a6c6508cb58686868625020e69b73d4e46130acfa4d9725b5c4513f30f`; SHA256 prompt `7c49d626a6fdda8d005dae0e80f757645ac5fd0e3ebc4d4e2c2383ec4efcd1a3`.
- Lượt 3: `candidates/concept-attempt3.png`; SHA256 ảnh `22e0131bf8744970c6f40fd86cca9e5cbf31cd715327fa798c54a6b498570099`; SHA256 prompt `7c49d626a6fdda8d005dae0e80f757645ac5fd0e3ebc4d4e2c2383ec4efcd1a3`.

Bản tốt nhất để tham chiếu ngoại hình: `concept-attempt1.png` (lượt 1), đã chọn ở thư mục chính với trạng thái `selected_appearance_reference`. Chọn lượt 1 thay lượt 3 vì lượt 3 có khoảng trống giữa cánh quá hẹp, có chỗ gần chạm và không tách rõ năm cột; ưu tiên hình thể tham chiếu hơn độ đúng hướng ne/n của lượt 3. Lượt 1 vẫn còn lỗi ne lộ mắt, cánh rủ và các lỗi ghi ở mục khai báo duyệt mắt, chưa đạt phụ thể năm hướng. Lượt 2 và 3 ở `candidates` để đối chiếu. Mỗi lượt có prompt và source JSON kèm theo. Không có NGUON phụ.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/kim_vu_mieu_ung/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW + chân dung RAW và bản thử P1c #1158; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |


## Khai báo duyệt mắt (`--eye`)

Công cụ vohon-check hiện không có cờ `--eye`; các khai báo dưới đây dùng cùng khuôn lỗi mắt, không chạy bộ kiểm hồn thú cho võ hồn.

```text
--eye "concept-attempt1=hướng — ne — quay trái và lộ mắt; se/e khác ít"
--eye "concept-attempt1=bố cục — cánh — cánh ngoài sát biên, s/n cánh rủ, lông dày"
```

```text
LỖI: concept-attempt1 — hướng — ne — quay trái và lộ mắt; se/e khác ít (mắt)
LỖI: concept-attempt1 — bố cục — cánh — cánh ngoài sát biên, s/n cánh rủ, lông dày (mắt)
```

Theo quyết định ở PR #1145: concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý ở khâu phụ thể bằng hình nộm. Giữ nguyên kết quả kiểm RAW và mọi lỗi đã quan sát, không coi ảnh này là sheet năm hướng dùng trực tiếp. SHA256 ảnh và prompt không đổi khi chuyển vị trí.

## Chân dung lượt 1 — #1158

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `72608649ecf285bf6951d32d1777130e31e8f15c1b748ba6d27cf670075780a4`. Prompt CLI nguyên văn `candidates/portrait-attempt1.prompt.txt`, SHA256 `2df857098eed5b6dd9d6753579d4c40b35eb16e0295880b886e1b7de13bba779`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt1.png`, SHA256 `f5acaf93bb42da33603d5d94d9a56fefba8667ba8a9e99d048ca2e70a9f029b9`. Hồ sơ lệnh và kết quả kiểm: `candidates/portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `candidates/portrait-attempt1-P1c/kim_vu_mieu_ung-portrait.png`, 64×64, 8 màu, giữ 8/8 điểm sáng. Xem `candidates/portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — chính diện; tai/mào sát mép, lông và quầng có nhiều nhánh sáng ngoài mắt/mỏ"
```

**Kết luận chân dung:** lượt 1 chưa đạt brief, toàn bộ ở `candidates/`; chưa có chân dung cuối được chọn. Prompt lưu UTF-8 LF theo Git, chỉ chuẩn hóa xuống dòng so với chuỗi CLI; SHA256 chuỗi gửi ban đầu `008ddaa5d7ecd1a653d2fa85fe251475b4e771d8aa3d3ae39b16cb4c0cf0aa28`, SHA256 file prompt Git `2df857098eed5b6dd9d6753579d4c40b35eb16e0295880b886e1b7de13bba779`. Không sửa nội dung prompt.

```text
--eye "portrait-attempt1=bản P1c — 64×64 — mất nhiều khối tối; điểm mắt/đầu chưa tách rõ, chưa đạt brief; giữ làm candidate"
```


## Icon lượt 1 — #1159, chưa nhập game

Ngày 2026-10-27. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW giữ nguyên byte: `icon-attempt1.png`, SHA256 `9618305feecfdb0127f6dcfb9455c1903f0d0d5aa023f1b31dacad24f24a5547`; prompt tự sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type icon --id kim_vu_mieu_ung --style-ref art/src/vohon-v2/kim_vu_mieu_ung/concept-attempt1.png`, SHA256 `327c651ee8616da12ed9a122cd48c8c61c69ab27b86d42097b2b9aed86ae350b`. Ảnh neo ngoại hình: `concept-attempt1.png`. Không viết tay prompt, không dùng lượt hỏng làm ảnh neo. Hồ sơ: `icon-attempt1.source.json`.

Chuyển bằng `vohon-pixelize --type icon --preset icon --colors 8 --merge 24 --passes 2 --protect on`. Bản 24/32 px ở `icon-attempt1-pixel/`; báo cáo JSON kèm từng ảnh. Đây là ứng viên cần duyệt, không tự tuyên bố đạt đẹp.

RAW: NHẸ; số đo `{"w":1254,"h":1254,"ratio":1,"border":{"clear":1,"flat70":0},"fill":0.91,"softness":0.908,"bigColors":125,"grid":{"period":33,"ratio":1.24},"paletteMatch":0.92,"smallAccent":"8/8"}`.

32px: NHẸ; số đo `{"w":32,"h":32,"colors":8,"outline":1,"hot":0.344,"contrast":0.331,"edge":0.553,"sep":11.4,"bgRatio":1.6,"accent":"8/8"}`.

24px: NHẸ; số đo `{"w":24,"h":24,"colors":8,"outline":1,"hot":0.395,"contrast":0.346,"edge":0.567,"sep":7.8,"bgRatio":1.57,"accent":"8/8"}`.

### Khai báo duyệt mắt icon (`--eye`)

CLI vohon:check chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên kết quả máy.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 90% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.24 ở chu kỳ 33 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (9 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — sang-tran — vùng sáng 34%: sáng tràn, mất đối lập tối / sáng của phong cách mực tối"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.553 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32px — gan-mau — hai màu lớn chỉ cách nhau 11.4 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (8 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — sang-tran — vùng sáng 39%: sáng tràn, mất đối lập tối / sáng của phong cách mực tối"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.567 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — gan-mau — hai màu lớn chỉ cách nhau 7.8 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=duyệt mắt — Đầu cú vàng với tai lông nhọn, mắt lạnh; kiểm mỏ và mắt ở cỡ thật, chi tiết lông phụ có thể lẫn."
```

```text
--eye "icon-attempt1=đọc nhỏ — mắt/mỏ — đầu cú nhận ra qua tai nhọn, nhưng mắt/mỏ dính mảng vàng ở 24 px; chưa đạt đẹp"
```


### Hồ sơ icon để review

Số lượt icon: 1/3; chọn lượt 1 để trình duyệt. Không phải bản đã duyệt nhập game. Xem `icon-attempt1-pixel/preview/index.html` và `icon-attempt1-pixel/preview/so-sanh.png`.

SHA256 prompt trong mục icon tính trên UTF-8, xuống dòng LF, không xuống dòng cuối file; `sent_prompt` và `sent_prompt_sha256` trong source JSON giữ đúng chuỗi đã gửi công cụ (kể cả xuống dòng gốc). So sánh với đầu ra CLI sau chuẩn hóa CRLF/LF: trùng nguyên nội dung, không addendum.
