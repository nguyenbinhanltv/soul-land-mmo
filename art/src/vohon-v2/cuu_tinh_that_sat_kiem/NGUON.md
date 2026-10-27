# cuu_tinh_that_sat_kiem — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1. RAW nguyên byte, không hậu kỳ, chưa nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong --id cuu_tinh_that_sat_kiem --style-ref <ảnh neo>`; chỉ dùng ảnh neo Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083, không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

**Tham chiếu ngoại hình; chưa duyệt làm phụ thể năm hướng.** Kiếm bản rộng thép xanh, sống gãy, chuôi hai tay, bảy điểm sao và điểm đỏ nhận diện rõ; đủ năm khối tách. CHẶN tự động vì bề rộng góc cạnh e hẹp, chiều cao chỉ lệch 1,01 lần; vật đối xứng chấp nhận khoảng ba góc thật. ne còn giống mặt trước, n bỏ sao; trang trí hơi dày và sao hơi nhọn, lỗi nhẹ. Giữ nguyên cảnh báo, không nhập game.

Số góc thật: khoảng 3 (vật cứng đối xứng). Năm vị trí trình bày theo s, se, e, ne, n; không coi năm vị trí là năm góc thật khi hình đối xứng hoặc hướng sai.

- Ảnh: `concept-attempt1.png`; SHA256 `fd3d5096e24b97581923de32e9643a85119d23c220c1a9a8bb46431a840c51fb`.
- Prompt thật đã gửi: `concept-attempt1.prompt.txt`; SHA256 `9d930ca041324a9aacc0bdb272d9cc12be2e3000ed3b5b580666a42cf6fed444`.
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
| `art/src/vohon-v2/cuu_tinh_that_sat_kiem/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
