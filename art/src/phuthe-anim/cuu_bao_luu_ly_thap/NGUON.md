# cuu_bao_luu_ly_thap — phụ thể hoạt ảnh lô 8

Part of #1025. Ngày 2026-10-28. Công cụ builtin `image_gen.imagegen`, model/seed `unknown`. RAW nguyên byte, không hậu kỳ; prompt nguyên văn khối text của `phuthe-sheet-prompt.mjs --stage direction --concept-ref`. Bài học chỉ từ `art/src/phuthe-anim/lessons.md`. Mỗi tờ tối đa ba lượt.

Tham chiếu cố định: (1) bảng từng hướng trong `references/`; (2) concept riêng đã duyệt (đường dẫn và SHA256 trong source JSON từng tờ). Không dùng tờ lỗi hay phụ thể tĩnh cũ làm tham chiếu. Không dùng ảnh thứ ba. Màu thân tham chiếu: `#D0D000`. SHA256 RAW, prompt và từng ảnh dẫn nằm trong `toX.source.json`; `raw_check` giữ báo cáo kỹ thuật từng hướng. Prompt giữ nguyên byte qua thuộc tính Git `-text`.

## Kết quả kỹ thuật

| Tờ | Lượt | Mức | Chặn | Mã cảnh báo |
|---|---|---|---|---|
| toA (s) | 1/3 | nhẹ | 0 | nen, cham-mep-khung, vuot-khung |
| toB (se) | 1/3 | nhẹ | 0 | nen, cham-mep-khung, vuot-khung |
| toC (e) | 1/3 | nhẹ | 0 | nen, o-trong, nom-lech, cham-mep-khung, vuot-khung, co-phu-the |
| toD (ne) | 1/3 | nhẹ | 0 | nen, cham-mep-khung, vuot-khung, nom-lech, co-phu-the |
| toE (n) | 1/3 | nhẹ | 0 | nen, cham-mep-khung, vuot-khung, co-phu-the |

Lượt hỏng lưu nguyên bộ PNG/prompt/source trong `candidates/`, không dùng làm tham chiếu hay nhập game. Chỉ cắt và nhập các tờ có 0 chặn kỹ thuật theo chỉ định chủ repo; hướng không đạt giữ phụ thể tĩnh cũ qua `dirsOk`. Neo tự động do công cụ sinh, worker khác chỉnh sau.

## Soát mắt

Cutter: 65 khung, 32 màu, **0 block / 130 warn**. Đã nhập đủ năm hướng bằng `phuthe-import.mjs`, không cần `dirsOk` hay fallback riêng hướng. Đã dựng preview ghép LPC nam/nữ đủ clip và trang xoay. Concept tham chiếu đã đăng ký tại `art/src/vohon-v2/cuu_bao_luu_ly_thap/concept.png`, nguồn duyệt ngoại lệ và SHA256 ghi trong hồ sơ concept.

Tháp giữ mái lam và bảy sắc, chưa xác nhận đủ chín tầng theo ngoại lệ concept. Hướng n vẫn lộ bảo thạch mặt trước ở mọi clip, mặt sau chưa đúng; các góc se/e/ne chưa tách ổn định. Vòng trang trí dày, tháp còn lớn/cao, thân chuẩn nhỏ/dời; attack vung nghiêng mạnh và nhiều mép bị xén. Giữ nguyên RAW, neo tự động chờ worker sau chỉnh.

Các lỗi mỹ thuật trên được khai riêng, không thay đổi mức kỹ thuật của công cụ. Chưa chứng nhận căn neo đẹp trong game.

## Ghi công

| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |
|---|---|---|---|---|---|
| `art/src/phuthe-anim/cuu_bao_luu_ly_thap/` | `vhanim_cuu_bao_luu_ly_thap_b/f` | builtin `image_gen.imagegen` (ChatGPT / Codex, Q44) | RAW phụ thể lô 8, prompt CLI nguyên văn; SHA256 trong source từng tờ | 2026-10-28 | Chỉ nhập hướng 0 chặn; neo tự động chờ chỉnh |
