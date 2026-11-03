# Cổng đá trắng Học viện Nặc Đinh (#1722, mục 9)

Ảnh do Codex tạo bằng OpenAI `image_gen.imagegen` ngày 03/11/2026 từ khung 3D tự dựng, không dùng ảnh ngoài. Giấy phép theo điều khoản đầu ra OpenAI, không CC0. Prompt thật tại `prompts.json`; hash RAW/sprite tại `nguon.json`. RAW và ảnh khung giữ ngoài repo trong artifacts của phiên.

Cổng vòm đá trắng ngà, cột vuông chạm hoa văn, hai cánh sắt rèn mở khoảng 60° vào trong và biểu tượng hồn lực tám cánh tự thiết kế. Hình học isometric 2:1 được khóa bằng khung. Khung cuối 112×112, neo [56,86] tại tâm ngưỡng đá theo mô hình, `flip:false`; ngưỡng khớp nền và điểm nối tường. Normal do công cụ sinh. Metadata neo tại `hoc_vien_cong_da_trang-meta.json`.

```sh
node tools/assets/comfy-shape.mjs art/src/nac-dinh-1722/cong-hoc-vien/hoc_vien_cong_da_trang-model.json <guide.png> --size 1024 --fit .85
node tools/assets/gemini-import.mjs --kind object --size 112x112 --cell 1 --logo off --grid 1x1 --palette gpl --names hoc_vien_cong_da_trang --out <tmp>/nhap <RAW>
node tools/assets/iso-build.mjs prop hoc_vien_cong_da_trang <tmp>/nhap/hoc_vien_cong_da_trang.png --map nac_dinh_thanh --foot-x 56 --lift 4
node tools/assets/normal.mjs shared/assets/sprites/iso/props/hoc_vien_cong_da_trang.png
node art/src/nac-dinh-1722/cong-hoc-vien/neo-cong.mjs <tmp>/anchor.json
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

`gemini-import.mjs` chỉ là tên công cụ nhập, nguồn là Codex. Lấy `foot` sau crop từ metadata do `neo-cong.mjs` tính để ghi vào `tiles.json`. Chỉ đổi ảnh cổng trong `build.compounds["22,10"]` và gid 42 của bộ Nặc Đinh. Không đổi `tools/maps/layouts/nac_dinh_thanh.json`, khoảng mở cổng, vị trí ô neo, lưới chặn hoặc gameplay. Trang đối chiếu có nhân vật trước, dưới và sau vòm dùng phép chiếu/độ sâu của game.
