# Quỷ Hổ — RAW H4 #769

Part of #769, Part of #766. Cặp cuối A1 từ fresh session103 và B1 từ fresh session105. Mỗi tờ một builtin imagegen call, không retry/A2/B2/redraw/fallback. Phần này 2 RAW của một loài, PR riêng từ main mới. Không thêm vào các head đang review. Submitted không phải accepted/merged/imported; không tự đóng issue hoặc nhập game.

## Nguồn và thông số thật

Sinh ngày 2026-10-26 bằng builtin imagegen. Tool không công bố model ảnh hoặc seed, nên ghi unknown; không suy từ tên agent. Cỡ chỉ yêu cầu qua prompt, không có size selector.

A yêu cầu và IHDR thực tế 1024×1536 RGB, 2.084.776 byte, SHA256 `24139325686d96136af0a51951257a7d6208275755f6f954cd936027f75a980b`. B yêu cầu 1024×1024 nhưng IHDR thực tế **1254×1254 RGB**, 2.017.355 byte, SHA256 `d259e5ed69aa9902be91d2e2c3317b150230c0117e601e268f15f4c6aef71821`.

Original tool output, artifact103/105 và RAW repo đã so khớp nguyên byte/hash. Original giữ nguyên tại chỗ. Không resize/crop/patch/hậu kỳ/tách nền/cutter/layout/assembly/runtime hoặc sửa metadata ảnh. `toA.prompt.txt` và `toB.prompt.txt` là exact prompt gửi tool, giữ full base nguyên byte rồi mới nối clarification/match/same body. Hai script MD là output generator nguyên bản; hash riêng gắn đúng đường dẫn trong source. Không đổi generator/template/anatomy.

`toA.source.json` giữ toàn bộ tool-provenance và evidence của worker103, có path/hash từng file upstream, cùng phần integration kiểm chứng. A báo started 01:19:59 UTC và returned 01:20:30 UTC. Worker105 không cung cấp JSON riêng; owner93 biên soạn `toB.source.json` từ HANDOFF105, ghi rõ nguồn/hash và tách counters/thời gian do worker báo khỏi hash/IHDR/bytes/prompt/base/refs kiểm chứng độc lập. B báo started 01:23:26.003Z và returned 01:24:04.398Z. Không bịa provider/model/time.

A chỉ đính original static Quỷ Hổ identity, SHA256 `c925748560ea0d1bd1e797bd9003b1f5c8f653f92101b21873de1f4318394f28`. B ordered static durable103 trước, A103 style/body size/line weight sau. A selected chỉ là known FAIL/style-only; không lấy hurt turn, attack/death yaw, hướng nông hoặc nền sai làm mẫu đã duyệt. Worker VIEW/hash trước call theo nguồn; owner93 đã VIEW RAW/static và kiểm ordered refs khi nhận.

## Lỗi mỗi tờ

LỖI: toA — nền không phẳng FF00FF / heading, hurt và style — H1 C5–6,H3 C3–4,H4 S; H5–8 SE; toàn tờ — S hurt/attack/death yaw phải, recoil yếu, SE có nguy cơ gần E; nét/body dày hơn static, margin/baseline chưa chứng nhận.

LỖI: toB — sai kích thước / nền không phẳng FF00FF / death heading — toàn tờ; H4 C3–4 NE; H8 C3–4 N — RAW1254×1254 thay1024×1024; chết quay ngang/lộ mặt, không giữ trục; giữ FAIL, không retry.

Quan sát toàn ảnh cho thấy lưới A khoảng6×12 và B khoảng6×8. Số hình theo quan sát worker và số ô có pixel không chứng nhận đủ frame hợp lệ, mỗi ô đúng một con hoặc pose đạt. A có66ô ngoài ngưỡng gần-magenta và6ô trống theo evidence; không gọi là semantic66 sinh vật hợp lệ. Worker105 quan sát44hình và4ô không có sinh vật ở H4/H8 C5–6; số pixel khác FF00FF ở các ô này chỉ đo nền, không chứng minh có thêm hình. Bốn góc B được báo là (238,12,238),(244,16,240),(235,34,234),(240,29,238), màu phổ biến (250,3,248). Chưa chứng nhận margin8%, baseline12%, cỡ thân chính xác, hướng từng frame, recoil, loop hoặc art/runtime đạt.

Mâu thuẫn giữ nguyên: ô171×6=1026 khác canvas1024, phần nối yêu cầu chia đều canvas; static pixel nét nhỏ khác base hand-painted/viền dày; hurt eyes-shut trong khi N không được lộ mặt/mắt; collapse sideways có thể đổi yaw. Giữ cả input gốc và clarification, ghi sai khác thật, không thiết kế lại hoặc suy owner đã chốt anatomy/pose.

Nguồn/giấy phép theo Q44 và `docs/art/nguon-giay-phep.md`. Output ChatGPT/Codex không tự gán CC0/CC. Static là ảnh dự án có nguồn trong CREDITS. RAW FAIL nộp để owner xem sau; không sửa static/shared/manifest/client/server/cân bằng, không tự merge/import hoặc đóng #769/#766.
