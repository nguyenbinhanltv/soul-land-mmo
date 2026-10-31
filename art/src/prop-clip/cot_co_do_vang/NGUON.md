# Vải cột cờ đỏ vàng

#1523, tái dùng kỹ thuật #1501 / #1508 / #1513 theo yêu cầu chủ repo. Chỉ lớp vải sinh mới bằng Codex builtin OpenAI `image_gen.imagegen`, ngày 01/11/2026. Đầu vào duy nhất: `shared/assets/sprites/iso/props/cot_co_do_vang.png` (Gemini cũ đã duyệt, giữ nguyên ghi công). Đầu ra theo điều khoản OpenAI, không gán CC0; công cụ không trả model ID/seed.

RAW nguyên byte ở `RAW.png`, kích thước native **1536×1024**. SHA256 RAW/gốc/clip ở `nguon.json`, được kiểm tự động. Không sửa hoặc ghi đè RAW khi nhập.

| File | SHA256 |
|---|---|
| RAW.png | `483e61b8111e7d067f52541009de821905301f7518e0e3b6630ab9c78edc448f` |
| cot_co_do_vang.png | `a80471f275af04afb03f6e0e8243ce0d033a5898df9e331ec742749582006b52` |
| cot_co_do_vang_clip.png | `243a0cc31c43e3abaf0bbe98abb6e25f9399b8c2ba56b1349774b3a6a9ecd9e6` |

Prompt thực tế:

> Use case: precise-object-edit. Create ONLY the hanging red cloth with gold yellow edging from the provided game flag reference, NOT its pole, roof cap, stone foot, ropes, ground or shadow. Asset type: pixel art animation layer sheet. Exactly 8 consecutive animation frames in 4 equal columns and 2 equal rows, transparent background, no grid lines or labels. The cloth is a long narrow vertical red pennant hanging DOWN, attached along its RIGHT upper edge to the pole outside the image; keep that attachment point identical in all cells. Preserve the reference's red and muted gold yellow palette, dark purple outline, crisp coarse pixel clusters, isometric angle, slim tapered hanging silhouette. Gentle small breeze sends one subtle ripple downward, free LEFT edge and lower pointed tip gently sway by a few pixels, upper attachment stays fixed. Smooth seamless cyclic motion through frames 1 to 8 back to 1. Same scale and fixed upper-right attachment in all cells, ample equal margins, identical cloth length. No pole, no base, no other objects, no halo, no text.

Nhập: `node tools/assets/prop-clip.mjs cot_co_do_vang art/src/prop-clip/cot_co_do_vang/RAW.png 2026-11-01`; normal: `node tools/assets/normal.mjs shared/assets/sprites/iso/props/cot_co_do_vang_clip.png --frame 48x80`. Vùng `[10,19,18,35]`, giữ nguyên dải nối `x>=26` hoặc `y<=21`; mọi pixel ngoài vùng giữ nguyên. Lớp thân `than-tinh.png`, lớp vải `chuyen-dong.png`; màu lượng tử về đúng palette ảnh gốc. 8 pha thêm khung pha màu vòng (kể cả pha cuối về đầu), thành 16 khung × 100 ms. Chân `[24,78]`, cột, mũ và đế không đổi; runtime, collision, depth, ánh sáng và bản đồ giữ nguyên. Chung Image/atlas và cleanup chunk của pilot; dừng khung đầu ở Thấp/Giảm chuyển động.
