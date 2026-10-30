# Kiểm tờ vũ khí: thien_can_bach_ngoc_dinh

**Mức chung: NHẸ** · nhóm A, khung 128, màu khóa nộm #00D0D0.

| Tờ | Cỡ | Loại | Mức | Chặn | Nhẹ | Lưu ý |
|---|---|---|---|---|---|---|
| toA | 1536×1024 | huong | pass | 0 | 0 | 0 |
| toB | 1536×1024 | huong | nhẹ | 0 | 3 | 0 |
| toC | 1536×1024 | huong | nhẹ | 0 | 2 | 0 |
| toD | 1536×1024 | huong | nhẹ | 0 | 1 | 0 |
| toE | 1536×1024 | huong | pass | 0 | 0 | 0 |

Mức theo khối hướng: s pass · se nhẹ · e nhẹ · ne nhẹ · n pass

## toA — pass

Ảnh liên hệ: `thien_can_bach_ngoc_dinh-toA-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## toB — nhẹ

Ảnh liên hệ: `thien_can_bach_ngoc_dinh-toB-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

- **nhẹ** `nom-mat` H1 (se) C1: nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.48 < 0.5); cutter dùng độ dời trung vị của tờ.
- **nhẹ** `nom-mat` H1 (se) C2: nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.5 < 0.5); cutter dùng độ dời trung vị của tờ.
- **nhẹ** `nom-mat` H2 (se) C4: nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.46 < 0.5); cutter dùng độ dời trung vị của tờ.

Dòng nháp cho NGUON.md (soát lại bằng mắt trước khi dán):

```
LỖI: toB — mất nộm — H1 (se) C1, H1 (se) C2, H2 (se) C4 — nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.48 < 0.5); cutter dùng độ dời trung vị của tờ; nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.5 < 0.5); cutter dùng độ dời trung vị của tờ; nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.46 < 0.5); cutter dùng độ dời trung vị của tờ.
```

## toC — nhẹ

Ảnh liên hệ: `thien_can_bach_ngoc_dinh-toC-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

- **nhẹ** `nom-mat` H2 (e) C1: nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.49 < 0.5); cutter dùng độ dời trung vị của tờ.
- **nhẹ** `nom-mat` H2 (e) C4: nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.49 < 0.5); cutter dùng độ dời trung vị của tờ.

Dòng nháp cho NGUON.md (soát lại bằng mắt trước khi dán):

```
LỖI: toC — mất nộm — H2 (e) C1, H2 (e) C4 — nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.49 < 0.5); cutter dùng độ dời trung vị của tờ; nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.49 < 0.5); cutter dùng độ dời trung vị của tờ.
```

## toD — nhẹ

Ảnh liên hệ: `thien_can_bach_ngoc_dinh-toD-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

- **nhẹ** `nom-mat` H2 (ne) C4: nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.47 < 0.5); cutter dùng độ dời trung vị của tờ.

Dòng nháp cho NGUON.md (soát lại bằng mắt trước khi dán):

```
LỖI: toD — mất nộm — H2 (ne) C4 — nộm bị che nhiều hoặc đổi dạng (điểm khớp 0.47 < 0.5); cutter dùng độ dời trung vị của tờ.
```

## toE — pass

Ảnh liên hệ: `thien_can_bach_ngoc_dinh-toE-lien-he.png` (xanh = đạt, vàng = nhẹ, đỏ = chặn; nhãn I/W/A/C/H + số khung).

Không có phát hiện.

Không có dòng `LỖI:` tự sinh.

## Việc còn lại cho mắt người

Công cụ không kiểm: nhận diện đúng võ hồn so với bảng mô tả, vẽ lại thân / mặt / tay chân người, nộm bị vẽ thêm mặt ở `n` / `ne`, `se` / `ne` khác `e` thật sự, hurt lùi đúng hướng, điểm gắn khớp khi ghép lên thân thật (`phuthe-sheet-preview.mjs`).
Xem từng ảnh liên hệ và bổ sung các điểm này vào dòng `LỖI:`.
