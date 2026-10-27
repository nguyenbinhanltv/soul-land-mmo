# bang_phuong_hoang — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. 3/3 lượt. RAW giữ nguyên byte, không hậu kỳ, không nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong` và `--style-ref` ảnh Hạo Thiên lượt 2 đã duyệt từ PR #1083. Chỉ ảnh neo này được gửi; không dùng lượt hỏng làm tham chiếu.

## Đánh giá

**CHẶN, chưa duyệt.** Lượt 1 và 2: ne quay trái và lộ mặt, cánh ngoài cắt mép. Lượt 3: ne quay phải nhưng vẫn lộ mắt/mỏ; se và e quá giống nhau, cánh sát biên. Khoảng 3 góc thật đúng, n nhìn lưng đúng. Đúng lam thẫm, lam băng, lõi tím; còn chi tiết nhỏ và viền màu sáng, thiếu vòng trận hoa tuyết. Chưa đạt 5 hướng.

- Lượt 1: `candidates/concept-attempt1.png`; SHA256 ảnh `6bc3de2091aab98ec6e934f92b74d0f16e0863ba3dd0afe312a6b5ab90a54f5c`; SHA256 prompt `b4be4f0752dd6b8b5f776dad26f89e9a36784d6e7deed1e548ca550aea1da536`.
- Lượt 2: `candidates/concept-attempt2.png`; SHA256 ảnh `e92e2e04e1af3a1b47d5ba5cc72a789248ed9771d033469dc33cd836d235ed62`; SHA256 prompt `b4be4f0752dd6b8b5f776dad26f89e9a36784d6e7deed1e548ca550aea1da536`.
- Lượt 3: `candidates/concept-attempt3.png`; SHA256 ảnh `2060b04e927be7a829816508203ed5663a993930ffe94b77be0ad4a0b6e16d2c`; SHA256 prompt `b4be4f0752dd6b8b5f776dad26f89e9a36784d6e7deed1e548ca550aea1da536`.

Bản tốt nhất: `candidates/concept-attempt3.png`, giữ trong candidates vì còn lỗi chặn. Mỗi lượt có prompt và source JSON kèm theo. Không có NGUON phụ.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/bang_phuong_hoang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |
