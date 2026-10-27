# Băng Nguyên Cự Tượng (`bang_nguyen_cu_tuong`) - ảnh turnaround (5 hướng × idle / hurt / die)

Quy trình: skill `beast-anim` (`.claude/skills/beast-anim/SKILL.md`), đặc tả `docs/art/hon-thu-hoat-anh.md`. File này sinh tự động bằng `node tools/assets/beast-sheet-prompt.mjs --species bang_nguyen_cu_tuong --stage turnaround`; **không sửa tay**, sửa mẫu ở `tools/assets/beast-sheet-prompt.mjs` và bài học ở `art/src/beast-anim/lessons.md`.

| Mục | Giá trị |
|---|---|
| Loài | Băng Nguyên Cự Tượng (`bang_nguyen_cu_tuong`), họ **thú bốn chân** (`quad`), bậc **Đỏ**, khung game 128×128 |
| Ảnh này | 1 ảnh tỉ lệ **3:2, ra 1536×1024**; lưới 5 cột (hướng s, se, e, ne, n) × 3 hàng (idle, hurt, die) = 15 hình |
| Nền | #FF00FF phẳng, không chữ / nhãn / lưới |

## Cách làm
1. Mở cuộc trò chuyện **mới**; đính ảnh tham chiếu **theo đúng thứ tự**:
   1. ảnh tĩnh loài (`shared/assets/sprites/beast/bang_nguyen_cu_tuong.png`, 3 khung nam / đông / bắc; phóng ×4 nếu ChatGPT làm mờ)
2. Dán khối prompt dưới đây. Không chọn cỡ ảnh (công cụ chỉ nhận tỉ lệ).
3. Soát bằng mắt: mỗi ô một con thú; cột `se` thấy mặt chếch xuống, thân chéo 45° (khác `e`); cột `ne` thấy lưng chéo (khác `e`); cột `n` không thấy mặt; hàng hurt lùi dọc theo hướng, không ngửa bụng, không quay mặt; hàng die nằm dọc theo hướng; cùng cỡ thân ở mọi ô.
4. Hỏng thì vẽ lại **cả ảnh** (chỉ 15 hình, rẻ). Tối đa 3 lượt; **không** dùng ảnh hỏng làm tham chiếu cho lượt sau.
5. Ảnh turnaround đã duyệt là tham chiếu hướng cho 5 tờ `--stage direction`. Lưu ảnh gốc nguyên byte (không resize), đặt `art/src/beast-anim/bang_nguyen_cu_tuong/turnaround.png` khi nộp; ghi model, seed, prompt thật bằng `node tools/assets/beast-nguon.mjs`.

## Prompt (tiếng Anh cho model)
```text
Create ONE image (landscape 3:2 aspect ratio; the exact pixel size does not matter): a turnaround reference sheet of a single fantasy creature for a 2D isometric (2:1 projection, camera looking down at about 30 degrees) game. It is a model sheet: it fixes how the creature looks from each of five directions and how it reacts to a hit and to dying.

CREATURE: Băng Nguyên Cự Tượng - ice plain giant mammoth-elephant, huge grey-blue shaggy body with thick curved ivory tusks and frost on its back, long trunk, standing on four pillar legs. Body type: thú bốn chân. Size class: Đỏ. Keep the SAME design, proportions, colors, markings and overall size as the references in every frame. Do not redesign it.
REFERENCES (attached images, in this fixed order): image 1 = the static reference of this exact creature in three views (front, side, back): the identity, design, colors and overall size.

BACKGROUND: one flat solid #FF00FF magenta, no gradient, no texture, no ground, no cast shadow, no vignette, no text, no labels, no numbers, no grid lines, no frame or border.

GRID: 5 columns x 3 rows of equal invisible cells (307x341 px each). Exactly one creature per cell, centered horizontally, standing on the same invisible ground line about 12% above the cell bottom (lying creatures rest on it), with at least 8% empty magenta margin on all sides. No part of any creature may cross a cell edge or touch another creature.

COLUMNS (left to right, one direction per column):
  column 1: direction "s" = facing the viewer (front view, three-quarter from above).
  column 2: direction "se" = facing the lower right of the picture (three-quarter front view, head toward the viewer's right).
  column 3: direction "e" = facing right (side profile, seen from slightly above).
  column 4: direction "ne" = facing the upper right of the picture (three-quarter back view, head away from the viewer toward the right).
  column 5: direction "n" = facing away from the viewer (back view from above).

ROWS (top to bottom, the same pose type in every column):
  row 1 = IDLE: neutral standing pose (slow breathing, weight shifts subtly, head and tail sway), one calm frame.
  row 2 = HURT: the moment of the strongest reaction to a hit (recoils a short step backward along its facing line, head dips, all four legs stay planted and the spine stays on the same axis).
  row 3 = DIE: the FINAL resting pose after dying (staggers, then sinks down in place along its facing line, finally lying with the spine parallel to that line).
In every cell the body keeps the direction of its column: the axis never rotates and the creature never turns to face the viewer. In columns "ne" and "n" no eyes, nose, mouth or face are visible in any row, hurt and die included. Directions e, se and ne face the RIGHT side of the picture.

CONSISTENCY: the same size, proportions, palette and line weight in all 15 cells; only the direction and the pose change.

STYLE: hand-painted dark ink-wash fantasy illustration with a clean pixel-art feel, muted slightly desaturated natural colors, soft light from the top left, one thick consistent dark outline (#1a1020, not pure black) around every creature, three shades per color area, crisp edges with no soft glow or halo against the magenta, no anti-aliased pink fringe.

DO NOT DRAW: glowing eyes, aura, magic effects, particles, ground, shadow, weapons, riders, other creatures, text, extra frames, speech bubbles, cute chibi proportions.

LESSONS (learned from earlier sheets of other creatures, follow every line):
- Direction "se" is a three-quarter view: the body axis is turned about 45 degrees toward the lower right, the face is visible and looks diagonally down toward the viewer, so it clearly differs from "e" (pure side profile).
- Direction "ne" is a three-quarter BACK view: the body axis is turned about 45 degrees away toward the upper right, the rump and back are nearest to the viewer, and it must not be drawn as a plain side profile.
- Direction "n" is a pure back view: only the back of the head, back, rump and tail are visible.
- Every direction e, se and ne faces the RIGHT side of the picture; never mirror them to face left.
- HURT is a small recoil along the facing line: the creature stays upright on its feet and does not roll over, bounce into a new facing or turn its head toward the viewer.
- DIE is a slow collapse along the facing line: the legs fold, the body lowers, and the final pose keeps the same body axis as the idle pose of that block.
- Squat or low-bodied creatures (toads, turtles, boars) also keep the belly hidden while recoiling: they hunker lower instead of rearing up.
- Draw all poses at the same body size and on the same ground line; one creature per cell with clear magenta space around it.
```

## Chú thích (tiếng Việt)
- **Bố cục:** cột = hướng nhìn (s, se, e, ne, n), hàng = tư thế (đứng, đỉnh cú trúng đòn, tư thế chết cuối). Đây là ảnh mẫu, không cắt vào game.
- **Không vẽ** mắt phát sáng, hào quang, bóng, hiệu ứng: client tự tô (`docs/art/quy-cach-isometric.md`).
- **Bài học** chèn trong prompt lấy từ `art/src/beast-anim/lessons.md` (một nguồn duy nhất); lượt vẽ hỏng cho bài học mới thì thêm vào file đó, không viết tay vào prompt.
- **Không** dùng tờ / ảnh bị lỗi làm tham chiếu (lỗi lan sang tờ sau): tham chiếu chỉ là ảnh tĩnh, turnaround đã duyệt và tờ đã qua `beast:check` không có khối chặn.
- Giới hạn: **tối đa 3 lượt** cho mỗi ảnh turnaround; quá 3 lượt thì dừng và báo orchestrator (skill `beast-anim`, mục "Quá 3 lượt").
