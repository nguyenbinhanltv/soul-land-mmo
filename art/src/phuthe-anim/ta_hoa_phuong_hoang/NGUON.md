# Tà Hỏa Phượng Hoàng — phụ thể hoạt ảnh A–E

Part of #1024. Ngày 2026-10-27. **Hiện hành:** chủ repo duyệt turnaround lượt 2 tại comment [6443812560](https://github.com/nguyenbinhanltv/soul-land-mmo/issues/1024#issuecomment-6443812560); tiếp tục A–E theo phần cuối hồ sơ. Không nhập game.

**Lịch sử turnaround:** các phần từ “Quy trình và nguồn” đến “Ghi công” bên dưới mô tả ba lượt turnaround trước khi chủ repo chấp nhận lượt 2. “3/3” ở giai đoạn đó chỉ tính turnaround, không tính các tờ hướng. Các kết luận chặn mắt cũ được giữ để truy vết, quyết định mới ở phần “Tiếp tục A–E” có hiệu lực.

## Quy trình và nguồn

Công cụ duy nhất: builtin `image_gen.imagegen` của Codex; model/seed `unknown`. Mỗi lượt một lần gọi, chỉ hai ảnh tham chiếu được chỉ định; không dùng lượt hỏng làm tham chiếu. RAW giữ nguyên byte, không resize/vẽ đè/sửa mặt. Kích thước cả ba ảnh 1536×1024.

Prompt nguyên bản do `node tools/assets/phuthe-sheet-prompt.mjs --id ta_hoa_phuong_hoang --stage turnaround --out <temp>` sinh; không viết tay hay addendum. Prompt thực gửi và source JSON đi kèm từng RAW. Ngoại hình từ mục 4, STYLE/NEGATIVE nguyên văn mục 6 của `docs/art/vo-hon-phong-cach.md`. Bài học nộm/phụ thể sau lượt 1 và 2 ghi trong `art/src/phuthe-anim/lessons.md`, được công cụ chèn tự động vào lượt sau.

Ảnh tham chiếu theo thứ tự:
1. `references/ta_hoa_phuong_hoang-nom-turnaround.png`, do công cụ dựng từ LPC nam, khóa cyan **#00D0D0**, nền **#FF00FF**, khung **96**, neo **(48, 74)**. SHA256 `0d2d6f89cb2bd86d886b08460334f589fb4e332971d0ab9eb6b2dd9aaeb81456`.
2. `art/src/vohon-v2/ta_hoa_phuong_hoang/concept-attempt3.png`, concept lượt 3 đã merge, chỉ làm **ảnh neo ngoại hình** theo yêu cầu; SHA256 `afbfb627a42f3f956e6749b8a92809610a700592fda556459c294f30c76d1373`. Concept này vốn có ne sai, không dùng làm chứng cứ hướng đạt. Prompt tự sinh mặc định chỉ liệt kê bảng nộm; ảnh neo thứ hai được đính theo yêu cầu nhiệm vụ, không sửa prompt.

## Hồ sơ RAW

| Lượt | File | SHA256 ảnh | SHA256 prompt |
|---|---|---|---|
| 1 | `candidates/turnaround-attempt1.png` | `768dbefeec56d9ba3920d2b29187350d08ffdccac8afe2381e69e6c69327c212` | `5f17756af8d72bd4784c92b2cc11ad3ff275932685d731968170420298aac0c9` |
| 2 | `candidates/turnaround-attempt2.png` | `fa7f51cf58c33792a8c395537909b5d3cc39bdf9301f010d1cb9667d48c8046a` | `82d770a45c588672c2b9cfaf79ebb1e24123a8520496b81bcdaf9a9a69fc9de3` |
| 3 | `candidates/turnaround-attempt3.png` | `03126ba676a9cb9f2e24b2680106f37b6dd224eec5b64f8d9c4ccfec9cc76012` | `05ea0653c9753b642222a3e60a503f9e7b22a7228315a2cf9c8bafa3f761cd33` |

## Kết quả

- Lượt 1: **chặn tự động** — chỉ dò 2/3 dải hàng. Mắt: nguyên chim đứng sau người, nộm dời xuống. ne quay trái/lộ mặt; n nhìn lưng. Chưa đạt 5 góc hợp lệ.
- Lượt 2: **pass tự động** (chỉ lưới/nền của turnaround), **chặn mắt** — vẫn nguyên chim, nộm dời xuống/có viền. ne quay trái/lộ mặt; n nhìn lưng. Chưa đạt 5 góc hợp lệ.
- Lượt 3: **chặn tự động** — H2 attack chỉ tách 4/5 hình, hình dính. Mắt: cánh gọn hơn nhưng còn đầu/ngực chim, nộm dời xuống/biến dạng. ne quay trái/lộ mặt; n nhìn lưng. Chưa đạt 5 góc hợp lệ.

Mỗi ảnh có đủ 15 ô ý định (5 hướng s, se, e, ne, n × idle/attack đỉnh/hurt); đây là turnaround, **không phải năm tờ hoạt ảnh A–E**. se/e còn gần nhau, không chứng nhận số góc thật. Tây dự kiến lật ngang se/e/ne theo đặc tả, chưa tạo sheet tây.

## Khai báo duyệt mắt (--eye)

`phuthe-sheet-check.mjs` hiện không hỗ trợ cờ `--eye` (CLI báo tùy chọn lạ); khai theo khuôn trong NGUON, không thay đổi kết quả tự động:

```text
--eye "turnaround-attempt1=phụ thể/nộm — toàn tờ — nguyên chim sau người, nộm dời xuống (chặn)"
--eye "turnaround-attempt1=hướng — ne cả ba hàng — quay trái và lộ mặt (chặn); n nhìn lưng"
--eye "turnaround-attempt2=phụ thể/nộm — toàn tờ — nguyên chim sau người, nộm dời xuống/có viền (chặn)"
--eye "turnaround-attempt2=hướng — ne cả ba hàng — quay trái và lộ mặt (chặn); n nhìn lưng"
--eye "turnaround-attempt3=phụ thể/nộm — toàn tờ — còn đầu/ngực chim, nộm dời xuống/biến dạng (chặn)"
--eye "turnaround-attempt3=hướng — ne cả ba hàng — quay trái và lộ mặt (chặn); n nhìn lưng"
```

Lỗi ne/n chỉ khai, không vẽ đè hoặc sinh thêm riêng để sửa mặt. Lượt 2–3 thử sửa nộm/điểm gắn và hình nguyên con, không phải lượt sửa hướng.

## Kiểm, cắt, xem trước

Đã chạy `node tools/assets/phuthe-sheet-check.mjs ta_hoa_phuong_hoang --dir <temp/check-input> --out <temp/checkN>` riêng mỗi lượt (đặt RAW nguyên byte dưới tên turnaround.png trong thư mục tạm): lượt 1 exit 1, lượt 2 exit 0, lượt 3 exit 1. Kết quả lưới là như trên, không chứng nhận lỗi mắt.

**Cắt và preview hoạt ảnh bị chặn ở cổng turnaround:** chưa có ảnh mẫu đạt để sinh A–E. Theo tài liệu, turnaround chỉ duyệt bằng mắt, không cắt vào game; `phuthe-sheet-cut` chỉ nhận năm tờ hướng 6×4, không nhận turnaround 5×3. Không gán giả turnaround thành toA/toE, không nhân khung hay tạo preview hoạt ảnh giả. Vì vậy chưa chạy được cut/preview hợp lệ. RAW xem trực tiếp trong candidates; hồ sơ này chưa hoàn thành demo hoạt ảnh. Không có manifest, sheet game hay thay đổi client/server.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phuthe-anim/ta_hoa_phuong_hoang/candidates/turnaround-attempt{1,2,3}.png` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Thử turnaround phụ thể có nộm; prompt tự sinh, SHA256 và source JSON kèm từng lượt. | 2026-10-27 | Chặn, không nhập game; model/seed unknown. |
| `references/ta_hoa_phuong_hoang-nom-turnaround.png` | - | `phuthe-sheet-dummy.mjs`, thân LPC hiện có | Bảng nộm cyan, dựng tự động; nguồn/giấy phép lớp thân theo hồ sơ LPC hiện có của repo. | 2026-10-27 | Chỉ tham chiếu vị trí, không asset game mới. |

Sau AO review: bài học thứ ba đã khái quát để không ép cánh lông lửa lên mọi võ hồn nhóm B. Prompt lượt 3 giữ nguyên bản thực gửi (bản bài học trước sửa nằm ở commit 8d34f105), không sinh thêm ảnh.

## Tiếp tục A–E (27/10/2026)
Chủ repo duyệt turnaround lượt 2: https://github.com/nguyenbinhanltv/soul-land-mmo/issues/1024#issuecomment-6443812560. Chọn candidates/turnaround-attempt2.png, copy nguyên byte sang turnaround.png để công cụ đọc. Quyết định này thay cổng chặn turnaround trong hồ sơ cũ; giữ nguyên khai lỗi mắt. Chỉ sinh A–E, không nhập game.

### Tờ hướng A–B

- A (`s`), 1 lượt: 1536×1024, kỹ thuật 0 chặn / 58 nhẹ. Bốn hàng đủ 6/6/6/4 hình; nộm thu nhỏ và dời xuống so với bảng nộm; một số pose đầu/ngực chim quay sang phải thay vì giữ chính diện. Cánh lớn, có phần vượt cửa sổ cutter. Không chứng nhận đạt đẹp bằng mắt.
- B (`se`), 1 lượt: 1536×1024, kỹ thuật 0 chặn / 62 nhẹ. Cast cuối gần chính diện; nộm thu nhỏ/dời xuống, cánh sát mép. Không chứng nhận đạt đẹp bằng mắt.
- Prompt nguyên văn trích khối `text` của file do `phuthe-sheet-prompt.mjs` sinh, không viết thêm. RAW nguyên byte; nguồn, SHA256 ảnh/prompt và tham chiếu đúng thứ tự ở `toA.source.json`, `toB.source.json`. Model/seed unknown.
- B tham chiếu bảng nộm B → turnaround lượt 2 → A (A không có khối chặn tự động). C dự kiến tham chiếu bảng nộm C → turnaround lượt 2 → B (B không có khối chặn tự động). Điều kiện tham chiếu ở đây là kiểm kỹ thuật theo yêu cầu, không phải duyệt mắt hoàn toàn.

```text
--eye "toA=hướng — H1 C2–4, H2/H3 nhiều ô — đầu/ngực chim nghiêng phải thay vì s; không vẽ sửa RAW"
--eye "toA=phụ thể/nộm — toàn tờ — nộm thu nhỏ, dời xuống; cánh sát mép, cast cuối vượt ô"
--eye "toB=hướng — H4 C4 — cast cuối gần chính diện thay vì se"
--eye "toB=phụ thể/nộm — toàn tờ — nộm thu nhỏ, dời xuống; cánh sát mép"
```
### Tờ D và lượt C bị loại

- D (`ne`), 1 lượt: kỹ thuật 0 chặn / 61 nhẹ. Tham chiếu thực tế: bảng nộm D → turnaround lượt 2 → B (không dùng C lỗi). Cánh/đầu chim gần góc ngang `e`, lộ mặt ở mọi clip; cast cuối gần chính diện. Chỉ khai mắt theo yêu cầu, không sinh thêm để sửa ne/n. Nộm vẫn thu nhỏ/dời xuống so với bảng.
- C lượt 1 nằm ở `candidates/toC-attempt1.*`: chặn `hinh-dinh` H3, dò được 4 thay vì 6 hình; nhẹ `o-trong` H4 C5. Không dùng làm tham chiếu. Lượt 2 giữ nguyên prompt tự sinh và ba ảnh nộm C → turnaround lượt 2 → B.

```text
--eye "toD=hướng — toàn tờ ne — lộ mặt, góc gần e; H4 C4 gần chính diện; chỉ khai, không vẽ sửa"
--eye "toD=phụ thể/nộm — toàn tờ — nộm thu nhỏ/dời xuống, cánh sát mép"
```
### Tờ E

- E (`n`), 2 lượt, chọn lượt 2: kỹ thuật 0 chặn / 54 nhẹ. Lượt 1 chặn lưới (3 dải thay vì 4), lưu `candidates/toE-attempt1.*`; lượt 2 sinh lại vì lưới, không nhằm sửa lỗi mặt.
- Tham chiếu cả hai lượt: bảng nộm E → turnaround lượt 2 → D (D không có khối chặn kỹ thuật). Lượt chọn vẫn lộ mặt; nhiều ô attack quay ngang phải. Không vẽ thêm mặt sau, không sửa RAW.

```text
--eye "toE=hướng — toàn tờ n — lộ mặt; H3 nhiều ô nhìn ngang phải, không có góc sau thật; chỉ khai, không vẽ sửa"
--eye "toE=phụ thể/nộm — toàn tờ — nộm thu nhỏ/dời xuống, cánh sát mép"
```

## Kết quả cuối A–E (27/10/2026)

Cả năm tờ có 22 hình ý định, 1536×1024, RAW nguyên byte. Tối đa 3 lượt mỗi tờ được giữ đúng: A=1, B=1, C=3, D=1, E=2. Chọn A1/B1/C3/D1/E2. Các lượt C1/C2/E1 bị loại nằm ở candidates, không làm tham chiếu. Không có ảnh từ công cụ khác image_gen của Codex.

| Tờ | Hướng | Lượt chọn/tổng | Chặn / nhẹ tự động | SHA256 ảnh | SHA256 prompt |
|---|---|---|---|---|---|
| A | s | 1/1 | 0 / 58 | `e1df266239a6669c2d35bc8488f853733b46d53236c6d701f440ee0401e7a27d` | `358a7a6de01d031d892cf8d489ddb1424664e7733ed4f0892df1a1c6815e77ff` |
| B | se | 1/1 | 0 / 62 | `aba7ccbd5b489217dc5b1410683f8389db3c56fa714507adae5517a5e73d874a` | `1039eb683ff236f2c0aed59b120a9dff2b9b50ea525503329fd63df22bc08d03` |
| C | e | 3/3 | 0 / 51 | `0cf8b3c44696be854b9eda2157f09e2b763fcabca6657130e7ca118a46fa1c8e` | `98faa51b08ba796afdd58096845a8bf3830059485b4754c6697d0f76506dab28` |
| D | ne | 1/1 | 0 / 61 | `e1b87fab6a8ff2854368243cdcbb3993aca02c3fb9dbeefb3dcae5b45e2f43b0` | `74d5e2c16a54cb535aed29d44d0474067708b744eec679db42779e9c3617d010` |
| E | n | 2/2 | 0 / 54 | `de8884275bb5de1fd8f37fdea8bd894fbaf37514b32f24131aa9e2717a5df53f` | `e752593d30a7b187066fbe62f41e941f2e644a00793126b51ed16d76fa62e784` |

C3: hướng e nhìn phải ở phần lớn khung, cast cuối gần chính diện; nộm thu nhỏ/dời xuống và cánh sát mép.

```text
--eye "toC=hướng — H4 C4 — cast cuối gần chính diện thay vì e"
--eye "toC=phụ thể/nộm — toàn tờ — nộm thu nhỏ/dời xuống, cánh sát mép"
```

### Kiểm, cắt và xem trước cuối

Lệnh kiểm: `node tools/assets/phuthe-sheet-check.mjs ta_hoa_phuong_hoang --out <temp>/phuthe-666-final-check` (exit 0). Mức chung nhẹ; đây chỉ là kỹ thuật, không chứng nhận mọi hướng đạt bằng mắt. `--eye` không có trong CLI, nên chỉ lưu các khai báo ở hồ sơ này, không sửa công cụ.

Lệnh cắt: `node tools/assets/phuthe-sheet-cut.mjs --id ta_hoa_phuong_hoang --sheet A=art/src/phuthe-anim/ta_hoa_phuong_hoang/toA.png --sheet B=art/src/phuthe-anim/ta_hoa_phuong_hoang/toB.png --sheet C=art/src/phuthe-anim/ta_hoa_phuong_hoang/toC.png --sheet D=art/src/phuthe-anim/ta_hoa_phuong_hoang/toD.png --sheet E=art/src/phuthe-anim/ta_hoa_phuong_hoang/toE.png --out <artifact>/phuthe-ta-hoa`. Dùng `lop.json`: s/se/e toàn bộ sau thân; ne/n toàn bộ trước thân theo bảng cánh + đuôi. Không sửa RAW.

Preview: `node tools/assets/phuthe-sheet-preview.mjs --id ta_hoa_phuong_hoang --dir <artifact>/phuthe-ta-hoa`. Artifact phiên: `C:/Users/PC/.ao/data/artifacts/soul_land_game-666/phuthe-ta-hoa/preview/index.html`, trang xoay `xoay-vong.html`. Có nam/nữ, 5 clip, 5 hướng gốc + 3 hướng tây lật; không tạo RAW tây riêng. Không chép sheet vào shared/assets, không đăng ký manifest game.

### Ghi công A–E

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `to{A..E}.png`, `candidates/toC-attempt{1,2}.png`, `candidates/toE-attempt1.png` | - | builtin `image_gen.imagegen` (Codex, Q44) | Prompt tự sinh từ phuthe-sheet-prompt; prompt/source JSON đi kèm; SHA256 như bảng và source | 2026-10-27 | Model/seed unknown, RAW nguyên byte, không nhập game |
| `references/ta_hoa_phuong_hoang-nom-to{A..E}.png` | - | `phuthe-sheet-dummy.mjs`, LPC hiện có | Bảng nộm tham chiếu từng tờ | 2026-10-27 | Nộm cyan #00D0D0; chỉ tham chiếu |

### Soát ảnh ghép LPC cuối

Cutter cuối: 110 khung, 96×96, 32 màu, 0 block / 186 warn / 0 info; cả A–E dùng lưới gap. Bỏ 671 mảnh vụn; lớp sau 471883 điểm, lớp trước 317574 điểm. Preview tạo đủ 50 GIF clip (nam/nữ × 5 hướng × 5 clip), 10 GIF xoay và hai trang HTML. Lần cắt cuối thay bản chẩn đoán C2/lớp mặc định trước đó.

Soát ảnh ghép từ chính composeFrame của preview ở 96×96: nộm RAW nhỏ/dời xuống nên thân LPC thật che nhiều phần chim, một số cánh/đuôi chạm và bị cắt ở mép; hướng s còn nghiêng phải, cast cuối B/C/D gần chính diện; ne/n lộ mặt như khai. Chưa chứng nhận neo/ghép đạt đẹp, không nhập game. Không sinh thêm để sửa mặt ne/n. Bộ này là hồ sơ sinh tờ + cắt thử để review, không thay quyết định chủ repo đã duyệt turnaround.

Bài học rút ra: kiểm lưới tự động không bảo đảm model giữ nộm đúng cỡ/điểm gắn; cần xem ghép LPC thật trước khi nhập. Prompt lần này giữ nguyên công cụ, không thêm câu viết tay. Không sửa lessons chung ngoài phạm vi.

`npm run check` và `npm run build` đã đạt sau khi cài thư viện thực trong worktree (không junction); bot CI thuộc diện skip vì chỉ ảnh/hồ sơ, không server/SQL. Không đổi client/server, manifest game, workflow hay công cụ.

Prompt của A–E và candidates được sinh trước khi merge main mới: revision `fe159a9a8a50c12f11c0d1b66957f5ac44084c96`, blob `tools/assets/phuthe-sheet-prompt.mjs` = `4ceca8a3bae43234b7fa0a596332ba5ca3d6cb3c`. Các file references/to*.md và to*.prompt.txt giữ đúng bản đã gửi, không tái sinh theo công cụ mới sau merge.

## Cập nhật bảng nộm tham chiếu (#1171)
Cả sáu bảng nộm trong `references/` (turnaround + toA–toE) được dựng lại bằng công cụ có **vạch tham chiếu** (đường chân, trục, tâm ngực, thước chiều cao thân, góc khung; màu khóa vạch **#7A5CFF**, nộm vẫn cyan **#00D0D0**, khung 96, neo (48, 74), vị trí nộm không đổi). `nom-turnaround.png` mới SHA256 `3d218426bc61b52cd457505e184fb210dec14b3d97bab95d0206e21a8672788f`. Mọi SHA256 / ảnh tham chiếu của bảng nộm ghi ở trên (turnaround và năm tờ A–E, candidates) là của bảng nộm CŨ không vạch; lượt sinh sau dùng bảng mới và prompt có khối `GUIDE LINES`. Cutter vẫn trừ được tờ vẽ trên bảng cũ (không có vạch thì không có gì để trừ).
