# Tường thành rêu hai trục (#1722, mục 15)

Codex vẽ bằng OpenAI `image_gen.imagegen` ngày 03/11/2026, tô trên hai khung 3D tự dựng rồi chỉnh mép dọc bằng cùng công cụ để giảm viền nối. Không dùng ảnh ngoài. Giấy phép đầu ra OpenAI, không CC0. Prompt tạo và chỉnh nguyên bản tại `prompts.json`, hash ảnh trước chỉnh/RAW cuối/sprite/normal tại `nguon.json`.

Đá hoa cương xám ấm, mạch vữa và rêu thấp ở chân, ba răng châu mai. Hai ảnh thật theo trục x/y, không lật ngẫu nhiên (`flip:false`). Mỗi mô-đun dài một ô logic để nối theo bước 16×8 màn hình, cùng chiều cao tường chính. Khung cuối 32×64, chân [16,58], hệ số nhập chung .046. Dùng mô-đun một ô thay khung dài 112×96 đề xuất trong bảng để không chồng nhiều đoạn dài ở từng ô tường của renderer hiện tại.

Chỉ đổi các ô gid15 ngoài chu vi thành thành gid62(x)/63(y), giữ vị trí và khoảng mở ba cổng. `tao-day-tuong.mjs` sinh bảy dãy từ bản đồ trước khi nhập; không thay tường sân compound hoặc tường nhà. Gid62/63 vẫn chặn đúng ô cũ; không sửa renderer, gameplay hoặc công cụ hạ tầng.

```sh
node tools/assets/comfy-shape.mjs <model.json> <guide.png> --size 1024 --fit .85
node tools/assets/gemini-import.mjs --kind object --size 32x64 --scale .046 --cell 1 --logo off --grid 1x1 --palette gpl --names <tên> --out <tmp>/nhap <RAW>
node tools/assets/iso-build.mjs prop <tên> <tmp>/nhap/<tên>.png --map nac_dinh_thanh --foot-x 16
node tools/assets/normal.mjs shared/assets/sprites/iso/props/<tên>.png
node art/src/nac-dinh-1722/tuong-reu/neo-san.mjs <model.json> <guide.png> <sprite.png> <meta.json>
node art/src/nac-dinh-1722/tuong-reu/tao-day-tuong.mjs <map-truoc.json> tools/maps/layouts/nac_dinh_thanh.json
npm run map:build
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

`gemini-import.mjs` chỉ chuẩn hóa ảnh, nguồn là Codex. Điểm chân từ metadata sau crop phải ghi tiles.json. Trang đối chiếu có ảnh trước/sau cùng góc ở ba cổng, góc thành, hai đoạn tường và ảnh nhân vật trong thành sát hai trục tường.
