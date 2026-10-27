# can_khon_hon_nguyen_toa — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1. RAW nguyên byte, không hậu kỳ, chưa nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong --id can_khon_hon_nguyen_toa --style-ref <ảnh neo>`; chỉ dùng ảnh neo Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083, không dùng ảnh cũ hay lượt hỏng.

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

L??t lo?i 1: `candidates/concept-attempt1.png`; SHA256 ?nh `79791c7536060325dac603853a7beff3ccc1dd0c3811abcbe58f0a62627286af`, prompt `f9d048df6a979b1d81c886a7c70029e2ea1e67947ba45881156fbdf394ac6ee1`. Loại lượt 1: hai hình ne/n chạm nhau làm bộ kiểm chỉ tách bốn khối. Vòng pháp khí, khóa đỏ, xích đen vàng nhận diện đúng; các móc thêm vết nứt cam không có trong brief. Hình mặt sau rõ.
