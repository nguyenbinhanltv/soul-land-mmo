# Sáu icon loại sự kiện Lịch Hoạt Động — đã duyệt và nhập chính thức

Closes #1597, PR #1626. Chủ repo đã duyệt cả sáu mẫu, điều phối qua phiên soul_land_game-815 ngày 01/11/2026. Nhập đúng byte 12 bản 24/32px đã duyệt bằng `calendar-icon-import.mjs`, đăng ký manifest qua `validate --register --keep-order`; hiện ở khung giờ và mục cố định của Lịch. Mã lạ hoặc ảnh lỗi giữ chữ; DPR thấp dùng bản 24px, DPR cao dùng bản 32px.

Nguồn: Codex builtin OpenAI `image_gen.imagegen`, 01/11/2026, lượt 1/3. Tham chiếu duy nhất: tờ menu đã duyệt của dự án `art/src/ui-kit/toI-2.png`; không dùng ảnh bên thứ ba mới. Điều khoản đầu ra OpenAI, không CC0. Công cụ không cung cấp model ID/seed.

RAW.png là bản sao **nguyên byte native 1254×1254** từ đầu ra công cụ, nền trong thật. Không resize hoặc mã hóa lại RAW. Prompt thực tế đầy đủ ở prompt.txt.

| File | SHA256 |
|---|---|
| RAW.png | d6e352b4a2e4e37d5586643b7f03e2bb0d1427ce6d4757b3f92b4d13a6b62d39 |
| prompt.txt | c7cadc8e10f6c34e01e2931f7c93272de3418821cd64100cf0f2b06954ef66eb |

Tờ 4×4 đọc từ trái qua phải, trên xuống dưới. Sáu ô đầu là mẫu mới; mười ô còn lại chỉ đối chiếu phong cách, không nhập.

| Ô | Loại | Mã sự kiện có sẵn | Khóa đã nhập (có thêm bản _1x) |
|---|---|---|---|
| 1 | Thú vương tà hóa | king:* | gi_calendar_king |
| 2 | Boss thế giới | world:* | gi_calendar_world |
| 3 | Đại Đấu Hồn Trường | always:arena | gi_calendar_arena |
| 4 | Tự săn | always:auto | gi_calendar_auto |
| 5 | Làm mới ngày | reset:daily | gi_calendar_daily |
| 6 | Làm mới tuần | reset:tong | gi_calendar_weekly |

Tái tạo bản duyệt: `node tools/assets/calendar-icon-candidate.mjs --out <thư mục ngoài repo>`. Công cụ kiểm SHA256 trước khi cắt, chuyển alpha dưới 128 sang hồng trên **bản làm việc trong bộ nhớ** để dùng cutter UI nguyên trạng; RAW không đổi. `cutUiSheet` loại I, soft, rồi `fitFrame` theo mẫu menu cho 32×32 và 24×24. Alpha đầu ra nhị phân, lượng tử theo cutter. Không dùng force, không nới checker, không ghi shared/assets. Cutter không có lỗi chặn; ghi chú nhẹ: một số ô cách nhau dưới 5% cạnh tờ.

Trang `duyet-icon-lich.html` và `so-sanh-icon-lich.png` trong artifacts phiên `soul_land_game-977`: bản 24/32px trên nền Mực/Giấy/caro, đối chiếu menu đã duyệt và ảnh Lịch sau nhập. Thư mục `lich-sau-nhap` chứa ảnh giao diện client thật với dữ liệu dựng thử (không nối phòng game), ba viewport × ba cỡ chữ, gồm 640×360. Credits do công cụ đăng ký ghi đủ 12 dòng; merge main sau #1608 và sinh lại bằng `credits.mjs` theo #1483, không sửa JSON bằng tay.
