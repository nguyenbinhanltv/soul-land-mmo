# Bài học vẽ hoạt ảnh hồn thú (một nguồn duy nhất)

Đọc bởi `tools/assets/beast-sheet-prompt.mjs` (qua `beast-sheet-lessons.mjs`): mỗi dòng bài học dưới đây được chèn vào mục `LESSONS` của khối prompt tiếng Anh. Bài học mới (từ review, từ lượt vẽ hỏng) **thêm vào đây**, không để ở issue / comment PR / prompt viết tay.

## Cú pháp
`- [phạm vi] câu tiếng Anh cho model // ghi chú tiếng Việt (không vào prompt)`
- Phạm vi: danh sách cách nhau dấu phẩy hoặc dấu cách, gồm tên giai đoạn (`turnaround`, `direction`, `sheet`, hoặc `all`) và/hoặc họ hoạt ảnh bắt đầu bằng `@` (`@quad`, `@bird`, `@snake`, `@insect`, `@plant`). Bỏ trống phần giai đoạn = mọi giai đoạn; bỏ trống phần họ = mọi họ.
- Câu tiếng Anh viết một dòng, ra lệnh trực tiếp, không số pixel, không số cân bằng game.
- Nguồn bài học: báo cáo H4 (`bao-cao-h4.md` mục 3.2, 5.1), #766 và #767–#781, các PR đợt 1–5. Sửa câu thì sửa ở đây rồi sinh lại prompt.

## Hướng nhìn
- [turnaround, direction, sheet] Direction "se" is a three-quarter view: the body axis is turned about 45 degrees toward the lower right, the face is visible and looks diagonally down toward the viewer, so it clearly differs from "e" (pure side profile). // se hay lẫn với e (Huyền Băng, Hắc Bối, Quỷ Hổ)
- [turnaround, direction, sheet] Direction "ne" is a three-quarter BACK view: the body axis is turned about 45 degrees away toward the upper right, the rump and back are nearest to the viewer, and it must not be drawn as a plain side profile. // ne hay vẽ gần như ngang (Phong Lang B, Bạch Hùng)
- [turnaround, direction, sheet] Direction "n" is a pure back view: only the back of the head, back, rump and tail are visible. // khối n lộ mặt ở 15/16 tờ B
- [turnaround, direction, sheet] Every direction e, se and ne faces the RIGHT side of the picture; never mirror them to face left. // tây là lật ngang trong game

## Hurt và die
- [turnaround, direction, sheet] HURT is a small recoil along the facing line: the creature stays upright on its feet and does not roll over, bounce into a new facing or turn its head toward the viewer. // 29/32 hurt sai: ngửa bụng, quay mặt
- [turnaround, direction, sheet] DIE is a slow collapse along the facing line: the legs fold, the body lowers, and the final pose keeps the same body axis as the idle pose of that block. // 27/32 die xoay thân 90°
- [turnaround, direction, sheet @quad] Squat or low-bodied creatures (toads, turtles, boars) also keep the belly hidden while recoiling: they hunker lower instead of rearing up. // hurt của ếch, rùa hay ngửa bụng
- [turnaround, direction, sheet @bird] HURT of a bird jolts the wings and body backward but its feet stay on the ground; DIE ends with the wings folded along the body. // cánh dễ bung ra ngang khi ngã
- [turnaround, direction, sheet @snake] DIE of a snake ends stretched out straight along the facing line, never coiled sideways. // thân rắn dễ cuộn ngang khi chết

## Cỡ, lưới, nhất quán
- [direction, sheet] Keep the body the same height and length in every row of the sheet, matching the reference; never let walking, attacking or hurt frames grow or shrink the creature. // cỡ thân n / ne to hơn 15–20% ở tờ B 1254²
- [direction, sheet] Draw every frame as its own separate picture: leave clear magenta space between neighbours, never overlap or merge two creatures. // hình dính nhiều ô làm cutter hỏng
- [direction, sheet] Idle frames must show a small visible change from frame to frame (breathing, sway), and HURT must look clearly different from IDLE. // khung chết: idle / hurt trùng nhau (khung sao chép khuôn)
- [direction, sheet] A frame that is empty in the layout stays empty magenta: do not fill spare cells with extra poses. // ô trống có hình
- [turnaround] Draw all poses at the same body size and on the same ground line; one creature per cell with clear magenta space around it. // ảnh mẫu hướng phải cùng cỡ
