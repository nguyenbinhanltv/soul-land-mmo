# Nguồn gốc và giấy phép asset

Quy định ở `GAME_DESIGN.md` mục 5.11 (phần "Nguồn và giấy phép"). Tóm tắt:

- Hình nhân vật, võ hồn, hồn thú do nhóm tạo: **PixelLab qua dây chuyền `tools/assets`** (dùng thẳng trong game) hoặc vẽ tay trong Aseprite; chỉ dùng màu trong `art/palette.gpl` (cộng màu võ hồn và hồn hoàn theo 5.11).
- **Không dùng** sprite, ảnh cắt hoặc hình vẽ lại sát nét từ game thương mại (kể cả *Thế Giới Săn Hồn*), phim hoạt hình hay truyện tranh chính thức, kể cả làm ảnh tham chiếu cho AI.
- **Ảnh AI:** chỉ dùng công cụ mà điều khoản cho phép dùng kết quả (PixelLab: https://pixellab.ai/termsofservice). Ghi công cụ, prompt và ngày; không ghi tên họa sĩ còn sống trong prompt. `tools/assets/validate.mjs --register` tự ghi dòng vào mục "Asset tạo bằng AI (PixelLab)".
- **Asset bên ngoài** (font, tileset, âm thanh) chỉ nhận CC0, CC-BY hoặc OFL. CC-BY phải hiện tên tác giả trong màn hình giới thiệu của game.

Mỗi asset một dòng. Thêm ảnh vào `shared/assets/sprites/` thì thêm key vào `manifest.json` và ghi một dòng ở đây.

## Asset tự vẽ

| File | Key | Người vẽ | Concept AI (công cụ, prompt) | Ghi chú |
|---|---|---|---|---|
| `shared/assets/tiles.png` | `tiles` | Sinh bằng code (`tools/gen-tiles.py`) | Không | Tileset rừng |

## Asset tạo bằng AI (PixelLab)

Tạo bằng PixelLab qua MCP, rồi chuẩn hóa bằng `tools/assets` (normalize → pack → validate). Quy trình: `.claude/skills/asset-gen/SKILL.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `shared/assets/sprites/honsu/body_m.png` | `hs_body_m` | PixelLab MCP (create_image_pixflux, create_character v3, animate_character) | pixflux 32x32 south "chibi young male spirit master, short messy grey hair, light grey cloth tunic with darker grey sash belt, grey trousers, brown shoes, standing, full body, front view, 16-bit JRPG sprite" (low top-down, black outline, basic shading, low detail); tóc tô lại màu khóa lam rồi create_character v3 (ảnh tham chiếu, 4 hướng); walk = animate_character template walking-4-frames | 2026-10-19 | Bản thử. Tách lớp tự động theo màu khóa (normalize --split). idle khung 2 do pack --breathe 18; attack/cast/hurt/die/absorb chép tạm idle |
| `shared/assets/sprites/honsu/outfit_m_0.png` | `hs_outfit_m_0` | PixelLab MCP (create_image_pixflux, create_character v3, animate_character) | pixflux 32x32 south "chibi young male spirit master, short messy grey hair, light grey cloth tunic with darker grey sash belt, grey trousers, brown shoes, standing, full body, front view, 16-bit JRPG sprite" (low top-down, black outline, basic shading, low detail); tóc tô lại màu khóa lam rồi create_character v3 (ảnh tham chiếu, 4 hướng); walk = animate_character template walking-4-frames | 2026-10-19 | Bản thử. Tách lớp tự động theo màu khóa (normalize --split). idle khung 2 do pack --breathe 18; attack/cast/hurt/die/absorb chép tạm idle |
| `shared/assets/sprites/honsu/hair_m_0.png` | `hs_hair_m_0` | PixelLab MCP (create_image_pixflux, create_character v3, animate_character) | pixflux 32x32 south "chibi young male spirit master, short messy grey hair, light grey cloth tunic with darker grey sash belt, grey trousers, brown shoes, standing, full body, front view, 16-bit JRPG sprite" (low top-down, black outline, basic shading, low detail); tóc tô lại màu khóa lam rồi create_character v3 (ảnh tham chiếu, 4 hướng); walk = animate_character template walking-4-frames | 2026-10-19 | Bản thử. Tách lớp tự động theo màu khóa (normalize --split). idle khung 2 do pack --breathe 18; attack/cast/hurt/die/absorb chép tạm idle |
| `shared/assets/sprites/honsu/body_f.png` | `hs_body_f` | PixelLab MCP (create_image_pixflux, create_character v3, animate_character) | pixflux 32x32 south, init = ảnh nam (strength 60): "chibi young female spirit master, long straight bright blue hair falling to the waist with straight-cut bangs, simple light grey cloth tunic with darker grey sash belt, short grey skirt over dark grey leggings, brown shoes, standing, full body, front view, 16-bit JRPG sprite"; create_character v3 (ảnh tham chiếu, 4 hướng); walk = animate_character template walking-4-frames | 2026-10-19 | Bản thử. Tách lớp tự động theo màu khóa (normalize --split). idle khung 2 do pack --breathe 18; attack/cast/hurt/die/absorb chép tạm idle |
| `shared/assets/sprites/honsu/outfit_f_0.png` | `hs_outfit_f_0` | PixelLab MCP (create_image_pixflux, create_character v3, animate_character) | pixflux 32x32 south, init = ảnh nam (strength 60): "chibi young female spirit master, long straight bright blue hair falling to the waist with straight-cut bangs, simple light grey cloth tunic with darker grey sash belt, short grey skirt over dark grey leggings, brown shoes, standing, full body, front view, 16-bit JRPG sprite"; create_character v3 (ảnh tham chiếu, 4 hướng); walk = animate_character template walking-4-frames | 2026-10-19 | Bản thử. Tách lớp tự động theo màu khóa (normalize --split). idle khung 2 do pack --breathe 18; attack/cast/hurt/die/absorb chép tạm idle |
| `shared/assets/sprites/honsu/hair_f_0.png` | `hs_hair_f_0` | PixelLab MCP (create_image_pixflux, create_character v3, animate_character) | pixflux 32x32 south, init = ảnh nam (strength 60): "chibi young female spirit master, long straight bright blue hair falling to the waist with straight-cut bangs, simple light grey cloth tunic with darker grey sash belt, short grey skirt over dark grey leggings, brown shoes, standing, full body, front view, 16-bit JRPG sprite"; create_character v3 (ảnh tham chiếu, 4 hướng); walk = animate_character template walking-4-frames | 2026-10-19 | Bản thử. Tách lớp tự động theo màu khóa (normalize --split). idle khung 2 do pack --breathe 18; attack/cast/hurt/die/absorb chép tạm idle |
| `shared/assets/sprites/vohon/lam_ngan_thao_b.png` | `vh_lam_ngan_thao_b` | PixelLab MCP (create_image_pixflux) | pixflux 48x48, init = elip dẹt vẽ bằng code (strength 220): "flat ellipse of tangled glowing blue-silver grass vines with small leaves and curling tendrils lying on the ground, hollow center, tiny blue light motes, magical spirit grass, low top-down view, game sprite" | 2026-10-19 | Bản thử: thảm dây dưới chân, cùng một hình cho mọi hướng/khung; normalize --vohon lam_ngan_thao --halves 38 (cung trên sau thân, cung dưới trước thân). Chưa có dây quấn tay |
| `shared/assets/sprites/vohon/lam_ngan_thao_f.png` | `vh_lam_ngan_thao_f` | PixelLab MCP (create_image_pixflux) | pixflux 48x48, init = elip dẹt vẽ bằng code (strength 220): "flat ellipse of tangled glowing blue-silver grass vines with small leaves and curling tendrils lying on the ground, hollow center, tiny blue light motes, magical spirit grass, low top-down view, game sprite" | 2026-10-19 | Bản thử: thảm dây dưới chân, cùng một hình cho mọi hướng/khung; normalize --vohon lam_ngan_thao --halves 38 (cung trên sau thân, cung dưới trước thân). Chưa có dây quấn tay |

## Asset bên ngoài

| File | Tác giả | Link gốc | Giấy phép | Đã chỉnh sửa gì |
|---|---|---|---|---|
| (font) Be Vietnam Pro | Lâm Bảo, Tony Le, Việt Anh Nguyễn | https://fonts.google.com/specimen/Be+Vietnam+Pro | OFL | Không, tải qua Google Fonts |
