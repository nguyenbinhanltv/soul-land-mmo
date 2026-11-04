# Cử chỉ NPC râu / tóc dài — lô 3, #1552

Hai pose: Lão Kiệt Khắc (`lao_kiet_khac`) và Thợ rèn Thiên Đấu (`lo_ren_thien_dau`). Dùng cùng nhịp gật đầu 480 ms của #1557; pose xuất hiện từ 100–320 ms rồi về idle. Không dùng cắt đầu ngang hàng 29 cho hai bộ này.

Mỗi thư mục có `nguon.json`: prompt nguyên văn, SHA256 RAW và sheet LPC gốc, cách tạo ảnh dẫn, stencil theo ba hướng xuống / ngang / lên. Model ID và seed không được công cụ trả về. RAW giữ nguyên byte ngoài repo ở đường dẫn đã ghi; bản năm hướng đầu của Lão Kiệt Khắc sai hướng nên bị loại.

## Tái dựng

`node tools/assets/npc-reply-import.mjs --id <mã> --raw <RAW ngoài repo> --out <thư mục tạm> --install`

Công cụ kiểm hash trước khi ghi, cắt ba nhân vật theo alpha, thu nearest và đưa màu đầu về bảng LPC gốc. Giữ stencil đầu cùng toàn bộ râu / tóc đuôi, hạ một điểm ảnh; chỉ vùng hợp stencil cũ/mới được đổi. Những điểm vừa lộ ở cổ lấy màu áo từ pose, ép về bảng áo gốc. Thân, tay, chân ngoài stencil lấy nguyên byte idle. Các hướng chéo dùng cùng pose ngang như sheet LPC gốc. Đầu ra là dải 320×64 (5 khung 64×64, s/se/e/ne/n), gốc (32,58), tại `shared/assets/sprites/iso/npc-reply/`; manifest được công cụ đăng ký, không sửa tay.

Kiểm: `node --test tools/assets/npc-reply.test.mjs`; `NPC_REPLY_ID` / `NPC_REPLY_MAP` với `npm run test:npc-reply-browser --prefix client` để kiểm trên game thật. Ảnh trước/trong/sau và clip bàn giao trong artifacts phiên `soul_land_game-1055`, không nằm trong repo.

## Nguồn và giấy phép

Ảnh dẫn chỉ là các ô idle của hai sheet LPC của dự án. Toàn bộ ghi công các lớp và URL nguồn giữ tại `art/CREDITS.md`, mục `lao_kiet_khac (lpc-compose.mjs)` và `lo_ren_thien_dau (lpc-compose.mjs)`. Game dùng các lựa chọn OGA-BY 3.0 / CC-BY 3.0; râu `winter` của bluecarrot16 là CC0. Tóc `balding` của ElizaWy (OGA-BY 3.0); tóc `relm_ponytail` của JaidynReiman (OGA-BY 3.0+ / CC-BY 3.0+). Các lớp thân/áo/quần/giày và tác giả khác giữ nguyên ghi công LPC.

Codex builtin OpenAI `image_gen.imagegen` chỉnh pose từ ảnh dẫn LPC ngày 04/11/2026; phần đầu ra sinh dùng theo điều khoản OpenAI, không gán CC0 cho ảnh ghép và không bỏ nghĩa vụ ghi công LPC. Không dùng ảnh thương mại hoặc nguồn AI khác.
