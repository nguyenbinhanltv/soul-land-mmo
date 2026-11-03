# Cọc tập và giá vũ khí Nặc Đinh (#1722, mục 13)

Hai ảnh do Codex vẽ bằng OpenAI `image_gen.imagegen` ngày 03/11/2026, tô trên khung 3D tự dựng, không dùng ảnh ngoài. Giấy phép đầu ra OpenAI, không CC0. Prompt nguyên bản tại `prompts.json`, hash RAW/sprite tại `nguon.json`.

- `thao_truong_coc_tap`: hai cọc gỗ có tay ngang, đệm rơm và dấu bia tập.
- `thao_truong_gia_vu_khi`: giá gỗ có đai sắt, hai giáo và kiếm tập cùn.

Cả hai sprite 64×64, chân [32,48] tại tâm đế theo phép chiếu 2:1 (`*-meta.json`, `neo-san.mjs`), `flip:false`. Hai cọc tại [20,31], [38,37]; hai giá tại [38,31], [20,37]. Chỉ thay bốn cột giữ chỗ của thao trường. Gid 41/59 đều chặn tại cùng ô như trước; cột trang trí `cot_vo` trong các compound học viện không đổi.

```sh
node tools/assets/comfy-shape.mjs <model.json> <guide.png> --size 1024 --fit .85
node tools/assets/gemini-import.mjs --kind object --size 64x64 --cell 1 --logo off --grid 1x1 --palette gpl --names <tên> --out <tmp>/nhap <RAW>
node tools/assets/iso-build.mjs prop <tên> <tmp>/nhap/<tên>.png --map nac_dinh_thanh --foot-x 32
node tools/assets/normal.mjs shared/assets/sprites/iso/props/<tên>.png
node art/src/nac-dinh-1722/thao-truong/neo-san.mjs <model.json> <guide.png> <sprite.png> <meta.json>
npm run map:build
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

`gemini-import.mjs` chỉ là tên công cụ nhập. Lấy điểm chân sau crop từ metadata ghi tiles.json. Ảnh đối chiếu có cả cọc/giá trong renderer game, cùng góc trước/sau và nhân vật bên cạnh để xem tỷ lệ, thứ tự vẽ. Không thay gameplay hoặc hạ tầng.
