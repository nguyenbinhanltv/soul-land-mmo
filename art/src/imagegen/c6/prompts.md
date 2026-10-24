# C6 — prompt và hậu kỳ

Nguồn chung: Codex built-in `imagegen` (model do công cụ quản lý), sau đó chạy `node tools/assets/c6-post.mjs`.

- `logo-raw.png`: pixel-art emblem “Rừng Săn Hồn”, cây rừng ngọc đậm, vòng hồn màu hổ phách, triện son, nền trong suốt; không watermark.
- `login-raw.png`: cảnh rừng cổ lúc chạng vạng, đường đá dẫn tới miếu săn hồn, khoảng trống bên phải cho thẻ đăng nhập; 16:9.
- `loading-raw.png`: bản đồ pixel ngang của rừng, núi, sông, đường và điểm vòng hồn; khoảng trống giữa cho thanh tải; 16:9.
- `event-raw.png`: miếu rừng dưới trăng, vòng hồn vàng, lá ngọc và dải đỏ; khoảng trống bên trái cho chữ sự kiện; 3:1.

Hậu kỳ: giảm mẫu nearest-neighbor về lưới pixel nhỏ, lượng tử kênh màu theo bước 16, giữ alpha logo, xuất PNG 8-bit RGBA.
