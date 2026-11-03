# Ký túc xá quý tộc (#1722, mục 12)

Codex tạo ảnh bằng OpenAI `image_gen.imagegen` ngày 03/11/2026 trên khung 3D tự dựng, không dùng ảnh ngoài. Giấy phép đầu ra OpenAI, không CC0. Prompt nguyên bản tại `prompts.json`; hash RAW/sprite tại `nguon.json`.

Nhà hai tầng đá ngà, mái xám xanh, cửa sổ vòm, ban công sắt uốn với cột đỡ, viền đồng cổ. Sprite 128×112; chân [64,80] là tâm nền theo phép chiếu 2:1, metadata tại `ky_tuc_xa_quy_toc-meta.json`. `flip:false`. Thay `build.compounds["4,11"].main`; đổi bậc thềm giữ chỗ thành `cong_sat` có sẵn và bỏ đồ trang trí lặp trong sân vì che ban công. Giữ vị trí, cửa mở tường sân và toàn bộ lưới chặn.

```sh
node tools/assets/comfy-shape.mjs art/src/nac-dinh-1722/ky-tuc-quy-toc/ky_tuc_xa_quy_toc-model.json <guide.png> --size 1024 --fit .85
node tools/assets/gemini-import.mjs --kind object --size 128x112 --cell 1 --logo off --grid 1x1 --palette gpl --names ky_tuc_xa_quy_toc --out <tmp>/nhap <RAW>
node tools/assets/iso-build.mjs prop ky_tuc_xa_quy_toc <tmp>/nhap/ky_tuc_xa_quy_toc.png --map nac_dinh_thanh --foot-x 64
node tools/assets/normal.mjs shared/assets/sprites/iso/props/ky_tuc_xa_quy_toc.png
node art/src/nac-dinh-1722/ky-tuc-quy-toc/neo-san.mjs <model.json> <guide.png> <sprite.png> <meta.json>
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

`gemini-import.mjs` chỉ chuẩn hóa ảnh, nguồn là Codex. Lấy điểm chân sau crop từ metadata ghi vào tiles.json. Ảnh trước/sau dùng cùng góc trong renderer Phaser/IsoMap của game.
