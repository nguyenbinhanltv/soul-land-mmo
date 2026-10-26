# Lam Lôi Tê Ngưu — raw candidate còn FAIL, Part of #768 / #766

LỖI: toA — heading/hurt/die/motion chưa đạt — S H1C5–6; SE/E H5/H9C5–6, H8/H12C3–4 — recoil/nhắm mắt yếu, die đổi projection, loop/identity/scale chưa QA.
LỖI: toB — size/heading/hurt/scale chưa đạt — B1254×1254 thay1024; NE H4C3–4, N H8C4 — die trôi E, recoil/thrust nhẹ; B1 grid44 nhưng chưa art/runtime/size accepted.

User cho phép nộp cả ảnh fail để chủ repo kiểm sau. Đây là bàn giao RAW, không size/art/runtime acceptance, không tự nhập game. Tool builtin image_gen, model/seed unknown, không size selector. Không resize/crop/cắt/quantize/sửa pixel hoặc metadata PNG.

## Lựa chọn
- toA.png = A74 A2, 1024×1536. Giữ thiết kế theo static; S/hurt còn yaw/nhắm mắt/recoil yếu; early die gần đứng, H8/H12 C3–4 cần kiểm trục đầu/sừng, vòng lặp chưa xem motion.
- toB.png = B80 B1, 1254×1254 thật, yêu cầu 1024×1024: FAIL size, không waiver. Chọn theo content/grid/reference, không lấy latest: B1 giữ N rear, QA có 44 ô chứa pixel và 4 ô trống, NE nhìn lưng rõ hơn các B85; B2/B4 quay mặt trước, B3/B4 có lấn ô trống. B1 vẫn FAIL heading/die/recoil/scale: H4 C3–4 NE die trôi E; H8 C4 cần soát hướng đầu/chân, hurt nhẹ, cỡ thân tuyệt đối so A chưa xác nhận.
- Không thêm ảnh comparison cho B85 vì chưa có ưu thế rõ để thay primary; owner có lịch sử/hash/đường dẫn tất cả lượt trong provenance.json và artifact80/85.
- Mỗi tờ/chunk là fresh worker: A74 A1/A2=2; B80 B1/B2=2; B85 B3/B4=2. Tổng A2+B4=6 calls; không reset, không có B5.

## QA còn fail
- A H1 C5–6: hurt yaw/lean; H5/H9 C5–6: recoil/eyes-shut nhẹ.
- A H4/H8/H12 C1–2: stagger gần standing; H8/H12 C3–4: collapse đổi projection đầu/sừng; walk H2/H6/H10 cần kiểm loop.
- B H1–3: NE còn gần ngang; H4 C3–4 die E; H5 C5–6 hurt nhỏ; H7 thrust away yếu; H8 C4 die cần soát.
- B1 grid chỉ đọc 6×8/PNG1254: H4/H8 C5–6 đều 0 pixel ngoài nền, 44 ô có pixel. Ngưỡng alpha≥128, nền R>200 G<70 B>200; đây là kiểm ô, không chứng nhận ngữ nghĩa/animation.
- B85 B3 H4 C5/C6=825/763, B4=380/293 ngoài nền; 46 ô có pixel không có nghĩa 46 hình. B2/B4 N front bị loại. Không dựng/cắt hoạt ảnh để đo.
- Chưa certify margin, palette chính xác, size theo hướng, điểm chân, identity hoặc độ mượt. Normalizer #810 xử lý đơn vị canvas không sửa heading/pose và không biến việc nộp future1254 thành đạt spec.

## Nguồn
provenance.json lưu nguyên danh tính từng lượt, raw original path, artifact raw/prompt, hash/header/bytes, ordered refs và vai trò. A chỉ static đúng loài; mọi B dùng static+A74A2 làm STYLE/body-size candidate, chưa accepted. Exact prompt của primary ở toA.prompt.txt / toB.prompt.txt. Mọi raw không chọn và prompt thật tiếp tục giữ ngoài Git; chỉ hai primary vào PR. Ảnh tĩnh giữ nguồn CREDITS cũ.
