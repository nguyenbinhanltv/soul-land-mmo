# nguyet_nhan — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1. RAW nguyên byte, không hậu kỳ, chưa nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong --id nguyet_nhan --style-ref <ảnh neo>`; chỉ dùng ảnh neo Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083, không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

**Tham chiếu ngoại hình; chưa duyệt làm phụ thể năm hướng.** Hai lưỡi liềm dựng riêng, răng trong đỏ máu, thép xám tím và mép bạc; đủ năm khối, RAW NHẸ do texture và lưới. n gần trùng s, ne gần đối xứng se: khoảng ba góc thật cho vật đối xứng. Đạo văn và mảnh trăng còn dày, thêm chóp lớn ở giữa làm hình nặng; ghi để cân nhắc khi làm phụ thể, chưa nhập game.

Số góc thật: khoảng 3 (vật cứng đối xứng). Năm vị trí trình bày theo s, se, e, ne, n; không coi năm vị trí là năm góc thật khi hình đối xứng hoặc hướng sai.

- Ảnh: `concept-attempt1.png`; SHA256 `b1c8275128014d1c14f48a2f3ce6eacf92f841efe9865dc6f72b57b02a9d3785`.
- Prompt thật đã gửi: `concept-attempt1.prompt.txt`; SHA256 `4453019a4451210fe4bdae1708175b66af0b4150d63dc9789c81227d825bffb1`.
- Hồ sơ và kết quả kiểm RAW đầy đủ: `concept-attempt1.source.json`.

## Kiểm RAW

```text
raw concept-attempt1.png pháp tướng (nguyet_nhan): NHẸ
  [NHẸ] mem: texture mềm: 77% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.12 ở chu kỳ 34 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":2172,"h":724,"ratio":3,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.02,"softness":0.776,"bigColors":97,"grid":{"period":34,"ratio":1.12},"paletteMatch":0.7}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo cùng khuôn dưới đây. Lỗi ne/n lộ mặt chỉ khai, không sinh thêm theo chỉ định; hướng xử lý ở khâu phụ thể với hình nộm.

```text
--eye "concept-attempt1=hướng — n/ne — n gần trùng s, ne gần đối xứng se"
--eye "concept-attempt1=chi tiết — khối giữa — chóp giữa lớn, đạo văn và mảnh trăng hơi dày"
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/nguyet_nhan/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
