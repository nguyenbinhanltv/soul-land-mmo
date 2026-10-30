# Kiểm tờ vũ khí: yeu_ho

**Mức chung: PASS** · nhóm A, khung 128, màu khóa nộm #00D0D0.

| Tờ | Cỡ | Loại | Mức | Chặn | Nhẹ | Lưu ý |
|---|---|---|---|---|---|---|
| toA | 1536×1024 | huong | pass | 0 | 0 | 0 |
| toB | 1536×1024 | huong | pass | 0 | 0 | 1 |
| toC | 1536×1024 | huong | pass | 0 | 0 | 0 |
| toD | 1536×1024 | huong | pass | 0 | 0 | 0 |
| toE | 1536×1024 | huong | pass | 0 | 0 | 0 |

Mức theo khối hướng: s pass · se pass · e pass · ne pass · n pass

## toA — pass

Ảnh liên hệ: `yeu_ho-toA-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## toB — pass

Ảnh liên hệ: `yeu_ho-toB-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

- **lưu ý** `se-giong-e` se vs e: hình bóng phụ thể idle se ≈ e (IoU 0.852 > 0.8): cảnh báo gần đúng, xem bằng mắt.

Không có dòng `LỖI:` tự sinh.

## toC — pass

Ảnh liên hệ: `yeu_ho-toC-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## toD — pass

Ảnh liên hệ: `yeu_ho-toD-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## toE — pass

Ảnh liên hệ: `yeu_ho-toE-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## Việc còn lại cho mắt người

Công cụ không kiểm: nhận diện đúng võ hồn so với bảng mô tả, vẽ lại thân / mặt / tay chân người, nộm bị vẽ thêm mặt ở `n` / `ne`, `se` / `ne` khác `e` thật sự, hurt lùi đúng hướng, điểm gắn khớp khi ghép lên thân thật (`phuthe-sheet-preview.mjs`).
Xem từng ảnh liên hệ và bổ sung các điểm này vào dòng `LỖI:`.
