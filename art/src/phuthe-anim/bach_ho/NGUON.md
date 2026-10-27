# Bạch Hổ — phụ thể hoạt ảnh lô 2 (Part of #1025)

Ngày 2026-10-28. Hoàn tất bước 1–6 trong trần lượt; **không nhập game**: A1/C1/D1/E1 không chặn tự động, nhưng B đã dùng đủ 3 lượt vẫn sai nộm bằng mắt (B1 chính diện thay bảng ngang, B2 nguyên hổ, B3 còn chặn kỹ thuật). Giữ nhánh phụ thể cũ; B1 chỉ cắt chẩn đoán. Còn nét khí trắng và điểm gắn cần chủ repo chỉnh ráp.

## Quy trình và nguồn

Đã git fetch origin + git merge origin/main trước lô. Công cụ ảnh duy nhất: builtin image_gen.imagegen của Codex; model/seed unknown. Mỗi lượt một lần gọi với danh sách tham chiếu riêng. RAW 1536×1024 giữ nguyên byte, không resize/vẽ đè/sửa mặt. Prompt nguyên khối text do phuthe-sheet-prompt.mjs --id bach_ho --stage direction --dir s|se|e|ne|n --concept-ref sinh, không viết tay/addendum. Đọc lỗi và thêm một bài học ngắn vào lessons.md trước mỗi lượt. Prompt lưu đúng bản thực gửi.

Nộm references/bach_ho-nom-toA..E.png: khung 96, gốc (48,74), khóa #00D0D0, vạch #7A5CFF, nền #FF00FF. Concept chính ở art/src/vohon-v2/bach_ho/ (lượt lớn nhất ở thư mục chính); không dùng ảnh candidates của concept. Mỗi source.json ghi SHA256 RAW/prompt/từng tham chiếu đúng thứ tự cùng báo cáo kiểm đầy đủ. Nguồn LPC theo hồ sơ LPC hiện có.

## Các lượt

| RAW | Lượt của tờ | Chặn / nhẹ | Soát mắt |
|---|---|---|---|
| toA.png | 1 | 0 / 9 | Đúng chi thể; có nét khí trắng/vệt quét; nộm nhỏ/dời, vuốt lớn |
| toC.png | 1 | 0 / 16 | Đúng chi thể và nộm ngang; còn nét khí trắng, nộm nhỏ/dời |
| toD.png | 1 | 0 / 34 | --eye toD=hướng — ne mọi clip — gần e; chỉ khai, không sinh riêng sửa mặt. Còn khí trắng, nộm nhỏ/dời. |
| toE.png | 1 | 0 / 52 | --eye toE=hướng — n walk/attack — nhiều pose ngang phải; chỉ khai, không sinh riêng sửa mặt. Nộm nhỏ/dời, còn khí trắng. |
| candidates/toB-attempt1.png | 1 | 0 / 22 | REJECT: nộm chính diện thay nộm ngang B; còn khí trắng/vệt quét |
| candidates/toB-attempt2.png | 2 | 0 / 24 | REJECT: nguyên đầu/thân/chân hổ sau nộm; không phải phụ thể |
| candidates/toB-attempt3.png | 3 | 3 / 24 | REJECT: nộm vẫn chính diện thay bảng ngang B; sai điểm gắn/hướng nộm sau 3/3 |

Tổng 7 lượt; trần từng hướng: {"s":1,"e":1,"ne":1,"n":1,"se":3}. Tờ chọn cho cắt: A=toA.png (A1), B=candidates/toB-attempt1.png (ít chặn tự động nhất, vẫn chặn mắt), C=toC.png (C1), D=toD.png (D1), E=toE.png (E1). Tờ trong candidates không bao giờ làm tham chiếu; nếu chọn cắt chẩn đoán thì vẫn giữ nguyên trạng thái chặn và chỉ rõ trong danh sách trên. Một số lượt bỏ ảnh thứ ba tùy chọn sau lỗi sao nộm hoặc mất nộm; mọi tham chiếu thực dùng phải xem source.json, không suy từ tên tờ.

## Kiểm, cắt, neo, preview

Đã chạy npm run phuthe:check riêng từng lượt bằng thư mục input tạm chứa RAW nguyên byte dưới tên toX.png; source.json giữ toàn bộ kết quả. Kiểm tổng chỉ đọc tờ chính, không thay kiểm riêng của candidate. Cắt bằng phuthe-sheet-cut.mjs --id bach_ho --sheet A=... ... --sheet E=... --out <artifact>/bach_ho; neo bằng phuthe-anchor.mjs --id bach_ho --source anim --dir <artifact>/bach_ho --out <artifact>/bach_ho/anchor.json; preview bằng phuthe-sheet-preview.mjs --id bach_ho --dir <artifact>/bach_ho.

lop.json: đuôi sau, vùng tai/vuốt trước theo bảng điểm gắn. Cắt 110 khung 96×96, hai lớp, GIF 5 clip × 5 hướng gốc + ba hướng tây lật, đủ nam/nữ; có trang xoay. Anchor đo nam/nữ; preview gốc chưa áp anchor. Bảng PNG chẩn đoán sau neo dùng cùng composeFrame, dịch/phóng nearest quanh gốc chân theo anchor để soát điểm gắn.

Artifact: C:/Users/PC/.ao/data/artifacts/soul_land_game-706/bach_ho/preview/index.html, anchor.json và _report.json ở thư mục cha. Đã đính preview vào AO; mở trực tiếp artifact bằng ao preview bị giới hạn PREVIEW_FILE_OUTSIDE_WORKSPACE ở phiên này, nên soát qua bảng khung PNG từ hàm ghép preview.

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
| references/bach_ho-nom-to*.png | - | phuthe-sheet-dummy.mjs, LPC hiện có | Nộm có vạch, chỉ tham chiếu | 2026-10-28 | Nguồn/giấy phép LPC theo hồ sơ hiện có |

### Kết quả cắt và soát ráp

Cutter: 110 khung, **1 block / 79 warn**, còn 7484 điểm gần màu khóa nộm #00D0D0. Bản ráp nam/nữ sau neo còn tai/vuốt tách khỏi đầu/tay và cyan sót; chặn mắt, không nhập. Không chứng nhận đủ năm hướng hợp lệ.

## Phiếu tổng hợp cuối lô

| Hướng | RAW cắt | Chặn / nhẹ tự động | Soát ráp / quyết định |
|---|---|---|---|
| s | toA.png | 0 / 9 | chặn đầu ra/điểm gắn: còn màu nộm, tai/vuốt tách thân |
| se | candidates/toB-attempt1.png | 0 / 22 | chặn mắt: nộm chính diện thay bảng ngang; đã dừng 3/3 |
| e | toC.png | 0 / 16 | chặn đầu ra/điểm gắn: còn màu nộm, tai/vuốt tách thân |
| ne | toD.png | 0 / 34 | chặn đầu ra/điểm gắn: còn màu nộm, tai/vuốt tách thân |
| n | toE.png | 0 / 52 | chặn đầu ra/điểm gắn: còn màu nộm, tai/vuốt tách thân |

Các lỗi góc ne/n chỉ khai --eye ở trên; không sinh riêng để sửa mặt. Chặn điểm gắn/màu nộm là lý do giữ nhánh game cũ. Không có võ hồn nào được nhập trong lô này.

### Tham chiếu thực dùng

| RAW | Thứ tự ảnh 1 → 2 → 3 (nếu có) |
|---|---|
| toA.png | art/src/phuthe-anim/bach_ho/references/bach_ho-nom-toA.png → art/src/vohon-v2/bach_ho/concept-attempt1.png |
| toC.png | art/src/phuthe-anim/bach_ho/references/bach_ho-nom-toC.png → art/src/vohon-v2/bach_ho/concept-attempt1.png |
| toD.png | art/src/phuthe-anim/bach_ho/references/bach_ho-nom-toD.png → art/src/vohon-v2/bach_ho/concept-attempt1.png → art/src/phuthe-anim/bach_ho/toC.png |
| toE.png | art/src/phuthe-anim/bach_ho/references/bach_ho-nom-toE.png → art/src/vohon-v2/bach_ho/concept-attempt1.png → art/src/phuthe-anim/bach_ho/toD.png |
| candidates/toB-attempt1.png | art/src/phuthe-anim/bach_ho/references/bach_ho-nom-toB.png → art/src/vohon-v2/bach_ho/concept-attempt1.png → art/src/phuthe-anim/bach_ho/toA.png |
| candidates/toB-attempt2.png | art/src/phuthe-anim/bach_ho/references/bach_ho-nom-toB.png → art/src/vohon-v2/bach_ho/concept-attempt1.png |
| candidates/toB-attempt3.png | art/src/phuthe-anim/bach_ho/references/bach_ho-nom-toB.png → art/src/vohon-v2/bach_ho/concept-attempt1.png → art/src/phuthe-anim/bach_ho/toA.png |

Bài học đã được diễn đạt lại sau kiểm thử để không lọt từ khóa nộm vào chế độ --no-dummy và không ghi số pixel cố định; các prompt lưu trữ vẫn giữ đúng bản thực gửi.

### Bài học riêng loài (chỉ hồ sơ)

Bạch Hổ: tai, vuốt theo tay và một đuôi vằn; không vẽ nguyên đầu/thân/chân hổ sau nộm. Chi tiết này chỉ lưu tại hồ sơ và prompt lịch sử, không chèn vào bài học chung nhóm B. Theo AO review #1199, các bài học lô 2 trong lessons.md đã gộp thành ba câu chung để không ép số chi thể của loài này lên loài khác; không sửa RAW/prompt/source cũ và không sinh thêm lượt.
