# thien_can_bach_ngoc_dinh — phụ thể hoạt ảnh lô 8

Part of #1025. Ngày 2026-10-28. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW nguyên byte, không hậu kỳ; prompt nguyên văn khối text của `phuthe-sheet-prompt.mjs --stage direction --concept-ref`. Bài học chỉ từ `art/src/phuthe-anim/lessons.md`. Mỗi tờ tối đa ba lượt.

Tham chiếu cố định: (1) bảng từng hướng trong `references/`; (2) concept riêng đã duyệt (đường dẫn và SHA256 trong source JSON từng tờ). Không dùng tờ lỗi hay phụ thể tĩnh cũ làm tham chiếu. Không dùng ảnh thứ ba. Màu thân tham chiếu: `#00D0D0`. SHA256 RAW, prompt và từng ảnh dẫn nằm trong `toX.source.json`; `raw_check` giữ báo cáo kỹ thuật từng hướng. Prompt giữ nguyên byte qua thuộc tính Git `-text`.

## Kết quả kỹ thuật

| Tờ | Lượt | Mức | Chặn | Mã cảnh báo |
|---|---|---|---|---|
| toA (s) | 2/3 | nhẹ | 0 | nen, tach-hinh, o-trong, nom-lech, cham-mep-khung, vuot-khung |
| toB (se) | 3/3 | nhẹ | 0 | nen, tach-hinh, o-trong, nom-lech, cham-mep-khung, vuot-khung, co-phu-the |
| toC (e) | 2/3 | nhẹ | 0 | nen, nom-lech, cham-mep-khung, vuot-khung, nom-mat, co-phu-the |
| toD (ne) | 1/3 | nhẹ | 0 | nen, tach-hinh, o-trong, nom-lech, cham-mep-khung, vuot-khung, co-phu-the |
| toE (n) | 1/3 | nhẹ | 0 | nen, nom-lech, cham-mep-khung, vuot-khung, co-phu-the |

Lượt hỏng lưu nguyên bộ PNG/prompt/source trong `candidates/`, không dùng làm tham chiếu hay nhập game. Chỉ cắt và nhập các tờ có 0 chặn kỹ thuật theo chỉ định chủ repo; hướng không đạt giữ phụ thể tĩnh cũ qua `dirsOk`. Neo tự động do công cụ sinh, worker khác chỉnh sau.

## Soát mắt

Cutter: 65 khung, 32 màu, **0 block / 105 warn**. Đã nhập đủ năm hướng bằng `phuthe-import.mjs`; không cần `dirsOk` hay fallback riêng hướng. Preview ghép LPC nam/nữ có đủ clip và trang xoay; xem khung idle nam cho thấy đỉnh ở sau thân và phần trên bị xén. Neo hiện tự động, chưa căn đẹp.

Đỉnh còn lớn/cao, thân chuẩn bị thu nhỏ/dời; attack/cast và khói bị xén mép. Góc se/e/ne chưa tách mạnh ở mọi khung. Hướng n vẫn lộ hoa văn mặt trước ở nhiều khung, chưa thể hiện mặt sau ổn định. Giữ nguyên RAW và mức kỹ thuật, neo do worker sau chỉnh.

Các lỗi mỹ thuật trên được khai riêng, không thay đổi mức kỹ thuật của công cụ. Chưa chứng nhận căn neo đẹp trong game.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phuthe-anim/thien_can_bach_ngoc_dinh/` | `vhanim_thien_can_bach_ngoc_dinh_b/f` | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | RAW phụ thể lô 8, prompt CLI nguyên văn; SHA256 trong source từng tờ | 2026-10-28 | Chỉ nhập hướng 0 chặn; neo tự động chờ chỉnh |
