# Tà Hỏa Phượng Hoàng — thử phụ thể có nộm, chưa đạt

Part of #1024. Ngày 2026-10-27. **3/3 lượt tổng, đã dừng sinh. Tất cả là candidates, chưa chọn ảnh đạt. Không nhập game.**

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
