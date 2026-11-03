# Thất Xá phòng 7 (#1722, mục 11)

Codex vẽ bằng OpenAI `image_gen.imagegen` ngày 03/11/2026 trên khung 3D tự dựng, không dùng ảnh ngoài. Giấy phép đầu ra OpenAI, không CC0. Prompt nguyên bản tại `prompts.json`; hash ảnh gốc và sprite tại `nguon.json`.

Phòng gỗ nghèo, cắt phần lớn mái để thấy bảy giường đơn (bốn hàng sau, ba hàng trước), chăn vải bạc màu, cửa chớp, biển “Thất Xá” và số 7. Đây là hình minh họa công trình trên bản đồ, không thêm nội thất có thể đi vào. Sprite 112×96, chân [54,68] tại tâm nền theo mô hình 3D, `flip:false`. Chữ trên RAW rõ hơn bản thu nhỏ.

```sh
node tools/assets/comfy-shape.mjs art/src/nac-dinh-1722/that-xa/that_xa_phong_so_7-model.json <guide.png> --size 1024 --fit .85
node tools/assets/gemini-import.mjs --kind object --size 112x96 --cell 1 --logo off --grid 1x1 --palette gpl --names that_xa_phong_so_7 --out <tmp>/nhap <RAW>
node tools/assets/iso-build.mjs prop that_xa_phong_so_7 <tmp>/nhap/that_xa_phong_so_7.png --map nac_dinh_thanh --foot-x 56
node tools/assets/normal.mjs shared/assets/sprites/iso/props/that_xa_phong_so_7.png
node art/src/nac-dinh-1722/that-xa/neo-san.mjs <model.json> <guide.png> <sprite.png> <meta.json>
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

`gemini-import.mjs` chỉ chuẩn hóa ảnh. Lấy chân sau crop từ metadata để ghi tiles.json. Thay `build.compounds["4,31"].main` và bỏ các thùng gỗ/đống rơm lặp quanh khu này vì chúng che giường và biển phòng; giữ `walls:false`, vị trí và toàn bộ lưới chặn. Ảnh trước/sau dùng renderer Phaser/IsoMap thật, cùng góc và mức phóng đại.
