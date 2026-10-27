# bang_phuong_hoang — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. 3/3 lượt. RAW giữ nguyên byte, không hậu kỳ, không nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong` và `--style-ref` ảnh Hạo Thiên lượt 2 đã duyệt từ PR #1083. Chỉ ảnh neo này được gửi; không dùng lượt hỏng làm tham chiếu.

## Đánh giá

**Chọn làm tham chiếu ngoại hình theo quyết định mới ở PR #1145; chưa phải phụ thể đạt năm hướng.** Lượt 1 và 2: ne quay trái và lộ mặt, cánh ngoài cắt mép. Lượt 3: ne quay phải nhưng vẫn lộ mắt/mỏ; se và e quá giống nhau, cánh sát biên. Khoảng 3 góc thật đúng, n nhìn lưng đúng. Đúng lam thẫm, lam băng, lõi tím; còn chi tiết nhỏ và viền màu sáng, thiếu vòng trận hoa tuyết. Chưa đạt 5 hướng.

- Lượt 1: `candidates/concept-attempt1.png`; SHA256 ảnh `6bc3de2091aab98ec6e934f92b74d0f16e0863ba3dd0afe312a6b5ab90a54f5c`; SHA256 prompt `b4be4f0752dd6b8b5f776dad26f89e9a36784d6e7deed1e548ca550aea1da536`.
- Lượt 2: `candidates/concept-attempt2.png`; SHA256 ảnh `e92e2e04e1af3a1b47d5ba5cc72a789248ed9771d033469dc33cd836d235ed62`; SHA256 prompt `b4be4f0752dd6b8b5f776dad26f89e9a36784d6e7deed1e548ca550aea1da536`.
- Lượt 3: `concept-attempt3.png`; SHA256 ảnh `2060b04e927be7a829816508203ed5663a993930ffe94b77be0ad4a0b6e16d2c`; SHA256 prompt `b4be4f0752dd6b8b5f776dad26f89e9a36784d6e7deed1e548ca550aea1da536`.

Bản tốt nhất để tham chiếu ngoại hình: `concept-attempt3.png` (lượt 3), đã chọn ở thư mục chính với trạng thái `selected_appearance_reference`. Lượt 1 và 2 ở `candidates` để đối chiếu. Các lỗi còn lại của lượt 3 giữ ở mục khai báo duyệt mắt; chưa duyệt làm phụ thể năm hướng. Mỗi lượt có prompt và source JSON kèm theo. Không có NGUON phụ.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/bang_phuong_hoang/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |

## Khai báo duyệt mắt (`--eye`)

Công cụ vohon-check hiện không có cờ `--eye`; các khai báo dưới đây dùng cùng khuôn lỗi mắt, không chạy bộ kiểm hồn thú cho võ hồn.

```text
--eye "concept-attempt3=hướng — ne / se-e — ne còn lộ mắt/mỏ, se/e gần nhau"
--eye "concept-attempt3=bố cục — cánh — sát biên; thiếu vòng trận hoa tuyết"
```

```text
LỖI: concept-attempt3 — hướng — ne / se-e — ne còn lộ mắt/mỏ, se/e gần nhau (mắt)
LỖI: concept-attempt3 — bố cục — cánh — sát biên; thiếu vòng trận hoa tuyết (mắt)
```

Theo quyết định ở PR #1145: concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý ở khâu phụ thể bằng hình nộm. Giữ nguyên kết quả kiểm RAW và mọi lỗi đã quan sát, không coi ảnh này là sheet năm hướng dùng trực tiếp. SHA256 ảnh và prompt không đổi khi chuyển vị trí.

## Chân dung lượt 1 — #1158

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `portrait-attempt1.png`, SHA256 `4a4c95174c656736833ff9ac4b9a6dd98f55968f92abc2d947798bf2f765de38`. Prompt CLI nguyên văn `portrait-attempt1.prompt.txt`, SHA256 `d07338c24d61fd03e7313b61b818931018dc66b9ce804b6100b4abc32f3426fb`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt3.png`, SHA256 `2060b04e927be7a829816508203ed5663a993930ffe94b77be0ad4a0b6e16d2c`. Hồ sơ lệnh và kết quả kiểm: `portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `portrait-attempt1-P1c/bang_phuong_hoang-portrait.png`, 64×64, 8 màu, giữ 8/8 điểm sáng. Xem `portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — đầu gần chính diện; mào băng nhiều nhánh, sáng ngoài mắt/mỏ và hình rối ở 64×64; còn sáng-tran, nhieu-chi-tiet, gan-mau, nen-chu-the theo bộ kiểm"
```
