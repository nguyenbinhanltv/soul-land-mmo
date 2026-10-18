# Rừng Săn Hồn – Tài liệu thiết kế

> File này để con người và AI cùng đọc. Mỗi khi nhờ AI thêm tính năng, hãy bảo nó đọc file này trước
> và cập nhật lại khi luật chơi thay đổi.

## Ý tưởng
MMO thế giới mở pixel 2D. Người chơi thức tỉnh võ hồn, tu luyện, vào rừng săn hồn thú để đoạt hồn hoàn.
Tên trong game là tên tự đặt, lấy cảm hứng từ thể loại "săn hồn", không dùng nhân vật hay địa danh có bản quyền.

## Luật cốt lõi (đã làm)
- **Thức tỉnh**: server ngẫu nhiên 1 trong 5 võ hồn và hồn lực bẩm sinh cấp 1–10 (4% ra cấp 10). Cấp khởi đầu = hồn lực bẩm sinh.
- **Bình cảnh**: cứ đến cấp 10, 20, 30… là kinh nghiệm dừng lại. Phải hấp thụ hồn hoàn thứ N mới lên tiếp.
- **Niên hạn hồn thú**: 10 / 100 / 1.000 / 10.000 / 100.000 năm, màu hồn hoàn trắng / vàng / tím / đen / đỏ.
- **Giới hạn hấp thụ**: vòng 1 tối đa 100 năm; vòng 2–3 tối đa 1.000 năm; vòng 4–6 tối đa 10.000 năm; vòng 7+ tối đa 100.000 năm.
  Vượt 1 bậc: 60% thất bại (mất 70% máu, hồn hoàn tan). Vượt 2 bậc: không cho hấp thụ.
- **Hấp thụ**: mất 2,5 + 0,8 × tier giây. Di chuyển hoặc bị đánh là hủy.
- **Hồn hoàn rơi**: 15 giây đầu chỉ người hạ hồn thú hấp thụ được, tồn tại 60 giây.
- **Hồn kỹ**: vòng 1–4 lần lượt mở Hồn Bạo, Thiểm Kích, Hồn Tiễn, Hồn Vực. Sức mạnh nhân theo niên hạn của vòng đó.
- **Chết**: mất 30% kinh nghiệm hiện tại, hồi sinh ở doanh trại sau 2,5 giây.
- **Vùng**: bản đồ chia vùng theo chiều đông, càng sâu càng mạnh (định nghĩa trong layer `zones` của Tiled).

Mọi con số cân bằng nằm trong `shared/data.ts`.

## Kiến trúc (bắt buộc giữ)
- **Server quyết định mọi thứ.** Client chỉ gửi ý định: `input {x,y}`, `attack`, `skill {i}`, `absorb`, `chat {text}`.
  Không bao giờ để client tự báo máu, sát thương, vị trí hay vật phẩm.
- Trạng thái đồng bộ qua Colyseus Schema (`server/src/rooms/schema.ts`). Hiệu ứng hình ảnh gửi qua `broadcast("fx")`, `"dmg"`.
- Bản đồ là file Tiled dùng chung (`shared/assets/forest.json`). Ô có thuộc tính `collides=true` là vật cản ở cả hai phía.
- Dữ liệu lâu dài lưu trong PostgreSQL (`server/sql/001_init.sql`).

## Lộ trình
- [x] Giai đoạn 1: thức tỉnh, săn hồn thú, hấp thụ hồn hoàn, hồn kỹ.
- [x] Multiplayer cơ bản: thấy nhau, chat, cùng săn, tranh hồn hoàn.
- [ ] Giai đoạn 2: túi đồ (bảng `inventory` đã có), vật phẩm rơi, hồn cốt.
- [ ] Giai đoạn 3: NPC, nhiệm vụ, boss vạn năm có kỹ năng riêng.
- [ ] Lập đội, chia kinh nghiệm; đấu hồn trường (PvP).
- [ ] Dự đoán chuyển động phía client (client-side prediction) để đỡ trễ khi ping cao.
- [ ] Thay sprite vẽ bằng code bằng sprite Aseprite thật.
