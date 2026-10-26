# Lôi Văn Hầu (`loi_van_hau`) - tờ B / 2: hướng ne (đông-bắc), n (bắc)

Đặc tả: `docs/art/hon-thu-hoat-anh.md`. File này sinh tự động bằng `node tools/assets/beast-sheet-prompt.mjs --species loi_van_hau`; **không sửa tay**, sửa mẫu ở `tools/assets/beast-sheet-prompt.mjs`.

| Mục | Giá trị |
|---|---|
| Loài | Lôi Văn Hầu (`loi_van_hau`), họ **thú bốn chân** (`quad`), bậc **Tím / Đen**, khung game 96×96 |
| Tờ này | B: ne (đông-bắc), n (bắc); ảnh **1024×1024**; lưới 6 cột × 8 hàng, ô khoảng 171×128 |
| Đính kèm | `shared/assets/sprites/beast/loi_van_hau.png` (ảnh tham chiếu nhân vật: 3 khung nam / đông / bắc) |
| Nền | #FF00FF phẳng, không chữ / nhãn / lưới (ChatGPT cho nền trong suốt thật thì cũng được: công cụ nhận cả hai) |

## Cách làm (tthoadev)
1. Mở cuộc trò chuyện ChatGPT **mới** cho mỗi tờ; đính kèm ảnh tham chiếu ở bảng trên (phóng ×4 nếu ChatGPT làm mờ ảnh nhỏ).
   Tờ B đính thêm **tờ A đã duyệt** làm tham chiếu phong cách, và thêm vào prompt câu: "Match the creature design, colors, size and line weight of the second attached sheet exactly."
2. Dán khối prompt dưới đây, chọn kích thước ảnh **1024×1024** (ChatGPT chỉ có 1024×1024, 1536×1024, 1024×1536).
3. Soát bằng mắt: mỗi ô đúng một con thú, đủ số khung theo hàng, đúng hướng nhìn, cùng cỡ, ô trống để trống, không chữ. Hỏng một hai khung thì bảo model vẽ lại **cả tờ** (vẽ lại từng ô làm lệch phong cách); đừng sửa tay trừ vết nhỏ.
4. Lưu ảnh gốc, giữ nguyên cỡ, vào thư mục artifact của phiên (không vào repo). Ghi model + prompt vào `art/CREDITS.md` khi ảnh được duyệt vào game.
5. Đưa orchestrator đường dẫn tờ; cắt bằng:
   `node tools/assets/beast-sheet-cut.mjs --species loi_van_hau --sheet A=<ảnh-tờ-A.png> --sheet B=<ảnh-tờ-B.png> --out <thư mục>`

## Prompt (tiếng Anh cho model)
```text
Create ONE image, exactly 1024x1024 pixels: an animation sprite sheet of a single fantasy creature for a 2D isometric (2:1 projection, camera looking down at about 30 degrees) game.

CREATURE: Lôi Văn Hầu - thunder ape, grey-brown shaggy fur with pale blue lightning-stripe pattern across the chest, long muscular arms. Body type: thú bốn chân. Size class: Tím / Đen. The attached reference image shows this exact creature in three static views (front, side, back): keep the SAME design, proportions, colors, markings and overall size in every frame of the sheet. Do not redesign it.

BACKGROUND: one flat solid #FF00FF magenta, no gradient, no texture, no ground, no cast shadow, no vignette, no text, no labels, no numbers, no grid lines, no frame or border.

GRID: 6 columns x 8 rows of equal invisible cells (171x128 px each). Exactly one creature per cell, one animation frame per cell, drawn left to right in time order. Every creature is centered horizontally in its cell with its feet (or lowest body point) standing on the same invisible ground line about 12% above the cell bottom, and keeps at least 8% empty magenta margin on all sides. No part of any creature may cross a cell edge or touch another creature. Empty cells stay solid magenta.

LAYOUT (top to bottom):
Block 1 (rows 1-4): direction "ne" = facing the upper right of the picture (three-quarter back view, head away from the viewer toward the right).
  row 1: frames 1-4 = IDLE (slow breathing, weight shifts subtly, head and tail sway); frames 5-6 = HURT (flinch backward, head jerks, eyes shut tight).
  row 2: frames 1-6 = WALK (four-legged trot cycle, diagonal legs in step, body bobbing).
  row 3: frames 1-6 = ATTACK (crouch back, then lunge forward with a bite or claw swipe, then recover).
  row 4: frames 1-4 = DIE (stagger, collapse sideways, finally lying flat on the ground); the last 2 cells of this row stay empty magenta.
Block 2 (rows 5-8): direction "n" = facing away from the viewer (back view from above).
  row 5: frames 1-4 = IDLE (slow breathing, weight shifts subtly, head and tail sway); frames 5-6 = HURT (flinch backward, head jerks, eyes shut tight).
  row 6: frames 1-6 = WALK (four-legged trot cycle, diagonal legs in step, body bobbing).
  row 7: frames 1-6 = ATTACK (crouch back, then lunge forward with a bite or claw swipe, then recover).
  row 8: frames 1-4 = DIE (stagger, collapse sideways, finally lying flat on the ground); the last 2 cells of this row stay empty magenta.

CONSISTENCY: the creature keeps exactly the same size, proportions, palette and line weight in all frames, only the pose changes between frames. In the same direction, standing, walking and hurt frames keep the body at the same scale and the same ground line. Consecutive frames differ by small, smooth pose changes so they loop cleanly (idle and walk loop). Directions e, se and ne must all face to the RIGHT of the picture (the game mirrors them for the left side).

STYLE: hand-painted dark ink-wash fantasy illustration with a clean pixel-art feel, muted slightly desaturated natural colors, soft light from the top left, one thick consistent dark outline (#1a1020, not pure black) around every creature, three shades per color area, crisp edges with no soft glow or halo against the magenta, no anti-aliased pink fringe.

DO NOT DRAW: glowing eyes, aura, magic effects, particles, ground, shadow, weapons, riders, other creatures, text, extra frames, speech bubbles, cute chibi proportions.
```

## Chú thích (tiếng Việt)
- **Bố cục:** mỗi hướng một khối 4 hàng: hàng 1 = đứng (4 khung) + trúng đòn (2), hàng 2 = đi (6), hàng 3 = đánh (6), hàng 4 = chết (4, hai ô cuối trống). Ô lưới chia đều theo kích thước ảnh nên model lệch vài pixel vẫn cắt đúng.
- **Hướng:** chỉ vẽ nam, đông-nam, đông, đông-bắc, bắc; tây là lật ngang đông-nam / đông / đông-bắc nên mọi hướng nghiêng phải nhìn sang phải.
- **Chân thẳng hàng:** mỗi hoạt ảnh đều để chân trên cùng một đường nền ẩn; công cụ căn chân theo đáy hình của từng khung (khung nhảy / bay mất độ cao, chấp nhận).
- **Không vẽ** mắt phát sáng, hào quang, bóng, hiệu ứng: client tự tô (`docs/art/quy-cach-isometric.md`).
- **Nhất quán:** cùng cỡ, bảng màu, nét viền; chỉ đổi tư thế. Công cụ báo khung lệch cỡ / chân / vượt ô; báo nhiều thì vẽ lại tờ.
