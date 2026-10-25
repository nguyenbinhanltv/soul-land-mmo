# Cộng minh

Cộng minh: mốc theo trụ cột cộng % chỉ số gốc cho mọi võ hồn của tài khoản. Số liệu ở `shared/data.ts` (tên hằng trong dấu `code`). Số issue ở cuối file.


## 5.10 Cộng minh (giai đoạn cuối)

### Luật
Đạt mốc theo từng trụ cột thì cộng % chỉ số gốc cho **mọi** võ hồn của tài khoản (ra trận, trong đội, ngoài đội, mở sau), buộc nuôi đều thay vì dồn cho một võ hồn. Bảng `RESONANCE`: 5 trụ cột, mỗi trụ cột 3 mốc, mỗi mốc cộng hiệu ứng cụ thể.

| Trụ cột | Đếm gì |
|---|---|
| Võ hồn | Số võ hồn sở hữu có cấp từ `RES_VOHON_LEVEL` |
| Hồn hoàn | Tổng số hồn hoàn đã hấp thụ trên mọi võ hồn |
| Hồn cốt | Số hồn cốt **đang gắn** có cấp cường hóa từ `RES_BONE_ENHANCE` |
| Hồn hạch | Số hồn hạch **đang gắn** từ `RES_CORE_STARS` sao |
| Sao võ hồn | Tổng `max(0, sao - 1)` của mọi võ hồn sở hữu |

### Tính tiến độ
- Chỉ đếm đồ đang gắn (đồ trong túi không tính), để buộc trang bị đều cho nhiều võ hồn. % cộng chung với dòng % của hồn hạch trong `calcStats`.
- Các mốc và hiệu ứng của 5 trụ cột lấy từ `RESONANCE`; trụ Sao cộng chí mạng, giảm sát thương nhận và tốc chạy. Giới hạn hiệu ứng cộng minh dùng `RESONANCE_EFFECT_CAP`.
- Tiến độ tính lại từ dữ liệu sẵn có (`resonanceProgress` / `resonanceLevels` / `resonanceBonus`, không lưu DB) mỗi khi lên cấp, hấp thụ, mở võ hồn, gắn / tháo / cường hóa / nâng cấp đồ đang gắn; đạt mốc mới thì báo lớn, tháo đồ làm tụt mốc thì báo mất phần cộng.
### Bảng Cộng minh và xếp hạng
- Bảng **Cộng minh** (phím K, nút "Cộng minh" trong khung chỉ số và ở đầu bảng đội hình): tổng hiệu ứng đang cộng, mỗi trụ cột tiến độ x / mốc kế tiếp kèm thanh, các mốc đã đạt sáng màu. Nút xếp hạng gửi `resonance {op:"top", page, pageSize}`; kích thước mặc định dùng `RESONANCE_RANK_PAGE_SIZE`, giới hạn dùng `RESONANCE_RANK_PAGE_MAX`, và giới hạn gọi lại dùng `RESONANCE_RANK_CD`. Chỉ tài khoản đạt ít nhất một mốc được xếp. Bảng đã sắp xếp được giữ chung cho mọi phòng trong `RESONANCE_RANK_CACHE` giây (yêu cầu đến lúc đang tính dùng chung một lần tính), nên bảng có thể trễ ngần ấy so với dữ liệu đã lưu và tiến độ đang chơi.
- Điểm xếp hạng và tie-break do `resonanceRankValue` / `resonanceRankCompare` định nghĩa. Kết quả có trang 1-based, `total`, `hasNext` và hạng riêng của mình. Dòng công khai chỉ có tên hiển thị, hạng, điểm, số mốc; chi tiết tiến độ / hiệu ứng chỉ trả cho chính chủ.
- Không thêm bảng SQL: `Store.resonanceTop` đọc canonical `accounts`, `vohons`, `items`; `MemoryStore` và `PgStore` cùng tính kết quả. Không có bảng riêng cho cộng minh; PostgreSQL chỉ cần kiểm thử đọc dữ liệu hiện có.

## Lịch sử / issue liên quan
- Nhật ký từng bước: `docs/lich-su.md`.
