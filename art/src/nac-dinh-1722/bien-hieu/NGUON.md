# Biển hiệu Nặc Đinh Thành (#1722)

Bốn biển do Codex tạo bằng OpenAI `image_gen.imagegen` ngày 03/11/2026. Biển rèn được vẽ mới; ba biển quán trọ, dược thảo và lò bánh chỉnh từ chính ảnh Codex đó để giữ cùng thiết kế. Không dùng ảnh phim hay gói ngoài. Giấy phép theo điều khoản đầu ra OpenAI, không CC0. Prompt thật ở `prompts.json`; hash RAW, sprite và neo chân ở `nguon.json`. RAW lưu ngoài repo trong artifacts của phiên.

Mỗi biển gồm cột gỗ, giá sắt, hai dây xích và bảng gỗ có biểu tượng, không chữ. Khung cuối 32×48; neo đo ở chân cột thay vì tâm bảng treo; `flip:false`. Normal do công cụ sinh. Nền và quầng alpha được chuẩn hóa khi nhập.

```sh
node tools/assets/gemini-import.mjs --kind object --size 32x48 --cell 1 --logo off --grid 1x1 --palette gpl --names <ten> --out <tmp>/nhap <RAW>
node tools/assets/iso-build.mjs prop <ten> <tmp>/nhap/<ten>.png --map nac_dinh_thanh --foot-x 16
node tools/assets/normal.mjs shared/assets/sprites/iso/props/<ten>.png
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

`gemini-import.mjs` là tên công cụ nhập; nguồn là Codex. Gid 45 chỉ trong bộ Nặc Đinh đổi từ biển chỉ đường giữ chỗ sang bốn biến thể. Renderer chọn ổn định theo tọa độ; mười vị trí hiện có chứa đủ cả bốn biểu tượng. Không đổi `tools/maps/layouts/nac_dinh_thanh.json`, vị trí, lưới chặn hoặc tính đi xuyên của biển. Không sửa client/server hay công cụ.
