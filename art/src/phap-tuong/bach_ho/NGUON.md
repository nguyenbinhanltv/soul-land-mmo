# Pháp tướng Bạch Hổ (#1457)

Đang thực hiện tại PR #1476; chưa nhập game. Part of #1457.

Nguồn: OpenAI / Codex image_gen tích hợp, 31/10/2026; công cụ không trả model ID/seed. Dùng theo điều khoản đầu ra OpenAI, không gán CC0. RAW giữ nguyên byte, không resize. Điều phối đã chấp nhận RAW vuông native1254×1254.

Tham chiếu hình/màu/motif: `shared/assets/sprites/vohonanim/bach_ho_{b,f}.png` và vũ khí `vukhianim/bach_ho_{b,f}.png`. Hổ ngồi uy nghi, thân xám lạnh, mảng lông sáng trắng, vằn đen dày, mắt vàng; không chép khoảng rỗng hình người.

STYLE/NEGATIVE theo `docs/art/vo-hon-phong-cach.md`, quy cách theo `docs/art/phap-tuong-codex-ve-lai.md`. Một job mỗi lần, tối đa ba lượt mỗi tờ.

## Nhật ký lượt

| Hướng | Lượt | Kết quả |
| --- | ---: | --- |
| s | 1 | 1254×1254, đúng lưới nhưng cutter phát hiện điểm hình sát ranh ô. Không chọn. |
| s | 2 | 1322×1190 không vuông, loại. |
| s | 3 | Chọn RAW1254×1254, hình gọn; đỉnh đầu nguyên vẹn của hàng cuối đi qua đường chia ô. Dùng padding nguyên cụm, không sinh4. |
| se | 1 | Chọn1254×1254, cutter đạt48 màu. |
| e | 1 | Chọn1254×1254, cutter đạt48 màu, nhìn ngang phải. |

ne/n đang thực hiện. Padding chỉ dịch/đệm, không co giãn/vẽ thêm, giữ RAW nguyên byte theo cách điều phối đã duyệt; phải giữ đủ điểm hình, đúng16 cụm tách rời, không bị cắt ở RAW trước khi nhập.


## Ti?p qu?n v? t?i t?o sau merge main

Worker 909 ch? ??c/sao ch?p ngu?n t? worktree 892, kh?ng s?a ngu?n c?. RAW nguy?n byte; k?ch th??c v? SHA256 t?ng ?nh t?i `SHA256.json`. C?c l??t s/se/e/ne/n = 3/1/1/1/1; kh?ng sinh th?m B?ch H?.

L?nh padding: `node art/src/phap-tuong/bach_ho/padding-s.mjs <tmp>`; cutter: `node tools/assets/phaptuong-sheet-cut.mjs <tmp> shared/assets/sprites/phaptuong/bach_ho.png`. Padding gi? ?? 342332/342332 ?i?m h?nh, ??ng 16 c?m, kh?ng co gi?n/v? th?m. Cutter chu?n gh?p 80 khung, 48 m?u, h? s? 0,5846. Glow t?i sinh b?ng `buildGlow` m?u #f2f2f6. ??ng k? th?n v? glow b?ng validate, sinh l?i credits sau merge main theo #1483.

## Xem trong game

Chrome headless th?t v?i `--mute-audio`, noAudio c?a trang th?, n?m h??ng s/se/e/ne/n, th? v? s?u pha ??nh m?i h??ng: 35 ?nh, kh?ng pageerror. `game-preview.png`: n?m c?t theo h??ng, h?ng ??u th?, s?u h?ng sau ??nh. Th?n h? li?n, kh?ng c?t h?nh ng??i, ne/n ??c ???c ? alpha tr??c th?n 0,7. Gi? display scale=1, dx=0, dy=0. H?n ch?: ??ng t?c ??nh nh?, kh?ng gi? r? ??nh ? m?i h??ng; ch?p nh?n theo ph?m vi m?u #1326, kh?ng v??t ba l??t.
