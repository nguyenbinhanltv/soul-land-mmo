# Băng Giáp Cự Quy — H4 #767

Part of #767, thuộc #766. Cặp raw candidate tiếp sau PR784 (Ám Kim Khủng Trảo Hùng 2/10 đã merge); tổng sau nộp cặp này là 4/10 raw, chưa hoàn thành whole issue.

A2 sinh trong fresh worker69, B2 trong fresh worker71, mỗi tờ 2/2 lượt rồi dừng. Builtin imagegen không trả model/seed, không có selector kích thước; không suy model từ harness. Raw giữ nguyên byte output, không cắt/resize/hậu kỳ/quantize/đổi metadata.

A thực tế1024×1536 đúng yêu cầu, 6×12 s/se/e. B thực tế1254×1254 **sai yêu cầu1024×1024**, 6×8 ne/n. Không lấy ngoại lệ hoặc duyệt H2/loài khác làm acceptance H4. 66/44 hình và 6/4 ô trống là quan sát raw; chưa cutter/preview/loop.

A reference duy nhất static đúng loài (identity). B xem/đính đúng static identity + A2 STYLE candidate, không phải A đã duyệt mỹ thuật/runtime hay pose template. Prompt script giữ nguyên trong `bang_giap_cu_quy-toA.md`/`-toB.md`; prompt thực `toA.prompt.txt`/`toB.prompt.txt` giữ nguyên khối gốc rồi thêm clarification. Nguồn/hash/header/inputroles/lịch sử/outputpath tại `toA.source.json`/`toB.source.json`; cả hai lượt và raw gốc giữ ở artifact workers69/71, không sửa.

## Tờ A — ô nghi lỗi (H/R và C tính từ1)

- r5-r8: SE is shallow three-quarter and head remains rather horizontal; owner must judge distinctness from E
- r5c5-c6 and r9c5-c6: hurt recoil / shut eyes not strongly readable
- r7c1-c6 and r11c1-c6: attack extension subtle; no obvious strong bite at all frames
- r4c3-c4: front-facing lowered/splayed death instead of pronounced sideways roll
- r8c3-c4 and r12c3-c4: body lowers but final lying silhouette may be insufficient
- reference palette/markings broadly followed but frost/shell detail simplified; no approval implied

## Tờ B — ô nghi lỗi (H/R và C tính từ1)

- grid: Both visually 6 columns x 8 rows, 44 figures, empty r4c5/r4c6/r8c5/r8c6.
- heading: B2 NE better, still fairly side-biased; N top protrusion suggests head away but lower protrusions remain face-like.
- hurt: Small head/neck change; recoil weak or ambiguous in r1c5-c6 and r5c5-c6.
- die: B1 r4c4 rotates sideways; B2 r4c4 possible duplicated head at right, direction/anatomy suspect. B2 N collapse lowers shell but lower face-like protrusion remains.
- loops: Idle/walk pose changes subtle, some near duplicates; smooth loops unproven without animation.
- margins_scale: No obvious touching/crossing at whole-sheet inspection; some scale/groundline variation, especially attack/death. Precise per-cell checks not run.
- background: Visually flat magenta; exact all-pixel FF00FF and outline hex not certified.
- style: Blue ice shell/brown thick limbs generally match A2. Static identity details not fully reproduced; candidate only.
- other: No visible labels/grid/text/aura/weapons/other species. B2 r4c4 anatomy suspect.

Owner repo cắt/preview/duyệt/nhập game. Worker chỉ bàn giao raw, chưa khẳng định hướng/anatomy/loop/runtime hoặc kích thước B đạt. Không sửa loài khác, runtime, client, manifest, server/shared/DB/balance.
