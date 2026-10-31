# Hiệu năng hiệu ứng chiêu nhiều người

Đo (H8 / S5) trên Chrome thật dùng GPU (`--use-angle=d3d11`, RTX 3060 Ti, Windows 11, `--mute-audio`), qua trang thử `?thu=fx`, không cần server game.
Công cụ: `client/scripts/fx-measure.mjs` (đọc thời gian khung bằng `requestAnimationFrame` trong trang, bỏ 5 khung đầu; 5 giây khởi động rồi lấy mẫu 25–40 giây).

```bash
npm run build --prefix client
cd client && node node_modules/vite/bin/vite.js preview --port 4491 --host 127.0.0.1 --strictPort   # cổng riêng, tắt đúng PID của mình
node client/scripts/fx-measure.mjs fps [--cpu 4] [--secs 30] [--lv high|mid|low] [--mobile]   # bảng FPS 40 / 60 người, trước / sau
node client/scripts/fx-measure.mjs all [--lv ...] [--reduce]                                  # tung mọi chiêu hai vòng, đo texture / pool / heap, in lỗi console
```

## Kịch bản

`?thu=fx&stress=P&mix=t3&ct=P&lv=high`: P hồn sư cùng một màn (P = 40 hoặc 60), mỗi người tung một chiêu mỗi ~2,5 giây:
15 % là dung hợp (`FUSION_VISUAL`), 35 % T3 (vòng 10 / Chân Thân), 40 % T2 (vòng 5, 6, 8, 9, tiên cơ), 10 % T1; 30 % lượt là của chính mình, 70 % của người khác (bản nhẹ).
Mỗi lượt kèm hiệu ứng G3, tia lửa theo chất liệu. Đồng thời **P pháp tướng Chân Thân** (`PhapTuongSystem`, 25 võ hồn ngẫu nhiên, ra đòn liên tục). Mức Cao (xấu nhất).
`legacy=1` = hành vi trước H8: không tự hạ mức, người khác dùng cả trần sheet. Giả lập CPU chậm bằng `Emulation.setCPUThrottlingRate`.

## Bảng FPS (trung bình / p1 thấp nhất; mức hiệu ứng cuối lượt)

| CPU | Người | TRƯỚC (legacy) | SAU H8 | Mức hiệu ứng sau H8 | Sheet đang chạy (trần 24) |
|---|---|---|---|---|---|
| 1× | 40 | 104 / 95 | 105 / 95 | Cao | 20 → 13 |
| 1× | 60 | 104 / 95 | 104 / 94 | Cao | 23 → 21 |
| 4× | 40 | 102 / 95 | 102 / 95 | Cao | 24 → 16 |
| 4× | 60 | 102 / 95 | 103 / 95 | Cao | 23 → 11 |
| 20× | 40 | 63 / 33 | 62 / 33 | Cao → **Vừa** | 20 → 7 |
| 20× | 60 | 49 / 25 | **61 / 33** | Cao → Vừa → **Thấp** | 22 → 2 |
| Điện thoại ngang 844×390 @2×, 4×, mức Vừa | 40 | 102 / 95 | 103 / 95 | Vừa | 9 → 5 |
| Điện thoại ngang 844×390 @2×, 4×, mức Vừa | 60 | 102 / 96 | 102 / 95 | Vừa | 10 → 10 |

Đọc bảng:
- Trần của Chrome headless trên máy này là ~104 FPS; ở CPU 1× và 4×, cả 40 lẫn 60 người tung T2 / T3 + Chân Thân + dung hợp liên tục **không tụt** (cả trước lẫn sau): tải đồ họa của bản hiện tại nằm trong ngân sách ở máy đua này. Bộ điều tốc không kích hoạt, mức giữ Cao (đúng ý: không hạ khi không cần).
- Ở CPU 20× (mô phỏng máy yếu hơn nhiều), bản trước kẹt ở Cao với 49 FPS (p1 25) khi 60 người; bản sau tự hạ Cao → Vừa → Thấp và giữ **61 FPS (p1 33)**. Lúc này hạt về 0, sheet đồng thời còn 2.
- Còn lại ở 40 người 20×: 63 → 62 FPS (gần như không đổi vì ở mức Vừa hạt vẫn nhiều; bộ điều tốc dừng ở Vừa vì trung bình đã trên ngưỡng).
- Số "sheet đang chạy" sau H8 thấp hơn do trần riêng cho người khác (chiêu của mình vẫn được chỗ).
- Nhiễu giữa các lượt ở CPU giả lập cao khá lớn (±10 %); đọc xu hướng, không đọc từng con số.
- **Điện thoại thật chưa đo** (không có máy); giả lập 4× CPU + màn ngang cho thấy cùng kết luận. Cần chủ repo thử trên máy thật.

**Số nổi:** phép đo riêng bên dưới gọi `drawDamageText`, cùng hàm mà `GameScene.damageText` sử dụng, gồm nhánh Giảm chuyển động mới. `floatText` (tên chiêu / chữ như "Nở!", "Tiên cơ · …") chưa nằm trong bài đo. Chưa thay cách render hay thêm pool.

## Phép đo số sát thương nổi (40 người / 60 giây)

`node client/scripts/fx-measure.mjs damage` chạy sáu lượt: Cao, Thấp, Cao + Giảm chuyển động, mỗi mức lần lượt không / có số nổi. Dùng bản build local, không đăng nhập, không bot và không gọi prod. Tải nền `stress=40&mix=t3&ct=40&seed=1541&gov=0`: cùng seed riêng của harness (không thay RNG Phaser), tắt tự hạ mức để giữ đúng cấu hình đối chứng. Có 40 vị trí số, mỗi người 2 tin/giây, tuần tự damage / crit / DoT / heal / shield, mỗi loại 20%; một người nhận sát thương vào mình, những người còn lại nhận số gây ra. Đây là tải tổng hợp, không khẳng định tần suất combat thực tế. Nhánh tắt số vẫn tạo cùng tin nhưng bỏ lời gọi vẽ; không dùng chữ mẫu của nút Đánh thử.

Khởi động 5 giây sau khi font sẵn sàng, lấy mẫu 60 giây, rồi ngừng tạo số và timer tung chiêu, nghỉ 15 giây (cảnh vẫn cập nhật / render). Không gọi GC cưỡng bức trong toàn bộ phép đo. FPS p1 = nghịch đảo p99 thời gian rAF, bỏ 5 khung đầu. `PerformanceObserver` đếm longtask ≥50 ms trong đoạn tải. Mỗi 250 ms đếm Text trong display list và texture WebGL sống bằng bọc `createTexture` / `deleteTexture` trước khi Phaser khởi tạo; đỉnh là đỉnh lấy mẫu, không phải đỉnh tuyệt đối. Key texture Phaser ghi riêng vì Text có texture riêng không xuất hiện trong danh sách key.

Tốc độ tạo Text là số lời gọi vẽ/giây, texture là tổng `createTexture`/giây trong tải. Cấp phát JS dùng `HeapProfiler.startSampling` (32 KiB, gồm mẫu đã bị major/minor GC thu hồi), tổng trọng số mẫu chia thời gian tải; là ước lượng có chi phí profiler, không bao gồm canvas/native/VRAM. Heap `usedJSHeapSize` có trước tải / cuối tải / đỉnh lấy mẫu / sau nghỉ, bật `--enable-precise-memory-info`. Heap sau nghỉ không được dùng riêng để kết luận rò.

Tái lập từ gốc repo (Windows dùng `npm.cmd` nếu PowerShell chặn `npm.ps1`; hai terminal, giữ preview chạy tới khi đo xong):

```bash
npm run build
# Terminal 1:
cd client
node node_modules/vite/bin/vite.js preview --port 4491 --host 127.0.0.1 --strictPort
# Terminal 2, tại gốc repo:
node client/scripts/fx-measure.mjs damage --base http://127.0.0.1:4491
```

Chrome riêng dùng `--headless=new --mute-audio --use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist --enable-precise-memory-info`, cửa sổ 1280×720, zoom cảnh 2, CPU 1×. Script kiểm renderer và từ chối SwiftShader/software, chọn cổng CDP tự động, dọn đúng Chrome do nó bật. Chỉ chế độ `damage` cố định 60 giây; `--secs` thuộc bài FPS cũ.

Đo ngày 01/11/2026, nền main `f91c5dbb` (đã gồm thay đổi Giảm chuyển động) + harness của PR này: Windows 11 build 26200, i5-12400F, RAM 31,83 GiB, Chrome 156.0.8078.76, NVIDIA GeForce RTX 3060 Ti; renderer xác nhận `ANGLE … Direct3D11 vs_5_0 ps_5_0, D3D11`. Máy dùng chung với các phiên agent khác, không cô lập hệ thống; đóng cảnh preview phụ trong khi đo. Mỗi ca một lượt, chưa định lượng nhiễu bằng nhiều lần lặp. Thực phát 4.800–4.801 tin, chênh một tin tại biên 60 giây; mọi lượt có số đều tạo đúng 4.800 Text. Không có lỗi console.

| Ca / số nổi | FPS tb / p1 | Longtask (số / ms) | Text đỉnh / cuối / nghỉ | WebGL đầu / đỉnh / cuối / nghỉ | Text / texture tạo mới mỗi giây | JS cấp phát (MiB/s) |
|---|---|---|---|---|---|---|
| Cao / không | 104.9 / 95.2 | 0 / 0 | 0 / 0 / 0 | 788 / 788 / 788 / 788 | 0 / 0 | 51.01 |
| Cao / có | 104.8 / 95.2 | 0 / 0 | 106 / 80 / 0 | 788 / 894 / 868 / 788 | 80 / 160 | 54.01 |
| Thấp / không | 104.4 / 95.2 | 0 / 0 | 0 / 0 / 0 | 788 / 788 / 788 / 788 | 0 / 0 | 43.92 |
| Thấp / có | 104.5 / 96.2 | 0 / 0 | 106 / 80 / 0 | 788 / 894 / 868 / 788 | 80 / 160 | 47.20 |
| Giảm chuyển động / không | 104.6 / 95.2 | 0 / 0 | 0 / 0 / 0 | 788 / 788 / 788 / 788 | 0 / 0 | 50.28 |
| Giảm chuyển động / có | 105.0 / 94.3 | 0 / 0 | 106 / 80 / 0 | 788 / 894 / 868 / 788 | 80 / 160 | 52.86 |

| Ca / số nổi | Heap đầu / cuối / đỉnh / sau nghỉ (MiB) | Tin thực phát |
|---|---|---|
| Cao / không | 33.65 / 28.87 / 34.24 / 31.94 | 4800 |
| Cao / có | 31.58 / 27.96 / 49.42 / 35.73 | 4800 |
| Thấp / không | 60.13 / 46.74 / 62.56 / 48.59 | 4801 |
| Thấp / có | 54.97 / 57.85 / 66.97 / 53.55 | 4800 |
| Giảm chuyển động / không | 73.07 / 64.70 / 76.78 / 67.52 | 4801 |
| Giảm chuyển động / có | 69.99 / 63.71 / 83.53 / 75.10 | 4800 |

Key texture Phaser: mọi ca không số giữ 700; ca có số cuối tải 780, sau nghỉ 700. Texture WebGL đỉnh 894 gồm texture nền và Text; tốc độ tạo 160/giây là lời gọi WebGL (cả texture tạm tạo rồi xóa), không đồng nhất với số Text 80/giây. Sau nghỉ tất cả ca còn 0 Text và 788 texture WebGL, đúng mức nền.

Quan sát: bật số chưa làm giảm p1 rõ rệt trên máy / tải này, không ghi nhận longtask ≥50 ms; cấp phát lấy mẫu tăng nhưng heap tự nhiên dao động và mức đầu mỗi lượt khác nhau. **Chưa có căn cứ tối ưu hay thêm pool trong kịch bản này; giữ nguyên render.** Phép đo này không kết luận rò hoặc không rò. Nếu máy yếu / phòng thật sau này có giật, bước riêng nhỏ là lặp lại cùng cặp đối chứng trên máy đó và lấy profile quanh khung giật trước khi chọn cách sửa.

## Khi FPS thấp: CPU hay GPU?

Chạy cùng kịch bản hai lần: (a) `--cpu 4` giữ nguyên độ phân giải; (b) CPU 1× nhưng giảm kích thước cửa sổ một nửa. Nếu (a) tụt mà (b) không đổi thì nút thắt ở CPU (script, cấp phát, số đối tượng); nếu (b) cải thiện rõ thì ở GPU (đổ đầy điểm ảnh, lớp cộng sáng chồng nhau). Chỉ sửa phía đã xác định, rồi đo lại cùng kịch bản (vòng đo ở skill `soak-perf`). Công cụ hiện chưa đếm draw call; muốn đếm thì bọc lời gọi ở lớp WebGL của trang đo, đừng dựa vào bộ đếm có sẵn của Phaser (chưa xác minh).

## Kiểm tung mọi chiêu (`all`)

`__castAll`: 280 lần tung = 25 võ hồn × (9 hồn kỹ vòng 1–6, 8–10 + Chân Thân + tiên cơ) + 5 dung hợp, lần lượt, rồi chờ tan, rồi lặp lại lần hai (kèm hồn sư thử có pháp tướng ra đòn / bùng ở T3).

| Mức | Lỗi console | Texture trước → sau vòng 1 → sau vòng 2 | Pool sheet | Pool pháp tướng | Heap (sau gc) trước → sau |
|---|---|---|---|---|---|
| Cao | 0 | 688 → 688 → 688 | 24 (đúng trần) → 24 | 2 → 2 | 19,6 → 21,3 MB (+1,7) |
| Vừa | 0 | 688 → 688 → 688 | 10 → 10 | 2 → 2 | 20,0 → 20,5 MB (+0,5) |
| Thấp | 0 | 688 → 688 → 688 | 3 → 3 | 2 → 2 | 20,2 → 20,0 MB (−0,2) |
| Giảm chuyển động (Cao) | 0 | 688 → 688 → 688 | 24 → 24 | 2 → 2 | 19,2 → 20,4 MB (+1,2) |

Không rò texture, pool không lớn thêm ở vòng hai. Bài này chạy trên trang thử hiệu ứng (đúng `SkillVisualPlayer`, `SheetFx`, `PhapTuongSystem`, `ParticleLayer`), **không** phải `GameScene` trong phòng thật; bot server (`bot-test.mjs`) không dựng hình nên không đo được hiệu ứng.

## Âm thanh biến hình / tuyệt kỹ (C4)

175 clip T3 của C4 (nhóm `skill-t3-*`, tên qua `t3Group` ở `client/src/audio/soundMap.ts`) được `AudioManager.handleFx` gọi cho tuyệt kỹ, Chân Thân và biến hình; chi tiết ở `docs/art/am-thanh.md`. `npm run test:audio` kiểm đủ 25 võ hồn × (tuyệt kỹ, Chân Thân × 3 pha, biến hình) có mẫu trong gói `skill`, đúng nhóm được gọi, người khác giãn nhịp / nhỏ hơn / không hạ nhạc nền.

## Cân âm lượng (G8)

`node tools/audio/measure-sfx.mjs` giải mã gói âm thanh thật bằng Chrome headless (`--mute-audio`) và đo RMS từng nhóm. Trước G8 mọi clip chỉ cùng đỉnh −3 dB nên độ to chênh tới ~14 dB giữa các nhóm (từ −14 dB gầm boss đến −29,6 dB hồn hoàn rơi; tuyệt kỹ T3 −25 … −29 dB nhỏ hơn cả hồn kỹ thường −17 … −25 dB). Sau khi cân (`GROUP_TRIM_DB`): vung / va chạm ≈ −22, hồn kỹ ≈ −23, T3 ≈ −21 … −23, thú ≈ −22, bước chân ≈ −34, môi trường −26 … −30, giao diện ≈ −22, PK −18 … −22 (chênh trong loại ≤ 2 dB). Đỉnh được chừa ≥ 1,5 dB dưới 0 dBFS; phần còn lại do bộ nén chung lo.

## Còn thiếu

- **Chưa đo kéo dài trên điện thoại thật:** cần một lượt ≥ 5 phút (`?thu=fx&stress=40`) để thấy nhiệt làm tụt FPS; so FPS phút đầu và phút cuối, ghi mức mà `FxGovernor` chọn. Lượt 25–40 giây ở trên không thấy được.
- **Số nổi đã có phép đo cấp phát / longtask 60 giây trên PC:** xem bảng trên; chưa đo `floatText`, phòng thật, điện thoại, hoặc nhiều lượt lặp để định lượng nhiễu. `all` cũ chỉ đọc heap sau gc. Hai ứng viên dưới đây vẫn cần phép đo riêng theo đúng đường vẽ trước khi quyết định tối ưu.
- **Khởi động trước pool (pre-warm):** pool sheet tăng dần tới trần trong vòng đầu; chưa biết lần dùng đầu có giật không. Không sửa nếu số đo không có giật.
- **`dropGlint` tạo `Graphics` mới mỗi lần** (vẽ lại bằng `onUpdate`): ứng viên cho pool nếu phép đo trên cho thấy cấp phát nhiều. Chỉ đo, chưa sửa.

Một số ý (vòng đo, phân loại CPU / GPU, nhiệt khi chạy lâu) phỏng theo skill `performance-optimization` của [awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) (Apache-2.0), viết lại cho Phaser 3 + Colyseus của repo này.

## Issue liên quan
#491 (H8 / S5), #579 (C4), #399 (G8), #1541 (đo số nổi), #1543 (Giảm chuyển động của số nổi).
