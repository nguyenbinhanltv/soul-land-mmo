# Cảm giác đánh, hiệu ứng chiêu và pháp tướng

Phần hiển thị của chiến đấu, **chỉ ở client**: không đổi luật, số, state hay nhịp mạng (trừ khi ghi khác). Số liệu ở `shared/data.ts` và hằng trong mã client (tên trong dấu `code`). Đặc tả từng chiêu, công thức làm ảnh: `docs/art/ky-nang-combat-dac-ta.md`, `docs/art/ky-nang-cong-thuc.md`. Số đo hiệu năng: `docs/tech/hieu-nang-hieu-ung.md`. Âm thanh: `docs/art/am-thanh.md`.

## 5.12 Cảm giác đánh và hiệu ứng chiêu (phần hiển thị; âm thanh ở `docs/art/am-thanh.md`)

### Cảm giác đánh khi trúng đòn
Mã ở `client/src/combatFx.ts`.

**Mọi hồn thú bị đánh** (tin `dmg` có `bid`):
- Nháy trắng 50 ms; đẩy lùi vài pixel khỏi người đánh (chỉ hình); tia va chạm theo hệ võ hồn của người đó (`HIT_SPARK`).
- Người đánh là `by` (id hồn sư), server gửi kèm tin `dmg`. Sát thương theo thời gian (độc, lửa, lan Cảm điện) kèm cờ `dot` và không có các hiệu ứng này.
- **Hồn thú thường** không rung, không phóng to, không dừng hình (vẫn nháy, tia, bụi, số, âm thanh).

**Khi người đánh là chính mình và hồn thú là tinh anh trở lên** (`beastJerk`):
- Dừng hình 40–80 ms (theo sát thương / sinh lực tối đa; chí mạng thêm; hạ thú 80 ms). Chỉ làm chậm tween và animation cục bộ.
- Rung: nhẹ khi chí mạng, vừa với thú vương / boss trúng mạnh, mạnh khi hạ boss (`SHAKE_TIER`). Chí mạng phóng 1,05 trong 150 ms.
- **Đang tự săn:** chỉ còn thú vương / boss thế giới có các hiệu ứng này; rung từ hồn kỹ vùng / Tiên cơ của mình cũng tắt.

**Các trường hợp còn rung:** tinh anh nổi Cuồng nộ; thú vương gầm; chính mình trúng chiêu mạnh / hấp thụ hồn hoàn; chính mình biến hình Chân Thân / tung Tuyệt kỹ; hai người dung hợp (người khác tung, kể cả ở gần, không chớp / rung màn mình); người tung Tiên cơ nổ / lướt (chỉ chính người đó); vùng hồn kỹ có cờ `shake` ở gần.

**Hồn thú bị hạ và hồn hoàn:**
- Hồn thú biến mất ngay sau một đòn vừa trúng mà sinh lực đã biết ≤ sát thương đòn đó (chắc bị hạ) thì tan thành bụi sáng màu niên hạn.
- Hồn hoàn vừa rơi gần chỗ hồn thú bị hạ có vòng sáng màu niên hạn bay lên.
- Dùng hồn kỹ: vòng sáng lan dưới chân kèm tia sáng bay lên theo màu vòng (vòng hồn hoàn dưới chân vẫn như mục 5.2).

**Chiêu báo trước của hồn thú:** vòng đỏ thu dần quanh chân; hồn thú ngả ra sau lấy đà (ngược hướng nhìn trên màn hình isometric).

**Ngoại lệ:** sát thương vào khiên Bá Thể của boss thế giới cố ý không có hiệu ứng.

**Giới hạn và tùy chọn:**
- Hạt dùng một lớp chung có trần theo mức (`PARTICLE_CAP`).
- Bảng **Cài đặt**, lưu `localStorage` khóa `soul-land-fx-v1`:
  - **Hiệu ứng hình ảnh** Thấp / Vừa (mặc định) / Cao. Thấp: không hạt, rung, dừng hình, zoom.
  - **Rung màn hình** Tắt (không rung, zoom, dừng hình) / Chỉ boss (mặc định, như trên) / Đầy đủ (thêm rung, zoom, dừng hình khi đánh hồn thú thường, trừ lúc tự săn).
  - **Giảm chuyển động**: tắt rung, dừng hình, zoom, nháy trắng; mặc định theo `prefers-reduced-motion`.

### Hiệu ứng hồn kỹ theo hệ
Mã ở `client/src/skillFx.ts`, `skillCine.ts`.

- Khi nhận tin `fx` `soulring` (hồn kỹ vòng 1–10 hoặc Chân Thân), client dựng một trong **5 kiểu** (phóng, vùng tròn, chém, hào quang buff, tia trúng) × **8 hệ** (Hỏa, Băng, Lôi, Độc, Quang, Ám, Mộc, Phong; cùng bảng hệ với âm thanh, `elementOf`).
- **Bảng hiển thị** `skillFxOf(mã võ hồn, vòng, chânThân)` ánh xạ mọi hồn kỹ sang kiểu và hệ; ngoại lệ ở `OVERRIDE`.
  - Kiểu theo `area`: `proj` phóng, `around` vùng tròn, `front` / `dash` chém, `self` hào quang, `target` tia trúng.
  - Hệ theo trạng thái chiêu gây ra (Thiêu đốt → Hỏa, Cảm điện → Lôi, Trúng độc → Độc, Câm lặng → Ám); không có thì theo hệ võ hồn.
  - Màu niên hạn của vòng pha vào hạt.
- Mỗi hệ có 5 texture tĩnh `fx_<hệ>_<kiểu>` (hệ: `lua`, `bang`, `loi`, `doc`, `quang`, `am`, `moc`, `phong`; kiểu: `cau`, `phu`, `chem`, `ngon`, `tia`), vẽ cộng sáng. Chuyển động bằng Phaser (bay, nở thành bậc, mờ dần, hạt); vị trí và cỡ làm tròn theo bội `SPR` để bám lưới pixel.
- Pool sprite, trần sprite và hạt theo mức Hiệu ứng: Thấp tối đa 4 sprite, không hạt; Vừa 14; Cao 30.

**Cảnh hồn kỹ lớn** (vòng 7+ và Chân Thân): tối màn, chân dung võ hồn trượt ngang ~0,6 s, tên chiêu chữ lớn.
- Mức Vừa chỉ với người dùng chiêu và người trong `CINE_NEAR` pixel; Cao với mọi người đang đồng bộ; Thấp không có.
- Giảm chuyển động chỉ hiện tên chiêu mờ vào / ra. Nút **Cảnh hồn kỹ lớn** trong Cài đặt tắt hẳn.
- Người xem chưa có hồn sư của mình (đang vào phòng) coi như ở gần.
- Biến hình Chân Thân: tin `fx` `soulring` của lúc biến hình mang cờ chỉ-để-hiển thị `av`, nên client không dựng hiệu ứng hồn kỹ vòng 7; cảnh lớn do tin `avatar` dựng với tên Chân Thân.

### Khung hiệu ứng chiêu theo tầng (S1)
Không đổi số, luật; rung màn vẫn chỉ boss.

- Bảng `SKILL_VISUAL` (`client/src/skillVisual.ts`, khóa `<mã võ hồn>:<vòng 0..9>` hoặc `:ct`; tiên cơ `:tc`, gọi ở `tienCoFx`) khai báo từng chiêu:
  - **Tầng:** T1 vòng 1–4; T2 vòng 5, 6, 8, 9 + tiên cơ; T3 vòng 10 và Chân Thân.
  - **Độ nặng** 0..3.
  - Sheet: vị trí `at` (cast / target / travel), 1 hoặc 8 hướng, cỡ, fps, màu nhân.
  - Lớp lấy đà `windupSheet` (phát ở người tung ngay khi tung, sheet chính không bị trễ), dư chấn `aftershock`, `replace`.
- Chiêu chưa có mục hoặc chưa có sheet chạy đúng hiệu ứng theo hệ ở trên. Sheet mặc định chồng lên hiệu ứng theo hệ; `replace` mới thay (hiệu ứng theo hệ chỉ còn hạt, `PlayOpts.partsOnly`).
- Trình phát `SheetFx` (`fxSheet.ts`): lớp cộng sáng, pool `Image` + mảng ô định sẵn (không tạo object mỗi khung), trần theo mức Hiệu ứng. Giảm chuyển động chỉ một khung giữa mờ vào / ra.
- Người khác thấy bản nhẹ (nhỏ, mờ, không lấy đà / dư chấn).
- T3 có mục thì gọi hoạt ảnh đánh pháp tướng (`PhapTuongSystem.strike`) cùng cảnh cận có sẵn.

**Cách vẽ sheet chiêu**
- Thân sheet vẽ thường (`normal`, giữ màu và viền trên nền sáng); lớp sáng `fx_sk_<tên>_g` cộng sáng với độ đục theo mức (Thấp không vẽ).
- Vùng tự vừa bán kính chiêu (`fit`). Chiêu trúng nhiều lần / đợt phát lại theo `n`, `every` của chiêu (`repeat`).
- Đạn bay (`at: "travel"`, `rotate`) xoay ảnh theo hướng bay và xòe quạt hoặc vòng theo `n` / `spread` của chiêu (`CastCtx.spread`).
- Chiêu hào quang của hệ Phụ trợ phát ở người tung; chiêu lướt phát ở điểm trúng như vệt chém.
- Chiêu hào quang `at: cast` theo `scale`; chiêu phóng nhiều viên làm thành loạt tỏa quanh người tung (sheet một hàng chỉ lật ngang nên không có hướng).
- **Dung hợp kỹ** (`FUSION_VISUAL`, khóa theo tên chiêu): sheet bùng ở điểm giữa hai người, thay đóa kính dựng bằng code và bỏ rung màn khi có sheet.
- Sheet và cách làm (endpoint `/v2/vfx`, prompt, hậu kỳ thang 7 màu, trần sheet đồng thời): `docs/art/ky-nang-cong-thuc.md`; công cụ `tools/assets/skill-vfx/` (đặc tả từng lô ở `lo-a.json`, `lo-b.json`; `--spec <file>` cho `run` / `post` / `reg`).

### Cảm giác đánh theo độ nặng đòn
Mã ở `hitFeel.ts`.
- **Độ nặng đòn** (`hitWeight`): tỉ lệ sát thương, chí mạng, kết liễu, độ nặng chiêu mình vừa tung. Quyết định:
  - khựng (`hitstopMs` + `HEAVY_STOP_MS`, trần `HITSTOP_MAX`);
  - giật lùi thân quái (`KNOCK_PX`, chỉ hình);
  - số tia.
- Tia lửa / mảnh vỡ theo chất liệu mục tiêu (`MATERIAL_SPARK`, cùng bảng chất liệu với âm thanh).
- Số sát thương viền theo hệ người đánh; chí mạng chữ to hơn.

### Mức hiệu ứng thực và bộ điều tốc
Mã ở `combatFx.ts`, `combatFeelRules.ts`.
- **Mức thực** `fxLevel()` = mức người chơi chọn (Thấp / Vừa / Cao), hạ thêm khi FPS thấp nếu bật "Tự hạ khi giật" (`fxPrefs.auto`, mặc định bật; bảng Cài đặt). MỌI nơi vẽ hiệu ứng (sheet chiêu, hạt, tia lửa, cảnh cận, pháp tướng, hào quang hồn hoàn, sương mù) đọc `fxLevel()`, không đọc `fxPrefs.level`.
- **Bộ điều tốc** `FxGovernor` (hằng `GOV`):
  - Lấy trung bình trượt thời gian khung.
  - Chậm hơn `GOV.SLOW_MS` quá `GOV.DROP_AFTER` thì hạ một bậc (sàn Thấp); nhanh hơn `GOV.FAST_MS` đủ `GOV.RISE_AFTER` thì nâng lại một bậc.
  - Không bao giờ vượt mức đã chọn và không đổi lựa chọn đã lưu. Khung dài bất thường (đổi tab) bỏ qua.
- **Trần đồng thời:** `SHEET_CAP` theo mức (`fxSheet.ts`). Chiêu của người khác chỉ dùng tới `SHEET_TUNE.othersK` của trần đó, phần còn lại dành cho chiêu của chính mình. Bản nhẹ của người khác (nhỏ, mờ, không lấy đà / dư chấn / lớp sáng); mức Thấp bỏ lớp cộng sáng của pháp tướng người khác.
- **Chớp / rung màn** chỉ khi chính mình biến hình / tung tuyệt kỹ, hoặc là một trong hai người dung hợp. Người khác tung (kể cả ở gần) không chớp hay rung màn mình.
- **Giảm chuyển động** tắt hẳn chớp, rung, khựng, phóng to, tối màn, bay của sheet (một khung giữa mờ vào / ra).
- **Điện thoại ngang:**
  - Viền vùng báo trước của quái vẽ ở lớp `teleTop` (trên mọi hiệu ứng chiêu, dưới tên / số sát thương) nên sheet và hạt không che.
  - Cảnh cận của người khác không hiện trên màn chạm.
  - Màn thấp (≤ 480 px cao) thu nhỏ chân dung / tên chiêu và đưa lên cao.

### Âm thanh chiêu cấp T3
`handleFx` (`AudioManager.ts`) dùng nhóm `skill-t3-<ult|ct|avatar>-<mã võ hồn>[-pha]` (`t3Group`, `soundMap.ts`):
- Áp dụng cho tuyệt kỹ vòng 10, hồn kỹ Chân Thân (cả pha bay / nổ của chính chiêu đó trong `T3_WINDOW_MS`) và tiếng biến hình; đủ 25 võ hồn, thiếu mẫu thì lùi về tiếng theo hệ. Pha nổ nhận ra qua `id` người tung trong tin `fx` `wave` / `burst` của `runSkill` (chỉ để hiển thị). Tan Chân Thân không tiếng.
- Người khác nhỏ hơn (`T3_OTHERS_GAIN`), giãn nhịp (`T3_OTHERS_GAP_MS`) và không hạ nhạc nền.
- Trần chung `AUDIO_MAX_ACTIVE` tiếng, tiếng gần thắng tiếng xa.

### Chuyển động phụ của phụ thể
Mã `client/src/spiritMotion.ts`. Không ảnh mới.
- Phụ thể võ hồn (lớp sau và lớp trước của hồn sư, ảnh tĩnh theo khung thân, mục 5.11) có chuyển động phụ vẽ bằng biến đổi Phaser trên sprite có sẵn (xoay / co giãn / lệch quanh điểm xoay `SPIRIT_PIVOT`, không tạo object mỗi khung).
- Bảng `SPIRIT_FAMILY` xếp 25 võ hồn vào **7 họ**: cánh, đuôi / tai, vũ khí cầm tay, vật bay, hư ảnh, cây, chân / rắn.
- Bảng `SPIRIT_MOTION` đặt biên độ và chu kỳ từng họ theo **trạng thái**:
  - đứng: thở, chao;
  - đi: nhịp theo bước;
  - đánh: lấy đà ngược rồi giật / vung theo thời lượng hoạt ảnh `attack`;
  - thi triển (`cast`): mạnh hơn, hướng lên;
  - cộng giật lùi ngắn khi bị đánh.
- Hai lớp dùng chung một tư thế (hai nửa ảnh không rách). Độ lệch ngang và góc xoay đổi dấu theo hướng hiển thị `lpcFace` (hướng lật). Mỗi người lệch pha riêng theo mã (`spiritPhase`) để đông người không vỗ cánh đồng loạt.
- **Mức:** theo `fxLevel()`: Thấp `SPIRIT_LEVEL_K.low`, Vừa chuẩn, Cao rõ hơn. **Giảm chuyển động tắt hẳn** (ảnh gốc). Người khác nhẹ hơn chính mình (`SPIRIT_OTHER_K`). Gục / hấp thụ thì không chuyển động.
- Phụ thể vẽ bằng code (võ hồn chưa có ảnh thật) dùng cùng bảng. Hồn sư không chuyển động ở mục khác (bay, pháp tướng, vòng hồn hoàn) giữ nguyên.

### Trang thử và kiểm
- Trang `?thu=fx` (không cần đăng nhập, `client/src/fxTest.ts`): chọn hệ / kiểu / hồn kỹ có thật / niên hạn / mức, lặp.
  - `stress=<số người>` đo hiệu năng; `stress=P&sheets=0` tắt phần sheet để so FPS; `mix=t3&ct=P` thêm P pháp tướng; `legacy=1` là bản trước H8; `__castAll` tung mọi chiêu hai vòng.
  - "Đánh thử" (chất liệu, độ nặng, chí mạng); phát sheet khi chọn hồn kỹ.
  - `skill=<mã>:<khóa>`, `sv=0` (bản trước), `lv`, `reduce`, `others`; game thật có `?sv=0`.
- Trang `?thu=phuthe` (trước / sau, đổi võ hồn, hướng, trạng thái, mức; `?thu=phuthe&n=40` để đo).
- Kiểm:
  - `npm run test:skillvisual --prefix client` (khóa là chiêu có thật, sheet + lớp sáng có trong manifest, bảng đủ chiêu);
  - `npm run test:combatfeel` (bộ điều tốc), `npm run test:audio` (T3 đủ 25 võ hồn, giãn nhịp), `npm run test:spiritmotion --prefix client`;
  - `node client/scripts/fx-measure.mjs all` (không lỗi console, không tăng texture / pool).

## 5.18 Võ Hồn Chân Thân: pháp tướng
Hình ảnh của Võ Hồn Chân Thân (vòng 7, luật ở mục 5.1) **không biến hồn sư thành sinh vật**: hồn sư giữ nguyên, **cả 25 võ hồn** hiện **pháp tướng**, hư ảnh võ hồn khổng lồ sau lưng. Chỉ là hình ảnh: server, giao thức và số cân bằng không đổi (client đã biết võ hồn và đang Chân Thân qua tin `fx` / `avatar`).

### Ảnh và hoạt ảnh
- **Khung và hướng:** 160×160, nền trong suốt, **một lớp cho cả khung ở mỗi hướng**.
  - SAU thân hồn sư ở `s`, `se`, `e`; TRƯỚC thân (mờ 70%) ở `ne`, `n`.
  - 5 hướng vẽ thật `s`, `se`, `e`, `ne`, `n`; ba hướng còn lại lật gương.
  - Gốc khung khớp gốc thân hồn sư 64×64 (điểm gắn, lớp theo hướng, nhóm bố cục: `docs/art/phap-tuong.md`).
- **Hoạt ảnh:** một vòng lặp "thở" cho đứng / đi và một động tác đánh / niệm; không có khung trúng đòn / gục riêng.
- **Nguồn ảnh:** concept pháp tướng là ngoại lệ về nguồn ảnh tĩnh (chủ repo chốt, #482): một ảnh tĩnh cho mỗi võ hồn, rồi xoay hướng và hoạt ảnh pháp tướng. Phạm vi nguồn ảnh và giấy phép: `docs/art/nguon-giay-phep.md` (mục 5.11); mỗi ảnh đưa vào game phải được chủ repo duyệt.
- Bảng 25 võ hồn (hình, màu, vị trí, chuyển động, hồn kỹ Chân Thân / tuyệt kỹ / tiên cơ, prompt) và mục "Nguồn LPC kết hợp": `docs/art/phap-tuong.md`. Công thức làm ảnh: `docs/art/phap-tuong-cong-thuc.md`.

### Khung code
- Khi `PlayerState.ava > 0` hồn sư giữ nguyên cỡ, sau lưng hiện pháp tướng.
- Mọi số ở `PHAP_TUONG` / `PT_*` trong `shared/data.ts`; code ở `client/src/phapTuong.ts` (hệ thống) và `phapTuongMath.ts` (hàm thuần, test `npm run test:phaptuong --prefix client`). Trang thử `?thu=phaptuong` (không cần đăng nhập).
- **Sheet** `pt_<mã võ hồn>`:
  - Khung `PT_FRAME`; hàng = 5 hướng `PT_DIRS` (sw / w / nw lật gương); 16 cột (8 "thở" + 8 "đánh"); gốc `PT_ORIGIN` trùng chân hồn sư.
  - Hướng `PT_BACK_DIRS` vẽ sau thân; ne / n vẽ trước thân, đục × `PT_FRONT_ALPHA`.
  - Ảnh thật nằm ở manifest (`pt_*`, `iso: true`); hoạt ảnh nướng sẵn trong khung nên bảng chỉ để `pulse`. Test đối chiếu cỡ / độ lệch với bảng.
  - Võ hồn chưa có ảnh thì client vẽ sheet tạm bằng code (`ensurePtSheet`) và tự dùng ảnh thật khi manifest có. Ảnh tĩnh 5 khung vẫn dùng được.
- **Lớp phát sáng riêng** `pt_<mã>_glow` (tùy chọn, cùng bố cục sheet thân, màu đã nướng sẵn): có thì lớp cộng sáng dùng nó, không tô màu; chưa có thì dùng lại sheet thân tô màu võ hồn.
- **Hai công thức** (`PhapTuongDef.formula`):
  - "sinh vật": có sheet hoạt ảnh.
  - "vật thể": ảnh tĩnh, chuyển động bằng code theo `PtMotion` (lơ lửng, lắc trễ pha, xoay quanh `pivot`, vung / lao khi đánh, sáng nhịp). Nhóm này làm bằng `tools/assets/phaptuong-khi.mjs` (thở, đánh, hạt, vòng sóng nướng sẵn trong 80 khung; bảng `PHAP_TUONG` chỉ để `pulse`, các số bob / lắc / vung / lao bằng 0 để không nhân đôi chuyển động).
  - `scale`, `dx`, `dy` đặt hình quanh gốc; `hat` chọn kiểu hạt theo hệ.

### Hành vi
- **Biến hình** `PT_FORM` (~1,2 giây, bằng code): vòng sáng → cột sáng màu võ hồn → pháp tướng hiện từ dưới lên → gầm / vung → giữ. Hết Chân Thân (hoặc gục) thì tan thành bụi sáng.
  - Cảnh cận hồn kỹ lớn giữ nguyên. Tin `fx` `avatar` bật chuỗi; người vào phòng thấy đang Chân Thân thì vào thẳng giai đoạn cuối.
  - Thấp / Giảm chuyển động chỉ còn đổi hình mờ dần, không cột sáng.
- **Đánh** `PT_STRIKE`: tin đánh / hồn kỹ của hồn sư → lấy đà, ra đòn, dừng hình 2–3 khung + chớp sáng tại chỗ, thu về. Không rung màn hình (chỉ rung khi đánh boss, mục 5.12).
- **Tiến hóa theo vòng** `PT_STAGES` (số vòng hồn hoàn đã đồng bộ `PlayerState.rings`): vòng 7 hư ảnh mờ, 8 rõ hơn + hạt, 9 hào quang đầy đủ, 10 bùng hết cỡ. Tung tuyệt kỹ (`fx` `ult`) bùng hết cỡ `PT_BURST_SEC` giây ở mọi bậc.
- **Cut-in** `PT_CUTIN_SEC`: khi mình bật Chân Thân, chân dung pháp tướng (khung hướng `s`) lướt ngang màn hình. Chỉ chính mình thấy; nút "Cut-in Chân Thân" ở cài đặt hiệu ứng (`soul-land-fx-v1`, trường `cutin`); không hiện khi Giảm chuyển động hoặc mức Thấp.
- **Hai pháp tướng cùng lúc** (cho dung hợp kỹ): `PhapTuongSystem.setExtra(id, mã võ hồn)` hiện hình thứ hai hòa với hình chính (`PT_DUO`).

### Mức hiệu ứng
- Người khác thấy nhẹ hơn mình (`PT_OTHERS_K`).
- Thấp: không hạt, không cột sáng, hiện đổi hình mờ. Giảm chuyển động chỉ giữ ảnh tĩnh (không chuyển động code, không hạt, không cut-in).
- Sprite lấy từ pool; hạt qua `ParticleLayer` dùng chung (trần theo mức). Pháp tướng nằm dưới lớp thanh máu / vòng cảnh báo của hồn thú.

## Lịch sử / issue liên quan
- Cảm giác đánh G1 #392; hiệu ứng theo hệ G3 #394; khung hiệu ứng chiêu S1 #542, S2 #548, S3 #566 (lô A) và #567 (lô B).
- Hoàn thiện hiệu ứng H8 / S5 #491 (bộ điều tốc, trần đồng thời); âm thanh T3 C4 #579; chuyển động phụ của phụ thể H7 #490.
- Pháp tướng #482 (khung code H2 #486; hai pháp tướng cho dung hợp kỹ H6).
- Nhật ký từng bước: `docs/lich-su.md`.
