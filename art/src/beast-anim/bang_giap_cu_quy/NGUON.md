# Băng Giáp Cự Quy — RAW FAIL để owner duyệt (#767)

Part of #767 và #766. User đã yêu cầu nộp cả candidate FAIL để xem remote; nộp không đồng nghĩa owner duyệt hoặc nhập game. Không cắt/resize/crop/quantize/hậu kỳ. Các lượt không chọn giữ ở artifact, không nộp dư thừa.

## Tờ A: chọn lượt 2/2 — FAIL / chưa nghiệm thu

Lý do: Giữ nguyên A69/A2 owner đã xem duyệt raw.

Kích thước thật 1024×1536, yêu cầu [1024, 1536]; SHA-256 `7816619a51c15e87d562e6db3d6224d7152e6493af26c0215371b9f2f7c649f0`.

- Owner đã duyệt raw A s/se/e tại review5645187758; không phải B/runtime accepted.

## Tờ B: chọn lượt 7/7 — FAIL / chưa nghiệm thu

Lý do: B7 được chọn vì N idle/walk/attack giữ rear tốt hơn B2 đang nộp (N idle/walk lộ mặt) và cải thiện N walk so B6. Đổi lại NE die H4C3–4 sai/extrahead rõ; không coi đã fix. B5 comparison có N rear H5–7 nhưng H2C3extrahead và H8C3–4headright. Không lấy latest máy móc: giữ hai trade-off để owner chọn.

Kích thước thật 1254×1254, yêu cầu [1024, 1024]; SHA-256 `b254a3dd73e490cff746a082887ae27e67d097890027ba2566226939b93209bb`.

- FAIL N/NE orientation/anatomy: B7 H4C3 có hai phần giống đầu trái+phải; H4C4 lộ mặt trái, không giữ NE.
- H8C3–4 appendage xanh phải còn mơ hồ, chưa chứng minh head-hidden N.
- H5–H7 rear/đuôi rõ hơn B2 và B5; hurt vẫn nhẹ, loop/scale chưa nghiệm thu.
- Actual1254×1254 khác yêu cầu1024×1024; giữ nguyên raw, không fake1024.
- User cho nộp FAIL không phải miễn spec; #810 owner normalize derived import, không sửa pose.

## Nguồn và giới hạn

Mỗi tờ sinh trong fresh session, retry trong cùng tờ; builtin không trả model/seed hay size selector. `toX.prompt.txt` là prompt thực nguyên văn, `toX.source.json` chứa hash/byte/header/ref roles/original path/counters/lịch sử. Mẫu script giữ nguyên trong `<loài>-toX.md`. Raw trong PR đã đối chiếu nguyên byte output. Không khẳng định mỹ thuật, hướng, anatomy, grid/nền, loop, cùng cỡ thân hoặc runtime đạt. Các lỗi do ảnh được giữ để owner quyết định. Không sửa client/runtime/manifest/cutter/server/shared/DB/balance.

B2 cũ ở PR798 head65ac0732c4e59e9babd0553097de7367d0d56425; comparison B5 tại `candidates/B5.png` + prompt/source, primary B7 tại `toB.png`. Thread orientation PR798 giữ OPEN/unfixed; đổi candidate để owner xem không tự resolve. Tổng A2+B7+N1=10, không reset. N pilot failed ngoàiGit, không mapping riêng.
