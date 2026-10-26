# Thiết Giáp Tê Ngưu — RAW H4 đợt 4

Part of #770. Part of #766.

LỖI: toA — heading/background/pose — R1–4 S; R5–8 SE; R9–12 E — S attack R3C4 và death R4C2–4 quay phải; SE gần side, hurt ngẩng/nhấc thân chưa recoil rõ; nền không phẳng FF00FF; giữ RAW FAIL, không retry.

LỖI: toB — size/heading/pose — R5–8 N — RAW1254×1254 thay1024×1024; nhiều khung N lộ mặt/mắt/sừng chính diện, death quay ngang không giữ rear; giữ RAW FAIL, không retry.

Mỗi tờ một fresh worker, đúng1 builtin imagegen call, không retry/redraw; tổng loài2calls. Owner101 chỉ tích hợp, vẫn đúng1call Thanh Lân A lịch sử. Model ảnh/seed unknown, không suy từ agent. RAW gốc/artifact/shipping khớp byte; số byte/header/SHA256 trong source JSON. Không resize/crop/cutter/assembly/postprocess/runtime.

A110A1 prompt = prefix591byte+BASE4094byte cuối. B112B1 prompt = prefix681byte+BASE3517byte+haiLF+câu matching second sheet/body size, base không nằm cuối prompt thực. Ref A chỉstatic110, B orderedstatic110+A110A1. A/B nhìn thấy66/44hình và6/4vịtríblank, đây là semantic bằng mắt, không chứng nhận mọiframe. N của B lộ mặt/mắt/sừng và death quay ngang; không waiver1254 hoặc nhận artPASS.

Prompt thật trong toA/toB.prompt.txt; prefix/base/suffix và vị trí byte thật giữ tại source JSON. BASE nguyên khối so generator, không giả hash hoặc dịch nhãn Việt sẵn có. Doc generator giữ hướng dẫn lịch sử; owner mới chỉ1call, mọiFAIL vẫn nộp, không redraw/cutter. Xung đột template: A prefix N/NE despite S/SE/E layout; bite/claw attack template versus rhinoceros; 171x6=1026 while canvas1024; eyes shut/rear heading and sideways death conflict. Không sửa template/anatomy/generator.

A chỉ static identity đã VIEW; B ordered static rồi A cùngloài style/body-size candidate còn FAIL, không lấy pose/hướng lỗi làm chuẩn. Refpath ghi đúng actual attached, backup không giả làm actual. Không fake blank/artPASS; số pixel màu không phải số sinh vật/occupied frame. Chưa duyệt motion loop/margin/feetline/samebody-size. Submitted≠merged≠artaccepted≠imported; không waiver size hoặc pose.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thiet_giap_te_nguu/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Thiết Giáp Tê Ngưu (H4 đợt 4, Part of #770/#766): `art/src/beast-anim/thiet_giap_te_nguu/toA.png` (1024×1536, fresh110 A1) và `toB.png` (1254×1254 thật thay1024×1024 yêu cầu, fresh112 B1), tthoadev sinh ngày2026-10-26 bằng builtin `image_gen.imagegen`; mỗi tờ1call/0retry, tổng2. Model ảnh/seed unknown. A static identity only; B ordered static+A style/body-size candidate còn FAIL. RAW nguyên byte, không hậu kỳ/cắt/resize; nộp mọiFAIL theo owner, không size/art/runtime acceptance. Exact prompts/baseposition/refroles/hash/counters/template conflicts: [NGUON.md](src/beast-anim/thiet_giap_te_nguu/NGUON.md), toA/toB.prompt.txt và toA/toB.source.json cùng thư mục. Nguồn Q44/điều khoản công cụ. | - | Chuyển một lần từ art/CREDITS.md (#973) |
