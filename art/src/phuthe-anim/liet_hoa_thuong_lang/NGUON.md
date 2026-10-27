# Liệt Hỏa Thương Lang — phụ thể hoạt ảnh lô 2 (Part of #1025)

Ngày 2026-10-28. Hoàn tất bước 1–6 trong trần lượt; **không nhập game**: A2/B2/E3 không chặn tự động, C3 còn 22 chặn nom-mat và D1 còn 3 chặn nom-mat. C/D đã dùng đủ 3 lượt. Giữ nhánh phụ thể cũ; các tờ C/D chỉ cắt chẩn đoán, không chứng nhận điểm gắn hay đúng pose.

## Quy trình và nguồn

Đã git fetch origin + git merge origin/main trước lô. Công cụ ảnh duy nhất: builtin image_gen.imagegen của Codex; model/seed unknown. Mỗi lượt một lần gọi với danh sách tham chiếu riêng. RAW 1536×1024 giữ nguyên byte, không resize/vẽ đè/sửa mặt. Prompt nguyên khối text do phuthe-sheet-prompt.mjs --id liet_hoa_thuong_lang --stage direction --dir s|se|e|ne|n --concept-ref sinh, không viết tay/addendum. Đọc lỗi và thêm một bài học ngắn vào lessons.md trước mỗi lượt. Prompt lưu đúng bản thực gửi.

Nộm references/liet_hoa_thuong_lang-nom-toA..E.png: khung 96, gốc (48,74), khóa #00D0D0, vạch #7A5CFF, nền #FF00FF. Concept chính ở art/src/vohon-v2/liet_hoa_thuong_lang/ (lượt lớn nhất ở thư mục chính); không dùng ảnh candidates của concept. Mỗi source.json ghi SHA256 RAW/prompt/từng tham chiếu đúng thứ tự cùng báo cáo kiểm đầy đủ. Nguồn LPC theo hồ sơ LPC hiện có.

## Các lượt

| RAW | Lượt của tờ | Chặn / nhẹ | Soát mắt |
|---|---|---|---|
| toA.png | 2 | 0 / 23 | Đúng tai/đuôi/vuốt; attack có vệt quét lửa, cast nở lớn; nộm nhỏ/dời |
| toB.png | 2 | 0 / 28 | se gần e, nộm nhỏ/dời, vuốt theo tay; vệt lửa attack |
| toE.png | 3 | 0 / 18 | Nộm lưng, không mảnh lửa rời lớn; cast có thêm khối lửa, cần soát ráp |
| candidates/toA-attempt1.png | 1 | 0 / 43 | REJECT: nguyên sói phía sau, không phải tai/đuôi/vuốt gắn nộm |
| candidates/toB-attempt1.png | 1 | 1 / 1 | REJECT: sao nộm chính diện từ A thay bảng ngang B; sai dáng nộm |
| candidates/toC-attempt1.png | 1 | 22 / 0 | Tai/đuôi/vuốt đúng dạng; nộm nhỏ/dời, attack có vệt lửa |
| candidates/toC-attempt2.png | 2 | 1 / 0 | REJECT: nguyên sói sau nộm, có đầu/thân/chân riêng |
| candidates/toC-attempt3.png | 3 | 22 / 0 | Đúng chi thể, nộm nhỏ/dời; lượt cuối C |
| candidates/toD-attempt1.png | 1 | 3 / 31 | --eye toD=hướng — ne mọi clip — gần e; chỉ khai, không sinh riêng sửa mặt. Nộm nhỏ/dời. |
| candidates/toD-attempt2.png | 2 | 22 / 0 | --eye toD=hướng — ne mọi clip — gần e; chỉ khai. Nộm nhỏ/dời. |
| candidates/toD-attempt3.png | 3 | 1 / 1 | --eye toD=hướng — ne mọi clip — gần e; chỉ khai. Lượt cuối D, nộm nhỏ/dời. |
| candidates/toE-attempt1.png | 1 | 22 / 2 | --eye toE=hướng — n walk/attack — nhiều pose ngang phải; chỉ khai, không sinh riêng sửa mặt. Nộm nhỏ/dời. |
| candidates/toE-attempt2.png | 2 | 1 / 0 | Nộm lưng, đúng chi thể; có viền/tô nhẹ trên cyan; cast nở lớn |

Tổng 13 lượt; trần từng hướng: {"s":2,"se":2,"n":3,"e":3,"ne":3}. Tờ chọn cho cắt: A=toA.png (A2), B=toB.png (B2), C=candidates/toC-attempt3.png (đúng chi thể nhưng chặn nộm, không chọn C2 nguyên sói), D=candidates/toD-attempt1.png (ít chặn nhất), E=toE.png (E3). Tờ trong candidates không bao giờ làm tham chiếu; nếu chọn cắt chẩn đoán thì vẫn giữ nguyên trạng thái chặn và chỉ rõ trong danh sách trên. Một số lượt bỏ ảnh thứ ba tùy chọn sau lỗi sao nộm hoặc mất nộm; mọi tham chiếu thực dùng phải xem source.json, không suy từ tên tờ.

## Kiểm, cắt, neo, preview

Đã chạy npm run phuthe:check riêng từng lượt bằng thư mục input tạm chứa RAW nguyên byte dưới tên toX.png; source.json giữ toàn bộ kết quả. Kiểm tổng chỉ đọc tờ chính, không thay kiểm riêng của candidate. Cắt bằng phuthe-sheet-cut.mjs --id liet_hoa_thuong_lang --sheet A=... ... --sheet E=... --out <artifact>/liet_hoa_thuong_lang; neo bằng phuthe-anchor.mjs --id liet_hoa_thuong_lang --source anim --dir <artifact>/liet_hoa_thuong_lang --out <artifact>/liet_hoa_thuong_lang/anchor.json; preview bằng phuthe-sheet-preview.mjs --id liet_hoa_thuong_lang --dir <artifact>/liet_hoa_thuong_lang.

lop.json: đuôi sau, vùng tai/vuốt trước theo bảng điểm gắn. Cắt 110 khung 96×96, hai lớp, GIF 5 clip × 5 hướng gốc + ba hướng tây lật, đủ nam/nữ; có trang xoay. Anchor đo nam/nữ; preview gốc chưa áp anchor. Bảng PNG chẩn đoán sau neo dùng cùng composeFrame, dịch/phóng nearest quanh gốc chân theo anchor để soát điểm gắn.

Artifact: C:/Users/PC/.ao/data/artifacts/soul_land_game-706/liet_hoa_thuong_lang/preview/index.html, anchor.json và _report.json ở thư mục cha. Đã đính preview vào AO; mở trực tiếp artifact bằng ao preview bị giới hạn PREVIEW_FILE_OUTSIDE_WORKSPACE ở phiên này, nên soát qua bảng khung PNG từ hàm ghép preview.

## Khai báo mắt và nhập game

```text
--eye "toD=hướng — ne — gần e, chưa chứng nhận góc lưng mọi khung; chỉ khai, không sinh riêng sửa mặt"
--eye "toE=hướng — n — còn pose nghiêng/ngang; chỉ khai, không sinh riêng sửa mặt"
```

Không phuthe-import nếu còn bất kỳ khối chặn kỹ thuật hoặc điểm gắn. Không đổi manifest/anchor game cho bộ bị chặn. Kết luận đầu hồ sơ là trạng thái hiện hành; ảnh cắt chẩn đoán không chứng nhận đạt nhập.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| to*.png, candidates/to*-attempt*.png | - | builtin image_gen.imagegen (Codex) | Prompt phuthe-sheet-prompt --concept-ref; SHA256 và hồ sơ từng RAW đi kèm | 2026-10-28 | Phụ thể hoạt ảnh; model/seed unknown |
| references/liet_hoa_thuong_lang-nom-to*.png | - | phuthe-sheet-dummy.mjs, LPC hiện có | Nộm có vạch, chỉ tham chiếu | 2026-10-28 | Nguồn/giấy phép LPC theo hồ sơ hiện có |

### Kết quả cắt và soát ráp
Cutter 110 khung, 0 block / 63 warn; không thay kết luận RAW C/D. Bảng nam/nữ sau neo còn tai/vuốt tách khỏi thân, các mảnh cyan ở C/D và khối đuôi che đầu; chặn mắt, không nhập. Không chứng nhận đủ năm hướng hợp lệ.


## Phiếu tổng hợp cuối lô

| Hướng | RAW cắt | Chặn / nhẹ tự động | Soát ráp / quyết định |
|---|---|---|---|
| s | toA.png | 0 / 23 | chặn điểm gắn sau neo; tai/vuốt/đuôi không bám thân |
| se | toB.png | 0 / 28 | chặn điểm gắn sau neo; tai/vuốt/đuôi không bám thân |
| e | candidates/toC-attempt3.png | 22 / 0 | chặn RAW nộm; còn cyan trong bản ráp, chỉ chẩn đoán |
| ne | candidates/toD-attempt1.png | 3 / 31 | chặn RAW nộm; còn cyan trong bản ráp, chỉ chẩn đoán |
| n | toE.png | 0 / 18 | chặn điểm gắn sau neo; tai/vuốt/đuôi không bám thân |

Các lỗi góc ne/n chỉ khai --eye ở trên; không sinh riêng để sửa mặt. Chặn điểm gắn/màu nộm là lý do giữ nhánh game cũ. Không có võ hồn nào được nhập trong lô này.

### Tham chiếu thực dùng

| RAW | Thứ tự ảnh 1 → 2 → 3 (nếu có) |
|---|---|
| toA.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toA.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png |
| toB.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toB.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png |
| toE.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toE.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png |
| candidates/toA-attempt1.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toA.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png |
| candidates/toB-attempt1.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toB.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png → art/src/phuthe-anim/liet_hoa_thuong_lang/toA.png |
| candidates/toC-attempt1.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toC.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png → art/src/phuthe-anim/liet_hoa_thuong_lang/toB.png |
| candidates/toC-attempt2.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toC.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png |
| candidates/toC-attempt3.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toC.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png → art/src/phuthe-anim/liet_hoa_thuong_lang/toB.png |
| candidates/toD-attempt1.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toD.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png → art/src/phuthe-anim/liet_hoa_thuong_lang/toB.png |
| candidates/toD-attempt2.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toD.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png → art/src/phuthe-anim/liet_hoa_thuong_lang/toB.png |
| candidates/toD-attempt3.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toD.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png → art/src/phuthe-anim/liet_hoa_thuong_lang/toB.png |
| candidates/toE-attempt1.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toE.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png → art/src/phuthe-anim/liet_hoa_thuong_lang/toB.png |
| candidates/toE-attempt2.png | art/src/phuthe-anim/liet_hoa_thuong_lang/references/liet_hoa_thuong_lang-nom-toE.png → art/src/vohon-v2/liet_hoa_thuong_lang/concept-attempt3.png |

Bài học đã được diễn đạt lại sau kiểm thử để không lọt từ khóa nộm vào chế độ --no-dummy và không ghi số pixel cố định; các prompt lưu trữ vẫn giữ đúng bản thực gửi.

### Bài học riêng loài (chỉ hồ sơ)

Liệt Hỏa Thương Lang: tai, vuốt theo tay và một đuôi chóp lửa; không vẽ nguyên đầu/thân/chân sói sau nộm. Chi tiết này chỉ lưu tại hồ sơ và prompt lịch sử, không chèn vào bài học chung nhóm B. Theo AO review #1199, các bài học lô 2 trong lessons.md đã gộp thành ba câu chung để không ép số chi thể của loài này lên loài khác; không sửa RAW/prompt/source cũ và không sinh thêm lượt.
