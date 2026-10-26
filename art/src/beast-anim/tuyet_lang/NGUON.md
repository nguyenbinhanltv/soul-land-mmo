# Tuyết Lang — nguồn RAW H4 đợt 5

Part of #771; Part of #766. A1 do fresh worker115, B1 do fresh worker117; mỗi phiên đúng 1 builtin imagegen call/0 retry, tổng loài 2 call. Nộp cả RAW FAIL theo chỉ đạo chủ repo, không redraw/hậu kỳ.

Tờ A1: `toA.png`, IHDR 1024×1536, SHA256 `4c348e9d8011f9af0bfaefb664c0d93f7143f5eee290316d338f01b029d4bc09`. Exact prompt/base/Markdown/source: `toA.prompt.txt`, `toA.base.txt`, `tuyet_lang-toA.md`, `toA.source.json`. Actual = base + suffix từ byte 4109; script hash và Markdown hash riêng.

LỖI: toA — heading/pose — R1C5–6/S, R3–4/S, R5–8/SE, R11–12/E — hurt quay đầu sang phải; nhiều attack/death đổi góc nhìn; SE chưa tách rõ E, giữ RAW không retry.

Tờ B1: `toB.png`, IHDR 1254×1254, SHA256 `e767c40df65ef55b26db6a3e589ff0a301a1f6088618c816e57b1d4d2c48af95`. Exact prompt/base/Markdown/source: `toB.prompt.txt`, `toB.base.txt`, `tuyet_lang-toB.md`, `toB.source.json`. Actual = base + suffix từ byte 3532; script hash và Markdown hash riêng.

LỖI: toB — size/heading/hurt/background — toàn tờ, R1–4/NE, R5–8/N — RAW 1254×1254 khác yêu cầu 1024×1024; NE gần E, N lộ mặt và death quay phải; hurt chưa giật lùi rõ, nền chưa chứng nhận phẳng #FF00FF.

Giữ nguyên worker provenance và actual ref paths lúc gọi. A chỉ static identity; B ordered static115 rồi A115 STYLE/body only. Ảnh tĩnh có góc nghiêng trước/front, không có lưng rõ như template three static views; giữ anatomy, không redesign. Base giữ nguyên kể cả ô 171×128 làm tròn và suffix nhắc hướng ngoài tờ. Các hướng dẫn redraw/import trong Markdown cũ đã được chỉ đạo RAW-only thay thế.

Image model/seed unknown vì tool không expose; không suy model ảnh từ agent. Timestamp từng call do worker ghi trong source. RAW khớp byte original tool output; không resize/crop/patch/cắt/ghép/sửa metadata, không runtime/manifest/DB/localbot. Pixel occupied không chứng minh số hình ngữ nghĩa; chưa chứng nhận margin/feetline/nền/heading. Submitted ≠ merged ≠ art accepted ≠ imported.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/tuyet_lang/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Tuyết Lang (H4 đợt 5, Part of #771 và #766): `art/src/beast-anim/tuyet_lang/toA.png` (A1, 1024×1536) và `toB.png` (B1, 1254×1254 thực tế, yêu cầu 1024×1024; FAIL). tthoadev / fresh workers115 và117 dùng builtin `image_gen.imagegen`, mỗi phiên1call/0retry, tổng loài2call. A static identity; B ordered static115+A115 STYLE/body only, giữ actual ref paths trong provenance. Image model/seed unknown. Nộp RAW FAIL nguyên byte, không hậu kỳ; chưa duyệt mỹ thuật/runtime hay import. Exact prompts, base, generator/Markdown hashes, refs, IHDR và lỗi: [NGUON.md](src/beast-anim/tuyet_lang/NGUON.md), `toA.source.json`, `toB.source.json`. Nguồn Q44/điều khoản công cụ. | - | Chuyển một lần từ art/CREDITS.md (#973) |
