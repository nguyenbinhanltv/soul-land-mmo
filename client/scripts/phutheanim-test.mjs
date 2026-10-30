// Phụ thể v2 P2 (#1023): chọn khung clip vhanim_{id} theo giờ hoạt ảnh thân, hướng 5 hàng, ánh xạ khớp bảng ở docs/art/phu-the-hoat-anh.md,
// bố cục manifest + fallback, hệ số giảm spiritMotion khi có clip. Module thuần, không Phaser.
import assert from "node:assert/strict";
import { LPC_SHEET } from "../../shared/data.ts";
import { PHU_CLIPS, PHU_DIRS, PHU_DEFAULT_CLIPS as D, PHU_FRAMES, PHU_ROWS_PER_SEX, parsePhuLayout, phuBodyStep, phuClipIndex, phuClipOf, phuDirOk, phuDirRow, phuFaceOf, phuFlip, phuFrame, phuHalf, phuOriginY, phuSheetFits, phuGripAt, weaponHidden } from "../src/phutheAnim.ts";
import { PHU_NO_ANCHOR, parsePhuAnchor, phuAnchorAt, phuAnchorJson, phuLayerPlacement } from "../src/phutheAnchor.ts";
import { fakePose } from "../src/phutheFake.ts";
import { clipOscK, weaponOscK, SPIRIT_WEAPON_OSC_K, newSpiritPose, spiritPose, SPIRIT_CLIP_OSC_K, SPIRIT_FAMILY } from "../src/spiritMotion.ts";

// --- bố cục manifest: mặc định 22 cột; frame 96 / 128; hỏng → null (nhánh cũ)
const L = parsePhuLayout(undefined, [96, 96]);
assert.equal(L.frame, 96); assert.equal(L.cols, 22);
assert.deepEqual(L.clips, D);
assert.equal(parsePhuLayout({}, 128).frame, 128);
assert.equal(parsePhuLayout(undefined, 64), null, "khung lạ");
assert.equal(parsePhuLayout(undefined, undefined), null);
assert.equal(parsePhuLayout({ clips: { idle: { col: 0, n: 0 } } }, 96), null, "thiếu clip / n = 0");
assert.equal(parsePhuLayout({ cols: 10 }, 96), null, "cols nhỏ hơn clip");
const A = parsePhuLayout({ clips: { idle: { col: 0, n: 2 }, walk: { col: 2, n: 4 }, attack: { col: 6, n: 4 }, cast: { col: 10, n: 2 }, hurt: { col: 12, n: 1 } } }, 128);
// Ở 260ms thân attack đã sang bước 3, chia đều thời lượng vẫn chọn vũ khí bước 2.
assert.equal(phuClipIndex(4, 4, 3, false, 260, 350), 2, "phụ thể cũ giữ ánh xạ thời gian");
assert.equal(phuClipIndex(4, 4, 3, false, 260, 350, true), 3, "vũ khí cùng số khung theo tay đang hiện");
for (const [age, step] of [[0, 0], [69, 0], [70, 1], [139, 1], [140, 2], [229, 2], [230, 3], [349, 3]]) assert.equal(phuClipIndex(4, 4, step, false, age, 350, true), step);
assert.equal(phuClipIndex(2, 3, 0, false, 120, 440, true), phuClipIndex(2, 3, 0, false, 120, 440), "khác số khung giữ quy tắc cũ");
const castMs = [100, 200, 140];
assert.equal(phuClipIndex(2, 3, 1, false, 280, 440, true, castMs), 0, "cast không giơ chùy trước tay thân ở300ms");
assert.equal(phuClipIndex(2, 3, 2, false, 300, 440, true, castMs), 1);
assert.equal(phuClipIndex(2, 3, 1, false, 280, 440, false, castMs), 1, "phụ thể cũ vẫn chia thời lượng");
for (const layout of [A, L]) for (const clip of ["idle", "walk", "attack", "cast", "hurt"]) {
  const ms = LPC_SHEET.anims[clip].ms, n = layout.clips[clip].n, total = ms.reduce((a, b) => a + b, 0);
  for (let t = 0; t < total; t++) {
    let step = 0, end = ms[0]; while (t >= end && step < ms.length - 1) end += ms[++step];
    const index = phuClipIndex(n, ms.length, step, LPC_SHEET.anims[clip].loop, t, total, true, ms);
    const nearest = Math.min(...Array.from({ length: n }, (_, i) => Math.abs(phuBodyStep(ms, n, i) - step)));
    assert.equal(Math.abs(phuBodyStep(ms, n, index) - step), nearest, `${clip}/${t}: dùng bước thân gần nhất có trong sheet`);
  }
}
assert.equal(A.cols, 13, "vật cứng 13 cột"); assert.equal(A.clips.walk.n, 4);
assert.deepEqual(parsePhuLayout({ offset: { attack: [2, -1], hurt: ["x", 1] } }, 96).offset.attack, [2, -1]);
assert.deepEqual(parsePhuLayout({ offset: { hurt: ["x", 1] } }, 96).offset.hurt, [0, 0], "độ dời hỏng → 0");
assert.equal(phuOriginY(96), 74 / 96); assert.equal(phuOriginY(128), 90 / 128);
assert.equal(PHU_FRAMES[128], 90); // gốc (64, 90) = gốc thân (32, 58) + 32 mỗi trục

// --- hướng: 5 hàng, tây lật; se / ne hàng riêng
const rows = { s: [0, false], se: [1, false], e: [2, false], ne: [3, false], n: [4, false], sw: [1, true], w: [2, true], nw: [3, true] };
for (const [f, [r, fl]] of Object.entries(rows)) { assert.equal(phuDirRow(f), r, f); assert.equal(phuFlip(f), fl, f); }
// thân hiện 4 hướng: ngang e / w nhận se / ne cùng bên; khác bên (chờ đổi hướng) theo thân
assert.equal(phuFaceOf("e", "se"), "se"); assert.equal(phuFaceOf("e", "ne"), "ne"); assert.equal(phuFaceOf("e", "e"), "e");
assert.equal(phuFaceOf("e", "sw"), "e"); assert.equal(phuFaceOf("w", "nw"), "nw"); assert.equal(phuFaceOf("w", "se"), "w");
assert.equal(phuFaceOf("s", "se"), "s"); assert.equal(phuFaceOf("n", "ne"), "n"); assert.equal(phuFaceOf(null, "ne"), "ne");

// --- anim.dirsOk (nhập từng hướng): thiếu / đủ 5 hướng = không ghi (manifest cũ giữ hành vi cũ); hướng chưa nhập → phụ thể tĩnh cũ; tây theo hàng nguồn đông
assert.equal(L.dirsOk, undefined, "manifest cũ không có dirsOk");
for (const f of Object.keys(rows)) assert.equal(phuDirOk(L, f), true, `đủ hướng: ${f}`);
assert.equal(parsePhuLayout({ dirsOk: [...PHU_DIRS] }, 96).dirsOk, undefined, "khai đủ 5 = đủ mọi hướng");
assert.equal(parsePhuLayout({ dirsOk: "s" }, 96).dirsOk, undefined, "không phải mảng → bỏ qua");
const PD = parsePhuLayout({ dirsOk: ["e", "x", "s", "e"] }, 96);
assert.deepEqual(PD.dirsOk, ["s", "e"], "lọc giá trị lạ / trùng, theo thứ tự PHU_DIRS");
assert.deepEqual(Object.keys(rows).filter((f) => phuDirOk(PD, f)), ["s", "e", "w"], "s, e và tây của e (w); se / sw / ne / nw / n dùng ảnh cũ");
assert.equal(phuDirOk(parsePhuLayout({ dirsOk: ["se"] }, 96), "sw"), true, "sw phản chiếu se khi se có");
assert.equal(phuDirOk(parsePhuLayout({ dirsOk: ["s", "e"] }, 96), "sw"), false, "se chưa nhập thì sw cũng không");
assert.deepEqual(parsePhuLayout({ dirsOk: [] }, 96).dirsOk, [], "rỗng: mọi hướng dùng ảnh cũ");
assert.equal(parsePhuLayout({ dirsOk: ["s"] }, 96).frame, 96); assert.deepEqual(parsePhuLayout({ dirsOk: ["s"] }, 96).clips, D, "dirsOk không đổi bố cục clip");

// --- clip ↔ hoạt ảnh thân
assert.equal(phuClipOf("die"), null); assert.equal(phuClipOf("absorb"), "idle"); assert.equal(phuClipOf("hurt"), "hurt");
for (const c of PHU_CLIPS) assert.equal(phuClipOf(c), c);

// --- ánh xạ khung phụ thể → bước thân khớp bảng "Ánh xạ clip phụ thể sang khung thân" (LPC_SHEET.anims.ms)
const steps = (clip, n) => Array.from({ length: n }, (_, i) => phuBodyStep(LPC_SHEET.anims[clip].ms, n, i));
assert.deepEqual(steps("idle", 4), [0, 1, 2, 3]); assert.deepEqual(steps("idle", 2), [1, 3]);
assert.deepEqual(steps("walk", 6), [0, 1, 2, 3, 4, 5]); assert.deepEqual(steps("walk", 4), [0, 2, 3, 5]);
assert.deepEqual(steps("attack", 6), [0, 1, 2, 2, 3, 3]); assert.deepEqual(steps("attack", 4), [0, 1, 2, 3]);
assert.deepEqual(steps("cast", 4), [0, 1, 1, 2]); assert.deepEqual(steps("cast", 2), [1, 2]);
assert.deepEqual(steps("hurt", 2), [0, 1]); assert.deepEqual(steps("hurt", 1), [1]);

// --- chọn khung theo giờ: vòng lặp theo bước thân (đều nhau)
const ms = (c) => LPC_SHEET.anims[c].ms, total = (c) => ms(c).reduce((a, b) => a + b, 0);
const loop = (clip, n) => Array.from({ length: ms(clip).length }, (_, s) => phuClipIndex(n, ms(clip).length, s, true, -1, total(clip)));
assert.deepEqual(loop("idle", 4), [0, 1, 2, 3]); assert.deepEqual(loop("idle", 2), [0, 0, 1, 1]);
assert.deepEqual(loop("walk", 6), [0, 1, 2, 3, 4, 5]);
assert.ok(loop("walk", 4).every((v, i, a) => v >= 0 && v <= 3 && (i === 0 || v >= a[i - 1])), "walk 4 khung đi tới, không lùi");
assert.equal(new Set(loop("walk", 4)).size, 4, "đủ 4 khung");
// một lần: theo tuổi, mỗi khung một đoạn đều của thời lượng; hết thời lượng kẹp ở khung cuối; không biết tuổi thì theo giữa bước thân
const once = (clip, n, age) => phuClipIndex(n, ms(clip).length, 0, false, age, total(clip));
for (const [clip, n] of [["attack", 6], ["attack", 4], ["cast", 4], ["cast", 2], ["hurt", 2], ["hurt", 1]]) {
  const T = total(clip), got = Array.from({ length: n }, (_, i) => once(clip, n, (i + 0.5) / n * T));
  assert.deepEqual(got, Array.from({ length: n }, (_, i) => i), `${clip} ${n}: giữa mỗi đoạn là khung đó`);
  assert.equal(once(clip, n, 0), 0); assert.equal(once(clip, n, T), n - 1); assert.equal(once(clip, n, T * 3), n - 1);
}
assert.equal(phuClipIndex(6, 4, 3, false, -1, 350), 5, "không biết tuổi: giữa bước thân cuối (0.875 × 6)");
// đổi hướng giữa chừng chỉ đổi hàng, giữ cột (cùng khung clip)
for (const c of PHU_CLIPS) for (let i = 0; i < L.clips[c].n; i++) for (let d = 1; d < 5; d++) assert.equal(phuFrame(L, c, d, 0, i) - phuFrame(L, c, 0, 0, i), d * L.cols);

// --- chỉ số khung trong sheet: 22 khung × 5 hướng × 2 giới, không trùng, nằm trong sheet
const seen = new Set();
for (let h = 0; h < 2; h++) for (let d = 0; d < 5; d++) for (const c of PHU_CLIPS) for (let i = 0; i < L.clips[c].n; i++) seen.add(phuFrame(L, c, d, h, i));
assert.equal(seen.size, 2 * 5 * 22); assert.ok([...seen].every((n) => n >= 0 && n < 22 * 10));
assert.equal(phuFrame(L, "attack", 2, 1, 99), (1 * 5 + 2) * 22 + 10 + 5, "kẹp ở khung cuối của clip");
// nửa giới: thân nữ + sheet đủ hai nửa mới dùng nửa nữ
assert.equal(phuHalf(960, L, true), 1); assert.equal(phuHalf(480, L, true), 0); assert.equal(phuHalf(960, L, false), 0);
assert.equal(phuHalf(2 * PHU_ROWS_PER_SEX * 128, parsePhuLayout(undefined, 128), true), 1);
// kích thước sheet: 96 → 2112 × 960; 128 → 2816 × 1280 (dưới 4096); sai thì không dùng
assert.ok(phuSheetFits(2112, 960, L)); assert.ok(phuSheetFits(2112, 480, L), "một nửa giới");
assert.ok(phuSheetFits(2816, 1280, parsePhuLayout(undefined, 128))); assert.ok(2816 < 4096 && 1280 < 4096);
assert.ok(!phuSheetFits(2304, 1152, L), "sheet phụ thể cũ 24 cột không phải bố cục mới"); assert.ok(!phuSheetFits(2112, 500, L));

// --- sheet giả: hữu hạn, trả đúng `out` (không tạo object), hurt khác idle
const out = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1 };
for (const c of PHU_CLIPS) for (let i = 0; i < D[c].n; i++) { assert.equal(fakePose(c, i, D[c].n, out), out); assert.ok(Object.values(out).every(Number.isFinite)); }
assert.notEqual(fakePose("hurt", 0, 2, { ...out }).rot, 0);

// --- spiritMotion mức lắc nhẹ khi có clip: dao động nhỏ hơn, vật cứng cao hơn, cú đánh / hurt giữ nguyên
assert.ok(SPIRIT_CLIP_OSC_K.soft < SPIRIT_CLIP_OSC_K.hard && SPIRIT_CLIP_OSC_K.hard < 1);
for (const f of Object.values(SPIRIT_FAMILY)) assert.equal(clipOscK(f), f === "weapon" || f === "float" ? SPIRIT_CLIP_OSC_K.hard : SPIRIT_CLIP_OSC_K.soft);
const P = newSpiritPose();
const amp = (fam, state, oscK) => { let m = 0; for (let t = 0; t < 3000; t += 10) { spiritPose(P, fam, state, t, 0, 0, 1, -1, 1, 0, oscK); m = Math.max(m, Math.abs(P.rot)); } return m; };
for (const [fam, st] of [["tail", "walk"], ["tail", "idle"], ["weapon", "walk"]]) {
  const full = amp(fam, st, 1), soft = amp(fam, st, clipOscK(fam));
  assert.ok(soft > 0 && Math.abs(soft - full * clipOscK(fam)) < 1e-9, `${fam}/${st} nhân đúng hệ số`);
}
spiritPose(P, "weapon", "attack", 0, 150, 300, 1, -1, 1, 0, 1); const r1 = P.rot;
spiritPose(P, "weapon", "attack", 0, 150, 300, 1, -1, 1, 0, 0.1); assert.equal(P.rot, r1, "cú đánh không bị giảm");
spiritPose(P, "wing", "idle", 0, 0, 0, 1, 50, 1, 0, 1); const h1 = P.dx;
spiritPose(P, "wing", "idle", 0, 0, 0, 1, 50, 1, 0, 0.1); assert.equal(P.dx, h1, "hurt không bị giảm");

console.log("phutheanim-test: ok");

// --- neo khối thân (anchor.json): đọc đủ 2 giới × 5 hướng, hỏng → null (hành vi cũ), tra theo (giới, hàng hướng), xuất lại giữ nguyên
const dirs = Object.fromEntries(["s", "se", "e", "ne", "n"].map((d, i) => [d, { dx: i, dy: -i, scale: 1 + i / 10, tx: 0, ty: -26 }]));
const anchorSrc = { frame: 96, m: dirs, f: dirs };
const T = parsePhuAnchor(anchorSrc);
assert.equal(T.frame, 96); assert.equal(T.manual, false);
assert.deepEqual(phuAnchorAt(T, false, phuDirRow("e")), { dx: 2, dy: -2, scale: 1.2, tx: 0, ty: -26 }, "hàng e");
assert.equal(phuAnchorAt(T, true, phuDirRow("nw")).dx, 3, "tây dùng hàng ne; lật dấu dx do nơi gọi");
assert.deepEqual(phuAnchorAt(undefined, false, 0), PHU_NO_ANCHOR, "thiếu bảng → không neo");
assert.equal(parsePhuAnchor({ ...anchorSrc, frame: 64 }), null);
assert.equal(parsePhuAnchor({ frame: 96, m: dirs }), null, "thiếu giới nữ");
assert.equal(parsePhuAnchor({ ...anchorSrc, m: { ...dirs, s: { ...dirs.s, scale: 9 } } }), null, "scale ngoài khoảng");
assert.equal(parsePhuAnchor({ ...anchorSrc, m: { ...dirs, s: { dx: "x", dy: 0, scale: 1 } } }), null, "dx không phải số");
assert.equal(parsePhuAnchor({ ...anchorSrc, m: { ...dirs, s: { dx: 0, dy: 0, scale: 1 } } }).m[0].ty, PHU_NO_ANCHOR.ty, "thiếu tx / ty → mặc định");
const back = phuAnchorJson(T); assert.equal(back.manual, true); assert.deepEqual(parsePhuAnchor(back).f, T.f, "xuất rồi đọc lại khớp");
console.log("phutheanim-test: neo khối thân OK");
// Neo phụ thể cũ cùng mã và clip offset không được làm trôi điểm cầm vũ khí (cả hai phía).
const oldAnchor = { dx: 3, dy: -2.65, scale: 0.9, tx: 0, ty: -26 };
assert.deepEqual(phuLayerPlacement(true, false, [2, -1], [4, -3], oldAnchor, 3), { x: 2, y: -1, scale: 1 });
assert.deepEqual(phuLayerPlacement(true, true, [2, -1], [4, -3], oldAnchor, 3), { x: -2, y: -1, scale: 1 });
assert.deepEqual(phuLayerPlacement(false, true, [2, -1], [4, -3], oldAnchor, 3), { x: -7, y: -4 - 2.65 / 3, scale: 0.9 }, "phụ thể giữ offset/neo cũ");

// --- màn chỉnh ráp (#1192): hoàn tác / làm lại, phím, kéo, giới hạn
{
  const { PhuHistory, phuAssignTable, phuNudge, phuStep, phuDragDelta, phuWheelScale, clampShift, clampScale, PHU_SHIFT_MAX } = await import("../src/phutheEdit.ts");
  const { PHU_DIRS } = await import("../src/phutheAnim.ts");
  const mk = () => ({ frame: 96, m: PHU_DIRS.map(() => ({ ...PHU_NO_ANCHOR })), f: PHU_DIRS.map(() => ({ ...PHU_NO_ANCHOR })), manual: false });
  const t = mk(), h = new PhuHistory();
  assert.ok(!h.canUndo && !h.canRedo && h.undo(t) === null);
  h.push(t); t.m[2].dx = 5; t.manual = true;
  h.push(t); t.f[0].scale = 0.5;
  assert.equal(h.undo(t) && true, true);
  const u = h.undo(t); assert.ok(u, "lùi hai bước");
  assert.equal(u.m[2].dx, 0); assert.equal(u.manual, false);
  phuAssignTable(t, u); assert.equal(t.m[2].dx, 0);
  assert.ok(h.canRedo); const r = h.redo(t); assert.equal(r.m[2].dx, 5);
  t.m[0].dy = 3; h.push(t); assert.ok(!h.canRedo, "thay đổi mới xóa hàng làm lại");
  h.push(t); h.push(t); // trạng thái giống hệt không chồng thêm
  assert.equal([h.undo(t), h.undo(t)].filter(Boolean).length, 2);
  assert.deepEqual(phuNudge("ArrowLeft", 1, false), [-1, 0]); assert.deepEqual(phuNudge("ArrowLeft", 1, true), [1, 0], "tây lật dấu dx");
  assert.deepEqual(phuNudge("ArrowDown", 5, true), [0, 5]); assert.equal(phuNudge("a", 1, false), null);
  assert.equal(phuStep(true, false), 5); assert.equal(phuStep(false, true), 0.25); assert.equal(phuStep(false, false), 1);
  assert.deepEqual(phuDragDelta(8, -4, 4, false), [2, -1]); assert.deepEqual(phuDragDelta(8, 0, 4, true), [-2, 0]);
  assert.equal(clampShift(999), PHU_SHIFT_MAX); assert.equal(clampShift(NaN), 0); assert.equal(clampScale(9), 2); assert.equal(clampScale(0), 0.25);
  assert.equal(phuWheelScale(1, -1), 1.02); assert.equal(phuWheelScale(0.25, 1), 0.25);
}

// --- vũ khí cầm tay (#1312): manifest anim.kind "vukhi" + anim.grip; điểm cầm theo hướng / clip / khung, tây lật; Chân Thân ẩn; thiếu thì nhánh cũ
{
  const grip = { "s/idle/0": [-10.5, -20, 12, -21], "e/attack/3": [8, -30], "ne/walk/5": [1, 2], "x/idle/0": [1, 1], "s/walk/1": [1, "a"], "s/cast/0": [1, 2, 3], "s/hurt/0": [NaN, 1] };
  const W = parsePhuLayout({ kind: "vukhi", grip }, 96), P = parsePhuLayout({ grip }, 96);
  assert.equal(W.weapon, true, "anim.kind vukhi → layout vũ khí"); assert.equal(P.weapon, undefined, "phụ thể cũ không phải vũ khí"); assert.equal(P.grip, undefined, "grip chỉ đọc cho vũ khí");
  assert.deepEqual(Object.keys(W.grip).sort(), ["e/attack/3", "ne/walk/5", "s/idle/0"], "bỏ khoá lạ, mảng sai độ dài / không phải số hữu hạn");
  assert.equal(parsePhuLayout({ kind: "vukhi" }, 96).grip, undefined, "vũ khí không có grip vẫn hợp lệ (client không bù lệch)");
  assert.equal(parsePhuLayout({ kind: "vukhi", grip: "x" }, 96).weapon, true); assert.equal(parsePhuLayout({ kind: "vukhi" }, 64), null, "khung lạ vẫn hỏng → nhánh cũ");
  // phuGripAt: hướng 5 hàng (se / ne riêng, tây lật theo hàng đông và đổi dấu x), khung kẹp vào [0, n-1], tay thuận 0 / tay kia 1
  assert.deepEqual(phuGripAt(W, "s", "idle", 0), [-10.5, -20]); assert.deepEqual(phuGripAt(W, "s", "idle", 0, 1), [12, -21]);
  assert.deepEqual(phuGripAt(W, "s", "idle", 0, 2), null, "không có tay thứ ba");
  assert.deepEqual(phuGripAt(W, "e", "attack", 3), [8, -30]); assert.deepEqual(phuGripAt(W, "w", "attack", 3), [-8, -30], "tây lật ngang hướng đông");
  assert.deepEqual(phuGripAt(W, "nw", "walk", 5), [-1, 2]); assert.equal(phuGripAt(W, "se", "walk", 5), null, "se có hàng riêng, không mượn ne");
  const W4 = parsePhuLayout({ kind: "vukhi", clips: { idle: { col: 0, n: 2 }, walk: { col: 2, n: 4 }, attack: { col: 6, n: 4 }, cast: { col: 10, n: 2 }, hurt: { col: 12, n: 1 } }, grip }, 128);
  assert.deepEqual(phuGripAt(W4, "e", "attack", 99), [8, -30], "khung quá cuối kẹp về khung cuối (attack 4 khung)"); assert.equal(phuGripAt(W, "e", "attack", 99), null, "attack 6 khung: khung 5 chưa có điểm cầm");
  assert.equal(phuGripAt(P, "s", "idle", 0), null, "phụ thể cũ không có điểm cầm");
  // Chân Thân: vũ khí chỉ ẩn khi đang Chân Thân VÀ võ hồn có pháp tướng (không chen với pháp tướng); hết Chân Thân hiện lại
  assert.equal(weaponHidden(1, true), true); assert.equal(weaponHidden(0, true), false, "hết Chân Thân → hiện lại");
  assert.equal(weaponHidden(5, false), false, "võ hồn chưa có pháp tướng thì vũ khí ở lại");
  // spiritMotion: vũ khí dao động nhỏ hơn clip phụ thể cũ; vật cứng (weapon, float) nhỏ nhất
  for (const fam of new Set(Object.values(SPIRIT_FAMILY))) assert.ok(weaponOscK(fam) < clipOscK(fam), "vũ khí < clip phụ thể: " + fam);
  assert.equal(weaponOscK("weapon"), SPIRIT_WEAPON_OSC_K.hard); assert.equal(weaponOscK("float"), SPIRIT_WEAPON_OSC_K.hard);
  assert.ok(SPIRIT_WEAPON_OSC_K.hard < SPIRIT_WEAPON_OSC_K.soft);
}

// --- sheet vũ khí GIẢ tất định (vukhiFake.ts, trang ?thu=vukhi): bảng grip đủ mọi khung, parse thành layout vũ khí, điểm cầm khớp đoạn gậy vẽ, cùng đầu vào cùng kết quả
{
  const { fakeGripTable, fakeSegment, fakeGrip, fakeHalf } = await import("../src/vukhiFake.ts");
  const t = fakeGripTable(), total = PHU_CLIPS.reduce((n, c) => n + D[c].n, 0);
  assert.equal(Object.keys(t).length, 5 * total, "mọi hướng × mọi khung có điểm cầm");
  assert.deepEqual(fakeGripTable(), t, "tất định");
  const Lv = parsePhuLayout({ kind: "vukhi", grip: t }, 96);
  assert.equal(Lv.weapon, true); assert.equal(Object.keys(Lv.grip).length, 5 * total, "parseGrip nhận hết khoá của bảng giả");
  for (const dir of PHU_DIRS) for (const c of PHU_CLIPS) for (let i = 0; i < D[c].n; i++) {
    const s = fakeSegment(dir, c, i, D[c].n), g = fakeGrip(dir, c, i, D[c].n);
    assert.deepEqual([s.x0, s.y0], g, `${dir}/${c}/${i}: gậy bắt đầu ở điểm cầm`);
    assert.ok(Math.abs(Math.hypot(s.x1 - s.x0, s.y1 - s.y0) - 26) < 1e-9, "độ dài gậy cố định");
    assert.ok(Math.abs(phuGripAt(Lv, dir, c, i)[0] - +g[0].toFixed(1)) < 1e-9 && Math.abs(phuGripAt(Lv, dir, c, i)[1] - +g[1].toFixed(1)) < 1e-9, `${dir}/${c}/${i}: phuGripAt đọc đúng bảng`);
  }
  assert.equal(phuGripAt(Lv, "w", "idle", 0)[0], -phuGripAt(Lv, "e", "idle", 0)[0], "tây lật x của đông");
  assert.deepEqual(PHU_DIRS.map(fakeHalf), ["f", "f", "f", "b", "b"], "quay lưng vẽ nửa sau");
  assert.equal(weaponHidden(1, true), true); assert.equal(weaponHidden(1, false), false); assert.equal(weaponHidden(0, true), false);
}
