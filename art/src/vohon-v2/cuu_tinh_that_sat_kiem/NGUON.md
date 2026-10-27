# cuu_tinh_that_sat_kiem — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1. RAW nguyên byte, không hậu kỳ, chưa nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong --id cuu_tinh_that_sat_kiem --style-ref <ảnh neo>`; chỉ dùng ảnh neo Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083, không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

**Tham chiếu ngoại hình; chưa duyệt làm phụ thể năm hướng.** Kiếm bản rộng thép xanh, sống gãy, chuôi hai tay, bảy điểm sao và điểm đỏ nhận diện rõ; đủ năm khối tách. CHẶN tự động vì bề rộng góc cạnh e hẹp, chiều cao chỉ lệch 1,01 lần; vật đối xứng chấp nhận khoảng ba góc thật. ne còn giống mặt trước, n bỏ sao; trang trí hơi dày và sao hơi nhọn, lỗi nhẹ. Giữ nguyên cảnh báo, không nhập game.

Số góc thật: khoảng 3 (vật cứng đối xứng). Năm vị trí trình bày theo s, se, e, ne, n; không coi năm vị trí là năm góc thật khi hình đối xứng hoặc hướng sai.

- Ảnh: `concept-attempt1.png`; SHA256 `fd3d5096e24b97581923de32e9643a85119d23c220c1a9a8bb46431a840c51fb`.
- Prompt thật đã gửi: `concept-attempt1.prompt.txt`; SHA256 `f4fdbbd7080081535fbc4f6cb24385f010a2683c3cec40e82c504eaa99575aa5`.
- Hồ sơ và kết quả kiểm RAW đầy đủ: `concept-attempt1.source.json`.

## Kiểm RAW

```text
raw concept-attempt1.png pháp tướng (cuu_tinh_that_sat_kiem): CHẶN
  [CHẶN] ti-le: năm hướng lệch cỡ quá (cao 1.01×): không phải cùng một hình
  [NHẸ] mem: texture mềm: 79% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] nhieu-mau: 166 màu đáng kể (nên ≤ 160 để ép về ≤ 48 mà không bệt)
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.15 ở chu kỳ 31 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.01,"softness":0.794,"bigColors":166,"grid":{"period":31,"ratio":1.15},"paletteMatch":0.99}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo cùng khuôn dưới đây. Lỗi ne/n lộ mặt chỉ khai, không sinh thêm theo chỉ định; hướng xử lý ở khâu phụ thể với hình nộm.

```text
--eye "concept-attempt1=hướng — ne — còn giống mặt trước; e nhìn cạnh rất hẹp"
--eye "concept-attempt1=chi tiết — sao và hoa văn — hơi dày, sao hơi nhọn"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/cuu_tinh_that_sat_kiem/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. |2026-10-27; chân dung lô 2 RAW/P1c2 #1158, 1/3 lượt. | Chưa duyệt, không nhập game. |


## Chân dung lô 2 — #1158, P1c2

Ngày 2026-10-27; 1/3 lượt chân dung. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte: `candidates/portrait-attempt1.png`; SHA256 `07efb5f3936ea488f8b1b267e4fd03277ac63030bd6487c20c3f7e821cd79840`. Prompt CLI nguyên văn, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`; SHA256 `898af984f078c15fe7edbe46ec0b1d69f053fd7b09be68e43b09e7858da3afea`. Neo ngoại hình `concept-attempt1.png`, SHA256 `fd3d5096e24b97581923de32e9643a85119d23c220c1a9a8bb46431a840c51fb`. Lệnh và kết quả máy ở `candidates/portrait-attempt1.source.json`.

Pixel hoá bằng `--preset portrait2` (P1c2 đã duyệt 27/10), giữ mặc định 16 màu của preset; brief RAW 6–8 mảng màu không phải giới hạn bảng màu P1c2. Bản 64×64: `candidates/portrait-attempt1-P1c2/cuu_tinh_that_sat_kiem-portrait.png`; xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Chỉ ứng viên trình duyệt, chưa nhập game; không chọn thay concept. Không dùng lại ảnh lỗi làm neo.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI võ hồn chưa nhận cờ này; lưu khai báo tường minh, không sửa công cụ hoặc RAW.

```text
--eye "portrait-attempt1=nhận diện — có tám điểm sao thay vì bảy; góc chính diện thay vì 3/4; cận chuôi/sống kiếm cắt mất mũi, mép thép sáng rộng và quầng lam tranh sao; candidate chưa đạt"
```

```text
--eye "portrait-attempt1=P1c2 — sao dọc sống kiếm dính vào mép thép trắng, ngọc đỏ nhỏ khó đọc."
```

Prompt lưu UTF-8 LF theo Git; SHA256 chuỗi gửi nguyên bản `8c1bbb09dda896ca7e048bd97b05ed32e685d9c36dac8d4d75eb11f4aca28425` và `sent_prompt` ở source JSON. Chỉ chuẩn hóa xuống dòng, nội dung trùng CLI.


## Icon lô 2 — RAW nearest (#1159)

Ngày 2026-10-28; builtin `image_gen.imagegen`, model/seed `unknown`. Số lượt icon **1/3**, chọn lượt 1 trình duyệt; chưa nhập game. RAW giữ nguyên byte từ công cụ.

- RAW: `icon-attempt1.png`, SHA256 `e174b8d29bcbfaa54cc2ee642957c3286c2f5b60c0101910725fc085ebac2a93`.
- Prompt: `icon-attempt1.prompt.txt`, SHA256 `3ac3e8d5b1e621299262509e763eb4914f2307b027f79ca6d07ee613ebb783e4`; nguyên nội dung CLI `node tools/assets/vohon-prompt.mjs --type icon --id cuu_tinh_that_sat_kiem --style-ref art/src/vohon-v2/cuu_tinh_that_sat_kiem/concept-attempt1.png` (bỏ newline cuối stdout); không viết tay, không addendum.
- Ảnh neo: `concept-attempt1.png`, SHA256 `fd3d5096e24b97581923de32e9643a85119d23c220c1a9a8bb46431a840c51fb`; không dùng ảnh cũ hay lượt hỏng.
- Nguồn chi tiết: `icon-attempt1.source.json`. Icon một góc, không áp dụng yêu cầu năm hướng của concept.
- Xuất: `node tools/assets/vohon-pixelize.mjs --type icon --id cuu_tinh_that_sat_kiem --in art/src/vohon-v2/cuu_tinh_that_sat_kiem/icon-attempt1.png --out art/src/vohon-v2/cuu_tinh_that_sat_kiem/icon-attempt1-nearest --preset icon-nearest`; giữ màu RAW, không ép 8 màu.
- Cặp 24/32 px và report/check JSON: `icon-attempt1-nearest/`; [xem trước](icon-attempt1-nearest/preview/index.html).

### Khai báo lỗi còn lại (`--eye`)

CLI chưa hỗ trợ cờ --eye; lưu khai báo tại đây, giữ nguyên báo cáo máy. Không tự tuyên bố đạt đẹp.

```text
--eye "icon-attempt1=RAW — mem — texture mềm: 85% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất"
--eye "icon-attempt1=RAW — nhieu-mau — 163 màu đáng kể (nên ≤ 160 để ép về ≤ 32 mà không bệt)"
--eye "icon-attempt1=RAW — luoi — chưa đúng lưới khối: tỉ số biên 1.46 ở chu kỳ 28 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)"
--eye "icon-attempt1=32px — cham-mep — hình chạm mép ảnh (1 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=32px — nhieu-chi-tiet — mật độ biên 0.888 (> 0.3): còn nhiều mảng nhỏ ở cỡ 32×32, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — cham-mep — hình chạm mép ảnh (1 điểm): viền ngoài bị cắt"
--eye "icon-attempt1=24px — nhieu-chi-tiet — mật độ biên 0.87 (> 0.3): còn nhiều mảng nhỏ ở cỡ 24×24, hình khó đọc khi nhìn lướt; cắt sát hơn (--zoom / --crop) hoặc xin bản đơn giản hơn"
--eye "icon-attempt1=24px — gan-mau — hai màu lớn chỉ cách nhau 35.8 (< 36): các mảng cùng gam dính nhau; thử --preset portrait, --hue-shift hoặc --max-colors nhỏ hơn"
--eye "icon-attempt1=duyệt mắt — Một thanh kiếm thép xanh, bảy sao thấy ở RAW; khi thu nhỏ các sao khó đếm riêng, cạnh kiếm nhiều khuyết nhỏ."
```
