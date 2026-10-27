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
- [direction @B] Keep the ear roots, limb roots and tail root on the original mannequin while leaving an unbroken magenta gap around each attack pose. // Lô 3 trước A1: rút lỗi nộm trôi và attack dính từ Tà Hỏa.
- [direction @B] Draw only the attachments named in the attachment notes on the hero; do not add an animal torso or separate head unless those notes explicitly request it; keep the mannequin full height. // Nhu Cốt Thố A1: nguyên con thỏ sau nộm và nộm thu nhỏ.
- [direction @B] For rabbit possession leave the cyan head and torso fully visible, with ears rooted on that head and hind-leg attachments on its feet; omit rabbit face and chest. // Nhu Cốt Thố A2: vẫn có mặt/ngực thỏ sau nộm.
- [direction @B] The mannequin must retain its original long body silhouette, not become a short rounded icon in front of the spirit. // Nhu Cốt Thố A3: nộm vẫn thu nhỏ thành hình tròn ngắn.
- [direction @B] If the notes request ears and feet only, leave the space between those attachments empty instead of connecting them into a second animal body. // Nhu Cốt Thố B1: tai/chân lại nối thành thân thú riêng.
- [direction @B] Keep wide attack trails short and attached; do not let a trail bridge the magenta gutter to the next frame. // Nhu Cốt Thố C1: dải attack dài sát ô bên.
- [direction @B] Keep the six attack poses as six compact islands, with a full-width empty magenta band above and below the row. // Nhu Cốt Thố C1: kiểm chặn không dò đủ bốn hàng.
- [direction @B] Preserve four isolated cast figures with a visible magenta gap even at the widest ear or limb spread. // Nhu Cốt Thố C1/C2: cast dễ dính, giữ bốn hình riêng.
- [direction @B] Keep recoil and cast attachments within the same compact envelope as idle, without shrinking the hero silhouette to create space. // Nhu Cốt Thố D1: nộm nhỏ trong cast/hurt.
- [direction @B] For coiled attachments, keep each coil compact around its named arm or shoulder, with empty gutters above and below every row. // Xà Hoàng A1: áp bài học hình dính cast của Nhu Cốt Thố.
- [direction @B] Preserve the mannequin position across all four idle frames; make room by tightening coils, never by moving the mannequin downward or sideways. // Xà Hoàng A1: 4 chặn nom-lech ở idle.
- [direction @B] Copy the mannequin silhouette and its exact key color from image one without rounding, shortening, recoloring or replacing any visible part. // Xà Hoàng A2: nom-mat chặn toàn bộ 22 ô.
- [direction @B] Keep the attachment centered on the shoulder and arm axis rather than a large coiled pedestal behind the hero. // Xà Hoàng A3: vòng rắn sau thân, nộm thu nhỏ.
- [direction @B] A coil that crosses the arm must stay in contact with that arm in every pose, without a detached loop or floating head. // Xà Hoàng B1: cần kiểm vòng quấn tay khi ráp LPC.
- [direction @B] The four cast mannequins must remain the same body scale as idle, even when the neck or attachment rises higher. // Xà Hoàng C1: nộm cast nhỏ hơn idle.
- [direction @B] Keep the neck bend within its cell during the strike; leave the neighbouring figure completely separate. // Xà Hoàng D1: đầu mổ ở attack sát hình kế.
- [direction @B] Shorten the striking neck and attached trail enough to keep all six attack figures disconnected from each other. // Xà Hoàng E1: attack dính, chỉ tách 3/6 hình.
