# Tà Hỏa Phượng Hoàng (`ta_hoa_phuong_hoang`) - phụ thể, tờ C / 5: hướng e (đông)

Quy trình: skill `beast-anim` (đường đi giống hồn thú), đặc tả `docs/art/phu-the-hoat-anh.md`. File này sinh tự động bằng `node tools/assets/phuthe-sheet-prompt.mjs --id ta_hoa_phuong_hoang --stage direction`; **không sửa tay**, sửa mẫu ở `tools/assets/phuthe-sheet-prompt.mjs` và bài học ở `art/src/phuthe-anim/lessons.md`. Ngoại hình lấy từ `docs/art/vo-hon-phong-cach.md` mục 4 (nguồn duy nhất).

| Mục | Giá trị |
|---|---|
| Võ hồn | Tà Hỏa Phượng Hoàng (`ta_hoa_phuong_hoang`), nhóm **B** (chi thể sinh vật), khung phụ thể **96×96** (gốc chân (48, 74)) |
| Nộm | màu khóa **#00D0D0** (đổi bằng `--dummy-key` nếu đổi; ghi màu thật dùng vào `NGUON.md`) |
| Nền | #FF00FF phẳng, không chữ / nhãn / lưới |
| Tờ này | C: hướng **e** (đông); ảnh tỉ lệ **3:2** (chuẩn 1536×1024); lưới 6 cột × 4 hàng, ô khoảng 256×256; **22 khung** (idle 4, walk 6, attack 6, cast 4, hurt 2) |

## Cách làm
1. Mở cuộc trò chuyện **mới** cho mỗi tờ; đính ảnh tham chiếu **theo đúng thứ tự**:
   1. **bảng nộm** của tờ này (`ta_hoa_phuong_hoang-nom-toC.png`, do `phuthe-sheet-dummy.mjs` dựng; nộm đã đặt đúng chỗ, đừng bảo model tự vẽ thân)
   2. ảnh **turnaround đã duyệt** của võ hồn (5 hướng × idle / attack đỉnh / hurt)
   3. (tùy chọn) **một tờ hướng đã qua `npm run phuthe:check` không có khối chặn** của chính võ hồn này, chỉ để khớp nét / bảng màu. **Không** dùng tờ lỗi làm tham chiếu
2. Dán khối prompt dưới đây. Không chọn cỡ ảnh (công cụ chỉ nhận tỉ lệ 3:2; cỡ khác 1536×1024 vẫn hợp lệ nếu lưới đúng, cutter chuẩn hóa).
3. Lưu ảnh gốc **nguyên byte** (không resize) vào `art/src/phuthe-anim/ta_hoa_phuong_hoang/toC.png` (kèm `toC.prompt.txt`) rồi chạy `npm run phuthe:check -- ta_hoa_phuong_hoang`. Đối chiếu **tờ liên hệ có nhãn**: nộm còn nguyên, điểm gắn không trôi, `se` / `ne` khác `e`, hurt lùi đúng hướng, không vẽ lại thân / mặt người.
4. Chỉ tờ này hỏng thì vẽ lại **chỉ tờ này**, tối đa 3 lượt; chọn lượt có điểm kiểm thấp nhất + mắt. **Không** dùng tờ hỏng làm tham chiếu.
5. Cắt: `node tools/assets/phuthe-sheet-cut.mjs --id ta_hoa_phuong_hoang --sheet A=<ảnh-tờ-A.png> --sheet B=<ảnh-tờ-B.png> --sheet C=<ảnh-tờ-C.png> --sheet D=<ảnh-tờ-D.png> --sheet E=<ảnh-tờ-E.png> --out <thư mục>`.

## Prompt (tiếng Anh cho model)
```text
STYLE (apply to every image):
Dark-xianxia pixel art, isometric RPG, overbearing and dominant "heaven-defying" presence.
The spirit (martial soul) is a colossal, menacing power towering behind or beside a small figure.
Angular, jagged, ASYMMETRIC silhouette; large readable shape that stays recognizable when shrunk to 32x32.
Muted dark-ink (shuimo) palette: deep shadow regions, desaturated dark base colors, and only a FEW small
high-contrast glowing accents (eyes, core, blade edge, talisman lines). 3 tones per color region
(shadow, base, highlight), one extra bright tone only for metal and glow. Dark outline #1a1020, 1 px,
no anti-aliasing, hard pixel edges. Light comes from the upper left.
Cultivation (xianxia) flavor: use ONLY the motifs listed in the SPIRIT section below (typically 2-3);
do not add any other motif (no extra halos, storm clouds, formation circles or lightning unless listed).
Materials shown by texture, never by glossy shine: broken scales, chipped metal, jade with cloudy core.
Calm, cold, lethal expression. Heavy, ancient, sacred-and-dangerous mood.
Transparent background. No UI frame. Do not draw the glow as a soft blur: paint only hard-edged pixels
(glow, particles and motion are added in code).

NEGATIVE (forbidden):
cute, kawaii, chibi, adorable, baby, big round shiny eyes, rosy cheeks, smiling, friendly, mascot, cartoon,
Saturday-morning cartoon, toy, plastic, rubber, figurine, glossy, soft rounded bubble shapes,
pastel, candy colors, rainbow gradient, neon-bright flat color over the whole body,
flat plain featureless weapon, anime sparkle stars, hearts, bubbles, emoji, sticker, game-mobile gacha look,
readable text, letters, logo, watermark, signature, UI frame, card border, human character in the spirit image,
3D render, photorealistic, blurry, smooth gradients, soft shadows, noise, dithering haze,
anti-aliasing, painterly brush texture, drawing a copy of existing sprite.

TASK: Create ONE image (landscape 3:2 aspect ratio; the exact pixel size does not matter): an animation sprite sheet of a martial-soul spirit attached to a hero, ONE direction only, for a 2D isometric (2:1 projection, camera looking down at about 30 degrees) game. Draw only the spirit; the hero is the flat mannequin already placed in the first reference image.

SPIRIT: Tà Hỏa Phượng Hoàng (ta_hoa_phuong_hoang); body type "B" = chi thể sinh vật. The design brief below comes from the canonical design table and is written in Vietnamese: follow it exactly, keep every hex code as written, and use only the motifs it lists.
- Overbearing presence: **Tà** hỏa: không phải chim lửa đẹp mà là hung điểu có mắt lạnh, **cánh xòe che nửa trời** như muốn thiêu cả thiên hạ.
- Form: cánh xòe rộng bất đối xứng (một cánh cao hơn), lông cánh là các lưỡi lửa nhọn, đuôi dài rách, mỏ như móc câu.
- Palette: thân đỏ thẫm theo `robe` (lõi tối gần đen ở ngực), lửa cam theo `col`; nhấn vàng trắng ở lõi + tím than rất ít ở rìa khói (chất "tà").
- Motifs (use only these): vệt lửa chảy thành đạo văn dọc cánh, vòng liệt hỏa thành trận dưới chân.
- Companion objects: lông lửa rời bay ra; tàn tro bay lên (code).
- Base colors in the game data: body (robe) #8f2a14, accent (col) #ff6a2a.
Attachment and layering notes (Vietnamese; "sau" = drawn behind the hero's body, "truoc" = drawn in front of it): cánh + đuôi: `sau` ở `s`/`se`/`e`, `truoc` ở `ne`/`n`
Motion notes (Vietnamese): `walk` vỗ theo nhịp bước (6 khung = một chu kỳ vỗ); `cast` dang cánh cao tối đa; `hurt` cánh co lại
REFERENCES (attached images, in this fixed order): image 1 = the MANNEQUIN BOARD of this sheet: magenta background with the flat #00D0D0 mannequin already placed in every occupied cell; copy this layout exactly and draw the spirit on top of / around it; image 2 = the approved TURNAROUND image of this spirit: five columns of directions (s, se, e, ne, n) by three rows (idle, attack peak, hurt). Copy the form, facing angle, size and colors of the column "e"; image 3 = an approved direction sheet of this spirit (only for matching line weight and palette; never copy its poses) (if attached). No other reference is allowed: do not copy any older drawing of this spirit.

MANNEQUIN: the first attached image already contains the hero's body as a FLAT, single-colored mannequin silhouette (solid #00D0D0, no shading, no outline) placed in every occupied cell, drawn side on. It is the ONLY human shape allowed in the picture (it overrides "human character" in NEGATIVE) and it is a fixed reference, not something to draw. Keep every mannequin exactly where it is, at the same size and in the same flat color; do not repaint, shade, outline, move, resize or add a face, eyes, hands or clothes to it. Never use #00D0D0 or magenta #FF00FF anywhere in the spirit itself; if the spirit has a similar hue, keep it clearly darker, lighter or less saturated.

BACKGROUND: one flat solid #FF00FF magenta, no gradient, no texture, no ground, no cast shadow, no vignette, no text, no labels, no numbers, no grid lines, no frame or border. This overrides the line "Transparent background" of the STYLE block: the sheet background is solid magenta, never transparent.

GRID: 6 columns x 4 rows of equal invisible cells (256x256 px each), exactly the layout of the mannequin board. Exactly one figure (mannequin + spirit) per occupied cell, one animation frame per cell, left to right in time order (22 occupied cells). Each mannequin stays exactly where the board puts it, and the spirit is drawn around and over it. No part of any figure may cross a cell edge or touch another cell; keep clear magenta space between cells. Empty cells stay solid magenta.

LAYOUT (top to bottom; every frame shows the spirit in direction "e" = facing right (side profile, seen from slightly above); the mannequin is drawn side on in the pose of the hero's body at that frame):
  row 1: frames 1-4 = IDLE (slow breathing, a gentle sway of the limbs / leaves / flames; frame 1 is the neutral base pose); frames 5-6 = HURT (a short recoil backward along the facing line, then recovery; the spirit shrinks or folds a little).
  row 2: frames 1-6 = WALK (one full cycle that follows the stride of the mannequin (wing beat, tail sway, bounce); the first and last frames join smoothly).
  row 3: frames 1-6 = ATTACK (wind up, swing, strike, recover; the limb or weapon makes its swing at the same moment the mannequin swings).
  row 4: frames 1-4 = CAST (spreads, rises or swells larger than the attack; the last frame is a hold pose); the last 2 cells of this row stay empty magenta, with no mannequin.

CONSISTENCY: the spirit keeps exactly the same size, proportions, palette and line weight in all frames, only the pose changes. Consecutive frames differ by small, smooth pose changes so idle and walk loop cleanly. Every attachment point (wing root, hand grip, shoulder, head, feet) stays glued to the same place of the mannequin in every frame. Directions e, se and ne must all face to the RIGHT of the picture (the game mirrors them for the left side).

DRAWING RULES: draw ONLY the spirit. Never redraw the hero's body, face, hands or feet; the mannequin does that job. In the "ne" and "n" blocks show no face anywhere. Paint the spirit with hard-edged pixels and the dark outline of the STYLE block; no glow, halo, particles, soft shadow, ground or magic circle in the picture (the game adds them).

LESSONS (learned from earlier sheets, follow every line):
- Draw ONLY the spirit. The flat single-colored mannequin in the attached reference is the hero's body: leave it exactly where it is, with the same size and the same flat color; never repaint it, shade it, outline it, or add a face, eyes, hands or clothes to it.
- Where the spirit passes in front of the mannequin, paint over it; where the mannequin hides part of the spirit, that part is simply not visible. Do not move the spirit away from the mannequin to avoid overlap.
- Every attachment point (wing root on the back, hand grip, shoulder, head, feet) stays glued to the same place of the mannequin in every frame of the sheet; only the spirit changes shape.
- Direction "se" is a three-quarter view tilted toward the lower right and direction "ne" is a three-quarter back view tilted toward the upper right; both must look clearly different from the pure side view "e", even though the mannequin itself is drawn side-on.
- Directions e, se and ne face the RIGHT side of the picture; never mirror them to face left.
- In directions "ne" and "n" the hero is seen from behind: show no face on the mannequin and no face-like marks anywhere.
- The spirit keeps exactly the same size, proportions, palette and line weight in every frame; only the pose changes. Consecutive frames differ by small smooth changes so idle and walk loop cleanly.
- Draw every frame as its own separate picture inside its cell: leave clear magenta space between neighbours and never let any part cross a cell edge or touch another cell.
- A cell that is empty in the layout stays empty magenta, without a mannequin: do not fill spare cells.
- HURT must look clearly different from IDLE: a short recoil backward along the facing line, then recovery; the mannequin stays in the pose shown.
- Limbs of the creature (wings, tails, ears, claws, legs, necks) keep their root fixed on the mannequin and bend in smooth arcs between frames; wing beats and tail sways match the walking rhythm.
```

## Chú thích (tiếng Việt)
- **Bố cục:** hàng 1 = đứng (4) + trúng đòn (2), hàng 2 = đi (6), hàng 3 = đánh (6), hàng 4 = thi triển hồn kỹ (4); ô thừa để trống, **không có nộm**.
- **Hướng:** chỉ vẽ nam, đông-nam, đông, đông-bắc, bắc; tây là lật ngang nên mọi hướng nghiêng nhìn sang phải. Nộm chỉ có 3 dáng (`s`, `e`, `n`): `se` / `ne` dùng dáng `e`, phụ thể vẽ chếch 3/4 nhưng điểm gắn vẫn trùng nộm.
- **Không vẽ** hào quang, hạt, bóng, pháp trận, thân / mặt / tay chân người: client và code tự thêm (`docs/art/vo-hon-phong-cach.md` phần 3.4).
- **Bài học** chèn trong prompt lấy từ `art/src/phuthe-anim/lessons.md` (một nguồn duy nhất); lượt vẽ hỏng cho bài học mới thì thêm vào file đó, không viết tay vào prompt.
- **Không** dùng ảnh phụ thể cũ (`art/src/gemini/phuthe_5huong/…`, `vh_{id}_b/_f`) và **không** dùng tờ / ảnh bị lỗi làm tham chiếu: tham chiếu chỉ là bảng nộm, turnaround đã duyệt và tờ đã qua `phuthe:check` không có khối chặn.
- Giới hạn: **tối đa 3 lượt** cho mỗi tờ; quá 3 lượt thì dừng và báo orchestrator (skill `beast-anim`, mục "Quá 3 lượt"; võ hồn giữ nhánh cũ nếu còn khối chặn).
