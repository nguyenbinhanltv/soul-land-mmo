# Phong Lang con — RAW H4 #769

Part of #769, Part of #766. Cặp A1 fresh98 + B1 fresh99; mỗi tờ một builtin imagegen call, không retry/B2/fallback. Phần này 2RAW/1loài, riêng các PR Lôi Văn Hầu832 và Nhu Cốt Thỏ hoang838. Submitted không phải accepted/merged/imported; whole issue vẫn Đang làm.

## Kỹ thuật và nguồn thật

Sinh ngày2026-10-26 bằng builtin `image_gen.imagegen`/`image_gen__imagegen`. Model ảnh/seed unknown do tool không công bố; không suy từ tên agent. A yêu cầu và IHDR1024×1536 RGB, 1.774.526byte, SHA256 `bd641523725ab8b021d004da78f03959e3020e28ef81f1d97745e93d655e2faa`. B yêu cầu1024×1024 nhưng IHDR **1254×1254 RGB**, 1.731.731byte, SHA256 `d397b67cd226075d9deee320ae99c6878d32c926436b32e8127f859e964fffd5`. Kích thước chỉ yêu cầu trong prompt.

Original tool output, artifact98/99 và RAW repo đã so khớp byte/hash; không crop/resize/patch/hậu kỳ/cutter/layout/assembly/runtime hoặc sửa metadata ảnh. Original paths/IHDR/bytes/counters/times/refroles/hash trong `toA.source.json`, `toB.source.json`. A giữ metadata JSON upstream98, bổ sung riêng integration. B99 không cung cấp JSON riêng: owner93 biên soạn source JSON từ HANDOFF99, ghi rõ nguồn/SHA và tách các số liệu kiểm chứng độc lập (RAW/hash/IHDR/bytes/exact prompt/base/refs) khỏi counters/thời gian do worker khai báo. Không bịa model/provider/time.

Exact prompts `toA.prompt.txt` và `toB.prompt.txt`: A nguyên full script không thêm hậu tố; B giữ full base byte-identical rồi nối match/same body và clarification. Hai file `.md` cùng thư mục là script prompts nguyên bản, hash file được ghi riêng với đúng đường dẫn. Không sửa generator/template/anatomy.

A chỉ tham chiếu original static identity. B ordered refs static durable98 trước (SHA256 `880962e646524962dad5bc05312f49c7593e6bf44a9901fb5b577a117097a2a9`), rồi A98 style/body-size sau (hash ở trên), không lấy hurt/death/nền sai của A làm chuẩn được duyệt. Worker đã VIEW/hash refs trước call; owner93 đã VIEW RAW A/B và kiểm hash/ref khi nhận.

## Lỗi mỗi tờ

LỖI: toA — nền không phẳng FF00FF / heading và hurt / groundline — H1 C5–6; H3–4 S; H5–8 SE; chân toàn tờ — hurt xoay phải, attack/death S lệch hướng, SE gần E, chân lệch groundline12%; giữ RAW A1.

LỖI: toB — sai kích thước / nền không phẳng FF00FF / heading và hurt — H1–4 NE; H7–8 N — RAW1254×1254 thay1024×1024; NE lộ mặt/gần E, hurt lùi yếu, chết đổi yaw; N attack/death đổi hướng/lộ mặt.

Lưới A khoảng6×12, B khoảng6×8 khi xem toàn tờ. 66/44 hình là quan sát từ worker; 66/44 occupied và 6/4 blank là yêu cầu, chưa chứng nhận từng frame hợp lệ hoặc mỗi ô đúng một con. Pixel khác exactFF00FF xuất hiện cả trong ô không có hình; đây là đo nền, không có nghĩa thêm sinh vật. Không dùng occupancy/components làm count ngữ nghĩa. B không thấy hình ở4ô R4/R8 C5–6 qua quan sát, nhưng nền các ô này vẫn không phẳngFF00FF. Chưa chứng nhận margin, heading, anatomy, groundline, cỡ thân hoặc loop.

Mâu thuẫn giữ nguyên: ô171×6=1026 khácwidth1024; static được mô tả front/side/back nhưng hai khung cuối quan sát giống cùng hướng ngang phải, chưa có rear được xác minh; template nhắcNE dù tờA chỉS/SE/E. B hurt eyes-shut bị ràng buộc N không lộ mặt/mắt ở phần nối. Giữ input gốc, không tự thiết kế lại hoặc suy owner chốt anatomy/pose.

Nguồn/giấy phép: Q44 và `docs/art/nguon-giay-phep.md`, output công cụ ChatGPT/Codex, không tự gán CC0/CC. Static là ảnh dự án có nguồn gốc trong CREDITS. RAW giữ FAIL để owner xem sau; không phải art/runtime pass, không sửa static/shared/manifest/client/server/cân bằng hoặc tự nhập game/đóngissue.
