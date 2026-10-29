> **Bộ hiện hành:** [atlas tám pose đủ năm hướng](pose-atlas/README.md), [preview](pose-atlas/index.html). Đã cắt hai nửa ở thư mục này, 0 chặn; phần dưới là hồ sơ RAW lịch sử, không phải kết luận mới. Bỏ vác vai theo quyết định điều phối; đã nhập cả hai nửa bằng importer theo phân công tiếp theo, ảnh kiểm trong [ingame/](ingame/index.html).

# Hạo Thiên Chùy — thí điểm vũ khí cứng

Part of #1312, epic #1020; issue #1319, PR #1320. Ngày sinh: 30/10/2026 (giờ máy). Công cụ: Codex / OpenAI `image_gen` tích hợp; model ID và seed không được công cụ trả về, ghi `unknown`. Sử dụng theo điều khoản đầu ra OpenAI, không gán CC0.

**Chưa đạt để cắt hoặc nhập.** Chưa có `vkanim`, `manifest-entry.json` hay `anim.grip` đầu ra. Không sửa `shared/assets`. Trang [xem trước RAW](index.html) phát ô ảnh gốc, chưa phải hoạt ảnh ghép LPC. Chủ repo cần quyết định bước tiếp theo vì A đã hết 3 lượt.

## Đầu vào và cách làm

- Đối chiếu `origin/main` trước khi làm: chưa có thư mục `hao_thien_chuy/vukhi`; công cụ PR #1313 đã merge. Nhánh từ `origin/main`: `ao/hao-thien-chuy/1312-vukhi-thi-diem`.
- Đặc tả dòng 19 `docs/art/phu-the-vu-khi.md`: đại chùy hai tay, đầu khối vuông mẻ, cán dài đai vàng cũ, ít nứt cam đỏ; vác vai khi đứng / đi; khung 128.
- Nộm dựng bằng `phuthe-sheet-prompt.mjs --kind vukhi` (gọi `writeDummies` của `phuthe-sheet-dummy.mjs`): cyan `#00D0D0`, vạch `#7A5CFF`, marker `#00FF60`, nền `#FF00FF`. Tham chiếu nộm từng hướng ở `references/`.
- Mỗi job chỉ một tờ và một bảng nộm. Không dùng ảnh phụ thể cũ hoặc ảnh lỗi làm tham chiếu. Chưa có turnaround vũ khí được duyệt; các job chỉ đính nộm, không giả định turnaround cũ là vũ khí.
- A lượt 1 dùng prompt rút gọn viết tay (lưu nguyên văn; sai quy trình prompt tự sinh, không dùng làm chuẩn). Từ A lượt 2 và B–E dùng nguyên khối prompt công cụ sinh, kèm bài học `@VUKHI` trong `lessons.md`.
- RAW giữ nguyên byte, không đổi cỡ / sửa nền / vẽ bù. Ảnh đầu ra đều 1536×1024. Mỗi `.source.json` ghi SHA-256 của RAW, prompt và tham chiếu cùng kết quả kiểm; không suy đoán model / seed.

## Phiếu duyệt

| Tờ | Hướng | Lượt dùng / đã sinh | Kiểm máy (chặn / nhẹ) | Bằng mắt |
|---|---|---|---|---|
| [A](toA.png) | nam | 3 / 3 | 0 / 7 | Chưa đạt: idle cách marker A 17 điểm; tay bị vẽ lại trong attack / cast, vượt khung |
| [B](toB.png) | đông-nam | 1 / 1 | 1 / 21 | Chưa đạt: nộm trôi tới 56 điểm; cầm không đúng marker; chưa ổn định góc chùy |
| [C](toC.png) | đông | 1 / 1 | 0 / 24 | Chưa đạt: đổi dáng đầu búa thành nhiều khối tròn; đổi tay; marker trôi, vượt khung |
| [D](toD.png) | đông-bắc | 1 / 1 | 0 / 19 | Chưa đạt: nâng tay nộm, cán không qua hai tay; không thấy mặt nhưng chưa đủ để duyệt hướng |
| [E](toE.png) | bắc | 1 / 1 | 1 / 0 | Chưa đạt: hàng đầu dò 4 hình thay vì 3 do mảnh rời; nâng tay nộm |

`npm run phuthe:check -- hao_thien_chuy --kind vukhi --dir art/src/phuthe-anim/hao_thien_chuy/vukhi --out <temp>` trả exit 1. Chi tiết nguyên văn từng lỗi nằm trong `technicalCheck` của `toA.source.json` … `toE.source.json`. `ui:check` dành cho các loại tờ UI Kit, không có kiểu vũ khí; không dùng nó để chứng nhận bộ này.

Hai lượt A trước giữ tại `candidates/`, kèm prompt và nguồn: lượt 1 chặn lưới (5 dải / cần 4); lượt 2 có 10 cảnh báo. Lượt 3 có ít cảnh báo nhất, vẫn không đạt bằng mắt. Không sinh lượt A thứ 4. B–E còn lượt nhưng chưa thử tiếp vì A đã chặn khả năng hoàn tất bộ cắt.

## Bài học và bước tiếp

Đã ghi hai bài học `@VUKHI` vào `art/src/phuthe-anim/lessons.md`: giữ nguyên pixel nộm, không nâng tay cho khớp vác vai; cán đi từ tay thấp lên vai, không nằm ngang sau cổ; không sinh đá rời.

Đề xuất cần duyệt: kiểm lại nộm / marker cho tư thế vác vai hai tay và tạo turnaround vũ khí được duyệt trước một đợt sinh mới. Không tự sửa công cụ trong PR ảnh này, không tự tăng giới hạn lượt. Chỉ khi kiểm máy và mắt đạt mới cắt, xem ghép LPC và bàn giao importer Claude.

## Ghi công

| File | Công cụ / tác giả | Nguồn / điều khoản | Thao tác |
|---|---|---|---|
| `toA.png` … `toE.png`, `candidates/toA-attempt1.png`, `candidates/toA-attempt2.png` | Codex / OpenAI image_gen | Đầu ra OpenAI; prompt và hash ở file cùng tên | RAW nguyên byte, chưa nhập |
| `references/*`, `candidates/nom-toA.png` | Nộm từ thân LPC của dự án, dựng bằng công cụ repo | Giữ giấy phép LPC của nguồn thân hiện có (`art/CREDITS.md`); không tuyên bố CC0 | Tô màu khóa, thêm vạch và marker |

Kiểm repo và build đã đạt trong phiên; kiểm RAW chưa đạt. PR giữ nháp, không merge.
