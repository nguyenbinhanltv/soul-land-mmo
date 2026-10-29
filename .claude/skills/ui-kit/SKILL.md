---
name: ui-kit
description: Tờ kit của UI gốc (Mực + Giấy; #880, theo dõi #877), hai phần: SINH (spec theo tỉ lệ Codex, prompt tự sinh, checklist ui:check, bảng triệu chứng → sửa prompt, tối đa 3 lượt mỗi tờ) và DUYỆT / NHẬP (ui:check, tờ liên hệ, phiếu chặn / nhẹ, ui-sheet-cut, trang bộ component, nhập). Dùng khi sinh tờ BOARD / khung / nút / ô / thanh / icon / trang trí, soát tờ tthoadev nộp, cắt / nhập mảnh vào kit, sửa mẫu prompt hoặc bài học.
---

# UI gốc: tờ kit UI

Một skill hai phần để người sinh ảnh và người duyệt dùng **cùng một chuẩn** (cùng khung với `beast-anim`). Luật vẽ, chất liệu, token, 9-slice: `docs/art/ui-kit.md`; skill này là **thao tác**. UI gốc (chủ repo chốt, #877): hai chất liệu Mực / Giấy; chỉ PC; kit 2× chốt sau thử nghiệm; phông Galmuri 10 / 12 / 24.

| Việc | Công cụ |
|---|---|
| Sinh prompt + hướng dẫn | `npm run ui:prompt -- --kind BOARD\|F\|N\|O\|T\|I\|D [--material muc\|giay] [--style ngoc-kim\|thuy-mac\|hon-quang] (thử nghiệm, chờ duyệt BOARD) [--family "<họ icon>"] [--layout 6\|9] --out <thư mục>` (`--all` ra đủ 7 tệp) |
| Bài học (một nguồn) | `art/src/ui-kit/lessons.md` (parser `ui-sheet-lessons.mjs`) |
| Spec tờ (tỉ lệ, bố cục, tên mảnh, ngân sách) | `art/src/ui-kit/ui-kit.json` (`shapes`, `kinds`, `budget` là luật; `pieces` / `groups` do cutter ghi) |
| Kiểm tờ RAW | `npm run ui:check -- <tờ.png> [--kind …] [--out <thư mục>] [--palette art/palette.gpl]` |
| Cắt | `npm run ui:cut -- <tờ.png> --out <thư mục> [--write-manifest]`; `npm run ui:cut -- --budget` |
| Trang bộ component | `npm run ui:preview -- --dir <thư mục ui:cut> [--dir …] --out <thư mục>` (hoặc `--fixture c2,ui5`) |
| CI nhẹ | job `ui-sheet-check` (`tools/assets/ui-sheet-ci.mjs`) |

Mọi lệnh chỉ đọc RAW; không resize / sửa ảnh gốc; thư mục `--out` đặt **ngoài repo**; không ghi key / bí mật.

---

## Phần A — SINH (tthoadev / worker sinh ảnh)

### A1. Spec đầu vào (bảng tóm tắt; luật đầy đủ ở docs)
| Mục | Quy định |
|---|---|
| Cỡ ảnh | Theo **tỉ lệ**, không đòi pixel: 2:3 → 1024×1536; 1:1 → 1254² hoặc 1024²; 3:2 → 1536×1024. Codex `image_gen` không có ô chọn cỡ; cỡ nào hợp tỉ lệ (±1%) cũng nhận, cutter chuẩn hóa. |
| Nền | `#FF00FF` phẳng, dung sai khóa 60 (gradient nhẹ không phải lỗi); mảnh cách nhau ≥ 5% cạnh tờ, không sát mép, không đổ bóng / quầng ra nền. |
| Loại tờ | **BOARD** 3:2 hoặc 2:3 (1 ảnh, chỉ duyệt + tham chiếu, không cắt) · **F** khung 3:2 (6: 3 + 3) · **N** nút 3:2 (12: 5 + 5 + 2; chính / phụ × thường, hover, nhấn, tắt, chọn + 2 tab) · **O** ô 1:1 (12: 3 + 5 độ hiếm + 4 kỹ năng) · **T** thanh 3:2 (9) · **I** icon 1:1 (16, mỗi tờ một họ) · **D** trang trí 2:3 (6 hoặc 9). |
| Nội dung | Không chữ, số, logo. Trang trí chỉ ở bốn góc và giữa cạnh; thân cạnh phẳng 1–2 sắc; ruột đồng nhất; bảng màu ≤ 32 màu + viền `#1a1020`. |
| Tham chiếu | BOARD đã duyệt (phong cách) + swatch bảng màu + (tùy chọn) tờ cùng họ **đã đạt**. **Không** dùng tờ lỗi. |

### A2. Quy trình một tờ
1. `npm run ui:prompt -- --kind <loại> --out <thư mục>` → `<loại>.md` (bảng thông tin, thứ tự ảnh đính kèm, prompt tiếng Anh, chú thích). **Không viết / sửa tay** prompt: thiếu ý thì thêm một dòng vào `lessons.md` (cú pháp ở đầu file) hoặc sửa mẫu `ui-sheet-prompt.mjs`, chạy `node --test tools/assets/ui-kit-p2.test.mjs`, sinh lại.
2. Cuộc trò chuyện **mới** cho mỗi tờ; đính ảnh theo đúng thứ tự trong tệp; dán prompt; không chọn cỡ.
3. Lưu ảnh gốc **nguyên byte** vào `art/src/ui-kit/to<loại>.png` (BOARD: `BOARD.png`), kèm prompt thật đã gửi (`to<loại>.prompt.txt`). Tờ thứ hai cùng loại: `toF-2.png`.
4. **Checklist `ui:check`**: `npm run ui:check -- art/src/ui-kit/to<loại>.png --out <thư mục>`; mở `*-ui-lien-he.png` (xanh đạt, vàng nhẹ / cảnh báo, đỏ chặn). Phải sạch mục **chặn**: cỡ / tỉ lệ, nền, lưới, số mảnh (thiếu / thừa / dính), trạng thái đủ, viền ám hồng, cạnh không phẳng (khung), quá 40 màu.
5. **Bằng mắt** (công cụ không kiểm chắc): không chữ / ký tự (`chu-lac` chỉ cảnh báo), hoa văn không nằm dọc cạnh, đúng chất liệu (Mực / Giấy), trạng thái khác nhau được ở thang xám (nhất là ô kỹ năng khóa / sẵn sàng, độ hiếm không chỉ bằng màu).
6. PR: `Part of #<đợt>`; ghi nguồn / giấy phép ở `docs/art/nguon-giay-phep.md`; dòng `LỖI:` nháp của `ui:check` dán vào mô tả PR (soát lại bằng mắt). Không cắt, không sửa client.

### A3. Bảng triệu chứng → sửa prompt
| Triệu chứng (tờ liên hệ / lỗi) | Sửa lượt sau |
|---|---|
| `chu-lac`, hoặc thấy chữ / ký tự trong ruột | Thêm "empty flat fill, no letters, no glyphs, no squiggles" cho loại đó; thay "nhãn" bằng "empty bar"; kiểm prompt không tự mâu thuẫn (cấm chữ mà vẫn đòi "caption"). |
| `so-hinh` thiếu / thừa mảnh | Nhắc đúng số hàng và số mảnh mỗi hàng ("row 2: exactly 5 pieces"), "draw each piece once"; thừa mảnh rời thì thêm "no extra pieces, no sparkles". |
| `hinh-dinh`, `khoang-cach` | Thêm "at least five percent of the image width of empty magenta between pieces"; giảm kích cỡ từng mảnh ("pieces fill at most 70% of their cell"). |
| `cham-mep` | Thêm "keep every piece away from the image edge". |
| `nen`, `vien-hong` | Thêm "no shadow, no glow, no halo, no anti-aliased pink edge, flat solid #FF00FF"; bỏ chữ mô tả "glowing", "shiny". |
| `canh-phang` (khung / nút) | Thêm "the straight side is a flat band of one or two colours, no pattern along it; ornament only at corners and middle of each side". |
| `chia-9` (ruột lộ vệt) | Thêm "inside is a flat uniform fill, no vignette, no light spot, no motif". |
| `doi-xung` (bốn góc khác nhau) | Nhẹ: cutter dựng gương nên bỏ qua; nếu độ dày viền cũng lệch (`do-day`) thì "all four corners same size and border thickness". |
| `trang-thai-giong` (hover ≈ thường) | Nêu khác biệt cụ thể từng trạng thái: hover viền sáng hơn, nhấn tối + lún 1 điểm, tắt bạc màu phẳng, chọn viền ngọc. |
| `mau` / `ngoai-bang` (quá nhiều màu) | Thêm swatch bảng màu làm tham chiếu 2; "at most 32 colours, no gradients, no noise". |
| `do-day` (viền dày không đều giữa mảnh) | Đính tờ cùng họ đã đạt làm tham chiếu 3; "same outline weight in every piece". |
| Tờ phụ lệch phong cách so với tờ chuẩn | Đính tờ **đã đạt** cùng họ làm tham chiếu 3; không dùng tờ lỗi. |
| Cỡ 1024² / 1254², nền gradient nhẹ | Bỏ qua (công cụ xử lý). |

### A4. Giới hạn lượt
**Tối đa 3 lượt mỗi tờ**, mỗi lượt đổi **một** thứ. Chọn lượt có ít mục chặn / nhẹ nhất (số từ `ui:check`) rồi mắt. **Không** dùng tờ / ảnh lỗi làm tham chiếu cho lượt sau. Vẽ lại **chỉ tờ hỏng**, không cả kit.

**Quá 3 lượt:** dừng, nộp lượt tốt nhất kèm dòng `LỖI:` nháp, ghi tờ nào còn chặn ở PR / issue; orchestrator ghép tay một mảnh tốt từ các lượt hoặc xin chủ repo duyệt phương án khác. Không tạo prompt viết tay để "cố thêm".

---

## Phần B — DUYỆT / NHẬP (orchestrator)

Thứ tự: **ui:check → tờ liên hệ → phiếu chặn / nhẹ → ui-sheet-cut → trang bộ component → nhập**.

1. **Kiểm:** `npm run ui:check -- <tờ.png> --out <thư mục ngoài repo>`. CI (`ui-sheet-check`) chỉ chặn bốn nhóm: cỡ / tỉ lệ ngoài tập, nền ngoài dung sai, thiếu mảnh / mảnh dính / thiếu trạng thái, không dò được dải; còn lại ở bảng cảnh báo trong job summary.
2. **Tờ liên hệ:** mở `<tờ>-ui-lien-he.png` (≈ 1 phút / tờ). Xem bằng mắt chữ lạc, hoa văn sai chỗ, chất liệu, độ phân biệt trạng thái.
3. **Phiếu** theo từng mảnh (hoặc từng bộ trạng thái), mỗi mảnh một mức:
   - **Chặn** (không nhập mảnh / bộ đó): cỡ / nền / thiếu mảnh / dính; có chữ hoặc ký tự đọc được; viền hồng > 3%; khung co giãn có cạnh lộ hoa văn (`canh-phang` chặn); > 40 màu; trạng thái của một bộ không phân biệt được; sai chất liệu so với BOARD.
   - **Nhẹ** (nhập, ghi sổ): `cham-mep`, `khoang-cach`, `do-day` lệch ≤ 2 điểm, `doi-xung` (đã dựng gương), `chia-9` nhẹ, 33–40 màu, cỡ lạ đúng tỉ lệ.
   - **Đạt đẹp:** sạch cả `ui:check`, trang bộ component không lộ lỗi ở 3 nền, 3 cỡ khung, DPR 1 và 2.
   Mẫu comment một dòng: `nut_chinh: đạt` · `khung_giay_nho: nhẹ — chia-9 vệt sáng ở giữa` · `ky_nang: chặn — khóa ≈ sẵn sàng ở thang xám`.
4. **Cắt:** `npm run ui:cut -- <tờ.png> --out <thư mục ngoài repo>` (tờ có mục chặn thì cutter từ chối; tờ chỉ còn `vien-hong` / `canh-phang` sửa được bằng công cụ thì thêm `--soft`, mảnh còn chặn riêng thì `--skip <mảnh>` và đưa vào danh sách vẽ lại; bảng điều kiện ở `docs/art/ui-kit.md` "Cắt mềm"; `--no-mirror` cho mảnh vẽ tay không đối xứng; `--prefix` cho tờ icon để khóa không trùng). Hạ về master 2×, dựng gương, lượng tử, xuất 2× và 1×, vạch 9-slice đo từ ảnh và chung cho cả bộ trạng thái. Cắt lại cùng tờ phải ra đúng byte.
5. **Trang bộ component:** `npm run ui:preview -- --dir <thư mục ui:cut> --out <thư mục ngoài repo>`, mở `index.html`. Xem lần lượt: **B** mọi mảnh × 3 nền (mép hồng, răng cưa, quầng sáng ở nền trắng / sáng) × DPR 1 / 2; **C** 9-slice ở 200×60, 360×120, 520×320 (cạnh lặp, góc méo, khung quá nhỏ); **D** nút thật: rê chuột (hover), giữ chuột (nhấn), Tab (focus-visible), chọn, tắt; **E** chuỗi tiếng Việt đủ dấu ở 10 / 12 / 24 px (dấu bị cắt, chữ tràn). Ghi chú DPR: trang không ép được DPR của máy; "DPR 2" là ảnh 2× hiển thị nửa cỡ (đúng điểm khi máy DPR 2). Mở Chrome nếu cần chụp: `--mute-audio`, không cổng 9333, tắt đúng PID.
6. **Nhập:** kiểm ngân sách `npm run ui:cut -- --budget` (kit ≤ 250 KB, icon ≤ 150 KB, 2× và 1× tính riêng), `--write-manifest` ghi mảnh vào `art/src/ui-kit/ui-kit.json`. **Không** chép vào `shared/assets` trong PR tờ: nhập vào game (`ui:import`, token `--ui2-*`) là việc PR chuyển màn. Ghi nguồn ở `docs/art/nguon-giay-phep.md`, `npm run check`.

Chủ repo chỉ duyệt BOARD, mẫu đầu mỗi họ (khung, nút, ô, thanh, icon) và tranh chấp; còn lại orchestrator tự duyệt theo phiếu trên.

---

## Bài học mới
Lượt vẽ hỏng cho bài học mới thì thêm **một dòng** vào `art/src/ui-kit/lessons.md` (`- [phạm vi] câu tiếng Anh // ghi chú tiếng Việt`), chạy `node --test tools/assets/ui-kit-p2.test.mjs` rồi sinh lại prompt. Không đặt bài học ở issue, comment PR hay prompt viết tay.

## Kiểm sau khi sửa công cụ
`npm run check` + `npm run test:assets`; thử `npm run ui:prompt -- --all --out <thư mục>` và `npm run ui:preview -- --fixture c2,ui5 --out <thư mục>` (tờ giả lập từ 7 mảnh C2 + 6 khung UI-5 có sẵn, không phải ảnh model).
