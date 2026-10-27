# Tử Vong Chu Hoàng — concept 5 hướng (#1096)

RAW nguyên byte từ builtin `image_gen.imagegen`; chưa crop, đổi cỡ, chuyển bảng màu hoặc nhập game. Model/seed: unknown.

## Nguồn và prompt

Prompt tự sinh bằng `node tools/assets/vohon-prompt.mjs --type phaptuong --id tu_vong_chu_hoang --style-ref <ảnh neo đã duyệt>`; không thêm addendum. Ảnh dẫn duy nhất: concept Hạo Thiên Chùy lượt 2, PR #1083. Không dùng ảnh cũ hay lượt lỗi làm dẫn. Mỗi lượt một lần sinh độc lập với ảnh neo duy nhất.

- `concept-attempt1.png`: 1547271 byte; SHA256 `b9cdc21f23c580792231cf131a6b4a91ac0676d2e080f7f5a9e21e6786fab656`; prompt SHA256 `bf854a6f9ae1fdda47cc030d9f8508c01ea236346d5a8e9e8ee8ac9161c28626`.

Công cụ dùng tạm `--type phaptuong` để sinh prompt năm hướng theo chỉ định chủ repo ở comment #6436237808 của issue #1096; đây chỉ là concept, không thay pháp tướng hiện có. Theo quyết định comment #6436570268, mẫu tốt nhất đã được chọn làm concept tham chiếu ngoại hình ở thư mục chính; các lượt còn lại giữ trong `candidates/`. Lỗi hướng không loại mẫu ngoại hình, sẽ xử lý ở khâu phụ thể có hình nộm.

## Tự soát RAW

- Số lượt: 1/3; lượt tốt nhất: 1.
- Mức: **nhẹ**. Đề xuất lượt 1: nhện tím đen, khớp trắng ngà, mắt tím, sọ đỏ trên bụng và tơ có bùa đúng brief; năm hình không người / chữ / khung. Nhẹ: chân chồng nhau nên khó đếm đủ tám ở góc nghiêng; tơ và đạo văn nhỏ, sọ đỏ hơi lớn so với nhấn đỏ rất ít; chưa đơn giản như neo Hạo Thiên. Không thấy mắt / mặt ở ne và n. Chờ orchestrator duyệt tạo hình, không tự coi là nguồn đã duyệt.
- Có 5 góc nhìn thật s, se, e, ne, n; ne và n nhìn lưng không lộ mặt. Góc e còn hơi chếch trước.
- Không người, chữ, khung; nền alpha. Không sửa RAW để che lỗi. Chỉ concept; mẫu đã chọn chờ orchestrator duyệt ngoại hình, chưa nhập game.

- Kiểm RAW tự động: NHẸ, 5 cụm; texture mềm (73%), 203 màu đáng kể, lưới chưa cứng, 43% điểm sáng gần bảng màu game. Các cảnh báo này không thay thế duyệt hướng bằng mắt.

## Mẫu chọn và khai báo mắt (`--eye`)

Theo [quyết định orchestrator](https://github.com/nguyenbinhanltv/soul-land-mmo/pull/1146#issuecomment-6436570268): chọn `concept-attempt1.png` để tham chiếu ngoại hình, không sinh thêm. Mức chặn RAW phía trên vẫn lưu lịch sử lỗi; không coi lỗi hướng là điều kiện loại concept ngoại hình. Góc ne/n sửa ở khâu phụ thể có hình nộm.

Các khai báo dưới đây cũng lưu trong trường `eye` của source JSON. Công cụ võ hồn hiện chưa hỗ trợ tham số `--eye`; đây là khai báo hồ sơ, không phải lệnh đã thực thi bằng công cụ hồn thú.

```text
--eye "concept-attempt1=hướng — e — còn hơi chếch trước"
--eye "concept-attempt1=hình — chân — chồng nhau khó đếm đủ tám"
--eye "concept-attempt1=chi tiết — tơ và lưng — tơ nhỏ, sọ đỏ hơi lớn"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/tu_vong_chu_hoang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | 1 RAW concept Tử Vong Chu Hoàng; model/seed unknown; prompt, SHA256 và nguồn trong các tệp đi kèm. | 2026-10-27 | Chưa nhập game; nhẹ. |

## Chân dung lượt 1 — #1158

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `b82079fac1886d49ce48f64c9b3ea608ee451457b8146be1fc4f8ac88817a1c8`. Prompt CLI nguyên văn `candidates/portrait-attempt1.prompt.txt`, SHA256 `365b58f3609d75b3e889454947681a061afa387f726671b2055ef6d2004e523b`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt1.png`, SHA256 `b9cdc21f23c580792231cf131a6b4a91ac0676d2e080f7f5a9e21e6786fab656`. Hồ sơ lệnh và kết quả kiểm: `candidates/portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `candidates/portrait-attempt1-P1c/tu_vong_chu_hoang-portrait.png`, 64×64, 7 màu, giữ 8/8 điểm sáng. Xem `candidates/portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — chính diện; bụng/gai chiếm nhiều khung, mặt chưa đạt 70%; tơ và phù treo còn nhiều nét nhỏ, gai chạm mép"
```

**Kết luận chân dung:** lượt 1 chưa đạt brief, toàn bộ ở `candidates/`; chưa có chân dung cuối được chọn. Prompt lưu UTF-8 LF theo Git, chỉ chuẩn hóa xuống dòng so với chuỗi CLI; SHA256 chuỗi gửi ban đầu `3ecdbc00be54e6aef10f87b22d36f615b82fdea296b6022128b4ddb5e3897a16`, SHA256 file prompt Git `365b58f3609d75b3e889454947681a061afa387f726671b2055ef6d2004e523b`. Không sửa nội dung prompt.

```text
--eye "portrait-attempt1=bản P1c — 64×64 — mất nhiều khối tối; điểm mắt/đầu chưa tách rõ, chưa đạt brief; giữ làm candidate"
```


## Icon lượt 1 — #1159, chưa nhập game

Ngày 2026-10-27. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW giữ nguyên byte: `icon-attempt1.png`, SHA256 `fbeaaeef943c4c7826617d0e839448dc6423eeb9437179d6224312c2e6dde175`; prompt tự sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type icon --id tu_vong_chu_hoang --style-ref art/src/vohon-v2/tu_vong_chu_hoang/concept-attempt1.png`, SHA256 `acf114e686368f111c2bce41462212d838eb76fd93e45783d09650822c1c7320`. Ảnh neo ngoại hình: `concept-attempt1.png`. Không viết tay prompt, không dùng lượt hỏng làm ảnh neo. Hồ sơ: `icon-attempt1.source.json`.

Chuyển bằng `vohon-pixelize --type icon --preset icon --colors 8 --merge 24 --passes 2 --protect on`. Bản 24/32 px ở `icon-attempt1-pixel/`; báo cáo JSON kèm từng ảnh. Đây là ứng viên cần duyệt, không tự tuyên bố đạt đẹp.

RAW: NHẸ; số đo `{"w":1254,"h":1254,"ratio":1,"border":{"clear":1,"flat70":0},"fill":0.94,"softness":0.844,"bigColors":164,"grid":{"period":38,"ratio":1.2},"paletteMatch":0.36,"smallAccent":"8/8"}`.

32px: NHẸ; số đo `{"w":32,"h":32,"colors":8,"outline":1,"hot":0.144,"contrast":0.234,"edge":0.495,"sep":17.5,"bgRatio":1.03,"accent":"8/8"}`.

24px: NHẸ; số đo `{"w":24,"h":24,"colors":7,"outline":1,"hot":0.157,"contrast":0.274,"edge":0.529,"sep":15.8,"bgRatio":0.94,"accent":"8/8"}`.

### Khai báo duyệt mắt icon (`--eye`)

CLI vohon:check chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên kết quả máy.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 84% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — nhieu-mau — 164 màu đáng kể (nên ≤ 160 để ép về ≤ 32 mà không bệt)"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.2 ở chu kỳ 38 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=RAW — lech-mau — 36% điểm sáng cùng họ màu robe / col của tu_vong_chu_hoang (mục 4 cần ≥ 50%)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (13 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.495 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32px — gan-mau — hai màu lớn chỉ cách nhau 17.5 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (10 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.529 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — gan-mau — hai màu lớn chỉ cách nhau 15.8 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=duyệt mắt — Biểu tượng nhện tím đen, mắt tím và đồ án tử vong; kiểm các chân không dính nhau và điểm mắt ở 24 px."
```

```text
--eye "icon-attempt1=bố cục — thân/chân — còn cả hình nhện thu nhỏ thay vì một dấu hiệu đơn; chân/mắt lẫn nhau ở 24 px, chưa đạt đẹp"
```


### Hồ sơ icon để review

Số lượt icon: 1/3; chọn lượt 1 để trình duyệt. Không phải bản đã duyệt nhập game. Xem `icon-attempt1-pixel/preview/index.html` và `icon-attempt1-pixel/preview/so-sanh.png`.

SHA256 prompt trong mục icon tính trên UTF-8, xuống dòng LF, không xuống dòng cuối file; `sent_prompt` và `sent_prompt_sha256` trong source JSON giữ đúng chuỗi đã gửi công cụ (kể cả xuống dòng gốc). So sánh với đầu ra CLI sau chuẩn hóa CRLF/LF: trùng nguyên nội dung, không addendum.
