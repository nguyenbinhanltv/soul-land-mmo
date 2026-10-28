# Runbook phụ thể hoạt ảnh: làm 24 võ hồn còn lại (Part of #1025, epic #1020)

Bổ sung cho `phu-the-hoat-anh.md` (đặc tả, nhóm, số khung, tiêu chí duyệt) và `phu-the-vach-tham-chieu.md`; không đổi luật chơi hay số cân bằng. Mẫu đã chạy hết đường: Tà Hỏa Phượng Hoàng (`art/src/phuthe-anim/ta_hoa_phuong_hoang/NGUON.md`, nhập #1185). Chủ repo duyệt (2026-10-28) làm **toàn bộ 25 võ hồn**; 24 còn lại = 10 B (chi thể sinh vật) + 6 C (thực vật / hư ảnh) + 8 A (vật cứng).

## Chuẩn bị đã có sẵn
- **Loại, khung, clip:** theo bảng "Phân nhóm" và "Bảng phần riêng" của `phu-the-hoat-anh.md`; `node tools/assets/phuthe-sheet-prompt.mjs --all` in mã, nhóm, khung (96 / 128), màu nộm. Sinh vật (B, C): idle 4, walk 6, attack 6, cast 4, hurt 2 (lưới 6 × 4, 22 ô). Vật cứng (A): idle 2, walk 4, attack 4, cast 2, hurt 1 (13 ô, pose ít nhưng **khác thật**). Khung 128: `tu_vong_chu_hoang`, `ky_nhung_thong_thien_cuc`, `hao_thien_chuy`, `cuu_bao_luu_ly_thap`, `pha_hon_thuong`; còn lại 96.
- **Bảng nộm từng tờ** `art/src/phuthe-anim/<id>/references/<id>-nom-to{A..E}.png` (A = `s`, B = `se`, C = `e`, D = `ne`, E = `n`) đã dựng cho cả 24 võ hồn (đúng khung LPC, vạch tham chiếu, màu nộm / vạch theo công cụ). Dựng lại khi đổi công cụ: `node tools/assets/phuthe-sheet-dummy.mjs --all --out art/src/phuthe-anim --skip ta_hoa_phuong_hoang --no-turnaround`. Màu nộm `#00D0D0` trừ võ hồn gần màu cyan (`--all` của prompt in màu thật); vạch `#7A5CFF`, đổi `#FF8C00` cho `u_minh_linh_mieu`, `tu_vong_chu_hoang`, `quy_mi`. Ghi màu thật vào `NGUON.md`.
- **Không có turnaround được duyệt** (chỉ Tà Hỏa có): dùng cờ `--concept-ref`, ảnh số 2 là concept 5 hướng đã duyệt `art/src/vohon-v2/<id>/concept-attemptN.png` thay turnaround. Mặc định (không cờ) vẫn đòi turnaround. Không sinh turnaround mới.

## Quy trình mỗi võ hồn (mỗi tờ tối đa 3 lượt)
1. **Prompt (công cụ sinh, không addendum tay):** `node tools/assets/phuthe-sheet-prompt.mjs --id <id> --stage direction --dir s --concept-ref --out <tmp>`, lần lượt `--dir s`, `se`, `e`, `ne`, `n` (A–E). Dùng khối `text` trong `<tmp>/<id>-to<X>.md` nguyên văn; bài học Tà Hỏa tự chèn từ `art/src/phuthe-anim/lessons.md`. Ghi sang `--out` cũng dựng lại bảng nộm ở `<tmp>`; ảnh đính kèm lấy từ `references/`.
2. **Sinh ảnh** (cuộc trò chuyện mới mỗi tờ), ảnh đính kèm **theo thứ tự**: (1) `references/<id>-nom-to<X>.png`; (2) concept `vohon-v2/<id>/concept-attemptN.png` (lượt lớn nhất); (3, tùy chọn) một tờ hướng của chính võ hồn **đã qua kiểm không chặn** (tờ A cho B–E; D cho E). Không dùng tờ hỏng, ảnh phụ thể cũ.
3. **Lưu RAW nguyên byte** `art/src/phuthe-anim/<id>/to<X>.png` + `to<X>.prompt.txt` + `to<X>.source.json` (SHA256 ảnh, prompt, từng tham chiếu, kết quả kiểm); lượt loại vào `candidates/`.
4. **Kiểm:** `npm run phuthe:check -- <id> --out <tmp>` (chặn thoát mã 1; nhẹ chấp nhận). Xem tờ liên hệ: nộm không trôi / không thu nhỏ, hình không dính, hàng `attack` / `cast` đủ ô, `se` / `ne` khác `e`, `n` không lộ mặt.
5. **Cắt:** `node tools/assets/phuthe-sheet-cut.mjs --id <id> --sheet A=…/toA.png … --sheet E=…/toE.png --out <artifact>/<id>` (kèm `lop.json` của võ hồn; mặc định theo bảng "Điểm gắn / mặt nạ").
6. **Neo + xem trước:** `node tools/assets/phuthe-anchor.mjs --id <id> --source anim --dir <artifact>/<id> --out <artifact>/<id>/anchor.json`, rồi `node tools/assets/phuthe-sheet-preview.mjs --id <id> --dir <artifact>/<id>` (GIF ghép LPC nam / nữ, trang xoay). Duyệt bằng mắt theo phiếu "Tiêu chí duyệt".
7. **Nhập:** `node tools/assets/phuthe-import.mjs --id <id> --dir <artifact>/<id> --anchor <artifact>/<id>/anchor.json` (chạy lại không đổi), rồi `npm run check`. Còn khối chặn thì **không nhập** (võ hồn giữ nhánh cũ), ghi `NGUON.md`.

## Nhập riêng từng hướng (khi một tờ bị chặn sau 3 lượt)
Chủ repo cho phép (2026-10-28): tờ hướng còn chặn sau 3 lượt **không kéo cả võ hồn về nhánh cũ**; nhập các hướng đã qua kiểm, hướng còn lại dùng phụ thể tĩnh cũ. Chỉ dùng khi đã hết 3 lượt cho tờ đó và orchestrator duyệt xem trước các hướng đạt; võ hồn đủ 5 tờ không chặn vẫn nhập đủ như bước 7.
1. **Cắt:** như bước 5 nhưng chỉ `--sheet` cho các tờ đạt và thêm `--partial` (tờ thiếu là `info` `thieu-huong`, không chặn; không có `--partial` thì thiếu tờ vẫn là chặn, thoát mã 1). `_report.json` có `dirs` (`s` … `n` = `ok` / `thieu`), `manifest-entry.json` có `anim.dirsOk` (theo thứ tự `s, se, e, ne, n`) khi chưa đủ 5 hướng. Tờ đã đưa vào mà còn khung rỗng vẫn là lỗi: hướng đạt phải đủ khung.
2. **Neo:** bước 6 như cũ; `phuthe-anchor.mjs --source anim --dir <artifact>/<id>` đọc `dirsOk` trong `manifest-entry.json` và ghi neo đơn vị cho hướng chưa nhập (client không dùng).
3. **Nhập:** bước 7 như cũ. Manifest ghi `anim.dirsOk`; `NGUON.md` của võ hồn (hoặc `--nguon <file>`) được ghi khối "Hướng đã nhập" (đã nhập / CHƯA nhập từng hướng; chạy lại không đổi). `npm run check` (`validate.mjs`) kiểm `dirsOk`: không rỗng, không đủ 5, không trùng, đúng thứ tự.
4. **Client:** hướng đạt chạy hoạt ảnh vẽ thật; hướng chưa nhập dùng phụ thể tĩnh cũ `vh_<id>` cho riêng hướng đó (cả khung phụ thể, không neo, chuyển động như cũ). Tây (`sw`, `w`, `nw`) lật hướng đông tương ứng nên chỉ có hoạt ảnh khi `se`, `e`, `ne` tương ứng đã nhập. Manifest không có `dirsOk` (5 võ hồn đã nhập đủ) giữ nguyên hành vi.
5. **Bổ sung sau:** khi vẽ lại hướng còn thiếu, cắt lại với đủ tờ đạt (hoặc thêm hướng vào danh sách) và nhập lại: mục manifest đổi `dirsOk`; đủ 5 hướng thì trường bị bỏ, NGUON ghi "Đủ 5 hướng". Ghi vào `NGUON.md` khối nào chặn và lý do.

## Bài học Tà Hỏa (đã vào `lessons.md`, đọc trước khi sinh)
- **Nộm trôi / thu nhỏ / dời xuống:** model hay vẽ nộm nhỏ hơn bảng và dời xuống, cutter đăng ký nộm được vài ô, ráp lệch. Vạch tham chiếu giúp, nhưng vẫn soát; thấy nộm thu nhỏ ở tờ liên hệ thì vẽ lại lượt sau, đừng cố cứu bằng neo.
- **Hình dính, hàng `attack` / `cast` dính:** hai hàng này có pose rộng nhất, dễ chạm ô bên cạnh (tờ B, C của Tà Hỏa bị chặn `hinh-dinh` / `so-hinh`). Đòi vẽ hơi nhỏ hơn và chừa khoảng trống magenta; tờ chặn thì vẽ lại **chỉ tờ đó**.
- **Hướng nhìn sai:** `ne` / `n` lộ mặt, cast cuối quay chính diện: chỉ khai bằng mắt trong `NGUON.md` (`--eye` chưa có trong CLI), không sinh riêng để sửa mặt.
- **Nguyên con chim sau người:** vẽ chi thể gắn ngực / lưng, không vẽ cả con vật (đã có bài học `@B`).
- **Tham chiếu hỏng:** tờ chặn không bao giờ làm ảnh tham chiếu; chọn tờ A (hoặc D) không chặn làm ảnh 3.
- Lượt hỏng cho bài học mới: thêm vào `lessons.md` (một nguồn), không viết tay vào prompt.

## Chia lô cho worker Codex
Mỗi **lô 3 võ hồn** = một worker Codex = một PR (`Part of #1025`): 3 × 5 tờ, mỗi tờ tối đa 3 lượt (tối đa 45 lượt ảnh/lô, thường ít hơn). Worker làm trọn bước 1–6 cho từng võ hồn; nhập game (bước 7) khi orchestrator đã duyệt xem trước. Sinh vật trước, vật cứng sau (nhóm B → C → A); một lúc chỉ giao lô kế khi lô trước đã qua duyệt để bài học dồn vào `lessons.md`.

| Lô | Võ hồn | Nhóm / khung | Ghi chú |
|---|---|---|---|
| 1 | `bang_phuong_hoang`, `kim_vu_mieu_ung`, `u_minh_linh_mieu` | B 96 | cánh (cùng họ Tà Hỏa) + tai / đuôi / vuốt |
| 2 | `yeu_ho`, `liet_hoa_thuong_lang`, `bach_ho` | B 96 | khuôn tai + đuôi + vuốt |
| 3 | `nhu_cot_tho`, `bich_lan_xa_hoang`, `lam_dien_ba_vuong_long` | B 96 | rắn quấn tay, đầu rồng: có thể cần hai tờ |
| 4 | `tu_vong_chu_hoang`, `lam_ngan_thao`, `a_ngan` | B 128 / C 96 | chân nhện khung 128; dây / cỏ |
| 5 | `ky_nhung_thong_thien_cuc`, `hoa_long`, `hoa_anh` | C 128 / 96 | hoa khung 128; lửa, bóng |
| 6 | `quy_mi`, `cuu_tinh_that_sat_kiem`, `nguyet_nhan` | C / A 96 | hư ảnh khó nhất; hai vũ khí cầm tay |
| 7 | `pha_hon_thuong`, `hao_thien_chuy`, `xuc_xich` | A 128 / 96 | vật cầm, ít pose |
| 8 | `thien_can_bach_ngoc_dinh`, `cuu_bao_luu_ly_thap`, `can_khon_hon_nguyen_toa` | A 96 / 128 | vật lơ lửng quanh người; `cuu_bao_luu_ly_thap` **chờ concept được duyệt** (hiện chỉ có `candidates/`, NGUON ghi CHẶN mắt): chưa giao, không dùng ảnh `candidates/` làm tham chiếu; `--concept-ref` báo lỗi với tháp tới khi có concept |

Lô 1 là **mẫu**: chủ repo duyệt lô 1 rồi mới mở các lô sau. Quá 3 lượt ở một khối thì dừng, báo orchestrator (skill `beast-anim`, "Quá 3 lượt").
