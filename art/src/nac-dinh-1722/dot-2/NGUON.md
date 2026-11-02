# Cổng Nặc Đinh Thành — nâng chất đợt 2 (#1722)

Hai ảnh do Codex tạo bằng công cụ OpenAI image_gen.imagegen ngày 02/11/2026, theo điều khoản đầu ra OpenAI, không khai CC0. Chỉ tham chiếu khung 3D tự dựng và ảnh Codex của đợt trước; không dùng ảnh phim hay gói bên ngoài. RAW nằm trong artifacts đợt 2, hash tại `nguon.json`; prompt cuối tại `prompts.json`.

Giữ tọa độ chân và khoảng cách hai chòi theo bản đã duyệt. Chòi đá cao 4,5 đơn vị, mái ngói nâu đỏ, vòm dày có huy hiệu, lá cửa gỗ bọc sắt mở 40° quanh bản lề trong vòm. Phép chiếu sx=x-y, sy=(x+y)/2-z; 16 pixel/đơn vị. Hai trục được dựng riêng, không lật ngang.

`gate-*-guide.json` là mô hình, `gate-*-meta.json` chứa phép chiếu và neo. `render-cong.mjs` lấy vân Codex trong silhouette cố định; cửa X lấy vân cửa Y và chiếu theo tọa độ mặt cửa để tránh ván nằm ngang. Ảnh nguồn không được dùng trực tiếp làm sprite.

Tái tạo từ gốc repo (RAW và đầu ra ở ngoài repo):

```sh
node art/src/nac-dinh-1722/dot-2/render-cong.mjs <thu-muc-RAW> <thu-muc-tam>
node tools/assets/iso-build.mjs prop cong_thanh_vom_x <thu-muc-tam>/gate-x-textured.png --map nac_dinh_thanh --foot-x 128
node tools/assets/iso-build.mjs prop cong_thanh_vom_y <thu-muc-tam>/gate-y-textured.png --map nac_dinh_thanh --foot-x 128
node tools/assets/normal.mjs shared/assets/sprites/iso/props/cong_thanh_vom_x.png
node tools/assets/normal.mjs shared/assets/sprites/iso/props/cong_thanh_vom_y.png
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

Chân X [48,119] → [192,191], chênh [144,72]; chân Y [176,127] → [48,191], chênh [-128,64]. `tiles.json` neo tâm trụ thứ nhất; chiều cao mới làm đổi khung ảnh nên không dùng neo đợt 1. Giữ flip:false. Không đổi bố cục, ô chặn, nhà phố hay gameplay.
