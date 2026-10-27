# ta_hoa_phuong_hoang — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. 3/3 lượt. RAW giữ nguyên byte, không hậu kỳ, không nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong` và `--style-ref` ảnh Hạo Thiên lượt 2 đã duyệt từ PR #1083. Chỉ ảnh neo này được gửi; không dùng lượt hỏng làm tham chiếu.

## Đánh giá

**Chọn làm tham chiếu ngoại hình theo quyết định mới ở PR #1145; chưa phải phụ thể đạt năm hướng.** Lượt 1: ne lộ mặt, mép cánh bị cắt. Lượt 2: ne lộ mặt, cánh chạm nhau. Lượt 3: ne quay trái và lộ mắt, s hơi nghiêng, se/e gần nhau; chỉ khoảng 3 góc thật đúng yêu cầu. n nhìn lưng đúng. Màu đỏ thẫm/cam, ngực tối và lõi sáng nhận ra; chi tiết lông còn dày (nhẹ), thiếu vòng lửa. Không đạt bộ 5 góc.

- Lượt 1: `candidates/concept-attempt1.png`; SHA256 ảnh `46fe177f95662f388bf95b16bbae70d1093813dcf00e78c3f3c1d0f6e0f9daa6`; SHA256 prompt `b6f64c59cf895006d4afee9d4035bde8437844e1a76c2f0e00605f10cd27e3ad`.
- Lượt 2: `candidates/concept-attempt2.png`; SHA256 ảnh `86c74333a021f236522f4ad01816a12e57b4af3da884335cdc2dd3f47297e0c7`; SHA256 prompt `b6f64c59cf895006d4afee9d4035bde8437844e1a76c2f0e00605f10cd27e3ad`.
- Lượt 3: `concept-attempt3.png`; SHA256 ảnh `afbfb627a42f3f956e6749b8a92809610a700592fda556459c294f30c76d1373`; SHA256 prompt `b6f64c59cf895006d4afee9d4035bde8437844e1a76c2f0e00605f10cd27e3ad`.

Bản tốt nhất để tham chiếu ngoại hình: `concept-attempt3.png` (lượt 3), đã chọn ở thư mục chính với trạng thái `selected_appearance_reference`. Lượt 1 và 2 ở `candidates` để đối chiếu. Các lỗi còn lại của lượt 3 giữ ở mục khai báo duyệt mắt; chưa duyệt làm phụ thể năm hướng. Mỗi lượt có prompt và source JSON kèm theo. Không có NGUON phụ.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/ta_hoa_phuong_hoang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |

## Khai báo duyệt mắt (`--eye`)

Công cụ vohon-check hiện không có cờ `--eye`; các khai báo dưới đây dùng cùng khuôn lỗi mắt, không chạy bộ kiểm hồn thú cho võ hồn.

```text
--eye "concept-attempt3=hướng — ne — quay trái và lộ mắt; s hơi nghiêng; se/e gần nhau"
--eye "concept-attempt3=chi tiết — cánh — lông còn dày, thiếu vòng lửa"
```

```text
LỖI: concept-attempt3 — hướng — ne — quay trái và lộ mắt; s hơi nghiêng; se/e gần nhau (mắt)
LỖI: concept-attempt3 — chi tiết — cánh — lông còn dày, thiếu vòng lửa (mắt)
```

Theo quyết định ở PR #1145: concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý ở khâu phụ thể bằng hình nộm. Giữ nguyên kết quả kiểm RAW và mọi lỗi đã quan sát, không coi ảnh này là sheet năm hướng dùng trực tiếp. SHA256 ảnh và prompt không đổi khi chuyển vị trí.

## Chân dung `portrait-attempt2.png` — chỉ làm ảnh neo phong cách (từ PR #1083, #1024)

`portrait-attempt2.png`: 1254×1254, 2,358,606 byte, SHA256 `dd0fdb1cfeb6042cc1a2ed6f0a6c7a254005120e1eaab3fb575ca917ec7ad85f`; prompt `portrait-attempt2.prompt.txt`, SHA256 `388098da53684f73bc5ec42c768dfdc97e192234e82c4ba3179fb5a30076d89d`; nguồn `portrait-attempt2.source.json`. RAW, builtin `image_gen.imagegen`, model/seed unknown, ngày 2026-10-27.

**Chưa đạt làm chân dung cuối: thiếu tương phản** khi thu về 64×64 (lông / quầng sáng / nền đỏ cam hòa vào nhau, mắt lẫn đạo văn; texture mềm). Chỉ giữ làm ảnh neo phong cách (đã dùng làm style ref cho concept Hạo Thiên Chùy); không nhập game, không tạo icon / thẻ từ ảnh này. Lượt 1 (FAIL) không đưa vào. Muốn vẽ lại thì làm lượt 3/3 sau lô H4 đầu tiên.

## Chân dung lượt 3/3 — chưa đạt bản cuối, dừng sinh

Ngày 2026-10-27: đúng một lần gọi builtin image_gen.imagegen, model/seed unknown. RAW `portrait-attempt3.png` giữ nguyên byte, SHA256 đối chiếu bản gốc `48819bdc5430b610f3bdcd42dc326e2230583e696d03af477fbf811e97115af3`. Prompt `portrait-attempt3.prompt.txt` sinh nguyên văn bằng `node tools/assets/vohon-prompt.mjs --type portrait --id ta_hoa_phuong_hoang --style-ref art/src/vohon-v2/ta_hoa_phuong_hoang/portrait-attempt2.png`, SHA256 `8e02eb71065d5ab41f41a189d1b6ca8e9d8e73ba6c6e19fa9507db8f4d33c77b`. Không sửa tay, không addendum; ảnh neo lượt 2 theo yêu cầu. Hồ sơ: `portrait-attempt3.source.json`.

RAW NHẸ: texture mềm, chưa đúng lưới; màu đúng họ, giữ 8/8 điểm sáng. P1c dùng tên CLI `--preset portrait` (không có preset tên P1c), lưu ở `candidates/portrait-attempt3-P1c/`: 64×64, 6 màu, tương phản 0.196, mật độ biên 0.296, sep 50.1, giữ 7/8 điểm sáng; NHẸ `nen-chu-the`, bgRatio 1.17 < 1.4. Xem `candidates/portrait-attempt3-P1c/preview/index.html` và `so-sanh.png`.

Duyệt mắt: đúng hung điểu, mắt/mỏ còn đọc được nhưng lông và đạo văn rối ở 64×64. Nền tím lạnh, chủ thể đỏ/cam; vùng sáng ngoài mặt còn nhiều. Chưa đạt góc nghiêng và 3–5 lưỡi lông lớn. Prompt CLI yêu cầu facing the viewer; giữ nguyên theo luật không viết tay, khai rõ sai lệch. Chưa đạt bản cuối, không nhập game. Đã hết 3/3 lượt chân dung, không sinh tiếp.

Công cụ vohon:check không hỗ trợ --eye; khai cùng khuôn tại đây:

```text
--eye "portrait-attempt3=góc nhìn — đầu — gần chính diện, chưa đạt góc nghiêng"
--eye "portrait-attempt3=chi tiết — lông/đạo văn — nhiều nhánh nhỏ, chưa đạt 3–5 lưỡi lớn; rối ở 64×64"
--eye "portrait-attempt3=tương phản — nền/chủ thể — bgRatio 1.17; chưa đạt bản cuối"
```