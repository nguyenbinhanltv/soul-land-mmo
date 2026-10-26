# Thanh Lân Ngạc — RAW H4 đợt 4

Part of #770. Part of #766.

LỖI: toA — sai hướng S/SE/E, hurt chưa recoil rõ, nền chưa phẳng FF00FF, lấn ô trống — H1/H5/H9 C5–6; H7/H11 C6; H9 C1; H4/H8 C5–6 — E H9C1 quay trái, attack H7/H11C6 quay front; ô trống có117/646/19/965 pixel ngoài nền theo ngưỡng; giữ RAW FAIL, không retry.

A1: fresh conversation soul-land-mmo-101, đúng một builtin `image_gen.imagegen` call, không retry. Yêu cầu 1024×1536; PNG thực 1024×1536, 2123584 byte. SHA256: `fa6ee41de8f7bfc5f4c577629b5d24497446d0e0951b6f7c3d561457c9af7742`. Model ảnh và seed: unknown; tool không cung cấp selector kích thước riêng.

Chỉ đính static backup đúng loài, đã VIEW; hash khớp ảnh gốc. Prompt thực là prefix ghi trong source JSON + nguyên khối English từ generator; `toA.prompt.txt` là exact prompt. Doc generator đi kèm giữ nguyên hướng dẫn lịch sử; quy định owner mới không redraw/không hậu kỳ thay thế các câu retry/cutter trong doc đó.

Đếm bằng mắt: 66 hình; 6 vị trí dự kiến trống có 4 ô bị lấn theo phép đo pixel, không xác nhận 6 ô blank sạch. Số pixel từng ô trống và ngưỡng đo ghi trong source JSON; không suy art PASS từ số ô. Hurt H1/H5/H9 C5–6 nâng/quay đầu thay recoil rõ. S attack có khung nghiêng, SE attack và E attack chuyển front ở C6; E H9C1 quay trái. Nền magenta có biến thiên, không toàn bộ nền chính xác FF00FF. Thân/mõm/nét/màu có biến thiên; chưa kiểm vòng lặp hoặc cỡ thân xuyên tờ. Cặp A/B chưa được duyệt cỡ thân hoặc mỹ thuật.

RAW original, bản artifact và toA.png khớp byte; không resize/crop/cutter/assembly/postprocess/metadata rewrite. B104B1 đã bàn giao, 8 tờ còn lại pending fresh workers do44 điều phối. Nộp nguồn không đồng nghĩa merged, art accepted hoặc imported. Phiên101 dừng sinh ảnh vĩnh viễn sau A1.

LỖI: toB — sai kích thước, hướng N/death, hurt yếu, lấn ô trống — R1/R5 C5–6; R4 C3–4 NE; R5–8 N; R4C5–6/R8C5 — RAW1254×1254; N lộ mặt/đuôi xa, R7C3 lệch NE, death đổi hướng; blank có399/594/116 pixel ngoài nền theo ngưỡng; giữ RAW, không retry.

B104B1: đúng một builtin call, không retry. Yêu cầu1024×1024; thực tế1254×1254, 2010045byte. RAW gốc/artifact104/toB.png khớp byte và SHA256 `e24fc47f90d9788261c914b4cee917b00a7399d2a9cb3b30410d304d273a6d1b`. Model/seed unknown. Tổng loài A1+B1=2calls, phiên101 vẫn chỉ1call.

Prompt B thật: prefix681byte + nguyên khối BASE3539byte (byte681–4219, từ0) + hai LF + câu bổ sung matching second sheet/body size. `toB.prompt.txt` giữ đúng4342byte; không ghi nhầm suffix là prefix. Hai ref thực đúng thứ tự static identity rồi A101A1 style/body-size candidate, hash và đường dẫn trong source JSON. A còn FAIL, không làm chuẩn hướng/pose.

Quan sát B:44hình semantic;4vị trí blank được đếm pixel riêng trong JSON, không suy art pass. NE die H4C3–4 về E; N H5–7 lộ mặt/mõm, H7C3 về NE, death H8 về chéo/phải; hurt ngửa đầu thay recoil rõ. Không chữ/lưới thấy rõ. Nền và cỡ thân chưa đạt chứng nhận; không waiver offsize1254, không import.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/thanh_lan_ngac/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Thanh Lân Ngạc (H4 đợt 4, Part of #770 và #766): `art/src/beast-anim/thanh_lan_ngac/toA.png` (1024×1536, fresh101 A1) và `toB.png` (1254×1254 thật, yêu cầu1024×1024, fresh104 B1), mỗi tờ đúng một call, không retry, tthoadev sinh ngày 2026-10-26 bằng builtin `image_gen.imagegen`; model ảnh/seed unknown, không size selector. A chỉ static gốc đúng loài qua backup nguyên byte đã VIEW; B ordered static + A101A1 style/body-size candidate còn FAIL. RAW giữ nguyên byte, không hậu kỳ/cắt/resize; FAIL hướng/hurt/nền/lấn ô trống được nộp theo chỉ đạo owner, chưa art accepted hoặc nhập runtime. Exact prompt/base/prefix/hash/refroles/counters và lỗi: [NGUON.md](src/beast-anim/thanh_lan_ngac/NGUON.md), `toA.prompt.txt`, `toB.prompt.txt`, `toA.source.json`, `toB.source.json`, doc generator cùng thư mục. Tổng2calls; B sai size/N/death/hurt; không waiver. Nguồn Q44/điều khoản công cụ. | - | Chuyển một lần từ art/CREDITS.md (#973) |
