# Chân dung hai thợ may — #1494

- Ngày sinh: 31/10/2026. Công cụ: Codex builtin OpenAI `image_gen.imagegen`. Công cụ không trả model ID hoặc seed.
- Điều khoản: đầu ra OpenAI; không gán CC0. Prompt tự viết, không có ảnh đầu vào bên thứ ba. Đối chiếu phong cách bộ 18 NPC của repo bằng mắt.
- Mỗi ảnh là lượt 1/3. RAW sao chép nguyên byte từ kết quả công cụ; không resize hoặc chỉnh RAW.
- Chủ repo đã duyệt hai chân dung trước nhập; xác nhận tại cuộc trò chuyện phiên soul_land_game-914.

| Key | RAW | Native size | SHA256 RAW | Prompt |
|---|---|---|---|---|
| npc_tho_may | tho_may.raw.png | 1254×1254 | d4d4137862144c4d3f8439f9f8555acc1b4916514d4d45987a25c03eedea15e9 | tho_may.prompt.txt |
| npc_tho_may_thien_dau | tho_may_thien_dau.raw.png | 1254×1254 | b0c3e003136cffca89b2a01f5535a90042d571c0995d0e052018d6f0e81739ed | tho_may_thien_dau.prompt.txt |

## Nhập bằng công cụ chuẩn

`node tools/assets/gemini-import.mjs --kind portrait --size 112 --grid 1x1 --names <id> --palette auto-item --colors 32 --logo off --opaque --out <tmp> <id>.raw.png`

Chế độ opaque giữ nền tối và không xóa nhầm tóc navy. Bản thử Nặc Đinh 32 màu; Thiên Đấu 30 màu. Không thay đổi checker. Đăng ký manifest và ghi công bằng validate.mjs; dữ liệu ghi công sinh lại bằng credits.mjs sau merge origin/main.

Đầu ra: `shared/assets/sprites/iso/npc/<id>.png`. Đăng ký từng ảnh bằng `node tools/assets/validate.mjs --register npc_<id> --iso --keep-order --tool "ChatGPT / Codex builtin OpenAI image_gen" --prompt "Chân dung thợ may <id>; prompt thật: art/src/npc-portraits/1494/<id>.prompt.txt" --note "RAW, native size và SHA256 tại NGUON.md; đầu ra OpenAI, không gán CC0"`.

## Đối chiếu trong game

Ngày 01/11/2026, Chrome `--mute-audio`, server RAM riêng `GAME_TEST=1`, hộp thoại thật do server cho phép tại Nặc Đinh Thành và Thiên Đấu Thành. Bản trước mô phỏng manifest cũ bằng cách bỏ riêng hai key mới khỏi phản hồi manifest; không sửa UI hoặc ảnh. Bản sau tải hai PNG 112×112 thành công, rõ mặt và không cắt tóc. Ảnh trước/sau tại `art/preview/npc-1494/`. Cảnh báo JSON ở lượt tải không ngăn mở hội thoại hoặc tải chân dung; không thay đổi mã game trong issue này.

## Ngoại hình

Đối chiếu `NPCS`, `presetToLpc`: nữ bím dài một bên, hairCol 2 → light_brown, outfitCol 2 → forest; nam mái lệch che một mắt, hairCol 4 → navy, outfitCol 4 → white; skin 0 → light.
