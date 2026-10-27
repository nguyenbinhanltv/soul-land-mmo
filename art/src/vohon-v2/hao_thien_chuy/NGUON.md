# Hạo Thiên Chùy — bản tham chiếu concept đã chốt

Bản sao nguyên byte từ `art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`, tác giả tthoadev, PR #1083 / #1154. Orchestrator xác nhận dùng làm reference số 1 cho thử phụ thể trực tiếp `--no-dummy` (Part of #1024), ngày 2026-10-27. Không phải lượt sinh mới, không nhập game.

SHA256 ảnh: `631ac2ef55e230875ee2452b5dac9c634829ed09642d9666824e2a20f0e664af`. Công cụ nguồn: builtin `image_gen.imagegen`; model/seed unknown. Prompt, source JSON, phê duyệt và giới hạn góc nhìn giữ tại hồ sơ gốc `art/src/phap-tuong/hao_thien_chuy/NGUON.md`. Concept có ba góc độc lập và các cặp gương; owner chấp nhận vì búa đối xứng.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/hao_thien_chuy/concept-attempt2.png` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept tthoadev đã chốt #1083/#1154; bản sao nguyên byte, hồ sơ prompt/source tại phap-tuong/hao_thien_chuy. | 2026-10-27 | Chỉ tham chiếu, không sinh mới hay nhập game. |
| `art/src/vohon-v2/hao_thien_chuy/candidates/portrait-attempt1.*` và `portrait-attempt1-P1c2/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Chân dung lô 3 #1158; prompt CLI nguyên văn, RAW + pixel preset portrait2; model/seed unknown. | 2026-10-27 | 1/3 lượt, ứng viên chưa duyệt, không nhập game; SHA256 và --eye bên dưới. |


## Chân dung lô 3 — #1158, P1c2

Ngày 2026-10-27; **1/3 lượt**. Công cụ builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `f603f0839928ede420c953194a22c1fbc52164dd5caa007675c582c9a308dc36`. Prompt nguyên văn từ CLI, không viết tay / addendum: `candidates/portrait-attempt1.prompt.txt`, SHA256 `053597998970350947ac5dcb896623af6e2dd40996153fc232b67eebf58a5ff4`. Prompt lưu UTF-8 LF; chuỗi gửi gốc và SHA256 giữ trong `candidates/portrait-attempt1.source.json`, chỉ chuẩn hoá xuống dòng.

Ảnh neo: `art/src/vohon-v2/hao_thien_chuy/concept-attempt2.png`, SHA256 `631ac2ef55e230875ee2452b5dac9c634829ed09642d9666824e2a20f0e664af`. Bản concept đã chốt của tthoadev, sao nguyên byte từ `art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`; không tính là lượt sinh mới. 

Pixel hoá `--preset portrait2` đã duyệt, giữ mặc định 16 màu (brief RAW 6–8 mảng màu); bản `candidates/portrait-attempt1-P1c2/hao_thien_chuy-portrait.png`. Xem `candidates/portrait-attempt1-P1c2/preview/index.html` và `so-sanh.png`. Kết quả máy RAW/P1c2 và lệnh tái tạo trong source JSON, báo cáo pixel kèm thư mục. Chỉ ứng viên trình duyệt, **chưa duyệt, không nhập game**; không chọn thay concept.

### Khai báo duyệt mắt chân dung (`--eye`)

CLI chưa nhận cờ `--eye`; lưu khai báo tường minh, giữ nguyên kết quả máy và RAW.

```text
--eye "portrait-attempt1=RAW/P1c2 — Đầu búa khối sắt góc cạnh, đai đồng và cán xoắn theo neo tthoadev; vết nứt cam rộng hơn đặc tả rất ít, đá phụ nhiều. P1c2 giữ đầu búa và khe cam nhưng thân tối gần nền/vầng tím, mép thép còn vụn; không có người hay chữ đọc được."
```
