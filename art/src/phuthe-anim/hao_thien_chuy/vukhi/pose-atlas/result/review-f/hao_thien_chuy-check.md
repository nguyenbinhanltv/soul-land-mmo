# Kiểm tờ vũ khí: hao_thien_chuy

**Mức chung: NHẸ** · nhóm A, khung 128, màu khóa nộm #00D0D0.

| Tờ | Cỡ | Loại | Mức | Chặn | Nhẹ | Lưu ý |
|---|---|---|---|---|---|---|
| toA | 1536×1024 | huong | pass | 0 | 0 | 0 |
| toB | 1536×1024 | huong | pass | 0 | 0 | 0 |
| toC | 1536×1024 | huong | nhẹ | 0 | 1 | 0 |
| toD | 1536×1024 | huong | nhẹ | 0 | 1 | 0 |
| toE | 1536×1024 | huong | nhẹ | 0 | 1 | 0 |

Mức theo khối hướng: s pass · se pass · e nhẹ · ne nhẹ · n nhẹ

## toA — pass

Ảnh liên hệ: `hao_thien_chuy-toA-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## toB — pass

Ảnh liên hệ: `hao_thien_chuy-toB-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## toC — nhẹ

Ảnh liên hệ: `hao_thien_chuy-toC-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

- **nhẹ** `co-phu-the` khối e: cỡ phụ thể so với khối s: idle 163%, walk 131%, hurt 164% (lệch quá 10%; cảnh báo kỹ thuật, cutter không chặn).

Ghi chú kỹ thuật (cỡ phụ thể, không phải lỗi):
- khối e: cỡ phụ thể so với khối s: idle 163%, walk 131%, hurt 164% (lệch quá 10%; cảnh báo kỹ thuật, cutter không chặn).

Không có dòng `LỖI:` tự sinh.

## toD — nhẹ

Ảnh liên hệ: `hao_thien_chuy-toD-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

- **nhẹ** `co-phu-the` khối ne: cỡ phụ thể so với khối s: idle 114%, hurt 115% (lệch quá 10%; cảnh báo kỹ thuật, cutter không chặn).

Ghi chú kỹ thuật (cỡ phụ thể, không phải lỗi):
- khối ne: cỡ phụ thể so với khối s: idle 114%, hurt 115% (lệch quá 10%; cảnh báo kỹ thuật, cutter không chặn).

Không có dòng `LỖI:` tự sinh.

## toE — nhẹ

Ảnh liên hệ: `hao_thien_chuy-toE-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

- **nhẹ** `co-phu-the` khối n: cỡ phụ thể so với khối s: idle 128%, walk 117%, hurt 128% (lệch quá 10%; cảnh báo kỹ thuật, cutter không chặn).

Ghi chú kỹ thuật (cỡ phụ thể, không phải lỗi):
- khối n: cỡ phụ thể so với khối s: idle 128%, walk 117%, hurt 128% (lệch quá 10%; cảnh báo kỹ thuật, cutter không chặn).

Không có dòng `LỖI:` tự sinh.

## Việc còn lại cho mắt người

Công cụ không kiểm: nhận diện đúng võ hồn so với bảng mô tả, vẽ lại thân / mặt / tay chân người, nộm bị vẽ thêm mặt ở `n` / `ne`, `se` / `ne` khác `e` thật sự, hurt lùi đúng hướng, điểm gắn khớp khi ghép lên thân thật (`phuthe-sheet-preview.mjs`).
Xem từng ảnh liên hệ và bổ sung các điểm này vào dòng `LỖI:`.
