# Danh Hiệu P4b — Khung và đầu (#1777)

12 PNG cuối để bàn giao, chưa đăng ký manifest hoặc nhập game. Nguồn là concept Codex đã duyệt ở `art/src/danh-hieu-1770/danh_hieu_concept.png` (#1771), theo Q56; không lấy ảnh ngoài. Điều khoản đầu ra OpenAI, không CC0. Prompt và RAW gốc giữ ở hồ sơ #1770; không sinh lại bằng model ở lô này.

- `danh_hieu_khung_1`…`_6`: 128×32, nine-patch L8 / T13 / R8 / B11. Vùng chữ `[8,11,112,13]`, không kéo chữ cùng ảnh. Chiều rộng tối thiểu 32 px, chiều cao tối thiểu 25 px; đề nghị giữ cao 32 px và chỉ kéo ngang.
- `danh_hieu_dau_1`…`_6`: 36×32, đầu trái. Đầu phải dùng đúng ảnh này lật ngang, không có ảnh vẽ lại. Với khung rộng W đặt tại (0,0), đầu trái ở (-32,0), đầu phải ở (W-4,0). Đầu phủ 4 px lên khung; canvas ghép rộng W+64. Không trim riêng ảnh vì sẽ đổi điểm neo.
- Rail lấy nguyên cột x=80 của mỗi hàng concept, cạnh đứng dùng màu rail gốc. Đầu lấy nguyên vùng x=0…35. Không nội suy, không thêm glow mềm; alpha chỉ 0/255. Vùng kéo ngang x=8…119 phẳng từng hàng; vùng kéo dọc y=13…20 phẳng từng cột.
- `nguon.json`: SHA256 nguồn và 12 đầu ra, kích thước, màu hữu hình, vùng cắt, thông số bàn giao. Sáu hướng màu đúng bảng trong `docs/design/danh-hieu.md`.
- Đối chiếu 1× / 3×, nền sáng / tối, ba chiều rộng khung 96 / 128 / 192 px ở `danh_hieu_doi_chieu.html` trong artifacts phiên AO `soul_land_game-1042`. Trang dùng chữ hệ thống để thử bố cục; phông game và renderer sẽ được kiểm khi nhập ở P2/P3.
- Tự kiểm: 12 PNG hợp lệ, alpha nhị phân, rail và vùng kéo dọc phẳng, SHA256; xem bản ghép 3× để kiểm nét, vùng chữ và đối xứng. Không thay renderer, dữ liệu hay luật chơi.
