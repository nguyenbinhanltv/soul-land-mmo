# Bán hồn hoàn trong giả lập kinh tế (#1040)

Bổ sung cho mục "Dòng Hồn Tệ tổng theo ngày" của `trang-bi-kinh-te.md` (cùng giả định, cùng hồ sơ). Các bảng ở đó **không bán hồn hoàn**; ở đây bật thêm nguồn thu này. **Ước lượng, chưa đo; không đổi số cân bằng nào.**

Sinh bằng (`server/scripts/econ-sim.ts`, đúng hàm và bảng của `shared/data.ts`):
- `npm run sim:econ --prefix server -- --md --sell-rings`: bán **mọi** hồn hoàn rơi (bảng "bán mọi").
- `npm run sim:econ --prefix server -- --md --sell-rings=guard`: chỉ bán hồn hoàn dưới `AUTO_SELL_GUARD` (10.000 năm), giữ hồn hoàn lớn (bảng "chỉ dưới `AUTO_SELL_GUARD`").

## Luật server dựa vào

- Hạ **con nào cũng rơi 1 hồn hoàn** cùng số năm (`server/src/rooms/kill.ts`); tinh anh cũng vậy (mô hình lấy niên hạn trên của bản đồ).
- Thương nhân mua lại theo `ringSellPrice` (nằm trong `sellPrice`, bảng `RING_SELL`).
- Tự săn chỉ nhặt hồn hoàn theo bộ lọc `ring`, tối đa `OFFLINE.rings` mỗi lượt nhận (mô hình: 1 lượt nhận mỗi ngày).
- **Chưa trừ** (nên đây là **cận trên**): hồn hoàn giữ để hấp thụ (tối đa `MAX_RINGS`), thời gian về thành bán (mỗi hồn hoàn chiếm 1 ô túi, `stack` 1, `BAG_SLOTS`), tự bán từ xa mặc định tắt. Hai cột hồn hoàn của E1 tách phần dưới / từ `AUTO_SELL_GUARD` năm để thấy phần cần bật `high`.

## Kết quả

- Người săn tay ở bản đồ sâu thu nhập kỳ vọng/giờ cao gấp ~2–3 lần so với bảng không bán hồn hoàn (E1, cột "Tay: tổng/giờ"): Tinh Đấu Nội địa ~2,1×, Hải Thần ~2,9×. "Cận trên của thu nhập từ đồ" ở bảng chính chỉ đúng khi không tính hồn hoàn.
- Hải Thần, 3 giờ tay: ~354 nghìn → ~1,0 triệu/ngày (E2); tồn ngày 120 của hồ sơ 3 giờ tay không mua mảnh tăng từ ~16–18 triệu lên ~78–80 triệu (E3). Kết luận "hồ sơ không treo gần cân bằng" **chỉ đúng khi không bán hồn hoàn**.
- Từ Cực Bắc trở đi mọi con ≥ 10.000 năm: chế độ `guard` (giữ hồn hoàn lớn) gần như **không còn** thu nhập hồn hoàn; phần lớn tiền này cần bật `high` hoặc về thành bán tay.
- Các phương án A–F của #907 / #908 (bảng cuối `trang-bi-kinh-te.md`) lấy từ E4 **không bán hồn hoàn**; nếu chủ repo coi hồn hoàn là nguồn thu, cần đọc kèm E4 dưới đây (`RING_SELL` là một núm nữa, như `CORE_SELL` / `BONE_SELL`).

## E1. Thu nhập mỗi giờ theo bản đồ (bán mọi hồn hoàn)

| Bản đồ | Giây/con khi treo | Con/giờ khi treo | Tay: rơi tiền | Tay: bán đồ | Tay: phân giải | Tay: hồn hoàn <10.000y (bán) | Tay: hồn hoàn ≥10.000y (bán) | Tay: tổng/giờ | Treo: tổng/giờ | Treo/Tay | Lệnh 2h trả giá/giờ treo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Thánh Hồn Thôn | 4,1 | 500 | 2.027 | 833 | 235 | 2.002 | 0 | 5.097 | 2.912 | 0,57 | 250 (8,58% thu/giờ) |
| Tinh Đấu Ngoại vi | 4,2 | 500 | 7.345 | 2.557 | 312 | 8.447 | 0 | 18.661 | 9.722 | 0,52 | 250 (2,57% thu/giờ) |
| Tinh Đấu Nội địa | 5,3 | 500 | 26.869 | 15.377 | 312 | 17.784 | 27.784 | 88.126 | 40.927 | 0,46 | 250 (0,61% thu/giờ) |
| Lạc Nhật Sâm Lâm | 4,6 | 500 | 37.977 | 24.007 | 354 | 13.538 | 56.444 | 132.320 | 60.667 | 0,46 | 250 (0,41% thu/giờ) |
| Cực Bắc Chi Địa | 5,3 | 500 | 53.025 | 47.361 | 354 | 0 | 168.111 | 268.850 | 98.963 | 0,37 | 250 (0,25% thu/giờ) |
| Hải Thần Đảo | 5,4 | 500 | 55.250 | 62.482 | 354 | 0 | 220.575 | 338.661 | 107.499 | 0,32 | 250 (0,23% thu/giờ) |

Lệnh Ủy Thác: 500 Hồn Tệ cho 2 giờ treo thêm (tích tối đa 24 giờ); chỉ tiêu sau khi đã treo hết 12 giờ miễn phí.

## E1 (chỉ bán hồn hoàn dưới `AUTO_SELL_GUARD`)

| Bản đồ | Giây/con khi treo | Con/giờ khi treo | Tay: rơi tiền | Tay: bán đồ | Tay: phân giải | Tay: hồn hoàn <10.000y | Tay: hồn hoàn ≥10.000y (giữ) | Tay: tổng/giờ | Treo: tổng/giờ | Treo/Tay | Lệnh 2h trả giá/giờ treo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Thánh Hồn Thôn | 4,1 | 500 | 2.027 | 833 | 235 | 2.002 | 0 | 5.097 | 2.912 | 0,57 | 250 (8,58% thu/giờ) |
| Tinh Đấu Ngoại vi | 4,2 | 500 | 7.345 | 2.557 | 312 | 8.447 | 0 | 18.661 | 9.722 | 0,52 | 250 (2,57% thu/giờ) |
| Tinh Đấu Nội địa | 5,3 | 500 | 26.869 | 15.377 | 312 | 17.784 | 27.784 | 60.342 | 40.839 | 0,68 | 250 (0,61% thu/giờ) |
| Lạc Nhật Sâm Lâm | 4,6 | 500 | 37.977 | 24.007 | 354 | 13.538 | 56.444 | 75.876 | 60.483 | 0,8 | 250 (0,41% thu/giờ) |
| Cực Bắc Chi Địa | 5,3 | 500 | 53.025 | 47.361 | 354 | 0 | 168.111 | 100.739 | 98.410 | 0,98 | 250 (0,25% thu/giờ) |
| Hải Thần Đảo | 5,4 | 500 | 55.250 | 62.482 | 354 | 0 | 220.575 | 118.086 | 106.772 | 0,9 | 250 (0,23% thu/giờ) |

Lệnh Ủy Thác: 500 Hồn Tệ cho 2 giờ treo thêm (tích tối đa 24 giờ); chỉ tiêu sau khi đã treo hết 12 giờ miễn phí.

## E2. 3 giờ tay (bán mọi hồn hoàn)

| Ngày | Bản đồ | Vào/ngày |   rơi tiền |   bán đồ |   phân giải trang bị |   bán hồn hoàn | Ra: mảnh | Ra: một lần | Tồn | Tổng vào | Ra/Vào % |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 7 | Tinh Đấu Ngoại vi | 55.982 | 22.034 | 7.672 | 935 | 25.340 | 41.600 | 14.382 | 0 | 310.491 | 100 |
| 30 | Cực Bắc Chi Địa | 806.551 | 159.075 | 142.082 | 1.061 | 504.333 | 226.800 | 579.751 | 0 | 8.315.949 | 100 |
| 60 | Hải Thần Đảo | 1.015.984 | 165.750 | 187.447 | 1.061 | 661.725 | 226.800 | 10.000 | 4.906.090 | 35.863.395 | 86,3 |
| 90 | Hải Thần Đảo | 1.015.984 | 165.750 | 187.447 | 1.061 | 661.725 | 226.800 | 10.000 | 28.571.596 | 66.342.901 | 56,9 |
| 120 | Hải Thần Đảo | 1.015.984 | 165.750 | 187.447 | 1.061 | 661.725 | 226.800 | 10.000 | 52.237.102 | 96.822.407 | 46 |

Sink một lần (túi + hồn cốt + hồn hạch + trang bị) cạn ở ngày: 54.

## E3. Tồn Hồn Tệ ngày 120 (bán mọi hồn hoàn)

| Hồ sơ | Mua mảnh, 1 võ hồn | Không mua mảnh, 1 võ hồn | Mua mảnh, 2 võ hồn | Không mua mảnh, 2 võ hồn | Mua mảnh, 4 võ hồn | Không mua mảnh, 4 võ hồn |
|---|---|---|---|---|---|---|
| 1 giờ tay | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 giờ tay | 54.316.102 | 79.986.302 | 53.623.102 | 79.293.302 | 52.237.102 | 77.907.302 |
| 3 giờ tay + 12 giờ treo (lộ trình theo 3 giờ) | 183.380.338 | 209.764.538 | 182.687.338 | 209.071.538 | 181.301.338 | 207.685.538 |
| 3 giờ tay + 12 giờ treo (lộ trình theo 15 giờ, cận trên) | 224.209.141 | 251.348.241 | 223.516.141 | 250.655.241 | 222.130.141 | 249.269.241 |

Sink một lần tối đa (túi + hồn cốt + hồn hạch + trang bị; không tính thời điểm có đồ để nâng, và trang bị còn bị đá / bùa chặn): 1 võ hồn = 16.796.105; 2 võ hồn = 17.489.105; 4 võ hồn = 18.875.105; mảnh Thương hội 27.216.000 sau 120 ngày.

## E3 (chỉ bán hồn hoàn dưới `AUTO_SELL_GUARD`)

| Hồ sơ | Mua mảnh, 1 võ hồn | Không mua mảnh, 1 võ hồn | Mua mảnh, 2 võ hồn | Không mua mảnh, 2 võ hồn | Mua mảnh, 4 võ hồn | Không mua mảnh, 4 võ hồn |
|---|---|---|---|---|---|---|
| 1 giờ tay | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 giờ tay | 0 | 19.348.052 | 0 | 18.655.052 | 0 | 17.269.052 |
| 3 giờ tay + 12 giờ treo (lộ trình theo 3 giờ) | 121.943.672 | 148.327.872 | 121.250.672 | 147.634.872 | 119.864.672 | 146.248.872 |
| 3 giờ tay + 12 giờ treo (lộ trình theo 15 giờ, cận trên) | 147.074.172 | 174.213.272 | 146.381.172 | 173.520.272 | 144.995.172 | 172.134.272 |

Sink một lần tối đa (túi + hồn cốt + hồn hạch + trang bị; không tính thời điểm có đồ để nâng, và trang bị còn bị đá / bùa chặn): 1 võ hồn = 16.796.105; 2 võ hồn = 17.489.105; 4 võ hồn = 18.875.105; mảnh Thương hội 27.216.000 sau 120 ngày.

## E4. Kịch bản chỉnh số (bán mọi hồn hoàn)

| Kịch bản | Vào/ngày ở Lạc Nhật (ngày 30) | Vào/ngày ở Hải Thần (ngày 120) | Tồn ngày 120 | Ra/Vào % ngày 120 | Lệnh 2h / thu 2h treo Hải Thần % |
|---|---|---|---|---|---|
| Hiện tại | 1.994.107 | 2.305.968 | 181.301.338 | 20 | 0,22 |
| BEAST_COIN bậc 3–4 × 0,5 | 1.599.570 | 1.908.093 | 141.086.394 | 24,3 | 0,29 |
| BEAST_COIN bậc 2–4 × 0,5 | 1.599.570 | 1.908.093 | 140.062.129 | 24,3 | 0,29 |
| Giá bán đồ rơi (hồn cốt / hồn hạch / mảnh) × 0,5 | 1.648.340 | 1.887.350 | 141.120.887 | 24,3 | 0,3 |
| BEAST_COIN làm mượt (nội suy log) | 2.874.626 | 4.628.939 | 370.835.007 | 10,9 | 0,09 |
| BEAST_COIN làm mượt + mốc 100.000y = 2 × bậc 3 | 2.186.305 | 2.848.985 | 225.233.705 | 16,7 | 0,17 |
| Mọi nguồn vào × 0,5 (cận dưới) | 1.253.803 | 1.489.475 | 99.781.561 | 31,1 | 0,43 |
