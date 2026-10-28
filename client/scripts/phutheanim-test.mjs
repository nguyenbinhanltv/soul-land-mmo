// Phụ thể v2 P2 (#1023): chọn khung clip vhanim_{id} theo giờ hoạt ảnh thân, hướng 5 hàng, ánh xạ khớp bảng ở docs/art/phu-the-hoat-anh.md,
// bố cục manifest + fallback, hệ số giảm spiritMotion khi có clip. Module thuần, không Phaser.
import assert from "node:assert/strict";
import { LPC_SHEET } from "../../shared/data.ts";
import { PHU_CLIPS, PHU_DIRS, PHU_DEFAULT_CLIPS as D, PHU_FRAMES, PHU_ROWS_PER_SEX, parsePhuLayout, phuBodyStep, phuClipIndex, phuClipOf, phuDirOk, phuDirRow, phuFaceOf, phuFlip, phuFrame, phuHalf, phuOriginY, phuSheetFits } from "../src/phutheAnim.ts";
import { PHU_NO_ANCHOR, parsePhuAnchor, phuAnchorAt, phuAnchorJson } from "../src/phutheAnchor.ts";
import { fakePose } from "../src/phutheFake.ts";
import { clipOscK, newSpiritPose, spiritPose, SPIRIT_CLIP_OSC_K, SPIRIT_FAMILY } from "../src/spiritMotion.ts";

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
