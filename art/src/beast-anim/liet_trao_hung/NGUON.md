# Liệt Trảo Hùng — raw H4, Part of #768 / #766

LỖI: toA — nền không phẳng FF00FF; hướng SE/E chưa tách rõ; hurt quay đầu/đổi tư thế; nhận diện và pose cần owner soát; mâu thuẫn prompt-static — H1C5-6/H5C5-6/H9C5-6, H5-8/SE, H9-12/E, toàn tờ — RAW đúng size/grid; giữ nộp FAIL, không A2
LỖI: toB — size/heading/grid/nền/hurt/scale chưa đạt; mâu thuẫn prompt-static — 1254×1254 thay1024; NE H4C2–4, N H8C1–4; H4C5–6; H1/H5C5–6 — death xoay E/front, bleed1029/1203 pixel, hurt nâng thân/yaw; loop/cỡ thân so A chưa QA.

A1 từ fresh92: một builtin call, không retry. 1024×1536, nguyên byte. Model/seed unknown, không size selector. Exact prompt và metadata thực ở toA.prompt.txt/toA.source.json. B1 fresh94 một call, không retry:1254×1254 thật thay1024×1024 yêu cầu,FAIL size. RAW nguyên byte/prompt thực/nguồn ở toB.png,toB.prompt.txt,toB.source.json. Tổng A1+B1=2calls. Không có A2/B2.

## Lỗi/nguồn cần owner kiểm
A nhìn bằng mắt có66hình/6ôblank, chưa xem motion. Nền gần magenta biến thiên, không FF00FF phẳng; hurt H1/H5/H9 C5–6 ngửa/quay đầu/đứng cao, không recoil rõ. SE H5–8 gần E; E H9–12 còn3/4front. Palette sáng/cartoon hơn static nâu sẫm, vuốt dài chưa rõ đều.

Static front/back đứng hai chân, forepaws free, side crouched; base quad/four-legged trot mâu thuẫn. Giữ source/base và exact clarification lịch sử thật, không tự redesign hoặc suy owner đã chốt anatomy. Candidate được nộp kể FAIL theo user, không art/runtime acceptance, không autoimport/cutter/resize/postprocess.

## B1 và ref consistency
B94 dùng ordered static durable backup+A92A1 style/body-size candidate. Giữ identity nâu/vai/vuốt theo static, không coi A pose là được duyệt. A/B có biến thiên độ thon/nét/màu; không xác nhận absolute body size/loop/identity nhất quán. N H5–7 phần lớn rear nhưng die H8 đổi hướng; NE H4C2–4 về E/front; hurt nâng thân thay recoil rõ.

QA64 chỉ đọc trên lưới6×8/1254:44 hình semantic bằng mắt,46ô cópixel; H4C5/C6=1029/1203 ngoài nền theo alpha≥128,bg R>200 G<70 B>200;H8C5/C6=0. N block lấn blank hàng4; không được gọi44ô sạch. Nền góc biến thiên gầnmagenta, khôngFF00FF phẳng. Không cắt/dựnganimation/sửaảnh để QA.

User chỉ thị forward-only: ảnh FAIL vẫn nộp cho owner kiểm sau15đợt. Không retry FAIL, không tựwaive1024/heading/grid, không autoimport/gameplay/static/cutter. Đủ raw không có nghĩa artaccepted; whole768 chờ owner.

Metadata cuối94 đã đối chiếu refs/hash/header/bytes/UTC; QA94 ghi B NE idle cao124px so A SE104–105px, B N khoảng130px so A S108px (khác hướng nên so gần đúng, không acceptance). Cùng hồ sơ lưu hai cách đo occupancy riêng, không trộn ngưỡng.
