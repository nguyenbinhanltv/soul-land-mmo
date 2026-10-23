# Soát kinh tế trang bị hồn sư (E0, #411)

Kèm mục 5.15 của `GAME_DESIGN.md`. Số liệu sinh ra bằng `npm run econ:equip --prefix server -- --md` (kịch bản `server/scripts/equip-econ.ts`, dùng đúng hàm và bảng của `shared/data.ts`; đổi bảng số thì chạy lại và dán lại các bảng dưới đây).

**Đây là ước lượng theo giả định, không phải đo thật.** Số cần người dùng duyệt trước khi E1 trở đi bật cho người chơi. Đo thật ở bước E7.

## Giả định

| Giả định | Giá trị | Ghi chú |
|---|---|---|
| Hồn thú thường hạ mỗi giờ săn tập trung | 500 | ≈ 7 giây một con, gồm đi lại |
| Tinh anh hạ mỗi giờ | 5 | hồi sinh 480–720 giây (`ELITE.respawn`), một điểm tinh anh |
| Thú vương hạ mỗi ngày | 2 | `KING_TIMES` hai khung giờ; lượt rương `KING.daily` = 3 |
| Boss thế giới hạ mỗi ngày | 1 | `WORLD.daily` = 1 |
| Giờ chơi hiệu quả mỗi ngày | 3 | chỉ để quy ra "ngày" |
| Hồn Tệ | `BEAST_COIN` theo bậc của niên hạn tung (`rollYears`) | tinh anh tính theo mức trên của bản đồ |
| Đồ tạp ở bảng rơi | Đá Cường Hóa I–V theo `EQUIP_MAPS[bản đồ].stones` | số đá nhân `qty` theo bậc hồn thú |
| Phân giải | mọi món rơi đều đem phân giải (đá và Hồn Tệ của nó tính vào thu nhập) | trần trên của nguồn đá |

## Kết quả


### 1. Thu nhập mỗi giờ săn tập trung (thường 500 + tinh anh 5 con/giờ), chưa tính thú vương / boss

| Bản đồ | Hồn Tệ gốc | T0 | T1 | T2 | T3 | T4 | T5 | Đá I | Đá II | Đá III | Đá IV | Đá V | HT phân giải |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Thánh Hồn Thôn | 2.008 | 14,45 | 6,17 | 2,28 | 0 | 0 | 0 | 21,1 | 6,8 | 0 | 0 | 0 | 223 |
| Tinh Đấu Ngoại vi | 7.338 | 14,35 | 5,89 | 1,27 | 1 | 0 | 0 | 12,2 | 9,7 | 3,4 | 0 | 0 | 299 |
| Tinh Đấu Nội địa | 26.863 | 14,11 | 6,27 | 1,28 | 0,99 | 0 | 0 | 4,4 | 9 | 7,9 | 1,4 | 0 | 302 |
| Lạc Nhật Sâm Lâm | 38.042 | 13,91 | 5,92 | 1,29 | 0,84 | 0,15 | 0 | 1,5 | 5,4 | 9 | 3,7 | 0,7 | 340 |
| Cực Bắc Chi Địa | 53.025 | 14,32 | 5,98 | 1,29 | 0,85 | 0,15 | 0 | 0 | 3,3 | 7,9 | 5,5 | 2,2 | 342 |
| Hải Thần Đảo | 55.250 | 14,28 | 5,96 | 1,28 | 0,85 | 0,15 | 0 | 0 | 1,1 | 5,7 | 6 | 4,5 | 343 |

### 2. Thú vương và boss thế giới (mỗi lần hạ, phần của một người nhận rương theo đóng góp)

| Loại | T0 | T1 | T2 | T3 | T4 | T5 | Đá I | Đá II | Đá III | Đá IV | Đá V | Bùa |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Thú vương Nội địa | 0,55 | 0,24 | 1,44 | 1,28 | 0 | 0 | 0,4 | 0,9 | 0,8 | 0,1 | 0 | 0,25 |
| Thú vương Cực Bắc | 0,56 | 0,24 | 1,44 | 0,96 | 0,32 | 0 | 0 | 0,3 | 0,8 | 0,5 | 0,2 | 0,25 |
| Thú vương Hải Thần | 0,56 | 0,24 | 1,44 | 0,96 | 0,3 | 0,02 | 0 | 0,1 | 0,5 | 0,6 | 0,4 | 0,25 |
| Boss thế giới | 0,23 | 0,1 | 1,56 | 1,04 | 2,76 | 0,49 | 0 | 0 | 0,3 | 0,7 | 0,8 | 0,6 |

### 3. Chi phí kỳ vọng cường hóa 1 món từ +0 (theo bảng EQUIP_ENHANCE; mỗi lần cố đều tốn đá + phí)

| Đích | Lần cố | Hồn Tệ | Đá I | Đá II | Đá III | Đá IV | Đá V | Bùa |
|---|---|---|---|---|---|---|---|---|
| +3 | 3 | 600 | 3 | 0 | 0 | 0 | 0 | 0 |
| +6 | 7 | 3.800 | 3 | 8 | 0 | 0 | 0 | 0 |
| +9 | 23 | 37.000 | 3 | 16 | 48 | 0 | 0 | 0 |
| +10 | 43,4 | 101.156 | 3 | 22 | 104 | 17 | 0 | 0 |
| +12 | 216,9 | 715.699 | 3 | 71 | 540 | 219 | 0 | 0 |
| +13 | 226,9 | 1.015.699 | 3 | 71 | 540 | 219 | 80 | 9 |
| +14 | 236,9 | 1.315.699 | 3 | 71 | 540 | 219 | 160 | 18 |
| +15 | 246,9 | 1.615.699 | 3 | 71 | 540 | 219 | 240 | 27 |

Không có bùa, xác suất đi từ +12 tới +15 mà không phá hủy: 0,1 %

### 4. Số giờ săn ở từng bản đồ để gom đủ nguyên liệu và Hồn Tệ cho MỘT món lên +10 (tiêu hết đá, kể cả đá có từ phân giải đồ rơi)

| Bản đồ | Giờ (đá) | Giờ (Hồn Tệ) | Nút thắt | Ngày (3h) |
|---|---|---|---|---|
| Thánh Hồn Thôn | ∞ | 45,3 | Đá IV | ∞ |
| Tinh Đấu Ngoại vi | 33,4 | 13,2 | Đá IV | 11,1 |
| Tinh Đấu Nội địa | 10,4 | 3,7 | Đá III | 3,5 |
| Lạc Nhật Sâm Lâm | 9,5 | 2,6 | Đá III | 3,2 |
| Cực Bắc Chi Địa | 10,6 | 1,9 | Đá III | 3,5 |
| Hải Thần Đảo | 13,6 | 1,8 | Đá III | 4,5 |

### 5. Lên +15 (một món) bằng bùa: số ngày chỉ riêng chờ bùa và Đá V

Bùa cần 27; bùa kiếm 1,1/ngày (KING 2 + WORLD 1 lần/ngày) → 25 ngày
Đá V cần 240; kiếm 15,5/ngày (săn Hải Thần 3h + boss) → 15 ngày; Hồn Tệ 1.615.699

### 6. Hợp thành: số món đầu vào kỳ vọng cho 1 món ra (1 chính + 2 hiến tế mỗi lần thử; thất bại mất 2 hiến tế, T4→T5 mất cả 3)

| Bước | Tỉ lệ | Món vào / món ra | Hồn Tệ / món ra | Tinh Hoa / món ra |
|---|---|---|---|---|
| T0→T1 | 100% | 3 | 100 | 0 |
| T1→T2 | 85% | 3,4 | 471 | 0 |
| T2→T3 | 65% | 4,1 | 2.308 | 0 |
| T3→T4 | 40% | 6 | 15.000 | 0 |
| T4→T5 | 20% | 15 | 100.000 | 38 |

Chỉ bằng hợp thành, 1 món T5 cần 3.691 món T0 (chỉ minh hoạ: thực tế T5 chủ yếu từ boss thế giới).

### 7. Sức mạnh trang bị so với hồn cốt / hồn hạch (võ hồn Cường công 1★, hồn hoàn theo cấp; % tăng so với chính võ hồn đó khi chưa gắn gì)

| Mốc | Bộ | Sinh lực % | Công % | Hồn lực % | Chí mạng | Giảm ST |
|---|---|---|---|---|---|---|
| Cấp 30 (4 vòng; Ngoại vi) | 6 hồn cốt 1.000y +0 | 15,8 | 10,8 | 10,9 | 0 | - |
|  | 6 hồn hạch 3★ +3 | 23,5 | 18,4 | 34,8 | 2,6 | - |
|  | 10 trang bị T0 +0 ilvl 2 | 3 | 3,3 | 1,8 | 0,2 | 1,6% |
|  | 10 trang bị T1 +3 ilvl 2 | 6,3 | 6,5 | 4,9 | 0,5 | 2,8% |
|  | 10 trang bị T2 +3 ilvl 2 | 9,7 | 10,3 | 7,4 | 0,9 | 4% |
| Cấp 60 (7 vòng; Lạc Nhật / Cực Bắc) | 6 hồn cốt 10.000y +6 | 20,9 | 13,6 | 22,3 | 0 | - |
|  | 6 hồn hạch 5★ +6 | 35,6 | 30,3 | 63,1 | 8,7 | - |
|  | 10 trang bị T2 +6 ilvl 3 | 5,6 | 5,6 | 6 | 1 | 4% |
|  | 10 trang bị T3 +9 ilvl 4 | 11,6 | 11,6 | 13,1 | 2,3 | 5,6% |
|  | 10 trang bị T4 +9 ilvl 5 | 20,3 | 20,3 | 24 | 4,4 | 6,8% |
| Cấp 100 (9 vòng; Hải Thần / Lõi) | 6 hồn cốt 100.000y +12 | 45,5 | 26,4 | 58,4 | 0 | - |
|  | 6 hồn hạch 6★ +12 | 50,5 | 45,4 | 87,7 | 15,7 | - |
|  | 10 trang bị T3 +10 ilvl 6 | 10 | 9,9 | 12,3 | 2,9 | 5,6% |
|  | 10 trang bị T4 +12 ilvl 6 | 17,2 | 17 | 21,4 | 5,1 | 6,8% |
|  | 10 trang bị T5 +15 ilvl 7 | 29,8 | 29,6 | 36,9 | 8,8 | 8% |

Phí cường hóa để so: hồn cốt 0→+20 tổng 60.000 đồng và hồn hạch 0→+15 tổng 55.500 đồng cho mỗi món (không bao giờ thất bại).
Hệ số cường hóa: trang bị +5 ×1,18, +10 ×1,51, +15 ×1,93; hồn cốt +10 ×1,5, +20 ×2; hồn hạch +15 ×2,5.


## Nhận xét

1. **Sức mạnh:** bộ 10 ô cao nhất (Chí Bảo +15, ilvl 7) cho khoảng +30% sinh lực / công, +37% hồn lực, +8,8% chí mạng, 8% giảm sát thương: bằng 60–65% của một bộ 6 hồn hạch 6★ +12 và đủ để người chơi thấy, nhưng **không thay** hồn hoàn / hồn cốt / hồn hạch (hồn cốt 100.000 năm +12 một mình cho +45% sinh lực). Ở giữa game (cấp 60) bộ Tử Kim +9 chỉ ~12%, bộ hồn hạch 5★ +6 ~35%. Hệ số cường hóa trang bị ×1,93 ở +15 (kế hoạch gốc ×5,65 làm Chí Bảo +15 vượt xa mọi nguồn khác nên đã co lại).
2. **Giảm sát thương nhận** tối đa 8% khi đủ 4 ô Chí Bảo; chung trần `BONE_PASSIVE_CAP.def` (30%) với bị động hồn cốt qua `equipDefTotal`, nên không thể chồng vượt trần.
3. **Cường hóa:** một món lên +10 tốn ~43 lần cố, ~100.000 đồng, ~104 Đá III + 17 Đá IV: **khoảng 3–4 ngày chơi 3 giờ** ở Nội địa trở đi. Cả bộ 10 ô +10 mất khoảng 5–6 tuần. +12 tốn ~217 lần cố (~716.000 đồng, 540 Đá III, 219 Đá IV): vài tuần cho một món. Các số này là kỳ vọng của chuỗi Markov (thất bại +7–12 tụt 1 cấp).
4. **+13–15 (Chí Bảo thật sự):** 10% mỗi lần, thất bại mà không bùa là **mất món** (xác suất đi cả +12→+15 không bùa chỉ 0,1%). Thực tế bắt buộc dùng Bùa Hộ Mệnh: kỳ vọng 27 bùa và 240 Đá V cho +12→+15. Bùa chỉ rơi ở thú vương (25%) / boss thế giới (60%): ~1,1 bùa mỗi ngày nếu hạ đủ cả 3 lần ⇒ **~25 ngày cho một món**. Mục tiêu dài hạn có chủ đích, nhưng cả bộ +15 sẽ là việc nhiều tháng. **Điểm cần duyệt:** nếu thấy quá nặng, nới tỉ lệ `p` của nấc 13–15 (12–15%) hoặc tăng `charm` ở `EQUIP_DROP`, không đụng các nấc thấp.
5. **Hồn Tệ:** phí cường hóa so với thu nhập 2.000–55.000 đồng/giờ (Thánh Hồn Thôn → Hải Thần Đảo) nhỏ ở bản đồ sâu (+10 ≈ 2 giờ ở Cực Bắc, +15 ≈ 30 giờ ở Hải Thần) và đáng kể ở bản đồ nông (+10 ≈ 13 giờ ở Ngoại vi). Đúng ý "nguồn tiêu Hồn Tệ cho bản đồ giữa", không phải nút cổ chai ở đầu sâu. Hợp thành T4→T5 tốn ~100.000 đồng và 38 Tinh Hoa cho một món T5 từ T4.
6. **Nút cổ chai nằm ở đá, đúng bản đồ:** Thánh Hồn Thôn không ra Đá III trở lên, Ngoại vi không ra Đá IV: không thể lên +10 chỉ ở bản đồ đầu, buộc đi sâu (như hồn hoàn). Đá III–V đến từ thú vương / boss và phân giải T3+.
7. **Nguồn trang bị:** ~14 món T0 và ~6 món T1 mỗi giờ (chủ yếu chất đống để phân giải), tinh anh ra T3 ~1 món/giờ ở Ngoại vi trở đi (túi đầy xử lý theo luật nhặt hiện hành; Tự bán / tự phân giải tùy chọn ở E4). T4 chỉ ~0,15/giờ từ tinh anh ở bản đồ sâu và 0,3 mỗi thú vương; **T5 chủ yếu từ boss thế giới (~0,5/ngày)**, cả bộ 10 ô T5 cần hàng tháng (chỉ cần một ô trùng là phân giải).
8. **Đấu trường tính đầy đủ** (đã chốt): trang bị làm tăng khoảng cách giữa người chơi nhiều giờ và người ít giờ, nhưng chỉ ở mức ~30% tối đa và có trần giảm sát thương; `ARENA_HE_DMG`, `dmgMult` không đổi. Soát lại sau khi có số liệu đấu thật (E7). May mắn (vũ khí + dây chuyền) kéo công vũ khí từ giữa lên max: tối đa +25% của riêng công vũ khí (vài % tổng công), nên không phải nguồn sức mạnh chính.

## Việc để E7

- Chạy giả lập nhiều người chơi / bot dài, so thời gian lên +10 / +12 với bảng này.
- Đo sức mạnh thật trên đấu trường (Elo giữa nhóm có và không có bộ Chí Bảo).
- Kiểm tải ghi DB khi phân giải hàng loạt (tinh anh rơi ~20 món/giờ).
