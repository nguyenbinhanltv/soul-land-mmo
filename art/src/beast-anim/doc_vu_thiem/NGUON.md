# Độc Vụ Thiềm — RAW FAIL để owner duyệt (#767)

Part of #767 và #766. User đã yêu cầu nộp cả candidate FAIL để xem remote; nộp không đồng nghĩa owner duyệt hoặc nhập game. Không cắt/resize/crop/quantize/hậu kỳ. Các lượt không chọn giữ ở artifact, không nộp dư thừa.
LỖI: toA — hướng/pose/nền — E H9–12/H12C3–4, hurt H1/H5/H9C5–6 — E còn3/4, deathviewer/recoil yếu, nền RGB251,2,250 khôngflat.

## Tờ A: chọn lượt 1/2 — FAIL / chưa nghiệm thu

Lý do: Chọn A1 làm chính vì grid tốt hơn A2:6ôtrống khôngpixelvượt nền tol40. A2Eprofilebetter nhưng bleedH8C5=1528/H8C6=960, nhiều ô chạm ranh; không chọn latest máy móc.

Kích thước thật 1024×1536, yêu cầu [1024, 1536]; SHA-256 `a4cdd35ec76a6b366693d9088b4249997757745c67ee844d6e939503685173de`.

- FAIL E H9–12 còn3/4, chưa strict profile. Hurt ngẩng/đổi mặt, recoil yếu; H12C3–4deathviewer.
- Identity cóc thấp/da sần giữ nhìn tổng thể, không tail/FX; từngchi/loop chưa nghiệm thu.
- Nền phổ biến RGB251,2,250 khôngflatFF; A1tol40occupied66/6ôtrống0 không chứng minh tất cả #FF00FF.
LỖI: toB — kích thước/nền/hướng/pose/căn ô — B2 R1–R4 NE, R1–R2, R7–R8 — RAW 1254×1254; nền không phẳng FF00FF; NE lộ mặt; hurt/attack chưa rõ; tràn hàng và lệch chân.

## Tờ B: chọn lượt 2/2 — FAIL / chưa nghiệm thu

Lý do: Chọn B2 vì N death R8C3–4 giữ trục rear tốt hơn B1 quay ngang, attack không há miệng lớn như B1. NE/grid/pose còn lỗi; nộp để owner xem, không phải đạt.

Kích thước thật 1254×1254, yêu cầu [1024, 1024]; SHA-256 `35bd1962e17968cd4848b2b29c8a5d0ae67a522338f500a8a71e7cb798e99d97`.

- FAIL actual1254×1254 thay1024×1024; giữ nguyên RAW, không resize.
- R1–R4 NE lộ mặt/mắt/miệng phải, chưa rear3/4; R4C3–4 death nghiêng E.
- R1C5–6/R5C5–6 hurt chưa rõ recoil; R3C2 ngẩng, R3C3 lunge yếu; R7 attack ít biến đổi.
- R1 tràn xuống R2 C1/C3/C5/C6; R7 thiếu margin trên, R8C1 sát ranh. Foot clearance 0–34%, không đều12%; R4C4/R8C4 thiếu margin ngang.
- Nền gần magenta nhưng không flatFF00FF. Upstream mask tol60 có4ôtrống0pixel; đây không phải đếm thú semantic hoặc chứng nhận nền.
- R5–R8 N/death tốt hơn B1; body size tương ứng A/loop/anatomy vẫn chưa nghiệm thu.

## Nguồn và giới hạn

Mỗi tờ sinh trong fresh session, retry trong cùng tờ; builtin không trả model/seed hay size selector. `toX.prompt.txt` là prompt thực nguyên văn, `toX.source.json` chứa hash/byte/header/ref roles/original path/counters/lịch sử. Mẫu script giữ nguyên trong `<loài>-toX.md`. Raw trong PR đã đối chiếu nguyên byte output. Không khẳng định mỹ thuật, hướng, anatomy, grid/nền, loop, cùng cỡ thân hoặc runtime đạt. Các lỗi do ảnh được giữ để owner quyết định. Không sửa client/runtime/manifest/cutter/server/shared/DB/balance.

Counters A2+B2=4, không reset. A1 chính vì grid ít bleed hơn A2; A2 và mọi lượt không chọn giữ tại artifact90/91. B91 thực tế đính static + A90/A2 STYLEONLY; refhash vẫn là A2, không đổi thành primary A1. Số đo pixel ở upstream provenance dùng tolerance, không đếm thú bằng exactFF00FF. User yêu cầu nộp ảnh lỗi, không nhập game hoặc nghiệm thu.
