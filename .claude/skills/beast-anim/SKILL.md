---
name: beast-anim
description: Hoạt ảnh vẽ thật của hồn thú (H4, #766, theo dõi #861), hai phần: SINH (spec v2, turnaround rồi từng hướng, prompt tự sinh, checklist beast:check, bảng triệu chứng → sửa prompt, tối đa 3 lượt) và DUYỆT / NHẬP (beast:check, tờ liên hệ, trang xoay vòng hướng, phiếu chặn / nhẹ theo khối hướng, cutter v2, GIF, nhập game, sổ trạng thái). Dùng khi sinh tờ hoạt ảnh một loài, soát tờ tthoadev nộp, cắt / nhập loài vào game, sửa mẫu prompt hoặc bài học.
---

# Hoạt ảnh vẽ thật của hồn thú

Một skill hai phần để người sinh ảnh và người duyệt dùng **cùng một chuẩn** (trước đây bài học nằm ở issue, prompt mỗi người tự thêm, tiêu chí đạt mơ hồ). Nối từ `asset-gen` (phần hồn thú) và `CONTRIBUTING.md`. Đặc tả luật: `docs/art/hon-thu-hoat-anh.md` (cỡ khung, bố cục tờ, tiêu chí chặn / nhẹ, cutter, trang xem trước); skill này là **thao tác**. Quyết định chủ repo (2026-10-26, #861): vẫn sinh ảnh vẽ thật; tờ 1:1 ra 1254² là hợp lệ; **giữ** hoạt ảnh hurt (2 khung) và die (4 khung).

| Việc | Công cụ |
|---|---|
| Sinh prompt + hướng dẫn | `node tools/assets/beast-sheet-prompt.mjs --species <loài> --stage turnaround\|direction\|sheet [--dir s,se,…] --out <thư mục>` |
| Bài học (một nguồn) | `art/src/beast-anim/lessons.md` (parser `beast-sheet-lessons.mjs`) |
| Kiểm tờ RAW | `npm run beast:check -- <loài> [--out <thư mục>]` (`--all` in bảng) |
| NGUON + dòng `LỖI:` | `node tools/assets/beast-nguon.mjs --species <loài> …` (`npm run beast:nguon -- …`) |
| Sổ trạng thái | `npm run beast:status` → `art/src/beast-anim/_status.json` + `_status.md` |
| Cắt, xem trước | `beast-sheet-cut.mjs`, `beast-sheet-preview.mjs`, `beast-recut-all.mjs` |

Mọi lệnh chỉ đọc RAW; không resize / sửa ảnh gốc, không ghi key / bí mật.

---

## Phần A — SINH (tthoadev / worker sinh ảnh)

### A1. Spec v2 đầu vào (đã chốt, bảng tóm tắt; luật đầy đủ ở docs)
| Mục | Quy định |
|---|---|
| Cỡ ảnh | Theo **tỉ lệ**, không đòi pixel: 2:3 → 1024×1536; 1:1 → 1254² hoặc 1024²; 3:2 → 1536×1024. Công cụ Codex `image_gen` chỉ nhận prompt / tham chiếu / nền, **không có ô chọn cỡ**: ra cỡ nào hợp tỉ lệ cũng hợp lệ, cutter chuẩn hóa. |
| Nền | `#FF00FF` phẳng; dung sai khóa nền 60 (gradient nhẹ / vignette không phải lỗi). Nền trong suốt thật cũng nhận. |
| Lưới | Đếm **hàng** và **số hình mỗi hàng** (6 hình hàng idle+hurt / walk / attack, 4 hình hàng die), không đòi ô đều; hình được lệch / chạm mép ô vài điểm. Hình dính nhau hoặc thiếu hình mới là lỗi. |
| Hướng | Chỉ vẽ `s`, `se`, `e`, `ne`, `n` (thứ tự cố định); tây lật ngang → mọi hướng nghiêng **nhìn sang phải**. |
| Khung | idle 4, walk 6, attack 6, **hurt 2**, **die 4** (hàng 1 = idle + hurt; hàng die hai ô cuối trống). |
| Hurt / die | hurt lùi ngắn dọc hướng đang quay, không ngửa bụng, không quay mặt; die đổ dọc hướng, xương sống song song hướng, không xoay 90°; `n` / `ne` không thấy mắt / mặt trong **mọi** khung. |

### A2. Hai giai đoạn (khuyên dùng, W4 + W2)
1. **Turnaround** (`--stage turnaround`): **một** ảnh 3:2, 5 cột hướng × 3 hàng (idle, hurt, die) = 15 hình. Duyệt bằng mắt; đây là ảnh mẫu hướng. Rẻ để thử lại.
2. **Từng hướng** (`--stage direction`): mỗi hướng một tờ 1536×1024, lưới 6×4, 22 khung, mã `A..E` = `s, se, e, ne, n`. Tham chiếu theo **thứ tự cố định**: (1) ảnh tĩnh loài, (2) turnaround đã duyệt, (3, tùy chọn) một tờ hướng của chính loài đã qua `beast:check` **không có khối chặn** (chỉ để khớp nét / bảng màu).
3. `--stage sheet` (v1: tờ A gộp `s/se/e`, tờ B gộp `ne/n`; loài lớn một hướng một tờ) là **đường dự phòng** cho loài đơn giản; tờ B đính thêm tờ A **đã duyệt**.

Prompt và hướng dẫn tiếng Việt do công cụ sinh (`<loài>-turnaround.md`, `<loài>-to<X>.md`): **không viết / sửa tay**; thấy thiếu ý thì sửa mẫu `beast-sheet-prompt.mjs` hoặc thêm bài học vào `lessons.md` (cú pháp ở đầu file) rồi sinh lại.

### A3. Checklist trước khi nộp
1. Đặt RAW **nguyên byte** vào `art/src/beast-anim/<loài>/to<X>.png` (turnaround: `turnaround.png`), kèm `to<X>.prompt.txt` (prompt thật đã gửi).
2. `npm run beast:check -- <loài>`; mở các `*-lien-he.png` (xanh đạt, vàng nhẹ, đỏ chặn; nhãn `I/W/A/H/D` + số khung). Phải sạch mục **chặn**: cỡ ngoài tập, nền, thiếu khung / hình dính / không dò được lưới, cỡ thân lệch > 25%.
3. **Bằng mắt** (công cụ không kiểm): `n` / `ne` không thấy mặt (kể cả hurt, die); `se` khác `e` (thấy mặt chếch xuống); hurt lùi đúng hướng; die giữ hướng; đúng loài; cùng cỡ với tờ chuẩn.
4. Sinh NGUON: `node tools/assets/beast-nguon.mjs --species <loài> --write [--model … --seed … --attempts toA=2] [--eye "toB=hướng — N H8 C3–4 — die lộ mặt"] [--eye-ok toA]`. Công cụ ghi cỡ thật, byte, SHA256, prompt (`to<X>.prompt.txt`, `turnaround.prompt.txt`) và dòng `LỖI:` từ kiểm tự động; `turnaround.png` có mục riêng (không kiểm tự động, chỉ `--eye turnaround=…`), loài mới chỉ có turnaround cũng sinh được; mục xem bằng mắt khai bằng `--eye` / `--eye-ok`. **Không viết NGUON hay dòng `LỖI:` bằng tay**; model / seed công cụ không công bố thì để `unknown`, không đoán.
5. PR: ghi `Part of #<đợt>`; ảnh gốc đi kèm NGUON tự sinh. Không cắt, không sửa client.

### A4. Bảng triệu chứng → sửa prompt
| Triệu chứng (thấy ở tờ liên hệ / lỗi) | Sửa lượt sau |
|---|---|
| `n` lộ mặt | Đính turnaround có cột `n` đúng; prompt đã có câu cấm (bài học "n"): nhắc lại "no face visible in any frame, hurt and die included" cho **khối đó**. |
| `se` ≈ `e` | Đính turnaround có cột `se`; nêu "thấy mặt chếch xuống, thân chéo 45°". Thú ngồi xổm giống thật thì xem bằng mắt, không tự kết lỗi. |
| `ne` ≈ `e` (nhìn ngang) | Nêu "lưng và mông gần người xem nhất, thân quay chéo 45° ra xa". |
| hurt ngửa bụng / quay mặt | Dùng câu hurt của họ (lùi ngắn dọc hướng, chân giữ đất); thú thấp (ếch, rùa, heo) thêm "hunker lower". |
| die xoay 90° / nằm ngang | Dùng câu die ("đổ dọc hướng, giữ trục xương sống"). |
| Khung sao chép khuôn (idle trùng nhau, hurt = idle) | Thêm bài học "mỗi khung đổi nhẹ"; vẽ lại cả tờ hướng. |
| Cỡ thân `n` / `ne` to hơn | Cỡ khác prompt: **bỏ qua** (cutter neo cỡ theo ảnh tĩnh); chỉ vẽ lại nếu lệch cỡ thân trong **cùng** tờ. |
| Nền gradient / cỡ 1254² | Bỏ qua (công cụ xử lý). |
| Hình dính nhau / thiếu khung | Vẽ lại **chỉ khối (tờ) đó**: thêm "clear magenta space between neighbours". |
| Tờ phụ lệch phong cách so với tờ chuẩn | Đính tờ hướng đã **đạt** làm tham chiếu thứ ba; không dùng tờ lỗi. |

### A5. Giới hạn lượt
**Tối đa 3 lượt cho mỗi khối** (turnaround, hoặc một tờ hướng). Chọn lượt có ít mục chặn / nhẹ nhất (số từ `beast:check`) rồi mắt. **Không** dùng tờ / ảnh lỗi làm tham chiếu cho lượt sau (lỗi lan từ tờ A sang tờ B ở các đợt trước). Vẽ lại **chỉ khối hỏng**, không cả loài.

**Quá 3 lượt:** dừng, nộp lượt tốt nhất kèm NGUON tự sinh (dòng `LỖI:` giữ nguyên), ghi vào PR / issue khối nào vẫn chặn; orchestrator nhập từng khối không chặn, khối chặn giữ ảnh tĩnh (hoặc xin chủ repo duyệt phương án dự phòng). Không tạo prompt viết tay để "cố thêm".

---

## Phần B — DUYỆT / NHẬP (orchestrator)

Thứ tự: **check → tờ liên hệ → trang xoay vòng → phiếu → cutter v2 → GIF → nhập → sổ**.

1. **Kiểm:** `npm run beast:check -- <loài> --out <thư mục ngoài repo>`. CI (`beast-sheet-ci.mjs`) chỉ chặn bốn nhóm (cỡ ngoài tập, nền ngoài dung sai, thiếu khung, không dò được lưới); còn lại ở bảng cảnh báo. **Trước khi mở PR** `npm run check` (hoặc `node tools/assets/beast-sheet-ci.mjs --local`) chạy đúng kiểm này trên tờ đổi; hook pre-commit cũng chặn tờ sai cỡ (tờ A phải 2:3 = 1024×1536; model trả sai thì sinh lại, không resize RAW).
2. **Tờ liên hệ:** mở từng `<loài>-to<X>-lien-he.png` (≈ 2 phút / loài). Với `n` / `ne` lộ mặt, hurt, die: xem bằng mắt (công cụ không kiểm).
3. **Cắt tạm và xem trước:** `node tools/assets/beast-sheet-cut.mjs --species <loài> --sheet A=… … --out <thư mục>` (tờ 3:2 tự nhận bố cục theo hướng; `--layout direction` để ép), rồi `node tools/assets/beast-sheet-preview.mjs --species <loài> --dir <thư mục>`; mở `preview/xoay-vong.html`: GIF xoay `s→se→e→ne→n` cạnh ảnh tĩnh; 5 giây là thấy `se` ≈ `e`, `n` lộ mặt, hurt ngửa bụng, die xoay.
4. **Phiếu theo khối hướng** (`s`, `se`, `e`, `ne`, `n`), mỗi khối một mức:
   - **Chặn** (không nhập khối đó): cỡ ngoài tập / nền / thiếu khung / hình dính; `n` / `ne` thấy mặt ở idle / walk / attack (hurt, die cũng không được); `se` không khác `e`; sai loài; cỡ thân lệch quá ±25% so với ảnh tĩnh.
   - **Nhẹ** (nhập, ghi sổ): hurt biên độ nhỏ; die hơi xoay nhưng còn đọc được; vài khung vượt ô cắt được; cỡ thân lệch 10–25%; nền gradient / 1254².
   - **Đạt đẹp:** idle / walk lặp mượt, hurt lùi rõ, die giữ hướng.
   Mẫu comment một dòng mỗi khối: `s: đạt` · `se: nhẹ — hurt biên độ nhỏ` · `ne: chặn — H4 C1–4 thấy mặt`.
5. **Cắt thật bằng cutter v2:** chuẩn hóa kích thước mặc định bật, lưới dò theo khoảng trống, neo cỡ khối theo ảnh tĩnh. Có khối chặn thì **không nhập khối đó**: hoặc nhập loài đủ khối không chặn, hoặc trả vẽ lại **chỉ khối** (A5); ô gán sai vài khung dùng `--patch` thay vì vẽ lại tờ. So bảng cỡ thân idle 5 hướng trước / sau (report `blocks`).
6. **GIF:** xem lại `preview/index.html` (hoạt ảnh × 8 hướng, hàng đầu là ảnh tĩnh để so cỡ / màu / nét) trước khi nối client.
7. **Nhập game** (quy trình của loài đã nhập, ví dụ `beast_phong_lang_anim`): chép `<loài>_anim.png` vào `shared/assets/sprites/beast/`, `node tools/assets/normal.mjs <file>` sinh `_n.png`, thêm entry của `manifest-entry.json` vào `shared/assets/sprites/manifest.json`, ghi dòng nguồn ở `art/CREDITS.md` (`node tools/assets/credits.mjs --check`), chạy `npm run check`. Loài đủ tờ đạt mới nhập; loài có khối chặn giữ ảnh tĩnh.
8. **Sổ trạng thái:** `npm run beast:status` cập nhật `art/src/beast-anim/_status.json` + `_status.md` (bảng tự sinh thay bảng tay ở #766; mỗi tờ: cỡ, byte, SHA256, mức kiểm, khối hướng, đã nhập chưa); commit cùng PR. Kiểm sổ mới: `npm run beast:status -- --check`.

Chủ repo chỉ duyệt mẫu (loài đầu mỗi họ: bốn chân / chim / rắn / côn trùng / cây / boss) và tranh chấp; loài còn lại orchestrator tự duyệt theo phiếu trên.

---

## Bài học mới
Lượt vẽ hỏng cho bài học mới thì thêm **một dòng** vào `art/src/beast-anim/lessons.md` (`- [phạm vi] câu tiếng Anh // ghi chú tiếng Việt`), chạy `node --test tools/assets/beast-anim-v2.test.mjs` rồi sinh lại prompt. Không đặt bài học ở issue, comment PR hay prompt viết tay.

## Kiểm sau khi sửa công cụ
`npm run check` + `npm run test:assets`; thử mỗi giai đoạn bằng `node tools/assets/beast-sheet-prompt.mjs --species phong_lang --stage turnaround|direction|sheet` và `npm run beast:status -- --check`.
