---
name: asset-gen
description: Đưa sprite vào game theo quy cách GAME_DESIGN.md mục 5.11 (hồn sư 32×32 ghép lớp theo bộ giới × kiểu tóc, phụ thể 48×48, hồn thú theo bậc) qua dây chuyền tools/assets. Dùng khi được yêu cầu "tạo <asset>" (hồn sư, kiểu tóc, phụ thể võ hồn, hồn thú…), hoặc khi sửa tools/assets, shared/assets/sprites, manifest.json, art/CREDITS.md.
---

# Đưa asset vào game

## Nguồn ảnh hiện nay
- **Gói trial PixelLab đã dùng hết** (không nâng gói). Đừng gọi PixelLab MCP: nhiệm vụ code, tài liệu hay dây chuyền thì không tạo ảnh.
- **Mỹ thuật còn lại** (animation đang chép tạm, phụ thể các võ hồn khác, hồn thú, thẻ võ hồn: Lộ trình M2–M5) **chờ một dịch vụ self-host, chưa chọn công cụ**. Khi đã chọn, ảnh từ dịch vụ đó vẫn đi qua đúng dây chuyền dưới đây.
- Trong lúc chờ: key chưa có ảnh vẽ bằng code (`client/src/honsuArt.ts`, `textures.ts`); sửa pixel bằng tay (Aseprite, `pixelart_workbench`) khi cần.
- Công cụ AI chỉ dùng khi điều khoản cho phép dùng kết quả. Token / khóa dịch vụ nằm ở cấu hình user, **không** ghi vào repo, log, PR hay tin nhắn.

## Quy cách bắt buộc (chi tiết ở mục 5.11)
- Hồn sư khung 32×32, gốc (16, 30); phụ thể 48×48, gốc (24, 38); 3 hướng xuống / phải / lên (trái = lật ngang); bố cục sheet 16 cột × 4 hàng cố định.
- **Ghép lớp theo bộ giới × kiểu tóc (phương án (b)):** mỗi bộ vẽ liền thân + áo + tóc rồi tách tự động thành 3 lớp; key `hs_{body,outfit,hair}_{m,f}_{0–3}`; một bộ đủ 3 lớp trong manifest hoặc không có lớp nào; không dùng lớp thân của bộ này cho kiểu tóc khác. Phụ thể võ hồn là lớp riêng `vh_{id}_b` / `vh_{id}_f`.
- **Viền ngoài `#1a1020`** (không đen tuyền), giữ nguyên khi hoán màu: lớp tóc / áo chỉ gồm dải 4 xám chuẩn + `#1a1020`.
- Màu chỉ lấy từ `art/palette.gpl`, cộng `col` / `robe` của võ hồn (`VOHON`) và 1 sắc tối, 1 sắc sáng suy ra.
- Không dùng hay tham chiếu ảnh từ game thương mại, phim, truyện tranh chính thức; không ghi tên họa sĩ còn sống hay tên game thương mại vào prompt.

## Dây chuyền `tools/assets/` (Node thuần)
**ảnh thô → `normalize` → `pack` → `validate --register` → xem thử → PR**

| Lệnh | Việc |
|---|---|
| `normalize.mjs --kind honsu\|vohon\|beast<bậc> --out <dir> <ảnh…>` | Xóa nền, đặt chân vào gốc, thu nearest-neighbor nếu quá khung, đưa màu về bảng, viền ngoài `#1a1020`. `--split` tách thân / tóc / áo theo màu khóa; `--vohon <id> --halves <y>` (kèm `--anchor x,y` nếu cần) tách phụ thể. |
| `pack.mjs --kind honsu\|vohon\|beast<bậc> --out <sheet.png> <dir>` | Ghép khung tên `{down\|right\|up}_{anim}_{i}.png` (và `absorb_{i}.png`) vào bố cục cố định. `--breathe 18` tạo idle khung 2; `--fill` chép tạm idle vào ô còn thiếu. Hồn sư: `--set <giới>_<kiểu tóc>` ghi cả 3 lớp vào `shared/assets/sprites/honsu/{body,outfit,hair}_<giới>_<kiểu tóc>.png`. |
| `validate.mjs` | Kiểm mọi key trong manifest (chạy trong `npm run check`, pre-commit khi đổi sprite / asset). `--register <key> --prompt "…" --tool "…" --note "…"` thêm key vào `manifest.json` và một dòng vào `art/CREDITS.md`. |
| `preview.mjs <ra.png> <lớp…> --scale 6 --grid 32x32 [--crop x,y,w,h]` | Phóng to, chồng lớp để xem bằng mắt. |

Ảnh thô lưu ở `art/src/pixellab/<bộ>/` (đúng tên khung như trên) để chạy lại normalize. Thư mục tạm để ngoài repo.

**Màu khóa khi tách lớp hồn sư:** tóc vẽ lam sáng, áo / quần / váy xám, giày nâu, da bình thường. `normalize --split`: lam → tóc, xám → áo, còn lại → thân; tóc và áo đưa về dải 4 xám theo độ sáng của từng lớp. Ảnh ra tóc xám, mắt lam, áo ánh tím hay đai màu thì tô lại trước khi tách (đã gặp với ảnh PixelLab). Gặp lỗi màu mới thì đếm màu nguồn rồi chỉnh `layerOf` / `mapColor` trong `normalize.mjs`.

Ví dụ hồn sư:
```bash
node tools/assets/normalize.mjs --kind honsu --split --out <tmp>/m_0 art/src/pixellab/hs_m_0/*.png
node tools/assets/pack.mjs --kind honsu --set m_0 --breathe 18 --fill <tmp>/m_0
node tools/assets/validate.mjs --register hs_body_m_0 --prompt "…" --tool "…" --note "…"   # cả 3 key của bộ
```

## Quy trình "tạo <asset>"
1. Đọc mục 5.11 (khung, gốc, bố cục, màu, bảng phụ thể) và xác định key: `hs_{body,outfit,hair}_{m/f}_{0–3}`, `vh_{id}_b` / `_f`, `beast_{loài}`.
2. Có ảnh nguồn (dịch vụ đã chọn hoặc vẽ tay): tạo khung hướng xuống trước, duyệt bằng mắt, rồi mới xoay hướng / làm animation; nhân vật mới lấy khung gốc của nhân vật đã duyệt làm ảnh khởi đầu để giữ phong cách. Chưa có nguồn thì báo lại, không tự chọn dịch vụ trả phí.
3. normalize → pack → `preview.mjs` soát lệch chân, màu lạ, điểm vụn → `validate.mjs --register` → `npm run check`.
4. Xem trong game ở phóng 2× và 4× (bật server và client; dùng `ao preview` / `ao browser`, hoặc Chrome headless qua CDP nếu panel trình duyệt bị ẩn). Đủ hướng, ghép thử ít nhất 2 màu tóc và 2 màu áo, đặt cạnh nền rừng sâu.
5. `npm run build --prefix client`, bot khi server bật; mở PR kèm ảnh chụp và nguồn ảnh. Cập nhật mục 7 (M2–M5) phần "Đã có / Còn".

## Client
- `client/src/sprites.ts` (`preloadSprites`) tải mọi key trong manifest; `textures.ts` chỉ vẽ bằng code những key **chưa có** ảnh, nên thêm key vào manifest là đủ, không cần sửa code client.
- Key hồn sư lấy bằng `honsuKey(lớp, giới, kiểu tóc)`; hoán màu bằng `recolor` (key `hs_hair_f_2@3`, thân tông da khác `hs_body_f_2@2`); ánh xạ khung phụ thể `vohonFrame`. Không trộn lớp ảnh thật với lớp vẽ code trong một bộ.
- Không sửa luật chơi khi thêm asset. Màu tóc / áo / da chỉ nằm ở `shared/data.ts`.
