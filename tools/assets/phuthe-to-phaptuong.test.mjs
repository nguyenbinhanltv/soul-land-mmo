// Kiểm thử công cụ đóng gói phụ thể cũ thành pháp tướng (#1306): `phuthe-to-phaptuong-lib.mjs` (thuần) và `phuthe-to-phaptuong.mjs` (đọc / ghi).
// Chạy: node --test tools/assets/phuthe-to-phaptuong.test.mjs (nằm trong `npm run test:assets`).
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Img, readPng, hex, vohonColors, ISO_DIRS, PT_FRAME, PT_ORIGIN, PT_COLS, PT_MAX_COLORS, SPRITES } from "./lib.mjs";
import {
  SAMPLES, N_IDLE, N_ATTACK, srcOrigin, composeHalves, cell, fillBodyHole, dropDiscs, buildGlow, warp, bboxOf, pickScale, placeFrame, idleSeq, attackSeq, breathPose, strikePose, poseOf,
  quantize, buildSheet,
} from "./phuthe-to-phaptuong-lib.mjs";
import { convert } from "./phuthe-to-phaptuong.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const solid = (im, x, y, c = [200, 40, 40]) => im.set(x, y, [...c, 255]);
/** Khung nguồn F với hình chữ nhật đặc [x0, x1] × [y0, y1] (toạ độ từ gốc chân). */
function rect(F, x0, y0, x1, y1, c) {
  const [ox, oy] = srcOrigin(F), im = new Img(F, F);
  for (let y = oy + y0; y <= oy + y1; y++) for (let x = ox + x0; x <= ox + x1; x++) solid(im, x, y, c);
  return im;
}
const sameImg = (a, b) => a.w === b.w && a.h === b.h && Buffer.compare(Buffer.from(a.data), Buffer.from(b.data)) === 0;
const frameOf = (sheet, row, col) => cell(sheet, PT_FRAME, col, row);
const count = (im) => { let n = 0; for (let i = 3; i < im.data.length; i += 4) if (im.data[i]) n++; return n; };
const touchesSide = (im) => { for (let y = 0; y < im.h; y++) if (im.alpha(0, y) || im.alpha(im.w - 1, y)) return true; for (let x = 0; x < im.w; x++) if (im.alpha(x, 0)) return true; return false; };

test("gốc chân khung nguồn: (F/2, F/2 + 26); 96 → (48, 74), 128 → (64, 90)", () => {
  assert.deepEqual(srcOrigin(96), [48, 74]);
  assert.deepEqual(srcOrigin(128), [64, 90]);
});

test("idleSeq / attackSeq: 8 khung, khung đầu là tư thế gốc, đánh đi từ đầu tới cuối", () => {
  assert.deepEqual(idleSeq(4), [0, 1, 2, 2, 3, 2, 2, 1]);
  assert.deepEqual(idleSeq(2), [0, 0, 1, 1, 1, 1, 1, 0]);
  assert.deepEqual(idleSeq(1), Array(N_IDLE).fill(0));
  assert.deepEqual(attackSeq(6), [0, 1, 1, 2, 3, 4, 4, 5]);
  assert.deepEqual(attackSeq(4), [0, 0, 1, 1, 2, 2, 3, 3]);
  for (const n of [2, 4, 6]) { const s = attackSeq(n); assert.equal(s.length, N_ATTACK); assert.equal(s[0], 0); assert.equal(s.at(-1), n - 1); assert.ok(s.every((v, i) => !i || v >= s[i - 1])); }
});

test("composeHalves: nửa trước đè nửa sau, thiếu một nửa vẫn ghép được", () => {
  const b = new Img(8, 8), f = new Img(8, 8);
  solid(b, 1, 1, [10, 10, 10]); solid(b, 2, 2, [10, 10, 10]); solid(f, 2, 2, [250, 250, 250]);
  const o = composeHalves(b, f);
  assert.deepEqual([...o.get(1, 1)], [10, 10, 10, 255]);
  assert.deepEqual([...o.get(2, 2)], [250, 250, 250, 255]);
  assert.equal(count(composeHalves(undefined, f)), 1);
  assert.equal(count(composeHalves(b, null)), 2);
});

test("placeFrame: gốc chân trùng PT_ORIGIN, phóng nguyên thành khối s×s, đếm điểm bị cắt", () => {
  const F = 96, [ox, oy] = srcOrigin(F), im = new Img(F, F);
  solid(im, ox, oy - 1, [1, 2, 3]); // điểm ngay trên gốc
  for (const k of [1, 2]) {
    const { img, clipped } = placeFrame(im, F, k);
    assert.equal(clipped, 0);
    assert.equal(count(img), k * k);
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) assert.deepEqual([...img.get(PT_ORIGIN[0] + i, PT_ORIGIN[1] - k + j)], [1, 2, 3, 255]);
  }
  const edge = new Img(F, F); solid(edge, 0, 0);
  assert.equal(placeFrame(edge, F, 2).clipped, 4, "góc trái-trên ×2 rơi ngoài khung 160");
});

test("pickScale: hình nhỏ lọt khung thì ×2, hình choán gần hết khung 96 thì ×1; hộp trống → ×1", () => {
  assert.equal(pickScale(bboxOf([rect(96, -20, -50, 20, 10)], 96)), 2);
  assert.equal(pickScale(bboxOf([rect(96, -48, -74, 47, 20)], 96)), 1);
  assert.equal(pickScale(bboxOf([rect(96, -38, -61, 38, 17)], 96)), 2); // sát mép nhưng còn lọt biên PT_MARGIN
  assert.equal(pickScale(bboxOf([rect(96, -39, -61, 39, 17)], 96)), 1); // ×2 chạm biên mép phải
  assert.equal(pickScale(null), 1);
});

test("warp: dời nguyên điểm, nghiêng theo độ cao, không làm mờ (alpha chỉ 0 / 255)", () => {
  const F = 96, im = rect(F, -3, -70, 3, 0), [ox, oy] = srcOrigin(F);
  const m = warp(im, { dx: 2, dy: -1 }, F);
  assert.equal(count(m), count(im), "dời không mất điểm");
  assert.ok(m.alpha(ox + 2, oy - 1) && m.alpha(ox + 5, oy - 71) && !m.alpha(ox - 2, oy));
  const lean = warp(im, { lean: 2 }, F);
  assert.ok(lean.alpha(ox - 3, oy) && lean.alpha(ox + 5, oy - 70) && !lean.alpha(ox - 3, oy - 70), "gốc đứng yên, đỉnh nghiêng 2 điểm");
  for (let i = 3; i < lean.data.length; i += 4) assert.ok(lean.data[i] === 0 || lean.data[i] === 255);
});

test("fillBodyHole: chỉ lấp khoảng rỗng hẹp sát gốc chân, giữ kẽ xa thân", () => {
  const F = 96, [ox, oy] = srcOrigin(F), im = new Img(F, F), y = oy - 20;
  for (let x = ox - 30; x <= ox + 30; x++) if (x < ox - 6 || x > ox + 6 || x === ox - 25) solid(im, x, y); // rỗng giữa thân (13 điểm), rỗng hẹp 1 điểm không có (đặc)
  im.set(ox - 20, y, [0, 0, 0, 0]); // kẽ xa thân
  const o = fillBodyHole(im, 24, F);
  assert.ok(o.alpha(ox, y), "lấp chỗ trống giữa thân");
  assert.ok(!o.alpha(ox - 20, y), "kẽ xa thân giữ nguyên");
  assert.equal(count(fillBodyHole(im, 0, F)), count(im));
});

test("fillBodyHole: lấp cả cột (hàng đầu hở) và bỏ qua viền tối khi lấy màu", () => {
  const F = 96, [ox, oy] = srcOrigin(F), im = new Img(F, F);
  for (let y = oy - 30; y <= oy; y++) for (let x = ox - 20; x <= ox + 20; x++) if (Math.abs(x - ox) > 5 || y < oy - 25) solid(im, x, y, Math.abs(x - ox) === 6 ? [10, 5, 15] : [40, 160, 220]);
  const o = fillBodyHole(im, 28, F);
  assert.ok(o.alpha(ox, oy - 10), "giữa thân đã lấp");
  assert.ok(o.get(ox, oy - 10)[2] > 100, "màu lấy từ lông / lá ngoài viền tối, không phải viền");
});

test("dropDiscs: xóa đĩa quanh điểm tay cầm, không đụng chỗ khác", () => {
  const F = 96, im = rect(F, -10, -10, 10, 0), [ox, oy] = srcOrigin(F), o = dropDiscs(im, [{ x: 0, y: -5, r: 3 }], F);
  assert.ok(!o.alpha(ox, oy - 5) && o.alpha(ox + 9, oy - 9));
  assert.equal(dropDiscs(im, [], F), im);
});

test("buildGlow: cùng bố cục sheet thân, viền sáng nằm ngoài hình, tất định, khung trống không có sáng", () => {
  const a = buildSheet(staticSource(), { group: "B" }), g = buildGlow(a.sheet, [10, 200, 255]), g2 = buildGlow(a.sheet, [10, 200, 255]);
  assert.equal(g.w, a.sheet.w); assert.equal(g.h, a.sheet.h);
  assert.ok(sameImg(g, g2));
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (g.alpha(x, y)) assert.ok(!a.sheet.alpha(x, y), "sáng không đè lên thân");
  assert.ok(count(g) > 0);
  assert.equal(count(buildGlow(new Img(a.sheet.w, a.sheet.h), [1, 2, 3])), 0);
});

test("thở và đánh tất định: cùng đầu vào cùng kết quả; thở có chu kỳ N_IDLE; đánh về cuối thì đứng yên", () => {
  assert.deepEqual(breathPose(0), { dx: 0, dy: 0, lean: 0 });
  assert.deepEqual(breathPose(3), breathPose(3));
  assert.deepEqual(Array.from({ length: N_IDLE }, (_, i) => breathPose(i).dy), [0, 0, -1, -1, -1, -1, -1, 0]);
  for (const d of ISO_DIRS) {
    assert.deepEqual(strikePose(0, d), { dx: 0, dy: 0, lean: 0 }, `${d}: khung đầu đứng yên`);
    assert.deepEqual(strikePose(N_ATTACK - 1, d), { dx: 0, dy: 0, lean: 0 }, `${d}: khung cuối đứng yên`);
  }
  assert.ok(strikePose(4, "e").dx > 0 && strikePose(4, "s").dy > 0 && strikePose(4, "n").dy < 0, "lao theo hướng nhìn");
  assert.ok(strikePose(2, "e").dx < 0, "lùi lấy đà trước khi lao");
  assert.ok(strikePose(2, "e", "slam").dy < 0 && strikePose(4, "e", "slam").dy > 0, "vật cứng nhấc lên rồi nện xuống");
  assert.equal(poseOf("V").kind, "slam");
  assert.equal(poseOf("B").kind, "lunge");
});

test("quantize: giảm còn tối đa PT_MAX_COLORS màu, giữ viền #1a1020", () => {
  const t = new Img(64, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) t.set(x, y, [x * 4, y * 4, (x * y) % 256, 255]);
  t.set(0, 0, [0x1a, 0x10, 0x20, 255]);
  assert.ok(quantize(t, PT_MAX_COLORS) <= PT_MAX_COLORS);
  const seen = new Set(); for (let i = 0; i < t.data.length; i += 4) seen.add(`${t.data[i]},${t.data[i + 1]},${t.data[i + 2]}`);
  assert.ok(seen.size <= PT_MAX_COLORS);
  assert.deepEqual([...t.get(0, 0)], [0x1a, 0x10, 0x20, 255]);
});

/** Nguồn tĩnh giả: mỗi hướng một hình chữ nhật (sau) + một dải (trước), kích thước nhỏ để lọt ×2. */
const staticSource = (F = 96) => ({ F, anim: false, dirs: Object.fromEntries(ISO_DIRS.map((d, i) => [d, { idle: [{ back: rect(F, -20, -40, 20, 0, [40 + i * 30, 90, 200]), front: rect(F, -6, -20, 6, -10, [250, 200, 40]) }], attack: [] }])) });
/** Nguồn hoạt ảnh giả: khung k của idle / attack là hình chữ nhật cao dần (để biết khung nào được lấy). */
const animSource = (nIdle, nAtk, F = 96) => ({ F, anim: true, dirs: Object.fromEntries(ISO_DIRS.map((d) => [d, {
  idle: Array.from({ length: nIdle }, (_, k) => ({ back: rect(F, -10, -30 - k, 10, 0) })),
  attack: Array.from({ length: nAtk }, (_, k) => ({ front: rect(F, -10, -50 - 2 * k, 10, 0) })) }])) });

test("buildSheet nguồn tĩnh: 2560×800, đủ 5 × 16 khung, ×2, không cắt, không chạm mép, tất định", () => {
  const a = buildSheet(staticSource(), { group: "B" }), b = buildSheet(staticSource(), { group: "B" });
  assert.equal(a.sheet.w, PT_FRAME * PT_COLS); assert.equal(a.sheet.h, PT_FRAME * ISO_DIRS.length);
  assert.equal(a.scale, 2); assert.equal(a.clipped, 0);
  assert.ok(a.colors <= PT_MAX_COLORS);
  assert.ok(sameImg(a.sheet, b.sheet), "cùng ảnh vào thì cùng sheet ra");
  ISO_DIRS.forEach((_, row) => { for (let c = 0; c < PT_COLS; c++) { const f = frameOf(a.sheet, row, c); assert.ok(count(f) > 0, `khung (${row},${c}) trống`); assert.ok(!touchesSide(f), `khung (${row},${c}) chạm mép`); } });
  // gốc chân: đáy hình chữ nhật (y = 0 so với gốc) nằm ngay trên PT_ORIGIN[1] ở khung thở 0
  const f0 = frameOf(a.sheet, 0, 0);
  assert.ok(f0.alpha(PT_ORIGIN[0], PT_ORIGIN[1] - 1) && !f0.alpha(PT_ORIGIN[0], PT_ORIGIN[1] + 2));
  // thở: khung 0 và khung giữa khác nhau; đánh: khung ra đòn khác khung đầu
  assert.ok(!sameImg(frameOf(a.sheet, 2, 0), frameOf(a.sheet, 2, 4)), "thở có chuyển động");
  assert.ok(!sameImg(frameOf(a.sheet, 2, 8), frameOf(a.sheet, 2, 12)), "đánh có chuyển động");
  // vật cứng: kiểu nện, hướng nào cũng nhấc lên (khung 10: dy ≤ 0 → đỉnh cao hơn khung 8)
  const v = buildSheet(staticSource(), { group: "V" });
  const top = (im) => { for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y)) return y; return -1; };
  assert.ok(top(frameOf(v.sheet, 2, 10)) < top(frameOf(v.sheet, 2, 8)));
});

test("anchor.json: tâm khối dời cả hướng khi đặt vào khung 160, cùng một độ dời cho mọi khung của hướng", () => {
  const src = animSource(4, 6), anchored = { ...src, anchor: { e: { dx: 3.4, dy: -2.2 } } };
  const a = buildSheet(src, { group: "B", scale: 1 }), b = buildSheet(anchored, { group: "B", scale: 1 });
  const left = (im) => { for (let x = 0; x < im.w; x++) for (let y = 0; y < im.h; y++) if (im.alpha(x, y)) return x; return -1; };
  const top = (im) => { for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y)) return y; return -1; };
  for (const c of [0, 5, 9, 13]) { assert.equal(left(frameOf(b.sheet, 2, c)) - left(frameOf(a.sheet, 2, c)), 3); assert.equal(top(frameOf(b.sheet, 2, c)) - top(frameOf(a.sheet, 2, c)), -2); }
  assert.ok(sameImg(frameOf(b.sheet, 1, 3), frameOf(a.sheet, 1, 3)), "hướng không có mục anchor giữ nguyên");
});

test("buildSheet nguồn hoạt ảnh: thở lấy idleSeq, đánh lấy attackSeq (khung nguồn n → khung đích đúng)", () => {
  const r = buildSheet(animSource(4, 6), { group: "B" });
  const h = (row, col) => { const f = frameOf(r.sheet, row, col); let y0 = f.h; for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.alpha(x, y) && y < y0) y0 = y; return PT_ORIGIN[1] - y0; };
  const k = r.scale;
  idleSeq(4).forEach((src, i) => assert.equal(h(0, i), (30 + src) * k, `thở ${i} ← nguồn ${src}`));
  attackSeq(6).forEach((src, i) => assert.equal(h(0, 8 + i), (50 + 2 * src) * k, `đánh ${i} ← nguồn ${src}`));
});

test("convert 3 mẫu lọt khung, đủ khung; hai sheet chuyển thể và glow của sheet Lam Ngân Thảo đã nhập khớp công cụ", () => {
  for (const id of SAMPLES) {
    const r = convert(id);
    assert.equal(r.clipped, 0, `${id}: không bị cắt khỏi khung 160`);
    assert.ok(r.colors <= PT_MAX_COLORS, `${id}: ${r.colors} màu`);
    assert.ok(r.src.anim, `${id}: dùng clip vhanim`);
    ISO_DIRS.forEach((d, row) => { for (let c = 0; c < PT_COLS; c++) assert.ok(count(frameOf(r.sheet, row, c)) > 0, `${id}: khung ${d}/${c} trống`); });
    const committed = readPng(path.join(SPRITES, "phaptuong", `${id}.png`));
    // #1326: Lam Ngân Thảo đã vẽ lại độc lập, không còn là đầu ra chuyển thể.
    if (id === "lam_ngan_thao") assert.ok(sameImg(readPng(path.join(SPRITES, "phaptuong", `${id}_glow.png`)), buildGlow(committed, hex(vohonColors(id)[0]))), `${id}: lớp sáng lệch sheet đã nhập`);
    else assert.ok(sameImg(committed, r.sheet), `${id}: shared/assets/sprites/phaptuong/${id}.png lệch công cụ (chạy lại phuthe-to-phaptuong.mjs --id ${id})`);
  }
});

test("convert võ hồn chỉ có ảnh tĩnh (--tinh): nội suy thở / đánh bằng code, vẫn đủ 16 khung", () => {
  const r = convert("hoa_long", { forceStatic: true });
  assert.equal(r.src.anim, false);
  assert.equal(r.clipped, 0);
  assert.ok(!sameImg(frameOf(r.sheet, 2, 0), frameOf(r.sheet, 2, 4)));
  assert.ok(!sameImg(frameOf(r.sheet, 2, 8), frameOf(r.sheet, 2, 12)));
  assert.throws(() => convert("khong_co_vo_hon"), /không có võ hồn/);
});

test("--all từ chối khi chưa duyệt mẫu, --all không nhận --out", () => {
  const run = (...a) => spawnSync(process.execPath, [path.join(HERE, "phuthe-to-phaptuong.mjs"), ...a], { encoding: "utf8" });
  const r = run("--all");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /duyệt 3 mẫu/);
  const r2 = run("--all", "--duyet-mau", "--out", "x.png");
  assert.notEqual(r2.status, 0);
  assert.match(r2.stderr, /không nhận --out/);
  assert.notEqual(run().status, 0);
});
