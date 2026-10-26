# Lôi Văn Hầu — RAW H4 #769

Part of #769, Part of #766. Hiện 2/10 tờ của batch: A1 (fresh session93) và B1 (fresh session95), mỗi tờ đúng một builtin call. Nộp cặp RAW kể cả FAIL, issue tiếp tục Đang làm; submitted không phải accepted/merged/imported.

Sinh ngày 2026-10-26 bằng builtin `image_gen.imagegen` trong fresh session 93, đúng một call, không retry. Model ID và seed không được công cụ cung cấp; không lấy tên agent làm model ảnh. Ảnh yêu cầu và IHDR thực tế đều 1024×1536. RAW giữ nguyên byte công cụ, bản repo và artifact cùng SHA-256; không hậu kỳ, cắt, resize hoặc sửa metadata. Chi tiết byte/hash/input/output/time window: `toA.source.json`; prompt thực: `toA.prompt.txt`; prompt script A/B được giữ nguyên trong hai file `.md` cùng thư mục.

Reference duy nhất là ảnh tĩnh gốc đúng loài `shared/assets/sprites/beast/loi_van_hau.png`, đã xem trước khi gọi. Template script là quad / trot bốn chân nhưng static là vượn tay dài; giữ nguyên cả hai đầu vào, không tự chốt anatomy hay thiết kế lại. B1 đính kèm static gốc trước rồi A1 sau, chỉ dùng A1 làm style/cỡ thân; không lấy hurt/death sai làm mẫu. A1 là style-only candidate còn lỗi, chưa được owner duyệt mỹ thuật.

LỖI: toA — hướng chết / xoay đầu / hurt / style — H4,H8,H12 C3–4; H1,H5,H9 C5–6; s/se/e — chết quay ngang, hurt ngửa hoặc nghiêng đầu và giật lùi chưa rõ; nét/tỉ lệ đơn giản hóa so với static.

Quan sát toàn tờ cho thấy bố cục giống 6×12, nền hồng và sáu ô cuối của các hàng chết để trống. 66 khung có hình và 6 ô trống là yêu cầu prompt, chưa kiểm đếm ngữ nghĩa từng khung; không suy từ pixel occupancy. SE có mặt chéo trước nhưng hướng trong hurt/die chưa ổn định. Không khẳng định nền mọi pixel đúng FF00FF, hướng/khung/anatomy/loop đạt. Không thấy chữ hay đường lưới ở mức xem toàn tờ. Chủ repo chốt mỹ thuật sau; technical review chỉ xác nhận file và provenance.

Nguồn/giấy phép: ảnh sinh bằng công cụ ChatGPT/Codex theo Q44 và chính sách repo (`docs/art/nguon-giay-phep.md`); không phải asset ngoài CC0, không tự gán giấy phép CC cho output AI. Reference là ảnh dự án hiện có, giữ ghi nguồn gốc trong `art/CREDITS.md`. Chưa nhập game; không sửa runtime, static, manifest, client, server hoặc cân bằng.

## Tờ B — bàn giao từ session95

B1 yêu cầu 1024×1024, IHDR thực tế **1254×1254**, 1.991.633 byte, SHA-256 `d5dc0a2796b9853423107b905ce9c69bad626d5dbbdb8f6083f3abe3711774ad`. Một call duy nhất, không B2/retry; original tool output, artifact95 và `toB.png` đã so khớp byte/hash. Không sửa ảnh hay chuẩn hóa kích thước. Model ảnh/seed unknown do tool không cung cấp. Exact prompt `toB.prompt.txt` giữ nguyên base tiếng Anh rồi nối câu match/same body và clarification; hash/refroles/thời gian/counters/tool truth cùng nguồn upstream ở `toB.source.json`.

LỖI: toB — sai kích thước, nền không phẳng FF00FF, hướng/pose và tràn ô trống — H1–4 NE; H5/H7/H8 N; H8 C5 — RAW 1254×1254; NE nhiều khung nghiêng ngang E/lộ mặt, N hurt H5 C5 ngửa mặt, attack H7 C1–2 lệch NE, die H8 C2–4 quay ngang/lộ mặt; H8 C5 có 139 pixel thân theo ngưỡng chẩn đoán.

Bố cục nhìn khoảng 6×8; 44 occupied/4 blank là yêu cầu, không phải số frame hợp lệ đã chứng nhận. Số ô theo pixel trong provenance95 chỉ là chẩn đoán, không được diễn giải thành số sinh vật/frame. 139 pixel tại H8 C5 là theo ngưỡng R<160 hoặc B<140 hoặc G>90 của session95; không phải phép phân đoạn ngữ nghĩa. Bốn góc nền trong nguồn có RGB khác FF00FF. Quan sát thấy NE lộ mặt/gần ngang E, N hurt ngửa mặt, attack/death lệch hướng; hurt NE chưa giật lùi rõ. Cỡ thân so với A và loop chưa được chứng nhận. Static/template vẫn có mâu thuẫn quad/vượn như đã ghi; không suy rằng owner chốt anatomy. Chỉ nhận RAW/provenance kỹ thuật; chủ repo quyết định mỹ thuật/nhập game sau.
