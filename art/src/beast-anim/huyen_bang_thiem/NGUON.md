# Huyền Băng Thiềm — raw H4, Part of #768 và #766

Fresh worker `soul-land-mmo-70` sinh duy nhất tờ A bằng builtin `image_gen.imagegen`, hai lượt ngày 2026-10-25 UTC (2026-10-26 giờ Việt Nam), chỉ reference ảnh tĩnh gốc `shared/assets/sprites/beast/huyen_bang_thiem.png` đã xem trước. Worker64 nhận artifact để tích hợp PR #786; không sinh lại trong phiên64. Nguồn ảnh tĩnh giữ nguyên CREDITS hiện có.

## Candidate đã chọn

- `toA.png`: A1, 1024×1536 thực, đúng cỡ yêu cầu; lưới yêu cầu6×12, s/se/e. Nhìn thấy66 hình và H4/H8/H12 C5–6 trống; chưa cắt/phát hoạt ảnh.
- Đã dùng2/2 lượt. A2 có E hurt tốt hơn nhưng lệch hàng/đường neo ô128 rõ, nên chọn A1 để bàn giao. Không tự coi đạt mỹ thuật hoặc runtime.
- `toA.prompt.txt`: nguyên văn prompt thật A1. `huyen_bang_thiem-toA.md`: nguyên hướng dẫn/prompt gốc do script sinh. `toA.source.json`: model/seed unknown, tham số thực, hash/dimensions và output gốc cả hai lượt, prompt hash, suspects và nguồn artifact. Tool không có bộ chọn size/model/seed; không suy ra image model từ model agent.
- Raw A1/A2 cùng exact prompt/provenance gốc giữ tại `/Users/thanhhoa/.ao/data/artifacts/soul-land-mmo-70/`; chỉ A1 nộp vào Git. Worker64 đối chiếu hai lượt nguyên byte với tool original, PNG header/hash và static reference trước tích hợp.
- Không hậu kỳ, cắt, resize, quantize, ghép/copy khung, nắn pixel hoặc sửa metadata. Tờ B do fresh worker72 sinh riêng, chỉ reference static đúng loài + A1 STYLE candidate, chưa duyệt mỹ thuật/runtime.

## Ô nghi lỗi cần owner soát

Hàng/cột tính từ1, chỉ soát raw bằng mắt; chưa nghiệm thu.

- H5 C5 và đặc biệt H9 C5–6: hurt quay gần hướng trước, sai heading; mắt nhắm không đều.
- H12 C1–4: die E còn góc trước3/4, chưa khóa side profile.
- H3/H7/H11 C3–4: kiểm lunge, độ mở miệng và heading.
- H4/H8/H12: collapse có thể chưa đủ ngã ngang.
- Walk thay chân biên độ nhỏ; chưa kiểm vòng lặp theo thời gian.
- Độ chi tiết tinh thể/độ tròn thân có thể khác ảnh tĩnh; cần owner soát identity. Màu chính vẫn pale blue, chưa xác nhận exact palette/nền/viền từng pixel.

A2 không chọn: H2–4/H7–8/H10–12 lệch hàng; H5/H9 C5–6 hurt còn quay trước3/4; H8/H12 C2–4 die và H1 C5–6 mắt cần soát. Dừng đúng2 lượt, worker70 trả slot. Pipeline cắt/preview/nhập game thuộc owner repo, không thuộc phiên này.

## Tờ B từ fresh worker72

- `toB.png`: B2 candidate, chọn lượt 2/2; thực tế 1254×1254, 1997305 byte, khác yêu cầu 1024×1024. Cả hai lượt cùng cỡ; giữ nguyên byte, không resize. Tool không expose image model/seed/size selector.
- `toB.prompt.txt`: exact prompt B2 thực gửi. `huyen_bang_thiem-toB.md`: hướng dẫn/prompt script gốc. `toB.source.json`: provenance hai lượt, outputs gốc, hashes/times/reference/exact prompts/suspects. Prepared prompt bổ sung của64 đến sau hai lượt; không dùng thay exact prompt, không gọi thêm.
- Worker72 view static rồi A1, chỉ sinh B, đã dùng 2/2 builtin calls và trả slot. Worker64 đối chiếu hai raw với original bytes, header/hash, exact prompt hashes và hai reference; A trong PR khớp A1 STYLE candidate, chưa nghiệm thu mỹ thuật/runtime.
- B1/B2 cùng prompts gốc giữ ngoài Git tại `/Users/thanhhoa/.ao/data/artifacts/soul-land-mmo-72/`. B2 được chọn vì hurt N ít quay front hơn B1.
- Nhìn thấy 44 hình, 6×8; H4/H8 C5–6 trống. NE H1–4 vẫn gần E, chưa rõ lưng chéo đi xa; H8 C3 cần kiểm, H8 C4 die N quay mặt trước. Hurt nhẹ, idle/walk ít biến đổi, attack N khiêm tốn; chưa kiểm loop/runtime, chưa đo margin/scale/exact nền/viền.

Không hậu kỳ/cắt/resize/quantize/ghép/copy frame/nắn pixel/sửa metadata. Hai tờ tổng 110 vị trí nhìn thấy; giữ nghi lỗi A phía trên. Owner repo cắt/preview/nhập game và quyết định chất lượng.

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); mỗi loài có tờ phải có ít nhất một dòng.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/huyen_bang_thiem/` | - | ChatGPT / Codex `image_gen.imagegen` (tthoadev, Q44; hoạt ảnh vẽ thật hồn thú H4) | Huyền Băng Thiềm (H4 đợt 2, Part of #768 và #766): `art/src/beast-anim/huyen_bang_thiem/toA.png` (1024×1536, chọn lượt 1 sau 2/2 lượt) và `toB.png` (1254×1254 thực tế, yêu cầu 1024×1024, chọn lượt 2/2); tthoadev / fresh workers `soul-land-mmo-70` (A) và `soul-land-mmo-72` (B) sinh ngày 2026-10-25 UTC (2026-10-26 giờ Việt Nam) bằng builtin `image_gen.imagegen`. A chỉ reference ảnh tĩnh gốc `shared/assets/sprites/beast/huyen_bang_thiem.png`; B thêm A1 STYLE candidate cùng loài, chưa owner duyệt mỹ thuật/runtime. Tool không expose image model/seed/size selector; raw giữ nguyên byte, không hậu kỳ/cắt/resize/sửa metadata. Prompt thật, nguồn/hash/lịch sử từng tờ/ô nghi lỗi: [NGUON.md](src/beast-anim/huyen_bang_thiem/NGUON.md), `toA.prompt.txt`, `toB.prompt.txt`, `toA.source.json`, `toB.source.json` cùng thư mục; raw không chọn giữ artifact70/72. Prepared prompt bổ sung đến sau hai lượt B, provenance giữ exact prompt thực. Nguồn theo Q44 và điều khoản công cụ. | - | Chuyển một lần từ art/CREDITS.md (#973) |
