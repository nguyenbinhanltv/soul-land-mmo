# bach_ho — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. 3/3 lượt. RAW giữ nguyên byte, không hậu kỳ, không nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong` và `--style-ref` ảnh Hạo Thiên lượt 2 đã duyệt từ PR #1083. Chỉ ảnh neo này được gửi; không dùng lượt hỏng làm tham chiếu.

## Đánh giá

**CHẶN, chưa duyệt.** Cả 3 lượt: ne ngoái đầu lộ mặt/mắt vàng, không đạt góc nhìn lưng. Khoảng 4 góc thật đúng, n giấu mặt đúng. Lượt 1: khí trắng nối hình se/e. Lượt 2: quá nhiều vàng, khí nối s/se. Lượt 3: khí nối s/se, vàng trên vằn không đúng bảng nhấn mắt; thiếu vòng trận sao. Thân xám lạnh, ngực sáng, vằn đen và dáng ngồi đúng; chi tiết lông nhỏ là lỗi nhẹ. Chưa đạt.

- Lượt 1: `candidates/concept-attempt1.png`; SHA256 ảnh `910d3a48b513daa6e8dd4768dbf57cf9a6d5170d78490066d0af1a51f89a0475`; SHA256 prompt `3741a416ce38f7106ce2e623810664f8ad215558d07c0575984724091e7a6ea0`.
- Lượt 2: `candidates/concept-attempt2.png`; SHA256 ảnh `e27c80db92af90472e9d67d3d32b96481da272649fe6491bc937a1de1f64e9f3`; SHA256 prompt `3741a416ce38f7106ce2e623810664f8ad215558d07c0575984724091e7a6ea0`.
- Lượt 3: `candidates/concept-attempt3.png`; SHA256 ảnh `5fd6e19c6f4a9e607f34c190d5f81e66c219a509a03b13ecd39923b3921c8c56`; SHA256 prompt `3741a416ce38f7106ce2e623810664f8ad215558d07c0575984724091e7a6ea0`.

Bản tốt nhất: `candidates/concept-attempt3.png`, giữ trong candidates vì còn lỗi chặn. Mỗi lượt có prompt và source JSON kèm theo. Không có NGUON phụ.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/bach_ho/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |

Ki?m t? ??ng RAW ???c ghi nguy?n k?t qu? trong t?ng source JSON. L??t 1 ?t l?i b? c?c h?n; v?n CH?N v? g?c ne. Kh?ng d?ng m?c NH? c?a ki?m m?y thay cho duy?t h??ng b?ng m?t.
