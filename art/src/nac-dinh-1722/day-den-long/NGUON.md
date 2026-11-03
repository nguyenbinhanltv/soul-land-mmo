# Dây đèn lồng Nặc Đinh Thành (#1722)

Hai ảnh do Codex tạo bằng OpenAI `image_gen.imagegen` ngày 03/11/2026 từ khung 3D tự dựng, không tham chiếu ảnh ngoài. Giấy phép theo điều khoản đầu ra OpenAI, không CC0. Prompt ở `prompts.json`; hash RAW và thông số neo ở `nguon.json`. RAW và ảnh khung giữ ngoài repo trong artifacts của phiên.

Mỗi dây có hai cột gỗ, dây thừng võng, bốn đèn giấy đỏ với đai vàng và tua. Hai trục được dựng riêng, không lật ngang. Phép chiếu sx=x-y, sy=(x+y)/2-z, cùng 16 pixel/đơn vị. Trục X giăng 7 ô: chân [8,85] → [120,141], khung 128×144. Trục Y giăng 8 ô: chân [136,93] → [8,157], khung 144×160. Khung lớn hơn đề xuất 64×48 vì bao gồm hai cột và cần khớp bề ngang đường hiện có.

```sh
node tools/assets/comfy-shape.mjs <model.json> <guide.png> --size 1024 --fit .85
node art/src/nac-dinh-1722/day-den-long/nhap-den.mjs <thu-muc-RAW> <thu-muc-tam>
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
node tools/maps/build.mjs
```

Công cụ nhập giữ tỷ lệ theo khung, chuẩn hóa alpha, lượng tử màu bằng `iso-build prop`, sinh normal và ghi neo sau crop. Không sửa tay file sinh. `gemini-import.mjs` chỉ là tên công cụ nhập, nguồn ảnh là Codex.

Đặt hai dây trục X tại [81,17], [81,86] qua đường dọc và hai dây trục Y tại [25,52], [140,52] qua đường ngang. Các chân nằm ở ô trống đã kiểm tra, không xóa vật chặn. Gid 56/57 là trang trí đi xuyên như gid đèn 44 hiện có, khai rõ trong `gids.walk`; không đổi lưới chặn hoặc gameplay. `tileRows` lên 8 để chứa đủ gid, không đổi kích thước ô.
