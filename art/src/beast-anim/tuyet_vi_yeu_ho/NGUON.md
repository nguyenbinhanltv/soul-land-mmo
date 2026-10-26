# Tuyết Vĩ Yêu Hồ — nguồn RAW H4 đợt 5

Part of #771; Part of #766. A1 do fresh worker119; một builtin imagegen call/0 retry. RAW 1024×1536, SHA256 `d1e1fe1031e28f43ffb0de667105ae3475c1d3e4c392f47634039d650de81f00`, nguyên byte tool original; không hậu kỳ.

Exact actual/base/Markdown/source: `toA.prompt.txt`, `toA.base.txt`, `tuyet_vi_yeu_ho-toA.md`, `toA.source.json`. Actual = base + suffix từ byte 4087; generator script hash riêng Markdown hash. Static reference đúng lúc gọi: `/Users/thanhhoa/.ao/data/artifacts/soul-land-mmo-113/prepared-771/tuyet_vi_yeu_ho/tuyet_vi_yeu_ho-static.png`, SHA256 `bc3b69cd69ce18b1c651dc0349cb439539ceff93100e0f711f4bd48382a162ef`; durable copy đã kiểm cùng hash.

LỖI: toA — heading/pose — S R1–4, SE R5–8, E R9–12 — S attack nghiêng/phải; die R4/R8 C1–2 quay trái; E hurt R9 C5–6 và die R12 C1–2 quay trái; SE gần E profile; recoil lùi không nhất quán.

A1 selected-style-only. Static có các góc nghiêng, không đủ front/side/back như câu mẫu; giữ nguyên hình thể hồ ly theo static, không redesign. Chưa chứng nhận heading, số hình semantic, margin, feetline, nền từng pixel, art/runtime hoặc import. Image model/seed unknown. Không DB/localbot.

Tờ B1: `toB.png`, RAW nguyên byte tool output, IHDR 1254×1254, 1886173 bytes, SHA256 `bfc8d53a6332b13310ce340572b608a6dbcb107233380854124c7b07080ce817`. Requested 1024×1024; actual prompt/base/Markdown/source: `toB.prompt.txt`, `toB.base.txt`, `tuyet_vi_yeu_ho-toB.md`, `toB.source.json`. Exact actual = base + suffix tại byte 3510; generator script `tools/assets/beast-sheet-prompt.mjs` SHA256 `5425d7c28866232679429e58963a36c394d33fb4341918c44b0ffef51e55f4ba`, Markdown SHA256 `a1bd8fd1cec52366a4c91feb8d7c8d5d9e8d2002ecd6853d3163808fce75f94c`. Model/seed unknown.

LỖI: toB — size/heading/hurt — 1254×1254; N attack/death, NE death — N không giữ rear ở attack/death; NE death lệch side profile; hurt recoil chưa rõ.

Worker121 ordered refs giữ đúng như lúc gọi: 1) `/Users/thanhhoa/.ao/data/artifacts/soul-land-mmo-119/tuyet_vi_yeu_ho-A1/tuyet_vi_yeu_ho-static.png` SHA256 `bc3b69cd69ce18b1c651dc0349cb439539ceff93100e0f711f4bd48382a162ef` (static); 2) `/Users/thanhhoa/.ao/data/artifacts/soul-land-mmo-119/tuyet_vi_yeu_ho-A1/tuyet_vi_yeu_ho-toA-RAW.png` SHA256 `d1e1fe1031e28f43ffb0de667105ae3475c1d3e4c392f47634039d650de81f00` (A119 STYLE/body-size only, chưa art accepted). Paths này khác durable backup113 của A; không rewrite provenance.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/tuyet_vi_yeu_ho/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Tuyết Vĩ Yêu Hồ (H4 đợt 5, Part of #771 và #766): A1 `art/src/beast-anim/tuyet_vi_yeu_ho/toA.png` (1024×1536, worker119) và B1 `art/src/beast-anim/tuyet_vi_yeu_ho/toB.png` (1254×1254 thực tế, yêu cầu1024×1024; FAIL, worker121). Mỗi fresh worker một builtin `image_gen.imagegen` call/0 retry, tổng2; B refs giữ đúng actual paths worker121. RAW nguyên byte, chưa art/runtime duyệt hay nhập. Lỗi, prompt/base/Markdown/ref/source/hash: [NGUON.md](src/beast-anim/tuyet_vi_yeu_ho/NGUON.md), `toA.source.json`, `toB.source.json`. Model/seed unknown. Nguồn Q44/điều khoản công cụ. | - | Chuyển một lần từ art/CREDITS.md (#973) |
