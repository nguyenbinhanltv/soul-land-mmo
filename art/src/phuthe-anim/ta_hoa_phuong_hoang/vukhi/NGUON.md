# Tà Hỏa Phượng Hoàng — đao nhóm cứng, đợt 1

Issue #1357, epic #1020; tham chiếu thí điểm PR #1320. Chưa duyệt mỹ thuật.

## Nguồn và cách tái tạo

Codex / OpenAI `image_gen` tích hợp; năm job tuần tự, mỗi hướng một lượt.
Model ID và seed: `unknown` (công cụ không trả về). Theo điều khoản đầu ra OpenAI, không gán CC0.
RAW nguyên byte ở `<hướng>/attempt1/poses.raw.png`, prompt nguyên văn cạnh ảnh; hash trong `source.json`.
Hướng e sinh mới; s/se/ne/n lấy e làm tham chiếu màu và thiết kế. Không dùng ảnh ngoài.
Atlas riêng không nộm: tám pose; marker xanh ở cuối chuôi. Đỏ thẫm/lõi than, mép cam, hộ thủ phượng và lưỡi lông lửa; không nướng vệt chém hoặc hạt sáng.

```sh
node art/src/phuthe-anim/ta_hoa_phuong_hoang/vukhi/compose.mjs --sources art/src/phuthe-anim/ta_hoa_phuong_hoang/vukhi/sources.json --out <temp>/phuong
node tools/assets/phuthe-import.mjs --id ta_hoa_phuong_hoang --kind vukhi --dir <temp>/phuong/import
node tools/assets/credits.mjs
```

`compose.mjs` cấu hình công thức atlas của #1320 trong thư mục tạm: mã Tà Hỏa, khung128, một tay theo dòng4, giữ góc atlas, cỡ lưỡi tham chiếu40px. Không đổi công cụ chung hay LPC.
Tỷ lệ raster cố định trong mỗi atlas, cap chung0,20; không phóng riêng từng pose. Chọn pose idle0/walk1/attack2,3,6,7/cast6,7/hurt0.
Ghép nam/nữ theo grip đo trực tiếp. ne/n nằm sau thân, vùng nắm chuyển ra trước bằng mặt nạ cutter.

## Kiểm và giới hạn

- Ghép130khung: A≤1,81px,0mép,0chặn hình học. Sau cutter: A≤1,12px,0mép,0chặn;32màu. Báo cáo `final/report.json` và `import/_report.json`.
- Checker có cảnh báo `chan-lech` ở attack/cast do lưỡi hạ xuống dưới chân; cutter có3cảnh báo `co-phu-the` mỗi giới,10ghi chú mỗi giới. Chưa được chủ repo chấp nhận cảnh báo; không kế thừa duyệt từ mẫu khác.
- Một tay là thiết kế của Tà Hỏa (dòng4). **Dùng một tay A ở khung dọc theo quy trình mẫu là điểm lệch so với bảng #19 ban đầu; chủ repo đã xác nhận áp dụng cho rollout qua điều phối soul_land_game-815, checker chuẩn triển khai ở PR #1367.** Bộ này chỉ một grip, không có tay B cần miễn. Sau khi merge main, tái tạo đủ năm hướng và cutter bằng checker chuẩn; hash trong `source.json` ghi nguồn kiểm chứng.
- Ảnh native1600×900 trong `ingame/`: nam/nữ × năm hướng × attack0/100/190/260ms và trang thử idle/walk/attack/cast. Chrome `--mute-audio`, master0/muted=true trước tải trang. Không cắt/resize/ghép ảnh.
- GameScene đăng nhập và thức tỉnh Tà Hỏa qua UI trên server RAM riêng GAME_TEST=1, dừng scene rồi gọi `animatePlayer` thật và đặt khung thân theo mốc. Đây là kiểm renderer, không phải toàn bộ trận giao chiến. Khung đỏ debug và bảng hướng dẫn của game còn trong ảnh.
- Đã tự xem RAW, bảng ghép và ảnh GameScene pha nâng/hạ ở e/n trước khi mở PR. Góc chéo còn cần chủ repo duyệt độ khác biệt và độ đồng đều.

Thân LPC giữ giấy phép theo nguồn hiện có; sheet vũ khí chỉ chứa ảnh sinh, không chứa pixel thân.
