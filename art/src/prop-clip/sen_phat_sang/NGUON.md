# Sen Lõi Tinh Đấu nhịp sáng nhẹ

#1551, chủ repo đã duyệt A/B và yêu cầu nhập chính thức ngày 01/11/2026. Chọn clip cánh/nhụy, không thêm đèn. Dùng hợp đồng clip/atlas của #1501 / #1508 / #1513 / #1532 / #1546; không đổi runtime client, collision, vị trí, sắp lớp, mặt nạ hay palette.

Nguồn là `shared/assets/sprites/iso/props/sen_phat_sang.png` đã duyệt: ComfyUI SDXL base 1.0 + pixel-art-xl, hậu kỳ cũ theo dòng `prop_sen_phat_sang` trong `art/CREDITS.md` (giữ nguyên prompt/seed và ghi công gốc). Codex chỉ hậu kỳ pixel bằng code, không gọi model mới, không mở nguồn AI hoạt ảnh khác, không gán CC0. RAW ở đây là ảnh đầu vào hậu kỳ đã duyệt, **chép nguyên byte**, native **32×32**, không phải RAW model sinh mới.

Prompt / chỉ dẫn thao tác thực tế:

> Giữ thân, chân, alpha, palette; chỉ nhịp sáng nhẹ cánh/nhụy sen, vòng 3,2 giây; khung 0 nguyên bản.

| File | SHA256 |
|---|---|
| RAW.png / sen_phat_sang.png | `279139b02358a73587ae90b0efae987a12e7756eb9f4bf9decba383b998f20f6` |
| sen_phat_sang_clip.png | `9c1b300ea036c39b8ed8efe9cb6bf58486bacbd6144388eb6900852e919e6109` |
| sen_phat_sang_clip_n.png | `8259c663a4870cf6f2bc96b5ad6d1f2587f2aa60574b5c4044301300948b1ee9` |

Native size, prompt và hash cũng ở `nguon.json`. `mat-na.png` khóa đúng pixel cánh/nhụy được phép đổi. Chỉ màu vàng/xám sáng ở y ≤ 21 được nâng một bậc từ chính palette gốc; phần xanh và viền giữ nguyên. 32 pha × 100 ms theo `(1 − cos(2πn/32))/2`, chia ngưỡng theo vị trí pixel; pha 0 trùng ảnh tĩnh, mối nối vòng không nhảy. Không dịch hình hay đổi alpha. Normal là normal gốc lặp nguyên pixel qua 32 pha, không làm khối sen phập phồng theo sáng.

Tái tạo ứng viên ngoài repo: `node tools/assets/sen-preview.mjs <thư-mục-tạm>`. Nhập từ hồ sơ này: `node tools/assets/sen-import.mjs`. Lệnh nhập tái tạo và so SHA256 clip với bản đã duyệt, kiểm RAW trước khi ghi; không ghi đè RAW khác byte. Chân `[16,28]`, key `prop_sen_phat_sang_clip`, khung 32×32, dải 1024×32. Giảm chuyển động / mức Thấp dùng khung 0; camera rời chunk gỡ clip, đổi bản đồ hủy ảnh cũ theo đường hiện có.
