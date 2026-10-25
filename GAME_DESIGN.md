# Rừng Săn Hồn (Đấu La Đại Lục) – Tài liệu thiết kế

> Tài liệu thiết kế **hiện hành** cho người và AI cùng đọc: mô tả luật chơi đang chạy và các quy ước bắt buộc giữ.
> Mọi con số cân bằng nằm ở `shared/data.ts`; tài liệu chỉ mô tả cơ chế và trỏ tới tên hằng / bảng ở đó.
> Luật chơi đổi thì sửa đúng mục tương ứng (không viết nhật ký thay đổi ở đây; lịch sử nằm trong git và các PR).
> Code trích dẫn tài liệu bằng số mục ("mục 5.3", "mục 6 "Nhiều kênh"") nên giữ nguyên số và tên các mục.

<!-- docs-split:muc-luc:bat-dau -->
## Mục lục: số mục → file

Code và tài liệu trích dẫn theo số mục ("mục 5.3", "mục 6 "Nhiều kênh""). Số mục và tên mục con giữ nguyên trong file đích; bảng dưới cho biết mục nằm ở file nào và từ dòng nào.

| Mục | Tên | File | Dòng đầu | Mục con |
|---|---|---|---:|---|
| 1 | Ý tưởng và phạm vi | [docs/design/00-tong-quan.md](docs/design/00-tong-quan.md) | 5 |  |
| 2 | Nguyên tắc thiết kế | [docs/design/00-tong-quan.md](docs/design/00-tong-quan.md) | 12 |  |
| 3 | Mô hình chơi | [docs/design/00-tong-quan.md](docs/design/00-tong-quan.md) | 21 |  |
| 4 | Luật chung | [docs/design/01-luat-chung.md](docs/design/01-luat-chung.md) | 5 | Điều khiển; Kênh chat; Di chuyển; Giao chiến; Vùng an toàn; Hồi sinh lực và hồn lực; Gục; Đồ rơi và quyền nhặt; Ngày và giờ; Kênh; Thông báo toàn server |
| 5 | Thiết kế các hệ thống | (file này) | – |  |
| 5.1 | Võ hồn và đội hình | [docs/design/vo-hon-doi-hinh.md](docs/design/vo-hon-doi-hinh.md) | 5 | Mỗi võ hồn sở hữu có; hệ; Độ hiếm; Danh sách võ hồn; Võ hồn ngoài danh sách SSR cơ bản; Ràng buộc; Lưu phái đội hình mẫu; Sưu tầm võ hồn; Trong trận; Kinh nghiệm; Chỉ số võ hồn; Danh hiệu |
| 5.1 | Võ hồn và đội hình | [docs/design/trang-thai-buff.md](docs/design/trang-thai-buff.md) | 5 | Trạng thái dùng chung; Hiệu ứng có lợi trên hồn sư |
| 5.2 | Hồn hoàn | [docs/design/hon-hoan.md](docs/design/hon-hoan.md) | 5 | Niên hạn là số năm cụ thể; Hồn hoàn là vật phẩm; Hấp thụ; Hồn kỹ theo vòng |
| 5.3 | Thế giới nhiều bản đồ và hồn thú | [docs/design/the-gioi-ban-do.md](docs/design/the-gioi-ban-do.md) | 5 | Danh sách bản đồ; Cỡ bản đồ; Cổng và chặn mềm; Truyền tống trận; Quy cấp theo niên hạn; Vùng và hồn thú của từng bản đồ săn; Lạc Nhật Sâm Lâm; Hồn thú 10 vạn năm; Rơi đặc trưng theo bản đồ |
| 5.3 | Thế giới nhiều bản đồ và hồn thú | [docs/design/hon-thu-boss.md](docs/design/hon-thu-boss.md) | 5 | Luật chung của hồn thú |
| 5.4 | Bậc hồn thú: thường, tinh anh, thú vương, boss thế giới | [docs/design/hon-thu-boss.md](docs/design/hon-thu-boss.md) | 18 | Bậc hồn thú; Nhận diện; Tinh anh; Tà hóa thú vương; Máu tăng theo số người tham gia; Boss thế giới 100.000 năm |
| 5.5 | Hồn cốt | [docs/design/hon-cot.md](docs/design/hon-cot.md) | 5 |  |
| 5.6 | Hồn hạch | [docs/design/hon-hach.md](docs/design/hon-hach.md) | 5 |  |
| 5.7 | Túi đồ, vật phẩm và tiền | [docs/design/kinh-te-tui-do.md](docs/design/kinh-te-tui-do.md) | 5 |  |
| 5.7 | Túi đồ, vật phẩm và tiền | [docs/design/giao-dien.md](docs/design/giao-dien.md) | 5 |  |
| 5.8 | Địa điểm và NPC | [docs/design/npc-dia-diem.md](docs/design/npc-dia-diem.md) | 5 |  |
| 5.8 | Địa điểm và NPC | [docs/design/nhiem-vu.md](docs/design/nhiem-vu.md) | 5 | Nhiệm vụ tân thủ; Nhiệm vụ chương 2; Hiển thị chuỗi cố định; Nhiệm vụ chương 3; Nhiệm vụ hằng ngày |
| 5.9 | Người chơi lập đội và PvP | [docs/design/to-doi-pvp-dau-truong.md](docs/design/to-doi-pvp-dau-truong.md) | 5 | Tổ đội người chơi; Võ Hồn Dung Hợp Kỹ; Đại Đấu Hồn Trường; Bạn bè; PvP ngoài rừng |
| 5.10 | Cộng minh (giai đoạn cuối) | [docs/design/cong-minh.md](docs/design/cong-minh.md) | 5 | Cộng minh |
| 5.11 | Mỹ thuật: đồ họa isometric, hồn sư, võ hồn, hồn thú | [docs/art/quy-cach-isometric.md](docs/art/quy-cach-isometric.md) | 5 | Mỹ thuật; Phép chiếu và màn hình; Sắp lớp theo độ sâu; Ánh sáng và chiều sâu; Phong cách; Bảng các vùng; Độ tương phản; Bảng màu; Quy tắc vẽ; hướng; Cỡ khung |
| 5.11 | Mỹ thuật: đồ họa isometric, hồn sư, võ hồn, hồn thú | [docs/art/nhan-vat-hon-thu.md](docs/art/nhan-vat-hon-thu.md) | 5 | Hồn sư và phụ thể; Vòng hồn hoàn; Hồn thú; Vùng chiêu trên mặt đất; NPC phụ và dân thường; Bản đồ isometric; Điều khiển; Chân dung và thẻ võ hồn; Tên file, key và thư mục |
| 5.11 | Mỹ thuật: đồ họa isometric, hồn sư, võ hồn, hồn thú | [docs/art/hon-su-lpc.md](docs/art/hon-su-lpc.md) | 5 | Hồn sư = LPC; Hồn sư chế độ Tự tạo; Ngoại hình hai chế độ; Vẽ hồn sư LPC; Màn tạo nhân vật và đổi ngoại hình |
| 5.11 | Mỹ thuật: đồ họa isometric, hồn sư, võ hồn, hồn thú | [docs/art/nguon-giay-phep.md](docs/art/nguon-giay-phep.md) | 5 | Nguồn và giấy phép |
| 5.11 | Mỹ thuật: đồ họa isometric, hồn sư, võ hồn, hồn thú | [docs/art/hon-thu-hoat-anh.md](docs/art/hon-thu-hoat-anh.md) | 5 | Hoạt ảnh vẽ thật của hồn thú (H1) |
| 5.12 | Cảm giác đánh, hiệu ứng chiêu (phần hiển thị) và âm thanh | [docs/art/am-thanh.md](docs/art/am-thanh.md) | 5 | Âm thanh; Âm thanh chiến đấu và hồn thú có tầm; Nhạc nền |
| 5.12 | Cảm giác đánh, hiệu ứng chiêu (phần hiển thị) và âm thanh | [docs/design/ky-nang-combat-phap-tuong.md](docs/design/ky-nang-combat-phap-tuong.md) | 5 |  |
| 5.12 | Cảm giác đánh, hiệu ứng chiêu (phần hiển thị) và âm thanh | [docs/art/ky-nang/README.md](docs/art/ky-nang/README.md) | 1 |  |
| 5.12 | Cảm giác đánh, hiệu ứng chiêu (phần hiển thị) và âm thanh | [docs/art/ky-nang-cong-thuc.md](docs/art/ky-nang-cong-thuc.md) | 1 |  |
| 5.13 | Tự săn (Auto 1, Auto 2) | [docs/design/tu-san-uy-thac.md](docs/design/tu-san-uy-thac.md) | 5 | Tự săn; Ủy thác offline |
| 5.14 | Tông môn | [docs/design/tong-mon.md](docs/design/tong-mon.md) | 5 |  |
| 5.15 | Trang bị hồn sư | [docs/design/trang-bi.md](docs/design/trang-bi.md) | 5 |  |
| 5.15 | Trang bị hồn sư | [docs/tech/trang-bi-cai-dat.md](docs/tech/trang-bi-cai-dat.md) | 5 | Hướng dẫn làm E1–E4 |
| 5.16 | Giao diện Nhân vật + Túi (hai cửa sổ, búp bê 4 tab; theo dõi #453) | [docs/design/giao-dien.md](docs/design/giao-dien.md) | 7 | Giao diện Nhân vật + Túi |
| 5.17 | Radar và bản đồ khu vực | [docs/design/ban-do-khu-vuc.md](docs/design/ban-do-khu-vuc.md) | 5 |  |
| 5.18 | Võ Hồn Chân Thân: pháp tướng (theo dõi #482) | [docs/design/ky-nang-combat-phap-tuong.md](docs/design/ky-nang-combat-phap-tuong.md) | 10 | Võ Hồn Chân Thân |
| 5.18 | Võ Hồn Chân Thân: pháp tướng (theo dõi #482) | [docs/art/phap-tuong.md](docs/art/phap-tuong.md) | 1 |  |
| 5.18 | Võ Hồn Chân Thân: pháp tướng (theo dõi #482) | [docs/art/phap-tuong-cong-thuc.md](docs/art/phap-tuong-cong-thuc.md) | 1 |  |
| 6 | Kiến trúc (bắt buộc giữ) | (file này) | – | Kiến trúc; Server quyết định mọi thứ; HTTP; Lưu của mỗi người chơi chạy nối tiếp |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/giao-thuc-server.md](docs/tech/giao-thuc-server.md) | 5 | Message từ client; Bảo mật; Đăng nhập Google |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/dong-bo-state.md](docs/tech/dong-bo-state.md) | 5 | Đồng bộ xuống client |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/phong-ban-do.md](docs/tech/phong-ban-do.md) | 5 | Một loại phòng cho mọi bản đồ; File Tiled mỗi bản đồ; Bản đồ lớn dựng bằng `tools/maps |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/client-iso-du-doan.md](docs/tech/client-iso-du-doan.md) | 5 | Hiển thị isometric phía client; Dự đoán chuyển động phía client |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/kenh-arena.md](docs/tech/kenh-arena.md) | 5 | Nhiều kênh; Phòng trường đấu |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/luu-tru-cong-phien.md](docs/tech/luu-tru-cong-phien.md) | 5 | Đi qua cổng và lưu vị trí; Mỗi tài khoản một phiên |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/presence-redis.md](docs/tech/presence-redis.md) | 5 | Thông báo toàn server và lịch boss |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/du-lieu-db.md](docs/tech/du-lieu-db.md) | 5 | Dữ liệu trong `shared/data.ts; Dữ liệu lâu dài |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/hieu-nang-hieu-ung.md](docs/tech/hieu-nang-hieu-ung.md) | 1 |  |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/hieu-nang-soak.md](docs/tech/hieu-nang-soak.md) | 1 |  |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/tai-asset-vao-ban-do.md](docs/tech/tai-asset-vao-ban-do.md) | 1 |  |
| 6 | Kiến trúc (bắt buộc giữ) | [docs/tech/soat-gian-lan-dai-dau-hon-truong.md](docs/tech/soat-gian-lan-dai-dau-hon-truong.md) | 1 |  |
| 7 | Lộ trình | [ROADMAP.md](ROADMAP.md) | 5 | Đã có; [ ] NV6 Ảnh nền búp bê; [ ] Giao diện và cảm giác họ C1–C16 |
| 7 | Lộ trình | [docs/lich-su.md](docs/lich-su.md) | 5 | Giai đoạn 10; Đã có; Ảnh tĩnh bằng ComfyUI; Giai đoạn 11; Giai đoạn 12; Tự săn; Việc để sau; Giai đoạn 13; Giai đoạn 14; Nhóm Bản đồ khu vực; Nhóm Hình thái Võ Hồn Chân Thân; Nhóm Hình ảnh kỹ năng combat; Nhóm Hồn sư tự tạo bằng LPC |
| 8 | Câu hỏi còn mở | [ROADMAP.md](ROADMAP.md) | 13 |  |

<!-- docs-split:muc-luc:ket-thuc -->

## 5. Thiết kế các hệ thống

## 6. Kiến trúc (bắt buộc giữ)
**Server quyết định mọi thứ.** Client chỉ gửi ý định và hiển thị. Không bao giờ để client tự báo máu, sát thương, vị trí, tỉ lệ rơi, kết quả hấp thụ, bản đồ hay kênh đích. Ngẫu nhiên (`Math.random()`) chỉ ở server; hàm trong `shared/data.ts` là hàm thuần để client dùng khi hiển thị.

**HTTP** (`server/src/index.ts`): `POST /api/login`, `/api/me` (bản đồ đang lưu, ngoại hình), `/api/looks` (tạo nhân vật lần đầu, miễn phí, cả hai chế độ ngoại hình `preset` / `lpc`, luật `chooseLooks`; đổi về sau qua tin `looks` ở thợ may), `/api/awaken` (lễ thức tỉnh, luật `awakenAccount`; cả hai ở `MapRoom.ts`), `/api/channel` (chọn kênh lúc vào game), `GET /health`, `GET /api/config` (`googleClientId`, null = ẩn nút Google), đăng nhập Google (#612, `server/src/google.ts`): `POST /api/login/google {credential}` (đã liên kết thì token như `/api/login`; chưa thì `needName` + vé ngắn hạn + tên gợi ý), `/api/login/google/create {ticket, name}` (chọn tên nhân vật, cùng luật tên và giới hạn tạo tài khoản mới như `/api/login`), `/api/link/google {token, credential}` (liên kết tài khoản đang đăng nhập; `/api/me` trả `googleLinked`).

**Lưu của mỗi người chơi chạy nối tiếp**
- Mỗi người chơi giữ một promise `saving`; **mọi lần ghi DB về người đó** (lưu định kỳ, `onLeave`, `onDispose`, lưu ngay sau sự kiện quan trọng, transaction đi cổng / đổi kênh, mua bán, nhận thưởng boss) đều nối vào sau promise này (`this.chain(d, fn)`), lỗi được bắt và ghi log để không gãy chuỗi. Không gọi `store.save…` trực tiếp ngoài chuỗi. Nhờ vậy mỗi thời điểm chỉ có tối đa một lần ghi và các lần ghi commit đúng thứ tự đã chụp.
- Dữ liệu chưa lưu mới phải nằm trong cả `save` **và** `saveTravel` (túi đồ: cờ `bagDirty`).
- Lớp chặn trong câu ghi: lưu `map_id` / vị trí theo chu kỳ hoặc khi rời phòng chỉ ghi khi `map_id` trong DB vẫn là bản đồ của phòng này (`UPDATE … WHERE map_id = <mapId của phòng>`).

