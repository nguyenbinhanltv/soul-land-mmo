# Tinh thể tím nhịp sáng — ứng viên #1598

**Chưa duyệt mỹ thuật; chỉ trong PR nháp, không tự gộp.** Cùng hợp đồng clip của sen #1551: 16 khung × 100 ms (1,6 giây), khung 48×48, chân `[24,46]`. Chỉ mặt tím bên trong sáng lên một bậc palette; không dịch hình, đổi alpha, viền, chân, collision hay thêm Light2D. Normal gốc lặp nguyên pixel qua 16 pha.

Ảnh sinh bởi Codex builtin OpenAI `image_gen.imagegen`, ngày 03/11/2026. Dùng duy nhất `shared/assets/sprites/iso/props/tinh_the_tim.png` của repo làm ảnh tham chiếu. Điều khoản đầu ra OpenAI; **không CC0**. Công cụ không trả model ID/seed. Ảnh gốc Gemini (`noidia-A.png`, ô 4, 21/10/2026), nguồn và prompt cũ giữ nguyên trong `art/CREDITS.md`.

Prompt gửi công cụ là toàn bộ nội dung `prompt.txt` cạnh file này, UTF-8. RAW nguyên byte native 1774×887, tờ 4×2, tên `tinh-the-RAW.png`, nằm ngoài repo tại artifacts phiên `soul_land_game-1022`. SHA256 RAW/gốc/clip/normal, native size và mặt nạ ở `nguon.json`. Không coi ảnh gốc Gemini là RAW mới của Codex.

`tinh-the-preview.mjs` lấy ô thứ 5 sáng nhất của RAW, chuẩn hóa hộp alpha để dẫn ngưỡng sáng theo vị trí. Nhịp `(1 − cos(2πn/16))/2`; chỉ pixel tím bên trong, y < 39, có đủ bốn hàng xóm đục được đổi lên một bậc trong chính palette gốc. `mat-na.png` ghi vùng cho phép. Khung 0 nguyên bản, nối 15→0 nhỏ như bước nội vòng. Không lấy silhouette sinh lại, không thêm hạt hay quầng.

Tái tạo ngoài repo:

```sh
node tools/assets/tinh-the-preview.mjs <artifacts>/tinh-the-RAW.png <thư-mục-tạm>
node tools/assets/tinh-the-import.mjs <artifacts>/tinh-the-RAW.png
node tools/assets/validate.mjs --register prop_tinh_the_tim_clip --keep-order --frame 48x48 --iso --map tinh_dau_noi_dia --tool "ChatGPT / Codex builtin OpenAI image_gen.imagegen" --prompt "Nhịp sáng mặt tím; prompt thật art/src/prop-clip/tinh_the_tim/prompt.txt" --note "Ứng viên #1598 chưa duyệt; OpenAI output, không CC0"
node tools/assets/credits.mjs
```

Lệnh nhập so toàn bộ metadata/hash với hồ sơ đã bàn giao trước khi ghi. Preview A/B trong game và ảnh/clip ở artifacts cùng phiên. Giảm chuyển động / mức Thấp dừng khung 0 qua runtime có sẵn; không sửa runtime client.
