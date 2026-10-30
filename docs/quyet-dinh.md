# Nhật ký quyết định của chủ repo

Mỗi dòng một quyết định: `ngày | quyết định (luật hiện hành) | issue / PR | file thiết kế`. Quyết định bị thay thì **không xoá**, ghi "Đã thay bởi Qnn". Ngày có **(g)** là ngày commit đầu tiên ghi câu đó (tài liệu không ghi ngày), có thể chậm hơn ngày quyết định thật. Luật chơi chi tiết nằm ở `GAME_DESIGN.md` và `docs/design/`; ở đây chỉ ghi **vì sao và khi nào chốt**. Các luật quy trình nhiều người (nhãn, Project 3, đóng băng review, `Review: đạt` + SHA) giữ ở `CONTRIBUTING.md`.

Thêm quyết định mới: cộng mã `Q` kế tiếp ở cuối bảng đúng nhóm, không đánh số lại.

## Nền tảng và nguyên tắc

| Mã | Ngày | Quyết định | Issue / PR | File thiết kế |
|---|---|---|---|---|
| Q01 | 2026-10-19 (g) | Dự án phi thương mại, chỉ chơi cùng bạn bè; được dùng đúng tên nhân vật, võ hồn, hồn thú, địa danh trong truyện; không nạp tiền, không thể lực | 7fb4f0e0 | `GAME_DESIGN.md`, `docs/design/00-tong-quan.md` |
| Q02 | 2026-10-19 (g) | Thua không mất đồ (ngoại lệ có chủ đích: trang bị hồn sư nấc +13 → +15 khi cường hóa thất bại không dùng bùa); đội hình quan trọng hơn một võ hồn mạnh | — | `docs/design/01-luat-chung.md`, `docs/design/trang-bi.md` |
| Q03 | 2026-10-21 (g) | Không giao dịch giữa người chơi, không PvP ngoài rừng (chơi cùng nhau qua tổ đội và Đại Đấu Hồn Trường); ưu tiên máy tính nhưng mọi giao diện mới dùng được cả chuột lẫn chạm | #72 | `docs/design/01-luat-chung.md`, `docs/design/to-doi-pvp-dau-truong.md` |
| Q04 | 2026-10-21 (g) | Không dùng sprite, ảnh cắt hay hình vẽ lại sát nét từ game thương mại, phim, truyện tranh chính thức; chỉ tham khảo ý tưởng | — | `docs/art/nguon-giay-phep.md` |
| Q05 | 2026-10-22 | Asset ngoài được dùng **mọi giấy phép đã biết** (CC0, CC-BY, CC-BY-SA, OGA-BY, CC-BY-NC, GPL, OFL) vì fan game phi thương mại; ghi từng file ở `art/CREDITS.md`, gắn cờ SA / GPL / NC; không dùng asset không rõ giấy phép | 46d06fcf, #186 | `docs/art/nguon-giay-phep.md` |
| Q33 | 2026-10-21 (g) | Luật tài liệu: `GAME_DESIGN.md` mô tả luật hiện hành, không viết nhật ký; số cân bằng chỉ ở `shared/data.ts`, tài liệu trỏ tên hằng | #72 | `CLAUDE.md`, `GAME_DESIGN.md` |

## Luật chơi

| Mã | Ngày | Quyết định | Issue / PR | File thiết kế |
|---|---|---|---|---|
| Q06 | 2026-10-21 | Giai đoạn 11: di chuyển (chạy / đi bộ, A*), bản đồ lớn gấp ×8 diện tích, truyền tống trận, đồng bộ theo vùng gần | #106–#110 | `docs/design/the-gioi-ban-do.md`, `docs/tech/dong-bo-state.md` |
| Q07 | 2026-10-22 | Tự săn chạy ở server với hiệu suất 100% (tối đa bằng tự đánh), tối đa 12 giờ treo mỗi ngày; trần tốc độ `AUTO_PACE` cùng mốc ủy thác offline | #155–#158 | `docs/design/tu-san-uy-thac.md` |
| Q08 | 2026-10-22 | Phạm vi tự săn mặc định "Toàn bản đồ"; tuỳ chọn "Chỉ quanh chỗ đứng" | #213 | `docs/design/tu-san-uy-thac.md` |
| Q09 | 2026-10-22 | Tự săn đánh cả tinh anh, thú vương, boss thế giới (ba công tắc, mặc định bật; chỉ nhắm con còn nhận được thưởng) | #218 | `docs/design/tu-san-uy-thac.md` |
| Q10 | 2026-10-22 | Tự bán từ xa khi túi gần đầy theo bộ lọc, **mặc định tắt**, 100% giá trong thành; mua lại món tự bán | #216 | `docs/design/kinh-te-tui-do.md` |
| Q11 | 2026-10-23 | Tên 6 bậc trang bị hồn sư (Phàm Khí … Đường Môn Chí Bảo) giữ cho tới khi chủ repo đổi | #410, #411 | `docs/design/trang-bi.md` |
| Q12 | 2026-10-23 | Đại Đấu Hồn Trường tính trang bị **đầy đủ**, không chuẩn hóa; `ARENA_HE_DMG` không đổi vì trang bị không đổi cán cân giữa các hệ | #411, #418 | `docs/trang-bi-kinh-te.md`, `docs/design/trang-bi.md` |
| Q13 | 2026-10-24 | Giao diện Nhân vật + Túi: hai cửa sổ cùng mở, búp bê 4 tab (Trang bị, Hồn cốt, Hồn hạch, Võ hồn); chỉ phía client; kéo thả, bấm đúp. Bố cục NV0 đã duyệt (NV1–NV5 làm tiếp được là dấu hiệu duyệt) | #453, #454 | `docs/design/giao-dien.md` |
| Q14 | 2026-10-24 | Đổi ngoại hình sau khi tạo chỉ qua **thợ may**; `LOOKS_CHANGE.free` lần đầu miễn phí, sau đó tốn Hồn Tệ; lần tạo đầu miễn phí, một lần | #511 | `docs/design/giao-dien.md`, `docs/art/hon-su-lpc.md` |
| Q15 | 2026-10-24 | Pháp tướng Võ Hồn Chân Thân cho cả 25 võ hồn: hồn sư giữ nguyên, hư ảnh võ hồn sau lưng, khung 160×160, 5 hướng + lật, hai hoạt ảnh (thở, đánh) | #482, #483 | `docs/art/phap-tuong.md`, `docs/design/ky-nang-combat-phap-tuong.md` |
| Q16 | 2026-10-25 | **Hồn sư = LPC** (Mẫu dựng sẵn LPC + Tự tạo, cả hai lưu `mode = lpc`); bỏ sprite preset PixelLab; tài khoản preset cũ tự chuyển sang LPC lúc nạp. Thay Q21 | #564, #565, #571–#573 | `docs/art/hon-su-lpc.md` |

## Nguồn ảnh và mỹ thuật

| Mã | Ngày | Quyết định | Issue / PR | File thiết kế |
|---|---|---|---|---|
| Q17 | 2026-10-21 (g) | Mọi ảnh đưa vào game phải được chủ repo duyệt (qua trang xem trước; mẫu đã duyệt làm chuẩn phong cách cho lô sau); ảnh thô để ngoài repo | #96 | `docs/art/nguon-giay-phep.md` |
| Q18 | 2026-10-21 (g) | Thú LPC (OpenGameArt) làm **hình tạm** cho hồn thú thường, từng loài do chủ repo duyệt; không dùng cho thú vương / boss thế giới. **Đã thay bởi Q20**; loài LPC đã gỡ hết | #125, #201 | `docs/art/nhan-vat-hon-thu.md` |
| Q19 | 2026-10-23 | **Bỏ PixelLab** (không làm ảnh mới, không gọi MCP, xoá key); ComfyUI tự host là công cụ chính cho ảnh tĩnh. **Điều chỉnh bởi Q22** | #331, #349 | `docs/art/nguon-giay-phep.md` |
| Q20 | 2026-10-23 | Hồn thú theo **kiểu lai**: ảnh tĩnh 3 hướng (nam, đông, bắc) bằng ComfyUI + chuyển động bằng code; hoạt ảnh 8 hướng bằng ComfyUI / ControlNet dừng (#335, #387 đóng) | #386, #395, #335, #387 | `docs/art/nhan-vat-hon-thu.md` |
| Q21 | 2026-10-21 (g) | LPC chỉ cho NPC phụ, dân thường, lính gác; **không** cho hồn sư người chơi. **Đã thay bởi Q16** | #96 | `docs/art/hon-su-lpc.md` |
| Q22 | 2026-10-24 | **Ngoại lệ PixelLab** (gói Tier 1 mua lại): chỉ cho xoay hướng, hoạt ảnh nhiều hướng, hoạt ảnh / sheet hiệu ứng kỹ năng, pháp tướng; không tạo hình nhân vật; ảnh tĩnh vẫn ComfyUI / Gemini. **Làm rõ bởi Q43** | #477, #482, #541 | `docs/art/nguon-giay-phep.md`, `docs/art/phap-tuong.md` |
| Q23 | 2026-10-24 | Nguồn LPC / OpenGameArt kết hợp cho hiệu ứng và chuyển động phụ, để tiết kiệm lượt PixelLab; vật phẩm / hiệu ứng LPC do chủ repo duyệt từng ảnh | #201, #482, #490 | `docs/art/phap-tuong.md` |
| Q24 | 2026-10-24 | H1 duyệt công thức chuẩn làm pháp tướng (một võ hồn, tham số PixelLab, hậu kỳ `phaptuong.mjs`) | #485 | `docs/art/phap-tuong-cong-thuc.md` |
| Q25 | 2026-10-24 | Danh mục LPC `LPC_PARTS` và 4 hướng cho hồn sư Tự tạo (L0 mẫu thử, chủ repo duyệt 4 hướng) | #507, #508 | `docs/art/hon-su-lpc.md` |
| Q26 | 2026-10-25 | S2 duyệt công thức chuẩn làm hiệu ứng chiêu (11 chiêu Lam Điện Bá Vương Long + Hạo Thiên Chùy, sheet PixelLab `/v2/vfx`) | #548 | `docs/art/ky-nang-cong-thuc.md` |
| Q27 | 2026-10-25 | Họ asset **C1–C16** (cảm giác đánh, giao diện, trang phục LPC phương Đông, âm thanh tuyệt kỹ CC0, màn đăng nhập / tải, HUD …) do **Codex (tthoadev)** làm: vẽ bằng code + sinh ảnh model + hậu kỳ pixel; ComfyUI là công cụ của orchestrator cho ảnh tĩnh khi cần; C2–C6 chỉ mở sau duyệt preview C1 (duyệt C1: không rõ ngày, trước 2026-10-25; chủ repo không nhớ ngày) | #541, #553, #554, #595, #616 | `docs/art/nguon-giay-phep.md`, `docs/design/giao-dien.md` |
| Q34 | 2026-10-25 | Asset ngoài lấy từ **mọi nguồn** (kể cả gói hỗ trợ AI), nhưng **chỉ tìm và dùng asset miễn phí**, áp cho **cả hình ảnh lẫn âm thanh**; không đề xuất hay mua gói trả phí. Asset săn được **không** chuyển cho task C của tthoadev (C1–C16 vẫn do Codex sinh). Mở rộng Q05 | #622 | `docs/art/nguon-giay-phep.md` |
| Q35 | 2026-10-25 | Gói asset có giấy phép hạn chế (Gigapack, cây rừng …) nằm ở **kho riêng** `soul-land-assets-private`; repo game chỉ giữ mô tả, manifest, CREDITS, công cụ nhập; CI release kéo kho vào image; không có kho thì game vẫn chạy bằng hình cũ; cấm đưa gói đó vào AI; có màn Ghi công trong game | #622, #623, #629 | `docs/asset-rieng.md` |
| Q36 | 2026-10-25 | Nhạc nền là **nhạc tu tiên tự sáng tác** (`compose.mjs`, ngũ cung, soundfont miễn phí): mỗi bản đồ một bản + lớp giao chiến (#643); âm nền môi trường CC0 (#644); âm thanh khác theo Q34 | #622, #643, #644 | `docs/art/am-thanh.md` |
| Q37 | 2026-10-25 | **Bỏ hẳn** các gói công trình Japanese, Chinese roof, Isometric houses: chưa từng đưa vào game (chỉ thử ở nhánh, không có PR) | #622 | `docs/asset-rieng.md` |
| Q41 | 2026-10-25 | Đợt 2: gỡ `fx_bao_truoc` (dấu "!" của Gigapack) (#641); **không duyệt** vòng trận pháp, lửa lam, ngọn lửa lam ở đợt 2A (#639) | #622, #639, #641 | `docs/asset-rieng.md` |
| Q42 | 2026-10-25 | **Bảng số trang bị hồn sư (E1–E7) đã được chủ repo duyệt**; bỏ các câu "chờ duyệt" / "ước lượng chưa duyệt" ở hai file trang bị; E7 không đổi số | #411 | `docs/trang-bi-kinh-te.md`, `docs/tech/trang-bi-cai-dat.md` |
| Q43 | 2026-10-25 | Ảnh **concept pháp tướng không thuộc ngoại lệ PixelLab**: PixelLab chỉ cho hoạt ảnh, sheet hiệu ứng, pháp tướng dạng hoạt ảnh và xoay hướng (làm rõ Q22); concept ảnh tĩnh làm bằng công cụ ảnh tĩnh (mục Q44); concept cũ đã có giữ nguyên ghi nguồn | #482, #541 | `docs/art/nguon-giay-phep.md`, `docs/art/phap-tuong.md` |
| Q44 | 2026-10-25 | **Ảnh sinh bằng model dùng ChatGPT và Codex** (họ C1–C16 vẫn Codex của tthoadev; biểu tượng trang bị E6 làm bằng ChatGPT); ComfyUI vẫn là công cụ ảnh tĩnh của orchestrator; ảnh Gemini cũ đã duyệt giữ nguyên ghi nguồn. Thay quy tắc cũ 2026-10-24 "chỉ Gemini" | #616 | `docs/art/nguon-giay-phep.md`, skill `asset-gen` |
| Q45 | 2026-10-25 | **Làm khắc may mắn bằng Thần Hồn** theo thiết kế sẵn có; bảng `EQUIP_LUCK_UP` coi như đã duyệt (chủ repo trả lời P4, phương án a); phần may mắn ở `docs/design/trang-bi.md` do việc #662 sửa cùng code | #662 | `docs/design/trang-bi.md` |
| Q53 | 2026-10-31 | Bản đồ thế giới mở bằng M dùng một tranh vẽ tay thủy mặc trên giấy cổ cùng kit Giấy / Mực, Codex sinh ảnh; không chữ trên nền, nút / nhãn / đường cổng phủ bằng code; bố cục theo dữ liệu thật, chừa lề và có JSON tọa độ chuẩn hóa. Ngoại lệ nền Giấy so với bảng thao tác Mực ở Q49 | #1415 | `docs/art/ban-do-the-gioi.md` |

## Quy trình, CI, triển khai

| Mã | Ngày | Quyết định | Issue / PR | File thiết kế |
|---|---|---|---|---|
| Q28 | 2026-10-21 (g) | Mọi việc đi qua issue GitHub; chỉ nhận `san-sang`; PR nháp ngay với `Closes #N` + nhãn `agent:<tên>`; PR của collaborator do orchestrator kiểm tra lại rồi merge, collaborator **không tự merge**; làm liên tục 24/7 theo `docs/lam-viec-lien-tuc.md` | #123, #128 | `CONTRIBUTING.md`, `docs/lam-viec-lien-tuc.md` |
| Q29 | 2026-10-22 (g) | CI (`check.yml`) **chỉ để tham khảo**, không là status check bắt buộc trong ruleset `main`; reviewer đọc kết quả CI thay vì tự chạy bot RAM | #171, #182 | `CONTRIBUTING.md` |
| Q30 | 2026-10-22 (g) | Luật chơi đổi thì chờ chủ repo chốt; triage phản hồi chơi thử không tự sửa `GAME_DESIGN.md` | — | skill `playtest-triage` |
| Q31 | 2026-10-24 (g) | Triển khai: không staging, chỉ prod `soulland.oleqima.com` (một bản, `Recreate`); merge `main` **không** tự deploy; `Promote` do chủ repo chạy tay, chủ repo duyệt PR ở repo GitOps, ArgoCD sync; không chạy bot / đo tải vào DB prod | #500, #504, #406 | `docs/ops/trien-khai.md`, `CONTRIBUTING.md` |
| Q32 | 2026-10-25 | **Tối ưu tài liệu (#619)**: (1) tách `GAME_DESIGN.md` thành nhiều file, file gốc còn mục lục + tóm tắt + luật chung; (2) toàn bộ tài liệu tiếng Việt; (3) số issue gom về cuối mỗi file + `docs/quyet-dinh.md`; (4) thêm tóm tắt tiếng Anh (bản tóm tắt tiếng Anh `OVERVIEW` (thư mục docs, nhánh en) + đoạn đầu README); (5) triển khai sau khi xong các việc đang chạy | #619 | `GAME_DESIGN.md` (mục lục) |
| Q38 | 2026-10-25 | Phương án **A1** cho tài liệu: tạo 3 file mới (`docs/design/trang-thai-buff.md`, `docs/design/ban-do-khu-vuc.md`, `docs/art/hon-su-lpc.md`) + gộp các file `docs/tech` nhỏ; tách `GAME_DESIGN.md` giữ nguyên tiêu đề mục đánh số `### 5.x` vì code trích (#636, #637); `docs-check` trong `npm run check` ở mức **cảnh báo** (#640); PR chỉ sửa `.md` thì CI ở mức bỏ qua | #619, #636, #637, #640 | `CONTRIBUTING.md` |
| Q39 | 2026-10-25 | **Supabase là DB test**: `DATABASE_URL` trỏ Supabase được dùng cho quay ảnh, đo FPS; prod là PostgreSQL trong cụm K8s, **không trỏ**; bot đầy đủ và migration mới vẫn chạy `bot:local` | memory | `docs/ops/db-redis-sao-luu.md`, `docs/tech/du-lieu-db.md` |
| Q40 | 2026-10-25 | **C7 HUD gọn** (#592 / PR #618) được merge khi giao diện **điện thoại** chưa đạt: giao diện điện thoại **chưa cần** ở giai đoạn này | #592, #618 | `docs/design/giao-dien.md` |
| Q46 | 2026-10-24 | **Không dùng Sealed Secrets**: bốn Secret (`soul-land-postgres-auth`, `soul-land-redis-auth`, `soul-land-env`, `gcp-ar-creds`) chủ repo tạo tay trên cụm, ArgoCD không quản; `GOOGLE_TICKET_SECRET` đặt trong `soul-land-env` | #500, #504 | `docs/ops/gitops.md`, `docs/ops/sso-google.md` |
| Q47 | 2026-10-25 | **Bỏ toàn bộ NetworkPolicy**; PostgreSQL và Redis tự host trong cụm (Longhorn), CronJob sao lưu ra PVC | #500, #504 | `docs/ops/gitops.md`, `docs/ops/db-redis-sao-luu.md` |
| Q48 | 2026-10-25 | **Đăng nhập Google dùng project GCP riêng ngoài tổ chức, Audience External, đã publish**: project cũ thuộc `oleqima.com` có màn đồng ý Internal nên chỉ tài khoản trong domain vào được; `sub` không đổi nên tài khoản đã liên kết vẫn dùng được | #612 | `docs/ops/sso-google.md` |
| Q49 | 2026-10-26 | **UI gốc (kit Mực + Giấy)** (chủ repo, "theo đề xuất", thân #877): hai chất liệu có luật (Mực tối cho bảng thao tác, Giấy cho nội dung đọc); chỉ PC (Q40) và thêm cỡ giao diện theo bậc ≥ 1600 / 1920; vùng bấm 32 px cho phần tử dày, 44 px cho nút hành động chính; kit 2× (chốt sau thử ở P0); icon hybrid (pilot 16 icon AI so với game-icons); gói ngoài miễn phí chỉ làm tham chiếu + lấp checkbox / slider / scrollbar; **dừng mở thêm** C10 / C11 / C13 / C14 / C15 tới sau cổng 2, C8 #692 chỉ sửa lỗi; UI mặc định duy nhất từ 29/10/2026 (cờ `ui2` chỉ còn trong mã, gỡ ở đợt 5b / 5c); giữ phông Galmuri 10 / 12 / 24; làm P0–P5 trước | #877 | `docs/art/ui-kit.md` |
| Q50 | 2026-10-26 | **Hoạt ảnh hồn thú v2** (chủ repo, thân #861): vẫn sinh ảnh H4 (#767–#781) song song; tờ B cỡ 1254×1254 hợp lệ (cỡ hợp lệ theo **tỉ lệ**, lệch cỡ không còn là LỖI); giữ hoạt ảnh `hurt` đầy đủ (sửa prompt cho lùi theo hướng); RAW vẫn trong git, xem lại sau đợt thử 3 loài; dự phòng theo hướng `anim.dirsOk` ưu tiên thấp | #861, #766 | `docs/art/hon-thu-hoat-anh.md` |
| Q51 | 2026-10-26 | **Kế hoạch di chuyển & giao chiến** (chủ repo duyệt, thân #746): đợt 1 M1, M2, M4 → M3; đợt 2 M5, M6; sau đó UI #732 U0–U5; **U6 điện thoại không làm, giữ Q40** | #746, #732 | `docs/design/giao-dien.md` |
| Q52 | 2026-10-28 | **Bảng Xếp Hạng, điểm danh / Phúc Lợi / Lịch** (chủ repo, "tất cả theo đề xuất", 5 câu #1191): (1) v1 thưởng hạng chỉ là danh hiệu hiển thị theo tuần, không thưởng vật phẩm / Hồn Tệ; (2) công khai đội hình 4 ô, mỗi ô chỉ mã võ hồn, cấp, sao; (3) chu kỳ điểm danh riêng mỗi tài khoản từ lần ký đầu, mốc 7 / 14 / 21 theo số thứ tự ô (ký bù ô 7 vẫn có mốc); (4) ký bù = lượt miễn phí mỗi chu kỳ + lượt trả Hồn Tệ lũy tiến, trần số ô ký bù do skill `balance-review` đề xuất, hằng ở `shared/data.ts`; (5) v1 Lịch chỉ liệt kê sự kiện đã có, GM đặt sự kiện tạm / nhân thưởng làm sau | #877, #1191 | `docs/design/xep-hang.md`, `docs/design/phuc-loi.md`, `docs/design/lich-hoat-dong.md` |

## Việc đang chờ chủ repo

| Mã | Ngày ghi | Nội dung | File |
|---|---|---|---|
| P5 | 2026-10-25 | Trần số người khi tính máu boss: hiện không có trần; xem lại nếu phòng đông (`ROADMAP.md` mục 8) | `ROADMAP.md` |
| P6 | 2026-10-25 | Chủ nhân và tên hồn kỹ trong truyện của 6 võ hồn: giữ mở (`ROADMAP.md` mục 8) | `ROADMAP.md` |
| P7 | 2026-10-26 | Cân bằng (mức C): Hồn Tệ cấp cao dư khi treo; Ủy Thác Lệnh quá rẻ (#907) | `docs/trang-bi-kinh-te.md` |
| P8 | 2026-10-26 | Cân bằng (mức C): `BEAST_COIN` bậc thang có vách đá ở 10.000 / 100.000 năm (#908) | `docs/trang-bi-kinh-te.md` |
| P9 | 2026-10-26 | Cân bằng (mức C): nhịp lên cấp, cần mục tiêu thời gian cấp 1 → 100 (#909) | `docs/trang-bi-kinh-te.md` |

P2 (NV0 chờ duyệt bố cục) đã đóng: NV0 đến NV5 xong, ghi ở Q13.

## Quyết định chỉ có trong bộ nhớ của orchestrator

Quyết định còn ở bộ nhớ phiên điều phối (M2 → Q39, M3 → Q28 đã chuyển hẳn vào bảng trên, không giữ lại ở đây); chủ repo xác nhận rồi chuyển phần còn lại:

| Mã | Nội dung | Gợi ý |
|---|---|---|
| M4 | Phiên song song: số worker theo RAM + ổ C, tối đa 2 bot cùng lúc, tắt đúng PID, Chrome luôn `--mute-audio`, cổng CDP 9333 đã có người dùng | Là vận hành, đề xuất đưa vào tài liệu chạy local, không phải quyết định sản phẩm |
