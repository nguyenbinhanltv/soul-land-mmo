# Bài học vẽ hoạt ảnh hồn thú (một nguồn duy nhất)

Đọc bởi `tools/assets/beast-sheet-prompt.mjs` (qua `beast-sheet-lessons.mjs`): mỗi dòng bài học dưới đây được chèn vào mục `LESSONS` của khối prompt tiếng Anh. Bài học mới (từ review, từ lượt vẽ hỏng) **thêm vào đây**, không để ở issue / comment PR / prompt viết tay.

## Cú pháp
`- [phạm vi] câu tiếng Anh cho model // ghi chú tiếng Việt (không vào prompt)`
- Phạm vi: danh sách cách nhau dấu phẩy hoặc dấu cách, gồm tên giai đoạn (`turnaround`, `direction`, `sheet`, hoặc `all`) và/hoặc họ hoạt ảnh bắt đầu bằng `@` (`@quad`, `@bird`, `@snake`, `@insect`, `@plant`, `@float` phù du không chân, `@swim` thủy sinh không chân, `@fly` côn trùng có cánh bay, `@vine` dây leo cắm rễ, `@worm` sâu / tằm bò; thêm `!` phía trước để LOẠI một họ: `!@float`). Họ `float` / `swim` chỉ có ở công cụ (`TOOL_FAMILY` trong `beast-sheet-lib.mjs`), không có ở client. Bỏ trống phần giai đoạn = mọi giai đoạn; bỏ trống phần họ = mọi họ.
- Câu tiếng Anh viết một dòng, ra lệnh trực tiếp, không số pixel, không số cân bằng game.
- Nguồn bài học: báo cáo H4 (`bao-cao-h4.md` mục 3.2, 5.1), #766 và #767–#781, các PR đợt 1–5. Sửa câu thì sửa ở đây rồi sinh lại prompt.

## Hướng nhìn
- [direction, sheet @swim] In the south-facing block, keep the head aimed straight toward the viewer throughout IDLE, WALK and ATTACK; do not turn right. In DIE, keep the spine aligned from the top to the bottom of the cell along the south-facing line, never stretched sideways from left to right. // khối s của sinh vật bơi hay nghiêng phải và die nằm ngang; chốt orchestrator PR #1107
- [turnaround, direction, sheet] Direction "se" is a three-quarter view: the body axis is turned about 45 degrees toward the lower right, the face is visible and looks diagonally down toward the viewer, so it clearly differs from "e" (pure side profile). // se hay lẫn với e (Huyền Băng, Hắc Bối, Quỷ Hổ)
- [turnaround, direction, sheet] Direction "ne" is a three-quarter BACK view: the body axis is turned about 45 degrees away toward the upper right, the rump and back are nearest to the viewer, and it must not be drawn as a plain side profile. // ne hay vẽ gần như ngang (Phong Lang B, Bạch Hùng)
- [turnaround, direction, sheet] Direction "n" is a pure back view: only the back of the head, back, rump and tail are visible. // khối n lộ mặt ở 15/16 tờ B
- [turnaround, direction, sheet] Every direction e, se and ne faces the RIGHT side of the picture; never mirror them to face left. // tây là lật ngang trong game

## Hurt và die
- [direction, sheet @snake] In the south-facing block, keep the head aimed straight toward the viewer throughout WALK and ATTACK; do not turn right. In DIE, keep the spine aligned from the top to the bottom of the cell, never stretched sideways from left to right. // s đi / đánh hay nghiêng phải, die hay nằm ngang; tái hiện: node tools/assets/beast-sheet-prompt.mjs --species bich_lan_xa --stage sheet --out <thư mục ngoài repo>
- [turnaround, direction, sheet @quad @bird @insect] HURT is a small recoil along the facing line: the creature stays upright on its feet and does not roll over, bounce into a new facing or turn its head toward the viewer. // 29/32 hurt sai: ngửa bụng, quay mặt
- [turnaround, direction, sheet @quad @bird @insect] DIE is a slow collapse along the facing line: the legs fold, the body lowers, and the final pose keeps the same body axis as the idle pose of that block. // 27/32 die xoay thân 90°
- [turnaround, direction, sheet @quad] Squat or low-bodied creatures (toads, turtles, boars) also keep the belly hidden while recoiling: they hunker lower instead of rearing up. // hurt của ếch, rùa hay ngửa bụng
- [turnaround, direction, sheet @quad] HURT of a four-legged creature moves only the head, trunk and tail: the four feet never leave the spots where they stand, and the body never rears up or lifts a leg. // Hàn Băng Địa Long: hurt mâu thuẫn "đầu cúi" / "ngả ra sau" / "bước lùi" (#1097)
- [turnaround, direction, sheet @snake] A snake has no legs, feet, paws or claws in any frame: it slithers on its belly along the ground. HURT snaps the head and front of the body backward along the facing line while the body stays on the ground; it never rears up on legs, flips onto its back or shows its belly. // rắn bị vẽ chân / dậm đất (#1097)
- [turnaround, direction, sheet @snake] While slithering the body flows in an S-curve along the ground toward the facing direction; the head leads and the tail follows. // rắn trườn
- [turnaround, direction, sheet @plant @vine] A plant is rooted: no human or animal feet, paws or hands. HURT whips and leans the stems and vines back along the facing line while the root base stays on the same spot; DIE wilts and slumps limp. // cây bị vẽ chân người (#1097)
- [turnaround, direction, sheet @vine] A vine creature crawls by creeping its roots and trailing tendrils along the ground; it never grows legs and never walks upright. // quỷ đằng bò bằng rễ
- [turnaround, direction, sheet @worm] A caterpillar-like worm crawls low on its soft segments with tiny legs hidden underneath: HURT scrunches the segments and pushes the body back a little, DIE flattens it limp along the facing line; it never stands up on big legs and never shows its underside. // tằm bị vẽ đứng trên chân (#1097)
- [turnaround, direction, sheet @fly] A winged flying creature hovers in every idle, moving and hurt frame: no feet planted on a ground, wings always visible. HURT is a small push backward along the facing line with the wings stuttering; DIE folds the wings and rests on the ground along the facing line. // bướm lửa bay (#1097)
- [turnaround, direction, sheet @bird] HURT of a bird jolts the wings and body backward but its feet stay on the ground; DIE ends with the wings folded along the body. // cánh dễ bung ra ngang khi ngã
- [turnaround, direction, sheet @snake] DIE of a snake ends stretched out straight along the facing line, never coiled sideways. // thân rắn dễ cuộn ngang khi chết
- [turnaround, direction, sheet @float] HURT of a drifting creature is a sharp contraction plus a small push backward along the facing line, the tentacles flick, and it keeps floating upright. DIE is a slow sink along the facing line with the body going slack and the tentacles trailing limp; it stays legless and rootless in every frame and never ends lying on a floor. // sứa / bạch tuộc: không chân, không ground (#1049)
- [turnaround, direction, sheet @swim] HURT of a swimming creature is a small jolt backward along the facing line, fins flaring, staying level. DIE is a slow sink with the fins drooping, ending level with the same body axis as idle; it never shows its belly and never rotates sideways across the view. // cá, đuối, cá mập, cá voi: không chân (#1049)
- [turnaround @float @swim] Draw all poses at the same body size and on the same baseline; one creature per cell with clear magenta space around it. // ảnh mẫu hướng, loài không chân

## Cỡ, lưới, nhất quán
- [direction, sheet] Keep the body the same height and length in every row of the sheet, matching the reference; never let walking, attacking or hurt frames grow or shrink the creature. // cỡ thân n / ne to hơn 15–20% ở tờ B 1254²
- [direction, sheet] Draw every frame as its own separate picture: leave clear magenta space between neighbours, never overlap or merge two creatures. // hình dính nhiều ô làm cutter hỏng
- [direction, sheet] Idle frames must show a small visible change from frame to frame (breathing, sway), and HURT must look clearly different from IDLE. // khung chết: idle / hurt trùng nhau (khung sao chép khuôn)
- [direction, sheet] A frame that is empty in the layout stays empty magenta: do not fill spare cells with extra poses. // ô trống có hình
- [turnaround !@float !@swim !@fly] Draw all poses at the same body size and on the same ground line; one creature per cell with clear magenta space around it. // ảnh mẫu hướng phải cùng cỡ
- [turnaround, direction, sheet @insect] For Nhan Dien Ma Chu (the human-faced demon spider) only: show exactly eight large legs as four clearly separated pairs, with all four pairs readable in every direction; the human face on the abdomen is only a FLAT painted marking, never a raised or sculpted face, and the marking is hidden in back-facing directions n and ne. // Nhân Diện Ma Chu: bốn cặp chân rõ, mặt người phẳng; ngoại lệ orchestrator 27/10 PR #1114
