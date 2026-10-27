# kim_vu_mieu_ung — phụ thể hoạt ảnh A–E, lô 1 (#1025)

Ngày 2026-10-28. Công cụ **builtin image_gen.imagegen (Codex, Q44)**; model/seed `unknown`. RAW nguyên byte, không resize/hậu kỳ. Prompt nguyên khối text của `phuthe-sheet-prompt.mjs --stage direction --concept-ref`, không viết tay/addendum. Trước mỗi lượt thêm một bài học ngắn vào `art/src/phuthe-anim/lessons.md`.

## Tham chiếu và lượt
Nộm từng tờ ở `references/`, concept lượt lớn nhất ở thư mục chính `art/src/vohon-v2/kim_vu_mieu_ung/` (không candidates), rồi tờ A đã kiểm 0 chặn nếu có. Thứ tự và SHA256 từng tham chiếu, prompt, revision công cụ, toàn bộ kết quả kiểm nằm trong `.source.json` cạnh RAW. Nộm Kim Vũ Miêu Ưng `#00D0D0`, vạch `#7A5CFF`.

| RAW | Chặn / nhẹ | SHA256 ảnh | SHA256 prompt |
|---|---|---|---|
| `candidates/toA-attempt1.png` | 1 / 1 | `3596e219551606381c69cd0fa31de25ca7d62323489e4b03881671f9c38c452e` | `94de5cda235a8633b92a6d41c2c63ae5018d6c64e54c677a25d3cef7a9df10df` |
| `candidates/toA-attempt2.png` | 1 / 0 | `94dccda4141b44f2fe9a1428b102ca29cecd8e8fd683c10fe461791c29687279` | `b598c73ddbb803f78e1e7980fc405b3b3feb08e1f730c2907d7a1ff3a120176d` |
| `candidates/toA-attempt3.png` | 3 / 23 | `a9d56e84605339bda9bd84fe64b3b2b2ad85cf1404fca800b4eeaee732e82e99` | `13ea429ea19d3950af93ba378839ea3dc0743626cfa56f3c4fc8750fb1d323e0` |
| `candidates/toC-attempt1.png` | 22 / 1 | `62b2e5a2deff5fedabf2d118833a5ace75616d460e7ecd51307343d3c522f6bc` | `cc6c70c505be4c7a48e9ff87d37b7951c4defbffb0826cb64187964dfe6e1087` |
| `candidates/toD-attempt1.png` | 22 / 0 | `4bcc6faf75edc6cebadff703c26e46b39a3cd854cd771b53838a09d263c8754a` | `f62b17533454255ee72d6b6b477150ead46613f0107d5407f33d9e7b6f64747e` |
| `candidates/toE-attempt1.png` | 1 / 1 | `33b319961c365bcf08721de4d27e93b23e21efe662fa8f5f9c85692b68c65c52` | `786865922cc24b7365e2c17a27acd2945a8e45598a563c8d85da18d200ce75c1` |
| `toB.png` | 0 / 26 | `f2fc7a7b40a00e7cfa3677feabb5d9207552e44d981994df56cb1b8ba5f23fc7` | `734ebdd4059aadc6de1e217b973451705d26ab2d3af2c60b4caab29896f7808d` |

## Kiểm, cắt, neo và preview
Kiểm từng lượt bằng `node tools/assets/phuthe-sheet-check.mjs kim_vu_mieu_ung --out <temp>/<lượt>/check` (tương đương `npm run phuthe:check -- kim_vu_mieu_ung --out ...`). Kết quả từng lượt trong source JSON không thay bằng kết quả cutter. Cắt thử bằng `phuthe-sheet-cut.mjs`, neo bằng `phuthe-anchor.mjs --source anim`, preview bằng `phuthe-sheet-preview.mjs`. Đầu ra: `C:/Users/PC/.ao/data/artifacts/soul_land_game-705/kim_vu_mieu_ung/`; trang `preview/index.html`, `preview/xoay-vong.html` có nam/nữ, đủ clip và hướng tây lật ngang. Preview chuẩn của công cụ ghép theo khung LPC; `anchor.json` tách riêng cho chủ repo chỉnh ráp, không khẳng định preview GIF đã áp neo mới.

## Quyết định ban đầu và lỗi mắt
Không nhập game; giữ nhánh cũ. A đủ 3/3 lượt vẫn chặn (A1 cast dính, A2 không dò đủ hàng, A3 chặn nộm/khung). B1 đạt 0 chặn/26 nhẹ và được dùng làm ảnh dẫn C/D/E; A hỏng không được dùng. C/D/E mỗi tờ 1 lượt rồi dừng vì A đã không đủ điều kiện nhập; C/D nom-mat 22 chặn, E attack 5/6 hình. Cắt chẩn đoán chọn A1 + B1/C1/D1/E1, 110 khung, 0 block/96 warn/2 info; A/E dùng gap+uniform-cols dự phòng.

Khai báo bằng mắt (`--eye` chưa có trong CLI, chỉ lưu hồ sơ):

```text
--eye "toA=ghép — toàn tờ — nộm nhỏ, vuốt thấp gần chân"
--eye "toB/toC=phụ thể/nộm — toàn tờ — thêm đầu/thân chim, se/e gần nhau; cyan còn trong bản cắt e"
--eye "toD/toE=hướng/ghép — ne/n — lộ mặt chim, cyan sót trên LPC; chỉ khai mắt, không sinh riêng để sửa mặt"
```

Đã xem khung giữa của đủ năm clip trên cả LPC nam/nữ: chim che người, nộm sót ở e/ne/n và đường cắt sai; không chứng nhận ráp đạt đẹp.

## Nhập bổ sung theo chỉ đạo chủ repo qua orchestrator (28/10)

Chỉ đạo mới cho phép nhập hướng đạt và dùng candidate của hướng chặn nếu cắt sạch, phần còn lại giữ nguồn cũ. **Đã nhập đủ năm hướng** bằng `phuthe-import`; không đổi kết quả checker RAW thành đạt. Bản game dùng bảng sau, cả hai giới:

| Hướng | RAW được cắt | Cơ sở lựa chọn |
|---|---|---|
| s | `candidates/toA-attempt1.png` | A1 còn dính cast nhưng giữ đủ bốn hàng để cắt; A2 mất hàng, A3 nhiều chặn hơn nên không chọn |
| se | `toB.png` (B1) | 0 chặn RAW |
| e | `candidates/toC-attempt1.png` | RAW chặn nom-mat do cyan lệch khóa gốc; cắt lại theo màu thực tế đã hết mảng nộm |
| ne | `candidates/toD-attempt1.png` | Như e; lỗi mặt chỉ khai mắt |
| n | `candidates/toE-attempt1.png` | RAW còn dính attack; bản cắt đủ khung và hết mảng nộm |

Khóa nộm trên bảng tham chiếu/prompt là `#00D0D0`, nhưng RAW model vẽ cyan sáng hơn: màu phổ biến C khoảng `(0,235,253)`, D `(0,240,252)`, A/B quanh `(1,224,234)`. Bản cắt thử với khóa gốc còn cyan ở e/ne/n nên **không nhập bản thử đó**. Chạy lại cutter với `--dummy-key #00E8F8` (chỉ tham số tách màu; không đổi pixel RAW, prompt hay source lịch sử), giữ dung sai mặc định. Kết quả 110 khung, 0 block / 130 warn / 2 info; A/E vẫn dùng `gap+uniform-cols`, B/C/D dùng gap. Giữ nguyên báo cáo RAW chặn ở bảng trên, không dùng màu khóa mới để sửa lịch sử đánh giá.

Đầu vào nhập: `C:/Users/PC/.ao/data/artifacts/soul_land_game-705/kim_vu_mieu_ung-nhap/`. Đã xem khung giữa của cả năm clip × năm hướng × nam/nữ: cyan che LPC trong bản thử đã hết, không có khung rỗng; vẫn còn đầu/thân chim, hướng gần nhau và cánh/vuốt xén. Đây là ngoại lệ nhập candidate cắt được theo chỉ đạo mới; chưa chứng nhận đạt đẹp.

Lệnh cắt: `node tools/assets/phuthe-sheet-cut.mjs --id kim_vu_mieu_ung --dummy-key #00E8F8 --sheet A=<A1> --sheet B=<B1> --sheet C=<C1> --sheet D=<D1> --sheet E=<E1> --out <thư mục trên>`. Neo bằng `phuthe-anchor.mjs --source anim`, nhập bằng `phuthe-import.mjs --id kim_vu_mieu_ung --dir <thư mục trên> --anchor <thư mục trên>/anchor.json`. Game thêm `vhanim_kim_vu_mieu_ung_b/f` và neo; không hướng nào cần lấy ảnh cũ trong sheet mới. Ảnh `vh_kim_vu_mieu_ung_b/f` cũ vẫn giữ trong repo. Không sửa client/tools, không sinh thêm ảnh; chủ repo chỉnh ráp tiếp.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phuthe-anim/kim_vu_mieu_ung/` | - | builtin `image_gen.imagegen` (Codex, Q44) | A–E, prompt direction --concept-ref tự sinh, SHA256 và tham chiếu trong source cạnh RAW | 2026-10-28 | RAW giữ nguyên, xem quyết định nhập ở trên; LPC tham chiếu đã có trong repo |
