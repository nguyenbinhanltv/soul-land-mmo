# Công thức chuẩn làm pháp tướng (H1 #485, chủ repo duyệt 2026-10-24)

Chuẩn cho 25 võ hồn (đã làm: Lam Điện Bá Vương Long và Hạo Thiên Chùy). Đặc tả hình, màu, prompt từng võ hồn ở `docs/phap-tuong.md` (PR #492); quy ước chung ở `GAME_DESIGN.md` mục 5.18. Ở đây ghi cách làm, tham số, lượt thực tế và bẫy đã gặp.

## 1. Quy trình một võ hồn

| Bước | Lệnh | Ra file (`art/src/pixellab/phap_tuong/<mã>/`) |
|---|---|---|
| 1. Concept hướng s | `node tools/assets/pixellab-pt.mjs concept --id <mã> --desc "<prompt>" --seed N` | `concept.png` |
| 2. Xoay 8 hướng, lấy 5 | `node tools/assets/pixellab-pt.mjs rot --id <mã> --desc "<mô tả ngắn>"` | `rot/0..7.png`, `s`, `se`, `e`, `ne`, `n` `.png` |
| 3a. Hoạt ảnh bằng PixelLab (sinh vật) | `pixellab-pt.mjs anim --id <mã> --dir <hướng> --anim idle\|attack --action "<chuyển động>"` (5 hướng × 2) | `<hướng>_idle_00..07.png`, `<hướng>_attack_00..07.png` |
| 3b. Hoạt ảnh bằng code (vật cứng) | không gọi PixelLab; ghi `"code": ["idle","attack"]` trong `recipe.json` | (không có) |
| 4. Ghi `recipe.json` | tay: prompt, seed, lượt, `display` (scale, dx, dy, back / front, frontAlpha, ghost) | `recipe.json` |
| 5. Hậu kỳ + sheet | `node tools/assets/phaptuong.mjs --id <mã> --preview <ảnh xem>` | `shared/assets/sprites/phaptuong/<mã>.png` (2560×800) |
| 6. Đăng ký | `node tools/assets/validate.mjs --register pt_<mã> --iso --tool "..." --prompt "..." --note "..."` | manifest (kèm `pt` lấy từ `display`), `art/CREDITS.md` |
| 7. Kiểm | `npm run check` (validate: đủ 80 khung, không chạm mép, ≤ 48 màu, alpha 0 / 255) | |

Key PixelLab đọc từ file (`PIXELLAB_KEY_FILE`, mặc định `~/.config/pixellab/api-key.txt`), không in, không ghi vào repo, log hay PR. Mỗi lệnh `pixellab-pt.mjs` in `usage` của lệnh và số dư trước / sau (số dư cập nhật trễ vài giây, nên cộng theo `usage` rồi đối chiếu số dư cuối).

## 2. Tham số PixelLab (đã dùng ở H1)

- **Concept**: `POST /v2/create-image-pixflux`, `image_size` 128×128, `no_background` true, `view` "low top-down", `direction` "south", `outline` "single color black outline", `shading` "medium shading", `detail` "medium detail", `text_guidance_scale` 8, `seed` ghi trong recipe (Rồng 11, Búa 5). Prompt = dòng của võ hồn ở `docs/phap-tuong.md` mục 5 đã rút gọn: vật chính, hình dáng, màu, "isometric game sprite" (Rồng: "giant spectral azure thunder dragon coiling, horned head raised, crackling blue lightning on scales, translucent ghost-like energy, deep blue and cyan, isometric game sprite"; Búa: "giant black war hammer with huge square head and long handle, dark veins, gray glow, heavy and powerful, glowing runes, isometric game sprite, single object"). Ảnh ra đã gần đúng; "spectral / translucent" trong prompt không làm ảnh trong suốt, hư ảnh làm ở hậu kỳ.
- **Xoay**: `POST /v2/generate-8-rotations-v3` với `first_frame` = concept, `description` ngắn, `no_background` true. Trả 8 ảnh theo thứ tự **sw, s, se, e, ne, n, nw, w** (chỉ số 0–7); lấy chỉ số 1, 2, 3, 4, 5 cho s, se, e, ne, n. Hình nhất quán giữa các hướng (rồng giữ sừng, sét, thân), đủ dùng không cần sửa.
- **Hoạt ảnh**: `POST /v2/animate-with-text-v3`, `first_frame` = ảnh hướng, `frame_count` 8 (trả 9 khung gồm khung đầu), `no_background` true, seed ngẫu nhiên. Dùng khung 0–7, bỏ khung 8 (trùng khung 0, vòng lặp liền). Action mẫu:
  - thở: "dragon breathing gently, body slowly rising and falling, tail swaying, lightning crackling along the scales, looping idle";
  - đánh: "dragon rears back then lunges forward roaring with wide open mouth, lightning flashing brightly across the whole body, then settles back".
  Thay "dragon" bằng sinh vật của võ hồn; đặc điểm sáng / hạt (sét, lửa) đưa vào câu để nó chuyển động.
- Lệnh nền chạy 130–190 giây mỗi hoạt ảnh; chạy tuần tự (song song thì hàng đợi chậm hơn, không nhanh hơn). Một lô 10 hoạt ảnh mất ~25 phút.

## 3. Lượt thực tế (H1: số dư 1934,2 → 1906,2 = 28 lượt)

| Bước | Rồng (Lam Điện) | Búa (Hạo Thiên Chùy) | Ghi chú |
|---|---|---|---|
| Concept (1 ảnh) | 1 | 1 | |
| Xoay 8 hướng | 2 | 2 | |
| Thở × 5 hướng | 10 (2 mỗi hướng) | 0 (code) | |
| Đánh × 5 hướng | 10 | 0 (code) | |
| Thử đánh PixelLab (hỏng) | | 2 | xem mục 4 |
| **Tổng** | **23** | **3 dùng + 2 thử = 5** | |

Ước tính cho 23 võ hồn còn lại: **sinh vật / hình thú ≈ 23 lượt** (nhóm S, B, T, D: rồng, rắn, chim, thú, nhện, bóng); **vật cứng ≈ 3 lượt** (nhóm V, O, P: kiếm, búa, tháp, đỉnh, thương, xích, hoa). Nhóm theo `docs/phap-tuong.md` mục 4.2. Làm cả bộ ≈ 12 võ hồn sinh vật × 23 + 11 vật cứng × 3 ≈ **310 lượt** (thấp hơn ước tính 750 ở #482). Muốn đẹp hơn có thể làm thêm 1 concept dự phòng (+1 lượt) rồi chọn.

## 4. Thở / đánh bằng code cho võ hồn dạng vật (búa)

`phaptuong.mjs --code idle,attack` biến ảnh tĩnh `<hướng>.png` (128×128, đệm 16 điểm mỗi phía) thành 8 + 8 khung, láng giềng gần nhất (pixel không mờ):

- **idle (vòng thở)**: nhấp nhô ±2 điểm, xoay ±1,2° quanh gốc cán (64, 118), sáng ±12% theo nhịp, 8 khung một chu kỳ.
- **attack**: ngả ra sau (xoay 5° → 9° quanh (64, 110), nhấc không quá 1 điểm), nện xuống (−8° và dịch xuống 4 điểm), nảy lại rồi nghỉ; từ khung nện có **vết nứt** (hai đường 1 điểm viền `#1a1020` dưới đáy dài dần) và **bụi** (14 điểm xám sáng bay lên, mờ dần). Hạt dùng bộ sinh số có seed nên chạy lại ra cùng ảnh.
- **Giới hạn chiều cao**: khung 160 chỉ chừa **124 điểm phía trên gốc** (kể cả viền sáng 2 điểm). Vật cao ~110 điểm như búa chỉ còn ~12 điểm để nhấc và xoay; nhấc hơn thì hình bị cắt (validate báo "chạm mép"). Vật thấp hơn thì nhấc cao được; nếu vẫn cần nhấc nhiều, thu nhỏ ảnh nguồn trước.
- Đổi nhịp / biên độ: sửa `ATK_POSE` và `codeIdle` trong `phaptuong.mjs`, chạy lại cho mọi vật cứng để đồng nhất.

**Vì sao không để PixelLab làm búa đánh:** thử `animate-with-text-v3` ("giant hammer lifts up high then slams down...") ở hướng s tốn 2 lượt và ra búa đổ nằm ngang, không quay về tư thế đầu (`art/src/pixellab/phap_tuong/hao_thien_chuy/thu_danh_pixellab_hong.png`). Vật cứng không có cơ thể để mô hình hiểu chuyển động: dùng code. Sinh vật (rồng) thì PixelLab làm tốt, gồm cả khung gầm và sét lóe.

## 5. Hậu kỳ và ghép vào hồn sư (`phaptuong.mjs`)

- Khung 160×160, gốc **(80, 124)** trùng chân hồn sư (32, 58) của khung 64×64. Mỗi hướng lấy **hộp bao hợp của cả 16 khung** (idle + attack) rồi đặt sao cho giữa-đáy hộp trùng gốc, nên pháp tướng không nhảy vị trí giữa thở và đánh.
- Bỏ điểm alpha ≤ 40, còn lại đục 255. **Độ đục hư ảnh do client áp lúc vẽ** (`pt.ghost` 0,88 ở lớp sau; nhân thêm `frontAlpha` 0,7 ở lớp trước), vì sheet chỉ cho alpha 0 / 255.
- Viền sáng 2 điểm màu `col` của võ hồn (`VOHON`) quanh hình (điểm ngoài dithering); cả sheet giảm còn **48 màu** (median cut, giữ viền `#1a1020` và màu viền sáng); bảng màu riêng từng võ hồn.
- Hướng sw / w / nw lật từ se / e / ne (client).
- **Lớp (H1 chốt): một lớp cho cả khung ở mỗi hướng**, không tách phần sau / phần ló trước trong một khung: `s, se, e` vẽ SAU thân hồn sư; `ne, n` vẽ TRƯỚC thân hồn sư, mờ 70% (`display.back` / `display.front`, `frontAlpha`). Cùng luật cho mọi nhóm (rồng, búa...). Luật này **thay** cách tả lớp theo nhóm ở bản đặc tả H0 đầu (`docs/phap-tuong.md` mục 2 và "hai lớp" ở `GAME_DESIGN.md` 5.18; đã sửa trong PR #492). Bảng nhóm V / S / P / B / T / O / D ở mục 2 đó chỉ còn là gợi ý điểm gắn (dx, dy, tỉ lệ).
- `display.scale`, `dx`, `dy` (px, quanh gốc, sau lưng hồn sư): Rồng 1,0 / 0 / 0; Búa 0,85 / +12 / −4 (vác sau vai phải). Chỉnh khi thấy che hồn sư; ghi vào `recipe.json` rồi đăng ký lại (manifest lấy `pt` từ đó).
- Hồn sư thử ghép: m_0 / f_0 của repo (tóc lam), xem trang xem trước H1.

## 6. Bẫy đã gặp

- Số dư `/v2/balance` cập nhật trễ vài giây: chênh trước / sau một lệnh có thể báo 0; lấy `usage.generations` của lệnh làm chuẩn.
- 8 ảnh xoay không ghi nhãn hướng; thứ tự sw, s, se, e, ne, n, nw, w đã đối chiếu bằng mắt trên rồng (s nhìn thẳng, n thấy lưng). Vật không có mặt trước / sau (búa) cũng theo cùng thứ tự.
- Một số khung "đánh" của rồng sáng trắng hoặc tối hẳn (sét lóe, đầu há); chấp nhận được ở cỡ game, nhưng nên xem từng hướng trước khi chốt.
- Bảng màu chung của game không chứa màu PixelLab: pháp tướng dùng bảng riêng ≤ 48 màu (như chân dung), không đưa qua `normalize` / `pack`.
- Nền trong suốt chỉ do `no_background` của PixelLab; nếu khung nguồn có điểm nền mờ sót, tăng `PT_ALPHA_MIN` trong `tools/assets/lib.mjs`.

## 6b. Vật thể (khí võ hồn): `phaptuong-khi.mjs` (H3 lô P4, 7 võ hồn)

Thay cho `phaptuong.mjs --code` ở nhóm kiếm, tháp, đỉnh, thương, vành, tỏa, xúc xích. Chạy `node tools/assets/phaptuong-khi.mjs --id <mã>` (dựng `<mã>.png` + `<mã>_glow.png`) và `--id <mã> --check` (đo khung bao / neo 5 hướng lệch ≤ 2 điểm, lề). Tham số ở `recipe.json`: `mode` ("dat" neo giữa-đáy, "troi" neo trọng tâm + `lift`), `prescale`, `nghieng`, `clean` (`minComp`, `xa`, `markMax`, `catDe`, `nhuom`, `thanToi`), `chuyenDong` (`idle`, `attack.poses` 8 khung `[độ xoay, tiến, nâng, co ngang, co dọc, sáng, dải sáng]`, `hit`, `vet`, `vong`, `hat`, `dau`, `xich`, `hao`).
- Làm sạch: alpha nhị phân, bỏ thành phần rời, lấp lỗ, bỏ đế đá / lửa quanh thân, viền #1a1020 1 điểm, nén ≤ 48 màu.
- Lớp sáng: viền dithering theo nhịp, hạt theo hệ, dấu nhận diện nháy, vòng sóng lúc ra đòn; alpha 0 / 255.
- **Lượt thực tế lô P4: 35** (17 concept gồm 10 lần thử lại, 9 lần xoay × 2, hoạt ảnh 0). Concept đầu thường cần thử lại 1–3 lần cho vật có đế / lửa / mặt (thêm "no ground, no base, no face, no fire" vào prompt). Bài học: thứ tự 8 ảnh xoay của vật có mặt trước (tỏa) và vật mỏng (vành) không theo sw, s, se...; chọn bằng mắt rồi ghi `xoay.dung` trong recipe.

## 7. Việc chưa làm (H2 trở đi)

Client chưa tải sheet `pt_*` (`sprites.ts` bỏ qua key isometric ngoài hs / vh / beast / fx); H2 thêm hệ thống hình thái (đổi lớp, chuỗi biến hình 5 bước, tan), đọc `pt` từ manifest. Normal map (`_n.png`) chưa làm.
