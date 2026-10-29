# Lam Ngân Thảo — thí điểm vũ khí mềm

Part of #1312, epic #1020; issue thực hiện #1321. Dòng 18 trong `docs/art/phu-the-vu-khi.md`: roi dây cỏ lam thẫm, một tay giữ gốc, thân dây xoắn, ngọn nhọn. Đây là bộ thử để duyệt, **chưa duyệt mỹ thuật, chưa nhập game**. Không thay phụ thể cũ/pháp tướng, không sửa `shared/assets` hay giao diện.

## Nguồn và tham chiếu

Sinh ngày 2026-10-30 bằng **Codex / OpenAI image_gen tích hợp**, từng job tuần tự. Model ID và seed không được công cụ trả về. RAW giữ nguyên byte, không sửa nền, resize hoặc vẽ bù. Sử dụng theo điều khoản đầu ra OpenAI, không gán CC0. Không tham chiếu ảnh thương mại. Màu nền yêu cầu `#FF00FF`; RAW có sai số màu nhỏ do model, cutter dùng dung sai mặc định.

Prompt nguyên khối `text` do `phuthe-sheet-prompt.mjs --kind vukhi` sinh; các sửa đổi sau lượt lỗi chỉ đi qua `art/src/phuthe-anim/lessons.md`. Bảng nộm do `phuthe-sheet-dummy.mjs --kind vukhi` dựng, thân LPC và giấy phép theo hồ sơ LPC hiện có trong repo. Màu nộm `#30D030`, vạch `#7A5CFF`, marker `#FFE000`.

Mỗi job thực tế chỉ đính kèm **một ảnh**: nộm cùng hướng trong `references/`. Chưa có turnaround vũ khí được duyệt; prompt công cụ còn nhắc ảnh turnaround số 2 nhưng ảnh đó không được đính kèm. Không dùng concept phụ thể cũ hoặc tờ lỗi làm tham chiếu. Từng RAW có `source.json` ghi hash SHA256 ảnh, prompt và tham chiếu.

## Lượt và kiểm

| Tờ | Hướng | Lượt đã dùng | Bản chọn | Kiểm bản chọn: chặn / nhẹ |
|---|---|---|---|---|
| A | s | 3 | lượt 1 | 0 / 6 |
| B | se | 1 | lượt 1 | 0 / 13 |
| C | e | 1 | lượt 1 | 0 / 15 |
| D | ne | 1 | lượt 1 | 0 / 23 |
| E | n | 1 | lượt 1 | 0 / 19 |

A2 có thêm dây ở hai tay và mảnh rời cast. A3 bị chặn vì dây nối các ô attack. Chọn A1 do bố cục ít lỗi hơn; A1 vẫn có dây tay phụ ở vài pose. Giữ cả ba RAW/prompt/hash/kết quả kiểm trong `candidates/`, A1 ở đó trùng byte với bản chọn. Không vượt ba lượt/tờ. B–E dừng ở lượt đầu khi không có khối chặn tự động; các lỗi mỹ thuật dưới đây vẫn chưa đạt để nhập game.

`npm run phuthe:check -- lam_ngan_thao --kind vukhi` thoát 0, cả năm hướng mức **nhẹ**. Báo cáo và ảnh liên hệ có nhãn trong `review/`. Không đồng nghĩa được duyệt mỹ thuật.

## Cắt và mặt nạ

Chạy cutter kiểu `vukhi`, khung 96, 32 màu, `--grid uniform`, đọc `lop.json`. Kết quả: **110 khung, 0 block / 54 warn / 10 info**; hai sheet `vkanim_lam_ngan_thao_b.png`, `vkanim_lam_ngan_thao_f.png`, `manifest-entry.json` có `anim.kind = vukhi`, 110 mục `anim.grip`, `gripSex = m`. `_report.json` ghi nguồn/hash và từng cảnh báo. Marker, nộm, vạch đều được cutter trừ; không ghi tay manifest.

Mặt nạ tính theo gốc chân của khung 96: s/se/e mặc định trước, ne/n mặc định sau và vùng nắm tay ở trước. Các pose cast có vùng riêng cho dây vòng cao ở sau thân và đoạn vòng thấp ở trước thân. Đây là **mặt nạ thử**, cần duyệt độ liên tục và chỗ đầu dây chuyển lớp trên từng pose; không coi các hộp cố định này là mặt nạ hoàn thiện.

Trang [xem trước](preview/index.html) gồm RAW, ảnh liên hệ, sheet sau/trước, manifest và GIF ghép LPC nam/nữ theo nhịp thân thật, 5 clip × 5 hướng + ba hướng tây lật. Công cụ preview hiện tìm `vhanim_*`; dùng bản sao đổi tên trong thư mục tạm để gọi hàm `buildPreview`, rồi chép riêng kết quả preview về đây. Sheet gốc vẫn là `vkanim_*`; không đưa bản sao `vhanim_*` vào repo và không sửa công cụ chung. Nhãn nhóm trên trang đã sửa thành B theo manifest vũ khí (nhóm phụ thể cũ là C).

## Soát mắt và hạn chế

- Dây đủ dài để thể hiện quất/cuộn nhưng vài đầu dây bị xén; cảnh báo vượt khung vẫn còn. Không dùng neo để che lỗi hình.
- Model đổi dáng nộm, không giữ chính xác tay LPC ở mọi khung. Cutter đăng ký lại được phần lớn ô nhưng điểm nắm còn trôi, nhất là hurt/cast; vũ khí không được chứng nhận gắn tay ổn định.
- A/B có pose dây ở tay phụ, khác yêu cầu một gốc cầm tay thuận. C/D có đoạn gốc gần vai hoặc thắt lưng. Ngọn dây đôi lúc thành lưỡi quá lớn.
- B/se, C/e và D/ne còn gần nhau; chưa chứng nhận góc nhìn đủ khác. D/E không thêm mặt nhưng không có chi tiết mặt để chứng minh góc quay.
- Mặt nạ thử và sheet dùng cùng ảnh vũ khí cho hai giới; phải duyệt cả nam/nữ trên trang ghép. Chưa có bù điểm cầm riêng cho thân nữ trong trang preview hiện có.
- Bài học A1/A2 đã thêm vào nhóm `@VUKHI` của `lessons.md`; không dùng bài học cánh/đuôi phụ thể cũ.

## Tái tạo phần xác định

```sh
node tools/assets/phuthe-sheet-prompt.mjs --kind vukhi --id lam_ngan_thao --stage direction --dir s,se,e,ne,n --out <tmp>
npm run phuthe:check -- lam_ngan_thao --kind vukhi --out <tmp-check>
node tools/assets/phuthe-sheet-cut.mjs --kind vukhi --id lam_ngan_thao --sheet A=art/src/phuthe-anim/lam_ngan_thao/vukhi/toA.png --sheet B=art/src/phuthe-anim/lam_ngan_thao/vukhi/toB.png --sheet C=art/src/phuthe-anim/lam_ngan_thao/vukhi/toC.png --sheet D=art/src/phuthe-anim/lam_ngan_thao/vukhi/toD.png --sheet E=art/src/phuthe-anim/lam_ngan_thao/vukhi/toE.png --out <tmp-cut> --grid uniform
```

Prompt sinh lại sau khi bổ sung lessons sẽ khác lượt A1/A2; để kiểm nguồn dùng prompt nguyên văn đã lưu, không ghi đè các prompt lịch sử.

## Vòng 2 — chỉ hướng e, ba lỗi, tối đa ba lượt

Theo giao việc từ orchestrator: chỉ sửa **dây tay phụ, xén đầu dây, điểm cầm trôi** cho hướng đông trước; e đạt mới mở rộng. Đã dùng đủ **3 job image_gen tuần tự**, không gọi lượt 4 và không sinh lại A/B/D/E. Cả ba chỉ đính kèm nộm C gốc, không dùng tờ lỗi làm tham chiếu.

**Kết luận: chưa đạt, không chọn lượt nào.** Không thay RAW `toC.*`, sheet `vkanim_*`, `manifest-entry.json`, `lop.json` hoặc GIF cũ. Không cắt/nhập candidate bị loại để che lỗi hình. PR #1322 giữ nháp; cần quyết định bước tiếp sau hạn mức.

| Lượt vòng 2 | Chặn / nhẹ | Ba lỗi cần sửa |
|---|---|---|
| 1 | 0 / 17 | Dây đi qua vị trí nắm/gần eo, nộm dời tới khoảng 32 điểm, marker trôi 28 điểm, còn vượt khung |
| 2 | 0 / 21 | Hai đoạn dây hai phía vị trí nắm, nộm bị vẽ lại/dời, còn nhiều đoạn vượt khung; thiếu marker không có nghĩa hết trôi |
| 3 | 1 / 18 | Đoạn nắm vẫn gần eo/tay, nộm thay pose; marker trôi tối đa 47 điểm (chặn), vẫn vượt khung |

Trang [so sánh vòng 2](round2/index.html) có nộm chuẩn, C vòng 1, ba RAW và báo cáo có nhãn. Nguồn/prompt/hash/check của từng lượt nằm trong `round2/e/attempt{1,2,3}/`. RAW nguyên byte, không chỉnh hình hoặc màu. Đầu ra theo điều khoản OpenAI, model/seed không được công cụ trả về.

Các bài học riêng ghi ở mục **`@VUKHI-MEM`** trong `art/src/phuthe-anim/lessons.md`. Parser hiện không nhận tag đó; dùng bullet thường để parser chung bỏ qua, tránh ảnh hưởng vũ khí cứng. Prompt sinh qua API có sẵn: `buildDirectionPrompt(infoWith("lam_ngan_thao", {kind:"vukhi"}), sheetPlan("B")[2], {lessons:[...vukhiLessonsFor("direction"), ...softLessons]})`, trong đó `softLessons` lấy câu tiếng Anh của các bullet `@VUKHI-MEM`, bỏ chú thích `//`. Lượt 1/2/3 lần lượt dùng 3/4/5 câu theo tiến trình lessons. Không sửa công cụ chung và không ghi đè prompt lịch sử.

Bài học thực nghiệm: lời yêu cầu "khóa canvas", giữ vạch/marker và cán có đầu bịt chưa buộc được model giữ đúng nộm; cảnh báo máy mức nhẹ vẫn có thể không đạt ba tiêu chí mỹ thuật. Không coi các câu mới là công thức đã thành công.

## Thử nghiệm mới — vẽ vũ khí riêng + ghép grip

Chủ repo/orchestrator cho phép đổi phương pháp và thêm tối đa ba lượt cho thử nghiệm mới: model chỉ vẽ dây riêng, không nộm; code gắn **gốc bó dây** vào `anim.grip`, chọn pose mềm đã vẽ và xoay/dịch quanh gốc. Đã thử **e trước, một lượt**: kiểm máy 0 chặn/0 nhẹ và soát ba lỗi đạt (không tay phụ, không xén đầu dây, gốc nằm ở grip). Sau đó mở rộng s/se/ne/n theo điều kiện đã giao, **mỗi hướng một lượt**, từng job tuần tự. Không cần lượt 2/3 ở phương pháp mới.

Trang duyệt mới: [vẽ riêng + ghép grip](isolated/index.html). Kết quả thử ở `isolated/result/`, **không ghi đè bộ chọn cũ**, không nhập `shared/assets`, PR #1322 vẫn nháp. RAW model là `isolated/<hướng>/attempt1/poses.raw.png`, tuyệt đối không gọi tờ nộm do code ghép là RAW model. Prompt mới viết cho thử nghiệm không nộm theo giao việc; không gọi `--no-dummy --kind vukhi` vì công cụ đó chưa hỗ trợ. Mỗi atlas 3×2 có idle, ba attack, hai cast; gốc có chấm vàng đăng ký, không có tay/người.

### Ghép và kiểm

- Tách sáu cụm liên thông, không cắt lưới cứng (một số đầu dây vượt đường chia ô tưởng tượng nhưng không chạm mép ảnh). Đo chấm vàng của từng cụm để xác định gốc, trừ chấm khỏi sprite. Không dùng nộm hay vẽ bù thân trong model.
- Code thử `isolated/compose.mjs` chọn pose theo bảng trong code, đặt gốc vào 110 `anim.grip` nam của manifest cũ. Nữ đo bàn tay từ đúng khung LPC bằng `gripPoints`; ghi rõ tọa độ nam/nữ trong `compose-plan.json`. Không dịch neo bằng mắt.
- Khung thử **128×128**, thân LPC vẫn 64×64, grip giữ tọa độ tương đối theo gốc chân. Khung 96 ban đầu buộc dây quá ngắn khi tay vươn phải; tăng khoảng trống khung thay vì kéo giãn thân hay xén đầu dây.
- Một tỉ lệ chung **0.09062213** cho cả năm atlas và mọi khung/giới; góc hướng cơ sở s/se/e/ne/n lần lượt 45/20/0/−20/−45 độ rồi cộng góc pose. Code không uốn/nội suy hình dây: dùng đúng sáu hình mềm đã vẽ. Các khung lặp pose chỉ xoay/dịch quanh gốc.
- Sheet kết quả có **32 màu chung**, 110 khung mỗi giới, **220 khung tổng**, đủ năm hướng; manifest có 110 grip. Không chạm mép (0 điểm), điểm sprite gần gốc cách grip tối đa **1.35 pixel** sau lấy mẫu nearest. Khoảng cách này là khoảng cách tới pixel vũ khí, không phải sai số tọa độ phép đặt gốc (phép đặt gốc dùng đúng grip).
- Mọi hướng dùng đúng `lop.json` qua `parseLop`/`layerFn` như cutter, với tọa độ vùng từ gốc chân khung 128: ne/n mặc định sau, vùng cầm trước; cast theo vùng riêng từng khung. Đã sửa theo AO review lỗi ban đầu đẩy mọi khung ngoài cast vào trước. Kiểm 72 khung quay lưng ngoài cast đều có lớp sau; vẫn cần duyệt đường chuyển lớp trước khi tích hợp client. Hash mặt nạ nguồn có trong từng `poses.source.json`.

| Hướng | Kiểm nam | Kiểm nữ | Soát ba lỗi mục tiêu |
|---|---|---|---|
| s | 0 chặn / 1 nhẹ | 0 / 1 | Không tay phụ, không xén, gốc theo grip |
| se | 0 / 1 | 0 / 1 | Không tay phụ, không xén, gốc theo grip |
| e | 0 / 0 | 0 / 0 | Đạt để mở rộng theo giao việc |
| ne | 0 / 0 | 0 / 0 | Không tay phụ, không xén, gốc theo grip |
| n | 0 / 0 | 0 / 0 | Không tay phụ, không xén, gốc theo grip |

Cảnh báo nhẹ s/se là `chan-lech` 14% ở một pose attack mỗi hướng; nộm do code dựng từ LPC không bị model thay dáng, nhưng vẫn giữ cảnh báo và tờ có nhãn để soát. `review-m`/`review-f` chứa kết quả `phuthe:check`; `compose-plan.json` ghi phép đặt của mỗi khung; `result/report.json` ghi hình học và hash hai script. Mỗi RAW/prompt có source SHA256, không ảnh tham chiếu, không seed/model ID được trả về. Điều khoản đầu ra OpenAI và giấy phép LPC như phần nguồn ở trên.

### Giới hạn còn lại và tái tạo

Preview ghép thân tại **tâm thời gian từng khung vũ khí** (`bodyStepOf`), không chứng nhận đồng bộ client tại mọi mốc thời gian. Client chưa đổi, chưa nhập manifest. Một số pose bó dây có ngọn chẻ hoặc vòng nhìn như nhiều đầu; nét/độ dài giữa atlas chưa đồng nhất hoàn toàn. Không coi việc sửa ba lỗi mục tiêu là duyệt mỹ thuật cuối cùng.

```sh
node art/src/phuthe-anim/lam_ngan_thao/vukhi/isolated/finalize.mjs
```

Lệnh đọc năm RAW đã lưu, chạy bộ ghép, thống nhất tỉ lệ/bảng màu, kiểm nộm nam/nữ, xuất sheet/manifest/GIF/trang duyệt trong `isolated/`. Chạy từ gốc repo, không gọi model và không ghi `shared/assets`. Hai bullet bài học phương pháp mới ở mục `@VUKHI-MEM` của lessons; không đưa các chỉ dẫn khóa nộm vòng 2 vào prompt vẽ riêng.
