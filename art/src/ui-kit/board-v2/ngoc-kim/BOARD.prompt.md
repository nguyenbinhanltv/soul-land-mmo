# Tờ BOARD: style board (chỉ duyệt, không cắt)

Quy trình: skill `ui-kit` (`.claude/skills/ui-kit/SKILL.md`), luật vẽ `docs/art/ui-kit.md`. File này sinh tự động bằng `node tools/assets/ui-sheet-prompt.mjs --kind BOARD`; **không sửa tay** (thiếu ý thì thêm bài học vào `art/src/ui-kit/lessons.md` hoặc sửa mẫu `ui-sheet-prompt.mjs`, rồi sinh lại).

| Mục | Giá trị |
|---|---|
| Loại | BOARD: style board (chỉ duyệt, không cắt) |
| Ảnh | tỉ lệ **3:2, ra 1536×1024** (không đòi số pixel; công cụ Codex không có ô chọn cỡ, cỡ nào hợp tỉ lệ cũng nhận) |
| Bố cục | một ảnh, **không cắt** (chỉ để duyệt và làm tham chiếu) |
| Chất liệu | Mực + Giấy |
| Hướng | **ngoc-kim**: Ngọc – Kim (tiên môn hoàng gia: tím than + lưu ly, vàng đồng chạm vân, nút ngọc bích) (**nháp chờ duyệt**, docs/art/ui-kit.md mục "Hướng nghệ thuật tu tiên") |
| Nền | #FF00FF phẳng, không chữ, không bóng |

## Cách làm
1. Mở cuộc trò chuyện **mới** cho mỗi tờ; đính ảnh tham chiếu **theo đúng thứ tự**:
   (1) (tùy chọn) ảnh chụp hiện trạng 1366×768 của HUD / Nhân vật / Túi / hộp thoại (`client/scripts/ui-shots.mjs`), chỉ để biết màn nào cần phục vụ
2. Dán khối prompt dưới đây. Không chọn cỡ ảnh.
3. Lưu ảnh gốc **nguyên byte** (không resize) vào `art/src/ui-kit/BOARD.png`. Mở **tờ liên hệ** (xanh đạt, vàng nhẹ, đỏ chặn).
4. Chỉ tờ này hỏng thì vẽ lại **chỉ tờ này**, tối đa **3 lượt**; chọn lượt ít mục chặn / nhẹ nhất rồi mắt. Mỗi lượt đổi **một** thứ. **Không** dùng tờ hỏng làm tham chiếu.
5. Đưa orchestrator đường dẫn tờ + prompt thật đã gửi.

## Prompt (tiếng Anh cho model)
```text
One illustration, landscape 3:2 aspect ratio: a sample game screen for a pixel-art xianxia MMO user interface, drawn as an approval image and style reference.
Show: (1) a left HUD column with a stats frame and six menu buttons; (2) a "character" panel and a "bag" panel side by side, INK material (dark liuli glass, faint veins, aged bronze-gold rim); (3) one PAPER material dialog box (aged ivory rice paper, thin vermilion rim, jade roller) at the lower middle; (4) one vermilion primary button and one dark secondary button; (5) a row of skill slots along the bottom edge.
ABSOLUTELY no text, numbers, letters, logos or symbols anywhere; where a label would go draw an empty bar or a flat block of colour.
Frames: ornament only at the four corners and the middle of each side; the straight side between is a flat band of one or two colours with no pattern along it. INK and PAPER share the same corner set, border thickness and bronze-gold rim; they differ only in fill and text colour.
STYLE: pixel-art game interface for a xianxia cultivation MMO (Douluo Dalu setting), sharp pixel edges, palette of at most 32 colours, one consistent dark outline (#1a1020), no blur, no large gradients. Restraint: generous empty space (liu bai), ornament only at the corners, the middle of each side and clasp points, the straight sides stay flat. Exactly one lit accent per piece or screen (spirit power); everything else recedes into dark. Rank by light, never by loud colour: stone grey, jade green, ice blue, violet with gold veins, gold with vermilion qi. At most 3 accent colours. Palette: deep indigo-navy and glazed liuli base, aged antique bronze-gold metal (never glaring yellow), jade-green and ice-blue gems, vermilion seal-red only for stamps, warnings and top rank. Materials: dark liuli glass with faint veins; frames of aged bronze-gold with cloud and dragon-scroll relief at corners only; buttons as jade pendants or gold plaques, never flat plastic pills; paper is aged ivory rice paper with torn edges and a vermilion seal. A thin faint qi wisp may trace the rim.
AVOID: long decorative lettering, plastic gradient drop shadows, double or triple borders, oversaturated glaring colours, cartoon-style icons, copying the artwork or symbols of another game, bright pure-yellow gold, bright fully saturated blue.
Outside the screen the background is one flat solid colour. Behind the panels hint a dark old village, only suggested, no detail. Consistent light and line weight in every frame.

LESSONS (learned from earlier sheets, follow every line):
- Draw no text, numbers, letters, glyphs, runes, logos or symbols that could be read as characters anywhere in the image; where a label would go, draw an empty bar or a flat block of colour.
- Do not draw fake labels, button captions or placeholder squiggles inside the frames: the inside stays an empty flat fill.
- Keep at least five percent of the image width of empty magenta between neighbouring pieces and between any piece and the image edge; never let two pieces touch.
- Cast no shadow and no glow onto the magenta background; a soft shadow or halo turns into a pink fringe after the background is keyed out.
- Limit the whole image to a small palette of at most 32 colours with one consistent dark outline (#1a1020); sharp pixel edges, no anti-aliased blur, no large gradients, no noise texture.
- Match the style, materials and palette of the attached approved reference exactly; never copy its layout.
- The sample screen is for approval and as a style reference only: it shows the HUD, two panels, one dialog and the action row, with all labels drawn as empty bars.
- Include one sample ranking panel in INK material with a clear podium hierarchy and blank horizontal ranking rows, alongside the HUD, character and bag panels, PAPER dialog and hotbar; show no readable text or numbers.
```

## Chú thích (tiếng Việt)
- **Không chữ, số, logo** trong ảnh (lỗi chặn nếu đọc được); chữ do phông game vẽ.
- Mảnh cách nhau ≥ 5% cạnh tờ, không sát mép, không đổ bóng ra nền.
- Số mảnh và số hình mỗi hàng phải **đúng** bố cục; hình dính nhau hoặc thiếu mảnh là lỗi chặn.
