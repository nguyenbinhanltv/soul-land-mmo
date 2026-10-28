# Preset icon `icon-nearest` (cách C = RAW, #1159)

Chủ repo chọn (2026-10-27) icon võ hồn lấy thẳng từ RAW (`icon-attempt1.png`), thu nhỏ bằng láng giềng gần nhất, KHÔNG ép 8 màu / pixel hóa P1c (so sánh A / B / C: artifact worker 672, `vohon-icon-so-sanh/ket-luan.md`). Tách riêng để `vo-hon-phong-cach.md` không phình thêm.

`node tools/assets/vohon-pixelize.mjs --type icon --id <võ hồn> --in <icon-attempt1.png> --out <thư mục> --preset icon-nearest [--outline off] [--size 24|32] [--crop x,y,w,h]` ghi `<id>-icon-32.png` và `-24.png` (+ `.report.json`). Cách làm (`iconNearest` ở `vohon-pixelize-lib.mjs`): bỏ nền như icon thường → cắt cận hộp bao, nới thành ô vuông → thu về (cỡ − 2) bằng láng giềng gần nhất (lấy điểm giữa ô, không trộn màu, không bảng màu, không làm cứng, không nâng sáng) → nền trong suốt (alpha 0 / 255) → viền ngoài #1a1020 1 điểm (`--outline off` bỏ viền, hình lấp đầy ô). Preset cũ (≤ 8 màu) giữ nguyên là mặc định.

`vohon:check pixel` với báo cáo có `preset: "icon-nearest"` không đòi `PORTRAIT_MAX_COLORS` màu (giữ đủ màu RAW, cỡ vẫn phải 24 / 32 vuông, alpha 0 / 255, có trong suốt); các mục NHẸ khác (`nhieu-chi-tiet`, `gan-mau`, viền) vẫn báo, mắt duyệt trang xem trước (`vohon-preview.mjs`). Lô 1 xuất vào `art/src/vohon-v2/<mã>/icon-attempt1-nearest/` (không đè bản cũ `icon-attempt1-pixel/`); chưa nhập game (theo skill `asset-gen` sau khi chủ repo duyệt).


## Nhập game (#1159)

Khóa `icon_<mã võ hồn>_24` / `_32` (manifest `iso: true`) trỏ tới `shared/assets/sprites/iso/portrait/<mã>_icon24.png` / `_icon32.png`. `validate --register <khóa> --iso --keep-order --tool "ChatGPT / Codex + vohon-pixelize icon-nearest" --prompt "<nguồn prompt>"` kiểm đúng võ hồn, cỡ, alpha 0/255, có cả vật và nền trong suốt; chỉ loại này được giữ đủ màu RAW. `--keep-order` giữ thứ tự khóa sẵn có khi thêm lô mới. `artUrl` đọc hai cỡ; bảng Nhân vật dùng icon 24 px ở dải chọn võ hồn. Bảng đủ/thiếu nhập game ở `art/src/vohon-v2/NHAP-V2.md`; Xúc Xích hết 3 lượt, chưa nhập.
