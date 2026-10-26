# Thanh Lân Ngạc — RAW H4 đợt 4

Part of #770. Part of #766.

LỖI: toA — sai hướng S/SE/E, hurt chưa recoil rõ, nền chưa phẳng FF00FF, lấn ô trống — H1/H5/H9 C5–6; H7/H11 C6; H9 C1; H4/H8 C5–6 — E H9C1 quay trái, attack H7/H11C6 quay front; ô trống có117/646/19/965 pixel ngoài nền theo ngưỡng; giữ RAW FAIL, không retry.

A1: fresh conversation soul-land-mmo-101, đúng một builtin `image_gen.imagegen` call, không retry. Yêu cầu 1024×1536; PNG thực 1024×1536, 2123584 byte. SHA256: `fa6ee41de8f7bfc5f4c577629b5d24497446d0e0951b6f7c3d561457c9af7742`. Model ảnh và seed: unknown; tool không cung cấp selector kích thước riêng.

Chỉ đính static backup đúng loài, đã VIEW; hash khớp ảnh gốc. Prompt thực là prefix ghi trong source JSON + nguyên khối English từ generator; `toA.prompt.txt` là exact prompt. Doc generator đi kèm giữ nguyên hướng dẫn lịch sử; quy định owner mới không redraw/không hậu kỳ thay thế các câu retry/cutter trong doc đó.

Đếm bằng mắt: 66 hình; 6 vị trí dự kiến trống có 4 ô bị lấn theo phép đo pixel, không xác nhận 6 ô blank sạch. Số pixel từng ô trống và ngưỡng đo ghi trong source JSON; không suy art PASS từ số ô. Hurt H1/H5/H9 C5–6 nâng/quay đầu thay recoil rõ. S attack có khung nghiêng, SE attack và E attack chuyển front ở C6; E H9C1 quay trái. Nền magenta có biến thiên, không toàn bộ nền chính xác FF00FF. Thân/mõm/nét/màu có biến thiên; chưa kiểm vòng lặp hoặc cỡ thân xuyên tờ. Không xác nhận bộ cặp khi B chưa có.

RAW original, bản artifact và toA.png khớp byte; không resize/crop/cutter/assembly/postprocess/metadata rewrite. B và 8 tờ còn lại pending fresh workers do44 điều phối. Nộp nguồn không đồng nghĩa merged, art accepted hoặc imported. Phiên101 dừng sinh ảnh vĩnh viễn sau A1.
