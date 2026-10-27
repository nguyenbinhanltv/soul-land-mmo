# U Minh Linh Miêu — concept năm hướng (#1096)

RAW nguyên byte từ builtin image_gen.imagegen, chưa crop, resize, hậu kỳ hay nhập game. Model/seed unknown.

- Số lượt đã dùng: 1/3. Bản chọn: concept-attempt1.png.
- SHA256 ảnh: 15c2147ec62e9e1bdbe8752161bf3f31863e4ce5b46e93b4ad1c2c081dbb2e36.
- Prompt concept-attempt1.prompt.txt; SHA256: 487036f69ae0f8786a0d69d5fabb6af71dc9481f32494d58187b62ddf3a3f84b. Sinh nguyên văn bằng vohon-prompt.mjs, không thêm addendum.
- Neo phong cách: concept Hạo Thiên lượt 2 từ PR #1083; không dùng ảnh cũ hay ảnh lỗi.
- Số góc thật: 5; thứ tự s/se/e/ne/n. Nhận xét duyệt mắt: ne/n nhìn lưng, không mặt. e rộng và hơi chếch; mắt tím sáng, móng rõ; khí tím rộng, cạnh mềm. Không chữ, người, khung.
- Chưa phải phê duyệt chính thức; không tạo asset game từ concept này.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| art/src/vohon-v2/u_minh_linh_mieu/ | - | builtin image_gen.imagegen (ChatGPT / Codex) | Concept năm hướng U Minh Linh Miêu; model/seed unknown; SHA256 và prompt ghi ở trên, từng lượt có source.json. |2026-10-27; chân dung lô 2 RAW/P1c2 #1158, 1/3 lượt. | Concept và chân dung lô 2 RAW/P1c2; chưa nhập game. |

## Kết quả kiểm RAW tại repo

- Bản chọn: concept-attempt1.png; kích thước 2172×724.
- vohon-check raw: **NHẸ**, tách đủ **5 hình**, chênh cỡ 1.12×, màu khớp **98%**.
- Cảnh báo máy: texture mềm, chưa đúng lưới khối.
- Ảnh neo nằm ở **nhánh PR #1083**, đường dẫn art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png, chưa phải ảnh sẵn có trên main.
- Dùng --type phaptuong theo khuôn concept #1096 để sinh bố cục năm hướng; không tạo pháp tướng thay thế hoặc nhập game.

## Khai báo --eye theo quyết định ở PR #1147

Không sinh thêm; giữ bản chọn nêu trên. Concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý khi làm phụ thể với hình nộm. Công cụ võ hồn chưa nhận cờ --eye; các khai báo dưới đây được lưu tường minh và đồng bộ trong trường eye của source.json, không phải lệnh đã chạy.

- `--eye "concept-attempt1=hướng — e — còn hơi chếch, hình ngang rộng hơn các góc khác; ne/n không lộ mặt"`
  LỖI: hướng — e — còn hơi chếch, hình ngang rộng hơn các góc khác; ne/n không lộ mặt (mắt).


## Chân dung lô 2 — #1158, P1c2

Ngày 2026-10-27; 1/3 lượt chân dung. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte: `candidates/portrait-attempt1.png`; SHA256 `905aa5b3699ed4fd193cdd4563e5079e57e4e278e43fe0595ed8a9374f66912d`. Prompt CLI nguyên văn, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`; SHA256 `70cf9adc2ffacae9cd302b0f9b18cbc6c3d256a2c859c5f094e469624d490d4a`. Neo ngoại hình `concept-attempt1.png`, SHA256 `15c2147ec62e9e1bdbe8752161bf3f31863e4ce5b46e93b4ad1c2c081dbb2e36`. Lệnh và kết quả máy ở `candidates/portrait-attempt1.source.json`.

Pixel hoá bằng `--preset portrait2` (P1c2 đã duyệt 27/10), giữ mặc định 16 màu của preset; brief RAW 6–8 mảng màu không phải giới hạn bảng màu P1c2. Bản 64×64: `candidates/portrait-attempt1-P1c2/u_minh_linh_mieu-portrait.png`; xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Chỉ ứng viên trình duyệt, chưa nhập game; không chọn thay concept. Không dùng lại ảnh lỗi làm neo.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI võ hồn chưa nhận cờ này; lưu khai báo tường minh, không sửa công cụ hoặc RAW.

```text
--eye "portrait-attempt1=góc chính diện thay vì 3/4; khí tím rộng cùng gam thân; thân tối có nguy cơ dính nền, mắt trắng tím rõ; chi tiết nhỏ cần duyệt ở 64×64"
```

```text
--eye "portrait-attempt1=P1c2 — mắt trắng của RAW giảm mạnh thành tím tối, khó đọc ở 64×64; chưa đạt điểm sáng."
```

Prompt lưu UTF-8 LF theo Git; SHA256 chuỗi gửi nguyên bản `1e341970faf2f60cc6a32d16519cfd6c7314ef15842e894cd98c91433f3ac174` và `sent_prompt` ở source JSON. Chỉ chuẩn hóa xuống dòng, nội dung trùng CLI.


## Icon lô 2 — RAW nearest (#1159)

Ngày 2026-10-28; builtin `image_gen.imagegen`, model/seed `unknown`. Số lượt icon **1/3**, chọn lượt 1 trình duyệt; chưa nhập game. RAW giữ nguyên byte từ công cụ.

- RAW: `icon-attempt1.png`, SHA256 `e8594e8e3596be35593858e9989190a27849ad7097a075c8e37562a7b7ff53ea`.
- Prompt: `icon-attempt1.prompt.txt`, SHA256 `def4299b6f3eccadb3ef7146ab08b617154d384aa42dc82e1adbb0be4eaec48f`; nguyên nội dung CLI `node tools/assets/vohon-prompt.mjs --type icon --id u_minh_linh_mieu --style-ref art/src/vohon-v2/u_minh_linh_mieu/concept-attempt1.png` (bỏ newline cuối stdout); không viết tay, không addendum.
- Ảnh neo: `concept-attempt1.png`, SHA256 `15c2147ec62e9e1bdbe8752161bf3f31863e4ce5b46e93b4ad1c2c081dbb2e36`; không dùng ảnh cũ hay lượt hỏng.
- Nguồn chi tiết: `icon-attempt1.source.json`. Icon một góc, không áp dụng yêu cầu năm hướng của concept.
- Xuất: `node tools/assets/vohon-pixelize.mjs --type icon --id u_minh_linh_mieu --in art/src/vohon-v2/u_minh_linh_mieu/icon-attempt1.png --out art/src/vohon-v2/u_minh_linh_mieu/icon-attempt1-nearest --preset icon-nearest`; giữ màu RAW, không ép 8 màu.
- Cặp 24/32 px và report/check JSON: `icon-attempt1-nearest/`; [xem trước](icon-attempt1-nearest/preview/index.html).

### Khai báo lỗi còn lại (`--eye`)

CLI chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên báo cáo máy. Không tự tuyên bố đạt đẹp.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 95% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.44 ở chu kỳ 40 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (8 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — mat-sang — vùng sáng chỉ 0.3%: mất điểm sáng (mắt, lõi, lưỡi), hình sẽ tối đặc"
--eye "icon-attempt1=32px — phang — tương phản thấp (độ lệch luma 0.09): hình phẳng, khó đọc khi thu nhỏ"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.938 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (7 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — mat-sang — vùng sáng chỉ 0.3%: mất điểm sáng (mắt, lõi, lưỡi), hình sẽ tối đặc"
--eye "icon-attempt1=24px — phang — tương phản thấp (độ lệch luma 0.08): hình phẳng, khó đọc khi thu nhỏ"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.916 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=duyệt mắt — Đầu báo và mắt tím; thân tối, khí tím nhiều nhánh, cần duyệt trên nền tối ở 24 px."
```
