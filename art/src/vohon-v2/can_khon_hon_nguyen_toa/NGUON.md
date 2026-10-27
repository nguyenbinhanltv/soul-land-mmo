# can_khon_hon_nguyen_toa — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **2/3 lượt**, chọn lượt 2. RAW nguyên byte, không hậu kỳ, chưa nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong --id can_khon_hon_nguyen_toa --style-ref <ảnh neo>`; chỉ dùng ảnh neo Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083, không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

**Tham chiếu ngoại hình; chưa duyệt làm phụ thể năm hướng.** Chọn lượt 2: đủ năm khối riêng, thân đồng tối cạnh xích đen, khóa đỏ và mép vàng; mặt sau có trục và chuỗi xích khác mặt trước. RAW NHẸ do texture và lưới, không sinh lại. Vật cứng đối xứng khoảng ba góc thật; ne nghiêng trái, e còn hơi thấy mặt khóa. Đạo văn nhỏ hơi dày; vài móc gần mép ảnh. Chưa nhập game.

Số góc thật: khoảng 3 (vật cứng đối xứng). Năm vị trí trình bày theo s, se, e, ne, n; không coi năm vị trí là năm góc thật khi hình đối xứng hoặc hướng sai.

- Ảnh: `concept-attempt2.png`; SHA256 `107711d2bee5f86479aaafa0cf1741dacb1dec6039bec07243214e1ee76dd071`.
- Prompt thật đã gửi: `concept-attempt2.prompt.txt`; SHA256 `f9d048df6a979b1d81c886a7c70029e2ea1e67947ba45881156fbdf394ac6ee1`.
- Hồ sơ và kết quả kiểm RAW đầy đủ: `concept-attempt2.source.json`.

## Kiểm RAW

```text
raw concept-attempt2.png pháp tướng (can_khon_hon_nguyen_toa): NHẸ
  [NHẸ] mem: texture mềm: 78% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.12 ở chu kỳ 35 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.13,"softness":0.783,"bigColors":129,"grid":{"period":35,"ratio":1.12},"paletteMatch":0.98}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo cùng khuôn dưới đây. Lỗi ne/n lộ mặt chỉ khai, không sinh thêm theo chỉ định; hướng xử lý ở khâu phụ thể với hình nộm.

```text
--eye "concept-attempt2=hướng — ne/e — ne nghiêng trái, e còn thấy một phần mặt khóa"
--eye "concept-attempt2=chi tiết — vòng chữ cổ — nét nhỏ dày, móc ngoài gần mép"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/can_khon_hon_nguyen_toa/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
| `art/src/vohon-v2/can_khon_hon_nguyen_toa/candidates/portrait-attempt1.*` và `portrait-attempt1-P1c2/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Chân dung lô 3 #1158; prompt CLI nguyên văn, RAW + pixel preset portrait2; model/seed unknown. | 2026-10-27 | 1/3 lượt, ứng viên chưa duyệt, không nhập game; SHA256 và --eye bên dưới. |

Lượt loại 1: `candidates/concept-attempt1.png`; SHA256 ảnh `79791c7536060325dac603853a7beff3ccc1dd0c3811abcbe58f0a62627286af`, prompt `f9d048df6a979b1d81c886a7c70029e2ea1e67947ba45881156fbdf394ac6ee1`. Loại lượt 1: hai hình ne/n chạm nhau làm bộ kiểm chỉ tách bốn khối. Vòng pháp khí, khóa đỏ, xích đen vàng nhận diện đúng; các móc thêm vết nứt cam không có trong brief. Hình mặt sau rõ.


## Chân dung lô 3 — #1158, P1c2

Ngày 2026-10-27; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `bf0aa5bb78f40d9c9f2c100b5425cd0715f04a5e6ce31f88909436c4dacf1003`. Prompt nguyên văn từ CLI, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`, SHA256 `aa0426e00da6e1155d4bc8f5683f8983335977d759e118469ba275a039b5285f`. Prompt lưu UTF-8 LF; chuỗi gửi gốc và SHA256 giữ trong `candidates/portrait-attempt1.source.json`, chỉ chuẩn hoá xuống dòng.

Ảnh neo: `art/src/vohon-v2/can_khon_hon_nguyen_toa/concept-attempt2.png`, SHA256 `107711d2bee5f86479aaafa0cf1741dacb1dec6039bec07243214e1ee76dd071`. 

Pixel hoá `--preset portrait2` đã duyệt, giữ mặc định 16 màu (brief RAW 6–8 mảng màu); bản `candidates/portrait-attempt1-P1c2/can_khon_hon_nguyen_toa-portrait.png`. Xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Kết quả máy RAW/P1c2 và lệnh tái tạo trong source JSON, báo cáo pixel kèm thư mục. Chỉ ứng viên trình duyệt, **chưa duyệt, không nhập game**; không chọn thay concept.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI chưa nhận cờ `--eye`; lưu khai báo tường minh, giữ nguyên kết quả máy và RAW.

```text
--eye "portrait-attempt1=RAW/P1c2 — Vòng đồng nhiều lớp, ổ khóa đỏ trung tâm, xích sắt và móc nhọn nhận ra. Chi tiết vòng/xích dày; chóp và xích dưới bị cắt; vàng sáng lan nhiều điểm ngoài lõi. P1c2 khóa đỏ nhỏ nhưng còn đọc ra, mắt xích thành cụm vụn, thân ấm tách nền tím tối."
```


## Icon lô 3 — #1159, RAW nearest 24/32 px

Ngày 2026-10-28; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `icon-attempt1.png`, SHA256 `ee1f7dbfc2b50611b00ab5b5201e9fb41248d984e397c7cfb192b34f8f6128cc`. Prompt CLI nguyên nội dung, không viết tay / addendum: `icon-attempt1.prompt.txt`, SHA256 `469f9496f530ff36342d4f36190cb75f2dd043647d2eef3919c39a98c9f8afb4` (file UTF-8 đã chuẩn hóa LF, có xuống dòng cuối). `sent_prompt` trong source JSON giữ nguyên stdout CLI thực tế sau khi bỏ xuống dòng cuối: **22 CRLF trong khối STYLE, LF ở phần còn lại** do checkout Windows. `sent_prompt_sha256` tính trên chuỗi gốc hỗn hợp đó, không phải file prompt LF. So sánh nội dung sau chuẩn hóa CRLF → LF: trùng nguyên văn, không addendum.

Ảnh neo theo chỉ định lô 3: `art/src/vohon-v2/can_khon_hon_nguyen_toa/concept-attempt2.png`, SHA256 `107711d2bee5f86479aaafa0cf1741dacb1dec6039bec07243214e1ee76dd071`; chỉ tham chiếu ngoại hình, không xác nhận concept đã đạt năm hướng. Hồ sơ đầy đủ và kết quả máy: `icon-attempt1.source.json`. Chuyển bằng preset `icon-nearest`: bỏ nền, cắt hộp bao, nearest-neighbor, viền mặc định; giữ màu RAW, không ép 8 màu. Bản 24/32 và báo cáo tại `icon-attempt1-nearest/`; xem [trang so sánh](icon-attempt1-nearest/preview/index.html).

Ứng viên trình duyệt, chưa duyệt nhập game. Lỗi còn lại chỉ khai dưới đây, không sửa RAW.

### Khai báo duyệt mắt icon (`--eye`)

CLI chưa nhận cờ `--eye`; giữ nguyên kết quả máy và lưu khai báo tường minh:

```text
--eye "icon-attempt1=24 — nhieu-chi-tiet — mật độ biên 0.934 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=32 — nhieu-chi-tiet — mật độ biên 0.936 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=raw — mem — texture mềm: 87% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=raw — luoi — chưa đúng lưới khối: tỉ số biên 1.43 ở chu kỳ 27 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=duyệt mắt — Ổ khóa đỏ ở giữa mâm vàng sẫm và xích đen; nhiều quả chùy treo và đạo văn li ti, mâm dễ đọc như khiên ở 24 px; lỗ khóa và xích mất nét nhỏ, cần duyệt mức cô đọng biểu tượng."
```

### Ghi công icon

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/can_khon_hon_nguyen_toa/icon-attempt1.*` và `icon-attempt1-nearest/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) + vohon-pixelize icon-nearest | Icon lô 3 #1159; prompt CLI nguyên văn, concept riêng làm neo; model/seed unknown. | 2026-10-28 | 1/3 lượt; ứng viên chưa duyệt, không nhập game; SHA256 ở trên. |
