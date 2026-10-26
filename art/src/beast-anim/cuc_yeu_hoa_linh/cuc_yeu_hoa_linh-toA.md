# Cúc Yêu Hoa Linh (`cuc_yeu_hoa_linh`) - tờ A / 2: hướng s (nam), se (đông-nam), e (đông)

Đặc tả: `docs/art/hon-thu-hoat-anh.md`; skill `beast-anim`. File này sinh tự động bằng `node tools/assets/beast-sheet-prompt.mjs --species cuc_yeu_hoa_linh` (`--stage sheet`, đường v1 / dự phòng: khuyên dùng `--stage turnaround` rồi `--stage direction`); **không sửa tay**, sửa mẫu ở `tools/assets/beast-sheet-prompt.mjs` và bài học ở `art/src/beast-anim/lessons.md`.

| Mục | Giá trị |
|---|---|
| Loài | Cúc Yêu Hoa Linh (`cuc_yeu_hoa_linh`), họ **cây / hoa** (`plant`), bậc **Tím / Đen**, khung game 96×96 |
| Tờ này | A: s (nam), se (đông-nam), e (đông); ảnh tỉ lệ **2:3, ra 1024×1536** (chuẩn 1024×1536); lưới 6 cột × 12 hàng, ô khoảng 171×128 |
| Nền | #FF00FF phẳng, không chữ / nhãn / lưới (ChatGPT cho nền trong suốt thật thì cũng được: công cụ nhận cả hai) |

## Cách làm (tthoadev)
1. Mở cuộc trò chuyện **mới** cho mỗi tờ; đính ảnh tham chiếu **theo đúng thứ tự**:
   1. ảnh tĩnh loài (`shared/assets/sprites/beast/cuc_yeu_hoa_linh.png`, 3 khung nam / đông / bắc; phóng ×4 nếu ChatGPT làm mờ)
2. Dán khối prompt dưới đây. **Không** cần chọn cỡ ảnh: công cụ (Codex image_gen) chỉ nhận tỉ lệ (2:3, ra 1024×1536). Cỡ ra khác 1024×1536 (vd tờ 1:1 ra 1254×1254) vẫn **hợp lệ**, cutter tự chuẩn hóa.
3. Soát bằng mắt: mỗi ô đúng một con thú, đủ số khung theo hàng, đúng hướng nhìn, cùng cỡ, ô trống để trống, không chữ. Hỏng một hai khung thì bảo model vẽ lại **cả tờ** (vẽ lại từng ô làm lệch phong cách); đừng sửa tay trừ vết nhỏ.
4. Lưu ảnh gốc, giữ nguyên cỡ ra (không resize), đặt vào `art/src/beast-anim/cuc_yeu_hoa_linh/toA.png` rồi chạy `npm run beast:check -- cuc_yeu_hoa_linh`. NGUON và dòng `LỖI:` do `node tools/assets/beast-nguon.mjs` sinh (không viết tay); ghi vào `art/CREDITS.md` khi ảnh được duyệt vào game.
5. Đưa orchestrator đường dẫn tờ; cắt bằng:
   `node tools/assets/beast-sheet-cut.mjs --species cuc_yeu_hoa_linh --sheet A=<ảnh-tờ-A.png> --sheet B=<ảnh-tờ-B.png> --out <thư mục>`

## Prompt (tiếng Anh cho model)
```text
Create ONE image (portrait 2:3 aspect ratio; the exact pixel size does not matter): an animation sprite sheet of a single fantasy creature for a 2D isometric (2:1 projection, camera looking down at about 30 degrees) game.

CREATURE: Cúc Yêu Hoa Linh - chrysanthemum flower spirit, large yellow-orange chrysanthemum bloom as a head on a slender green stem body, leaf arms, small root feet. Body type: cây / hoa. Size class: Tím / Đen. Keep the SAME design, proportions, colors, markings and overall size as the references in every frame. Do not redesign it.
REFERENCES (attached images, in this fixed order): image 1 = the static reference of this exact creature in three views (front, side, back): the identity, design, colors and overall size.

BACKGROUND: one flat solid #FF00FF magenta, no gradient, no texture, no ground, no cast shadow, no vignette, no text, no labels, no numbers, no grid lines, no frame or border.

GRID: 6 columns x 12 rows of equal invisible cells (171x128 px each). Exactly one creature per cell, one animation frame per cell, drawn left to right in time order. Every creature is centered horizontally in its cell with its feet (or lowest body point) standing on the same invisible ground line about 12% above the cell bottom, and keeps at least 8% empty magenta margin on all sides. No part of any creature may cross a cell edge or touch another creature. Empty cells stay solid magenta.

LAYOUT (top to bottom):
Block 1 (rows 1-4): direction "s" = facing the viewer (front view, three-quarter from above).
  row 1: frames 1-4 = IDLE (stems and leaves sway gently); frames 5-6 = HURT (shakes and leans back along its facing line, roots stay put).
  row 2: frames 1-6 = WALK (creeping forward on roots, body swaying).
  row 3: frames 1-6 = ATTACK (sways back, then lashes forward with vines or petals, then recovers).
  row 4: frames 1-4 = DIE (wilts and sinks limp along its facing line); the last 2 cells of this row stay empty magenta.
Block 2 (rows 5-8): direction "se" = facing the lower right of the picture (three-quarter front view, head toward the viewer's right).
  row 5: frames 1-4 = IDLE (stems and leaves sway gently); frames 5-6 = HURT (shakes and leans back along its facing line, roots stay put).
  row 6: frames 1-6 = WALK (creeping forward on roots, body swaying).
  row 7: frames 1-6 = ATTACK (sways back, then lashes forward with vines or petals, then recovers).
  row 8: frames 1-4 = DIE (wilts and sinks limp along its facing line); the last 2 cells of this row stay empty magenta.
Block 3 (rows 9-12): direction "e" = facing right (side profile, seen from slightly above).
  row 9: frames 1-4 = IDLE (stems and leaves sway gently); frames 5-6 = HURT (shakes and leans back along its facing line, roots stay put).
  row 10: frames 1-6 = WALK (creeping forward on roots, body swaying).
  row 11: frames 1-6 = ATTACK (sways back, then lashes forward with vines or petals, then recovers).
  row 12: frames 1-4 = DIE (wilts and sinks limp along its facing line); the last 2 cells of this row stay empty magenta.

CONSISTENCY: the creature keeps exactly the same size, proportions, palette and line weight in all frames, only the pose changes between frames. In the same direction, standing, walking and hurt frames keep the body at the same scale and the same ground line. Consecutive frames differ by small, smooth pose changes so they loop cleanly (idle and walk loop). Directions e, se and ne must all face to the RIGHT of the picture (the game mirrors them for the left side).

DIRECTION RULES (every frame of a block, including HURT and DIE, keeps the block's direction): the body axis never rotates and the creature never turns to face the viewer. HURT keeps its own 2 animated frames but is only a short recoil backward along the facing line: the creature stays upright on its feet, never flips onto its back or belly, never shows its belly, never turns its head toward the viewer. DIE sinks or topples along the facing line and ends lying with the spine parallel to that line; it never rotates the body 90 degrees to lie sideways across the view. In the "ne" and "n" blocks the creature is seen from behind: no eyes, nose, mouth or face is visible in any frame of those blocks, hurt and die included.

STYLE: hand-painted dark ink-wash fantasy illustration with a clean pixel-art feel, muted slightly desaturated natural colors, soft light from the top left, one thick consistent dark outline (#1a1020, not pure black) around every creature, three shades per color area, crisp edges with no soft glow or halo against the magenta, no anti-aliased pink fringe.

DO NOT DRAW: glowing eyes, aura, magic effects, particles, ground, shadow, weapons, riders, other creatures, text, extra frames, speech bubbles, cute chibi proportions.

LESSONS (learned from earlier sheets of other creatures, follow every line):
- Direction "se" is a three-quarter view: the body axis is turned about 45 degrees toward the lower right, the face is visible and looks diagonally down toward the viewer, so it clearly differs from "e" (pure side profile).
- Direction "ne" is a three-quarter BACK view: the body axis is turned about 45 degrees away toward the upper right, the rump and back are nearest to the viewer, and it must not be drawn as a plain side profile.
- Direction "n" is a pure back view: only the back of the head, back, rump and tail are visible.
- Every direction e, se and ne faces the RIGHT side of the picture; never mirror them to face left.
- HURT is a small recoil along the facing line: the creature stays upright on its feet and does not roll over, bounce into a new facing or turn its head toward the viewer.
- DIE is a slow collapse along the facing line: the legs fold, the body lowers, and the final pose keeps the same body axis as the idle pose of that block.
- Keep the body the same height and length in every row of the sheet, matching the reference; never let walking, attacking or hurt frames grow or shrink the creature.
- Draw every frame as its own separate picture: leave clear magenta space between neighbours, never overlap or merge two creatures.
- Idle frames must show a small visible change from frame to frame (breathing, sway), and HURT must look clearly different from IDLE.
- A frame that is empty in the layout stays empty magenta: do not fill spare cells with extra poses.
```

## Chú thích (tiếng Việt)
- **Bố cục:** mỗi hướng một khối 4 hàng: hàng 1 = đứng (4 khung) + trúng đòn (2), hàng 2 = đi (6), hàng 3 = đánh (6), hàng 4 = chết (4, hai ô cuối trống). Ô lưới chia đều theo kích thước ảnh nên model lệch vài pixel vẫn cắt đúng.
- **Hướng:** chỉ vẽ nam, đông-nam, đông, đông-bắc, bắc; tây là lật ngang đông-nam / đông / đông-bắc nên mọi hướng nghiêng phải nhìn sang phải.
- **Chân thẳng hàng:** mỗi hoạt ảnh đều để chân trên cùng một đường nền ẩn; công cụ căn chân theo đáy hình của từng khung (khung nhảy / bay mất độ cao, chấp nhận).
- **Nhất quán:** cùng cỡ, bảng màu, nét viền; chỉ đổi tư thế. Công cụ báo khung lệch cỡ / chân / vượt ô; báo nhiều thì vẽ lại tờ.
- **Không vẽ** mắt phát sáng, hào quang, bóng, hiệu ứng: client tự tô (`docs/art/quy-cach-isometric.md`).
- **Bài học** chèn trong prompt lấy từ `art/src/beast-anim/lessons.md` (một nguồn duy nhất); lượt vẽ hỏng cho bài học mới thì thêm vào file đó, không viết tay vào prompt.
- **Không** dùng tờ / ảnh bị lỗi làm tham chiếu (lỗi lan sang tờ sau): tham chiếu chỉ là ảnh tĩnh, turnaround đã duyệt và tờ đã qua `beast:check` không có khối chặn.
- Giới hạn: **tối đa 3 lượt** cho mỗi tờ; quá 3 lượt thì dừng và báo orchestrator (skill `beast-anim`, mục "Quá 3 lượt").
