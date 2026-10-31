# Lửa miệng lò rèn

Part of #1498. Nhân rộng kỹ thuật #1501 sau khi chủ repo duyệt hai clip thí điểm; mẫu lò rèn bàn giao trong PR nháp riêng.

Nguồn: Codex builtin OpenAI `image_gen.imagegen`, ngày nguồn 01/11/2026. Chỉ tham chiếu `shared/assets/sprites/iso/props/lo_ren_lang.png` đã có trong game (Gemini cũ đã duyệt, giữ nguyên ghi công). Phần lửa mới theo điều khoản đầu ra OpenAI, **không gán CC0**; không dùng AI hoạt ảnh khác hoặc nguồn bên thứ ba mới. Công cụ không trả model ID/seed. SHA256 RAW nguyên byte, ảnh gốc và clip tại `nguon.json`; RAW giữ trong generated_images của Codex, không nhập ảnh thô vào game.

Prompt thực tế:

> Create ONLY a compact forge fire animation layer matching the small orange fire inside the mouth of the reference blacksmith furnace. No building, bricks, roof, anvil, metal, wood, smoke or ground. Pixel art sheet, 8 consecutive frames in regular 4 columns by 2 rows, equal cells and fixed bottom-center root. Short wide orange-red flames and golden embers of burning coal, low and compact with two small tongues curling gently, not a tall campfire. Keep nearly constant flame envelope, small smooth motion; seamless last to first frame. Muted orange, gold, deep red, dark purple outline matching reference; crisp pixel clusters, transparent background, generous margins. No glow outside fire, text, grid lines or watermark.

Nhập: `node tools/assets/prop-clip.mjs lo_ren_lang <RAW.png> 2026-11-01`, rồi `node tools/assets/normal.mjs shared/assets/sprites/iso/props/lo_ren_lang_clip.png --frame 112x96`. `than-tinh.png` là thân; `chuyen-dong.png` là lớp lửa riêng. Chỉ vùng `[66,52,13,13]` chuyển động; pixel không thuộc lửa ấm trong vùng đó vẫn khóa theo ảnh gốc để giữ gạch/khung lò. Phần lửa rút xuống nền than tối đục, không đục thủng công trình. 8 hình Codex thêm khung pha màu thành 16 khung × 100 ms; alpha nhị phân, màu trong bảng cho phép, chân `[56,91]` giữ nguyên. Dải 1792×96 vừa trang atlas hiện có; không thêm Sprite hoặc timer theo thực thể.
