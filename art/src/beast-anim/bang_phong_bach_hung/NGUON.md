# Băng Phong Bạch Hùng — RAW FAIL để owner duyệt (#767)

Part of #767 và #766. User đã yêu cầu nộp cả candidate FAIL để xem remote; nộp không đồng nghĩa owner duyệt hoặc nhập game. Không cắt/resize/crop/quantize/hậu kỳ. Các lượt không chọn giữ ở artifact, không nộp dư thừa.
LỖI: toA — hướng/pose — S H2C1–6, E H11C2–4, hurt/death — walk S nghiêng SE; hurt yếu; die nằm sấp/đổi trục.

## Tờ A: chọn lượt 2/2 — FAIL / chưa nghiệm thu

Lý do: Chọn A2 vì south attack/hurt và khung die cuối giữ front hơn A1. Đổi lại south walk row2 nghiêng SE; giữ lỗi, không gọi đạt.

Kích thước thật 1024×1536, yêu cầu [1024, 1536]; SHA-256 `977ecf4fcda7f1f9c8ed5c602932d1afd1cd3076563e937fc7240c616e9f7d17`.

- FAIL H2C1–6 south walk nghiêng SE.
- H1/H5/H9C5–6 hurt/recoil yếu; H4/H8C3–4 nằm sấp, chưa ngã nghiêng.
- H11C2–4 E attack xoay SE; identity chi tiết/loop/scale chưa duyệt.
LỖI: toB — size/hướng/pose/anatomy — NE H4C4, N H7C2–4/H8C3–4 — actual1254×1254; NE die lộ mặt bên, N attack lệch phải, chân chết khó đọc/hurt yếu.

## Tờ B: chọn lượt 4/4 — FAIL / chưa nghiệm thu

Lý do: Chọn B4 hơn B2/B3 vì N hurt/death che mặt và giữ rump gần tốt hơn, N attack ít lỗi hơn B1/B2. NE die vẫn quay sườn và N attack lệch; không phải chọn latest chỉ vì mới.

Kích thước thật 1254×1254, yêu cầu [1024, 1024]; SHA-256 `ea13589624ecfb8e8e1840af4f718144c990d1323fcc6ded1b845be3a849ca3b`.

- FAIL actual1254×1254 thay1024×1024; không resize.
- H4C4 NE die quay side/lộ mặt; N attack H7C2–4 lệch phải.
- H3C4 thiếu extension/contact; H1C5–6hurt yếu.
- H8C3–4 che mặt hơn B3 nhưng chân/paw anatomy khó đọc; scale/loop chưa nghiệm thu.

## Nguồn và giới hạn

Mỗi tờ sinh trong fresh session, retry trong cùng tờ; builtin không trả model/seed hay size selector. `toX.prompt.txt` là prompt thực nguyên văn, `toX.source.json` chứa hash/byte/header/ref roles/original path/counters/lịch sử. Mẫu script giữ nguyên trong `<loài>-toX.md`. Raw trong PR đã đối chiếu nguyên byte output. Không khẳng định mỹ thuật, hướng, anatomy, grid/nền, loop, cùng cỡ thân hoặc runtime đạt. Các lỗi do ảnh được giữ để owner quyết định. Không sửa client/runtime/manifest/cutter/server/shared/DB/balance.

Counters A2+B4=6, không reset. B1/B2 session81, B3/B4 session88; A73 chỉ được phép STYLE candidate, không đã duyệt ảnh/runtime. Không tăng acceptance từ việc nộp FAIL.
