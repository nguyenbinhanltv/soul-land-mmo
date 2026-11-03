# Danh Hiệu P4b — Bảy biểu tượng nhóm (#1777)

Nguồn: Codex builtin OpenAI `image_gen.imagegen`, 03/11/2026, mỗi nhóm một lời gọi; không dùng ảnh tham chiếu ngoài. Điều khoản đầu ra OpenAI, không CC0; công cụ không trả model ID hoặc seed. Prompt nguyên văn ở từng `danh_hieu_nhom_*.prompt.txt`; hash RAW và đầu ra, vùng cắt và cách chuẩn hóa ở `nguon.json`. Theo Q17 và quyết định điều phối cho #1777 (tránh tăng nguồn art trong git, #1061), RAW giữ ngoài repo tại `C:/Users/PC/.ao/data/artifacts/soul_land_game-1042/danh-hieu-raw/`; từng `raw.path` tương đối với `rawRoot` trong JSON. Gói bàn giao `danh_hieu_raw.zip` ở cùng thư mục artifacts của phiên chứa bảy RAW nguyên byte và script tái dựng. Không cần RAW để dùng PNG cuối.

| Key | Nhóm | Hình nhận diện |
|---|---|---|
| `danh_hieu_nhom_cap` | Cấp | Ba bậc ngọc và ngọn hồn hỏa trắng ngà |
| `danh_hieu_nhom_thanh_tuu` | Thành Tựu | Vòng nguyệt quế vàng, ngọc đỏ |
| `danh_hieu_nhom_xep_hang` | Xếp Hạng | Vương miện ba chóp, ngọc đỏ |
| `danh_hieu_nhom_su_kien` | Sự Kiện | Đèn lồng đỏ, tua vàng |
| `danh_hieu_nhom_tong_mon` | Tông Môn | Ấn ngọc lục và hai kiếm chéo |
| `danh_hieu_nhom_san_boss` | Săn Boss | Đầu thú sừng ngà, mắt cam |
| `danh_hieu_nhom_bi_an` | Bí Ẩn | Cuộn cổ thư tím, niêm phong ngà |

Mỗi PNG 32×32, hình nằm trong vùng tối đa 28×28 giữa canvas, alpha chỉ 0/255, tối đa 24 màu hữu hình. Cắt hộp alpha ≥128; lấy nearest tại tâm từng điểm ảnh, không nội suy; k-means 24 màu 12 vòng khởi tạo xác định. Màu kim loại cổ, ngọc và lửa đồng bộ hướng tiên hiệp rực lửa của concept #1770 đã duyệt #1771. Các nhóm phân biệt bằng silhouette, không chỉ màu.

Tự kiểm: bảy PNG có nội dung, kích thước/lề, alpha, màu, SHA256; xem montage 3× sáng/tối. Trang tổng hợp `danh_hieu_doi_chieu.html` ở artifacts phiên AO `soul_land_game-1042` có 1×/3×. Đây là ảnh cuối để bàn giao, chưa đăng ký manifest, chưa nhập vào màn Danh Hiệu hoặc sửa runtime. Khi nhập P3 cần kiểm kích thước hiển thị và tên nhóm bằng phông game.

## Tái dựng đã kiểm chứng

Chạy `node "C:/Users/PC/.ao/data/artifacts/soul_land_game-1042/danh-hieu-raw/reconstruct.mjs" "<thu-muc-repo>" "<thu-muc-ket-qua-tam>"`. Script dùng `tools/assets/lib.mjs` của repo để đọc/ghi PNG; chỉ ghi vào thư mục kết quả được truyền. Công thức lấy mẫu, khởi tạo k-means, xử lý hòa và làm tròn ở `nguon.json.reproduce`. Đã tái dựng đủ bảy PNG và so SHA256 với đầu ra commit: khớp nguyên byte.
