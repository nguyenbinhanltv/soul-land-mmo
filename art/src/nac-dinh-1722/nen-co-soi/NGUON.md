# Nền cỏ cắt tỉa và lối sỏi trắng (#1722, mục 14)

Codex vẽ bằng OpenAI `image_gen.imagegen` ngày 03/11/2026. Không dùng ảnh ngoài; giấy phép đầu ra OpenAI, không CC0. Prompt nguyên bản tại `prompts.json`; SHA256 RAW và từng PNG nhập tại `nguon.json`.

Hai texture nền phẳng hình thoi: cỏ ngắn xanh ô-liu dịu và sỏi đá vôi trắng ngà. Chỉ dùng cho khuôn viên học viện và hai sân compound `22,10`, `4,11`; giữ ô nền cũ ở các khu khác. Đây là thay nguồn của nhóm nền khuôn viên theo mục 14 được giao, không thay nguồn toàn thành. Gid 60/61 đều đi được, không đổi vật cản.

Ô ground theo quy cách riêng nằm trong `shared/assets/iso/ground/`, không phải sprite prop. Công cụ xuất biến thể `_0`/`_1`, cỡ 32×32 và 64×64 (`_lon`), tâm mặt trên [16,19]/[32,37], thoi 2:1; normal sinh tự động, không bo mép. Lát liền do công cụ nhập làm mép và dời texture theo chu kỳ.

```sh
node tools/assets/gemini-import.mjs --kind tile --cell 1 --logo off --grid 1x1 --inset 2 --seamless on --colors 10 --names <tên> --out <tmp>/nhap <RAW>
node tools/assets/iso-build.mjs ground <tên> <tmp>/nhap/32/<tên>.png <tmp>/nhap/64/<tên>.png
node tools/assets/normal.mjs --edge 0 <các PNG ô nền>
npm run map:build
node tools/assets/iso-atlas.mjs
node tools/assets/credits.mjs
```

`gemini-import.mjs` là tên công cụ chuẩn hóa; nguồn tạo ảnh là Codex. Ảnh đối chiếu dùng renderer game thật cùng góc trước/sau, có cận cảnh mép cỏ/sỏi và mảng lát lớn. Không thay gameplay hoặc hạ tầng.
