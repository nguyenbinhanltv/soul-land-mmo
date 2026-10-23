---
name: playtest-triage
description: Thu phản hồi chơi thử (bạn bè chơi thật, tin nhắn, ảnh chụp, log server), tách thành từng quan sát, phân loại (lỗi / cân bằng / luật chơi / giao diện / ảnh-âm thanh / hiệu năng / gian lận), xếp mức nghiêm trọng, lọc trùng với issue có sẵn, rồi tạo issue GitHub đúng mẫu và nhãn của repo (bug, gameplay, art, am-thanh, bot-test, tai-lieu, san-sang / chan) và đưa vào bảng Project 3. Dùng khi được đưa ghi chú / phản hồi chơi thử, danh sách lỗi người chơi báo, hoặc được nhờ "phân loại lỗi", "tạo issue từ phản hồi".
---

# Phân loại phản hồi chơi thử

Đầu vào thường lộn xộn (tin nhắn, ảnh, "đánh boss thấy kỳ kỳ"). Đầu ra: mỗi quan sát thành **một** issue rõ ràng hoặc được gộp vào issue có sẵn, kèm một bảng tổng hợp. Skill này **không sửa code**; sửa thì nhận issue theo `CONTRIBUTING.md`.

Ý tưởng phỏng theo skill `playtest-report` và `bug-triage` của [Claude Code Game Studios](https://github.com/Donchitos/Claude-Code-Game-Studios) (MIT), viết lại cho quy trình issue / nhãn của repo này.

## 1. Gom thông tin phiên chơi
Ghi cho mỗi nguồn phản hồi (thiếu thì ghi "không rõ", không đoán):
- Người chơi, ngày giờ (giờ Việt Nam: boss có lịch `KING_TIMES` / `WORLD_TIME`), server (local / bản deploy), commit nếu biết.
- Thiết bị: máy bàn / điện thoại, trình duyệt, chuột-phím hay chạm.
- Bản đồ, cấp, võ hồn ra trận, đang làm gì (săn, boss, đấu trường, tổ đội, mua bán).
- Log server quanh thời điểm đó (lỗi, `[perf]` nếu bật), ảnh chụp.

## 2. Tách và phân loại
Mỗi câu phản hồi có thể chứa vài quan sát; tách từng cái.

| Loại | Nhận ra khi | Nhãn | Bước tiếp |
|---|---|---|---|
| Lỗi | sai so với `GAME_DESIGN.md` / code, tái hiện được hoặc có log | `bug` + `gameplay` / `art` / `am-thanh` | mẫu "Lỗi" |
| Cân bằng | luật đúng nhưng số cảm thấy sai (quá dễ, thừa tiền, rơi ít) | `gameplay` | soát bằng skill `balance-review` trước khi đề xuất số |
| Luật chơi / thiết kế | khó hiểu, không vui, muốn đổi cơ chế | `gameplay` + `chan` | chờ chủ repo chốt; không tự sửa `GAME_DESIGN.md` |
| Giao diện, điều khiển | không thấy nút, chữ tràn, chạm khó, thiếu phản hồi | `gameplay` (hoặc `art` nếu là ảnh) | ghi màn hình / cỡ cửa sổ |
| Ảnh, âm thanh | sprite sai hướng / lệch neo, thiếu âm, âm to | `art` / `am-thanh` | trỏ key sprite / file âm |
| Hiệu năng | giật, trễ, máy nóng, mất kết nối | `bug` | đo theo skill `soak-perf` |
| Gian lận, bảo mật | nhân bản đồ, đi xuyên tường, thấy dữ liệu người khác | `bug` | skill `anti-cheat-audit`; xem mục 4 |
| Bot không bắt được lỗi này | lỗi thật mà bot vẫn xanh | thêm `bot-test` | đề xuất bài bot cụ thể |

**Mức nghiêm trọng** (ghi trong thân issue): **S1** sập server / mất hoặc nhân bản dữ liệu / không vào được game; **S2** tính năng chính hỏng nhưng vẫn chơi được; **S3** có cách vòng; **S4** hình thức, chữ.

## 3. Lọc trùng rồi tạo issue
1. Tìm trùng: `gh issue list --state all --search "<từ khóa> in:title,body"` (thử tên gốc và từ đồng nghĩa: "hồn hoàn", "nhặt", "cổng"…). Trùng thì comment bổ sung (thiết bị, lần gặp mới) vào issue cũ, không tạo mới. Đã đóng mà lỗi quay lại: tạo issue mới trỏ tới issue / PR cũ (lỗi hồi quy, ít nhất S2).
2. Thử tái hiện nhanh ở máy mình (`npm run dev:server` + `npm run dev:client`, hoặc hook `test` với `GAME_TEST=1`) nếu rẻ; ghi rõ "đã tái hiện" / "chưa tái hiện".
3. Tạo issue, tiêu đề tiếng Việt, tên gốc Đấu La:
   ```bash
   # Lỗi: theo mẫu .github/ISSUE_TEMPLATE/loi.md (Hiện tượng / Cách tái hiện / Mong đợi / Môi trường), thêm dòng "Mức: S2"
   gh issue create --title "Lỗi: <tóm tắt>" --body-file <file ngoài repo> --label bug --label gameplay
   # Việc mới (cân bằng, cải tiến): theo mẫu viec-lo-trinh.md (Mô tả / Tiêu chí xong / Thiết kế / Ghi chú)
   gh issue create --title "<tên việc>" --body-file <file> --label gameplay --label san-sang
   ```
   - `san-sang` chỉ khi issue đủ rõ để người khác nhận ngay và không bị chặn; chờ quyết định / tài nguyên thì `chan` và ghi chờ gì; cần hoạt ảnh 8 hướng (chờ cách làm bằng ComfyUI, #335) thì thêm `cho-hoat-anh-8-huong` (nhãn cũ `can-pixellab` đã đổi tên). Thuộc giai đoạn Lộ trình thì thêm `giai-doan-N`.
   - Không gắn `dang-lam`, `agent:<tên>` hay tự gán, trừ khi chính mình nhận làm ngay theo `CONTRIBUTING.md`.
4. Đưa vào bảng Project 3 và đặt Status khớp nhãn (`san-sang` → Sẵn sàng, `chan` → Chờ): `gh project item-add 3 --owner nguyenbinhanltv --url <URL issue>` (cần quyền `project` của `gh`). Không có quyền thì ghi vào báo cáo cho orchestrator đồng bộ hộ.
5. Lỗi cần sửa ngay mà Lộ trình chưa có dòng: không tự thêm dòng vào `GAME_DESIGN.md` mục 7; để orchestrator / chủ repo xếp lịch.

## 4. Báo ngay, không chờ tổng hợp
- **S1** và mọi lỗi **gian lận / nhân bản / lộ dữ liệu**: báo chủ repo / orchestrator ngay. Server đang mở cho người ngoài thì issue công khai chỉ mô tả hiện tượng, không ghi cách khai thác từng bước.
- Không ghi mật khẩu, token, key của người chơi hay dịch vụ ảnh vào issue (kể cả trong log dán vào).

## 5. Bảng tổng hợp (trả về chat hoặc comment issue gốc)
```
## Chơi thử <ngày>: <số người>, <bản đồ / nội dung chính>
| # | Quan sát (ngắn) | Loại | Mức | Issue | Ghi chú |
Ưu tiên 3 việc: <issue>, <issue>, <issue>
Chưa xử lý: <quan sát thiếu thông tin, cần hỏi lại ai>
```
