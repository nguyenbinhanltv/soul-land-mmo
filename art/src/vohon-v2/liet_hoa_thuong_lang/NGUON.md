# Liệt Hỏa Thương Lang — concept 5 hướng (#1096)

RAW nguyên byte từ builtin `image_gen.imagegen`; chưa crop, đổi cỡ, chuyển bảng màu hoặc nhập game. Model/seed: unknown.

## Nguồn và prompt

Prompt tự sinh bằng `node tools/assets/vohon-prompt.mjs --type phaptuong --id liet_hoa_thuong_lang --style-ref <ảnh neo đã duyệt>`; không thêm addendum. Ảnh dẫn duy nhất: concept Hạo Thiên Chùy lượt 2, PR #1083. Không dùng ảnh cũ hay lượt lỗi làm dẫn. Mỗi lượt một lần sinh độc lập với ảnh neo duy nhất.

- `candidates/concept-attempt1.png`: 1446887 byte; SHA256 `7a19c441e813a8c6ae05d46d713ef1a185b1f6bc2c210aa87c9cf391a0731d5b`; prompt SHA256 `a8b951c0c2d4cd74bf39248caba17dfe69cdaa74397ac35d3409989629f3ac2f`.
- `candidates/concept-attempt2.png`: 1385926 byte; SHA256 `7a815894d55a45cd936ff83f7d84fbb3f8c9d82a772d04e4b9782fc30d9b7452`; prompt SHA256 `a8b951c0c2d4cd74bf39248caba17dfe69cdaa74397ac35d3409989629f3ac2f`.
- `concept-attempt3.png`: 1475968 byte; SHA256 `3ee22a885eed62d121cde6f32c7e4261d9087b686c6e20c33e0c1f40bfdf3269`; prompt SHA256 `a8b951c0c2d4cd74bf39248caba17dfe69cdaa74397ac35d3409989629f3ac2f`.

Công cụ dùng tạm `--type phaptuong` để sinh prompt năm hướng theo chỉ định chủ repo ở comment #6436237808 của issue #1096; đây chỉ là concept, không thay pháp tướng hiện có. Theo quyết định comment #6436570268, mẫu tốt nhất đã được chọn làm concept tham chiếu ngoại hình ở thư mục chính; các lượt còn lại giữ trong `candidates/`. Lỗi hướng không loại mẫu ngoại hình, sẽ xử lý ở khâu phụ thể có hình nộm.

## Tự soát RAW

- Số lượt: 3/3; lượt tốt nhất: 3.
- Mức: **chặn**. Cả ba lượt còn mắt / mõm ở góc ne. Thân xám nâu than và lửa cam đọc rõ; tạo hình hung, nhưng lửa và vân còn dày, vài hình sát nhau. Lượt 1 có dáng dễ đọc nhưng các hình vẫn sát nhau; kiểm tự động chỉ tách 3 cụm nên chọn lượt 3 có đủ 5 cụm. Không có lượt đạt đủ yêu cầu hướng lưng.
- Có 5 tư thế khác nhau nhưng chỉ 4 góc đáp ứng: s, se, e, n; ne nhìn thân sau nhưng ngoảnh đầu lộ mặt, bị chặn.
- Không người, chữ, khung; nền alpha. Không sửa RAW để che lỗi. Chỉ concept; mẫu đã chọn chờ orchestrator duyệt ngoại hình, chưa nhập game.

- Kiểm RAW tự động: lượt 1 CHẶN (chỉ tách 3 cụm), lượt 2 CHẶN (4 cụm), lượt 3 NHẸ (5 cụm). Chọn lại lượt 3 vì tách đủ 5 hình; cả ba vẫn CHẶN khi duyệt mắt do ne lộ mặt.

## Mẫu chọn và khai báo mắt (`--eye`)

Theo [quyết định orchestrator](https://github.com/nguyenbinhanltv/soul-land-mmo/pull/1146#issuecomment-6436570268): chọn `concept-attempt3.png` để tham chiếu ngoại hình, không sinh thêm. Mức chặn RAW phía trên vẫn lưu lịch sử lỗi; không coi lỗi hướng là điều kiện loại concept ngoại hình. Góc ne/n sửa ở khâu phụ thể có hình nộm.

Các khai báo dưới đây cũng lưu trong trường `eye` của source JSON. Công cụ võ hồn hiện chưa hỗ trợ tham số `--eye`; đây là khai báo hồ sơ, không phải lệnh đã thực thi bằng công cụ hồn thú.

```text
--eye "concept-attempt3=hướng — ne — còn lộ mắt / mõm"
--eye "concept-attempt3=chi tiết — thân và đuôi — lửa và vân dày"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/liet_hoa_thuong_lang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | 3 RAW concept Liệt Hỏa Thương Lang; model/seed unknown; prompt, SHA256 và nguồn trong các tệp đi kèm. | 2026-10-27 | Chưa nhập game; chặn. |

## Chân dung lượt 1 — #1158

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `2b65f6a345fc3cb50b0c44f49af16f148010d4fc1f8d8c5105a72b136ae06a06`. Prompt CLI nguyên văn `candidates/portrait-attempt1.prompt.txt`, SHA256 `6f6d672ca3ee377a05e7832c635931a2b7b33ba4db9db0314d39fe2332e7e91e`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt3.png`, SHA256 `3ee22a885eed62d121cde6f32c7e4261d9087b686c6e20c33e0c1f40bfdf3269`. Hồ sơ lệnh và kết quả kiểm: `candidates/portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `candidates/portrait-attempt1-P1c/liet_hoa_thuong_lang-portrait.png`, 64×64, 6 màu, giữ 7/8 điểm sáng. Xem `candidates/portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — chính diện; quầng lửa rộng, vết nứt sáng tranh điểm nhấn với mắt, bờm còn nhiều nhánh"
```

**Kết luận chân dung:** lượt 1 chưa đạt brief, toàn bộ ở `candidates/`; chưa có chân dung cuối được chọn. Prompt lưu UTF-8 LF theo Git, chỉ chuẩn hóa xuống dòng so với chuỗi CLI; SHA256 chuỗi gửi ban đầu `a293350ef29556077f876e87bb4bcc561fad21d613a9faf757da3754d6eacf66`, SHA256 file prompt Git `6f6d672ca3ee377a05e7832c635931a2b7b33ba4db9db0314d39fe2332e7e91e`. Không sửa nội dung prompt.

```text
--eye "portrait-attempt1=bản P1c — 64×64 — mất nhiều khối tối; điểm mắt/đầu chưa tách rõ, chưa đạt brief; giữ làm candidate"
```


## Icon lượt 1 — #1159, chưa nhập game

Ngày 2026-10-27. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW giữ nguyên byte: `icon-attempt1.png`, SHA256 `0a1850de31a8b332d8bd28f74b4c5cef648946b2bcd5d5c1fe7652a5a956feb5`; prompt tự sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type icon --id liet_hoa_thuong_lang --style-ref art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png`, SHA256 `e5d25d7e56436705578f3ad8f0da1e8f69e6b84cc0426521f140eaa1db4f1e17`. Ảnh neo ngoại hình: `concept-attempt3.png`. Không viết tay prompt, không dùng lượt hỏng làm ảnh neo. Hồ sơ: `icon-attempt1.source.json`.

Chuyển bằng `vohon-pixelize --type icon --preset icon --colors 8 --merge 24 --passes 2 --protect on`. Bản 24/32 px ở `icon-attempt1-pixel/`; báo cáo JSON kèm từng ảnh. Đây là ứng viên cần duyệt, không tự tuyên bố đạt đẹp.

RAW: NHẸ; số đo `{"w":1254,"h":1254,"ratio":1,"border":{"clear":1,"flat70":0},"fill":0.88,"softness":0.912,"bigColors":125,"grid":{"period":39,"ratio":1.49},"paletteMatch":1,"smallAccent":"7/8"}`.

32px: NHẸ; số đo `{"w":32,"h":32,"colors":8,"outline":1,"hot":0.043,"contrast":0.178,"edge":0.406,"sep":19.4,"bgRatio":0.82,"accent":"2/8"}`.

24px: NHẸ; số đo `{"w":24,"h":24,"colors":7,"outline":1,"hot":0.135,"contrast":0.187,"edge":0.446,"sep":17.3,"bgRatio":1.02,"accent":"7/8"}`.

### Khai báo duyệt mắt icon (`--eye`)

CLI vohon:check chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên kết quả máy.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 91% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.49 ở chu kỳ 39 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (9 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.406 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32px — gan-mau — hai màu lớn chỉ cách nhau 19.4 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=32px — mat-mat-mo — chỉ còn 2/8 điểm sáng của ảnh nguồn (mắt, mỏ, lõi): có thể mất mắt / mỏ ở cỡ này; thử cắt gần hơn (--zoom / --crop) hoặc bản đơn giản hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (11 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.446 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — gan-mau — hai màu lớn chỉ cách nhau 17.3 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=duyệt mắt — Đầu sói than với bờm lửa, mõm dài và nanh; chi tiết bờm có thể cạnh tranh với mắt ở 24 px."
```
