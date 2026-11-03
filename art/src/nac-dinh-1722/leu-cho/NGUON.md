# Lều chợ ba màu — Nặc Đinh Thành (#1722, mục 8)

Ba ảnh do Codex tạo bằng OpenAI `image_gen.imagegen` từ cùng khung 3D tự dựng, ngày 03/11/2026. Không dùng ảnh phim hay gói ngoài. Giấy phép theo điều khoản đầu ra OpenAI, không CC0. Prompt thật ở `prompts.json`; hash RAW và sprite ở `nguon.json`. RAW và ảnh khung giữ ngoài repo trong artifacts phiên.

Ba mái bạt đỏ, xanh lam ngả lục và vàng; quầy/cột gỗ, thùng hàng, rau/quả và ngũ cốc. Cùng phép chiếu isometric 2:1, khung 112×96 và chân [56,92], `flip:false`, bằng asset `sap_cho` giữ chỗ. Normal map do công cụ sinh.

```sh
node tools/assets/comfy-shape.mjs art/src/nac-dinh-1722/leu-cho/leu_cho-model.json <guide.png> --size 1024 --fit .85
node tools/assets/gemini-import.mjs --kind object --size 112x96 --cell 1 --logo off --grid 1x1 --palette gpl --names <ten> --out <tmp>/nhap <RAW>
node tools/assets/iso-build.mjs prop <ten> <tmp>/nhap/<ten>.png --map nac_dinh_thanh --foot-x 56
node tools/assets/normal.mjs shared/assets/sprites/iso/props/<ten>.png
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
node tools/maps/build.mjs
```

`gemini-import.mjs` chỉ là tên công cụ nhập, nguồn ảnh là Codex. Gid 58 `marketStall` thay đúng 16 ô lều trong khu chợ, giữ bốn lều gid 11 ngoài chợ. Renderer chọn ba màu ổn định theo tọa độ; đủ cả ba màu trên bản đồ. Gid mới giữ tính chặn của lều cũ, không đổi vị trí, footprint hoặc lưới chặn. Không sửa code client/server.
