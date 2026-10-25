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
| Q22 | 2026-10-24 | **Ngoại lệ PixelLab** (gói Tier 1 mua lại): chỉ cho xoay hướng, hoạt ảnh nhiều hướng, hoạt ảnh / sheet hiệu ứng kỹ năng, pháp tướng; không tạo hình nhân vật; ảnh tĩnh vẫn ComfyUI / Gemini | #477, #482, #541 | `docs/art/nguon-giay-phep.md`, `docs/art/phap-tuong.md` |
| Q23 | 2026-10-24 | Nguồn LPC / OpenGameArt kết hợp cho hiệu ứng và chuyển động phụ, để tiết kiệm lượt PixelLab; vật phẩm / hiệu ứng LPC do chủ repo duyệt từng ảnh | #201, #482, #490 | `docs/art/phap-tuong.md` |
| Q24 | 2026-10-24 | H1 duyệt công thức chuẩn làm pháp tướng (một võ hồn, tham số PixelLab, hậu kỳ `phaptuong.mjs`) | #485 | `docs/art/phap-tuong-cong-thuc.md` |
| Q25 | 2026-10-24 | Danh mục LPC `LPC_PARTS` và 4 hướng cho hồn sư Tự tạo (L0 mẫu thử, chủ repo duyệt 4 hướng) | #507, #508 | `docs/art/hon-su-lpc.md` |
| Q26 | 2026-10-25 | S2 duyệt công thức chuẩn làm hiệu ứng chiêu (11 chiêu Lam Điện Bá Vương Long + Hạo Thiên Chùy, sheet PixelLab `/v2/vfx`) | #548 | `docs/art/ky-nang-cong-thuc.md` |
| Q27 | 2026-10-25 | Họ asset **C1–C16** (cảm giác đánh, giao diện, trang phục LPC phương Đông, âm thanh tuyệt kỹ CC0, màn đăng nhập / tải, HUD …) do **Codex (tthoadev)** làm: vẽ bằng code + sinh ảnh model + hậu kỳ pixel; ComfyUI là công cụ của orchestrator cho ảnh tĩnh khi cần; C2–C6 chỉ mở sau duyệt preview C1 | #541, #553, #554, #595, #616 | `docs/art/nguon-giay-phep.md`, `docs/design/giao-dien.md` |
| Q34 | 2026-10-25 | Asset ngoài lấy từ **mọi nguồn** (kể cả gói hỗ trợ AI), nhưng **chỉ tìm và dùng asset miễn phí**, áp cho **cả hình ảnh lẫn âm thanh**; không đề xuất hay mua gói trả phí. Asset săn được **không** chuyển cho task C của tthoadev (C1–C16 vẫn do Codex sinh). Mở rộng Q05 | #622 | `docs/art/nguon-giay-phep.md` |
| Q35 | 2026-10-25 | Gói asset có giấy phép hạn chế (Gigapack, cây rừng …) nằm ở **kho riêng** `soul-land-assets-private`; repo game chỉ giữ mô tả, manifest, CREDITS, công cụ nhập; CI release kéo kho vào image; không có kho thì game vẫn chạy bằng hình cũ; cấm đưa gói đó vào AI; có màn Ghi công trong game | #622, #623, #629 | `docs/asset-rieng.md` |
| Q36 | 2026-10-25 | Nhạc nền là **nhạc tu tiên tự sáng tác** (`compose.mjs`, ngũ cung, soundfont miễn phí): mỗi bản đồ một bản + lớp giao chiến (#643); âm nền môi trường CC0 (#644); âm thanh khác theo Q34 | #622, #643, #644 | `docs/art/am-thanh.md` |
| Q37 | 2026-10-25 | **Bỏ hẳn** các gói công trình Japanese, Chinese roof, Isometric houses: chưa từng đưa vào game (chỉ thử ở nhánh, không có PR) | #622 | `docs/asset-rieng.md` |
| Q41 | 2026-10-25 | Đợt 2: gỡ `fx_bao_truoc` (dấu "!" của Gigapack) (#641); **không duyệt** vòng trận pháp, lửa lam, ngọn lửa lam ở đợt 2A (#639) | #622, #639, #641 | `docs/asset-rieng.md` |

## Quy trình, CI, triển khai

| Mã | Ngày | Quyết định | Issue / PR | File thiết kế |
|---|---|---|---|---|
| Q28 | 2026-10-21 (g) | Mọi việc đi qua issue GitHub; chỉ nhận `san-sang`; PR nháp ngay với `Closes #N` + nhãn `agent:<tên>`; PR của collaborator do orchestrator kiểm tra lại rồi merge, collaborator **không tự merge**; làm liên tục 24/7 theo `docs/lam-viec-lien-tuc.md` | #123, #128 | `CONTRIBUTING.md`, `docs/lam-viec-lien-tuc.md` |
| Q29 | 2026-10-22 (g) | CI (`check.yml`) **chỉ để tham khảo**, không là status check bắt buộc trong ruleset `main`; reviewer đọc kết quả CI thay vì tự chạy bot RAM | #171, #182 | `CONTRIBUTING.md` |
| Q30 | 2026-10-22 (g) | Luật chơi đổi thì chờ chủ repo chốt; triage phản hồi chơi thử không tự sửa `GAME_DESIGN.md` | — | skill `playtest-triage` |
| Q31 | 2026-10-24 (g) | Triển khai: không staging, chỉ prod `soulland.oleqima.com` (một bản, `Recreate`); merge `main` **không** tự deploy; `Promote` do chủ repo chạy tay, chủ repo duyệt PR ở repo GitOps, ArgoCD sync; không chạy bot / đo tải vào DB prod | #500, #504, #406 | `docs/deploy.md`, `CONTRIBUTING.md` |
| Q32 | 2026-10-25 | **Tối ưu tài liệu (#619)**: (1) tách `GAME_DESIGN.md` thành nhiều file, file gốc còn mục lục + tóm tắt + luật chung; (2) toàn bộ tài liệu tiếng Việt; (3) số issue gom về cuối mỗi file + `docs/quyet-dinh.md`; (4) thêm tóm tắt tiếng Anh (bản tóm tắt tiếng Anh `OVERVIEW` (thư mục docs, nhánh en) + đoạn đầu README); (5) triển khai sau khi xong các việc đang chạy | #619 | `GAME_DESIGN.md` (mục lục) |
| Q38 | 2026-10-25 | Phương án **A1** cho tài liệu: tạo 3 file mới (`docs/design/trang-thai-buff.md`, `docs/design/ban-do-khu-vuc.md`, `docs/art/hon-su-lpc.md`) + gộp các file `docs/tech` nhỏ; tách `GAME_DESIGN.md` giữ nguyên tiêu đề mục đánh số `### 5.x` vì code trích (#636, #637); `docs-check` trong `npm run check` ở mức **cảnh báo** (#640); PR chỉ sửa `.md` thì CI ở mức bỏ qua | #619, #636, #637, #640 | `CONTRIBUTING.md` |
| Q39 | 2026-10-25 | **Supabase là DB test**: `DATABASE_URL` trỏ Supabase được dùng cho quay ảnh, đo FPS; prod là PostgreSQL trong cụm K8s, **không trỏ**; bot đầy đủ và migration mới vẫn chạy `bot:local` | memory | `docs/deploy.md`, `docs/tech/du-lieu-db.md` |
| Q40 | 2026-10-25 | **C7 HUD gọn** (#592 / PR #618) được merge khi giao diện **điện thoại** chưa đạt: giao diện điện thoại **chưa cần** ở giai đoạn này | #592, #618 | `docs/design/giao-dien.md` |

## Việc đang chờ chủ repo

| Mã | Ngày ghi | Nội dung | File |
|---|---|---|---|
| P1 | 2026-10-25 | Bảng số trang bị hồn sư ghi "chờ người dùng duyệt" dù E1–E7 đã merge, E7 "không đổi số"; chưa có ghi nhận đã duyệt. Nếu đã duyệt thì thêm Q mới và xoá các câu chờ | `docs/design/trang-bi.md`, `docs/trang-bi-kinh-te.md` |
| P3 | 2026-10-25 | Ngoại lệ PixelLab (Q22): ảnh tĩnh concept pháp tướng có được tính vào ngoại lệ không; chốt một câu dùng ở mọi nơi | `docs/art/phap-tuong.md` |
| P4 | 2026-10-25 | `EQUIP_LUCK_UP` (khắc may mắn bằng Thần Hồn) ghi "đề xuất, chờ duyệt", chưa có code: làm hay bỏ | `docs/design/trang-bi.md` |
| P5 | 2026-10-25 | Trần số người khi tính máu boss: hiện không có trần; xem lại nếu phòng đông (`ROADMAP.md` mục 8) | `ROADMAP.md` |
| P6 | 2026-10-25 | Chủ nhân và tên hồn kỹ trong truyện của 6 võ hồn: giữ mở (`ROADMAP.md` mục 8) | `ROADMAP.md` |
| P7 | 2026-10-25 | C2–C6 ghi "chỉ mở sau duyệt preview C1" nhưng C2, C3, C6 đã merge: ghi ngày duyệt C1 vào Q27 | `docs/design/giao-dien.md` |
| P8 | 2026-10-25 | Ảnh sinh model được dùng công cụ nào (E6 biểu tượng trang bị làm bằng ChatGPT; quy tắc cũ ngày 2026-10-24: chỉ Gemini; #616: Codex): chủ repo chốt rồi ghi vào Q27 | `docs/art/nguon-giay-phep.md` |

P2 (NV0 chờ duyệt bố cục) đã đóng: NV0 đến NV5 xong, ghi ở Q13.

## Quyết định chỉ có trong bộ nhớ của orchestrator

Bốn quyết định ở bộ nhớ phiên điều phối (M2, M3 đã có bản ghi trong repo ở Q39, Q28); chủ repo xác nhận rồi chuyển hẳn vào bảng trên:

| Mã | Nội dung | Gợi ý |
|---|---|---|
| M1 | Ảnh người dùng tự tạo trên Gemini web theo bộ prompt, **chỉ Gemini** (2026-10-24) | Lệch với P8; chốt P8 trước |
| M2 | `DATABASE_URL` = Supabase DB test (2026-10-25) | Đã ghi ở Q39 |
| M3 | Orchestrator được push, mở PR, merge `main` sau khi review đạt (PR collaborator: sau khi họ tự review và orchestrator kiểm lại) | Gần như đã ở Q28 |
| M4 | Phiên song song: số worker theo RAM + ổ C, tối đa 2 bot cùng lúc, tắt đúng PID, Chrome luôn `--mute-audio`, cổng CDP 9333 đã có người dùng | Là vận hành, đề xuất đưa vào tài liệu chạy local, không phải quyết định sản phẩm |
