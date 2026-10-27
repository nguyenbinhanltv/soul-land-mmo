# bang_phuong_hoang — phụ thể hoạt ảnh A–E, lô 1 (#1025)

Ngày 2026-10-28. Công cụ **builtin image_gen.imagegen (Codex, Q44)**; model/seed `unknown`. RAW nguyên byte, không resize/hậu kỳ. Prompt nguyên khối text của `phuthe-sheet-prompt.mjs --stage direction --concept-ref`, không viết tay/addendum. Trước mỗi lượt thêm một bài học ngắn vào `art/src/phuthe-anim/lessons.md`.

## Tham chiếu và lượt
Nộm từng tờ ở `references/`, concept lượt lớn nhất ở thư mục chính `art/src/vohon-v2/bang_phuong_hoang/` (không candidates), rồi tờ A đã kiểm 0 chặn nếu có. Thứ tự và SHA256 từng tham chiếu, prompt, revision công cụ, toàn bộ kết quả kiểm nằm trong `.source.json` cạnh RAW. Nộm Băng Phượng Hoàng `#30D030`, vạch `#7A5CFF`; các màu của võ hồn khác theo prompt.

| RAW | Chặn / nhẹ | SHA256 ảnh | SHA256 prompt |
|---|---|---|---|
| `candidates/toA-attempt1.png` | 0 / 46 | `68aa91302f5928e772652cd5a61afd883ba5baa9b0d0d0beeb18e4ee6e428d24` | `fef878e739ae4eeab02b454a3b90ac3fd882531136b4f6b3ce2d2dfac12b6374` |
| `candidates/toA-attempt2.png` | 1 / 0 | `08ebbf15a53165f9f48a580567fc38f230879ef7e9f4d6791e44e69d51fb2540` | `6198e028e3b784c172da610a9ea90dcbe69b126a2cfceb99a06007b84b1bac53` |
| `candidates/toB-attempt1.png` | 1 / 0 | `63d5ac8f84a36de275ae884817ef30ae1ac9d90778f0277aa905eaa20eab2f37` | `3d5558872da7bd52d966409d01b695597cfb3e6e0015c83f9a5583de9ef5726c` |
| `candidates/toB-attempt2.png` | 1 / 0 | `673d8b581c5d2f3b1392ba930412784c9069d0d60d56d3abd7bbcda550ed58fd` | `c1ecb002893678b058b5d82e70aa06787bf1426284a3f38bbe60e90dff432b3b` |
| `candidates/toB-attempt3.png` | 1 / 1 | `946b893dcae2ee17e5dcba0b5a4049d1a6c04c96aed8e8b87c7daf4f53df23ad` | `88fbd34cec907d927ada431966e4814526996400664829e3773d465515e42446` |
| `candidates/toC-attempt1.png` | 2 / 42 | `f8d893b1956e5b93cba6c6d4dc66c0d62b065c12b65486d3c259bc9fd33fb465` | `9243939984337bb395f8ca34675e32af2e159713a58f5ba0c8a2c2842f1961d9` |
| `candidates/toD-attempt1.png` | 1 / 0 | `7338193eb5ee36f27942b20635de7191ff94e4f2846212eca1e297a0f8ff36f5` | `d23110d5b455bf625eeb69673d2f8d47029c2690955d63c642934988af63fbe1` |
| `candidates/toE-attempt1.png` | 1 / 0 | `5658c20f70e286f11d641ada5f1dfd769e430de2499a715850f93b0f913c446e` | `8ba94c27df0c79022d4e49bdd222365d92bdd8b7abe6cc523df202db01941da8` |
| `toA.png` | 0 / 32 | `4ff1337e6251f5919e27b6328ab7097f68b9fff2b4b2956c472ea1dfca9e9e48` | `36c5fd01fddf921f2183c816d24b71c572018625ff8d30c21c3d16d6dd26ca33` |

## Kiểm, cắt, neo và preview
Kiểm từng lượt bằng `node tools/assets/phuthe-sheet-check.mjs bang_phuong_hoang --out <temp>/<lượt>/check` (tương đương `npm run phuthe:check -- bang_phuong_hoang --out ...`). Kết quả từng lượt trong source JSON không thay bằng kết quả cutter. Cắt thử bằng `phuthe-sheet-cut.mjs`, neo bằng `phuthe-anchor.mjs --source anim`, preview bằng `phuthe-sheet-preview.mjs`. Đầu ra: `C:/Users/PC/.ao/data/artifacts/soul_land_game-705/bang_phuong_hoang/`; trang `preview/index.html`, `preview/xoay-vong.html` có nam/nữ, đủ clip và hướng tây lật ngang. Preview chuẩn của công cụ ghép theo khung LPC; `anchor.json` tách riêng cho chủ repo chỉnh ráp, không khẳng định preview GIF đã áp neo mới.

## Quyết định và lỗi mắt
Không nhập game; giữ nhánh cũ. A3 được chọn (0 chặn/32 nhẹ), A1/A2 vào candidates; B1–B3 đều chặn, dừng B ở 3/3 lượt. C/D/E dùng 1 lượt mỗi tờ, dừng vì cả võ hồn đã không đủ điều kiện nhập; không dùng tờ chặn làm ảnh dẫn. Cắt chẩn đoán 110 khung, 0 block/177 warn/3 info; B/D/E dùng gap+uniform-cols dự phòng, không phải đạt kiểm RAW. `--eye toA=phụ

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phuthe-anim/bang_phuong_hoang/` | - | builtin `image_gen.imagegen` (Codex, Q44) | A–E, prompt direction --concept-ref tự sinh, SHA256 và tham chiếu trong source cạnh RAW | 2026-10-28 | RAW giữ nguyên, xem quyết định nhập ở trên; LPC tham chiếu đã có trong repo |
