# Tranh bản đồ thế giới M

Chủ repo duyệt ngày 31/10/2026: bản đồ thế giới mở bằng M dùng **một tranh thủy mặc trên giấy cổ**, cùng chất liệu Giấy / Mực của UI gốc. Client vẽ nút, nhãn, trạng thái mở khóa và đường cổng bằng code trên tranh. Đây là ngoại lệ có chủ đích về chất liệu nền; không thay quy tắc truyền tống hay bản đồ khu vực N.

## Tệp bàn giao

- [Tranh nền nguyên byte](../../art/src/world-map/nen-the-gioi.png): 1672×941, gần 16:9 theo quy tắc tỷ lệ của kit, không phóng nội suy.
- [Bố cục JSON](../../art/src/world-map/bo-cuc.json): đủ 11 bản đồ, 25 truyền tống trận và 8 cặp cổng hai chiều.
- [Xem trước lớp phủ](../../art/src/world-map/xem-truoc.html): bật/tắt nhãn trận, xem toàn tranh hoặc khung dọc có cuộn ngang.
- [Nguồn / giấy phép](../../art/src/world-map/NGUON.md), [prompt thật](../../art/src/world-map/nen-the-gioi.prompt.txt), [hash và nguồn dữ liệu](../../art/src/world-map/source.json).

Asset nằm ở `art/src/world-map/` để PR chỉ bàn giao mỹ thuật; phía client chưa tải ảnh hay JSON này. Khi nhập game cần dùng quy trình asset-gen để đăng ký đường dẫn runtime, không tự coi key trong ghi công là key manifest.

Trang xem trước dùng `fetch` để đọc JSON, cần mở qua HTTP, ví dụ `ao preview art/src/world-map/xem-truoc.html`; không mở trực tiếp bằng `file://`.

## Hợp đồng bố cục

Gốc tọa độ ở góc trên trái ảnh; x sang phải, y xuống dưới. `position` của bản đồ là tâm nút / nhãn tên vùng, của trận là tâm nút trận. Tất cả trong [0,1], độc lập tọa độ Tiled và không được gửi lên server như tọa độ dịch chuyển. Khi ảnh có kích thước hiển thị W×H với góc ở (L,T), điểm vẽ = (L+xW,T+yH); dùng cùng phép biến đổi cho đường nối, nút và hit target.

`maps[].id` lấy đúng từ `MAPS`; `waypoints[].key` = `mapId:tên_object`, đúng khóa server, tên hiện từ thuộc tính `label`. `sourceFile`, `sourceObjectId` và `sourceObjectName` cho phép đối chiếu lại. `edges[].points` là polyline từ tâm bản đồ đầu tới tâm bản đồ cuối; `portals` giữ hai object cổng thật. Loại `thuyen` chỉ dành cho Thiên Đấu Thành ↔ Hải Thần Đảo. Không suy cổng từ sông, lối đất hay vị trí vẽ trên tranh. Cấp đề xuất, phí, quyền dịch chuyển và trạng thái khóa đọc từ dữ liệu / server hiện hành, không chép vào hồ sơ art.

Đại Đấu Hồn Trường và Luyện Hồn Cảnh có nút riêng để danh sách đủ `MAPS`, `entry = phong-rieng`, **không có cổng hoặc trận**; nút chỉ xem thông tin, không dùng như điểm đi cổng. Vị trí biểu tượng phòng riêng chỉ là quy ước trình bày, không khẳng định vị trí địa lý hay cổng vào.

## Lề và màn dọc

`safeArea` chừa khoảng 12% viền cho cắt trang trí, mọi tâm nút nằm trong vùng an toàn. Nhãn dài đặt bằng code, tránh mép và nút lân cận; ưu tiên tooltip hoặc danh sách khi chật. Vùng nhìn dọc 9:16 ban đầu đặt tâm (0,5; 0,5), giữ thủ đô và trục bắc–nam. Toàn bộ thế giới rộng không thể nằm trong một crop dọc: dùng cuộn ngang / kéo hoặc contain; **không cover cố định rồi cắt mất các nhánh đảo / rừng**. Tranh và overlay cuộn chung. Vùng bấm theo kit, không ép vùng bấm co nhỏ theo ảnh.

## Dữ liệu đối chiếu

Nguồn thật là `shared/data.ts` và `shared/assets/<mapId>.v2.json` nếu tồn tại, nếu không dùng `<mapId>.json`, đúng mặc định `server/src/map.ts`; checkout không có `shared/maps/`. JSON ghi hash từng nguồn để nhận biết khi cần cập nhật: chuẩn hóa CRLF thành LF trước khi băm văn bản nguồn (`textNormalization: LF`); ảnh, prompt và bố cục băm nguyên byte. `.gitattributes` cục bộ giữ prompt / JSON ở LF giữa Windows và Linux. `MAP_V1` là đường lùi server, không phải bố cục thay thế của tranh.

| Bản đồ | Bản đồ kề qua cổng | Số trận |
|---|---|---:|
| Thánh Hồn Thôn (`thanh_hon_thon`) | Nặc Đinh Thành | 3 |
| Nặc Đinh Thành (`nac_dinh_thanh`) | Thánh Hồn Thôn, Tinh Đấu Ngoại vi, Thiên Đấu Thành | 3 |
| Tinh Đấu Ngoại vi (`tinh_dau_ngoai_vi`) | Nặc Đinh Thành, Tinh Đấu Nội địa | 3 |
| Tinh Đấu Nội địa (`tinh_dau_noi_dia`) | Tinh Đấu Ngoại vi, Lõi Tinh Đấu | 3 |
| Thiên Đấu Thành (`thien_dau_thanh`) | Nặc Đinh Thành, Lạc Nhật Sâm Lâm, Cực Bắc Chi Địa, Hải Thần Đảo (thuyền) | 3 |
| Lạc Nhật Sâm Lâm (`lac_nhat_sam_lam`) | Thiên Đấu Thành | 3 |
| Cực Bắc Chi Địa (`cuc_bac_chi_dia`) | Thiên Đấu Thành | 3 |
| Hải Thần Đảo (`hai_than_dao`) | Thiên Đấu Thành (thuyền) | 3 |
| Lõi Tinh Đấu (`loi_tinh_dau`) | Tinh Đấu Nội địa | 1 |
| Đại Đấu Hồn Trường (`dai_dau_hon_truong`) | Không có — phòng riêng | 0 |
| Luyện Hồn Cảnh (`luyen_hon_canh`) | Không có — phòng riêng | 0 |

## Issue liên quan

#1415.
