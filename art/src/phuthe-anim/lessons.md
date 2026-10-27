# Bài học vẽ hoạt ảnh phụ thể võ hồn (một nguồn duy nhất)

Đọc bởi `tools/assets/phuthe-sheet-prompt.mjs` (qua `phuthe-sheet-lessons.mjs`): mỗi dòng bài học dưới đây được chèn vào mục `LESSONS` của khối prompt tiếng Anh. Bài học mới (từ review, từ lượt vẽ hỏng) **thêm vào đây**, không để ở issue / comment PR / prompt viết tay. Đặc tả: `docs/art/phu-the-hoat-anh.md`; skill `beast-anim` (cùng đường đi với hồn thú).

## Cú pháp
`- [phạm vi] câu tiếng Anh cho model // ghi chú tiếng Việt (không vào prompt)`
- Phạm vi: danh sách cách nhau dấu phẩy hoặc dấu cách, gồm tên giai đoạn (`turnaround`, `direction`, hoặc `all`) và/hoặc nhóm bắt đầu bằng `@` (`@A` vật cứng, `@B` chi thể sinh vật, `@C` thực vật / hư ảnh). Bỏ trống phần giai đoạn = mọi giai đoạn; bỏ trống phần nhóm = mọi nhóm.
- Câu tiếng Anh viết một dòng, ra lệnh trực tiếp, không số pixel, không số cân bằng game.
- Nguồn ban đầu: đặc tả P0 (#1021) và bài học hồn thú `art/src/beast-anim/lessons.md` áp được cho phụ thể. Chưa có lượt vẽ phụ thể thật nào (P3 trở đi): dòng nào sinh ra từ lượt vẽ hỏng thì ghi tên võ hồn ở phần `//`.

## Nộm và hướng nhìn
- [turnaround, direction] Draw ONLY the spirit. The flat single-colored mannequin in the attached reference is the hero's body: leave it exactly where it is, with the same size and the same flat color; never repaint it, shade it, outline it, or add a face, eyes, hands or clothes to it. // vẽ lại thân / mặt người là lỗi chặn
- [turnaround, direction] Where the spirit passes in front of the mannequin, paint over it; where the mannequin hides part of the spirit, that part is simply not visible. Do not move the spirit away from the mannequin to avoid overlap. // phần nộm che phụ thể bị cutter xoá đúng ý
- [direction] Every attachment point (wing root on the back, hand grip, shoulder, head, feet) stays glued to the same place of the mannequin in every frame of the sheet; only the spirit changes shape. // điểm gắn trôi là lỗi chặn
- [turnaround, direction] Direction "se" is a three-quarter view tilted toward the lower right and direction "ne" is a three-quarter back view tilted toward the upper right; both must look clearly different from the pure side view "e", even though the mannequin itself is drawn side-on. // se / ne neo theo hàng e của thân, chỉ phụ thể đổi góc
- [turnaround, direction] Directions e, se and ne face the RIGHT side of the picture; never mirror them to face left. // tây là lật ngang trong game
- [turnaround, direction] In directions "ne" and "n" the hero is seen from behind: show no face on the mannequin and no face-like marks anywhere. // nộm bị vẽ thêm mặt ở n / ne là lỗi chặn

## Cỡ, lưới, nhất quán
- [direction] The spirit keeps exactly the same size, proportions, palette and line weight in every frame; only the pose changes. Consecutive frames differ by small smooth changes so idle and walk loop cleanly. // cỡ lệch giữa các khung / khối hướng: cảnh báo kỹ thuật (nhẹ), không chặn (quyết định chủ repo 2026-10-26 mục 4)
- [direction] Draw every frame as its own separate picture inside its cell: leave clear magenta space between neighbours and never let any part cross a cell edge or touch another cell. // hình dính / vượt ô
- [direction] A cell that is empty in the layout stays empty magenta, without a mannequin: do not fill spare cells. // ô trống có hình
- [direction] HURT must look clearly different from IDLE: a short recoil backward along the facing line, then recovery; the mannequin stays in the pose shown. // hurt trùng idle
- [turnaround] Draw all poses at the same spirit size on the same ground line; one figure per cell with clear magenta space around it. // ảnh mẫu hướng phải cùng cỡ

## Theo nhóm
- [direction @A] A rigid object keeps its shape in every frame (no bending, no melting), but each pose must really differ: change its angle, height and distance from the hand; never copy one pose into several frames. // vật cứng ít pose nhưng phải khác thật
- [direction @B] Limbs of the creature (wings, tails, ears, claws, legs, necks) keep their root fixed on the mannequin and bend in smooth arcs between frames; wing beats and tail sways match the walking rhythm. // chi thể phải dính điểm gắn ở mọi khung
- [direction @C] Soft forms (plants, flames, shadows, smoke) are painted with hard edges and a clear dark outline, never as soft blurred glow, so the shape stays separable from the magenta and from the mannequin color. // hình mềm không viền dễ lẫn nộm / nền
- [turnaround @B] For a wing attachment, draw the wings and tail rooted directly at the mannequin's upper back; do not add a separate full bird body, chest, head or legs standing above or behind the mannequin. // Tà Hỏa lượt 1 vẽ nguyên chim sau người thay vì cánh gắn lưng
- [turnaround @B] Preserve the first reference board's mannequin silhouettes at their exact original positions and sizes; do not move them downward to make room for the spirit, and leave a continuous empty magenta gap between every row and column. // Tà Hỏa lượt 1 dời nộm xuống, cánh dính dải hàng khiến kiểm chỉ dò 2 hàng
- [turnaround @B] A possession is NOT a complete animal companion: draw only the attachments explicitly named in the attachment and layering notes, rooted on the mannequin, without adding a separate whole creature. Any appearance reference, if attached, supplies shapes and colors only, never additional anatomy or composition. // Tà Hỏa lượt 2 vẫn bê nguyên chim trong concept sang phụ thể; ảnh concept chỉ neo ngoại hình
- [direction] Keep every mannequin at the exact size and position it has in the first reference board, in every occupied cell and every frame: never shrink it, shift it down or let it drift between frames; the spirit is drawn around it, never the other way round. // Tà Hỏa A–E (27/10): nộm thu nhỏ / dời xuống, trôi ở cast; cắt xong lệch neo
- [direction] The ATTACK and CAST rows hold the widest poses: keep every swing or spread inside its own cell by drawing the spirit a little smaller in those frames instead of crossing the cell edge, and keep clear magenta space between neighbouring figures so each one stays separable. // Tà Hỏa tờ B / C: hàng attack dính, thừa / thiếu hình (hinh-dinh, so-hinh) làm chặn
- [direction @B] In the last frame of CAST and in the peak frames of ATTACK the spirit keeps the same facing direction as the rest of the sheet; never turn it to face the viewer. // Tà Hỏa: cast cuối gần chính diện ở B / C / D
- [direction @B] Keep all four horizontal bands separated by uninterrupted magenta gutters, and keep each of the six attack silhouettes isolated from its neighbours. // Tà Hỏa B/C bổ sung phiên 693: lượt cũ dính H1/H2, attack dính và không dò đủ hàng
- [direction @B] Preserve six separate figures in each of the first three rows and exactly four in the last row; keep the cast wing tips away from both spare cells. // Tà Hỏa C bổ sung phiên 693: C cũ không dò đủ hàng; B4 qua kiểm nhưng cast tràn ô
- [direction @B] In the attack strike frame, fold the tail inside its own cell instead of stretching it toward the previous figure; retain the mannequin beneath every attack pose. // Tà Hỏa C4: đuôi attack nối hai hình, H3 chỉ tách 5/6 và mất nộm pha lao
- [direction @B] Keep the mannequin foot line and chest guide fixed while fitting the wing spread inside the reference cell. // Lô 1 A Băng Phượng Hoàng: áp bài học Tà Hỏa nộm trôi và cánh tràn trước lượt đầu
- [direction @B] Do not place a bird head, neck or torso above a shortened mannequin: attach just the wings, tail and crest to the original full-height hero silhouette. // Băng Phượng Hoàng A1: đầu chim phía trên nộm thu nhỏ, 46 cảnh báo
- [direction @B] Keep the full-size reference hero visible through the wing roots rather than hiding the upper half with a complete bird. // Băng Phượng Hoàng A2: còn đầu chim và nộm nhỏ; tiếp tục hướng se
- [direction @B] Leave a wide uninterrupted magenta horizontal gutter between ATTACK and CAST; shorten the cast wing tips upward to prevent the two rows joining. // Băng Phượng Hoàng A2: chỉ dò 3 dải hàng vì attack/cast dính
- [direction @B] Keep the wing roots centered on the chest guide in the side-facing mannequin, with clear space around every tail. // Băng Phượng Hoàng A3: thân chim cao và nộm thấp; B1 giữ điểm gắn
- [direction @B] In a pure side view keep both wing roots aligned to the original side-on hero, without moving the chest upward. // Băng Phượng Hoàng B1: ngực chim còn cao hơn nộm; chuẩn bị C
- [direction @B] Fold the attack feathers toward their own mannequin so each attack cell remains isolated with a clear magenta border on all sides. // Băng Phượng Hoàng B1: lưới bị chặn, giảm cánh và đuôi attack
- [direction @B] Keep side-view attack tails compact so their tips cannot bridge the magenta gap to the next frame. // Băng Phượng Hoàng B2: soát khoảng cách đuôi ở attack trước C1
- [direction @B] Reduce every attack spread around its own chest center until all six complete silhouettes have empty magenta on both sides. // Băng Phượng Hoàng B2: vẫn không tách đủ hình, B3 là lượt cuối
- [direction @B] Keep the whole side-facing attachment inside its frame even when the attack thrusts forward. // Băng Phượng Hoàng B3: còn đầu chim và ngực cao; C1 kiểm riêng khoảng trống
- [direction @B] In rear views use only the rear feather surfaces and keep the wing roots on the reference chest axis. // Băng Phượng Hoàng C1: cast gần chính diện; D chỉ khai mặt nếu lộ
- [direction @B] Keep the back-view tail compact below the wing roots, with a clean magenta gutter above the cast row. // Băng Phượng Hoàng D1: ngực cao, lộ mặt khai eye; E giữ lưới
- [direction @B] For owl possession draw only the paired wings and hand claws from the concept, never the owl torso or face above the hero. // Băng Phượng Hoàng A–E: nguyên chim lấn thân; Kim Vũ A áp bài học này
