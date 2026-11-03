# Concept Danh Hiệu P4a — #1770

- Nguồn: Codex builtin OpenAI `image_gen.imagegen`, 03/11/2026. Không dùng ảnh tham chiếu ngoài; model ID và seed không được công cụ trả về.
- Giấy phép: điều khoản đầu ra OpenAI, không gán CC0. Prompt nguyên văn ở `danh_hieu_concept.prompt.txt`; RAW nguyên byte 1672×941 ở `danh_hieu_concept_raw.png`; SHA256 và tọa độ cắt ở `nguon.json`.
- Tờ duyệt: `danh_hieu_concept.png`, 192×224, sáu hàng 192×32; hàng cuối chứa mẫu hạt lửa / tia sáng và hướng bốn pha clip. Sáu bảng màu: đồng tối → lục → lam → tím nung → cam → đỏ vàng.
- Hậu kỳ bằng `Img`, `readPng`, `encodePng` trong `tools/assets/lib.mjs`: lấy mẫu nearest tại tâm pixel theo `bounds` trong JSON, ngưỡng alpha 128, lượng tử kênh bước 17 rồi k-means 24 màu/bậc (12 vòng, tâm khởi tạo đều theo độ sáng). Lật nửa trái sang phải; không làm nhòe hoặc nội suy.
- Đường cắt nine-patch đề xuất x=36/156, y=6/26; vùng chữ x=40…152, y=8…24. Chỉ là concept: P4b cần tách đầu riêng, làm phẳng rail và vẽ clip thật; chưa đăng ký manifest, chưa thay renderer.
- Tự kiểm: 192×32 từng khung, alpha chỉ 0/255, đối xứng chính xác, 24 màu hữu hình/bậc; tên thật trong `TITLES` từ Hồn Sĩ tới Phong Hào Đấu La ở 1x/3x, nền sáng/tối. Phông chính Galmuri 9 tại 10px, mẫu đối chiếu Be Vietnam Pro tại 10px. Giữ nguyên nguồn font/ô nền của repo.
- Trang đối chiếu tự chứa ở artifact phiên AO `soul_land_game-1039`: `danh_hieu_doi_chieu.html`. Có nút vùng chữ và dừng chuyển động; ưu tiên giảm chuyển động của hệ điều hành. CSS chỉ minh họa nhịp, không phải clip đã hoàn thiện.
- Chỉ concept P4a; bộ đầy đủ và nhập game thuộc PR sau. Không xác nhận chủ repo đã duyệt mỹ thuật.
