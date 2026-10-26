# Quỷ Ảnh Báo — RAW H4 #769

Part of #769, Part of #766. Cặp A1 từ fresh session100 và B1 từ fresh session102. Mỗi tờ một builtin call, không retry, redraw, B2 hoặc fallback. PR partial riêng gồm 2 RAW của một loài. Không thêm vào các PR832/838/842. Submitted không phải accepted/merged/imported; whole issue vẫn Đang làm.

## Nguồn và thông số thật

Sinh ngày 2026-10-26 bằng builtin imagegen. Model ảnh và seed unknown vì tool không công bố; không suy từ model agent. A yêu cầu và IHDR thực tế 1024×1536 RGB, 2.010.686 byte, SHA256 `8bf92ef81c8930a8002478ab204d6929fc256cc93af8b43e897abdf4c6ef9b90`. B yêu cầu 1024×1024 nhưng IHDR thực tế **1254×1254 RGB**, 1.876.174 byte, SHA256 `0c9670e4b72526bde871953117b8a029ae9761335ee786fc76a7e37c29d00cb4`.

Size chỉ được yêu cầu trong prompt. Original tool output, artifact và RAW repo đã so khớp nguyên byte/hash. Không crop, resize, patch, hậu kỳ, tách nền, cutter, layout, assembly, runtime hoặc sửa metadata ảnh.

Exact prompt `toA.prompt.txt` và `toB.prompt.txt` giữ full base nguyên byte rồi mới nối clarification/match/same body. Hai script MD là output generator nguyên bản, có hash riêng gắn đúng đường dẫn ở integration. Hai worker không cung cấp JSON riêng: owner93 biên soạn `toA.source.json` và `toB.source.json` từ HANDOFF100/102, có path/hash upstream. Các counters/thời gian do worker báo được tách khỏi hash/IHDR/bytes/exact/base/ordered refs kiểm chứng độc lập. A100 chỉ có mốc preflight 01:07:52 UTC và returned 01:08:42 UTC; không ghi exact call-start nên không suy thời lượng. B102 báo started 01:15:01.769Z, returned 01:15:40.241Z. Không sửa generator/anatomy/template.

A đính duy nhất static identity/rear geometry đúng loài, SHA256 `7d395918a78ce6f72ccda44185b32ed3d0f6b3a49d605a7dcd1b92bab5c54544`. B đính static durable100 trước, A100 style/palette/body size/line weight sau. A known FAIL không phải mẫu heading/pose/nền/layout đã duyệt. Worker VIEW/hash refs trước call theo HANDOFF; owner93 đã VIEW RAW/static và đối chiếu refs/hash khi nhận. Original paths cùng vai trò/thứ tự refs giữ trong source.

## Lỗi mỗi tờ

LỖI: toA — nền không phẳng FF00FF / heading và hurt — H1 C5–6,H3–4 S; H5–8 SE — hurt/attack/death S yaw phải, recoil yếu, SE chưa rõ lower-right khác E; giữ RAW A1.

LỖI: toB — sai kích thước / nền không phẳng FF00FF / hướng và tràn ô — H3–4 NE; H5,H7–8 N; H4 C5 — RAW1254×1254 thay1024×1024; NE death lộ mặt/đổi yaw, N hurt/attack/death nghiêng trục; H4C5 có63pixel ngoài ngưỡng nền chẩn đoán.

Lưới quan sát khoảng A6×12, B6×8. 66/44 hình là quan sát từ worker, không chứng nhận từng frame hợp lệ, đúng một con hay giải phẫu. Pixel khác FF00FF có trong mọi ô, kể cả ô không có hình; occupancy không phải semantic count. Worker102 báo 45 ô có pixel ngoài ngưỡng nền R>=200, B>=200, G<=80, gồm 44 ô hình và H4C5 tràn 63 pixel. Không diễn giải thành 45 hình. Các ô H4C6/H8C5–6 không có pixel ngoài ngưỡng cũng không chứng minh nền phẳng FF00FF. Bốn góc B được báo là (239,12,239), (246,19,243), (234,33,235), (241,30,240). Chưa chứng nhận hướng, recoil, loop, margin8%, baseline12%, cỡ thân so A hoặc art/runtime đạt.

Mâu thuẫn giữ nguyên: ô171×6=1026 khác canvas1024; hurt nhắm mắt trong khi N không lộ mặt/mắt; collapse sideways dễ đổi yaw; same body size/lunge/margin có thể khó đồng thời đạt. Phần nối chỉ rõ chia đều canvas và giữ trục. Không sửa base/script/anatomy, không suy chủ repo đã chốt pose.

Nguồn/giấy phép theo Q44 và `docs/art/nguon-giay-phep.md`. Output công cụ ChatGPT/Codex không tự gán CC0 hoặc CC. Static là ảnh dự án có nguồn gốc trong CREDITS. Nộp RAW FAIL để owner xem sau; không tự nhập game, sửa static/shared/manifest/client/server/cân bằng hoặc đóng #769/#766.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/quy_anh_bao/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Quỷ Ảnh Báo (H4 #769): RAW `art/src/beast-anim/quy_anh_bao/toA.png` (1024×1536 IHDR, A1/1, session100) và `toB.png` (1254×1254 IHDR, sai yêu cầu 1024×1024, B1/1, session102), tthoadev sinh ngày 2026-10-26 bằng builtin imagegen. A static identity; B ordered static100 rồi A100 style/body known FAIL. Model ảnh/seed unknown, size chỉ yêu cầu trong prompt. Nguyên byte, không hậu kỳ/cắt/resize. [Nguồn/lỗi](src/beast-anim/quy_anh_bao/NGUON.md), `toA.prompt.txt`, `toB.prompt.txt`, `toA.source.json`, `toB.source.json`; JSON do owner93 biên soạn minh bạch từ HANDOFF100/102 và kiểm chứng byte/hash. Q44/điều khoản công cụ, không tự gán CC0. Còn lỗi cỡ B/nền/heading/hurt/tràn ô, chưa art/runtime acceptance. Phần này 2 tờ, Part of #769 và #766. | - | Chuyển một lần từ art/CREDITS.md (#973) |
| `shared/assets/sprites/beast/quy_anh_bao_anim.png` | `beast_quy_anh_bao_anim` | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4 #868) + tools/assets/beast-sheet-cut.mjs | Tờ thô `toA.png` và `toB.png` cùng thư mục; tham chiếu ảnh tĩnh `beast/quy_anh_bao.png`; công cụ không cung cấp model ID hay seed | 2026-10-27 | beast-sheet-cut.mjs (cutter v2, tách hình dính tay chồng sang khung bên ở `e` attack; hệ số 0.3908 tự khớp ảnh tĩnh); 24 màu, sheet 6×20 khung 96×96; normal.mjs --frame 96x96; orchestrator tự duyệt (ca đêm): nhẹ — `ne` thấy mặt nghiêng (thân chếch sau, chưa chính diện), die một số khung nằm hơi ngang |
