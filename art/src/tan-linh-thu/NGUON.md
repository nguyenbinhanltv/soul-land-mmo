# Tán Linh Thụ — Tinh Đấu Ngoại vi, lô 1 #1664

Ảnh gốc: Codex builtin OpenAI `image_gen.imagegen`, ngày 03/11/2026. Không dùng ảnh thương mại hay gói asset ngoài. Sử dụng theo điều khoản đầu ra OpenAI; không gán CC0. Công cụ không trả model ID hoặc seed. Ảnh RAW và bản thử để ngoài repo; ảnh duyệt trước/sau ở artifacts phiên `soul_land_game-1024`.

Khóa `prop_tan_linh_thu`, file `shared/assets/sprites/iso/props/tan_linh_thu.png` và `tan_linh_thu_n.png`. Khung 96×64, chân `[48,62]`, hệ số nhập 0,6. Normal map sinh bằng `tools/assets/normal.mjs` (5 bit mỗi kênh). Nhập bằng `tools/assets/gemini-import.mjs --kind object`, bảng màu riêng gồm viền và đúng bảng rêu Ngoại vi; không thêm màu vào palette chung.

**Câu chuyện màu:** tán rêu trầm rậm ba sắc `#1e3a2e`, `#2f5a40`, `#4a7a50`; viền `#1a1020`; điểm linh khí thưa `#c8f07a` cùng màu đom đóm vùng. Ánh sáng vẽ sẵn từ trên trái, không vẽ quầng sáng hay bóng đổ vào sprite.

**Tích hợp:** gid 48, `gids.objects.vat_tan_linh_thu`, khai trong `gids.walk`. Chỉ thay lựa chọn trọng số 3 của `softSingles` ở Ngoại vi; nấm giữ trọng số 1, không đổi seed hay quy tắc chọn ô. Gid không có `collides`; không sửa server hoặc số cân bằng. Ảnh chưa được chủ repo duyệt; chỉ bàn giao PR nháp loại B, không tự gộp.

## Prompt tạo gốc (nguyên văn)

```text
Create ONE original game environment prop sprite: Tan Linh Thu, a dense low magical forest canopy shrub, traversable soft vegetation, for a muted moss-green isometric pixel art forest. Single isolated prop centered on transparent background, no text, no labels, no ground base, no shadow, no halo. Broad lush asymmetric rounded canopy with layered pointed leaves, tiny short hidden stems, silhouette wider than tall, viewed from above at 2:1 isometric angle. Crisp chunky deliberate pixel art, hard stepped pixel edges, no antialiasing, no gradients, no blur. Strict palette: outline #1a1020, foliage dark #1e3a2e, middle #2f5a40, light #4a7a50, only a FEW tiny magical flecks #c8f07a inside canopy. Three foliage shades only. Light from upper left. Dense enough to replace isolated trees visually while leaving path walkable. Entire prop visible with generous transparent margin, no other objects. Original art, no commercial references.
```

## Prompt sửa điểm sáng (nguyên văn)

```text
Edit this single isolated moss forest canopy sprite, preserve the exact overall silhouette and all leaves, dark outline and three green shades. Keep transparent background. The ONLY change: replace the three almost invisible tiny light green specks with THREE crisp compact square clusters of luminous leaf tips, each cluster about 40 by 25 native image pixels, color #c8f07a. Place at the same existing three speck locations inside foliage. No particles outside silhouette, no glow halo, no additional hues, no new objects, no text, no shadow, no ground base. Must remain dense muted isometric chunky pixel art with #1a1020 outline, #1e3a2e #2f5a40 #4a7a50 foliage.
```

Đầu vào sửa: bản pixel xem trước của lượt tạo gốc (khung 96×64, phóng nearest ×4 trên nền ô caro); lượt sửa yêu cầu trả nền trong suốt thật. Chọn ảnh sau sửa, đưa về pixel thật và ép lại đúng năm màu nêu trên; không dùng AI để tạo normal map.

## Đối chiếu SHA-256 và cách nhập

| File | Cỡ native | SHA-256 |
|---|---|---|
| RAW tạo gốc (`exec-ea44a49f-6530-4038-8200-b52ada90537c.png`, ngoài repo) | 1774×887 | `94bc002a184b3c9661f553806bbfd4053de71b0f804143fa2a609cada27aa37b` |
| RAW sửa điểm sáng, bản chọn (`exec-f2c55729-b374-4b9b-9be1-2bd5a0b9ada3.png`, ngoài repo) | 1507×1044 | `e07bf74a1f2ae0e066118adf651ab681ebe89156e5a5eb355c45d67e53421b38` |
| `tan_linh_thu.png` | 96×64 | `cd46199cec41b351090f37976fb6cb1520e80eb5cfca0599468bc3dcca1347a6` |
| `tan_linh_thu_n.png` | 96×64 | `f75f789d2b91e520b99a7e0887ac21fd65de5da327d80b1d64f4ba3c399a9464` |

Ảnh tạo gốc nhập thử bằng `--cell 12 --scale 0.6`, điểm sáng mất khi thu; bản chọn nhập bằng `--cell 8 --scale 0.6`. Bảng GPL tạm chỉ gồm đúng năm màu của câu chuyện màu ở trên. Lệnh (đường dẫn RAW / output / palette để ngoài repo):

```sh
node tools/assets/gemini-import.mjs --kind object --out <tmp> --names tan_linh_thu --grid 1x1 --size 96x64 --cell 8 --scale 0.6 --palette <palette.gpl> --preview 4 <raw-da-chon.png>
node tools/assets/normal.mjs shared/assets/sprites/iso/props/tan_linh_thu.png
```

Màu và alpha đã ép về pixel thật (alpha 0/255). Bản dựng lô này có 3.349 ô gid 48; lưới va chạm trước/sau khớp đủ 43.350 ô, nền và object giữ nguyên. Các lựa chọn trang trí mềm có thể đổi giữa nấm / tán khi trọng số được áp cho gid mới; không đổi ô đi được hoặc số hồn thú.
