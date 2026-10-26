# Lôi Văn Hầu — RAW H4 #769

Part of #769, Part of #766. Hiện 1/10 tờ của batch, chỉ có A1; B chưa sinh. PR giữ nháp, issue tiếp tục Đang làm.

Sinh ngày 2026-10-26 bằng builtin `image_gen.imagegen` trong fresh session 93, đúng một call, không retry. Model ID và seed không được công cụ cung cấp; không lấy tên agent làm model ảnh. Ảnh yêu cầu và IHDR thực tế đều 1024×1536. RAW giữ nguyên byte công cụ, bản repo và artifact cùng SHA-256; không hậu kỳ, cắt, resize hoặc sửa metadata. Chi tiết byte/hash/input/output/time window: `toA.source.json`; prompt thực: `toA.prompt.txt`; prompt script A/B được giữ nguyên trong hai file `.md` cùng thư mục.

Reference duy nhất là ảnh tĩnh gốc đúng loài `shared/assets/sprites/beast/loi_van_hau.png`, đã xem trước khi gọi. Template script là quad / trot bốn chân nhưng static là vượn tay dài; giữ nguyên cả hai đầu vào, không tự chốt anatomy hay thiết kế lại. A1 chỉ có thể dùng làm style-only candidate cho phiên B, kể cả lỗi; chưa phải ảnh A đã được owner duyệt.

LỖI: toA — hướng chết / xoay đầu / hurt / style — H4,H8,H12 C3–4; H1,H5,H9 C5–6; s/se/e — chết quay ngang, hurt ngửa hoặc nghiêng đầu và giật lùi chưa rõ; nét/tỉ lệ đơn giản hóa so với static.

Quan sát toàn tờ cho thấy bố cục giống 6×12, nền hồng và sáu ô cuối của các hàng chết để trống. 66 khung có hình và 6 ô trống là yêu cầu prompt, chưa kiểm đếm ngữ nghĩa từng khung; không suy từ pixel occupancy. SE có mặt chéo trước nhưng hướng trong hurt/die chưa ổn định. Không khẳng định nền mọi pixel đúng FF00FF, hướng/khung/anatomy/loop đạt. Không thấy chữ hay đường lưới ở mức xem toàn tờ. Chủ repo chốt mỹ thuật sau; technical review chỉ xác nhận file và provenance.

Nguồn/giấy phép: ảnh sinh bằng công cụ ChatGPT/Codex theo Q44 và chính sách repo (`docs/art/nguon-giay-phep.md`); không phải asset ngoài CC0, không tự gán giấy phép CC cho output AI. Reference là ảnh dự án hiện có, giữ ghi nguồn gốc trong `art/CREDITS.md`. Chưa nhập game; không sửa runtime, static, manifest, client, server hoặc cân bằng.
