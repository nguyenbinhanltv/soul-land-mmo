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
