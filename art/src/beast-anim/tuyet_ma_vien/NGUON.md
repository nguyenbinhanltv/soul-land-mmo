# Tuyết Ma Viên — nguồn RAW H4 đợt 5

Part of #771; Part of #766. Mỗi tờ một fresh worker, 1 builtin imagegen call/0 retry; tổng loài2call. Nộp cả RAW FAIL, không redraw/hậu kỳ.

Tờ A1: `toA.png`, IHDR 1024×1536, SHA256 `ed127a739e06fe5826343960244fb32eb38eae931c4e80b7c0523935c46bde82`. Exact actual/base/Markdown/source: `toA.prompt.txt`, `toA.base.txt`, `tuyet_ma_vien-toA.md`, `toA.source.json`. Actual = base + suffix từ byte 4090; không prefix.

LỖI: toA — heading/hurt — R9C5–6 và R11C1–2/C5–6/E — hurt và attack quay về người xem hoặc chéo thay vì E profile; recoil chưa rõ, giữ RAW không retry.

Tờ B1: `toB.png`, IHDR 1254×1254, SHA256 `4389ecefb5c6517efd9c442bdacf1c0ab4a05943d9ea47a697a4ef8507d66d98`. Exact actual/base/Markdown/source: `toB.prompt.txt`, `toB.base.txt`, `tuyet_ma_vien-toB.md`, `toB.source.json`. Actual = base + suffix từ byte 3513; không prefix.

LỖI: toB — size/heading — toàn tờ, R7C2–4 và R8C3–4/N — RAW 1254×1254 khác yêu cầu 1024×1024; attack/death lộ mặt/mắt thay vì giữ đầu quay xa, giữ RAW không retry.

Giữ nguyên `workerProvenance`; phần `integration` đối chiếu generator/hash/Markdown và actual ref paths đúng lúc gọi, tách khỏi durable copies. A chỉ static identity; B ordered static rồi A cùng loài STYLE/body only, không kế thừa heading lỗi. Hash script riêng hash Markdown/base/actual. Base giữ nguyên kể cả số ô171×128 làm tròn, hướng dẫn redraw/import cũ hoặc suffix nhắc hướng ngoài tờ; chỉ đạo RAW-only hiện tại thay hướng dẫn cũ.

Xung đột anatomy đã giữ: vượn hai tay/hai chân trong static và mô tả standing on two legs khác family quad/four-legged trot. Giữ nguyên input+suffix, best faith static anatomy; không redesign.

Image model/seed unknown khi tool không expose; không suy từ model agent. Timestamp theo worker source, không tự suy thời gian nội bộ provider. Pixel occupied không chứng minh semantic figures; chưa chứng nhận đủ khung/margin/feetline/nền/heading/style. Nguyên byte với tool original, không resize/crop/patch/cắt/ghép/sửa metadata; không runtime/manifest/DB/localbot. Submitted ≠ merged ≠ art accepted ≠ imported.
