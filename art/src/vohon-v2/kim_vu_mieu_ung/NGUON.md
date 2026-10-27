# kim_vu_mieu_ung — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. 3/3 lượt. RAW giữ nguyên byte, không hậu kỳ, không nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong` và `--style-ref` ảnh Hạo Thiên lượt 2 đã duyệt từ PR #1083. Chỉ ảnh neo này được gửi; không dùng lượt hỏng làm tham chiếu.

## Đánh giá

**Chọn làm tham chiếu ngoại hình theo quyết định mới ở PR #1145; chưa phải phụ thể đạt năm hướng.** Lượt 1: ne quay trái và lộ mắt, s/n cánh rủ. Lượt 2: ne/n giấu mặt đúng, cánh s/n cắt biên, se/e quá giống. Lượt 3: ne/n không lộ mặt, đủ 5 tư thế gần đúng nhưng se/e khác ít, khoảng trống giữa cánh quá hẹp/có chỗ gần chạm; không đạt tách năm cột. Khoảng 4 góc thật phân biệt rõ. Màu nâu vàng, đen cánh, mắt dọc đúng; chi tiết lông dày (nhẹ), thiếu mây/vòng sét. Chưa đạt.

- Lượt 1: `concept-attempt1.png`; SHA256 ảnh `f5acaf93bb42da33603d5d94d9a56fefba8667ba8a9e99d048ca2e70a9f029b9`; SHA256 prompt `7c49d626a6fdda8d005dae0e80f757645ac5fd0e3ebc4d4e2c2383ec4efcd1a3`.
- Lượt 2: `candidates/concept-attempt2.png`; SHA256 ảnh `07dbb9a6c6508cb58686868625020e69b73d4e46130acfa4d9725b5c4513f30f`; SHA256 prompt `7c49d626a6fdda8d005dae0e80f757645ac5fd0e3ebc4d4e2c2383ec4efcd1a3`.
- Lượt 3: `candidates/concept-attempt3.png`; SHA256 ảnh `22e0131bf8744970c6f40fd86cca9e5cbf31cd715327fa798c54a6b498570099`; SHA256 prompt `7c49d626a6fdda8d005dae0e80f757645ac5fd0e3ebc4d4e2c2383ec4efcd1a3`.

Bản tốt nhất để tham chiếu ngoại hình: `concept-attempt1.png` (lượt 1), đã chọn ở thư mục chính với trạng thái `selected_appearance_reference`. Chọn lượt 1 thay lượt 3 vì lượt 3 có khoảng trống giữa cánh quá hẹp, có chỗ gần chạm và không tách rõ năm cột; ưu tiên hình thể tham chiếu hơn độ đúng hướng ne/n của lượt 3. Lượt 1 vẫn còn lỗi ne lộ mắt, cánh rủ và các lỗi ghi ở mục khai báo duyệt mắt, chưa đạt phụ thể năm hướng. Lượt 2 và 3 ở `candidates` để đối chiếu. Mỗi lượt có prompt và source JSON kèm theo. Không có NGUON phụ.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/kim_vu_mieu_ung/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |


## Khai báo duyệt mắt (`--eye`)

Công cụ vohon-check hiện không có cờ `--eye`; các khai báo dưới đây dùng cùng khuôn lỗi mắt, không chạy bộ kiểm hồn thú cho võ hồn.

```text
--eye "concept-attempt1=hướng — ne — quay trái và lộ mắt; se/e khác ít"
--eye "concept-attempt1=bố cục — cánh — cánh ngoài sát biên, s/n cánh rủ, lông dày"
```

```text
LỖI: concept-attempt1 — hướng — ne — quay trái và lộ mắt; se/e khác ít (mắt)
LỖI: concept-attempt1 — bố cục — cánh — cánh ngoài sát biên, s/n cánh rủ, lông dày (mắt)
```

Theo quyết định ở PR #1145: concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý ở khâu phụ thể bằng hình nộm. Giữ nguyên kết quả kiểm RAW và mọi lỗi đã quan sát, không coi ảnh này là sheet năm hướng dùng trực tiếp. SHA256 ảnh và prompt không đổi khi chuyển vị trí.
