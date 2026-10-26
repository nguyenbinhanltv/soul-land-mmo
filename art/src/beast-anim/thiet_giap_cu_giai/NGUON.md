# Thiết Giáp Cự Giải — RAW H4 đợt 4

Part of #770. Part of #766.

LỖI: toA — pose/heading/background — R1–4 S; R5–8 SE; R9–12 E — hurt C5–6 ở R1/R5/R9 chủ yếu nâng càng, chưa giật lùi rõ; E còn thấy mặt/hai phía thân, chết R8/R12 gần chính diện; nền không phẳng FF00FF; giữ RAW, không retry.

LỖI: toB — size/heading/background/pose — R1–4 NE; R5–8 N — actual1254×1254 thay1024×1024; NE gần ngang phải, death R4 đổi hướng; N lộ mặt/mắt, hurt/death không giữ rear, hurt nâng càng; nền không phẳng FF00FF; giữ RAW FAIL, không retry.

Mỗi tờ một fresh worker, đúng1 builtin imagegen call, không retry/redraw; tổng loài2calls. Owner101 chỉ tích hợp, vẫn đúng1call Thanh Lân A lịch sử. Model ảnh/seed unknown, không suy từ agent. RAW gốc/artifact/shipping khớp byte; số byte/header/SHA256 trong source JSON. Không resize/crop/cutter/assembly/postprocess/runtime.

A107A1 chỉ static107 actual attached (worker107 đã xác nhận). B109B1 actual roleprefix1602byte + BASE3471byte ở cuối; prefix thêm role/hướng/giữ giải phẫu cua cùng câu matching second sheet/body size. Không giả là prefix681 của nguồn owner. A nhìn66hình và6vịtríblank; B nhìn44hình và4vịtríblank; đây chỉ đếm semantic bằng mắt, không chứng nhận frame/anatomy. Nền biến thiên làm mọi ô cópixel khácFF00FF, không suy72/48hình từ pixeloccupied. B N lộ mặt/mắt và NE ngang, hurt nâng càng, death đổi hướng; không waiver offsize1254.

Prompt thật trong toA/toB.prompt.txt; prefix/base/suffix và vị trí byte thật giữ tại source JSON. BASE nguyên khối so generator, không giả hash hoặc dịch nhãn Việt sẵn có. Doc generator giữ hướng dẫn lịch sử; owner mới chỉ1call, mọiFAIL vẫn nộp, không redraw/cutter. Xung đột template: crab six legs+two claws versus quad/four-legged trot template; 171x6=1026 while requested canvas1024; A prefix mentions N/NE despite S/SE/E layout. Không sửa template/anatomy/generator.

A chỉ static identity đã VIEW; B ordered static rồi A cùngloài style/body-size candidate còn FAIL, không lấy pose/hướng lỗi làm chuẩn. Refpath ghi đúng actual attached, backup không giả làm actual. Không fake blank/artPASS; số pixel màu không phải số sinh vật/occupied frame. Chưa duyệt motion loop/margin/feetline/samebody-size. Submitted≠merged≠artaccepted≠imported; không waiver size hoặc pose.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thiet_giap_cu_giai/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Thiết Giáp Cự Giải (H4 đợt 4, Part of #770/#766): `art/src/beast-anim/thiet_giap_cu_giai/toA.png` (1024×1536, fresh107 A1) và `toB.png` (1254×1254 thật thay1024×1024 yêu cầu, fresh109 B1), tthoadev sinh ngày2026-10-26 bằng builtin `image_gen.imagegen`; mỗi tờ1call/0retry, tổng2. Model ảnh/seed unknown. A static identity only; B ordered static+A style/body-size candidate còn FAIL. RAW nguyên byte, không hậu kỳ/cắt/resize; nộp mọiFAIL theo owner, không size/art/runtime acceptance. Exact prompts/baseposition/refroles/hash/counters/template conflicts: [NGUON.md](src/beast-anim/thiet_giap_cu_giai/NGUON.md), toA/toB.prompt.txt và toA/toB.source.json cùng thư mục. Nguồn Q44/điều khoản công cụ. | - | Chuyển một lần từ art/CREDITS.md (#973) |
