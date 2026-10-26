# Tử Văn Báo — nguồn RAW H4 đợt 5

Part of #771; Part of #766. Tờ A1 do phiên `soul-land-mmo-113` sinh bằng builtin `image_gen.imagegen`, đúng 1 call, 0 retry. Phiên đã STOPGEN vĩnh viễn; B1 do fresh worker `soul-land-mmo-116` được 44 cấp slot: 1 builtin call/0 retry, tổng loài 2 call.

RAW `toA.png`: 1024×1536, SHA256 `3ecc1d4a38cd722f232dff8456c903a4b8ec232112557ef2f2262a0e23990a62`. Nguyên byte so với đầu ra tool; không resize/crop/patch/cắt/ghép/sửa metadata.

Exact prompt: `toA.prompt.txt`; base nguyên văn: `toA.base.txt`; Markdown generator: `tu_van_bao-toA.md`; nguồn/hash/ref/counter/IHDR: `toA.source.json`. Clarifier là suffix từ byte 4090 (zero-based), không prefix. Hash script generator khác hash Markdown sinh ra và actual prompt. Markdown giữ nguyên cả hướng dẫn cũ; chỉ đạo mới của chủ repo thay quy tắc redraw: mọi FAIL vẫn nộp RAW, không retry.

Ảnh tham chiếu duy nhất: `shared/assets/sprites/beast/tu_van_bao.png`, SHA256 `a0aba371be1612bf5d23e95438a9a9715e8054b6a021ce9da87dff3c781135d3`. Ảnh có hai góc nghiêng và một hình lưng, không đủ front/side/back như câu mẫu; giữ hình thể tĩnh theo best faith, không thiết kế lại.

LỖI: toA — heading/hurt/style — R3–4/S, R7–8/SE, R9C5–6/E, R11–12/E — một số pose đánh/chết lệch hướng khối, hurt chưa giật lùi rõ, nét/thân dày hơn static.

Chọn A1 làm tham chiếu STYLE cho B; submitted ≠ merged ≠ art accepted ≠ imported. Image model và seed unknown vì tool không công bố; thời điểm sinh chính xác unknown. Không suy model ảnh từ model agent. Không sửa runtime/manifest; không DB/local bot.

## Tờ B1

RAW `toB.png`: 1254×1254, yêu cầu 1024×1024; SHA256 `ad361f1c06ce5442c24009a568aff1a46b6309fba8aa3578cde0b9721ecbf9b8`. Nguyên byte với tool original. Exact prompt/base/Markdown/source: `toB.prompt.txt`, `toB.base.txt`, `tu_van_bao-toB.md`, `toB.source.json`. Actual = base + suffix từ byte 3513. Giữ nguyên provenance của 116, đặc biệt reference order 1 static backup của 113 và order 2 original tool output A1 (không thay bằng artifact copy trong lịch sử).

LỖI: toB — size/background/heading/hurt — toàn tờ, R1–4/NE, R1/R5C5–6, R7–8/N — RAW 1254×1254 khác yêu cầu 1024×1024; nền chưa phẳng #FF00FF; NE gần E, hurt chưa giật lùi rõ; N attack/death có khung lộ mặt.

Chưa chứng nhận đồng cỡ A/B, đủ khung ngữ nghĩa, hướng hoặc phong cách. Không retry, resize, crop, patch hoặc import.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/tu_van_bao/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Tử Văn Báo (H4 đợt 5, Part of #771 và #766): `art/src/beast-anim/tu_van_bao/toA.png` (A1, 1024×1536) và `toB.png` (B1, 1254×1254 thực tế, yêu cầu 1024×1024; FAIL). tthoadev / fresh phiên `soul-land-mmo-113` dùng builtin `image_gen.imagegen`, A113 và fresh B116 mỗi phiên 1 call/0 retry (tổng loài 2), đã STOPGEN; A chỉ tham chiếu ảnh tĩnh gốc cùng loài, B static backup + original tool output A1 theo đúng thứ tự. Image model/seed/thời điểm sinh chính xác unknown. RAW giữ nguyên byte, không hậu kỳ. Nộp cả FAIL theo chỉ đạo chủ repo; A1 chỉ chọn làm STYLE candidate cho fresh B, chưa duyệt mỹ thuật/runtime hay nhập game. Exact prompt, SHA256, IHDR, nguồn và lỗi: [NGUON.md](src/beast-anim/tu_van_bao/NGUON.md), `toA.prompt.txt`, `toA.source.json`. Nguồn Q44/điều khoản công cụ. | - | Chuyển một lần từ art/CREDITS.md (#973) |
| `shared/assets/sprites/beast/tu_van_bao_anim.png` | `beast_tu_van_bao_anim` | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4 #1053) + tools/assets/beast-sheet-cut.mjs | Tờ thô `toA.png` và `toB.png` cùng thư mục; tham chiếu ảnh tĩnh `beast/tu_van_bao.png`; công cụ không cung cấp model ID hay seed | 2026-10-27 | beast-sheet-cut.mjs (cutter v2, chuẩn hóa kích thước mặc định; hệ số 0.3851 tự động khớp ảnh tĩnh); 24 màu, sheet 6×20 khung 96×96; normal.mjs --frame 96x96; orchestrator tự duyệt (ca đêm): nhẹ — `ne` thấy mặt nghiêng (chưa chính diện), `n` thấy lưng, hurt lùi không ngửa bụng, die đổ gần dọc hướng |
