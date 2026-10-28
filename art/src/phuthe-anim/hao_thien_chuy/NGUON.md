# Hạo Thiên Chùy — thử phụ thể trực tiếp không nộm

Part of #1024. Ngày 2026-10-27. **3/3 lượt turnaround, đã dừng sinh; cả ba là candidates, chưa chọn ảnh đạt. Không nhập game.** Giữ phụ thể LPC hiện hành; đây chỉ là thử nhỏ trên một vật cứng.

## Quy trình và nguồn

Công cụ duy nhất: builtin `image_gen.imagegen` của Codex; model/seed `unknown`. Mỗi lượt một lần gọi, chỉ một ảnh tham chiếu, không dùng lượt hỏng làm tham chiếu. RAW 1536×1024 giữ nguyên byte, không resize hoặc vẽ đè. Ba lượt dùng cùng prompt nguyên bản, không addendum; lượt sau không thay yêu cầu.

Prompt do `node tools/assets/phuthe-sheet-prompt.mjs --id hao_thien_chuy --stage turnaround --frame 128 --no-dummy --out <temp>` sinh sau khi cập nhật main có #1164 (76b7fd74235ef9f206e16cdc51bcb8ec3b543f87). Ngoại hình mục 4, STYLE/NEGATIVE mục 6 của `docs/art/vo-hon-phong-cach.md`. Không sửa tools hoặc prompt.

Reference số 1: `art/src/vohon-v2/hao_thien_chuy/concept-attempt2.png`, bản sao nguyên byte từ `art/src/phap-tuong/hao_thien_chuy/concept-turnaround-attempt2.png`, tác giả tthoadev, đã chốt #1083/#1154. Orchestrator xác nhận tại [comment #1024](https://github.com/nguyenbinhanltv/soul-land-mmo/issues/1024#issuecomment-6444222944). SHA256 `631ac2ef55e230875ee2452b5dac9c634829ed09642d9666824e2a20f0e664af`. Không dùng bảng nộm hay ảnh PixelLab/Gemini cũ. Bản sao concept không phải lượt sinh mới.

Khung dự kiến 128, gốc chân (64, 90), không nộm. Turnaround có 5 cột s/se/e/ne/n × 3 hàng idle/attack đỉnh/hurt; không phải tờ hoạt ảnh idle/attack/cast. Concept gốc chỉ có ba góc độc lập, được owner chấp nhận vì búa đối xứng; thử này chưa chứng nhận đủ năm góc thật. Không có mắt/mặt người hoặc sinh vật trong ba RAW.

## Hồ sơ RAW

| Lượt | File | SHA256 ảnh | SHA256 prompt |
|---|---|---|---|
| 1 | `candidates/turnaround-attempt1.png` | `aeb83c54b56554bb7d5247b053d2274984b50b1193a4a463dfd50e171bcd9958` | `9271da0ff01860f8a11c2e307c0cd17be3b09a1ee8d18ec1d3fd5c50479beb6b` |
| 2 | `candidates/turnaround-attempt2.png` | `3e0b7f76326be332d9464218e4d4ee1d0a6eff63ca6ab4c1e44461b1f7d933f7` | `9271da0ff01860f8a11c2e307c0cd17be3b09a1ee8d18ec1d3fd5c50479beb6b` |
| 3 | `candidates/turnaround-attempt3.png` | `2df084f4d3dbd71e3f139d9bff04674e08f366dcdc43a4e177f9a5f8e676e2fd` | `9271da0ff01860f8a11c2e307c0cd17be3b09a1ee8d18ec1d3fd5c50479beb6b` |

Prompt thực gửi và source JSON nằm cạnh mỗi RAW. Không có file ảnh trùng byte.

## Kết quả kiểm tự động và mắt

- Lượt 1: **chặn tự động**, chỉ dò 2/3 dải hàng. Đủ 15 hình theo mắt, không người/nộm, ngoại hình bám concept. se/e gần nhau; hurt đổi góc mạnh.
- Lượt 2: **pass tự động**, không lỗi lưới/nền. **Chặn mắt**: idle se/e gần như cùng góc; hurt xoay và đổi hướng thay vì giật lùi ngắn. Đây là lượt tốt nhất về bố cục, vẫn giữ candidates vì chưa đạt hướng.
- Lượt 3: **chặn tự động**, chỉ dò 2/3 dải hàng. se/e vẫn gần trùng; hurt xoay mạnh, không giải quyết lỗi lượt trước.

`phuthe-sheet-check.mjs` chưa hỗ trợ `--eye` (đã thử, báo `tùy chọn lạ: --eye`). Khai lỗi mắt theo khuôn, không thay kết quả tự động:

```text
--eye "turnaround-attempt1=hướng — idle se/e — gần cùng góc (chặn); hurt cả hàng — xoay mạnh, chưa là giật lùi"
--eye "turnaround-attempt2=hướng — idle se/e — gần cùng góc (chặn); hurt cả hàng — xoay/đổi hướng"
--eye "turnaround-attempt3=hướng — idle se/e — gần trùng (chặn); hurt cả hàng — xoay mạnh"
```

## Kiểm, cắt và xem trước

Đã chạy riêng từng lượt `node tools/assets/phuthe-sheet-check.mjs hao_thien_chuy --dir <temp/check-input> --out <temp/checkN>`, RAW được sao nguyên byte dưới tên `turnaround.png` trong temp. Exit: lượt 1 = 1, lượt 2 = 0, lượt 3 = 1. Chỉ kiểm lưới/nền; kết quả pass không thay duyệt mắt.

**Cut/preview hoạt ảnh chưa có đầu vào hợp lệ:** turnaround chỉ duyệt bằng mắt, cutter nhận năm tờ hướng A–E 6×4. Đã dừng ở cổng turnaround sau 3 lượt, chưa sinh A–E; không gán turnaround 5×3 thành tờ hướng, không sao chép khung để giả hoạt ảnh. Vì vậy chưa chạy cut/preview hoạt ảnh. RAW được mở bằng `ao preview`; không manifest, sheet game hoặc sửa client/server. Chưa thể đánh giá loop idle/attack/cast hay điểm gắn khi ghép thân.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phuthe-anim/hao_thien_chuy/candidates/turnaround-attempt{1,2,3}.png` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Thử phụ thể trực tiếp không nộm; prompt tự sinh, SHA256 và source JSON kèm từng lượt. | 2026-10-27 | Chưa đạt, không nhập game; model/seed unknown. |

Bài học thử: bỏ nộm đã tránh việc model vẽ lại thân người, nhưng chưa bảo đảm khoảng hàng, phân biệt se/e hoặc giữ hướng hurt. Không khái quát kết quả thành đạt hoạt ảnh cho vật cứng.


---

# Hạo Thiên Chùy — phụ thể hoạt ảnh lô 7

Part of #1025. Sinh bằng builtin image_gen.imagegen, model/seed unknown, RAW nguyên byte. Prompt nguyên văn phuthe-sheet-prompt.mjs --concept-ref; source.json từng lượt có SHA256 ảnh/prompt/tham chiếu theo thứ tự. Concept đã duyệt: art/src/vohon-v2/hao_thien_chuy/concept-attempt2.png. Màu khóa: cyan mặc định của công cụ.

| Tờ / hướng | Số lượt | Kết quả |
|---|---|---|
| A / s | 1 | 0 chặn |
| B / se | 1 | 0 chặn |
| C / e | 2 | lượt 2: 0 chặn; lượt 1 thừa hình H1, lưu candidates |
| D / ne | 1 | 0 chặn |
| E / n | 1 | 0 chặn |

Cutter: 65 khung, 0 block / 54 warn. Nhập mọi hướng 0 chặn kỹ thuật theo chỉ định chủ repo. Neo tự động, worker khác chỉnh sau.

Soát mắt: đầu chùy lớn; thân nhỏ/dời so với bảng, tay cầm có pha chưa bám; vung/đập và cast sát hoặc xén mép. Một số mảnh đá rời, góc se/ne/n chưa khác rõ ở toàn bộ clip. Đã soát tờ liên hệ và khung ráp LPC, chưa chứng nhận căn đẹp. Preview nam/nữ đủ clip trong artifact phiên 722.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| to{A..E}.png; candidates/toC-attempt1.png | vhanim_hao_thien_chuy_b / vhanim_hao_thien_chuy_f | builtin image_gen.imagegen (Codex, Q44) | Prompt phuthe-sheet-prompt --concept-ref, prompt/source cùng tên | 2026-10-28 | 6 lượt; RAW nguyên byte; model/seed unknown |
