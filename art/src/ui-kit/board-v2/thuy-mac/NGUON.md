# BOARD v2 — Thủy mặc–Chu sa (nháp chờ duyệt)

Part of #877. Ảnh duy nhất từ Codex builtin `image_gen.imagegen`, ba lượt; không dùng API/CLI hay asset bên thứ ba. Model ID và seed không được công cụ cung cấp. Quyền sử dụng theo điều khoản OpenAI; không gán CC0. Phạm vi nhiệm vụ chỉ `art/src/ui-kit/`, nên nguồn ghi tại đây.

Prompt nguyên khối do `npm run ui:prompt -- --kind BOARD --style thuy-mac --out <thư mục tạm>` sinh, không viết tay, không addendum, không tham chiếu ảnh lỗi. Không đính ảnh tham chiếu: ảnh hiện trạng là tùy chọn trong hướng dẫn BOARD. BOARD cũ chỉ dùng để so sánh sau sinh.

Ảnh RAW giữ nguyên byte, không resize, lượng tử, cắt hay chỉnh sửa. Hash, đường dẫn đầu ra gốc, prompt và kết quả từng lượt ở `source.json`. `BOARD.prompt.txt` là prompt thực gửi của lượt chọn; `BOARD.md` là hướng dẫn do công cụ sinh trước lượt đó. Bài học sau lượt 3 chỉ dành cho lần sau, không có trong prompt đã gửi.

| Lượt | ui:check chặn / nhẹ / cảnh báo | Kiểm mắt | Chọn |
|---|---|---|---|
| 1 | 0 / 0 / 0 | Đủ HUD, hai bảng Mực, Giấy, hotbar, Xếp Hạng; làng tràn nền hồng, kim loại và vân dày | Không; `candidates/` |
| 2 | 0 / 0 / 0 | Cảnh khép trong khung; nhiều điểm sáng và chốt ngọc, còn thiên kim loại | Không; `candidates/` |
| 3 | 0 / 0 / 0 | Khung gọn hơn, giảm chốt ngọc; dấu son có nét giống ký tự, còn viền ánh đồng và nhiều điểm nhấn | Có; `BOARD.png` |

Chọn lượt 3 theo mắt khi cả ba cùng số lỗi công cụ; dừng đủ ba lượt. Không coi đây là duyệt mỹ thuật hay tờ đạt để cắt/nhập game. `ui:check BOARD` chỉ kiểm cỡ/tỉ lệ: cả ba 1536×1024, không sinh tờ liên hệ hay dòng `LỖI:`. Không suy ra 32 màu, cạnh phẳng hoặc tương phản từ kết quả này.

LỖI: BOARD — kiểm mắt: dấu son có nét giống ký tự (cần bỏ nét trước khi làm kit); viền vẫn còn ánh đồng thay vì hoàn toàn nét cọ/mực đá; nền làng và vân giấy hơi chi tiết; nhiều điểm nhấn (chân dung, HUD, Xếp Hạng, hotbar) nên chưa đạt một điểm sáng duy nhất; chỗ trống giữa các bảng hẹp hơn yêu cầu 5%. Chưa đạt sạch lỗi mỹ thuật, cần chủ repo xem hướng và quyết định bước tiếp.

Trang so sánh với BOARD cũ #940: `C:/Users/PC/.ao/data/artifacts/soul_land_game-697/board-v2-thuy-mac/index.html`. BOARD cũ không thay đổi. Không sửa client, manifest hoặc token; không nhập game, không merge.
