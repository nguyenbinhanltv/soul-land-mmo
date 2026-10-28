# Yêu Hồ — phụ thể hoạt ảnh lô 2 (Part of #1025)

## Trạng thái hiện hành: đã nhập năm hướng (2026-10-28)

Chủ repo cho phép nhập mọi hướng cutter 0 block và chỉ khai lỗi mắt. Đã kiểm riêng A–E bằng --partial --strict (mỗi hướng 22 khung, 0 block), rồi cắt bộ tổng 110 khung: **0 block / 146 warn**. Đã nhập s, se, e, ne, n; không còn hướng dùng fallback. Dùng A3/B3/C1/D2/E1. Tai còn tách đầu, đuôi che/xén thân ở ne/n; chỉ khai mắt, chủ repo chỉnh sau.

Neo chỉ do phuthe-anchor.mjs tính và phuthe-import.mjs ghi; không chỉnh tay. Không sửa RAW/prompt/source lịch sử. Các kết luận chưa nhập bên dưới là hồ sơ trước lần nhập này, không còn là trạng thái hiện hành.

## Hồ sơ lịch sử PR #1199 (trước nhập)


Ngày 2026-10-28. Hoàn tất bước 1–6; **không nhập game**: năm tờ RAW đều 0 chặn tự động, cutter 0 block / 146 warn, nhưng bản ráp sau neo còn tai tách khỏi đầu và đuôi che/xén thân ở ne/n. Giữ nguyên nhánh phụ thể cũ để chủ repo chỉnh ráp. Không chứng nhận đạt đẹp.

## Quy trình và nguồn

Đã git fetch origin + git merge origin/main trước khi làm. Công cụ ảnh duy nhất: builtin image_gen.imagegen của Codex; model/seed unknown. RAW 1536×1024 giữ nguyên byte, không hậu kỳ. Mỗi lượt một lần gọi với danh sách tham chiếu riêng. Prompt nguyên khối text do phuthe-sheet-prompt.mjs --id yeu_ho --stage direction --dir s|se|e|ne|n --concept-ref sinh; không viết tay/addendum. Trước mỗi lượt đã đọc lỗi và thêm một dòng lessons.md; prompt lưu đúng bản đã gửi, không tái sinh theo bài học mới.

Nộm references/yeu_ho-nom-toA..E.png: khung 96, gốc (48,74), khóa #00D0D0, vạch #7A5CFF, nền #FF00FF. Concept neo ngoại hình: art/src/vohon-v2/yeu_ho/concept-attempt1.png. Mỗi source.json lưu SHA256 RAW/prompt/từng tham chiếu đúng thứ tự và toàn bộ kết quả kiểm. Nguồn LPC theo hồ sơ LPC hiện có.

## Các lượt và kết quả

| RAW | Lượt của tờ | Chặn / nhẹ | Soát mắt |
|---|---|---|---|
| toA.png | 3 | 0 / 18 | Tai/ba đuôi; nộm nhỏ/dời so với bảng, cần soát ráp |
| toB.png | 3 | 0 / 28 | se gần e; đã giữ nộm ngang, nộm nhỏ/dời; cần soát ráp |
| toC.png | 1 | 0 / 47 | Tai/đuôi đúng dạng; nộm nhỏ/dời, cast cần kiểm mép |
| toD.png | 2 | 0 / 54 | --eye toD=hướng — ne mọi clip — gần e; nộm nhỏ/dời, cần soát ráp |
| toE.png | 1 | 0 / 54 | --eye toE=hướng — n walk/attack — quay ngang phải; chỉ khai. Nộm bị đổi sang ngang ở nhiều ô. |
| candidates/toA-attempt1.png | 1 | 0 / 47 | REJECT: nguyên hồ ly sau nộm, nộm thu nhỏ/dời xuống |
| candidates/toA-attempt2.png | 2 | 22 / 0 | REJECT: còn đầu/mặt hồ ly, attack che nộm |
| candidates/toB-attempt1.png | 1 | 22 / 1 | REJECT: se còn gần s ở idle/cast; nộm nhỏ/dời, tai/đuôi đã gắn |
| candidates/toB-attempt2.png | 2 | 22 / 1 | REJECT: nộm chính diện thay dáng ngang, không đạt bảng tham chiếu |
| candidates/toD-attempt1.png | 1 | 18 / 7 | REJECT: --eye toD=hướng — ne mọi clip — gần e, chưa rõ góc lưng; chỉ khai, không sinh riêng sửa mặt |

Chọn A3/B3/C1/D2/E1. Tổng 10 lượt, mỗi tờ không quá 3 (A3, B3, C1, D2, E1). A1/A2/B1/B2/D1 ở candidates, không dùng làm tham chiếu. B1/B2 dùng A3 đạt kỹ thuật; B3 bỏ ảnh thứ ba tùy chọn sau lỗi sao nộm chính diện; C1 dùng B3, D1 dùng C1, D2 dùng B3, E1 dùng D2. Mỗi tờ luôn có nộm đúng tờ ở ảnh 1, concept ở ảnh 2.

## Cắt, neo và preview

Lệnh: npm run phuthe:check -- yeu_ho --out <temp>; phuthe-sheet-cut.mjs --id yeu_ho --sheet A=.../toA.png ... --sheet E=.../toE.png --out <artifact>/yeu_ho; phuthe-anchor.mjs --id yeu_ho --source anim --dir <artifact>/yeu_ho --out <artifact>/yeu_ho/anchor.json; phuthe-sheet-preview.mjs --id yeu_ho --dir <artifact>/yeu_ho.

Cắt đủ 110 khung, 96×96, 32 màu, lưới gap cả A–E. lop.json: mặc định sau ở s/se/e, vùng tai trước; ne/n trước. Đã tính neo nam/nữ (scale 1 mọi hướng), preview gốc ghép LPC đủ 5 clip × 8 hướng, GIF nam/nữ và trang xoay. Preview gốc chưa áp anchor; bảng khung chẩn đoán sau neo dùng cùng composeFrame, nearest quanh gốc chân theo anchor để soát.

Artifact: C:/Users/PC/.ao/data/artifacts/soul_land_game-706/yeu_ho/preview/index.html; anchor.json cùng thư mục cha. Đã đính artifact vào AO. ao preview từ artifact bị PREVIEW_FILE_OUTSIDE_WORKSPACE; đã kiểm bằng bảng PNG khung ghép nam/nữ từ hàm preview. Không dựng server chỉ để hiển thị file tĩnh.

## Khai báo mắt

```text
--eye "toD=hướng — ne mọi clip — gần e, chưa rõ góc lưng; chỉ khai, không sinh riêng sửa mặt"
--eye "toE=hướng — n walk/attack — nhiều pose ngang phải; chỉ khai, không sinh riêng sửa mặt"
--eye "A–E=điểm gắn — sau neo nam/nữ — tai tách khỏi đầu, đuôi che/xén thân ne/n (chặn); giữ nhánh cũ"
```

Không phuthe-import, không đổi manifest/anchor game. Không sinh vượt trần A/B đã 3 lượt.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| to{A,B,C,D,E}.png, candidates/to*-attempt*.png | - | builtin image_gen.imagegen (Codex) | Prompt phuthe-sheet-prompt --concept-ref; SHA256 và hồ sơ từng RAW đi kèm | 2026-10-28 | RAW phụ thể; chưa nhập game; model/seed unknown |
| references/yeu_ho-nom-to*.png | - | phuthe-sheet-dummy.mjs, LPC hiện có | Nộm có vạch, chỉ tham chiếu | 2026-10-28 | Nguồn/giấy phép LPC theo hồ sơ hiện có |

## Phiếu tổng hợp cuối lô

| Hướng | RAW cắt | Chặn / nhẹ tự động | Soát ráp / quyết định |
|---|---|---|---|
| s | toA.png | 0 / 18 | chặn điểm gắn sau neo; tai/vuốt/đuôi không bám thân |
| se | toB.png | 0 / 28 | chặn điểm gắn sau neo; tai/vuốt/đuôi không bám thân |
| e | toC.png | 0 / 47 | chặn điểm gắn sau neo; tai/vuốt/đuôi không bám thân |
| ne | toD.png | 0 / 54 | chặn điểm gắn sau neo; tai/vuốt/đuôi không bám thân |
| n | toE.png | 0 / 54 | chặn điểm gắn sau neo; tai/vuốt/đuôi không bám thân |

Các lỗi góc ne/n chỉ khai --eye ở trên; không sinh riêng để sửa mặt. Chặn điểm gắn/màu nộm là lý do giữ nhánh game cũ. Không có võ hồn nào được nhập trong lô này.

### Tham chiếu thực dùng

| RAW | Thứ tự ảnh 1 → 2 → 3 (nếu có) |
|---|---|
| toA.png | art/src/phuthe-anim/yeu_ho/references/yeu_ho-nom-toA.png → art/src/vohon-v2/yeu_ho/concept-attempt1.png |
| toB.png | art/src/phuthe-anim/yeu_ho/references/yeu_ho-nom-toB.png → art/src/vohon-v2/yeu_ho/concept-attempt1.png |
| toC.png | art/src/phuthe-anim/yeu_ho/references/yeu_ho-nom-toC.png → art/src/vohon-v2/yeu_ho/concept-attempt1.png → art/src/phuthe-anim/yeu_ho/toB.png |
| toD.png | art/src/phuthe-anim/yeu_ho/references/yeu_ho-nom-toD.png → art/src/vohon-v2/yeu_ho/concept-attempt1.png → art/src/phuthe-anim/yeu_ho/toB.png |
| toE.png | art/src/phuthe-anim/yeu_ho/references/yeu_ho-nom-toE.png → art/src/vohon-v2/yeu_ho/concept-attempt1.png → art/src/phuthe-anim/yeu_ho/toD.png |
| candidates/toA-attempt1.png | art/src/phuthe-anim/yeu_ho/references/yeu_ho-nom-toA.png → art/src/vohon-v2/yeu_ho/concept-attempt1.png |
| candidates/toA-attempt2.png | art/src/phuthe-anim/yeu_ho/references/yeu_ho-nom-toA.png → art/src/vohon-v2/yeu_ho/concept-attempt1.png |
| candidates/toB-attempt1.png | art/src/phuthe-anim/yeu_ho/references/yeu_ho-nom-toB.png → art/src/vohon-v2/yeu_ho/concept-attempt1.png → art/src/phuthe-anim/yeu_ho/toA.png |
| candidates/toB-attempt2.png | art/src/phuthe-anim/yeu_ho/references/yeu_ho-nom-toB.png → art/src/vohon-v2/yeu_ho/concept-attempt1.png → art/src/phuthe-anim/yeu_ho/toA.png |
| candidates/toD-attempt1.png | art/src/phuthe-anim/yeu_ho/references/yeu_ho-nom-toD.png → art/src/vohon-v2/yeu_ho/concept-attempt1.png → art/src/phuthe-anim/yeu_ho/toC.png |

Bài học đã được diễn đạt lại sau kiểm thử để không lọt từ khóa nộm vào chế độ --no-dummy và không ghi số pixel cố định; các prompt lưu trữ vẫn giữ đúng bản thực gửi.

### Bài học riêng loài (chỉ hồ sơ)

Yêu Hồ: tai và ba đuôi; không vẽ nguyên đầu/thân hồ ly sau nộm. Chi tiết này chỉ lưu tại hồ sơ và prompt lịch sử, không chèn vào bài học chung nhóm B. Theo AO review #1199, các bài học lô 2 trong lessons.md đã gộp thành ba câu chung để không ép số chi thể của loài này lên loài khác; không sửa RAW/prompt/source cũ và không sinh thêm lượt.

<!-- phuthe-import:huong -->
### Hướng đã nhập (tự ghi bởi `phuthe-import.mjs`, `anim.dirsOk` trong manifest)

Đủ 5 hướng.

| Hướng | Trạng thái |
|---|---|
| s (tờ A) | đã nhập hoạt ảnh vẽ thật |
| se (tờ B) | đã nhập hoạt ảnh vẽ thật |
| e (tờ C) | đã nhập hoạt ảnh vẽ thật |
| ne (tờ D) | đã nhập hoạt ảnh vẽ thật |
| n (tờ E) | đã nhập hoạt ảnh vẽ thật |
<!-- /phuthe-import:huong -->
