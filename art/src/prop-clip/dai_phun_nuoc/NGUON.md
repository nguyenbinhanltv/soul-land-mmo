# Đài phun nước — thí điểm hoạt ảnh

Part of #1498; chỉ tia nước trên đỉnh, giữ trụ và bể. Chờ chủ repo duyệt clip trong PR nháp.

Nguồn: Codex builtin OpenAI `image_gen.imagegen`, ngày 31/10/2026. Đầu vào duy nhất: `shared/assets/sprites/iso/props/dai_phun_nuoc.png` đã có trong game; nguồn thân gốc giữ nguyên trong `art/CREDITS.md`. Phần mới theo điều khoản đầu ra OpenAI, **không phải CC0**. Công cụ không trả model ID hoặc seed. SHA256 RAW nguyên byte, ảnh gốc và clip: `nguon.json`. RAW giữ ở thư mục generated_images của Codex, không nhập ảnh thô vào game.

Prompt thực tế:

> Pixel art animation sprite sheet of ONLY small fountain water jets matching the reference fountain. No stone, basin, pillar, building or ground. Eight sequential frames in perfectly regular 4 columns 2 rows grid, identical cell size. Transparent background. One central short vertical water spout with two small arcs cascading outward left and right, and small falling droplets. Isometric 2:1 view. Muted pale blue cyan water, ivory highlights, crisp tiny pixel clusters. Fixed nozzle point at the bottom center of every frame, identical jet envelope and consistent geometry throughout, droplets travel downward in smooth looping cycle from frame 8 to frame 1. Compact fountain jets, no large splash, no glow, no text, no grid lines, generous transparent margins.

Nhập bằng `node tools/assets/prop-clip.mjs dai_phun_nuoc <RAW.png>`, rồi `node tools/assets/normal.mjs shared/assets/sprites/iso/props/dai_phun_nuoc_clip.png --frame 80x64`. `than-tinh.png` giữ thân; `chuyen-dong.png` là lớp nước riêng. 8 hình Codex thêm khung pha màu thành 16 khung × 100 ms; căn vòi chung, lượng tử màu về bảng được phép và alpha nhị phân. Clip ghép thân chỉ thay vùng `[34,0,13,12]`; ảnh gốc và điểm chân `[40,62]` không sửa.
