# Danh Hiệu

Danh hiệu là dòng chữ + bảng treo **nổi bật, rực rỡ** đứng trên đầu hồn sư, để **trưng bày** thành tích. Hiện chỉ có danh hiệu theo cấp (`TITLES` / `titleOf(level)` ở `shared/data.ts`, 10 bậc, mỗi 10 cấp, Hồn Sĩ → Phong Hào Đấu La), client vẽ bằng một dòng chữ Phaser vàng (`GameScene.ts`); tự săn thì chữ lục kèm "Tự động". Tài liệu này là thiết kế + lộ trình (epic #1766); **giai đoạn 0 chỉ là tài liệu**, chưa có code. Số liệu nằm ở `shared/data.ts` (tên hằng trong dấu `code` đã có trong code; tên *(đề xuất)* viết không dấu `code` vì chưa tồn tại), tài liệu không chép số.

## 5.25 Danh Hiệu

### Quyết định chủ repo (2026-11-03, ghi ở `docs/quyet-dinh.md` Q56)
1. **Chỉ trưng bày**, không cộng chỉ số ở bản đầu.
2. **Một ô đeo.** Hai ô (tiền tố + hậu tố) để bản sau.
3. **Danh hiệu theo cấp tự đeo mặc định**; người chơi chọn danh hiệu khác thì đổi sang.
4. **Có danh hiệu xếp hạng tuần ngay ở bản đầu**, tự hết hạn khi qua tuần (nguồn: `docs/design/xep-hang.md`, "danh hiệu hiển thị").
5. **Phong cách vẽ: tiên hiệp rực lửa** (không phải thuỷ mặc kim tuyến).

### Mục tiêu và ngoài phạm vi
- Mọi danh hiệu, cũ lẫn mới, **đọc được từ xa, bắt mắt**, bậc càng hiếm càng rực.
- Chỉ ghi nhận cái đã xảy ra ở server; client không báo "tôi đạt X".
- Ngoài phạm vi bản đầu: cộng chỉ số, hai ô đeo, mua / bán / chuyển, tự đặt chữ.

### Mô hình dữ liệu

**TITLE_DEFS** *(đề xuất, `shared/data.ts`)*: mảng định nghĩa, mỗi mục có:

| Trường | Ý nghĩa |
|---|---|
| `id` | chuỗi **ổn định**, không đổi tên sau khi phát hành (ví dụ `cap_1`…`cap_10`, `achv_<mã>`, `rank_<bảng>_top1`) |
| `name` | tên hiển thị tiếng Việt, đúng tên gốc Đấu La |
| `group` | nhóm: `cap`, `thanh_tuu`, `xep_hang`, `boss`, `su_kien`, `tong_mon`, `bi_an` |
| `tier` | bậc hiếm, **6 bậc** (TITLE_TIERS *(đề xuất)*, từ thường tới cao nhất); hai bậc cuối có clip |
| `source` | nguồn mở khoá (mục dưới) kèm tham số (mã `ACHV`, bảng `RANK_BOARDS`, mã boss) |
| `style` | kiểu vẽ (khung, hiệu ứng, hạt; mục "Cách vẽ") |
| `ttl` | hạn dùng: không hạn, theo tuần (xếp hạng) hoặc theo mốc sự kiện |

`TITLES` / `titleOf` giữ nguyên để tương thích; 10 danh hiệu cấp trong TITLE_DEFS tạo từ `TITLES` (không chép chuỗi hai nơi). Có test kiểm `id` duy nhất, `tier` hợp lệ, mọi `source` trỏ tới thứ có thật.

**Bảng SQL `042_danh_hieu.sql`** *(số kế tiếp trên `origin/main` lúc làm)*, chạy lại an toàn, bật RLS:
- `title_owned (account_id, title_id, unlocked_at, expires_at NULL)`: danh hiệu đã mở + hạn dùng (NULL = vĩnh viễn).
- `title_equipped (account_id PK, title_id NULL)`: đang đeo; NULL = dùng danh hiệu cấp mặc định.
- Sửa **cả `PgStore` lẫn `MemoryStore`** (`server/src/db.ts`); ghi DB một người chơi qua `this.chain(d, fn)`.

**Đồng bộ và tin nhắn** (`rooms/schema.ts`, `GameScene.ts`; theo `docs/tech/dong-bo-state.md`):
- Trường **công khai** `PlayerState.titleId` (chuỗi ngắn, mọi người thấy; thực thể ở xa vẫn theo `interest.ts`). Server tự đổi về mặc định khi danh hiệu hết hạn.
- Dữ liệu riêng (danh sách đã mở + hạn) gửi **tin riêng**, không vào state công khai.
- Tin client → server `title {op:"get"|"equip", id?}`: `get` trả danh sách; `equip` **kiểm quyền sở hữu và hạn ở server**, sai thì từ chối; giới hạn tần suất như tin `achv`.
- Server đẩy tin riêng "mới mở" cho banner mừng (không đẩy từng tick).

### Nguồn mở khoá
Mọi mở khoá chạy **chỉ từ sự kiện / trạng thái server**; hàm `grantTitle(account, id)` idempotent (mở lần hai không đổi gì, không kéo dài hạn trái luật).

| Nhóm | Mở khi | Hạn | Ghi chú |
|---|---|---|---|
| **Cấp** (10 bậc cũ) | đạt mốc cấp theo `titleOf` | vĩnh viễn | mặc định, tự đeo; cùng nguồn `ACHV` nhóm Cấp (cấp cao nhất các võ hồn của tài khoản) |
| **Thành Tựu** | nhận thành tựu `ACHV` được gắn danh hiệu (một số bậc cao, không phải tất cả) | vĩnh viễn | gắn qua trường `title` của thành tựu *(đề xuất)*, mục 5.23 |
| **Xếp hạng tuần** | chốt tuần: top 1 / top 3 / top 10 mỗi bảng `RANK_BOARDS` (ngưỡng ở hằng TITLE_RANK_TIERS *(đề xuất)*) | hết khi qua tuần kế; không cộng dồn, mỗi bảng giữ danh hiệu hạng cao nhất | nguồn: `docs/design/xep-hang.md`; chốt cùng lúc với chốt bảng, một transaction |
| **Boss / thú vương lần đầu** | server-first: người (hoặc đội) đầu tiên trên máy chủ hạ boss / thú vương X | vĩnh viễn | ràng buộc duy nhất trong DB theo mã boss chống chạy đua |
| **Sự kiện** | GM / lịch sự kiện (`docs/design/lich-hoat-dong.md`) cấp qua lệnh GM có ghi nhật ký | theo sự kiện | không có đường client |
| **Tông môn** | chức vụ / thưởng tuần tông (`docs/design/tong-mon.md`) | theo chức vụ | tên tông vẫn hiện dưới tên; danh hiệu không thay tên tông |
| **Bí ẩn** | điều kiện ẩn (chuỗi nhiệm vụ, địa điểm) | vĩnh viễn | màn hiện "???" tới khi mở, không liệt kê điều kiện |

Đang đeo danh hiệu vừa hết hạn thì server đổi sang danh hiệu cấp mặc định (không để trống).

### Cách vẽ (bốn lớp)
Phong cách **tiên hiệp rực lửa**: nền tối ấm, viền lửa / kim loại nung, ánh đỏ cam; bậc thấp kiềm chế, bậc cao bừng sáng. Không dùng thuỷ mặc kim tuyến.
1. **Bảng treo nine-patch theo bậc hiếm:** sáu khung `danh_hieu_khung_<bậc>` co giãn theo độ dài chữ; họa tiết hai đầu ghép riêng để chữ dài không méo.
2. **Hiệu ứng bằng code:** quét sáng chạy ngang bảng, nhấp nháy nhẹ viền, hạt lửa / tia sáng bốc lên; cường độ và số hạt tăng theo bậc.
3. **Clip 3–4 khung cho hai bậc cao nhất:** viền / họa tiết hai đầu là hoạt ảnh nhỏ, lặp chậm.
4. **Chữ:** phông Galmuri hiện có, viền tối + bóng màu bậc, đủ dấu tiếng Việt, cỡ đọc được ở tầm nhìn thường.

**Ngân sách hiệu năng** (theo `docs/tech/hieu-nang-hieu-ung.md`, soak ở `docs/tech/hieu-nang-soak.md`):
- Chỉ vẽ danh hiệu của người **trong tầm nhìn**; ra ngoài thì trả về pool.
- **Pool** đối tượng bảng + emitter hạt; không tạo / huỷ mỗi khung hình.
- **Giảm hiệu ứng khi đông:** quá ngưỡng số người trong tầm (hằng TITLE_FX_CROWD *(đề xuất)*) tắt hạt và clip, giữ khung tĩnh; người chơi của mình luôn đủ hiệu ứng.
- Một bảng là một đối tượng ghép sẵn (chữ + khung), không nhiều Text rời; có dòng đo trong bot soak.
- Tự săn vẫn hiện "Tự động" như hiện nay (nhỏ, dưới bảng).

### Giao diện
- Màn **"Danh Hiệu"** trong Hub (thẻ mới, khung **Giấy**, theo `docs/art/ui-kit.md`; chỉ PC theo Q40).
- Danh sách theo **nhóm**, mỗi dòng là bảng treo thật ở đúng bậc; chưa mở thì mờ + ghi điều kiện (trừ nhóm bí ẩn); có hạn thì ghi "còn …".
- **Xem thử trên nhân vật:** ô xem hồn sư của mình đội bảng đang chọn.
- Nút **Đeo** / "Đang đeo"; nút "Về mặc định (theo cấp)".
- **Banner mừng** khi mở danh hiệu mới (khuôn thông báo hiện có) + **chấm đỏ** ở thẻ Hub tới khi mở màn.
- Bảng Xếp Hạng ghi rõ danh hiệu tuần của hạng mình.

### Chống gian lận và kinh tế
- **Không mua / bán / chuyển / tặng** (mục 5.7); luồng danh hiệu không có Hồn Tệ hay vật phẩm nên không tạo nguồn vào kinh tế mới.
- Mở khoá **chỉ từ sự kiện server**; không có tin client nào cấp danh hiệu. `equip` luôn kiểm sở hữu + hạn.
- Hạn tính ở server theo đồng hồ server, không tin client.
- Server-first chống chạy đua bằng ràng buộc duy nhất ở DB. Soát theo skill `anti-cheat-audit`, ghi tài liệu soát danh hiệu (tên *(đề xuất)* `soat-gian-lan-danh-hieu`) ở P1.
- Riêng tư: `titleId` công khai (vốn để khoe); danh sách đã mở chỉ gửi chính chủ.

### Ảnh Codex cần vẽ (tên `danh_hieu_*`)
Vẽ bằng worker Codex theo `docs/art/nguon-giay-phep.md` và skill `asset-gen` (ghi nguồn / giấy phép). **Tờ concept 6 bậc trước**, duyệt xong mới vẽ phần còn lại.

| Tên | Nội dung | Số lượng |
|---|---|---|
| `danh_hieu_khung_1` … `_6` | khung bảng treo nine-patch, 6 bậc hiếm | 6 |
| `danh_hieu_dau_<bậc>` | họa tiết hai đầu (phải lấy từ trái lật) | 6 |
| `danh_hieu_clip_5`, `_6` | clip 3–4 khung cho hai bậc cao | 2 tờ |
| `danh_hieu_hat_lua`, `danh_hieu_hat_tia` | bộ hạt: tia lửa, tia sáng | 2 |
| `danh_hieu_nhom_<nhóm>` | biểu tượng nhóm cho màn Danh Hiệu | 7 |

**Bảng màu theo bậc** (hướng tiên hiệp rực lửa; chốt ở tờ concept):

| Bậc | Hướng màu |
|---|---|
| 1 | đồng tối, chữ trắng ngà, không phát sáng |
| 2 | lục thẫm, ánh ngọc nhạt |
| 3 | lam thẫm, ánh lửa lam |
| 4 | tím nung, viền vàng đồng |
| 5 | cam lửa, viền vàng, hạt lửa |
| 6 | đỏ rực + vàng chói, quầng sáng, hạt lửa dày |

### Lộ trình PR (P1–P6)
Loại A = tự gộp khi CI xanh; B = chủ repo xem trước; C = đề xuất. "AO review" theo `CONTRIBUTING.md` (chỉ việc rủi ro).

| PR | Việc | Phụ thuộc | Làn | Loại | AO review |
|---|---|---|---|---|---|
| P1 | TITLE_DEFS, SQL `042`, `PgStore` + `MemoryStore`, `titleId`, tin `title`, `grantTitle`, test, tài liệu soát | giai đoạn 0 | code | A | **Có** (SQL, giao thức, chống gian lận) |
| P2 | Vẽ bằng code: khung màu tạm 6 bậc, quét sáng / nhấp nháy / hạt, pool, giảm hiệu ứng khi đông | P1 | code | A | Không |
| P3 | Màn Danh Hiệu trong Hub, xem thử, Đeo, banner, chấm đỏ | P1 (P2 để xem thử đẹp) | code | B (xem ảnh chụp) | Không |
| P4 | Ảnh Codex: tờ concept 6 bậc, rồi khung / đầu / clip / hạt / biểu tượng; nhập thay khung tạm của P2 | P2 | nhanh (ảnh) + code (nhập) | B (concept), A (phần còn lại theo quy tắc tự duyệt) | Không |
| P5 | Nguồn: danh hiệu thành tựu, xếp hạng tuần (chốt + hết hạn), boss lần đầu; sự kiện / tông môn khi tới lượt | P1 | code | A | **Có** (chốt tuần, server-first) |
| P6 | Bot nhóm `danh-hieu`, test, soak hiệu năng, soát gian lận lần cuối | P1–P5 | code | A | Có nếu đổi chống gian lận |

Mỗi PR con: đánh dấu `ROADMAP.md`, ghi `docs/lich-su.md`; số liệu mới chỉ ở `shared/data.ts`.

### Câu hỏi mở
1. Mức xếp hạng (top 1 / 3 / 10) áp cho mọi bảng hay một số bảng; đề xuất mọi bảng `RANK_BOARDS`.
2. Danh hiệu tông môn gắn chức vụ nào: thuộc đợt sau.
3. Hiện tên bậc hiếm bằng chữ hay chỉ màu; đề xuất chỉ màu.

## Lịch sử / issue liên quan
- Theo dõi: #1766 (epic; P1–P6 tạo issue con khi tới lượt).
- Nguồn: Thành Tựu (`docs/design/thanh-tuu.md`, mục 5.23), Bảng Xếp Hạng (`docs/design/xep-hang.md`, mục 5.19), Hub / kit giao diện (`docs/design/giao-dien.md`, `docs/art/ui-kit.md`), hiệu năng (`docs/tech/hieu-nang-hieu-ung.md`).
- Nhật ký từng bước: `docs/lich-su.md`.
