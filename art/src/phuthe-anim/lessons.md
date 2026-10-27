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
- [direction @B] Keep ears, claws and tail attached to the unchanged mannequin; keep the tail curled within its cell so it cannot bridge adjacent attack figures. // Lô 2: áp dụng lỗi đuôi attack nối hình của Tà Hỏa trước lượt Yêu Hồ A1
- [direction @B] For fox, wolf and tiger possessions, copy only ears, tails and the explicitly listed attached limbs from the concept: no animal head, muzzle, chest, torso or animal legs behind the hero. The unchanged board mannequin remains the only body. // Yêu Hồ A1: nguyên hồ ly sau nộm, nộm thu nhỏ/dời xuống
- [direction @B] For Yêu Hồ only, the fox attachment consists of exactly two separate pointed ear pieces rooted on top of the cyan head and three tails rooted at the cyan lower back. Leave the entire cyan head exposed between the ears: no fox forehead, muzzle, eyes, mask or second head above or behind it, and no detached flame particles. // Yêu Hồ A2: còn đầu/mặt hồ ly trên nộm, attack che nộm

- [direction @B] Preserve the exposed cyan head between the ear pieces and root tails at the lower back; do not reintroduce an animal face when turning the attachments. // yeu_ho B1: A3 bỏ được nguyên con; giữ dạng phụ thể ở hướng kế

- [direction @B] Only reference image 1 determines the mannequin silhouette and pose in each cell. Never copy the mannequin from reference image 3: side-on board bodies must stay side-on, even if the style sheet shows front-on bodies. // yeu_ho B2: B1 nom-mat: nộm chính diện thay dáng ngang

- [direction @B] For sheets whose board is side-on, copy the SIDE PROFILE cyan silhouette of board image 1 literally: one narrow arm profile, right-facing nose silhouette, and the original narrow torso. Do not replace it with a front-view round head and two symmetric arms. // yeu_ho B3: B2 tiếp tục nom-mat do sao dáng chính diện

- [direction @B] Keep side-board hands and arms in their original flat cyan poses throughout ATTACK and CAST, with tails behind the waist rather than over the arm silhouette. // yeu_ho C1: B3 qua kiểm; tránh che nộm khi vung đuôi

- [direction @B] When a side-board sheet requests a back three-quarter attachment view, rotate only the attachments and keep the same side-board mannequin; do not replace its pose with a back-view body. // yeu_ho D1: C1 qua kiểm; tránh đổi nộm khi vẽ ne

- [direction @B] The board mannequin head starts near 27 percent of cell height and its feet sit near 77 percent: preserve that full 50 percent cell-height silhouette, never reduce it to a tiny 35 percent tall figure. Preserve each board pose exactly. // yeu_ho D2: D1 nom-mat ở idle vì nộm thu nhỏ/dời

- [direction @B] For a back-view board, keep the original back-view cyan body from image 1; the style reference must never change that body into its side-view silhouette. // yeu_ho E1: D2 qua kiểm; E phải giữ nộm lưng

- [direction @B] For wolf and tiger attachments, keep claw pieces on the existing cyan hands and ears on the cyan head; the tail root stays at the lower back. Never add a second animal body or move the whole attachment mass sideways away from the hero. // liet_hoa_thuong_lang A1: Yêu Hồ sau neo lệch ngang: giữ điểm gắn ngay trong RAW

- [direction @B] For Liệt Hỏa Thương Lang only, draw exactly two separate charcoal-and-ember ear pieces on the cyan head, claw gloves on the cyan hands, and ONE charcoal tail with a flame tip at the cyan lower back. The cyan head stays fully visible: no wolf forehead, eyes, snout, mask, neck, chest, torso, legs or separate wolf anywhere. // liet_hoa_thuong_lang A2: Thương Lang A1 nguyên sói sau nộm
