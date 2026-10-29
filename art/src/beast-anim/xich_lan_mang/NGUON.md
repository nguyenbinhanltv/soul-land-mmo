# Xích Lân Mãng — RAW hoạt ảnh (#1277)

File này **tự sinh** bằng `node tools/assets/beast-nguon.mjs --species xich_lan_mang`; không sửa tay (sửa khai báo rồi sinh lại). Dòng `LỖI:` đến từ `beast-sheet-check.mjs` (cỡ, nền, lưới, số hình, chân, khung chết) và từ khai báo `--eye` (mắt người); không có nguồn nào khác. Cỡ thân lệch KHÔNG phải lỗi (quyết định chủ repo 2026-10-26 mục 4): ghi thành dòng `Ghi chú kỹ thuật` ở từng tờ. Nộp ảnh không phải đã duyệt hay đã nhập game.

Loài `xich_lan_mang` (Xích Lân Mãng), họ `snake`, khung game 96×96. Mức kiểm chung: **nhẹ**.


## toA

- File: `toA.png`, **948×1659**, 1841914 byte, SHA256 `d1e8c8455f6b2bbdf960ac56a2b42917436639bcadfa0bee4c0d218aad02aaa1`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toA.prompt.txt` (SHA256 `9dc205c6ed2f26ff3dd7b8f7923b16d75ce2250543bcc5b767c95c49f4f79310`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: s nhẹ, se nhẹ, e nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (s): cỡ thân idle 88% so với ảnh tĩnh (lệch 12%); cutter neo lại, không chặn.
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H9–12 (e): cỡ thân idle 121% so với ảnh tĩnh (lệch 21%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 2 mục lỗi (dòng `LỖI:` bên dưới).

## toB

- File: `toB.png`, **1254×1254**, 1879248 byte, SHA256 `c15ddce0dd95e64fc6d11674eae1810497a6604b8aef016760f8b6602bb5b675`.
- Công cụ: built-in image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1.
- Prompt: `toB.prompt.txt` (SHA256 `48310fac1f5f6359625dbc2dc0c19d9e1ee3090c6d0b8686c54df647aafeae36`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: ne pass, n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H5–8 (n): cỡ thân idle 89% so với ảnh tĩnh (lệch 11%); cutter neo lại, không chặn.
- Duyệt bằng mắt: 3 mục lỗi (dòng `LỖI:` bên dưới).

## to-n

- File: `to-n.png`, **1536×1024**, 1588236 byte, SHA256 `346d50e3c68c2e12017cdca3b0a96ff9a5a5c8be223f44063d69329b7a3b3774`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-797.
- Prompt: `to-n.prompt.txt` (SHA256 `4dc43bf5e77973ca846cb799ee545128c7616d9d36af5737fa05917f1c31fe7f`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **nhẹ** (khối hướng: n nhẹ).
- Ghi chú kỹ thuật (cỡ thân, không phải lỗi): H1–4 (n): cỡ thân idle 221% so với ảnh tĩnh (lệch 121%, quá 25%); cutter neo lại, không chặn.
- Duyệt bằng mắt: đã xem, không thấy lỗi.

## Tờ chưa vào thư mục chính (candidates)

Với nhãn to-<hướng>, số lượt đã dùng dưới đây tính RIÊNG vòng 2 (tối đa 3 lượt bổ sung); số lượt cũ giữ ở sổ trước vòng 2. RAW được chọn là lượt ít lỗi chặn hơn sau soát kỹ thuật và bằng mắt; vẫn giữ ảnh tĩnh trong game.

Các tờ dưới đây chưa có `toX.png` ở thư mục chính (bị chặn sau các lượt sinh); chỉ có bản thử ở `candidates/`. Nhãn `toX` là nhãn đúng của tờ.

### to-ne (candidates)

- File chọn: `candidates/to-ne-797-attempt3.png`, **1536×1024**, SHA256 `02e1a675f3a3dbe92841244ef140d0ae60d1cd3ce4e18dfc18c0d36d96810d3c`; lượt tìm thấy: 1, 2, 3.
- Số lượt đã dùng: 3; lượt được chọn: 3.
- Mức kiểm: **pass**.
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).

## Các lượt bổ sung vòng 2 (phiên 797)

Các mục sau sinh bằng beast-nguon trên staging LF của từng ứng viên; tờ lỗi không dùng làm tham chiếu.

### to-ne-797-attempt1

- File: `candidates/to-ne-797-attempt1.png`, **1536×1024**, 1525651 byte, SHA256 `adff772490453fff19084542ea9eb0777dbfc719f3e9abdef6dc4cdfe6209aef`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 1; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt1.prompt.txt` (SHA256 `5a8931400fd8248ea2234fff8ee4025af0327212c8f83ae506899eedaad75c1d`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: đuôi tù, mất nhận diện rắn. **Không chọn cho bản nhập cuối.**

### to-ne-797-attempt2

- File: `candidates/to-ne-797-attempt2.png`, **1536×1024**, 1674870 byte, SHA256 `065f81fecaa528e627d6c9b0c67948b9c6ba9399e0f726855adde9d736881c43`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt2.prompt.txt` (SHA256 `bf51f6a8839aaa910653c0596ea700511c2c35519eca3fd3e1dc2edb2f972506`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **chặn** (khối hướng: ne chặn).
- Duyệt bằng mắt: **chưa duyệt bằng mắt** (`n` / `ne` lộ mặt, hurt, die, `se` ≈ `e` chưa ai xem).
- Ghi chú lượt / nhập: lưới hàng die chỉ dò 3 hình, dính hình. **Không chọn cho bản nhập cuối.**

### to-ne-797-attempt3

- File: `candidates/to-ne-797-attempt3.png`, **1536×1024**, 1446502 byte, SHA256 `02e1a675f3a3dbe92841244ef140d0ae60d1cd3ce4e18dfc18c0d36d96810d3c`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 3; phiên: soul_land_game-797.
- Prompt: `candidates/to-ne-797-attempt3.prompt.txt` (SHA256 `42bad438fdbb2c0245116f6eb0655f41749b9a83f991249b1bcdcb65bfbd664b`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: ne pass).
- Duyệt bằng mắt: 1 mục lỗi (dòng `LỖI:` bên dưới).
- Ghi chú lượt / nhập: đủ 4 hình die nhưng đầu quay ngang/lộ mặt khi chết. **Không chọn cho bản nhập cuối.**

### to-n-797-attempt1

Không thu được RAW: nhóm yêu cầu đầu lỗi bộ lọc, không thu được RAW hướng này. Yêu cầu này vẫn tính trong trần lượt bổ sung.

### to-n-797-attempt2

- File: `candidates/to-n-797-attempt2.png`, **1536×1024**, 1588236 byte, SHA256 `346d50e3c68c2e12017cdca3b0a96ff9a5a5c8be223f44063d69329b7a3b3774`.
- Công cụ: image_gen.imagegen; model: unknown (công cụ sinh ảnh không công bố); seed: unknown (công cụ sinh ảnh không công bố); số lượt: 2; phiên: soul_land_game-797.
- Prompt: `candidates/to-n-797-attempt2.prompt.txt` (SHA256 `4dc43bf5e77973ca846cb799ee545128c7616d9d36af5737fa05917f1c31fe7f`).
- Ảnh gốc giữ nguyên byte; không resize / sửa pixel.
- Mức kiểm: **pass** (khối hướng: n pass).
- Duyệt bằng mắt: đã xem, không thấy lỗi.
- Ghi chú lượt / nhập: đạt; die cuộn hạ thân, đầu giữ phía trên. **Được chọn cho hướng đã nhập.**

## Lỗi

```text
LỖI: toA — chân lệch / hình ở ô trống — H4 (s) C1, H8 (se) C5, H8 (se) C6, H8 (se) C1, H12 (e) C1 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 18%); ô trống có hình (7.1% diện tích ô): hình tràn từ ô bên; ô trống có hình (7.11% diện tích ô): hình tràn từ ô bên; chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 14%); chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 20%).
LỖI: toA — walk lệch hướng — S H2 và SE H6 — quay ngang sang phải (mắt)
LỖI: toA — die nằm ngang — S H4 và SE H8 — lệch trục hướng (mắt)
LỖI: toB — chân lệch — H8 (n) C4 — chân lệch > 12% chiều cao so với trung vị dải (lệch lớn nhất 13%).
LỖI: toB — lộ mặt — NE H1 hurt, H2 walk, H3 attack; N H6 walk, H7 attack — vi phạm quy tắc n/ne không thấy mặt (mắt)
LỖI: toB — die nằm ngang — NE H4 và N H8 — lệch trục hướng (mắt)
LỖI: toB — Turnaround sửa lô 1: 2 lượt riêng chưa đạt; lượt 1 die ne lộ mắt, lượt 2 s/se có hai đầu; giữ fallback hướng yêu cầu. RAW và prompt thật/provenance kèm tại art\src\beast-anim\xich_lan_mang\candidates/turnaround-attempt1.png SHA256 e11fddc5b9105b602696e11ecabf8660c7d2f6e8104b68cd944f13060999acfd; art\src\beast-anim\xich_lan_mang\candidates/turnaround-attempt2.png SHA256 38939594a46aab6819938060aaea63ca427012357272a89c5d5110148317f23d (mắt)
LỖI: candidates/to-ne-797-attempt3 — đủ 4 hình die nhưng đầu quay ngang/lộ mặt khi chết (mắt)
LỖI: candidates/to-ne-797-attempt1 — đuôi tù, mất nhận diện rắn (mắt)
LỖI: candidates/to-ne-797-attempt2 — hình dính — H4 (ne) — dải có 3 hình, cần 4: hình dính nhau.
```

## Ghi công

Bảng này `tools/assets/credits.mjs` gom vào màn Ghi công (cùng cột với các mục AI ở `art/CREDITS.md`); không nối dòng vào `art/CREDITS.md`.

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/beast-anim/xich_lan_mang/` | - | built-in image_gen.imagegen | RAW hoạt ảnh Xích Lân Mãng: toA 948×1659, toB 1254×1254; model, seed, prompt thật và hash ở các mục trên | - | Soát bằng mắt trước khi duyệt |
