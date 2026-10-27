# u_minh_linh_mieu — phụ thể hoạt ảnh A–E, lô 1 (#1025)

Ngày 2026-10-28. Công cụ **builtin image_gen.imagegen (Codex, Q44)**; model/seed `unknown`. RAW nguyên byte, không resize/hậu kỳ. Prompt nguyên khối text của `phuthe-sheet-prompt.mjs --stage direction --concept-ref`, không viết tay/addendum. Trước mỗi lượt thêm một bài học ngắn vào `art/src/phuthe-anim/lessons.md`.

## Tham chiếu và lượt
Nộm từng tờ ở `references/`, concept lượt lớn nhất ở thư mục chính `art/src/vohon-v2/u_minh_linh_mieu/` (không candidates), rồi tờ A đã kiểm 0 chặn nếu có. Thứ tự và SHA256 từng tham chiếu, prompt, revision công cụ, toàn bộ kết quả kiểm nằm trong `.source.json` cạnh RAW. Nộm U Minh Linh Miêu `#00D0D0`, vạch `#FF8C00`.

| RAW | Chặn / nhẹ | SHA256 ảnh | SHA256 prompt |
|---|---|---|---|
| `candidates/toA-attempt1.png` | 0 / 39 | `753342b095496698f9e9393ad4dd2e8f63a3733d80d0d4e4cbd554e46f2ce8ae` | `34e4c937d646153b534d28e5b78406703749c75e4322cf171de2938ae0823b25` |
| `candidates/toA-attempt2.png` | 0 / 29 | `f78fb6ff8e45f188702f29481eb3c7b572598a3f80a981ce3c35c3115f9e8abb` | `2ab521dcd74f86f02caf313534e1f6b95acaa76b77d88566c2a85b4f9bcd7e18` |
| `candidates/toC-attempt1.png` | 1 / 0 | `010ecb2bbd500e47c0bf62d84773a4a82feb424ae0fa12146d230087d9f05b28` | `dfa505eca6efccaea644e4a2cc1315b9c8159e0b2d69555fdc771a22f25e44d0` |
| `toA.png` | 0 / 28 | `6a0bafdb8675d0207fbe03a8ff1efe75f56aff30b7f2f06c6d2b70dc57bbea5c` | `2ec8bfa4079d59601d2ba805afef80a2e6146fc11889bfa01f2476d9ff6283e7` |
| `toB.png` | 0 / 37 | `1b050b8162de8c71729c610b8a09fae1117f844e4a444c6f5fc4c4408474effb` | `2346e0cfbec32b2e7e367e412d4fd8efdeadde7b16450dfa73608f144ce6267b` |
| `toC.png` | 0 / 34 | `324a60f23a3bd034352fe5f31d4e9093bd3f4a99a4fe0db20ac83db0651242c3` | `135989136add79f2b6624b419ff555c3fe05afab6c97cebe3706d8d11ca024fd` |
| `toD.png` | 0 / 28 | `82e470e0dd9b4c1c01ceae70037f8b71a6df324d9fc4ba229cd7f85afba9867d` | `3aadbbe4a308addbfcd6a7896280d9d10de431073c213064861c5ecb58cc919b` |
| `toE.png` | 0 / 30 | `cecf460f8c778f2ccb31b06f6a1abd02208941b50d808ab8993e5cd25dc9f56f` | `ef1bc93aef23c74bf92bace81b864ce6d0a1e483c5742970760ec5a2f2e67422` |

## Kiểm, cắt, neo và preview
Kiểm từng lượt bằng `node tools/assets/phuthe-sheet-check.mjs u_minh_linh_mieu --out <temp>/<lượt>/check` (tương đương `npm run phuthe:check -- u_minh_linh_mieu --out ...`). Kết quả từng lượt trong source JSON không thay bằng kết quả cutter. Cắt thử bằng `phuthe-sheet-cut.mjs`, neo bằng `phuthe-anchor.mjs --source anim`, preview bằng `phuthe-sheet-preview.mjs`. Đầu ra: `C:/Users/PC/.ao/data/artifacts/soul_land_game-705/u_minh_linh_mieu/`; trang `preview/index.html`, `preview/xoay-vong.html` có nam/nữ, đủ clip và hướng tây lật ngang. Preview chuẩn của công cụ ghép theo khung LPC; `anchor.json` tách riêng cho chủ repo chỉnh ráp, không khẳng định preview GIF đã áp neo mới.

## Quyết định và lỗi mắt
Đã nhập kỹ thuật theo chủ repo duyệt 28/10 để chủ repo chỉnh ráp: A3/B1/C2/D1/E1 đều 0 chặn, số nhẹ lần lượt 28/37/34/28/30. A 3/3 lượt (chọn A3), B/D/E 1 lượt, C 2 lượt (C1 dính attack 2/6 hình, C2 đạt). Tờ loại lưu candidates, không dùng làm ảnh dẫn. B/C/D dùng A3; E dùng D1 đã đạt kiểm. Cutter 110 khung, 0 block/119 warn/0 info, A–E đều gap, không lưới đều dự phòng. Dùng mặt nạ mặc định theo vùng của công cụ, không có lop.json riêng. Neo source anim nằm ở artifact và được phuthe-import gộp vào bảng game. Chạy phuthe-import hai lần: lần hai giữ ảnh và manifest; không đổi client/server. Game thêm `vhanim_u_minh_linh_mieu_b/f`, giữ ảnh phụ thể cũ để fallback.

Khai báo bằng mắt (`--eye` chưa có trong CLI, chỉ lưu hồ sơ):

```text
--eye "toA/toB/toC=phụ thể/nộm — toàn tờ — nguyên con linh miêu thay vì chỉ tai/đuôi/vuốt; nộm nhỏ/thấp, vệt chém, se/e gần nhau, cast gần chính diện"
--eye "toD/toE=hướng — ne/n — lộ mặt linh miêu; chỉ khai mắt, không sinh riêng để sửa mặt"
```

Đã xem khung giữa của đủ năm clip trên cả LPC nam/nữ: linh miêu che thân; cỡ, điểm gắn và hướng cần chủ repo chỉnh ráp, chưa chứng nhận đạt đẹp. Đã mở trang thử trong client nhưng canvas AO Browser chưa vẽ nhân vật; ảnh chụp trống không dùng làm bằng chứng đạt trong game.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phuthe-anim/u_minh_linh_mieu/` | - | builtin `image_gen.imagegen` (Codex, Q44) | A–E, prompt direction --concept-ref tự sinh, SHA256 và tham chiếu trong source cạnh RAW | 2026-10-28 | RAW giữ nguyên, xem quyết định nhập ở trên; LPC tham chiếu đã có trong repo |
