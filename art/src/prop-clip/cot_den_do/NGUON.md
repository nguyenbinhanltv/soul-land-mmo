# Đèn lồng đỏ đung đưa nhẹ

#1537, dùng hợp đồng clip của #1501 / #1508 / #1513 / #1532. Codex builtin OpenAI `image_gen.imagegen`, ngày 01/11/2026. Đầu vào duy nhất: `shared/assets/sprites/iso/props/cot_den_do.png` (Gemini cũ đã duyệt, giữ nguyên ghi công). Chỉ đèn/tua sinh mới; đầu ra theo điều khoản OpenAI, không gán CC0. Công cụ không trả model ID/seed.

RAW nguyên byte ở `RAW.png`, native **1448×1086**;

| File | SHA256 |
|---|---|
| RAW.png | `733f8c1ed119337231026c40c202867b0e3c4b3eca379c049d83327dbff3a885` |
| cot_den_do.png | `180ccac16e645820d08956953cfced624c4a00de74ba1243fabfd48120411686` |
| cot_den_do_clip.png | `65d1905211e39ec22a45fa7c69bae8eb56da1933dada98fdd3922e74175ef97d` |

Kích thước native và SHA256 RAW/gốc/clip cũng ở `nguon.json`, kiểm tự động. Không sửa hoặc ghi đè RAW khi nhập.

Prompt thực tế:

> Use case: precise-object-edit. Asset type: tiny pixel-art lantern animation layer sheet for an existing isometric game. Input: reference game lantern pole, used only for lantern style and color. Draw ONLY ONE SINGLE red hanging lantern per cell, exactly 8 animation frames in a 4-column 2-row equal grid. Transparent background. No pole, branches, base, strings between multiple lanterns or extra objects. Each lantern has a muted gold small top cap, squat rounded RED body with a dark purple outline, tiny lower gold cap and short red tassel, matching the red lanterns on the reference. Very coarse crisp pixel art suitable for reduction to a 9 by 12 pixel sprite. Identical size and fixed TOP CENTER suspension in all cells. Very subtle swaying of lower body, max one pixel at target size, tassel bends from center to right, center, left, center over a seamless cycle. Upper cap and first two pixel rows stay completely fixed. Preserve muted reference red/gold/dark purple colors. NO glow, gradients outside the sprite, ground, text or grid lines. Ample equal margins around each cell. Frames 1 and 8 must join smoothly.

Nhập: `node tools/assets/prop-clip.mjs cot_den_do art/src/prop-clip/cot_den_do/RAW.png 2026-11-01`; normal: `node tools/assets/normal.mjs shared/assets/sprites/iso/props/cot_den_do_clip.png --frame 48x96`. Tờ một đèn × 8 pha ghép vào bảy vị trí của ảnh gốc; các hộp ghi trong `nguon.json`. Khóa hai hàng đầu mỗi hộp cùng pixel kết cấu vàng/nâu, toàn bộ ngoài hộp giữ nguyên. Lớp thân `than-tinh.png`, lớp đèn `chuyen-dong.png`. Màu về đúng palette gốc; alpha nhị phân. 8 pha thêm khung pha màu vòng (cả pha cuối về đầu), 16 khung × 100 ms. Chân `[24,94]`; cột, tay treo, depth, collision, ánh sáng và bản đồ giữ nguyên. Dùng chung Image/atlas và cleanup chunk; dừng khung đầu ở Thấp/Giảm chuyển động.
