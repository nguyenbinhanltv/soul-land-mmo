# Pháp tướng Codex: kết quả thử và đề xuất (#1160)

**Part of #1160, epic #1020 — 2026-10-29.** Chưa có đường hoạt ảnh đạt trong lô thử Hạo Thiên Chùy; đề nghị giữ bộ đang chạy và chưa mở rộng 10 võ hồn còn lại. Không dùng PixelLab. Đây là kết quả thử có giới hạn, không phải kết luận Codex không thể làm hoạt ảnh.

| Cửa duyệt | Kết quả | Bằng chứng |
|---|---|---|
| Phạm vi nguồn cũ | Đạt | 11 recipe dùng code idle/attack; 14 bộ còn lại có 40 khung idle nguồn mỗi bộ, giữ nguyên |
| Concept lượt 1 | Chưa đạt | Máy báo NHẸ; mắt loại vì vẽ người đá cầm búa |
| Concept lượt 2 | Chưa đạt | Chỉ sửa chủ thể thành búa; RAW bị CHẶN vì tách thành 7 hướng do đá rời; pixel cũng không tách đủ 5 |
| Concept lượt 3 | Đạt kỹ thuật, đủ thử chuyển động | Chỉ giảm chi tiết rời: RAW NHẸ, 5 hướng, lệch cao 1,02×; pixel ĐẸP, 800×160, 37/48 màu, giữ 6/6 đốm sáng |
| Attack s, lượt 1 → 3 | Chưa đạt bằng mắt | Lượt 1 nhảy neo, đổi tỉ lệ; lượt 2 cố định neo vẫn làm ngắn cán ở khung nện; lượt 3 giảm quỹ đạo vẫn quay mặt trước sang 3/4, thiếu nhịp nện |
| Idle 8 / tuyệt kỹ 6 / bốn hướng attack khác | Chưa thử | Không nhân rộng khi chuỗi attack s chưa đạt |
| 10 võ hồn còn lại | Chưa đạt, chưa thử | Giữ cửa Hạo Thiên Chùy trước |

**Cách thử:** Codex/OpenAI `image_gen`, prompt từ `vohon-prompt.mjs --type phaptuong --id hao_thien_chuy`, yêu cầu alpha; không dẫn ảnh cũ. Ba lượt concept, ba lượt attack dẫn từ concept mới. Chạy `vohon:check raw`, `vohon-pixelize.mjs`, duyệt mắt theo [phong cách v2](vo-hon-phong-cach.md). Mềm/lệch lưới RAW chỉ là NHẸ. Concept chưa được duyệt nhập game.

**Đề xuất:** tách lô công cụ kiểm chuỗi từng hướng: cắt ô không tự căn từng khung; chung tỉ lệ/bảng màu/neo; xem nối cuối–đầu, chồng hồn sư ×2/×3 trên nền sáng/tối. Thử lại riêng attack s bằng khung dẫn có neo. Chỉ nhân rộng khi giữ chiều dài cán, đầu búa, mặt hướng và nhịp lấy đà–nện–thu; không tính biến đổi ảnh tĩnh là hoạt ảnh vẽ thật.

**Tích hợp:** [công thức hiện hành](phap-tuong-cong-thuc.md), `tools/assets/lib.mjs` chỉ có idle 8 + attack 8. Tuyệt kỹ 6 cần đường nhập/kiểm và ánh xạ riêng trong lô code. Chuyển động theo [đặc tả Hạo Thiên Chùy](ky-nang/hao-thien-chuy.md); đất nứt/bụi/đá là hiệu ứng riêng. PR docs không đổi asset game, không chốt đường thay thế.
