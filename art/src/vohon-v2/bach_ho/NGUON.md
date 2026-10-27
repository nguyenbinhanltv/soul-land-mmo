# bach_ho — concept năm hướng RAW

Công cụ: builtin `image_gen.imagegen`; model/seed: `unknown`. Ngày 2026-10-27. 3/3 lượt. RAW giữ nguyên byte, không hậu kỳ, không nhập game. Prompt sinh nguyên bản bằng `vohon-prompt.mjs --type phaptuong` và `--style-ref` ảnh Hạo Thiên lượt 2 đã duyệt từ PR #1083. Chỉ ảnh neo này được gửi; không dùng lượt hỏng làm tham chiếu.

## Đánh giá

**Chọn làm tham chiếu ngoại hình theo quyết định mới ở PR #1145; chưa phải phụ thể đạt năm hướng.** Cả 3 lượt: ne ngoái đầu lộ mặt/mắt vàng, không đạt góc nhìn lưng. Khoảng 4 góc thật đúng, n giấu mặt đúng. Lượt 1: khí trắng nối hình se/e. Lượt 2: quá nhiều vàng, khí nối s/se. Lượt 3: khí nối s/se, vàng trên vằn không đúng bảng nhấn mắt; thiếu vòng trận sao. Thân xám lạnh, ngực sáng, vằn đen và dáng ngồi đúng; chi tiết lông nhỏ là lỗi nhẹ. Chưa đạt.

- Lượt 1: `concept-attempt1.png`; SHA256 ảnh `910d3a48b513daa6e8dd4768dbf57cf9a6d5170d78490066d0af1a51f89a0475`; SHA256 prompt `3741a416ce38f7106ce2e623810664f8ad215558d07c0575984724091e7a6ea0`.
- Lượt 2: `candidates/concept-attempt2.png`; SHA256 ảnh `e27c80db92af90472e9d67d3d32b96481da272649fe6491bc937a1de1f64e9f3`; SHA256 prompt `3741a416ce38f7106ce2e623810664f8ad215558d07c0575984724091e7a6ea0`.
- Lượt 3: `candidates/concept-attempt3.png`; SHA256 ảnh `5fd6e19c6f4a9e607f34c190d5f81e66c219a509a03b13ecd39923b3921c8c56`; SHA256 prompt `3741a416ce38f7106ce2e623810664f8ad215558d07c0575984724091e7a6ea0`.

Bản tốt nhất để tham chiếu ngoại hình: `concept-attempt1.png` (lượt 1), đã chọn ở thư mục chính với trạng thái `selected_appearance_reference`. Chọn lượt 1 thay lượt 3 vì giữ thân xám lạnh, ngực sáng và vằn đen đúng bảng màu hơn; lượt 3 có vàng trên vằn không đúng bảng nhấn mắt. Đây là lựa chọn theo ngoại hình; lỗi ne lộ mắt và khí nối se/e vẫn giữ ở mục khai báo duyệt mắt, chưa đạt phụ thể năm hướng. Lượt 2 và 3 ở `candidates` để đối chiếu. Mỗi lượt có prompt và source JSON kèm theo. Không có NGUON phụ.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/vohon-v2/bach_ho/` | - | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | Concept năm hướng RAW + chân dung RAW và bản thử P1c #1158; model/seed unknown; SHA256 và prompt kèm từng lượt. | 2026-10-27 | Chưa duyệt, không nhập game. |


## Khai báo duyệt mắt (`--eye`)

Công cụ vohon-check hiện không có cờ `--eye`; các khai báo dưới đây dùng cùng khuôn lỗi mắt, không chạy bộ kiểm hồn thú cho võ hồn.

```text
--eye "concept-attempt1=hướng — ne — ngoái đầu lộ mặt và mắt vàng"
--eye "concept-attempt1=bố cục — se/e — khí trắng nối khối; thiếu vòng trận sao"
```

```text
LỖI: concept-attempt1 — hướng — ne — ngoái đầu lộ mặt và mắt vàng (mắt)
LỖI: concept-attempt1 — bố cục — se/e — khí trắng nối khối; thiếu vòng trận sao (mắt)
```

Theo quyết định ở PR #1145: concept chỉ tham chiếu ngoại hình; hướng ne/n xử lý ở khâu phụ thể bằng hình nộm. Giữ nguyên kết quả kiểm RAW và mọi lỗi đã quan sát, không coi ảnh này là sheet năm hướng dùng trực tiếp. SHA256 ảnh và prompt không đổi khi chuyển vị trí.

## Chân dung lượt 1 — #1158

Ngày 2026-10-27; 1/3 lượt. builtin `image_gen.imagegen`; model/seed `unknown`. RAW nguyên byte `candidates/portrait-attempt1.png`, SHA256 `48e0462c0b9f78b02dc439e986897979687fa8ad6e80278735c7786801b04dc3`. Prompt CLI nguyên văn `candidates/portrait-attempt1.prompt.txt`, SHA256 `4643a590c754e6fe478cc7e426e1ef51844a0e5e878f9c72063103d8050012d8`; không viết tay, không addendum. Ảnh neo ngoại hình: `concept-attempt1.png`, SHA256 `910d3a48b513daa6e8dd4768dbf57cf9a6d5170d78490066d0af1a51f89a0475`. Hồ sơ lệnh và kết quả kiểm: `candidates/portrait-attempt1.source.json`.

P1c: `--preset portrait`; bản thử `candidates/portrait-attempt1-P1c/bach_ho-portrait.png`, 64×64, 8 màu, giữ 8/8 điểm sáng. Xem `candidates/portrait-attempt1-P1c/preview/index.html` và `so-sanh.png`. Chưa được chủ repo duyệt mỹ thuật, chưa nhập game. Không sửa RAW.

### Khai báo duyệt mắt chân dung (`--eye`)

Công cụ vohon:check chưa có cờ --eye; chỉ khai tại đây, không đổi bộ kiểm.

```text
--eye "portrait-attempt1=góc nhìn — chính diện; dải khí trắng lớn, lông/vằn còn nhiều chi tiết; cần duyệt độ tách nền ở cỡ 64×64"
```

**Kết luận chân dung:** lượt 1 chưa đạt brief, toàn bộ ở `candidates/`; chưa có chân dung cuối được chọn. Prompt lưu UTF-8 LF theo Git, chỉ chuẩn hóa xuống dòng so với chuỗi CLI; SHA256 chuỗi gửi ban đầu `5191476fd883ca590df8c5f29a61118f37a558f585888dd6506741dd9ae14b07`, SHA256 file prompt Git `4643a590c754e6fe478cc7e426e1ef51844a0e5e878f9c72063103d8050012d8`. Không sửa nội dung prompt.

```text
--eye "portrait-attempt1=bản P1c — 64×64 — mất nhiều khối tối; điểm mắt/đầu chưa tách rõ, chưa đạt brief; giữ làm candidate"
```
