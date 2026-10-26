# Soát kinh tế trang bị hồn sư (E0, #411)

Kèm mục 5.15 của `GAME_DESIGN.md`. Số liệu sinh ra bằng `npm run econ:equip --prefix server -- --md` (kịch bản `server/scripts/equip-econ.ts`, dùng đúng hàm và bảng của `shared/data.ts`; đổi bảng số thì chạy lại và dán lại các bảng dưới đây).

**Đây là ước lượng theo giả định, không phải đo thật.** Bảng số đã được chủ repo duyệt (Q42 ở `docs/quyet-dinh.md`). Chạy dài đo thật và giả lập theo thời gian ở bước E7 (mục cuối).

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

## E7 (#418): giả lập theo thời gian, đấu trường, chạy dài

Sinh bằng `npm run sim:equip --prefix server -- --md` (`server/scripts/equip-sim.ts`, 40 lượt tung × 120 ngày × 3 hồ sơ, dùng đúng hàm và bảng của `shared/data.ts`) và `npm run bot:local -- --only equipsoak --env PERF_LOG=1` (bài chạy dài ở `client/scripts/bot-test.mjs`). **Giả lập vẫn là ước lượng theo giả định; phần chạy dài là số đo thật trên server.** **Kết luận: không đổi số cân bằng nào trong PR này** (lý do ở cuối mục).

### Giả định của giả lập

| Giả định | Giá trị | Ghi chú |
|---|---|---|
| Hồ sơ | 1 / 3 / 6 giờ săn mỗi ngày | thường 500 + tinh anh 5 con/giờ (như E0); thú vương 1–2 lần/ngày, boss thế giới 1 lần/ngày |
| Lộ trình bản đồ | theo giờ chơi lũy kế (chuẩn 3 giờ/ngày): Thánh Hồn Thôn → Ngoại vi (ngày 3) → Nội địa (9) → Lạc Nhật (18) → Cực Bắc (30) → Hải Thần (45) | thú vương từ Nội địa; **boss thế giới chỉ từ Hải Thần** (bản đồ Lõi Tinh Đấu cấp 90–100) |
| Chính sách mặc | món mới mặc khi điểm (chỉ số chính × bậc × cấp vật phẩm × cường hóa) cao hơn món đang mặc | món bị thay về túi |
| Hợp thành | khi có 3 món cùng ô cùng bậc và bậc kế tốt hơn món đang mặc ô đó; tối đa T4 → T5 | giữ tối đa 2 món/bậc/ô làm hiến tế, còn lại phân giải |
| Cường hóa | món đang mặc lên mức mục tiêu theo bậc: T1 +3, T2 +6, T3 +9, T4 +12, T5 +15; món thấp nhất trước | ở nấc 13–15 **luôn dùng bùa** (không bùa thì chờ): người chơi cẩn thận, nên số "Phá hủy" luôn 0 |
| Hồn Tệ | vào: săn + phân giải; ra: phí cường hóa + hợp thành | không tính hồn cốt / hồn hạch / mua bán khác (cùng ví Hồn Tệ) |
| Đấu trường | 1v1 cùng kỹ năng, so P = công × sinh lực ÷ (1 − giảm ST) × hệ số chí mạng | thắng ⇔ P lớn hơn (thời gian hạ gục); hệ số `ARENA` áp như nhau cho hai bên nên triệt tiêu khi so tỉ lệ |

### A1. Ít giờ (1 giờ/ngày): tiến trình bộ 10 ô theo ngày

| Ngày | Bản đồ | Bậc TB | + TB | + cao nhất | ≥T4 | T5 | Sinh lực % | Công % | Giảm ST % | Chí mạng |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Thánh Hồn Thôn | 0,8 | 1 | 2 | 0 | 0 | 9 | 10 | 2,2 | 0,3 |
| 3 | Thánh Hồn Thôn | 1,5 | 2,5 | 3 | 0 | 0 | 13,5 | 17,4 | 3,5 | 0,6 |
| 7 | Thánh Hồn Thôn | 2 | 3,3 | 4 | 0 | 0 | 17,1 | 20,7 | 4 | 0,6 |
| 14 | Tinh Đấu Ngoại vi | 2,6 | 6 | 6 | 0 | 0 | 14,6 | 15,8 | 4,9 | 1,1 |
| 30 | Tinh Đấu Nội địa | 3,1 | 7 | 8 | 1 | 0 | 14,7 | 14 | 5,6 | 1,8 |
| 60 | Lạc Nhật Sâm Lâm | 3,8 | 7,9 | 9 | 8 | 0 | 14,1 | 14,6 | 6,5 | 3,2 |
| 90 | Cực Bắc Chi Địa | 4 | 8,4 | 12 | 10 | 0 | 12,4 | 12,9 | 6,8 | 3,5 |
| 120 | Cực Bắc Chi Địa | 4 | 8,6 | 12 | 10 | 0 | 12,9 | 13,5 | 6,8 | 3,6 |

### A1. Vừa (3 giờ/ngày): tiến trình bộ 10 ô theo ngày

| Ngày | Bản đồ | Bậc TB | + TB | + cao nhất | ≥T4 | T5 | Sinh lực % | Công % | Giảm ST % | Chí mạng |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Thánh Hồn Thôn | 1,5 | 2,9 | 3 | 0 | 0 | 14,3 | 17,1 | 3,3 | 0,5 |
| 3 | Tinh Đấu Ngoại vi | 2,3 | 4,9 | 5 | 0 | 0 | 11,2 | 12,2 | 4,6 | 1,1 |
| 7 | Tinh Đấu Ngoại vi | 2,9 | 6,7 | 7 | 0 | 0 | 17,4 | 17,9 | 5,6 | 1,5 |
| 14 | Tinh Đấu Nội địa | 3,4 | 7,8 | 8 | 4 | 0 | 17,8 | 18,6 | 6,1 | 2,2 |
| 30 | Cực Bắc Chi Địa | 4 | 8,3 | 12 | 10 | 0 | 13 | 13,1 | 6,8 | 3,1 |
| 60 | Hải Thần Đảo | 4,6 | 8,5 | 12 | 10 | 6 | 19,1 | 20,2 | 7,6 | 6 |
| 90 | Hải Thần Đảo | 5 | 8,9 | 15 | 10 | 10 | 22,2 | 22,5 | 8 | 6,7 |
| 120 | Hải Thần Đảo | 5 | 10,1 | 15 | 10 | 10 | 23,5 | 24,4 | 8 | 7 |

### A1. Cày (6 giờ/ngày): tiến trình bộ 10 ô theo ngày

| Ngày | Bản đồ | Bậc TB | + TB | + cao nhất | ≥T4 | T5 | Sinh lực % | Công % | Giảm ST % | Chí mạng |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Thánh Hồn Thôn | 1,9 | 3,5 | 4 | 0 | 0 | 16,4 | 19,3 | 4 | 0,6 |
| 3 | Tinh Đấu Ngoại vi | 2,9 | 6,6 | 7 | 0 | 0 | 17 | 18,2 | 5,3 | 1,5 |
| 7 | Tinh Đấu Nội địa | 3,3 | 7,7 | 8 | 3 | 0 | 17,9 | 17,6 | 6 | 2,2 |
| 14 | Lạc Nhật Sâm Lâm | 3,9 | 8,1 | 9 | 9 | 0 | 15,7 | 15,4 | 6,8 | 3,5 |
| 30 | Hải Thần Đảo | 4,4 | 8,4 | 12 | 10 | 4 | 16,8 | 17,2 | 7,2 | 5,2 |
| 60 | Hải Thần Đảo | 4,9 | 9,8 | 15 | 10 | 9 | 23,5 | 22,5 | 8 | 7,2 |
| 90 | Hải Thần Đảo | 5 | 11 | 15 | 10 | 10 | 24,7 | 24,1 | 8 | 7,5 |
| 120 | Hải Thần Đảo | 5 | 12,7 | 15 | 10 | 10 | 26,1 | 26 | 8 | 7,8 |

### A2. Ít giờ (1 giờ/ngày): Hồn Tệ vào / ra và nguyên liệu (cộng dồn)

| Ngày | HT săn | HT phân giải | HT cường hóa | HT hợp thành | Ra/Vào % | Tồn HT | Phá hủy | Bùa kiếm/dùng | Đá tồn I-V |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2.023 | 48 | 2.000 | 0 | 96,3 | 109 | 0 | 0/0 | 27/7/0/0/0 |
| 3 | 6.036 | 280 | 6.000 | 200 | 97,9 | 115 | 0 | 0/0 | 110/25/0/0/0 |
| 7 | 14.120 | 900 | 12.200 | 2.500 | 98,1 | 279 | 0 | 0/0 | 291/54/0/0/0 |
| 14 | 60.296 | 2.508 | 56.800 | 4.550 | 98,6 | 674 | 0 | 0/0 | 584/73/24/0/0 |
| 30 | 255.575 | 6.612 | 162.850 | 31.750 | 73,9 | 68.456 | 0 | 1/0 | 1.235/244/2/7/0 |
| 60 | 1.141.940 | 20.284 | 519.350 | 122.000 | 56 | 513.251 | 0 | 9/0 | 2.281/611/1/56/5 |
| 90 | 2.298.089 | 35.301 | 1.078.450 | 137.950 | 52,8 | 1.104.344 | 0 | 17/0 | 3.273/946/1/22/30 |
| 120 | 3.888.839 | 50.654 | 1.581.400 | 137.950 | 44,1 | 2.206.186 | 0 | 24/0 | 4.240/1.208/2/100/106 |

### A2. Vừa (3 giờ/ngày): Hồn Tệ vào / ra và nguyên liệu (cộng dồn)

| Ngày | HT săn | HT phân giải | HT cường hóa | HT hợp thành | Ra/Vào % | Tồn HT | Phá hủy | Bùa kiếm/dùng | Đá tồn I-V |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 6.077 | 276 | 5.800 | 400 | 98 | 159 | 0 | 0/0 | 110/26/0/0/0 |
| 3 | 34.415 | 1.411 | 32.500 | 2.500 | 98,9 | 396 | 0 | 0/0 | 368/51/12/0/0 |
| 7 | 123.449 | 4.049 | 109.500 | 8.200 | 92,1 | 10.738 | 0 | 0/0 | 861/147/2/0/0 |
| 14 | 627.822 | 10.883 | 283.400 | 78.250 | 55,5 | 281.688 | 0 | 3/0 | 1.608/394/1/33/0 |
| 30 | 2.395.291 | 31.136 | 1.014.800 | 139.850 | 47,4 | 1.279.350 | 0 | 10,5/0 | 3.186/897/1/59/35 |
| 60 | 7.274.341 | 107.484 | 2.326.350 | 222.200 | 34,7 | 4.824.643 | 0 | 35/0 | 5.946/1.489/2/483/404 |
| 90 | 12.246.843 | 210.494 | 4.750.000 | 331.750 | 40,4 | 7.422.927 | 0 | 68/41 | 8.761/2.129/2/1.089/594 |
| 120 | 17.219.343 | 314.815 | 7.218.400 | 335.300 | 43,2 | 9.977.578 | 0 | 100,5/80 | 11.582/2.777/1/1.642/763 |

### A2. Cày (6 giờ/ngày): Hồn Tệ vào / ra và nguyên liệu (cộng dồn)

| Ngày | HT săn | HT phân giải | HT cường hóa | HT hợp thành | Ra/Vào % | Tồn HT | Phá hủy | Bùa kiếm/dùng | Đá tồn I-V |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 12.266 | 696 | 11.600 | 1.200 | 96,9 | 461 | 0 | 0/0 | 267/43/0/0/0 |
| 3 | 100.508 | 3.432 | 92.900 | 4.900 | 95,2 | 5.007 | 0 | 0/0 | 743/121/3/0/0 |
| 7 | 628.219 | 9.876 | 257.850 | 59.100 | 50,1 | 316.817 | 0 | 1,5/0 | 1.617/401/2/32/0 |
| 14 | 2.155.099 | 25.039 | 810.400 | 112.750 | 42,3 | 1.247.674 | 0 | 5/0 | 2.975/792/1/81/27 |
| 30 | 7.352.299 | 79.807 | 2.040.350 | 147.300 | 29,5 | 5.234.652 | 0 | 18,5/0 | 5.911/1.393/2/431/376 |
| 60 | 17.298.319 | 212.613 | 5.657.350 | 302.300 | 34 | 11.558.054 | 0 | 52,5/47,5 | 11.408/2.437/2/1.309/931 |
| 90 | 27.243.928 | 346.327 | 9.099.250 | 365.100 | 34 | 18.202.003 | 0 | 86,5/83,5 | 16.945/3.563/2/2.236/1.552 |
| 120 | 37.189.648 | 479.420 | 11.886.600 | 390.450 | 32,6 | 25.369.727 | 0 | 120/117,5 | 22.490/4.765/3/3.147/2.193 |

### A3. Ngày đầu tiên đạt mốc (trung vị; ∞ = chưa đạt trong 120 ngày, kèm % lượt đạt)

| Hồ sơ | Có T4 | Có T5 | Một món +10 | Một món +12 | Một món +15 | Cả bộ ≥ +10 |
|---|---|---|---|---|---|---|
| Ít giờ (1 giờ/ngày) | 26 (100%) | ∞ (0%) | 59 (100%) | 73 (85%) | ∞ (0%) | 104 (5%) |
| Vừa (3 giờ/ngày) | 9 (100%) | 46 (100%) | 20 (100%) | 30 (100%) | 80 (90%) | 43 (3%) |
| Cày (6 giờ/ngày) | 5 (100%) | 24 (100%) | 11 (100%) | 18 (100%) | 45 (85%) | 109 (48%) |

### B1. Đấu trường: chỉ số sức mạnh P = công × sinh lực ÷ (1 − giảm ST) × (hệ số chí mạng), võ hồn Cường công; tỉ lệ P so với người CÙNG cấp / hồn hoàn / hồn cốt / hồn hạch nhưng KHÔNG trang bị

| Mốc | Bộ trang bị | Công | Sinh lực | Giảm ST % | P / P(không) | Thắng 1v1? |
|---|---|---|---|---|---|---|
| Cấp 30 | không trang bị | 168 | 1.268 | 0 | 1,00 | - |
|  | T1 +3 ilvl 2 | 177 | 1.354 | 2,8 | 1,16 | thắng |
|  | T2 +3 ilvl 2 | 181 | 1.397 | 4 | 1,25 | thắng |
| Cấp 60 | không trang bị | 507 | 3.864 | 0 | 1,00 | - |
|  | T3 +9 ilvl 4 | 546 | 4.179 | 5,6 | 1,25 | thắng |
|  | T4 +9 ilvl 5 | 575 | 4.446 | 6,8 | 1,43 | thắng |
| Cấp 100 | không trang bị | 1.067 | 8.682 | 0 | 1,00 | - |
|  | T3 +10 ilvl 6 | 1.128 | 9.117 | 5,6 | 1,2 | thắng |
|  | T4 +12 ilvl 6 | 1.157 | 9.553 | 6,8 | 1,32 | thắng |
|  | T5 +15 ilvl 7 | 1.256 | 10.224 | 8 | 1,58 | thắng |

### B2. Cùng bộ đồ, khác hệ võ hồn: chênh lệch từ trang bị so với chênh lệch có sẵn của hệ (ARENA_HE_DMG) ở cấp 100, T5 +15 so với không trang bị

| Hệ | Hệ số sát thương | P không | P T5+15 | Tăng % |
|---|---|---|---|---|
| cuong_cong | 0,9 | 12.042.058 | 19.064.593 | 58,3 |
| man_cong | 0,95 | 10.473.981 | 16.730.167 | 59,7 |
| khong_che | 1,15 | 10.778.054 | 17.242.486 | 60 |
| phu_tro | 1,35 | 10.267.812 | 16.525.802 | 60,9 |

### B3. Hai người cùng cấp 100, bộ trang bị khác nhau, đối đầu 1v1 cùng kỹ năng (mô hình thời gian hạ gục)

| A | B | Hạ B mất (giây) | Hạ A mất (giây) | Thắng |
|---|---|---|---|---|
| T5+15 | T3+10 | 20,3 | 26,1 | T5+15 (1,28× nhanh hơn; trận 180 giây) |
| T5+15 | không | 18,3 | 27,6 | T5+15 (1,51× nhanh hơn; trận 180 giây) |
| T4+12 | không | 19,8 | 25,4 | T4+12 (1,28× nhanh hơn; trận 180 giây) |
| T3+10 | không | 20,4 | 24 | T3+10 (1,18× nhanh hơn; trận 180 giây) |
| T5+15 | T4+12 | 21,6 | 25,4 | T5+15 (1,18× nhanh hơn; trận 180 giây) |

### B4. Để so: hồn cốt + hồn hạch đủ bộ so với không có gì (cùng cấp 100 / Cường công), và trang bị cộng thêm lên trên

| Cấu hình | P | P / P(trần) | TTK so với trần |
|---|---|---|---|
| Không gì (cấp 100 + 9 hồn hoàn) | 3.015.129 | 1 | 1 |
| + hồn cốt 100.000y +12 | 5.545.881 | 1,84 | 0,54 |
| + hồn hạch 6★ +12 | 7.824.108 | 2,59 | 0,39 |
| + cả hai | 12.042.058 | 3,99 | 0,25 |
| + cả hai + T3 +10 | 14.396.087 | 4,77 | 0,21 |
| + cả hai + T5 +15 | 19.064.593 | 6,32 | 0,16 |

### B5. Chênh lệch thật giữa các hồ sơ người chơi (cùng cấp 100, cùng hồn cốt / hồn hạch; chỉ khác bộ trang bị do giả lập ra; P so với hồ sơ Vừa cùng ngày)

| Ngày | Ít giờ / Vừa | Cày / Vừa | Cày / Ít giờ | Vừa / không đồ |
|---|---|---|---|---|
| 14 | 0,94 | 1,05 | 1,12 | 1,19 |
| 30 | 0,93 | 1,09 | 1,18 | 1,25 |
| 60 | 0,87 | 1,05 | 1,21 | 1,42 |
| 90 | 0,84 | 1,02 | 1,22 | 1,5 |
| 120 | 0,83 | 1,02 | 1,23 | 1,52 |

Trần giảm sát thương chung: 30%; bộ T5 đầy đủ cho 8% (bị động hồn cốt cộng vào dưới cùng trần).

### Chạy dài (`soak-perf`, số đo thật)

Bài `equipsoak` (BOT_ONLY, không nằm trong bot đầy đủ / CI): N bot đứng quanh Thợ rèn Nạc Định Thành, mỗi bot mặc đủ 10 ô (món đã +8…+15) rồi lặp: cường hóa (80% dùng bùa, 20% không để chạm phá hủy), hợp thành 3 → 1, phân giải 5–8 món, đổi món đang mặc, thoát và vào lại. Máy: Windows 11, i5-12400F, Node 24, lưu RAM (`MemoryStore`) hoặc PostgreSQL chung của máy; có phiên khác chạy song song (nhiễu). Server `GAME_TEST=1 PERF_LOG=1`, heap tối đa 768 MB. Một bot quan sát riêng đứng cùng phòng để đọc `perf` (tick, bản vá, RSS, heap) mỗi 60 giây.

| Lượt | Lệnh | Lỗi | Trễ p50 / p95 một lệnh | tick TB (nửa đầu → nửa sau) | bản vá TB | tick lớn nhất | RSS server | heap server |
|---|---|---|---|---|---|---|---|---|
| RAM, 40 bot × 20 phút | 22.773 cường hóa, 22.861 hợp thành, 22.852 phân giải, 22.834 mặc, 2.302 lần vào lại | 2 hết hạn | 54–56 / 64 ms | 0,97 → 0,87 ms | 0,7–1,0 ms | 31 ms | 146 → 210 (phút 1) → 240 MB (phút 20, tăng ~0,8 MB/phút và chậm dần); đỉnh 245 | 38–96 MB, 38 MB sau khi bot rời |
| PostgreSQL, 20 bot × 5 phút | 1.919 cường hóa, 1.958 hợp thành, 1.953 phân giải, 1.947 mặc, 200 lần vào lại | 0 | 55 / 64 ms | 0,51 → 0,53 ms | 0,17–0,37 ms | 15 ms | 152 → 209 MB; đỉnh 214 | 37–59 MB |

- Mốc so sánh `docs/tech/hieu-nang-soak.md` (40 bot tự săn trên bản đồ ×8): tick + vá 7–9 ms. Bài này chỉ có 40 người **đứng ở một phòng nhỏ** làm việc nặng túi / lưu, nên tick + vá chỉ ~1,7 ms: tải nằm ở chuỗi lưu và transaction, không ở tick.
- **Không rò rỉ rõ rệt:** tick không chậm dần (nửa sau thấp hơn nửa đầu), mọi lệnh trả lời ~55 ms (phần lớn là nhịp chờ 50 ms của bot), RSS tăng chậm rồi gần bằng phẳng, heap về 38 MB khi bot rời. RSS giữ ở 240 MB sau khi bot rời là hành vi thường của Node (không trả lại hệ điều hành ngay), không phải heap giữ đối tượng.
- **Vào lại giữ đúng trạng thái:** sau 20 phút, cả 40 bot thoát rồi vào lại thấy đúng món đang mặc (id, ô, cấp), túi và Hồn Tệ không âm, id không trùng (với PostgreSQL cũng vậy). 22 món bị phá hủy do chủ ý bấm không bùa: server xóa món đúng chỗ, không treo ô.
- Một lần trễ 2,8 giây (đồng thời cả ba loại lệnh) ở lượt 20 phút, tick server lúc đó không quá 31 ms; trùng lúc **bot** gần chạm trần heap 768 MB (bot RSS 743 MB vì `b.logs` giữ mọi dòng log) nên nhiều khả năng là GC của bot; chưa chứng minh. Một lần 1,4 giây ở lượt PostgreSQL, cùng cách giải thích. Chỉ là một lệnh quá hạn / chậm, không có mất đồ.
- **Chưa đo:** hàng trăm người (chỉ 40), cùng lúc có hồn thú trên bản đồ ×8 (xem `docs/tech/hieu-nang-soak.md`), nhiều tiến trình / Redis (#120), PostgreSQL ở máy chủ thật (chỉ PostgreSQL cục bộ).

### Kết luận E7 và việc để chủ repo duyệt

1. **Thời gian lên (giả lập mọi khâu cùng nhau):** với 3 giờ/ngày, có T4 từ ngày 9, **một món +10 ở ngày 20** (~60 giờ chơi), +12 ở ngày 30, T5 từ ngày 46 (boss thế giới ở Hải Thần), **một món +15 ở ngày 80** (90% lượt đạt trong 120 ngày). Người 1 giờ/ngày: +10 ở ngày 59, **không có T5 trong 120 ngày** (tới Hải Thần quá chậm); người 6 giờ/ngày: +10 ở ngày 11, T5 ngày 24, +15 ngày 45. Dài hơn ước lượng E0 ("một món +10 ≈ 3–4 ngày ở Nội địa trở đi") vì E0 coi món cố định, còn ở đây món bị thay khi lên bậc và đá III–V chỉ có ở bản đồ sâu. Thứ tự vẫn khớp ý thiết kế: đá và bùa, không phải Hồn Tệ, là nút cổ chai.
2. **Bùa Hộ Mệnh là nút cổ chai của +13–15:** người 3 giờ/ngày kiếm ~100 bùa trong 120 ngày (thú vương 25% + boss thế giới 60%), dùng ~80; +TB cả bộ ở ngày 120 chỉ 8,6 / 10,1 / 12,7 (1 / 3 / 6 giờ/ngày). Đúng mục tiêu dài hạn đã ghi ở E0; **không đổi**.
3. **Sức mạnh bão hòa quanh +22–26% sinh lực / công** (ngày 90–120, hồ sơ ≥ 3 giờ), giảm sát thương 8%: khớp ước lượng E0 (Chí Bảo +15 đủ bộ ≈ +30%). Giữa game (ngày 14–60) sức mạnh dao động 13–20% vì món bị thay khi sang bản đồ mới: bình thường.
4. **Hồn Tệ:** trang bị tiêu 33–44% tổng thu nhập (săn + phân giải) sau 120 ngày ở mọi hồ sơ (7,6 triệu trên 17,5 triệu với 3 giờ/ngày, gồm cả hợp thành), nhưng phần còn lại **tồn lại hàng triệu đến chục triệu** (2,2 triệu / 10 triệu / 25 triệu theo 1 / 3 / 6 giờ/ngày; cùng ví với hồn cốt, hồn hạch): nguồn tiêu Hồn Tệ cuối game yếu, không riêng trang bị. **Tuần đầu** thì ngược lại: chính sách cường hóa mục tiêu +3 / +6 cho T0–T2 dùng 98% Hồn Tệ của hồ sơ 1 giờ/ngày (tiêu 14.700 trên thu 15.000 trong 7 ngày) và 92% của hồ sơ 3 giờ/ngày, tranh với đan / cổng truyền tống của người mới. Đây là hệ quả chính sách giả lập, không phải lỗi bảng; người chơi thật có thể bỏ qua cường hóa món T0–T1.
5. **Đấu trường tính đầy đủ vẫn ổn:**
   - Trang bị **không phải** nguồn chênh lệch chính: hồn cốt + hồn hạch đủ bộ nhân sức mạnh P lên ~4,0 lần so với không gì cả (cấp 100), trang bị T5 +15 thêm ×1,58 (công và sinh lực mỗi thứ ×1,18, giảm sát thương 8%, chí mạng thêm vài điểm).
   - Chênh giữa những người **thật sự chơi**: cùng ngày, hồ sơ 6 giờ so với 1 giờ hơn **1,12× (ngày 14) → 1,23× (ngày 120)** về P; 6 giờ so với 3 giờ chỉ 1,02–1,09×. Người hoàn toàn không có trang bị thua người 3 giờ/ngày ở ngày 90 khoảng 1,5×.
   - Cùng hệ số trang bị cho mọi hệ võ hồn (tăng 58–61% P ở T5 +15), nên **không đổi cán cân giữa các hệ** (`ARENA_HE_DMG`).
   - Giảm sát thương 8% xa trần 30% chung với bị động hồn cốt. May mắn vũ khí (max thay vì giữa) chỉ cộng vài % tổng công.
   - Đây là mô hình thời gian hạ gục, **chưa phải Elo thật** (né, khống chế, hồn kỹ không có trong mô hình; chưa có số trận đấu thật). Nếu sau này thấy người ít giờ bị bỏ xa trong đấu trường, đòn bẩy rẻ nhất là hệ số riêng cho trang bị trong sân (chưa làm, chưa có số liệu thật để đặt).
6. **Chạy dài:** không chậm dần, không rò, vào lại đúng trạng thái (bảng trên).

**Số cân bằng đổi trong PR này: không.** Các kết quả đo (+15 cần ~80 ngày với 3 giờ/ngày, T5 không tới tay người 1 giờ/ngày, bộ nhớ ổn, chênh đấu trường ≤ 1,23× giữa người chơi tích cực) nằm trong ý thiết kế E0 / mục 5.15; đổi số khi chưa có số liệu đấu thật và chưa ai chơi thử chỉ làm lệch ước lượng. Ba núm nếu chủ repo muốn chỉnh sau khi chơi thử (chưa đổi, chỉ ghi hướng tác động):
- **Tuần đầu tranh Hồn Tệ:** hạ `EQUIP_ENHANCE[0].fee` (200) hoặc `EQUIP_SYNTH[0].fee` (100) nếu người mới báo hết Hồn Tệ.
- **Cuối game dư Hồn Tệ:** tăng `fee` các nấc 10–12 / 13–15 của `EQUIP_ENHANCE` (8.000 / 30.000) hoặc `EQUIP_SYNTH[3..4].fee` làm nguồn tiêu; không đổi tốc độ lên vì nút cổ chai là đá và bùa.
- **+15 quá chậm / quá nhanh:** `EQUIP_DROP.ranks[2..3].charm` (0,25 / 0,6) là đòn bẩy trực tiếp lên số ngày; chạy lại `npm run sim:equip --prefix server` để so trước / sau.

## Dòng Hồn Tệ tổng theo ngày: treo 12 giờ + mọi sink (#906, theo dõi #253 / #168 / #418)

Sinh bằng `npm run sim:econ --prefix server -- --md` (`server/scripts/econ-sim.ts`, dùng đúng hàm và bảng của `shared/data.ts`; thêm `--auto-fast` để chỉ dùng ước lượng `offlineFight` mà không chặn bằng nhịp tay). Bổ sung bảng A2 của E7 (chỉ có săn tay + phí trang bị): thêm **tự săn** (`AUTO_PACE`, `AUTO_DAILY_SECS`), **bán đồ rơi** (`sellPrice`) và các sink còn thiếu. **Đây là ước lượng theo giả định, chưa đo; không đổi số cân bằng nào trong PR này.**

### Giả định (ước lượng, chưa đo)

| Giả định | Giá trị | Ghi chú |
|---|---|---|
| Hạ tay mỗi giờ | 500 thường + 5 tinh anh | như E0 (≈ 7 giây một con) |
| Treo | 12 giờ/ngày (`AUTO_DAILY_SECS`), mỗi con tốn max(≈ 7 giây thật, `offlineFight`) | trần `AUTO_PACE`: số thật chưa đo; `--auto-fast` bỏ nhịp thật (treo hơn tay 1,2–1,7 lần mỗi giờ) |
| Chỉ số võ hồn khi treo | Cường công, cấp / hồn hoàn của lộ trình ở `ROUTE`, chưa trang bị | trang bị làm hạ nhanh hơn: nghiêng về thu nhập thấp hơn thật |
| Lộ trình bản đồ | như `equip-sim`: Hải Thần từ ngày 45 (chuẩn 3 giờ/ngày); dòng "theo 15 giờ" = cận trên (đẩy lộ trình theo cả giờ treo) | |
| Bán đồ | bán hết hồn cốt / hồn hạch / mảnh rơi ở giá thương nhân (`sellPrice`); không bán hồn hoàn (tự săn mặc định không nhặt) | cận trên của thu nhập từ đồ; hồn cốt / hồn hạch đang dùng không bán |
| Không tính | thú vương, boss thế giới, nhiệm vụ, `DAILY`, đấu trường, phí truyền tống, đặt lại hồn hạch, hợp thành trang bị | |
| Sink | mua mảnh Thương hội tối đa mỗi ngày (`SHARD_BUY.daily`), mở rộng túi, cường hóa hồn cốt (+20) / hồn hạch (+15) đủ 6 ô cho mỗi võ hồn, cường hóa 10 ô trang bị tới +15, đổi ngoại hình 1 lần trả phí mỗi 30 ngày (`LOOKS_CHANGE`) | **trần sức chứa**: coi như có đồ để nâng ngay; trang bị còn bị đá / bùa chặn (E7) nên phần này khó đạt bằng Hồn Tệ |
| Chính sách tiêu | mỗi ngày mua mảnh trước, rồi sink một lần, còn lại là "Tồn" | "Ra/Vào 100%" nghĩa là tiêu hết mọi thứ có thể |

Số tồn lớn cuối game **chưa phải kết luận "sai"**: `docs/design/kinh-te-tui-do.md` chưa ghi mục tiêu tồn Hồn Tệ, nên theo `balance-review` là **Chưa đánh giá: thiếu mục tiêu**; bảng chỉ cho thấy sink cạn khi nào.

### E1. Thu nhập kỳ vọng mỗi giờ theo bản đồ (Hồn Tệ; hiện tại), một võ hồn Cường công ở cấp / hồn hoàn của lộ trình, chưa trang bị

| Bản đồ | Giây/con khi treo | Con/giờ khi treo | Tay: rơi tiền | Tay: bán đồ | Tay: phân giải | Tay: tổng/giờ | Treo: tổng/giờ | Treo/Tay | Lệnh 2h trả giá/giờ treo |
|---|---|---|---|---|---|---|---|---|---|
| Thánh Hồn Thôn | 4,1 | 500 | 2.027 | 833 | 235 | 3.095 | 2.906 | 0,94 | 250 (8,6% thu/giờ) |
| Tinh Đấu Ngoại vi | 4,2 | 500 | 7.345 | 2.557 | 312 | 10.214 | 9.695 | 0,95 | 250 (2,58% thu/giờ) |
| Tinh Đấu Nội địa | 5,3 | 500 | 26.869 | 15.377 | 312 | 42.558 | 40.780 | 0,96 | 250 (0,61% thu/giờ) |
| Lạc Nhật Sâm Lâm | 4,6 | 500 | 37.977 | 24.007 | 354 | 62.337 | 60.438 | 0,97 | 250 (0,41% thu/giờ) |
| Cực Bắc Chi Địa | 5,3 | 500 | 53.025 | 47.361 | 354 | 100.739 | 98.410 | 0,98 | 250 (0,25% thu/giờ) |
| Hải Thần Đảo | 5,4 | 500 | 55.250 | 62.482 | 354 | 118.086 | 106.772 | 0,9 | 250 (0,23% thu/giờ) |

Lệnh Ủy Thác: 500 Hồn Tệ cho 2 giờ treo thêm (tích tối đa 24 giờ); chỉ tiêu sau khi đã treo hết 12 giờ miễn phí.

### E2. 1 giờ tay: Hồn Tệ vào / ra theo ngày (hiện tại; 4 võ hồn đủ hồn cốt / hồn hạch ở sink một lần)

| Ngày | Bản đồ | Vào/ngày |   rơi tiền |   bán đồ |   phân giải trang bị | Ra: mảnh | Ra: một lần | Tồn | Tổng vào | Ra/Vào % |
|---|---|---|---|---|---|---|---|---|---|---|
| 7 | Thánh Hồn Thôn | 3.095 | 2.027 | 833 | 235 | 2.000 | 1.095 | 0 | 21.668 | 100 |
| 30 | Tinh Đấu Nội địa | 42.558 | 26.869 | 15.377 | 312 | 41.600 | 958 | 0 | 378.845 | 100 |
| 60 | Lạc Nhật Sâm Lâm | 62.337 | 37.977 | 24.007 | 354 | 41.600 | 20.737 | 0 | 1.794.039 | 100 |
| 90 | Cực Bắc Chi Địa | 100.739 | 53.025 | 47.361 | 354 | 98.600 | 2.139 | 0 | 3.702.564 | 100 |
| 120 | Cực Bắc Chi Địa | 100.739 | 53.025 | 47.361 | 354 | 98.600 | 2.139 | 0 | 6.724.746 | 100 |

Sink một lần (túi + hồn cốt + hồn hạch + trang bị) cạn ở ngày: chưa cạn trong 120 ngày.

### E2. 3 giờ tay: Hồn Tệ vào / ra theo ngày (hiện tại; 4 võ hồn đủ hồn cốt / hồn hạch ở sink một lần)

| Ngày | Bản đồ | Vào/ngày |   rơi tiền |   bán đồ |   phân giải trang bị | Ra: mảnh | Ra: một lần | Tồn | Tổng vào | Ra/Vào % |
|---|---|---|---|---|---|---|---|---|---|---|
| 7 | Tinh Đấu Ngoại vi | 30.642 | 22.034 | 7.672 | 935 | 26.400 | 4.242 | 0 | 171.781 | 100 |
| 30 | Cực Bắc Chi Địa | 302.218 | 159.075 | 142.082 | 1.061 | 226.800 | 75.418 | 0 | 3.897.851 | 100 |
| 60 | Hải Thần Đảo | 354.259 | 165.750 | 187.447 | 1.061 | 226.800 | 127.459 | 0 | 13.797.043 | 100 |
| 90 | Hải Thần Đảo | 354.259 | 165.750 | 187.447 | 1.061 | 226.800 | 127.459 | 0 | 24.424.799 | 100 |
| 120 | Hải Thần Đảo | 354.259 | 165.750 | 187.447 | 1.061 | 226.800 | 127.459 | 0 | 35.052.555 | 100 |

Sink một lần (túi + hồn cốt + hồn hạch + trang bị) cạn ở ngày: chưa cạn trong 120 ngày.

### E2. 3 giờ tay + 12 giờ treo (lộ trình theo 3 giờ): Hồn Tệ vào / ra theo ngày (hiện tại; 4 võ hồn đủ hồn cốt / hồn hạch ở sink một lần)

| Ngày | Bản đồ | Vào/ngày |   rơi tiền |   bán đồ |   phân giải trang bị | Ra: mảnh | Ra: một lần | Tồn | Tổng vào | Ra/Vào % |
|---|---|---|---|---|---|---|---|---|---|---|
| 7 | Tinh Đấu Ngoại vi | 146.979 | 108.519 | 36.053 | 2.407 | 98.600 | 48.379 | 0 | 823.211 | 100 |
| 30 | Cực Bắc Chi Địa | 1.483.142 | 789.075 | 691.534 | 2.533 | 226.800 | 1.256.342 | 0 | 18.953.802 | 100 |
| 60 | Hải Thần Đảo | 1.635.520 | 795.750 | 837.237 | 2.533 | 226.800 | 10.000 | 34.522.613 | 65.886.118 | 47,6 |
| 90 | Hải Thần Đảo | 1.635.520 | 795.750 | 837.237 | 2.533 | 226.800 | 10.000 | 76.774.220 | 114.951.725 | 33,2 |
| 120 | Hải Thần Đảo | 1.635.520 | 795.750 | 837.237 | 2.533 | 226.800 | 10.000 | 119.025.828 | 164.017.333 | 27,4 |

Sink một lần (túi + hồn cốt + hồn hạch + trang bị) cạn ở ngày: 35.

### E3. Tồn Hồn Tệ ngày 120 (chính sách tiêu hết mọi sink) theo hồ sơ × số võ hồn có đủ hồn cốt / hồn hạch × có mua mảnh Thương hội hay không (hiện tại)

| Hồ sơ | Mua mảnh, 1 võ hồn | Không mua mảnh, 1 võ hồn | Mua mảnh, 2 võ hồn | Không mua mảnh, 2 võ hồn | Mua mảnh, 4 võ hồn | Không mua mảnh, 4 võ hồn |
|---|---|---|---|---|---|---|
| 1 giờ tay | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 giờ tay | 0 | 18.216.450 | 0 | 17.523.450 | 0 | 16.137.450 |
| 3 giờ tay + 12 giờ treo (lộ trình theo 3 giờ) | 121.104.828 | 147.181.228 | 120.411.828 | 146.488.228 | 119.025.828 | 145.102.228 |
| 3 giờ tay + 12 giờ treo (lộ trình theo 15 giờ, cận trên) | 146.909.361 | 173.997.161 | 146.216.361 | 173.304.161 | 144.830.361 | 171.918.161 |

Sink một lần tối đa (túi + hồn cốt + hồn hạch + trang bị; không tính thời điểm có đồ để nâng, và trang bị còn bị đá / bùa chặn): 1 võ hồn = 16.796.105; 2 võ hồn = 17.489.105; 4 võ hồn = 18.875.105; mảnh Thương hội 27.216.000 sau 120 ngày.

### E4. Kịch bản chỉnh số (CHỈ ước lượng, không sửa shared/data.ts): hồ sơ "3 giờ tay + 12 giờ treo (lộ trình theo 3 giờ)", 4 võ hồn

| Kịch bản | Vào/ngày ở Lạc Nhật (ngày 30) | Vào/ngày ở Hải Thần (ngày 120) | Tồn ngày 120 | Ra/Vào % ngày 120 | Lệnh 2h / thu 2h treo Hải Thần % |
|---|---|---|---|---|---|
| Hiện tại | 1.483.142 | 1.635.520 | 119.025.828 | 27,4 | 0,23 |
| BEAST_COIN bậc 3–4 × 0,5 | 1.088.605 | 1.237.645 | 78.810.884 | 36,3 | 0,31 |
| BEAST_COIN bậc 2–4 × 0,5 | 1.088.605 | 1.237.645 | 77.478.818 | 36,7 | 0,31 |
| Giá bán đồ rơi (hồn cốt / hồn hạch / mảnh) × 0,5 | 1.137.375 | 1.216.902 | 78.875.777 | 36,3 | 0,31 |
| BEAST_COIN làm mượt (nội suy log) | 2.363.661 | 3.958.491 | 308.251.697 | 12,8 | 0,1 |
| BEAST_COIN làm mượt + mốc 100.000y = 2 × bậc 3 | 1.675.340 | 2.178.537 | 162.650.395 | 21,8 | 0,17 |
| Mọi nguồn vào × 0,5 (cận dưới) | 742.838 | 819.027 | 37.423.650 | 54,4 | 0,47 |

### E5. Vách đá BEAST_COIN: bản đồ có bao nhiêu con ≥ 10.000 / ≥ 100.000 năm, Hồn Tệ mỗi con, và số con cần để lên cấp

Hồn Tệ trung bình mỗi bậc: 10y=2, 100y=7, 1000y=27,5, 10000y=105, 100000y=550; vách đá 9.999 → 10.000 năm ×3,8, 99.999 → 100.000 năm ×5,2.

| Bản đồ | Niên hạn | % con ≥ 10.000y | % con ≥ 100.000y | % tiền từ ≥ 10.000y | HT/con (hiện tại) | HT/con (làm mượt) | Mượt/Hiện tại | KN/con (đã nhân hệ cấp) | Con để lên cấp (đầu / giữa / cuối dải) | HT mỗi cấp (đầu / giữa / cuối) |
|---|---|---|---|---|---|---|---|---|---|---|
| Thánh Hồn Thôn | 10–450 | 0 | 0 | 0 | 3,9 | 4,1 | 1,05 | 39 | 0,7 / 3,4 / 8,3 | 3 / 13 / 32 |
| Tinh Đấu Ngoại vi | 300–2.000 | 0 | 0 | 0 | 14,2 | 14,9 | 1,05 | 126 | 2,4 / 9,6 / 26 | 34 / 136 / 370 |
| Tinh Đấu Nội địa | 1.500–25.000 | 31,2 | 0 | 63,3 | 51,6 | 51,7 | 1 | 433 | 6,1 / 13,9 / 39,5 | 317 / 719 / 2.040 |
| Lạc Nhật Sâm Lâm | 5.000–30.000 | 60,3 | 0 | 85,3 | 74,2 | 72,7 | 0,98 | 619 | 7,7 / 14,6 / 44,7 | 573 / 1.080 / 3.316 |
| Cực Bắc Chi Địa | 20.000–80.000 | 100 | 0 | 100 | 105 | 219,8 | 2,09 | 1.362 | 7,9 / 11,7 / 21,9 | 828 / 1.225 / 2.294 |
| Hải Thần Đảo | 50.000–100.000 | 100 | 0 | 100 | 105 | 414,6 | 3,95 | 1.976 | 9,7 / 12,3 / 15,1 | 1.018 / 1.288 / 1.589 |
| Lõi Tinh Đấu | 100.000–100.000 | 100 | 100 | 100 | 550 | 550 | 1 | 2.500 | 9,7 / 10,8 / 12 | 5.352 / 5.962 / 6.606 |

"Con để lên cấp" = xpNeed(cấp) ÷ (XP_SHARE_ACTIVE × kinh nghiệm TB một con của bản đồ): CHỈ tính kinh nghiệm võ hồn ra trận (võ hồn dự bị nhận XP_SHARE_BENCH thêm, bình cảnh chặn lên cấp không tính).

### Kết quả chính (ước lượng, chưa đo)

1. **Hồ sơ không treo gần cân bằng.** 3 giờ tay: ~354 nghìn/ngày ở Hải Thần (rơi tiền ~166 nghìn + bán đồ ~187 nghìn); mua mảnh tối đa (226.800) cộng sink một lần tiêu hết, tồn 0. Không mua mảnh thì tồn ~16–18 triệu sau 120 ngày (cùng cỡ ~10 triệu của E7). 1 giờ tay: ~100 nghìn/ngày ở Cực Bắc, tiêu hết.
2. **Treo 12 giờ phá cân bằng.** 3 giờ tay + 12 giờ treo: ~1,5–1,64 triệu/ngày (gần số 1,9 triệu của #253, thấp hơn vì treo chặn theo nhịp thật). Sink một lần (túi + hồn cốt + hồn hạch + trang bị, 4 võ hồn ≈ 18,9 triệu **trần**) cạn ở **ngày ~35** (ngày 14 nếu lộ trình theo 15 giờ); sau đó mỗi ngày tồn thêm ~1,4 triệu (chỉ còn mảnh 226.800 + ngoại hình), tới **~119 triệu ngày 120, Ra/Vào 27%**. Số võ hồn trang bị gần như không đổi kết quả (mỗi võ hồn chỉ 693.000 phí hồn cốt + hồn hạch, bằng ~10 giờ treo): sink hồn cốt / hồn hạch **nhỏ**, sink lớn duy nhất là trang bị (15,9 triệu, nhưng bị đá / bùa chặn).
3. **`BEAST_COIN` không phải nguồn vào duy nhất.** Ở bản đồ sâu bán đồ rơi bằng ~½ thu nhập (Hải Thần tay: 62 nghìn bán đồ so với 55 nghìn rơi tiền mỗi giờ): hồn cốt từ 10.000 năm (4%) và hồn hạch (40%+) chủ yếu. Chỉ đổi `BEAST_COIN` sẽ không đủ nếu muốn hạ thu nhập cấp cao; giá bán (`CORE_SELL`, `BONE_SELL`, `RING_SELL`) cũng là núm.
4. **Ủy Thác Lệnh gần như miễn phí:** `AUTO_TOKEN_PRICE` 500 cho `AUTO_TOKEN_SECS` 2 giờ = 250/giờ, bằng 0,23% thu nhập một giờ treo ở Hải Thần (~107 nghìn/giờ), 0,6% ở Nội địa, 8,6% ở Thánh Hồn Thôn. Thêm 12 giờ treo (6 lệnh = 3.000 Hồn Tệ) đem lại ~1,3 triệu: lời hơn 400 lần. Giá không còn là quyết định; chỉ trần `AUTO_BONUS_MAX` còn giới hạn.
5. **Vách đá `BEAST_COIN` (E5):** `rollYears` tung đều theo log nên Nội địa (1.500–25.000 năm) có 31% con ≥ 10.000 năm mà chiếm 63% Hồn Tệ rơi; Lạc Nhật 60% con, 85% Hồn Tệ; Cực Bắc trở đi **mọi con** ở bậc 3 (hằng 105 từ 10.000 tới 99.999 năm). Vách thứ hai (100.000 năm) chỉ ở Lõi Tinh Đấu. Làm mượt nội suy log với mốc ở trung điểm mỗi bậc **giữ nguyên** Nội địa / Lạc Nhật (±2%) nhưng **×2,1 Cực Bắc, ×3,95 Hải Thần** (vì bậc 3 phẳng tới 100.000 năm): làm mượt không trung tính nếu không kèm hạ mốc bậc cuối.
6. **XP không phải nút thắt:** giữa dải cấp của bản đồ chỉ cần 3 con (Thánh Hồn Thôn) tới 15 con mỗi cấp (Nội địa / Lạc Nhật; chỉ tính 40% của võ hồn ra trận), mỗi cấp lên mang theo 13 → ~1.300 Hồn Tệ rơi (cột cuối E5).  Chưa có mục tiêu thời gian lên cấp: Chưa đánh giá.

### Phương án chỉnh số (CHỈ đề xuất; chủ repo quyết ở #907 / #908 / #909)

Tác động lấy từ E4 (hồ sơ 3 giờ tay + 12 giờ treo, 4 võ hồn); số "3 giờ tay" lấy từ bảng E4b của script (không chép vào đây):

| Phương án | Tác động ước tính | Đánh đổi |
|---|---|---|
| A. `BEAST_COIN` bậc 3–4 × 0,5 | Treo ở Hải Thần 1,64 → 1,24 triệu/ngày (−24%); tồn ngày 120: 119 → 79 triệu (−34%); 3 giờ tay: 354 → 271 nghìn/ngày (−23%) | người ít giờ cũng giảm; vẫn dư vì bán đồ không đổi |
| B. Giá bán hồn cốt / hồn hạch / mảnh × 0,5 | Treo 1,64 → 1,22 triệu/ngày; tồn 119 → 79 triệu; 3 giờ tay 354 → 261 nghìn | hồn cốt / hồn hạch dư kém giá trị; có thể kích thích dùng hết thay vì bán |
| C. Làm mượt `BEAST_COIN` (nội suy log, mốc trung điểm bậc) | Không giảm thu nhập: Hải Thần ×3,95 (treo 1,64 → 3,96 triệu/ngày); nếu hạ mốc 100.000 năm xuống 2 × bậc 3 (210): +33% (2,18 triệu), tồn ngày 120 ~163 triệu | chỉ sửa vách đá, phải kèm A hoặc B mới hạ được dòng tiền; đụng mã tính tiền (tay và offline) |
| D. Giá Ủy Thác Lệnh theo bậc (kiểu `shardBuyPrice`) hoặc theo bản đồ | muốn lệnh bằng ~10% thu 2 giờ treo ở Hải Thần cần ~21.000/lệnh (hiện 500, ×42); chỉ tăng `grow` kiểu mảnh sẽ không đủ vì 6 lệnh/ngày hiện chỉ 3.000 | đụng Q07 (tự săn); người mới ở Thánh Hồn Thôn (8,6%) không nên bị ép |
| E. Nâng `SHARD_BUY.grow` (sink lặp lại có sẵn) | mua đủ 10 mảnh/ngày: 1,5 → 226.800; 1,6 → 363.200; 1,7 → 573.200; 1,8 → 890.100; 2 → 2.046.000. Với 1,8 người 3 giờ tay (354 nghìn/ngày) không mua nổi đủ nữa, người treo hút ~890 nghìn/ngày (64% phần dư) | mảnh võ hồn đắt hơn cho người ít giờ (đã chốt #282); sink lặp lại duy nhất không giới hạn theo người chơi |
| F. Nâng `BONE_ENHANCE_FEE` / `CORE_ENHANCE_FEE` ×10 | thêm ~6,2 triệu mỗi võ hồn (cạn ngày ~35 → ~50 với 4 võ hồn: ~27 triệu tổng) | sink một lần: chỉ lùi ngày cạn, **không** giải quyết dư lâu dài (sau đó vẫn +1,4 triệu/ngày) |

Gợi ý hướng (không thay chủ repo): dư Hồn Tệ lâu dài chỉ giải bằng **sink lặp lại** (D, E) hoặc **hạ nguồn vào ở bản đồ sâu** (A + B, kèm C để sửa vách đá); F chỉ dời ngày cạn. Sau khi chỉnh số: chạy lại `npm run sim:econ --prefix server` để so trước / sau và `npm run test:econ` (bất biến dữ liệu).
