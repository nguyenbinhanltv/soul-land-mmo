# Pháp tướng vẽ lại bằng Codex: danh sách và prompt (#1306, epic #1020)

Công cụ chuyển thể `tools/assets/phuthe-to-phaptuong.mjs` (`phap-tuong.md` mục 7) lấy phụ thể cũ làm pháp tướng. Võ hồn nào công cụ làm chưa ổn thì **vẽ lại bằng Codex** (chủ repo chốt 2026-10-29). File này là danh sách võ hồn cần vẽ lại, lý do, và prompt cho từng võ hồn. Worker Codex nhận việc theo danh sách; **công cụ và tài liệu này không tự sinh ảnh**. Phụ thể cũ chỉ làm tham chiếu hình mẫu; pháp tướng mới là **ảnh độc lập, không nộm, không thân người**.

## 1. Danh sách

Căn cứ: ảnh trong game của 3 mẫu (`art/preview/phaptuong-1306/`, PR #1309) và chạy thử công cụ trên cả 25 võ hồn (đều có clip `vhanim`, không bị cắt khỏi khung 160, ×1). Mức "nghi" là **dự đoán theo cùng nguyên nhân**, chưa có ảnh trong game; xác nhận bằng ảnh sau khi chủ repo duyệt 3 mẫu và chạy `--all --duyet-mau`, rồi mới giao.

| Mức | Võ hồn | Lý do |
|---|---|---|
| **Cần vẽ lại (đã thấy)** | Lam Ngân Thảo (`lam_ngan_thao`) | Chỗ rỗng hình người sâu và rộng, tự lấp ra "cột" tối lộ rõ ở hướng `e`, `n`; thân cây không có hình thật ở giữa |
| Nghi (hình mềm, ranh giới mờ, chỗ rỗng sâu: lấp không ra hình thật) | A Ngân (`a_ngan`), Kỳ Nhung Thông Thiên Cúc (`ky_nhung_thong_thien_cuc`), Hỏa Ảnh (`hoa_anh`), Quỷ Mị (`quy_mi`), Hỏa Long (`hoa_long`) | Cùng họ thực vật / hư ảnh / rồng quấn người: phần giữa thân là chỗ nộm đứng, công cụ chỉ nội suy màu quanh viền |
| Không vẽ lại, chỉnh `scale` | Phá Hồn Thương (`pha_hon_thuong`), Cửu Tinh Thất Sát Kiếm (`cuu_tinh_that_sat_kiem`) | Vũ khí mảnh, ít điểm ảnh (~1,3–1,5 nghìn điểm mỗi hướng) nên hơi nhỏ: tăng `scale` ở `PHAP_TUONG` trước; chỉ vẽ lại nếu vẫn quá nhỏ |

Những võ hồn còn lại: giữ bản chuyển thể trừ khi chủ repo duyệt mẫu và thấy hỏng.

### 1.1 Kết quả chạy công cụ trên 17 võ hồn còn lại (2026-10-31)

Chạy từng võ hồn từ phụ thể mới nhất (`vohonanim/<id>_{b,f}`), xem trong game (`?thu=phaptuong`, đủ 5 hướng, thở + đánh). **Đã nhập (vật cứng, không nộm): Cửu Tinh Thất Sát Kiếm, Nguyệt Nhận, Càn Khôn Hỗn Nguyên Tỏa, Cửu Bảo Lưu Ly Tháp, Phá Hồn Thương, Thiên Càn Bạch Ngọc Đỉnh.** `display` (`scale` · `dx` · `dy`) đã chỉnh trong game: Cửu Tinh 1,4 · 14 · −26; Nguyệt Nhận 1,3 · 0 · −22; Càn Khôn 1,3 · 0 · −26; Cửu Bảo 1 · 0 · −20; Phá Hồn Thương 1,4 · 12 · −16; Thiên Càn 1,2 · 0 · −22. Hạn chế: Thiên Càn có vài khung đánh hướng `s` bị khói cắt vuông ở mép khung nguồn; mảng trắng đặc thấy lúc thử là hiệu ứng khựng đòn của client (`flashHit` ở `phapTuong.ts`), không phải ảnh. Còn **11 võ hồn sinh vật / hư ảnh** công cụ làm chưa ổn: phụ thể cũ là hình bọc quanh nộm nên giữa thân vẫn còn cột tối hình người (hàng sọc), `--fill 24` không xóa được. Giao Codex vẽ lại theo mục 3 và 4; đã tự ghi mức:

| Mức | Võ hồn | Lý do (thấy trong game) |
|---|---|---|
| Nặng | Lam Điện Bá Vương Long (`lam_dien_ba_vuong_long`) | Cột tối hình người xếp tầng ở giữa thân rồng, lộ rõ ở mọi hướng; thân rồng không liền |
| Nặng | U Minh Linh Miêu (`u_minh_linh_mieu`) | Cột tối + khoảng rỗng giữa thân báo, hình thú vỡ ở các khung đánh |
| Nặng | Nhu Cốt Thố (`nhu_cot_tho`) | Ô tối chữ nhật lộ ở `s` / `se`; thân thỏ nhỏ, đứt ở khung đánh |
| Nặng | Kim Vũ Miêu Ưng (`kim_vu_mieu_ung`) | Cột tối giữa hai cánh, chim không có thân thật |
| Nặng | Yêu Hồ (`yeu_ho`) | Khối tối hình chữ nhật ở giữa, chỉ còn ba đuôi |
| Nặng | Xúc Xích (`xuc_xich`) | Hình không đọc ra xúc xích; hướng `n` còn nguyên khoảng rỗng hình người |
| Nặng | Liệt Hỏa Thương Lang (`liet_hoa_thuong_lang`) | Cột tối + mảnh lam lạc màu ở chân; sói không có thân liền |
| Nặng | Bạch Hổ (`bach_ho`) | Cột tối, hình hổ vỡ ở `e` / `ne` / `n` |
| Vừa | Bích Lân Xà Hoàng (`bich_lan_xa_hoang`) | Cột sọc tối giữa các vòng rắn; thân vòng ngoài còn đọc được |
| Vừa | Băng Phượng Hoàng (`bang_phuong_hoang`) | Cột sọc tối giữa hai cánh băng; cánh tốt |
| Nhẹ | Tử Vong Chu Hoàng (`tu_vong_chu_hoang`) | Thân nhện thật, tám chân tốt, chỉ còn cột sọc dưới bụng; ưu tiên cuối |

**Chạy lại lô 3 (2026-10-31, trên main sau #1432 / #1434):** nguồn `vohonanim` và công cụ không đổi nên Nhu Cốt Thố, Kim Vũ Miêu Ưng, Tử Vong Chu Hoàng, Bích Lân Xà Hoàng, Yêu Hồ, Xúc Xích, Bạch Hổ, Băng Phượng Hoàng cho sheet giống từng byte lần trước; thử thêm `--fill 24` cho cả tám vẫn còn cột tối. **Không nhập võ hồn nào trong tám**, cả tám giao Codex vẽ lại (cùng Lam Điện, U Minh, Liệt Hỏa Thương Lang ở bảng trên; Lam Điện và Liệt Hỏa do phiên 885 đang vẽ).

Hạo Thiên Chùy: sheet đang có sinh lại từ `vohonanim` hiện tại cho kết quả giống từng byte (vũ khí cầm tay v2 ở atlas riêng, không đổi nguồn pháp tướng), và đã xem lại trong game nên giữ nguyên.

## 2. Quy cách ảnh giao

- **Thành phẩm cuối** là sheet `pt_<id>`: khung 160×160, **16 cột × 5 hàng** (2560×800), hàng = hướng `s`, `se`, `e`, `ne`, `n`, cột 0–7 "thở", 8–15 "đánh" (`phap-tuong.md` mục 2, `PT_*` ở `shared/data.ts`). Gốc chân khung ở `(80, 124)`; hình cao 60–120 điểm trên gốc, chừa lề 2 điểm; **không chạm mép trên / trái / phải**. `sw`, `w`, `nw` lật gương từ `se`, `e`, `ne` (không vẽ).
- **Cách sinh:** model không ghép nổi sheet 2560×800, nên sinh **mỗi hướng một tờ** ảnh vuông 1:1 (1024×1024), lưới **4 × 4 ô** (ô 256×256): hàng 1–2 = 8 khung "thở", hàng 3–4 = 8 khung "đánh", đọc từ trái sang phải, trên xuống dưới. Nền phẳng **`#FF00FF`** (cutter khóa nền, dung sai 60). **Không chữ, không khung, không số ô, không nộm / thân người / mặt người** trong ảnh. Cùng một hình, cùng đường chân và cùng cỡ ở mọi ô và mọi hướng (khác nhau chỉ ở pose / hướng nhìn).
- **Hướng nhìn** (mọi hướng nghiêng nhìn sang **phải**): `s` nhìn thẳng về người xem; `se` chếch phải-xuống; `e` ngang phải; `ne` chếch phải-lên (thấy nhiều lưng); `n` quay lưng. Luật lớp do client (s/se/e vẽ sau thân; ne/n trước thân, mờ 70%), nên **ne/n phải đọc được khi mờ**: hình lớn, ít chi tiết nhỏ.
- **Thở (8 khung, vòng lặp):** biên độ nhỏ (1–2 điểm nhấp nhô, hình không đổi dáng); khung 0 = tư thế gốc, khung 7 liền khung 0. **Đánh (8 khung):** gồng / lùi (khung 0–2), ra đòn mạnh nhất ở khung 3–4 (hình bung xa nhất, giữ khung 4), thu về (5–7, khung 7 ≈ khung 0). Chuyển động theo hướng đòn của hướng đó.
- **Việc của code, không vẽ vào ảnh:** hào quang, hạt, khói, lửa rời, glow, vòng pháp trận (`pt_<id>_glow` dựng bằng `phuthe-to-phaptuong.mjs --glow`). Ảnh chỉ có hình đặc, viền `#1a1020` 1 điểm, 3 tông mỗi vùng màu.
- **Tham chiếu:** ảnh dẫn số 1 = sheet phụ thể cũ của chính võ hồn (`shared/assets/sprites/vohonanim/<id>_{b,f}.png`, chỉ để lấy **hình mẫu, màu, motif**, **không chép bố cục, không chép chỗ rỗng hình người**); số 2 (nếu có) = tờ hướng đã được duyệt của chính võ hồn. Không dùng ảnh hỏng làm tham chiếu. Quy tắc 3 lượt mỗi tờ, chỉ đổi một thứ mỗi lượt, rà điều cấm: `vo-hon-phong-cach.md` phần 6.1.
- **Sau khi sinh:** lưu RAW nguyên byte ở `art/src/phap-tuong/<id>/` kèm `*.prompt.txt` và `NGUON.md`. Mẫu Lam Ngân Thảo dùng `node tools/assets/phaptuong-sheet-cut.mjs art/src/phap-tuong/lam_ngan_thao shared/assets/sprites/phaptuong/lam_ngan_thao.png`: năm tờ `s.png`, `se.png`, `e.png`, `ne.png`, `n.png`, kiểm mép ô rồi bỏ phiếu màu về khung 160. **Bộ lọc viền hồng hiện chỉ dành Lam Ngân Thảo**, không dùng cho võ hồn có thân tím / đỏ. Chủ repo duyệt bằng ảnh trong game trên PR trước khi merge; mẫu chưa đạt động tác giữ PR nháp, không tự vượt ba lượt.

## 3. Mẫu prompt

Ghép theo thứ tự: **STYLE + NEGATIVE** nguyên văn từ `vo-hon-phong-cach.md` mục 6 (đổi dòng "Transparent background" thành nền `#FF00FF`), rồi **SPIRIT** của võ hồn (mục 4 dưới đây), rồi **SHEET**. Khối SHEET dùng chung (thay `<DIR>` = `south` / `south-east` / `east` / `north-east` / `north`, `<DIR_NOTE>`, `<NAME>`):

```
SHEET: One square 1:1 image, a 4x4 grid of 16 equal square cells (no visible grid lines, no cell numbers, no text).
Flat solid #FF00FF magenta background in every cell. In EVERY cell draw the SAME single colossal spirit apparition
(<NAME>), alone, with NO human figure, NO mannequin, NO face of a person, NO ground plane, NO cast shadow.
The spirit hangs in the air as if floating behind someone's back, centered horizontally, resting on the same baseline
in every cell (feet / roots / lowest point at the same height), same scale in every cell, fully inside its cell with a margin.
View: isometric 3/4 view from above, spirit seen from the <DIR> direction. <DIR_NOTE>
Rows 1-2 (8 cells, left to right, top to bottom): a gentle idle "breathing" loop. Cell 1 is the neutral pose; the shape
only bobs and sways by 1-2 pixels, never changes silhouette; cell 8 flows back into cell 1.
Rows 3-4 (8 cells): one attack motion toward the viewer-facing direction of this view. Cells 9-11 wind up (pull back, coil,
gather); cell 12-13 strike (the pose reaching furthest, cell 13 holds it); cells 14-16 recover back to the neutral pose.
Solid opaque body, hard-edged pixels only, dark outline #1a1020 1 px, no glow blur, no particles, no smoke, no sparks.
Use the attached old sprite sheet ONLY as a reference for shape, colors and motifs; do NOT copy its human-shaped empty gap
or its composition; the spirit must be one complete, self-contained figure.
```

`<DIR_NOTE>`: `south` = "facing straight toward the viewer"; `south-east` = "turned right-and-toward the viewer"; `east` = "side view facing right"; `north-east` = "turned right-and-away, mostly the back is visible"; `north` = "seen from behind, back toward the viewer". Hạo Thiên Chùy và các vật cứng không thuộc danh sách này.

## 4. SPIRIT của từng võ hồn

Nguồn ngoại hình duy nhất là `vo-hon-phong-cach.md` mục 4 (đã dịch gọn dưới đây, giữ mã màu `col` / `robe` của `VOHON`).

**Lam Ngân Thảo** (`lam_ngan_thao`, `col #4ab0ff`, `robe #1f4a6b`; cần vẽ lại) — hành động đánh: dây cỏ vươn ra quất và quấn về phía trước.
```
SPIRIT: "Blue-Silver Grass", a grass-of-the-lowest-rank turned into a heaven-defying ancient tree. A thick twisted
trunk of grass, coiled like a rope (the trunk is SOLID and fully drawn in the middle, no hollow, no gap), many long
whip-like vines radiating outward and drooping to both sides, tips sharp like spear heads. Colors: deep blue (#1f4a6b)
for the body, bright blue (#4ab0ff) for highlights, dark green-black in the trunk, white on the vine tips.
Motifs (only these three): twisting dao-rune veins running along the vines, a thin-line grass formation ring,
cracked roots gripping the ground at the base.
```

**A Ngân** (`a_ngan`, `col #7fd8ff`, `robe #24527a`; nghi) — đánh: hoa nở bung, dây vàng vươn ra.
```
SPIRIT: "Ten-thousand-year Blue-Silver Emperor": an ancient divine tree, roots gripping heaven and earth, a huge
blue-and-gold flower blooming on top like a crown. A thick ancient twisted grass trunk (SOLID, fully drawn), a large
flower with an ancient calyx, golden vines hanging down, a ring of grass like a crown. Colors: dark blue-green (#24527a)
body, bright blue (#7fd8ff) highlights, gold accents on the flower, white on the pistil.
Motifs (only these three): ancient-tree grain like dao runes, a thin-line life-formation ring, golden light from the pistil.
```

**Kỳ Nhung Thông Thiên Cúc** (`ky_nhung_thong_thien_cuc`, `col #ffb347`, `robe #8a4a12`; nghi) — đánh: cánh hoa xòe hết cỡ, vài cánh bắn ra như phi đao rồi trở về.
```
SPIRIT: "Great Dao Golden Flower": not a pretty flower but a halo of long blade-like petals thrusting at the sky.
A chrysanthemum with long pointed petals in staggered layers like sword blades, rooted in twisted black roots; the flower
disc is SOLID and fully drawn (no hollow). Colors: earthen orange (#8a4a12) outer petals, amber (#ffb347) petal lights,
blinding gold on the pistil, dark red between layers.
Motifs (only these three): a golden halo behind the flower, dao runes ringing the pistil, a few loose petals flying like knives.
```

**Hỏa Long** (`hoa_long`, `col #ff4a2a`, `robe #7a1c10`; nghi) — đánh: đầu rồng phóng tới phun lửa (chỉ vẽ miệng há, không vẽ lửa rời).
```
SPIRIT: "Blazing Dragon": breath of fire, every scale a glowing coal; the head lunges over the shoulder as if to swallow.
A dragon body coiling in a vertical S behind, one big horned head with many spikes, curved horns, open mouth, reverse-pointed
scales (the whole body is SOLID and fully drawn, no human-shaped gap). Colors: dark red (#7a1c10) body, fire red-orange
(#ff4a2a) lights, yellow-white accent in the mouth core, black smoke on the edges.
Motifs (only these three): cracked scales revealing a fire core, fire dao runes around the horns, a thin-line fire formation ring.
```

**Hỏa Ảnh** (`hoa_anh`, `col #ff3a4a`, `robe #701822`; nghi) — đánh: hai nắm tay bọc lửa nện ra phía trước.
```
SPIRIT: a colossal fire-shadow guardian ghost standing behind: broad shoulders, horned head of fire, long arms, no readable face,
only two eyes; the lower body dissolves into smoke. The torso is SOLID and fully drawn (no human-shaped gap).
Colors: near-black dark red (#701822) body, bright red (#ff3a4a) flames, yellow eyes, coal-purple smoke.
Motifs (only these three): glowing dao-rune veins on the chest, a fire seal on each palm, a long cast shadow.
```

**Quỷ Mị** (`quy_mi`, `col #8a8aff`, `robe #22224a`; nghi) — đánh: quỷ ào tới há miệng hút.
```
SPIRIT: "Ghost Emperor": a floating wraith with no legs, long arms like night shadows, a dim face with only two bright slits.
Long humanoid shadow, horned head, long clawed hands, lower body dissolving into smoke; the body is SOLID and fully drawn.
Colors: deep violet-blue (#22224a) body with a MANDATORY bright rim light (#8a8aff), white-blue eyes, black mouth.
Motifs (only these three): a demon mask engraved with talismans, layered dark netherworld mist, a ghost seal on the chest.
```

## 5. Kiểm sau khi sinh

Bài học mẫu Lam Ngân Thảo (#1324): ngọn cây không được giống mặt / đầu quỷ; kiểm ảnh vuông và từng ô trước khi ghép. Chừa khoảng nền rộng quanh **toàn bộ** pose đánh; khi dây chạm ô bên cạnh, yêu cầu thu đồng đều mọi pose và cuộn gọn đầu dây, không cắt mất đầu nhọn. Bài học pháp tướng độc lập không thuộc parser bài học phụ thể quanh nộm.

Theo `vo-hon-phong-cach.md` phần 6.1 (RAW chặn / nhẹ / đẹp; ảnh pixel kiểm sau chuyển) và thêm bằng mắt: **không chỗ rỗng hình người**, hình ở giữa tờ liền khối; 16 ô cùng cỡ, cùng đường chân; hướng `ne`/`n` đọc được khi mờ 70%; thở không đổi silhouette; đánh có đỉnh rõ ở ô 12–13. Hỏng thì ghi bài học một dòng vào `art/src/phuthe-anim/lessons.md`.
