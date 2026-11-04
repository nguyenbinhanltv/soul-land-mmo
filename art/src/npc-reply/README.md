# Cử chỉ NPC bằng pose riêng — #1552

Hai pose: Lão Kiệt Khắc (`lao_kiet_khac`) và Thợ rèn Thiên Đấu (`lo_ren_thien_dau`). Dùng cùng nhịp gật đầu 480 ms của #1557; pose xuất hiện từ 100–320 ms rồi về idle. Không dùng cắt đầu ngang hàng 29 cho hai bộ này.

Mỗi thư mục có `nguon.json`: prompt nguyên văn, SHA256 RAW và sheet LPC gốc, cách tạo ảnh dẫn, stencil theo ba hướng xuống / ngang / lên. Model ID và seed không được công cụ trả về. RAW giữ nguyên byte ngoài repo ở đường dẫn đã ghi; bản năm hướng đầu của Lão Kiệt Khắc sai hướng nên bị loại.

## Tái dựng

`node tools/assets/npc-reply-import.mjs --id <mã> --raw <RAW ngoài repo> --out <thư mục tạm> --install`

Công cụ kiểm hash trước khi ghi, cắt ba nhân vật theo alpha, thu nearest và đưa màu đầu về bảng LPC gốc. Giữ stencil đầu cùng toàn bộ râu / tóc đuôi, hạ một điểm ảnh; chỉ vùng hợp stencil cũ/mới được đổi. Những điểm vừa lộ ở cổ lấy màu áo từ pose, ép về bảng áo gốc. Thân, tay, chân ngoài stencil lấy nguyên byte idle. Các hướng chéo dùng cùng pose ngang như sheet LPC gốc. Đầu ra là dải 320×64 (5 khung 64×64, s/se/e/ne/n), gốc (32,58), tại `shared/assets/sprites/iso/npc-reply/`; manifest được công cụ đăng ký, không sửa tay.

Kiểm: `node --test tools/assets/npc-reply.test.mjs`; `NPC_REPLY_ID` / `NPC_REPLY_MAP` với `npm run test:npc-reply-browser --prefix client` để kiểm trên game thật. Ảnh trước/trong/sau và clip bàn giao trong artifacts phiên `soul_land_game-1055`, không nằm trong repo.

## Nguồn và giấy phép

Ảnh dẫn chỉ là các ô idle của hai sheet LPC của dự án. Toàn bộ ghi công các lớp và URL nguồn giữ tại `art/CREDITS.md`, mục `lao_kiet_khac (lpc-compose.mjs)` và `lo_ren_thien_dau (lpc-compose.mjs)`. Game dùng các lựa chọn OGA-BY 3.0 / CC-BY 3.0; râu `winter` của bluecarrot16 là CC0. Tóc `balding` của ElizaWy (OGA-BY 3.0); tóc `relm_ponytail` của JaidynReiman (OGA-BY 3.0+ / CC-BY 3.0+). Các lớp thân/áo/quần/giày và tác giả khác giữ nguyên ghi công LPC.

Codex builtin OpenAI `image_gen.imagegen` chỉnh pose từ ảnh dẫn LPC ngày 04/11/2026; phần đầu ra sinh dùng theo điều khoản OpenAI, không gán CC0 cho ảnh ghép và không bỏ nghĩa vụ ghi công LPC. Không dùng ảnh thương mại hoặc nguồn AI khác.

## Lô 4: Triệu Vô Cực và hai thợ may (#1800)

Ba NPC `trieu_vo_cuc`, `tho_may`, `tho_may_thien_dau` giữ nguyên thân/idle từ `LpcRig`, không thêm sheet thân NPC và không đổi `looks`. Mỗi NPC có bộ LPC khác nhau. Xuất nguồn bằng `NPC_REPLY_SOURCE_ONLY=1`, `NPC_REPLY_ID`, `NPC_REPLY_MAP`, `NPC_REPLY_OUTPUT=<thư mục tạm>` rồi chạy `npm run test:npc-reply-browser --prefix client`. Harness chờ mọi lớp tải đủ, xuất các khung idle theo tên logic sang lưới 24×6 (rig thực tế dùng ba hàng vật lý) cùng metadata chuỗi LPC, lớp và giấy phép.

`idle.png` là bản ghép LPC đã xử lý để đối chiếu/tái dựng; `head-mask.png` là stencil đầu/mày/tóc/khăn/râu/mặt, trừ lớp che phía trước, thêm viền từ hình đầy đủ. Hai file này không được nạp vào client. RAW imagegen và ảnh dẫn phóng lớn vẫn ở ngoài repo theo Q17. `nguon.json` lưu prompt thật, hash RAW/idle/stencil/đầu ra và từng lớp LPC, chuỗi LPC, bảng ghi công nguyên văn của đúng món. Công cụ nhập kiểm hash, dùng stencil và giữ bảng màu nguồn; validator/quality kiểm theo bảng màu LPC gốc, không cho thêm màu tự do.

Importer ghi chuỗi LPC nguồn vào `replyLpc` của pose trong manifest; validator và bài kiểm thử đối chiếu với hồ sơ nguồn. Client tra đúng key theo mã NPC và chỉ dùng pose khi chuỗi này khớp, idle đã ghép và mọi lớp đều sẵn sàng, không đang tải lại. Bộ thiếu lớp, bộ khác ngoại hình hoặc thiếu pose giữ idle. Tải đủ lớp giữa cuộc hội thoại không tự phát cử chỉ; lần mở sau mới xét lại. Nhịp 480 ms và vòng đời hủy giống lô 3. Harness so idle runtime từng pixel với nguồn đã ghi, kiểm thêm thiếu lớp/ngoại hình khác khi texture cũ còn cache, và kiểm hủy giữa pose.

Cả ba ảnh ghép có lớp trang phục **CC-BY-SA 3.0** (hai thợ may còn có dép CC-BY-SA 3.0), nên các pose phái sinh giữ **CC-BY-SA 3.0**. Các lớp OGA-BY/CC-BY khác giữ nguyên nghĩa vụ ghi công. Tác giả, URL và lựa chọn giấy phép từng món ở `nguon.json` (dòng nguyên văn từ bảng LPC trong `art/CREDITS.md`); không gán CC0 cho ảnh ghép. Phần sinh/chỉnh bằng OpenAI không thay thế giấy phép của nguồn LPC. Ảnh/clip lô 4 ở artifacts `npc-reply-lo-4/index.html` của phiên `soul_land_game-1055`.

## Lô 5: ba NPC tông môn (#1804)

`su_gia_hao_thien`, `ninh_phong_tri`, `su_gia_lam_dien` dùng cùng quy trình xuất idle/stencil đủ lớp, Codex sinh riêng từng pose và nhập bằng `npc-reply-import.mjs --install`. Không thêm mã hiển thị hay chuỗi LPC vào JS; importer đăng ký `replyLpc` trong manifest để phép khớp nguồn của lô 4 bật pose. Harness kiểm cả ba NPC và so idle runtime với nguồn, tám hướng, hủy, Giảm chuyển động và fallback thiếu lớp/khác ngoại hình.

Cả ba pose phái sinh giữ **CC-BY-SA 3.0**: áo giao lĩnh của Sứ giả Hạo Thiên; tóc/áo/dép của Ninh Phong Trí; áo bào và khăn quàng của Sứ giả Lam Điện. Bảng ghi công từng lớp giữ nguyên trong hồ sơ, các lớp OGA-BY/CC-BY khác tiếp tục được ghi công. RAW và ảnh dẫn ngoài repo Q17; ảnh trước–sau/clip để duyệt ở artifacts `npc-reply-lo-5/index.html` của phiên `soul_land_game-1055`.

## Lô 6: ba NPC cuối (#1809)

`hai_ma_dau_la`, `ba_tai_tay`, `chu_giao_vu_hon_dien` dùng cùng quy trình xuất nguồn LpcRig đủ lớp, Codex sinh riêng và nhập bằng `npc-reply-import.mjs --install`. Hai NPC đầu ở Hải Thần Đảo; Chủ giáo ở Thiên Đấu Thành. Giữ nguyên idle, hướng, vòng đời hủy và fallback; chuỗi ngoại hình nằm trong manifest, không thêm mã hiển thị hay tăng mốc bundle.

Pose phái sinh giữ **CC-BY-SA 3.0** do áo/dép; Hải Mã Đấu La còn có tóc SA. Tóc bob của Ba Tái Tây là CC0 nhưng toàn bộ ảnh ghép vẫn giữ SA. Hồ sơ giữ ghi công từng lớp và prompt/hash RAW/nguồn/stencil/đầu ra; RAW và ảnh dẫn ngoài repo Q17. Ảnh trước–sau/clip ở artifacts `npc-reply-lo-6/index.html`, kèm bảng kiểm kê phủ đủ NPC có ngoại hình hiện tại trong NPCS (biển hiệu, dân thường/lính gác ngoài phạm vi).