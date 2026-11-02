# Cổng B — mái hai tầng (#1722)

Phương án B do Codex tạo bằng OpenAI image_gen.imagegen, chủ repo chọn trước khi nhập. Giấy phép theo điều khoản đầu ra OpenAI, không khai CC0. Chỉ tham chiếu khung 3D tự dựng và ảnh Codex đợt trước, không dùng ảnh ngoài. Hash RAW và sprite tại nguon.json; mô hình và thông số chiếu tại b-*-model.json, b-*-meta.json. RAW lưu ngoài repo trong bộ phương án cổng của phiên.

Phép chiếu sx=x-y, sy=(x+y)/2-z; 16 pixel/đơn vị. Hai trục dựng riêng. Thân chòi cao 6,8 đơn vị, mái ngói nâu đỏ hai tầng, vòm dày có huy hiệu, cửa gỗ bọc sắt mở hé 15° trong khung vòm và chạm ngưỡng đá. Chân X [56,179] → [200,251], chân Y [184,171] → [56,235]; khoảng cách hai chân giữ nguyên. Không đổi bố cục hoặc ô chặn.

Ảnh khóa silhouette theo mô hình, đưa về bảng màu vùng bằng tools/assets/iso-build.mjs prop ... --map nac_dinh_thanh --foot-x 192. Normal map sinh bằng tools/assets/normal.mjs; atlas bằng tools/assets/iso-atlas.mjs. Không sửa tay file sinh. Hai sprite nhập trùng SHA-256 bản B được chọn.
