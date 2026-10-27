# ta_hoa_phuong_hoang — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. 3/3 lượt. RAW giữ nguyên byte, không hậu kỳ, không nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong` và `--style-ref` ảnh Hạo Thiên lượt 2 đã duyệt từ PR #1083. Chỉ ảnh neo này được gửi; không dùng lượt hỏng làm tham chiếu.

## Đánh giá

**CHẶN, chưa duyệt.** Lượt 1: ne lộ mặt, mép cánh bị cắt. Lượt 2: ne lộ mặt, cánh chạm nhau. Lượt 3: ne quay trái và lộ mắt, s hơi nghiêng, se/e gần nhau; chỉ khoảng 3 góc thật đúng yêu cầu. n nhìn lưng đúng. Màu đỏ thẫm/cam, ngực tối và lõi sáng nhận ra; chi tiết lông còn dày (nhẹ), thiếu vòng lửa. Không đạt bộ 5 góc.

- Lượt 1: `candidates/concept-attempt1.png`; SHA256 ảnh `46fe177f95662f388bf95b16bbae70d1093813dcf00e78c3f3c1d0f6e0f9daa6`; SHA256 prompt `b6f64c59cf895006d4afee9d4035bde8437844e1a76c2f0e00605f10cd27e3ad`.
- Lượt 2: `candidates/concept-attempt2.png`; SHA256 ảnh `86c74333a021f236522f4ad01816a12e57b4af3da884335cdc2dd3f47297e0c7`; SHA256 prompt `b6f64c59cf895006d4afee9d4035bde8437844e1a76c2f0e00605f10cd27e3ad`.
- Lượt 3: `candidates/concept-attempt3.png`; SHA256 ảnh `afbfb627a42f3f956e6749b8a92809610a700592fda556459c294f30c76d1373`; SHA256 prompt `b6f64c59cf895006d4afee9d4035bde8437844e1a76c2f0e00605f10cd27e3ad`.

Bản tốt nhất: `candidates/concept-attempt3.png`, giữ trong candidates vì còn lỗi chặn. Mỗi lượt có prompt và source JSON kèm theo. Không có NGUON phụ.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/ta_hoa_phuong_hoang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
