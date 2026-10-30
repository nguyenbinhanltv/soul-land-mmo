# Kiểm tờ vũ khí: xuc_xich

**Mức chung: NHẸ** · nhóm A, khung 128, màu khóa nộm #00D0D0.

| Tờ | Cỡ | Loại | Mức | Chặn | Nhẹ | Lưu ý |
|---|---|---|---|---|---|---|
| toA | 1536×1024 | huong | pass | 0 | 0 | 0 |
| toB | 1536×1024 | huong | pass | 0 | 0 | 0 |
| toC | 1536×1024 | huong | pass | 0 | 0 | 0 |
| toD | 1536×1024 | huong | pass | 0 | 0 | 0 |
| toE | 1536×1024 | huong | nhẹ | 0 | 1 | 0 |

Mức theo khối hướng: s pass · se pass · e pass · ne pass · n nhẹ

## toA — pass

Ảnh liên hệ: `xuc_xich-toA-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## toB — pass

Ảnh liên hệ: `xuc_xich-toB-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## toC — pass

Ảnh liên hệ: `xuc_xich-toC-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## toD — pass

Ảnh liên hệ: `xuc_xich-toD-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## toE — nhẹ

Ảnh liên hệ: `xuc_xich-toE-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

- **nhẹ** `hurt-idle` H1 (n): hurt trùng idle (xor/hợp 0.073): không thấy phản ứng trúng đòn.

Dòng nháp cho NGUON.md (soát lại bằng mắt trước khi dán):

```
LỖI: toE — hurt trùng idle — H1 (n) — hurt trùng idle (xor/hợp 0.073): không thấy phản ứng trúng đòn.
```

## Việc còn lại cho mắt người

Công cụ không kiểm: nhận diện đúng võ hồn so với bảng mô tả, vẽ lại thân / mặt / tay chân người, nộm bị vẽ thêm mặt ở `n` / `ne`, `se` / `ne` khác `e` thật sự, hurt lùi đúng hướng, điểm gắn khớp khi ghép lên thân thật (`phuthe-sheet-preview.mjs`).
Xem từng ảnh liên hệ và bổ sung các điểm này vào dòng `LỖI:`.
