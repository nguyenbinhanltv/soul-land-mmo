# U Minh Lang — nguồn RAW H4 đợt 5

Part of #771; Part of #766. Mỗi tờ do fresh worker riêng, một builtin `image_gen.imagegen` call/0 retry. A122+B123, tổng species2 call; B2=0. Nộp cả RAW FAIL, không redraw/hậu kỳ.

A1: `toA.png`, IHDR 1024×1536, 1923136 bytes, SHA256 `ee74b175b1b5ca39125d8bb69dfd07551a61f01e8f0a29afc25e49bf4054f74c`. Exact actual/base/Markdown/source: `toA.prompt.txt`, `toA.base.txt`, `u_minh_lang-toA.md`, `toA.source.json`. Actual là base + suffix từ byte 4083. Static call path `/Users/thanhhoa/.ao/data/artifacts/soul-land-mmo-113/prepared-771/u_minh_lang/u_minh_lang-static.png` SHA256 `6bc125daf4c235c913fd9dc4930afe0cbf34c720c87327fd50425c366ce2af90`.

LỖI: toA — heading/hurt — HURT, SE — HURT có đổi hướng; SE chưa rõ hướng xuống phải (theo HANDOFF worker122).

B1: `toB.png`, IHDR 1254×1254, 1903620 bytes, SHA256 `a1946d7378d9c91431244251671de9d600ab750cd044a523d06b32b18bcc7a7b`; requested 1024×1024. Exact actual/base/Markdown/source: `toB.prompt.txt`, `toB.base.txt`, `u_minh_lang-toB.md`, `toB.source.json`. Actual là base + suffix từ byte 3506; generator script `tools/assets/beast-sheet-prompt.mjs` SHA256 `5425d7c28866232679429e58963a36c394d33fb4341918c44b0ffef51e55f4ba`, Markdown SHA256 `b9fce8ee13d2a7d8536f7ce6b6600e41986163062f3ee1495c5369e0490d29aa`.

LỖI: toB — size/heading — 1254×1254; N rows 5,7–8 — RAW vượt yêu cầu 1024×1024; qua VIEW, N row5 lộ mặt và rows7–8 lệch rear (nhận xét trực quan owner, không phải worker metadata).

B123 refs theo đúng thứ tự call: (1) `/Users/thanhhoa/.ao/data/artifacts/soul-land-mmo-113/prepared-771/u_minh_lang/u_minh_lang-static.png` SHA256 `6bc125daf4c235c913fd9dc4930afe0cbf34c720c87327fd50425c366ce2af90`; (2) `/Users/thanhhoa/.ao/data/artifacts/soul-land-mmo-122/u_minh_lang-toA-A1.RAW.png` SHA256 `ee74b175b1b5ca39125d8bb69dfd07551a61f01e8f0a29afc25e49bf4054f74c` (A122 RAW chỉ dùng STYLE/body-size). Source giữ actual paths và phân biệt worker metadata với nhận xét VIEW của owner. Worker123 HANDOFF/metadata/recovery evidence được nhúng trong `toB.source.json`: exact stored return có keys `image_url` + `output_hint`; response ban đầu bị báo thiếu image block, sau đó evidence nối output_hint với original path. RAW khớp SHA original; không có call/retry mới. Model/seed unknown.

Qua VIEW xác nhận B là sói tím bốn chân cùng loài. Nền nhìn magenta nhưng chưa kiểm tra từng pixel; không khẳng định flatness. Không art/runtime acceptance, không import. Submitted ≠ merged ≠ art accepted ≠ imported.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/u_minh_lang/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | U Minh Lang (H4 đợt 5, Part of #771 và #766): A1 `art/src/beast-anim/u_minh_lang/toA.png` (1024×1536, worker122) và B1 `art/src/beast-anim/u_minh_lang/toB.png` (1254×1254 thực tế, yêu cầu1024×1024; FAIL, worker123). Mỗi fresh worker một builtin `image_gen.imagegen` call/0 retry; total species 2, B2=0. B RAW khớp original tool output SHA256 `a1946d7378d9c91431244251671de9d600ab750cd044a523d06b32b18bcc7a7b`; actual refs giữ nguyên thứ tự/path theo call. B heading lệch rear theo VIEW owner; chưa art/runtime acceptance/import. Exact prompt/base/Markdown/ref/recovery/hash/lỗi: [NGUON.md](src/beast-anim/u_minh_lang/NGUON.md), `toA.source.json`, `toB.source.json`. Model/seed unknown. Nguồn Q44/điều khoản công cụ. | - | Chuyển một lần từ art/CREDITS.md (#973) |
