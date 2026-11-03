# Giảng đường Học viện Nặc Đinh (#1722, mục 10)

Codex tạo ảnh bằng OpenAI `image_gen.imagegen` ngày 03/11/2026, tô chi tiết trên khung 3D tự dựng. Không dùng ảnh ngoài. Giấy phép theo điều khoản đầu ra OpenAI, không CC0. Prompt nguyên bản tại `prompts.json`; hash ảnh gốc và sprite tại `nguon.json`.

Nhà đá trắng ngà, hai tháp góc, mái ngói xám xanh, bốn cột tròn và hành lang lõm. Sprite cuối 128×128; điểm chân [64,96] là tâm nền theo mô hình. `neo-san.mjs` tái tạo phép chiếu của công cụ dựng khung, chuyển tâm nền qua vùng ảnh có nội dung sau crop; metadata tại `giang_duong_lau_dai-meta.json`.

```sh
node tools/assets/comfy-shape.mjs art/src/nac-dinh-1722/giang-duong/giang_duong_lau_dai-model.json <guide.png> --size 1024 --fit .85
node tools/assets/gemini-import.mjs --kind object --size 160x128 --cell 1 --logo off --grid 1x1 --palette gpl --names giang_duong_lau_dai --out <tmp>/nhap <RAW>
node tools/assets/iso-build.mjs prop giang_duong_lau_dai <tmp>/nhap/giang_duong_lau_dai.png --map nac_dinh_thanh --foot-x 80
node tools/assets/normal.mjs shared/assets/sprites/iso/props/giang_duong_lau_dai.png
node art/src/nac-dinh-1722/giang-duong/neo-san.mjs <model.json> <guide.png> <sprite.png> <meta.json>
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

`gemini-import.mjs` là công cụ chuẩn hóa, không phải nguồn tạo ảnh. Lấy `foot` từ metadata sau crop để ghi vào tiles.json. Chỉ thay `build.compounds["22,10"].main` của Nặc Đinh, giữ nguyên cổng đá trắng, hàng rào, bố cục, ô chặn và gameplay. Ảnh trước/sau dùng cùng góc nhìn trong renderer Phaser/IsoMap của game.
