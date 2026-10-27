# ky_nhung_thong_thien_cuc — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **3/3 lượt**, chọn lượt 2. RAW nguyên byte, không hậu kỳ, chưa nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong --id ky_nhung_thong_thien_cuc --style-ref <ảnh neo>`; chỉ dùng ảnh neo Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083, không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

**Tham chiếu ngoại hình; chưa duyệt làm phụ thể năm hướng.** Chọn lượt 2 trong ba lượt: khoảng cách tốt hơn lượt 1 và 3; cánh dao cam đất, rễ đen, nhụy vàng đúng. RAW vẫn CHẶN vì tách sáu thành phần do cánh rời. Chỉ tham chiếu ngoại hình, chưa phải sheet đạt; ne còn lộ nhụy, n nhìn sau đúng. Chi tiết hơi dày (nhẹ).

Số góc thật: khoảng 4. Năm vị trí trình bày theo s, se, e, ne, n; không coi năm vị trí là năm góc thật khi hình đối xứng hoặc hướng sai.

- Ảnh: `concept-attempt2.png`; SHA256 `dcfdd0bb52b5dcb0df1416aa2a312ae1b5cc85d76d908c52d2a5bbb4e7fde88f`.
- Prompt thật đã gửi: `concept-attempt2.prompt.txt`; SHA256 `71f85fa0c0d563d18ee85f797345ec261a1c8e7bb7a097e93aba165599dc68ba`.
- Hồ sơ và kết quả kiểm RAW đầy đủ: `concept-attempt2.source.json`.

## Kiểm RAW

```text
raw concept-attempt2.png pháp tướng (ky_nhung_thong_thien_cuc): CHẶN
  [CHẶN] huong: tách được 6 hướng, cần 5 (s, se, e, ne, n) cách nhau bằng khoảng trống
  [NHẸ] mem: texture mềm: 79% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.12 ở chu kỳ 40 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":6,"softness":0.799,"bigColors":143,"grid":{"period":40,"ratio":1.12},"paletteMatch":1}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo cùng khuôn dưới đây. Lỗi ne/n lộ mặt chỉ khai, không sinh thêm theo chỉ định; hướng xử lý ở khâu phụ thể với hình nộm.

```text
--eye "concept-attempt2=hướng — ne — còn lộ nhụy phía trước"
--eye "concept-attempt2=bố cục — cánh rời — bộ kiểm đếm sáu thành phần, chưa đạt tách tự động"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/ky_nhung_thong_thien_cuc/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
| `art/src/vohon-v2/ky_nhung_thong_thien_cuc/candidates/portrait-attempt1.*` và `portrait-attempt1-P1c2/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Chân dung lô 3 #1158; prompt CLI nguyên văn, RAW + pixel preset portrait2; model/seed unknown. | 2026-10-27 | 1/3 lượt, ứng viên chưa duyệt, không nhập game; SHA256 và --eye bên dưới. |

Lượt loại 1: `candidates/concept-attempt1.png`; SHA256 ảnh `ee37d620c447950f51e08910448d127226b1a13e9bc9ec7b5fc1422b4c087d11`, prompt `71f85fa0c0d563d18ee85f797345ec261a1c8e7bb7a097e93aba165599dc68ba`. Loại lượt 1: cánh chạm nhau làm bộ kiểm tách chỉ bốn khối. Đúng cánh dao cam đất, nhụy vàng, rễ đen và góc sau; chi tiết còn dày.

Lượt loại 3: `candidates/concept-attempt3.png`; SHA256 ảnh `ab6dcf01d81123b16811a8f43e1d2cd0510fec731189c7eb8c79a457824abd3e`, prompt `71f85fa0c0d563d18ee85f797345ec261a1c8e7bb7a097e93aba165599dc68ba`. Loại lượt 3: góc sau rõ, ít texture hơn nhưng cánh chạm, chỉ tách bốn khối. Giữ lượt 2 vì khoảng cách tốt hơn.


## Chân dung lô 3 — #1158, P1c2

Ngày 2026-10-27; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `6ca5fa74bed432ed184bf27791cff4fac939cfec28c3f4ca3bcb5b237783854c`. Prompt nguyên văn từ CLI, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`, SHA256 `5ef0f662c849aa4ac07eedd66b0d8c7ce209e2210ad336cb7003849e9d0f1af6`. Prompt lưu UTF-8 LF; chuỗi gửi gốc và SHA256 giữ trong `candidates/portrait-attempt1.source.json`, chỉ chuẩn hoá xuống dòng.

Ảnh neo: `art/src/vohon-v2/ky_nhung_thong_thien_cuc/concept-attempt2.png`, SHA256 `dcfdd0bb52b5dcb0df1416aa2a312ae1b5cc85d76d908c52d2a5bbb4e7fde88f`. 

Pixel hoá `--preset portrait2` đã duyệt, giữ mặc định 16 màu (brief RAW 6–8 mảng màu); bản `candidates/portrait-attempt1-P1c2/ky_nhung_thong_thien_cuc-portrait.png`. Xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Kết quả máy RAW/P1c2 và lệnh tái tạo trong source JSON, báo cáo pixel kèm thư mục. Chỉ ứng viên trình duyệt, **chưa duyệt, không nhập game**; không chọn thay concept.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI chưa nhận cờ `--eye`; lưu khai báo tường minh, giữ nguyên kết quả máy và RAW.

```text
--eye "portrait-attempt1=RAW/P1c2 — Cánh dao cam đất và nhụy vàng rõ nhưng đối xứng giống mặt nạ, cánh tràn mép; P1c2 còn nhiều cụm nhỏ, lõi vàng mạnh, khối tối giữa các cánh còn nhận ra; cần duyệt hình hoa."
```


## Icon lô 3 — #1159, RAW nearest 24/32 px

Ngày 2026-10-28; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `icon-attempt1.png`, SHA256 `f8d057d95e2d37ab3c237bbb5fd1f7cb16db4a95128b901b53ec2ea376e47358`. Prompt CLI nguyên nội dung, không viết tay / addendum: `icon-attempt1.prompt.txt`, SHA256 `22b127ad00758ef5fea11de1f68d9883b113609c03bfc763763d154248b8db40` (file UTF-8 đã chuẩn hóa LF, có xuống dòng cuối). `sent_prompt` trong source JSON giữ nguyên stdout CLI thực tế sau khi bỏ xuống dòng cuối: **22 CRLF trong khối STYLE, LF ở phần còn lại** do checkout Windows. `sent_prompt_sha256` tính trên chuỗi gốc hỗn hợp đó, không phải file prompt LF. So sánh nội dung sau chuẩn hóa CRLF → LF: trùng nguyên văn, không addendum.

Ảnh neo theo chỉ định lô 3: `art/src/vohon-v2/ky_nhung_thong_thien_cuc/concept-attempt2.png`, SHA256 `dcfdd0bb52b5dcb0df1416aa2a312ae1b5cc85d76d908c52d2a5bbb4e7fde88f`; chỉ tham chiếu ngoại hình, không xác nhận concept đã đạt năm hướng. Hồ sơ đầy đủ và kết quả máy: `icon-attempt1.source.json`. Chuyển bằng preset `icon-nearest`: bỏ nền, cắt hộp bao, nearest-neighbor, viền mặc định; giữ màu RAW, không ép 8 màu. Bản 24/32 và báo cáo tại `icon-attempt1-nearest/`; xem [trang so sánh](icon-attempt1-nearest/preview/index.html).

Ứng viên trình duyệt, chưa duyệt nhập game. Lỗi còn lại chỉ khai dưới đây, không sửa RAW.

### Khai báo duyệt mắt icon (`--eye`)

CLI chưa nhận cờ `--eye`; giữ nguyên kết quả máy và lưu khai báo tường minh:

```text
--eye "icon-attempt1=24 — cham-mep — hình chạm mép ảnh (3 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24 — nhieu-chi-tiet — mật độ biên 0.928 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32 — cham-mep — hình chạm mép ảnh (4 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32 — nhieu-chi-tiet — mật độ biên 0.917 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=raw — mem — texture mềm: 86% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=raw — luoi — chưa đúng lưới khối: tỉ số biên 1.24 ở chu kỳ 38 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=duyệt mắt — Đóa hoa cánh dao cam đất, nhụy vàng trên khe đỏ tối; còn rễ và cánh rời, vòng sáng nhiều dấu nhọn làm rối bố cục; nhụy sáng còn thấy, cánh nhỏ và rễ dễ nhập nhau ở 24 px; chưa đạt dấu hiệu đơn gọn hoàn toàn."
```

### Ghi công icon

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/ky_nhung_thong_thien_cuc/icon-attempt1.*` và `icon-attempt1-nearest/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) + vohon-pixelize icon-nearest | Icon lô 3 #1159; prompt CLI nguyên văn, concept riêng làm neo; model/seed unknown. | 2026-10-28 | 1/3 lượt; ứng viên chưa duyệt, không nhập game; SHA256 ở trên. |
