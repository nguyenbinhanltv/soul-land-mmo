# Thiết Giáp Xuyên Sơn Giáp — RAW H4 đợt 4

Part of #770. Part of #766.

LỖI: toA — heading/background — R1–4 S; R5–8 SE; R9–12 E — hurt S quay phải, attack/death đổi heading; SE chưa tách rõ E; nền khácFF00FF và không phẳng; giữ RAW FAIL, không retry.

LỖI: toB — size/heading/hurt/background — R1–4 NE; R1/R5 C5–6; R7C3–4/R8C4 N — actual1254×1254 thay1024×1024; NE gần E/thấy mặt, hurt chưa recoil rõ, N attack xoay và death lộ mõm sang phải; nền không phẳngFF00FF; giữ RAW FAIL, không retry.

Mỗi tờ một fresh worker, đúng1 builtin imagegen call, không retry/redraw; tổng loài2calls. Owner101 chỉ tích hợp, vẫn đúng1call Thanh Lân A lịch sử. Model ảnh/seed unknown, không suy từ agent. RAW gốc/artifact/shipping khớp byte; số byte/header/SHA256 trong source JSON. Không resize/crop/cutter/assembly/postprocess/runtime.

A111A1 actual = prefix591byte+BASE4114byte cuối. B114B1 actual = prefix803byte+BASE3537byte cuối; câu matching second sheet/body size được thêm TRƯỚC BASE, không suffix sauBASE. A actual attach static101, B actual attach static111 backup rồi A111A1 styleonly, không giả cả hai cùngrefpath. Nền biến thiên làm mọiô cópixel khácFF00FF không bằng72/48hình. B nhìn44hình, phépđo riêng theo thresholdmaxRGBdiff>40 có44occupied/4ô0pixel; đây không chứng nhận semantic/pose hoặc màuFF00FF tuyệt đối. Không waive1254, không art/runtimePASS.

Prompt thật trong toA/toB.prompt.txt; prefix/base/suffix và vị trí byte thật giữ tại source JSON. BASE nguyên khối so generator, không giả hash hoặc dịch nhãn Việt sẵn có. Doc generator giữ hướng dẫn lịch sử; owner mới chỉ1call, mọiFAIL vẫn nộp, không redraw/cutter. Xung đột template: A prefix N/NE despite S/SE/E layout; 171x6=1026 while canvas1024; B mentions SE/E and eyes shut while N rear required. Không sửa template/anatomy/generator.

A chỉ static identity đã VIEW; B ordered static rồi A cùngloài style/body-size candidate còn FAIL, không lấy pose/hướng lỗi làm chuẩn. Refpath ghi đúng actual attached, backup không giả làm actual. Không fake blank/artPASS; số pixel màu không phải số sinh vật/occupied frame. Chưa duyệt motion loop/margin/feetline/samebody-size. Submitted≠merged≠artaccepted≠imported; không waiver size hoặc pose.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thiet_giap_xuyen_son_giap/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Thiết Giáp Xuyên Sơn Giáp (H4 đợt 4, Part of #770/#766): `art/src/beast-anim/thiet_giap_xuyen_son_giap/toA.png` (1024×1536, fresh111 A1) và `toB.png` (1254×1254 thật thay1024×1024 yêu cầu, fresh114 B1), tthoadev sinh ngày2026-10-26 bằng builtin `image_gen.imagegen`; mỗi tờ1call/0retry, tổng2. Model ảnh/seed unknown. A static identity only; B ordered static+A style/body-size candidate còn FAIL. RAW nguyên byte, không hậu kỳ/cắt/resize; nộp mọiFAIL theo owner, không size/art/runtime acceptance. Exact prompts/baseposition/refroles/hash/counters/template conflicts: [NGUON.md](src/beast-anim/thiet_giap_xuyen_son_giap/NGUON.md), toA/toB.prompt.txt và toA/toB.source.json cùng thư mục. Nguồn Q44/điều khoản công cụ. | - | Chuyển một lần từ art/CREDITS.md (#973) |
