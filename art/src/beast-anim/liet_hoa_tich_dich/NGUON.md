# Liệt Hỏa Tích Dịch — raw candidate còn FAIL, Part of #768 / #766

LỖI: toA — heading/attack/grid/background/ref consistency chưa đạt — S H3C3–4; SE H7C3/H8C3–4; blank H4C5–6 — nền không FF00FF phẳng, 31/28 điểm heuristic; A87A4 không phải ref sinh B84, pair chưa consistent.
LỖI: toB — size/heading/grid/hurt/ref consistency chưa đạt — B1254×1254 thay1024; NE H4C4, N H7C2–3, blank H4C5–6 — yaw/die lệch;613/597 pixel bleed; historical ref A82A2, không phải primary A4.

User cho phép commit ảnh fail để phía chủ repo kiểm sau. Không size/art/runtime acceptance, không tự nhập game. Tool builtin image_gen, model/seed unknown, không có size selector. Raw được chép nguyên byte, không crop/resize/cắt/ghép/quantize/sửa pixel hoặc metadata PNG.

## Lựa chọn có chủ đích
- Primary toA.png = A87 A4, 1024×1536. Chọn vì S death giữ frontal tốt hơn A82A2/A87A3, đầu/thân thon hơn và gần identity static theo mắt. Vẫn FAIL: H3 contact ở C3 thay storyboard C4, thrust/retract chưa rõ; H7 C3 quay gần front thay SE; H8 C3–4 về profile; hurt yếu; nền/blank không sạch.
- Primary toB.png = B84 B2, 1254×1254 thật thay yêu cầu 1024×1024: FAIL size. N death H8 rear tốt hơn B1, nhưng H7 C2–3 attack yaw NE; H4 C4 NE die gần E; H1/H5 C5–6 hurt nhẹ; cỡ thân tuyệt đối chưa QA.
- Không gọi cặp này consistent. B84 được sinh với A82A2, KHÔNG phải primary A87A4. Provenance generation_reference không viết lại để che lịch sử. A4 theo mắt thon/hẹp và nét khác B84 thân tròn/dày; chưa có size/identity/style QA hoặc runtime chứng minh ghép được.
- Bản so sánh duy nhất candidates/A82A2.png là chính reference lịch sử của B84, nguyên byte, cùng exact prompt và provenance. Nó giúp owner so A4 cải thiện S death với tradeoff reference consistency. Đây không phải primary thứ hai hoặc ảnh accepted. A82A2 vẫn lỗi H1 C6 và H3 C2–4 quay phải, hurt yếu, identity/se cần soát.
- Không đổ mọi attempt vào Git. A82 A1/A2=2; B84 B1/B2=2; A87 A3/A4=2; tổng A4+B2=6 calls. Mọi artifact/raw/prompt không chọn còn giữ; không có A5/B3.

## QA còn fail
- A3 H4 C2–4 die đổi trục E, nên không chọn. A4 S death cải thiện không bù các lỗi SE/attack/background nêu trên.
- Read-only A4 blank 6×12: H4 C5/C6 có31/28 điểm theo heuristic B<180 hoặc R<180 hoặc G>80; bốn blank H8/H12 C5–6 có0 theo heuristic. Tất cả pixel trong sáu blank khác FF00FF chính xác, nền gần magenta có biến thiên; không chứng nhận nền phẳng hoặc blank sạch. Heuristic nhiễu không phải số hình.
- A3 blank heuristic165/135/384/352/0/0 ở H4/H8/H12 C5–6. Giữ trong history, không nắn ảnh.
- Read-only B2 grid 6×8 trên1254: H4 C5/C6 có613/597 pixel ngoài nền; H8 C5/C6=0. Ngưỡng alpha≥128, nền R>200 G<70 B>200. 46 ô có pixel so với44 hình nhìn bằng mắt: N block lấn ô blank hàng4. B1 cũng lấn193/188, không chọn chỉ vì ít bleed hơn do die N còn xoay E.
- Chưa xem loop theo thời gian, không chạy cutter/runtime, không certify cỡ thân, margins, ground line hoặc exact palette. Normalizer không sửa các lỗi heading/pose/reference mismatch.

## Reference và hồ sơ
A82/A87 chỉ đính static gốc đúng loài. B84 đính ordered static+A82A2 STYLE candidate. Primary A4 không tham gia generation B84; provenance.json giữ hash/path/counters thật, source provenance hash và role từng reference. candidates/A82A2.source.json cho owner đối chiếu nguồn của bản so sánh; exact prompts primary ở toA.prompt.txt và toB.prompt.txt. Tham số/schema được giữ theo dữ liệu tool công bố, không suy image model từ model agent.
