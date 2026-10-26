---
name: Tờ UI (UI Kit)
about: Sinh hoặc vẽ lại một tờ UI Kit (BOARD / F / N / O / T / I / D), một issue = một tờ
title: "Tờ UI <loại>: <tên / họ>"
labels: ["san-sang", "art"]
---

## Tờ
- **Loại:** <!-- BOARD · F khung · N nút · O ô · T thanh · I icon (ghi họ) · D trang trí -->
- **Chất liệu:** <!-- Mực / Giấy / cả hai -->
- **Theo dõi:** <!-- Part of #877 (UI Kit v2) hoặc đợt con -->

## Quy trình (skill `ui-kit`, phần SINH)
- [ ] Sinh prompt: `npm run ui:prompt -- --kind <loại> --out <thư mục ngoài repo>` (không viết / sửa prompt tay)
- [ ] Đính ảnh tham chiếu **đúng thứ tự** trong file prompt (BOARD đã duyệt, swatch bảng màu, tờ cùng họ **đã đạt**); không dùng tờ lỗi làm tham chiếu
- [ ] Vẽ, tối đa **3 lượt** cho tờ này; đặt ảnh gốc **nguyên byte** vào `art/src/ui-kit/to<loại>.png` kèm prompt thật đã gửi
- [ ] `npm run ui:check -- art/src/ui-kit/to<loại>.png --out <thư mục ngoài repo>`: **không có mục chặn**; đã mở tờ liên hệ (xanh / vàng / đỏ)
- [ ] Bằng mắt (công cụ không kiểm): không chữ / ký tự trong ảnh; hoa văn chỉ ở góc và giữa cạnh; đúng chất liệu; trạng thái khác nhau được ở thang xám
- [ ] Ghi nguồn, giấy phép ở `docs/art/nguon-giay-phep.md`; `npm run check`

## Lượt đã thử
<!-- Lượt 1/2/3: đổi gì, kết quả ui:check (chặn / nhẹ), lý do bỏ. Quá 3 lượt: dừng, nộp lượt tốt nhất và ghi mục còn chặn. -->

## Ghi chú
<!-- Bị chặn bởi gì (đổi nhãn san-sang thành chan)? Chờ BOARD (#881)? Phần duyệt / nhập là việc orchestrator (phần DUYỆT / NHẬP của skill). -->
