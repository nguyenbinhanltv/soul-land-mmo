# Preset chân dung `portrait2` (P1c2, #1158)

Tách từ `vo-hon-phong-cach.md` (mục 6, tạo tương phản #1095) để file đó không vượt hạn 48000 byte.

P1c hỏng ở lô 1 (#1162) vì "chủ thể" = Otsu theo độ sáng, nên chỉ các nét phát sáng được giữ còn thân tối (lông, vảy, thân nhện) bị coi là nền: `coolBackground` hạ ×0,55 và giảm bão hòa, hue-shift đẩy màu, bảng 8 màu gộp `merge` 34 làm khối tối mất hoặc dính, mắt / mỏ tối màu (tím, đỏ) bị `harden` xóa, Tử Vong Chu Hoàng lệch màu. `--preset portrait2` giữ preset cũ nguyên và làm: nền = vùng nối mép ảnh VÀ gần màu viền (`edgeBackground`, không theo độ sáng; phủ quá nửa ảnh thì siết ngưỡng) → một tông tối phẳng cùng gam viền; thân KHÔNG đổi màu (không hue-shift, không hạ sáng); bỏ phiếu ít thiên về điểm sáng (`accent` 0,6); 16 màu, `merge` 12; mỗi đốm sáng nguồn có màu riêng (`protectBlobs`) và điểm tâm được ghim lại sau `harden`; viền sáng 1 điểm theo tông thân. Báo cáo thêm `bgShare`, `colorDrift` (lệch màu so với RAW, 0..1; lô 1 đạt 0,12–0,17). `vohon:check pixel` vẫn NHẸ `nhieu-chi-tiet` / `gan-mau` / `nen-chu-the` cho bản này (ngưỡng đặt cho P1c: ít màu, nền lạnh): đánh đổi có chủ ý để sát RAW; mắt đọc nhỏ ở 64×64 vẫn cần duyệt bằng mắt. Ví dụ: `node tools/assets/vohon-pixelize.mjs --type portrait --id bach_ho --in <raw.png> --out <thư mục> --preset portrait2`.

**Thử trên RAW của #1083**: chân dung Tà Hỏa lượt 2 cắt sát mặt `--focus 0.69,0.55 --zoom 2.2`: trước 13 màu, mật độ biên 0,335 (NHẸ), cam dính nhau; sau `--preset portrait` 6 màu, mật độ biên 0,268 (ĐẸP), nền tím tối, mỏ + mắt sáng tách rõ. Concept Hạo Thiên tách đủ 5 khung 160×160; icon 24×24 mất đốm sáng (NHẸ).

## 7. Mốc duyệt

1. Tài liệu này (PR của #1032) được review.
2. **Mục 2, 4 và 6 đã được duyệt** (bảng thiết kế 25 võ hồn): chủ repo giao orchestrator tự duyệt, orchestrator duyệt trong CA ĐÊM 2026-10-27; chủ repo xem lại sau, chưa vẽ gì. tthoadev có thể góp ý bảng thiết kế (đặc biệt Xúc Xích, Nhu Cốt Thố, Yêu Hồ, Bạch Hổ là bốn con dễ lệch phong cách).
3. Sau khi duyệt: tthoadev vẽ demo (#1024) gồm **Tà Hỏa Phượng Hoàng** (phụ thể + chân dung + icon) và **Hạo Thiên Chùy** (pháp tướng mới, một trong 11); đạt thì gộp (#1025): phụ thể + chân dung / thẻ + icon cho các võ hồn còn lại, còn pháp tướng chỉ cho 10 võ hồn còn lại trong nhóm 11 (trừ Hạo Thiên Chùy đã làm ở demo). 14 pháp tướng PixelLab giữ nguyên.

## Issue liên quan
#1087 (công cụ chuyển pixel / prompt / kiểm cho chân dung, icon, pháp tướng), #1083 (demo #1024, bài học), #1020 (epic phụ thể v2), #1032 (tài liệu này), #1022 (công cụ prompt `phuthe-sheet-prompt`), #1024 (demo Tà Hỏa Phượng Hoàng), #1025 (gộp), #1028 (đặc tả phụ thể P0).
