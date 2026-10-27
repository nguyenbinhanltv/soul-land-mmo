# Bài học vẽ tờ UI Kit (một nguồn duy nhất)

Đọc bởi `tools/assets/ui-sheet-prompt.mjs` (qua `ui-sheet-lessons.mjs`): mỗi dòng bài học dưới đây được chèn vào mục `LESSONS` của khối prompt tiếng Anh. Bài học mới (từ review, từ lượt vẽ hỏng) **thêm vào đây**, không để ở issue, comment PR hay prompt viết tay. Sửa xong chạy `node --test tools/assets/ui-sheet.test.mjs`.

## Cú pháp
`- [phạm vi] câu tiếng Anh cho model // ghi chú tiếng Việt (không vào prompt)`
- Phạm vi: danh sách cách nhau dấu phẩy hoặc dấu cách, gồm loại tờ (`BOARD`, `F`, `N`, `O`, `T`, `I`, `D`, hoặc `all`). Bỏ trống hoặc `all` = mọi loại.
- Câu tiếng Anh viết một dòng, ra lệnh trực tiếp, không số pixel, không số cân bằng game.
- Nguồn: luật vẽ AI ở `docs/art/ui-kit.md`, bài học hồn thú (#861–#870) và bảng triệu chứng ở skill `ui-kit`.

## Chữ và ký tự
- [all] Draw no text, numbers, letters, glyphs, runes, logos or symbols that could be read as characters anywhere in the image; where a label would go, draw an empty bar or a flat block of colour. // chữ do phông game vẽ; model làm hỏng chữ Việt
- [F, N, T, BOARD] Do not draw fake labels, button captions or placeholder squiggles inside the frames: the inside stays an empty flat fill. // chữ lạc trong ruột

## Nền và bố cục tờ
- [all] Keep at least five percent of the image width of empty magenta between neighbouring pieces and between any piece and the image edge; never let two pieces touch. // hình dính nhau là lỗi chặn
- [F, N, O, T, I, D] Arrange the pieces on an even grid, left to right, top to bottom, exactly in the order and row counts given; draw each piece once, never repeat, mirror or crop a piece. // đếm hàng và số mảnh mỗi hàng
- [all] Cast no shadow and no glow onto the magenta background; a soft shadow or halo turns into a pink fringe after the background is keyed out. // viền ám hồng

## Khung và nút (9-slice)
- [F, N] Put ornament only at the four corners and at the middle of each side; the straight side between them is a flat band of one or two colours with no pattern along it, so it can be stretched without showing repeats. // thân cạnh phẳng mới kéo giãn được
- [F, N] All four corners have the same size and the same border thickness; draw one beautiful top-left corner and keep the others consistent with it, the tool mirrors them. // công cụ dựng gương
- [F, N] The inside of a frame or button is a flat or very gently shaded uniform fill, with no motif, vignette or light spot near the centre. // ruột đồng nhất để chia 9 không lộ
- [N] The pressed state looks sunk (darker, one pixel lower, inner shadow), the hover state looks lit (lighter rim); the disabled state is desaturated and flat. The five states of one button type share exactly the same shape, size and outline. // trạng thái không chỉ đổi màu
- [N] Primary buttons use vermilion red (son) with a pale bronze rim; secondary buttons use dark ink with the same bronze rim; the two tab pieces are open on the bottom edge. // vai trò vật liệu

## Chất liệu, bảng màu, phong cách
- [all] Limit the whole image to a small palette of at most 32 colours with one consistent dark outline (#1a1020); sharp pixel edges, no anti-aliased blur, no large gradients, no noise texture. // bảng màu ≤ 32 màu
- [F, N, T, O, BOARD] Two materials share the same corner set, outline weight and bronze rim: INK (near-black wood with ink-wash grain, pale bronze rim) and PAPER (ivory rice paper, thin vermilion rim, wooden roller); only the fill and the text colour differ. // hai chất liệu Mực / Giấy
- [all] Match the style, materials and palette of the attached approved reference exactly; never copy its layout. // tham chiếu để khớp nét
- [O] Rarity borders must differ by shape (corner style or a small notch mark) as well as by colour, never colour alone. // độ hiếm không chỉ bằng màu
- [O] The four skill-slot states must be distinguishable in greyscale: ready is bright with a lit rim, cooldown is dimmed with a clear dark overlay quarter, locked is flat grey with a small padlock-like notch, no-mana is bright but with a blue-grey tint and a broken rim. // hồn kỹ khóa / sẵn sàng hiện gần giống nhau
- [I] One icon family per sheet: the same stroke weight, the same corner rounding, the same colour budget; each icon is a single readable silhouette centred in its cell, roughly sixty percent of the cell size. // mỗi tờ một họ
- [I] Icons stay legible when reduced to a quarter of their size: no hairlines, no more than three tones per icon plus the outline. // hạ 32 / 24
- [D] Decorations are loose standalone ornaments (title rule, corner flourish, seal, ribbon); each is a single separated piece that does not need a frame around it. // trang trí rời
- [BOARD] The sample screen is for approval and as a style reference only: it shows the HUD, two panels, one dialog and the action row, with all labels drawn as empty bars. // không cắt
- [N] Render every rim as hard opaque stepped pixel blocks with no blended magenta pixels; keep every straight rim segment perfectly constant in colour and thickness, with tiny corner ornaments confined to the corners. // N lượt 1: viền hồng và thân cạnh không phẳng
- [N] Both tabs use the same dark ink fill as secondary buttons; selection changes only the jade rim and brightness, never turns a tab into ivory paper. // N lượt 1 và 2: tab chọn sai chất liệu Mực
- [O] Make the outer outline a fully opaque hard-edged dark pixel staircase directly against pure magenta, with no antialiasing, blended pink pixels or translucent fringe. // O lượt 1: viền hồng 48,6 phần trăm
- [O] Shrink every slot to at most seventy percent of its grid cell, leaving broad uninterrupted magenta gutters even across the five-slot rarity row. // O lượt 1 và 2: hàng độ hiếm quá sát nhau
- [T] The empty text input box uses a dark ink interior matching the three empty bar frames, never an ivory paper fill; the scrollbar thumb is pale bronze. // T lượt 1: ô nhập sai chất liệu Mực
- [T] The three second-row bar fills are bare flat solid red, blue and gold strips without bronze frames, corners, medallions or end caps; only the three first-row empty frames carry ornaments. // T lượt 1 và 2: ruột thanh bị vẽ thêm khung
- [F] Use a completely constant solid bronze band on each straight side, with all ornament strictly outside the stretchable band. // F đợt 2 lượt 1: sáu cạnh bị chặn
- [F] End every silhouette with fully opaque near-black ink pixels directly touching pure magenta, without any blended pink transition. // F đợt 2 lượt 2: viền hồng 32,8 phần trăm
- [F] Keep each frame inside the central seventy percent of its cell to preserve broad uninterrupted magenta gutters. // F lượt 3: khoảng cách thiếu
- [N] Make straight button sides plain constant bronze strips, reserving all ornamental pixels for tiny identical corner blocks. // N lượt 3 cũ: cả 12 cạnh bị chặn
- [N] Place a solid opaque near-black outline between bronze and magenta with absolutely no intermediate pink edge pixels. // N attempt4: viền hồng 42,4 phần trăm
- [N] Shrink each button to sixty percent of its cell width so even the five-button rows retain broad pure-magenta gutters. // N attempt5: hai hàng nút vẫn quá sát
- [N] Keep every selected and disabled state within the same compact corner geometry and use one unbroken flat rim colour per straight segment. // N attempt6: cạnh và góc còn lệch
- [O] Fill every slot interior with one completely uniform dark ink colour, without grain, cloud marks or a central light spot. // O lượt 3 cũ: ruột có vân khi soát mắt
- [O] Separate the entire silhouette from magenta with a thick fully opaque near-black stepped outline and no colour blending at the boundary. // O attempt4: viền hồng 45,9 phần trăm
- [O] Make each complete slot including ornaments occupy only half of its cell width, leaving wide clear magenta space around every side. // O attempt5: cả ba hàng còn khoảng cách thiếu
- [O] Keep the complete canvas strictly square even when five pieces must share the rarity row. // O attempt6: sai tỉ lệ 3:2
- [T] Keep every empty bar frame and input interior one flat dark ink colour without any grain, motif or bright centre. // T lượt 3 cũ: ruột chia 9 chạm trần
- [T] Draw the straight rims of bar frames and the input as uninterrupted constant bronze bands; keep decorative shapes entirely inside tiny corner areas. // T attempt4: bốn cạnh co giãn bị chặn
- [T] Use only opaque near-black stepped pixels at the outer silhouette, with no antialiasing or pink blend against the magenta background. // T attempt5: viền hồng 27,3 phần trăm
- [T] Keep the scrollbar thumb compact and structurally separate from its thin track so the thumb cannot dominate the measured rim thickness. // T attempt6: thanh cuộn đo viền quá dày
