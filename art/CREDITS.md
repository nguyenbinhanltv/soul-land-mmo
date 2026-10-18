# Nguồn gốc và giấy phép asset

Quy định ở `GAME_DESIGN.md` mục 5.11 (phần "Nguồn và giấy phép"). Tóm tắt:

- Hình nhân vật, võ hồn, hồn thú **do nhóm tự vẽ** trong Aseprite, chỉ dùng màu trong `art/palette.gpl`.
- **Không dùng** sprite, ảnh cắt hoặc hình vẽ lại sát nét từ game thương mại (kể cả *Thế Giới Săn Hồn*), phim hoạt hình hay truyện tranh chính thức.
- **Ảnh AI chỉ là concept**, không đưa vào game. Ghi công cụ và prompt; không ghi tên họa sĩ còn sống trong prompt.
- **Asset bên ngoài** (font, tileset, âm thanh) chỉ nhận CC0, CC-BY hoặc OFL. CC-BY phải hiện tên tác giả trong màn hình giới thiệu của game.

Mỗi asset một dòng. Thêm ảnh vào `shared/assets/sprites/` thì thêm key vào `manifest.json` và ghi một dòng ở đây.

## Asset tự vẽ

| File | Key | Người vẽ | Concept AI (công cụ, prompt) | Ghi chú |
|---|---|---|---|---|
| `shared/assets/tiles.png` | `tiles` | Sinh bằng code (`tools/gen-tiles.py`) | Không | Tileset rừng |

## Asset bên ngoài

| File | Tác giả | Link gốc | Giấy phép | Đã chỉnh sửa gì |
|---|---|---|---|---|
| (font) Be Vietnam Pro | Lâm Bảo, Tony Le, Việt Anh Nguyễn | https://fonts.google.com/specimen/Be+Vietnam+Pro | OFL | Không, tải qua Google Fonts |
