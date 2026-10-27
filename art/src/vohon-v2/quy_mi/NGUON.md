# quy_mi — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. **1/3 lượt**, chọn lượt 1 làm tham chiếu ngoại hình. RAW nguyên byte, không hậu kỳ, chưa duyệt, không nhập game.

Prompt nguyên bản do `vohon-prompt.mjs --type phaptuong --id quy_mi --style-ref <ảnh neo>` sinh; ảnh dẫn duy nhất: Hạo Thiên Chùy lượt 2 đã duyệt từ PR #1083 (`art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`). Không dùng ảnh cũ hay lượt hỏng.

## Đánh giá

Số góc thật: 4 đúng yêu cầu; ne còn lộ mắt. ne nhìn lưng nhưng vẫn lộ một khe mắt; n đúng nhìn lưng. Không sinh thêm chỉ để sửa ne/n. Thân tím lam tối, viền khí sáng, sừng và vuốt dài, ấn ngực và bóng quỷ đúng hình mẫu; khói ngoài chạm mép trái/phải, s/e hơi nghiêng. Chọn tham chiếu ngoại hình, chưa đạt trọn năm góc.

Chọn `concept-attempt1.png`; hồ sơ prompt và source JSON kèm cùng tên. Không phải sheet hoạt ảnh dùng trực tiếp. Các hướng cần sửa được xử lý ở khâu phụ thể bằng hình nộm.

SHA256 ảnh: `fee15ae75afe1304660c480d2ffad5053d47b42da89338c4c32111119c11b7dc`. SHA256 prompt: `d9bbebddebb28f0339cccb83b614b09069b93ca9a443af87bbb7b95556933937`.

## Kiểm RAW

```text
raw concept-attempt1.png pháp tướng (quy_mi): NHẸ
  [NHẸ] mem: texture mềm: 92% cặp điểm kề chỉ chênh nhẹ (pixel cứng gần 0); vohon-pixelize sẽ khử, nhưng chi tiết li ti sẽ mất
  [NHẸ] luoi: chưa đúng lưới khối: tỉ số biên 1.13 ở chu kỳ 34 (< 3; model không giữ lưới, công cụ chuyển pixel sẽ tự lập lưới)
  số đo: {"w":1983,"h":793,"ratio":2.501,"border":{"clear":1,"flat70":0},"poses":5,"poseSpread":1.02,"softness":0.922,"bigColors":88,"grid":{"period":34,"ratio":1.13},"paletteMatch":0.97}
  cần mắt duyệt: đúng võ hồn (hình mẫu, vật đi kèm theo mục 4; không phải cute / chibi); không có chữ, ký hiệu đọc được, logo, chữ ký; 5 hướng cùng một hình (cùng cỡ, màu, chi tiết), se / ne chếch đúng hướng; thân đặc, không trong suốt
```

## Khai báo duyệt mắt (`--eye`)

`vohon-check` chưa hỗ trợ cờ `--eye`; ghi khai báo theo khuôn, không thay kết quả máy:

```text
--eye "concept-attempt1=hướng / hình — ne nhìn lưng nhưng vẫn lộ một khe mắt; n đúng nhìn lưng. Không sinh thêm chỉ để sửa ne/n. Thân tím lam tối, viền khí sáng, sừng và vuốt dài, ấn ngực và bóng quỷ đúng hình mẫu; khói ngoài chạm mép trái/phải, s/e hơi nghiêng. Chọn tham chiếu ngoại hình, chưa đạt trọn năm góc."
```

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/quy_mi/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |

Prompt trong repo chuẩn hóa xuống dòng LF đúng byte Git; SHA trước chuẩn hóa CRLF giữ trong source JSON. Nội dung prompt tự sinh không sửa.
