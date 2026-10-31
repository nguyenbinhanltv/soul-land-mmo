# Chân dung hai thợ may — #1494

- Ngày sinh: 31/10/2026. Công cụ: Codex builtin OpenAI `image_gen.imagegen`. Công cụ không trả model ID hoặc seed.
- Điều khoản: đầu ra OpenAI; không gán CC0. Prompt tự viết, không có ảnh đầu vào bên thứ ba. Đối chiếu phong cách bộ 18 NPC của repo bằng mắt.
- Mỗi ảnh là lượt 1/3. RAW sao chép nguyên byte từ kết quả công cụ; không resize hoặc chỉnh RAW.
- Chủ repo đã duyệt hai chân dung trước nhập; xác nhận tại cuộc trò chuyện phiên soul_land_game-914.

| Key dự kiến | RAW | Native size | SHA256 RAW | Prompt |
|---|---|---|---|---|
| npc_tho_may | tho_may.raw.png | 1254×1254 | d4d4137862144c4d3f8439f9f8555acc1b4916514d4d45987a25c03eedea15e9 | tho_may.prompt.txt |
| npc_tho_may_thien_dau | tho_may_thien_dau.raw.png | 1254×1254 | b0c3e003136cffca89b2a01f5535a90042d571c0995d0e052018d6f0e81739ed | tho_may_thien_dau.prompt.txt |

## Nhập thử ngoài repo

`node tools/assets/gemini-import.mjs --kind portrait --size 112 --grid 1x1 --names <id> --palette auto-item --colors 32 --logo off --opaque --out <tmp> <id>.raw.png`

Chế độ opaque giữ nền tối và không xóa nhầm tóc navy. Bản thử Nặc Đinh 32 màu; Thiên Đấu 30 màu. Không thay đổi checker. Đăng ký manifest và ghi công bằng validate.mjs; dữ liệu ghi công sinh lại bằng credits.mjs sau merge origin/main.

## Ngoại hình

Đối chiếu `NPCS`, `presetToLpc`: nữ bím dài một bên, hairCol 2 → light_brown, outfitCol 2 → forest; nam mái lệch che một mắt, hairCol 4 → navy, outfitCol 4 → white; skin 0 → light.
