# Lô thử Vạn Giới Tiên Đồ → Đấu La Tu Tiên: nguồn gốc

**Nguồn:** ảnh trong `assets-src/gemini/*` của dự án cũ Vạn Giới Tiên Đồ (`D:/METAGRIT/van-gioi-tien-do`, commit `b9d2182b05cd`; chỉ đọc, không sửa) do **chủ dự án tự tạo bằng Google Gemini ngày 2026-11-09 / 10** (đúng theo `docs/ASSET-LICENSES.md` của dự án cũ; chủ dự án không lưu prompt gốc). Điều khoản Google Gemini áp dụng cho tài khoản của chủ dự án, như các ảnh Gemini cũ của game này. Chưa có kiểm tra pháp lý riêng cho phát hành thương mại. Không dùng thư viện ảnh hay tài nguyên bên thứ ba.

**Xử lý (tái lập: `VGTD=<assets-src/gemini> sh art/src/vgtd-pilot/chay-lai.sh`):** `tools/assets/gemini-import.mjs` (`--kind item --icon` 32×32, `--kind portrait --size 24`, `--kind object` thu về pixel thật, bảng màu game, viền `#1a1020`, chân ở gốc, ISO_PROP_FOOT), `normal.mjs` sinh `_n`. Hai bước riêng vì lỗi của ảnh gốc: `dummy_clean.py` (gỡ bóng ma Tàng Kinh Các lọt vào ảnh mộc nhân, giữ cụm liên thông lớn nhất) và `fx_loi_kiep.py` (khóa nền đen theo độ sáng, xoá dấu ✦, thang tím/bạc của `art/palette.gpl`, 4 khung dựng bằng ngưỡng sáng). Tờ so sánh: `so-sanh.py`.

**Trạng thái:** lô thử, **chưa nhập** vào `shared/assets`, manifest, code hay bản đồ; chưa được chủ repo duyệt. Tên đã đặt theo quy ước game (`item_*`, `gi_*`, `prop_*`, `fx_*`); tên gốc chỉ ở bảng dưới. Ánh xạ huy hiệu → cảnh giới thật làm khi có thiết kế epic.

| Tệp nguồn (nguyên byte) | SHA-256 | Thành phẩm |
|---|---|---|
| `assets-src/gemini/items2/alchemy.png` | `0a9a0f00a8ed7868085ea11d2f591f9ca9e5aafe9fa934e282ec945364dee0f4` | 9 icon: item_linh_lenh_cong_hien, item_linh_sam, item_hoa_lien, item_linh_thao, item_loi_qua, item_dan_lam, item_dan_luc, item_dan_hoang, item_dan_bach |
| `assets-src/gemini/items2/manuals.png` | `026797e55418077b5637b2fa2db41268b63d0a0e1276f46def3353e6d03729ce` | 9 icon: item_bi_tich_t{1,2,3}_{sach,cuon,bia} |
| `assets-src/gemini/items/heal_pill.png` | `71d9d7061d52b20d6f4ba4f7a0ee717cb9ec909d4664d438bfa9394346c5ec8c` | item_dan_hoi_phuc |
| `assets-src/gemini/items/breakthrough_pill.png` | `c371c36a350d7d335e0f9a96dc01f8e4d562135a4fac9ab2b3db503f721b84ac` | item_dan_pha_canh |
| `assets-src/gemini/items/stone_low.png` | `e3df7cccb9b59d06868b18c7711194b19294ad9a2ff9dae568055ca2f4b762e7` | item_linh_thach_ha |
| `assets-src/gemini/realms/realm_badges.png` | `120cbec1ebe0228ac2ba2b6ef701c325d64c34fc6448569552c3e194c18160e9` | gi_canh_gioi_1…9 (+ _1x 24 px), đánh số theo ô trái→phải, trên→dưới |
| `assets-src/gemini/sect/sect_alchemy_furnace.png` | `195247e23ef356ea27e61be6e0de69bf4495c0ab0550cba723c9aae14f6160f8` | prop_dan_lo |
| `assets-src/gemini/sect/sect_scripture_pavilion.png` | `fadebc75737c32186341c39e4ff47263a60eea276c5a5db99f80642b791e997b` | prop_tang_kinh_cac |
| `assets-src/gemini/sect/sect_training_dummy.png` | `25f496ace4b4de114e47ac3e5bec455c3a4a311c685b5589b299610098a9bcb0` | prop_moc_nhan |
| `assets-src/gemini/tribulation/r1_strike.png` | `71dfad9c586dd4190cfec4454dbbf5e830b46e960d5a9064e7539114308dd1b6` | fx_loi_kiep_tia |
