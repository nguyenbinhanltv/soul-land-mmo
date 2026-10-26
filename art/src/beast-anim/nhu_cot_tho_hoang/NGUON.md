# Nhu Cốt Thỏ hoang — RAW H4 #769

Part of #769, Part of #766. Cặp RAW A1 (fresh session96) + B1 (fresh session97), đúng một builtin call/tờ, không retry hoặc fallback. Phần nộp này thêm 2 tờ; Lôi Văn Hầu ở PR832 riêng. Submitted không phải accepted/merged/imported. Whole issue vẫn Đang làm.

## Nguồn và thông số thật

Công cụ builtin `image_gen__imagegen`, ngày 2026-10-26. Model ảnh và seed unknown vì tool không cung cấp; GPT-6.1-Sol medium là cấu hình agent được yêu cầu, không phải tên model ảnh đã xác minh. Công cụ chỉ nhận cỡ qua prompt. Giữ nguyên output công cụ, artifact và file repo byte-identical; không resize/crop/patch/hậu kỳ/cutter/layout/assembly/runtime hoặc sửa metadata.

A yêu cầu và IHDR thực tế 1024×1536 RGB, 1.774.437 byte, SHA-256 `af30c4b29b5a7fe6df1a7239eed101eb7128d4e9ec302f4afed648d8c89bc330`. B yêu cầu 1024×1024 nhưng IHDR thực tế **1254×1254 RGB**, 1.679.361 byte, SHA-256 `10520944726e1d402171a006699b55d6f7162888677a3aaa213e07fbf2d5a33c`.

Exact prompt trong `toA.prompt.txt`, `toB.prompt.txt` giữ đủ base tiếng Anh, rồi mới nối clarification/match/same body. Hai file `nhu_cot_tho_hoang-toA.md`/`-toB.md` là output script nguyên bản, không sửa generator. Hash/time/counters/IHDR/tool truth/refroles cùng mapping upstream/repo trong `toA.source.json`, `toB.source.json`; giữ nguyên metadata upstream và bổ sung riêng mục integration.

A chỉ đính static đúng loài, đã VIEW/hash trước call. B đính static identity/back geometry trước, A96 style/cỡ thân sau. Static SHA-256 `65252743f4a79461c2ac9b469d76165c3589e5742e87e0530e80ce8f3324fcca`; A96 chỉ là selected/style-only known FAIL, không phải A đã duyệt art. Không dùng các pose lệch heading/hurt/death hoặc nền sai của A làm chuẩn. Original tool paths và artifact copies còn nguyên trong source.

## Lỗi đã biết

LỖI: toA — nền lệch FF00FF và không phẳng; lệch heading/hurt theo quan sát — R1C5-6, R3C3, R4C1-4/S; R5C5-6/SE; R9C5-6/E; nền toàn tờ — giữ RAW A1, nộp cả FAIL, không vẽ lại; 66 ô occupied không phải số sinh vật semantic.

LỖI: toB — sai kích thước / nền không phẳng FF00FF / hướng chết và hurt — H1–4 NE; H5 C5–6,H7,H8 N — RAW 1254×1254 thay 1024×1024; NE lộ mặt/gần E, hurt lùi yếu; N xoay phải/lộ mặt, chết mất heading.

Quan sát toàn tờ cho thấy lưới A khoảng6×12, B khoảng6×8; không chứng nhận số frame hợp lệ hay mỗi ô đúng một con. 66/44 occupied và 6/4 blank là yêu cầu prompt. Pixel occupancy trong upstream provenance chỉ là chẩn đoán; số ô có pixel khác FF00FF không được đổi thành số sinh vật/frame. Worker97 ghi 44 hình qua quan sát bằng mắt; chưa kiểm đếm ngữ nghĩa độc lập tại integration. Không thấy hình B tràn R4 C5–6 khi xem toàn tờ, nhưng nền các ô này không phẳng FF00FF. Chưa chứng nhận hướng, margin, groundline, cỡ thân, anatomy hoặc loop đạt.

Base ghi ô rộng171 trong canvas1024 (6×171=1026); giữ base nguyên byte và chỉ clarification chia đều toàn ảnh. Static chỉ front/side/back, chưa có SE; template thân thấp/bốn chân khác một số dáng thỏ ngồi cao trong A. Prompt N hurt nhắm mắt bị ràng buộc bởi yêu cầu không lộ mặt/mắt ở phần nối. Ghi mâu thuẫn thực tế, không thiết kế lại hoặc suy owner đã chốt anatomy/pose.

Nguồn/giấy phép theo Q44 và `docs/art/nguon-giay-phep.md`: ảnh sinh bằng công cụ ChatGPT/Codex, không tự gán CC0 hoặc giấy phép CC cho output AI. Reference là ảnh dự án hiện có, giữ nguồn gốc tại CREDITS. RAW technical submission kể cả FAIL, không phải art/runtime acceptance; không sửa static/shared/manifest/client/server/cân bằng hoặc tự nhập game.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/nhu_cot_tho_hoang/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Nhu Cốt Thỏ hoang (H4 #769): RAW `art/src/beast-anim/nhu_cot_tho_hoang/toA.png` (1024×1536 IHDR, A1/1, session96) và `toB.png` (1254×1254 IHDR, sai yêu cầu1024×1024, B1/1, session97), tthoadev sinh ngày2026-10-26 bằng builtin `image_gen__imagegen`. A chỉ ref static đúng loài; B ordered static identity/back geometry rồi A96 style/cỡ thân known FAIL. Model ảnh/seed unknown; cỡ chỉ yêu cầu qua prompt. Nguyên byte, không hậu kỳ/cắt/resize. [Nguồn/lỗi](src/beast-anim/nhu_cot_tho_hoang/NGUON.md), `toA.prompt.txt`, `toB.prompt.txt`, `toA.source.json`, `toB.source.json`. Q44/điều khoản công cụ, không tự gán CC0. Cặp RAW còn lỗi nền/hướng/pose/hurt và B sai cỡ; chưa art/runtime acceptance. Phần này 2 tờ, Part of #769 và #766. | - | Chuyển một lần từ art/CREDITS.md (#973) |
