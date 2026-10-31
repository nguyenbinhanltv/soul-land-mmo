# Lửa trại — thí điểm hoạt ảnh

Part of #1498; chỉ ngọn lửa, không lò rèn. Chờ chủ repo duyệt clip trong PR nháp.

Nguồn: Codex builtin OpenAI `image_gen.imagegen`, ngày 31/10/2026. Đầu vào duy nhất: `shared/assets/sprites/iso/props/lua_trai.png` đã có trong game; nguồn thân gốc giữ nguyên trong `art/CREDITS.md`. Phần mới theo điều khoản đầu ra OpenAI, **không phải CC0**. Công cụ không trả model ID hoặc seed. SHA256 RAW nguyên byte, ảnh gốc và clip: `nguon.json`. RAW giữ ở thư mục generated_images của Codex, không nhập ảnh thô vào game.

Prompt thực tế:

> Create a pixel art sprite sheet of ONLY the small orange campfire flame from the reference, no logs, stones, ground, shadow or building. 8 sequential looping flame animation frames in a perfectly regular 4 column by 2 row grid, identical cell size and fixed flame root at the bottom center of every cell. Transparent background. Match reference orange red yellow palette, crisp small pixel clusters, dark purple outline. Each frame flame silhouette changes subtly, natural flickering and curling upward, smooth seamless cycle from last back to first. Do not move the root, no scale change or camera motion. No text or grid lines. Every frame isolated with generous transparent margins.

Nhập bằng `node tools/assets/prop-clip.mjs lua_trai <RAW.png>`, rồi `node tools/assets/normal.mjs shared/assets/sprites/iso/props/lua_trai_clip.png --frame 80x48`. `than-tinh.png` giữ thân; `chuyen-dong.png` là lớp lửa riêng. 8 hình Codex thêm khung pha màu thành 16 khung × 100 ms; căn chân chung, lượng tử màu về bảng được phép và alpha nhị phân. Clip ghép thân chỉ thay vùng `[31,2,18,23]`; ảnh gốc và điểm chân `[40,46]` không sửa.
