# Điền Thử — RAW FAIL để owner duyệt (#767)

Part of #767 và #766. User đã yêu cầu nộp cả candidate FAIL để xem remote; nộp không đồng nghĩa owner duyệt hoặc nhập game. Không cắt/resize/crop/quantize/hậu kỳ. Các lượt không chọn giữ ở artifact, không nộp dư thừa.
LỖI: toA — hướng/pose/anatomy — S H1C5–6/H4C3–4, SE H5C5–6/H7C3 — hurt/death quay phải, recoil yếu, chi cần owner xem.

## Tờ A: chọn lượt 2/2 — FAIL / chưa nghiệm thu

Lý do: Chọn A2 vì attack S/SE cải thiện so A1, còn hurt/death hướng sai đã ghi. Không lấy pose lỗi làm chuẩn.

Kích thước thật 1024×1536, yêu cầu [1024, 1536]; SHA-256 `b1e07016cca64b74a4459227ca1fbde9274c8c853cf2015ced03c2c50ddad2ed`.

- FAIL H1C5–6hurt quay phải; H4C3–4death phải; H5C5–6hurt dựng/profile, recoil yếu.
- H7C3 limb anatomy cần xem; H8C3–4death side-on; loop chưa kiểm.
LỖI: toB — size/hướng/pose/grid/nền — NE H1C5/H3C5/H4C4, N H8C4, blank H4C5 — actual1254×1254, death yawE, hurt yếu, bleed3px tol60, nền RGB250,3,249 khôngflat.

## Tờ B: chọn lượt 1/2 — FAIL / chưa nghiệm thu

Lý do: Chọn B1 thay latest B2: N attack giữ gần N hơn B2 (B2 cả hàng yawNE), bleed H4C5 thấp hơn3vs55px. B2 hurt ít yaw hơn nhưng mất cả dải N attack; giữ B2 ở artifact để owner có thể yêu cầu so.

Kích thước thật 1254×1254, yêu cầu [1024, 1024]; SHA-256 `1d92729aa96b364045eadc381a91f3d95ace803df58b575d17ea00551621823f`.

- FAIL actual1254×1254 thay1024×1024.
- B1 H1C5hurt yawE/H3C5driftE; H4C4/H8C4death yawE.
- N attack H7 gần N hơn B2 (B2 cảH7yawNE), nhưng C3/C5paw raised/pose chưa đạt.
- B1 H4C5 có3px bleed tol60, B2 có55px; visual44 không chứng minh4blanks sạch.
- Nền phổ biến RGB250,3,249, khôngflatFF; 48exactoccupied/45tol60occupied là pixel occupancy, không45animals.
- B1 có vẻ lớn hơn A; scale/loop/quad-vs-static seated chưa nghiệm thu.

## Nguồn và giới hạn

Mỗi tờ sinh trong fresh session, retry trong cùng tờ; builtin không trả model/seed hay size selector. `toX.prompt.txt` là prompt thực nguyên văn, `toX.source.json` chứa hash/byte/header/ref roles/original path/counters/lịch sử. Mẫu script giữ nguyên trong `<loài>-toX.md`. Raw trong PR đã đối chiếu nguyên byte output. Không khẳng định mỹ thuật, hướng, anatomy, grid/nền, loop, cùng cỡ thân hoặc runtime đạt. Các lỗi do ảnh được giữ để owner quyết định. Không sửa client/runtime/manifest/cutter/server/shared/DB/balance.

Counters A2+B2=4. Chọn B1 có rationale, không sửa lịch sử A83. Read-only pixelQA theo tolerance ở provenance89, không dùng exactFF00FF-only để đếm số thú.
