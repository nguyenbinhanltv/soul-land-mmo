# Hỏa Long — concept năm hướng (#1096)

RAW nguyên byte từ builtin image_gen.imagegen, chưa crop, resize, hậu kỳ hay nhập game. Model/seed unknown.

- Số lượt đã dùng: 3/3. Bản chọn: concept-attempt3.png.
- SHA256 ảnh: bad3357f91644763647671b0e7cada9f6a376314b34c528dca829f9965be961a.
- Prompt concept-attempt3.prompt.txt; SHA256: d093e7f0b7ae29695490ff6f67225f16594bdcdc04c02f5d30f12757067a8ae3. Sinh nguyên văn bằng vohon-prompt.mjs, không thêm addendum.
- Neo phong cách: concept Hạo Thiên lượt 2 từ PR #1083; không dùng ảnh cũ hay ảnh lỗi.
- Số góc thật: 5; thứ tự s/se/e/ne/n. Nhận xét duyệt mắt: Lượt 1/2 trong candidates bị CHẶN do ne lộ mặt hoặc quay trái. Lượt 3: ne quay phải che mắt, còn mép miệng sáng; n không mặt. e hơi chếch. Thân than xám, lõi vàng; chi tiết nhỏ. Hết 3 lượt; cần duyệt ne.
- Chưa phải phê duyệt chính thức; không tạo asset game từ concept này.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| art/src/vohon-v2/hoa_long/ | - | builtin image_gen.imagegen (ChatGPT / Codex) | Concept năm hướng Hỏa Long; model/seed unknown; SHA256 và prompt ghi ở trên, từng lượt có source.json. |2026-10-27; chân dung lô 2 RAW/P1c2 #1158, 1/3 lượt. | Concept và chân dung lô 2 RAW/P1c2; chưa nhập game. |

## Kết quả kiểm RAW tại repo

- Bản chọn: concept-attempt3.png; kích thước 1983×793.
- vohon-check raw: **NHẸ**, tách đủ **5 hình**, chênh cỡ 1.01×, màu khớp **97%**.
- Cảnh báo máy: texture mềm, chưa đúng lưới khối.
- Ảnh neo nằm ở **nhánh PR #1083**, đường dẫn art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png, chưa phải ảnh sẵn có trên main.
- Dùng --type phaptuong theo khuôn concept #1096 để sinh bố cục năm hướng; không tạo pháp tướng thay thế hoặc nhập game.
- Candidates: mỗi lượt có 5 hình nhưng góc ne sai, chỉ 4 hướng đáp ứng; không dùng làm ảnh neo.

## Khai báo --eye theo quyết định ở PR #1147

Không sinh thêm; giữ bản chọn nêu trên. Concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý khi làm phụ thể với hình nộm. Công cụ võ hồn chưa nhận cờ --eye; các khai báo dưới đây được lưu tường minh và đồng bộ trong trường eye của source.json, không phải lệnh đã chạy.

- `--eye "concept-attempt3=hướng — se/e — hai góc gần giống nhau, e còn chếch trước"`
  LỖI: hướng — se/e — hai góc gần giống nhau, e còn chếch trước (mắt).
- `--eye "concept-attempt3=hướng — ne — còn mép miệng sáng, chưa che toàn bộ mặt; n nhìn lưng"`
  LỖI: hướng — ne — còn mép miệng sáng, chưa che toàn bộ mặt; n nhìn lưng (mắt).


## Chân dung lô 2 — #1158, P1c2

Ngày 2026-10-27; 1/3 lượt chân dung. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte: `candidates/portrait-attempt1.png`; SHA256 `5a906f55e902f474e33cc3a1af11e613025dddc0b604233c5566ea87e2ec904d`. Prompt CLI nguyên văn, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`; SHA256 `9e2d9156538d79378492667530bdd1d3f812bde7ab74c89d07dbd93e852c20f5`. Neo ngoại hình `concept-attempt3.png`, SHA256 `bad3357f91644763647671b0e7cada9f6a376314b34c528dca829f9965be961a`. Lệnh và kết quả máy ở `candidates/portrait-attempt1.source.json`.

Pixel hoá bằng `--preset portrait2` (P1c2 đã duyệt 27/10), giữ mặc định 16 màu của preset; brief RAW 6–8 mảng màu không phải giới hạn bảng màu P1c2. Bản 64×64: `candidates/portrait-attempt1-P1c2/hoa_long-portrait.png`; xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Chỉ ứng viên trình duyệt, chưa nhập game; không chọn thay concept. Không dùng lại ảnh lỗi làm neo.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI võ hồn chưa nhận cờ này; lưu khai báo tường minh, không sửa công cụ hoặc RAW.

```text
--eye "portrait-attempt1=góc chính diện thay vì 3/4; lõi miệng và vết lửa trên sừng/thân sáng rộng; cổ chạm mép dưới; cần duyệt độ tách nền và mắt ở 64×64"
```

```text
--eye "portrait-attempt1=P1c2 — mắt nhỏ yếu hơn lõi miệng, mảng lửa bị vỡ thành nhiều đốm."
```

Prompt lưu UTF-8 LF theo Git; SHA256 chuỗi gửi nguyên bản `fb816d30ed4a7e092a9e7103bf51a268a55f05a467ad1abe2640c45694aa3f92` và `sent_prompt` ở source JSON. Chỉ chuẩn hóa xuống dòng, nội dung trùng CLI.


## Icon lô 2 — RAW nearest (#1159)

Ngày 2026-10-28; builtin `image_gen.imagegen`, model/seed `unknown`. Số lượt icon **1/3**, chọn lượt 1 trình duyệt; chưa nhập game. RAW giữ nguyên byte từ công cụ.

- RAW: `icon-attempt1.png`, SHA256 `16f2080a7e6390ddbadc1c40ec9d747c77f633d27f178d994592e6471d555281`.
- Prompt: `icon-attempt1.prompt.txt`, SHA256 `4932e2bff28ef0c271bc5009e5fcade02d6fd3be9ee2fda85b573b47b9d08875`; nguyên nội dung CLI `node tools/assets/vohon-prompt.mjs --type icon --id hoa_long --style-ref art/src/vohon-v2/hoa_long/concept-attempt3.png` (bỏ newline cuối stdout); không viết tay, không addendum.
- Ảnh neo: `concept-attempt3.png`, SHA256 `bad3357f91644763647671b0e7cada9f6a376314b34c528dca829f9965be961a`; không dùng ảnh cũ hay lượt hỏng.
- Nguồn chi tiết: `icon-attempt1.source.json`. Icon một góc, không áp dụng yêu cầu năm hướng của concept.
- Xuất: `node tools/assets/vohon-pixelize.mjs --type icon --id hoa_long --in art/src/vohon-v2/hoa_long/icon-attempt1.png --out art/src/vohon-v2/hoa_long/icon-attempt1-nearest --preset icon-nearest`; giữ màu RAW, không ép 8 màu.
- Cặp 24/32 px và report/check JSON: `icon-attempt1-nearest/`; [xem trước](icon-attempt1-nearest/preview/index.html).

### Khai báo lỗi còn lại (`--eye`)

CLI chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên báo cáo máy. Không tự tuyên bố đạt đẹp.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 89% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.23 ở chu kỳ 39 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (9 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.958 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (12 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.943 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=duyệt mắt — Đầu rồng và hỏa châu rõ; nhiều đường lửa có thể cạnh tranh với mắt ở 24 px."
```
