---
name: asset-gen
description: Tạo sprite bằng PixelLab MCP rồi đưa vào game theo quy cách GAME_DESIGN.md mục 5.11 (hồn sư 32×32, phụ thể 48×48, hồn thú theo bậc). Dùng khi được yêu cầu "tạo <asset>" (hồn sư, kiểu tóc, phụ thể võ hồn, hồn thú…), hoặc khi sửa tools/assets, shared/assets/sprites, manifest.json, art/CREDITS.md.
---

# Tạo asset bằng PixelLab

Dây chuyền: **soạn prompt → gọi PixelLab MCP → tải ảnh thô → `normalize` → `pack` → `validate --register` → xem thử → PR**.
Công cụ nằm ở `tools/assets/` (Node thuần, không cần cài gì):

| Lệnh | Việc |
|---|---|
| `normalize.mjs --kind honsu\|vohon\|beast<bậc> --out <dir> <ảnh…>` | Xóa nền, đặt chân vào gốc (hồn sư (16,30), phụ thể (24,38)), thu nearest-neighbor nếu quá khung, đưa màu về bảng, viền ngoài `#1a1020`. `--split` tách thân/tóc/áo theo màu khóa; `--vohon <id> --halves <y>` cho phụ thể. |
| `pack.mjs --kind honsu\|vohon\|beast<bậc> --out <sheet.png> <dir>` | Ghép khung tên `{down\|right\|up}_{anim}_{i}.png` (và `absorb_{i}.png`) vào bố cục 16×4. `--breathe 18` tạo idle khung 2 (đầu, vai nhích 1 pixel); `--fill` chép tạm idle vào ô còn thiếu. |
| `validate.mjs` | Kiểm mọi key trong manifest (chạy trong `npm run check`). `--register <key> --prompt "…" --tool "…" --note "…"` thêm key vào `manifest.json` và ghi dòng vào `art/CREDITS.md`. |
| `preview.mjs <ra.png> <lớp…> --scale 6 --grid 32x32 [--crop x,y,w,h]` | Phóng to, chồng lớp để xem bằng mắt. |

Ảnh thô PixelLab lưu ở `art/src/pixellab/<tên>/` (đúng tên khung như trên) để chạy lại normalize mà không phải gọi lại.

## Bảo mật và ngân sách
- Token PixelLab nằm trong cấu hình MCP ở phạm vi user. **Không** ghi token vào repo, file, log, PR hay tin nhắn; không tạo `.mcp.json` chứa token. Link tải ảnh (`api.pixellab.ai/mcp/images/…/download`, `backblaze…`) không cần token.
- Mỗi lần gọi tạo ảnh tốn lượt. Gọi `get_balance` trước; thử một lần nhỏ, xem kết quả rồi mới gọi tiếp. Ghi số lần gọi vào báo cáo/PR.
- Các tool chờ và tra cứu miễn phí: `wait_for_jobs`, `get_character`, `get_image`, `search_help`, `get_balance`.

## Tham số MCP đã thử (10/2026, gói trial)
| Việc | Tool và tham số | Chi phí | Ghi chú |
|---|---|---|---|
| Khung đầu (hướng xuống) | `create_image_pixflux` `width=32 height=32 no_background=true direction="south" view="low top-down" outline="single color black outline" shading="basic shading" detail="low detail"` | 1 | Ra đúng 32×32, chân ở y≈30, cao ~30 px, nền trong suốt. Chất lượng tốt nhất trong các cách đã thử. |
| Xoay 4 hướng | `create_character mode="v3" n_directions=4 reference_image_base64=<khung xuống>` | 1 | Giữ đúng nét và màu của ảnh tham chiếu, canvas giữ 32×32. Ảnh tham chiếu phải nhìn thẳng (south). Base64 của ảnh 32×32 chỉ ~1–2 KB nên gửi thẳng được. |
| Đi bộ | `animate_character template_animation_id="walking-4-frames" directions=["south"]` (rồi `east`, `north` với cùng `animation_group_id` + `animation_name`) | 1/hướng | 4 khung, đúng thứ tự chân trái, đứng, chân phải, đứng. Mỗi hướng một lần gọi (gói trial chỉ chạy 1 job một lúc). Mặt và màu da hơi trôi so với khung xoay. |
| Nhân vật thứ hai cùng phong cách | `create_image_pixflux` như trên + `init_image_base64=<khung xuống của nhân vật thứ nhất> init_image_strength=60` | 1 | Giữ tỉ lệ, nét viền, cách đổ bóng; đổi được giới tính, tóc, váy. |
| Phụ thể dưới đất (thảm, vòng) | `create_image_pixflux 48×48` + `init_image` là hình khối vẽ bằng code, `init_image_strength=220` | 1 | Không có init thì PixelLab vẽ vòng tròn đứng như bánh donut, không dẹt theo góc nhìn. 220 giữ gần như nguyên hình khối, ít chi tiết; thử 120–160 nếu muốn nhiều dây lá hơn. |
| Không dùng được | `create_character mode="standard"` | 0 | Bị từ chối ("high demand… limit free tier") ở gói trial; không trừ lượt. |

Không dùng `breathing-idle` cho idle: 5.11 chỉ cần 2 khung nhích 1 pixel, `pack --breathe` làm chính xác và miễn phí.
Chưa thử: attack/cast/hurt/die/absorb (template `lead-jab`, `fireball`, `taking-punch`, `falling-back-death`, `crouching` hoặc `mode="v3"` với `action_description`), hồn thú (`body_type="quadruped"`), `pixelart_workbench` (công cụ vẽ tay miễn phí để sửa pixel).

## Giữ phong cách đồng đều
- **Một khung gốc cho mỗi nhân vật**: luôn tạo khung hướng xuống trước, duyệt bằng mắt, rồi mới xoay (v3) và làm animation từ nhân vật đó.
- Nhân vật mới dùng khung gốc của nhân vật đã duyệt làm `init_image` (strength ~60).
- Cùng bộ tham số `view`/`outline`/`shading`/`detail` như bảng trên; prompt mở đầu bằng "chibi …", kết thúc bằng "16-bit JRPG sprite". Tiền tố phong cách đầy đủ và prompt từng kiểu tóc/phụ thể: prompt pack của bước thiết kế mỹ thuật (mục 0–3) và bảng phụ thể ở 5.11.
- Không ghi tên họa sĩ còn sống hay tên game thương mại vào prompt.

## Màu khóa để tách lớp tóc/áo (hồn sư)
PixelLab vẽ cả người trong một ảnh. Để tách được lớp theo 5.11, prompt theo **màu khóa**:
- **Tóc màu lam sáng** ("bright blue hair"), **áo/quần/váy màu xám** ("light grey tunic … grey trousers"), giày nâu, da bình thường.
- Nếu ảnh đầu ra tóc xám, tô lại tóc sang lam bằng code trước khi xoay (đã làm với hồn sư nam).
- `normalize --split`: lam → lớp tóc, xám → lớp áo, còn lại → thân; nét viền về lớp có nhiều điểm kề nhất. Tóc và áo đưa về dải 4 xám theo khoảng sáng của từng lớp, nên client hoán màu được (`recolor`).
- Các bẫy đã gặp và đã xử lý trong `normalize`: da rất nhạt (hồng phấn) có độ bão hòa thấp; ánh sáng trên tóc gần trắng; bóng xanh tím trên quần trong khung walk; bóng da ám đỏ dưới tóc; mắt đỏ. Gặp kiểu lỗi mới thì xem màu nguồn (đếm màu trong ảnh) rồi chỉnh `layerOf`/`mapColor`.
- **Giới hạn**: lớp thân tách ra có "lỗ" ở chỗ tóc che (trán, gáy). Kiểu tóc khác ngắn hơn sẽ lộ lỗ, nên mỗi kiểu tóc hiện cần vẽ cả người cho riêng kiểu đó (xem đề xuất trong PR bản thử đầu tiên).

## Quy trình "tạo <asset>"
1. Đọc 5.11 (khung, gốc, bố cục, màu cho phép, bảng phụ thể) và xác định key: `hs_body_{m/f}`, `hs_outfit_{m/f}_0`, `hs_hair_{m/f}_{0–3}`, `vh_{id}_b`/`_f`, `b{bậc}` hoặc `beast_{loài}`.
2. Soạn prompt theo bảng tham số và mục "Giữ phong cách". Gọi 1 lần, `wait_for_jobs`, xem ảnh (`get_image`/`get_character` có ảnh xem trước). Ổn mới gọi tiếp.
3. Tải ảnh thô bằng `curl -sfL -o art/src/pixellab/<tên>/<hướng>_<anim>_<i>.png "<url>"` (hướng: south → `down`, east → `right`, north → `up`; khung xoay là `*_idle_0`).
4. Chuẩn hóa và ghép, ví dụ hồn sư:
   ```bash
   node tools/assets/normalize.mjs --kind honsu --split --out <tmp>/m art/src/pixellab/hs_m_0/*.png
   node tools/assets/pack.mjs --kind honsu --breathe 18 --fill --out shared/assets/sprites/honsu/body_m.png <tmp>/m/body
   node tools/assets/pack.mjs --kind honsu --breathe 18 --fill --out shared/assets/sprites/honsu/outfit_m_0.png <tmp>/m/outfit
   node tools/assets/pack.mjs --kind honsu --breathe 18 --fill --out shared/assets/sprites/honsu/hair_m_0.png <tmp>/m/hair
   ```
   Phụ thể nằm dưới đất: `normalize --kind vohon --vohon <id> --halves 38 --anchor 24,45` rồi `pack --kind vohon --fill` cho `<tmp>/b` và `<tmp>/f`.
   Thư mục tạm để ngoài repo.
5. `preview.mjs` để xem sheet (soát lệch chân giữa các khung, màu lạ, điểm vụn). Sửa rồi chạy lại từ bước 4.
6. `validate.mjs --register <key> --prompt "<prompt đã dùng>" --tool "PixelLab MCP (<tool>)" --note "<ghi chú>"` cho từng key; sau đó `npm run check`.
7. Xem trong game: bật server và client, `ao preview http://localhost:<cổng vite>`, dùng `ao browser` để đăng nhập, đi 4 hướng và `ao browser screenshot`. Nếu Browser panel đang ẩn (WebGL báo "Framebuffer status: Incomplete Attachment", screenshot báo `SCREENSHOT_UNAVAILABLE`), dùng Chrome headless qua CDP (`--headless=new --enable-unsafe-swiftshader`) để chụp. Đưa ảnh chụp vào PR.
8. Chạy `npm run build --prefix client` và `npm run bot --prefix client` khi server đang bật. Mở PR, ghi số lần gọi PixelLab.

## Client
- `client/src/sprites.ts` (`preloadSprites`) tải mọi key trong manifest. `client/src/textures.ts` chỉ vẽ bằng code (`honsuArt.ts`) những key **chưa có** ảnh thật, nên thêm key vào manifest là đủ để game dùng ảnh thật; không cần sửa code client.
- Ghép lớp, hoán màu tóc/áo (`HAIR_COLORS`/`OUTFIT_COLORS` trong `shared/data.ts`, key `hs_hair_f_2@3`) và ánh xạ khung phụ thể do GameScene làm theo 5.11. Ảnh thật trộn được với lớp vẽ bằng code (ví dụ thân thật + kiểu tóc 1–3 vẽ bằng code), nhưng nét sẽ khác nhau.
- Không sửa luật chơi khi thêm asset. Số liệu màu tóc/áo chỉ nằm ở `shared/data.ts`.
