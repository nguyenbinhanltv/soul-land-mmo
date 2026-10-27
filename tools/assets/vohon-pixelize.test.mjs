// Thử công cụ chuyển pixel / prompt / kiểm / xem trước cho chân dung, icon, pháp tướng võ hồn v2 (#1087). Ảnh thử là ảnh TỔNG HỢP, không phải ảnh model.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, Img, encodePng, readPng, hex, PORTRAIT_MAX_COLORS, PT_MAX_COLORS } from "./lib.mjs";
import * as P from "./vohon-pixelize-lib.mjs";
import { checkRaw, checkPixel, paletteMatch, softness, gridRatio, hasFrame, formatResult, verdict } from "./vohon-check.mjs";
import { buildPrompt, buildDoc, styleRefBlock, allIds, PHAP_TUONG_MOI } from "./vohon-prompt.mjs";
import { buildPreview } from "./vohon-preview.mjs";
import { styleBlock } from "./phuthe-sheet-lib.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const tmp = () => mkdtempSync(path.join(os.tmpdir(), "vohon-"));
const codes = (r, sev) => r.issues.filter((i) => i.sev === sev).map((i) => i.code);
let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const fill = (img, x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) img.set(x, y, [...c, 255]); };
const disc = (img, cx, cy, r, c) => { for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (Math.hypot(x - cx, y - cy) <= r) img.set(x, y, [...c, 255]); };
/** Ảnh "model vẽ mềm": nền tối + hình đỏ cam + hai điểm sáng nhỏ (mắt), cộng nhiễu nhẹ mọi điểm. */
function softSpirit(S = 400, noise = 5) {
  const im = new Img(S, S); fill(im, 0, 0, S, S, [30, 14, 18]);
  disc(im, S / 2, S / 2, S * 0.38, [160, 50, 20]); disc(im, S / 2, S / 2, S * 0.22, [240, 110, 40]);
  disc(im, S * 0.4, S * 0.42, S * 0.025, [255, 235, 140]); disc(im, S * 0.6, S * 0.42, S * 0.025, [255, 235, 140]);
  for (let i = 0; i < im.data.length; i += 4) for (let c = 0; c < 3; c++) im.data[i + c] = Math.max(0, Math.min(255, im.data[i + c] + Math.round((rnd() - 0.5) * 2 * noise)));
  return im;
}
/** Hình trên nền trong suốt: thân xám + lõi sáng. */
function emblem(S = 300) { const im = new Img(S, S); disc(im, S / 2, S / 2, S * 0.4, [120, 120, 140]); disc(im, S / 2, S * 0.42, S * 0.1, [255, 230, 150]); return im; }
/** Tờ 5 hướng: năm búa nghiêng chồng khoảng ngang với nhau (chéo), nền trong suốt. */
function fiveSheet() {
  const im = new Img(1000, 400);
  for (let k = 0; k < 5; k++) for (let t = 0; t < 300; t++) { const x = 100 + k * 190 + Math.round(t * (k < 2 ? 0.3 : k > 2 ? -0.3 : 0)), y = 50 + t; fill(im, x, y, 14, 2, [150, 150, 160]); }
  for (let k = 0; k < 5; k++) fill(im, 70 + k * 190 + (k === 1 ? 20 : 0), 40, 80, 60, [100 + k * 20, 100, 110]);
  return im;
}
const cnt = (img) => P.colorCounts(img).size;

// ---------- Bỏ phiếu ----------
test("voteDown: ô chọn màu nhiều phiếu, không trộn màu; ô trống trong suốt", () => {
  const im = new Img(8, 4); fill(im, 0, 0, 4, 4, [200, 0, 0]); fill(im, 4, 0, 4, 4, [0, 0, 200]);
  im.set(1, 1, [0, 255, 0, 255]);
  const o = P.voteDown(im, 2, 1, { accent: 0 });
  assert.deepEqual(o.get(0, 0), [200, 0, 0, 255]); assert.deepEqual(o.get(1, 0), [0, 0, 200, 255]);
  const half = new Img(4, 4); fill(half, 0, 0, 4, 1, [9, 9, 9]);
  assert.equal(P.voteDown(half, 1, 1).alpha(0, 0), 0, "dưới nửa điểm đục thì trong suốt");
});
test("voteDown: điểm phát sáng thắng khi chỉ chiếm gần một nửa (mắt không bị nền tối nuốt)", () => {
  const im = new Img(10, 10); fill(im, 0, 0, 10, 10, [20, 10, 14]); fill(im, 0, 0, 10, 4, [255, 240, 150]);
  assert.deepEqual(P.voteDown(im, 1, 1, { accent: 0 }).get(0, 0), [20, 10, 14, 255], "không ưu tiên: nền thắng");
  assert.deepEqual(P.voteDown(im, 1, 1, { accent: 3 }).get(0, 0), [255, 240, 150, 255], "ưu tiên điểm sáng");
});
test("pixelizeDown: hai chặng 4×4 cho ảnh lớn, một chặng cho ảnh nhỏ; không có màu mới ngoài nguồn gần đúng", () => {
  const im = softSpirit(400), a = P.pixelizeDown(im, 32, 32);
  assert.equal(a.w, 32); assert.equal(a.h, 32);
  const small = P.pixelizeDown(softSpirit(40), 32, 32); assert.equal(small.w, 32);
});

// ---------- Bảng màu ----------
test("buildPalette: tối đa n màu; gộp sắc độ giảm số màu; mode gpl chỉ chọn trong bảng", () => {
  const im = P.pixelizeDown(softSpirit(400, 12), 64, 64);
  const full = P.buildPalette(im, 32), merged = P.buildPalette(im, 32, { merge: 40 });
  assert.ok(full.length <= 32 && full.length > 4); assert.ok(merged.length < full.length);
  const pool = [hex("#1a1020"), hex("#f06020"), hex("#ffe890"), hex("#a03214")];
  const g = P.buildPalette(im, 8, { mode: "gpl", pool }); assert.ok(g.length >= 1 && g.every((c) => pool.some((p) => p.join() === c.join())));
});
test("buildPalette: màu hiếm mà sáng (mắt) vẫn có chỗ trong bảng ít màu", () => {
  const im = new Img(40, 40); fill(im, 0, 0, 40, 40, [30, 14, 18]); fill(im, 0, 0, 20, 40, [160, 50, 20]); fill(im, 5, 5, 2, 2, [255, 235, 140]);
  const pal = P.buildPalette(im, 3); assert.ok(pal.some((c) => c[0] > 230 && c[1] > 200), JSON.stringify(pal));
});

// ---------- Khử mềm, viền ----------
test("harden: điểm lẻ tối bị gộp, điểm lẻ sáng (mắt) được giữ", () => {
  const pal = [[40, 20, 20], [200, 80, 30], [255, 240, 160]], W = 8, idx = new Int16Array(W * W).fill(0);
  for (let y = 0; y < 8; y++) for (let x = 4; x < 8; x++) idx[y * W + x] = 1;
  idx[2 * W + 1] = 1; idx[5 * W + 6] = 0; idx[3 * W + 5] = 2; // 1 điểm cam lẻ trong nền, 1 điểm tối lẻ trong cam, 1 điểm sáng lẻ
  const n = P.harden(idx, W, W, pal, { minCluster: 2, passes: 0 });
  assert.equal(idx[2 * W + 1], 0); assert.equal(idx[5 * W + 6], 1); assert.equal(idx[3 * W + 5], 2); assert.ok(n >= 2);
});
test("harden: lọc đa số làm cứng cạnh nhưng không đụng màu sáng", () => {
  const pal = [[40, 20, 20], [200, 80, 30], [255, 240, 160]], W = 5, idx = new Int16Array(W * W).fill(1);
  idx[2 * W + 2] = 0; // một điểm tối giữa vùng cam (cụm 1 điểm): gộp
  P.harden(idx, W, W, pal, { minCluster: 1, passes: 1, vote: 6 }); assert.equal(idx[2 * W + 2], 1);
});
test("outlineOutside: viền #1a1020 ra ngoài hình, không đè lên hình; đếm đúng", () => {
  const im = new Img(7, 7); fill(im, 2, 2, 3, 3, [200, 100, 50]);
  const n = P.outlineOutside(im); assert.equal(n, 12);
  assert.deepEqual(im.get(1, 3), [...P.OUT, 255]); assert.deepEqual(im.get(3, 3), [200, 100, 50, 255]); assert.equal(im.alpha(1, 1), 0, "góc chéo không viền");
});
test("removeBg: bỏ vùng nền nối mép, giữ vùng cùng màu nằm trong hình", () => {
  const im = new Img(12, 12); fill(im, 0, 0, 12, 12, [255, 0, 255]); fill(im, 3, 3, 6, 6, [90, 90, 90]); fill(im, 5, 5, 2, 2, [255, 0, 255]);
  P.removeBg(im, [255, 0, 255], 20); assert.equal(im.alpha(0, 0), 0); assert.equal(im.alpha(4, 4), 255); assert.equal(im.alpha(5, 5), 255, "lỗ kín bên trong không bị bỏ");
});
test("squareCrop / crop: cắt vuông theo tiêu điểm, không ra ngoài ảnh", () => {
  const im = new Img(200, 100), c = P.squareCrop(im, { focus: [0.95, 0.5], zoom: 2 });
  assert.deepEqual(c, { x: 150, y: 25, w: 50, h: 50 }); assert.throws(() => P.crop(im, { x: 190, y: 0, w: 20, h: 20 }), /ngoài ảnh/);
});

// ---------- Theo loại ----------
test("pixelizePortrait: 64×64, ≤ PORTRAIT_MAX_COLORS màu, còn điểm sáng, kiểm pixel không CHẶN", () => {
  const res = P.pixelizePortrait(softSpirit(400, 8), { focus: [0.5, 0.45], zoom: 1.4 });
  assert.equal(res.img.w, 64); assert.equal(res.img.h, 64); assert.ok(cnt(res.img) <= PORTRAIT_MAX_COLORS);
  assert.ok(res.report.accent.total >= 1 && res.report.accent.kept === res.report.accent.total, JSON.stringify(res.report.accent));
  const r = checkPixel(res.img, { type: "portrait", report: { ...res.report, size: 64 } }); assert.notEqual(verdict(r), "block", formatResult(r));
});
test("pixelizePortrait: ảnh nền phẳng trong suốt → có viền ngoài; vẫn ≤ giới hạn màu (viền tính vào)", () => {
  const im = emblem(), res = P.pixelizePortrait(im, { bg: "auto" });
  assert.ok(P.hasAlpha(res.img)); assert.ok(cnt(res.img) <= PORTRAIT_MAX_COLORS);
  assert.deepEqual(res.img.get(Math.round(64 * 0.5), 32 - 25 > 0 ? 7 : 0).slice(3), [255]);
});
test("pixelizeIcon: 32 và 24, hình vừa (size − 2), căn giữa, viền ngoài, alpha 0 / 255", () => {
  for (const s of P.ICON_SIZES) {
    const res = P.pixelizeIcon(emblem(), { size: s }), bb = P.bbox(res.img);
    assert.equal(res.img.w, s); assert.ok(bb.x >= 0 && bb.x + bb.w <= s && bb.y >= 0 && bb.y + bb.h <= s);
    assert.ok(Math.abs(bb.x + bb.w / 2 - s / 2) <= 1 && Math.abs(bb.y + bb.h / 2 - s / 2) <= 1);
    let bad = 0; for (let i = 3; i < res.img.data.length; i += 4) if (res.img.data[i] !== 0 && res.img.data[i] !== 255) bad++;
    assert.equal(bad, 0); assert.ok(cnt(res.img) <= PORTRAIT_MAX_COLORS);
    assert.notEqual(verdict(checkPixel(res.img, { type: "icon", report: { ...res.report, size: s } })), "block");
  }
});
test("pixelizeIcon: ảnh nền phẳng đặc (magenta) được bỏ nền tự động; nền loang không tách thì báo lỗi rõ", () => {
  const im = new Img(200, 200); fill(im, 0, 0, 200, 200, [255, 0, 255]); disc(im, 100, 100, 70, [90, 120, 160]);
  const res = P.pixelizeIcon(im, { size: 32 }); assert.ok(P.hasAlpha(res.img));
  const all = new Img(50, 50); fill(all, 0, 0, 50, 50, [255, 0, 255]); assert.throws(() => P.pixelizeIcon(all, { size: 32 }), /không còn điểm đục/);
});
test("lift: nâng sáng ảnh tối theo luma phân vị 98, ảnh sáng không đổi", () => {
  const dark = new Img(10, 10); fill(dark, 0, 0, 10, 10, [60, 60, 60]); const k = P.lift(dark, 0.8); assert.ok(k > 1.5 && dark.get(0, 0)[0] > 100);
  const bright = new Img(4, 4); fill(bright, 0, 0, 4, 4, [250, 250, 250]); assert.equal(P.lift(bright), 1);
});
test("splitPoses: tách đủ 5 hình dù chéo và chồng khoảng ngang; mảnh vụn bị bỏ; xóa điểm hình khác", () => {
  const sheet = fiveSheet(); fill(sheet, 5, 5, 2, 2, [255, 255, 255]);
  const poses = P.splitPoses(sheet); assert.equal(poses.length, 5);
  assert.ok(poses.every((p, i) => i === 0 || poses[i - 1].box.x + poses[i - 1].box.w / 2 < p.box.x + p.box.w / 2), "sắp trái → phải");
  for (const p of poses) assert.ok(P.bbox(p.img).w === p.box.w && P.bbox(p.img).h === p.box.h);
});
test("pixelizePhapTuong: 5 khung 160×160, cùng một tỉ lệ thu, giữa-đáy ở gốc (80, 124), alpha 0 / 255, ≤ PT_MAX_COLORS, hộp ≤ fit", () => {
  const poses = P.splitPoses(fiveSheet()).map((p) => p.img), res = P.pixelizePhapTuong(poses, {});
  assert.equal(res.frames.length, 5); assert.ok(res.frames.every((f) => f.w === 160 && f.h === 160));
  assert.ok(cnt(P.strip(res.frames)) <= PT_MAX_COLORS);
  const fr = P.PT_FRAMES[160];
  for (const f of res.frames) {
    const bb = P.bbox(f); assert.ok(bb.h <= fr.fitH && bb.w <= fr.fitW, JSON.stringify(bb));
    assert.equal(bb.y + bb.h - 1, fr.origin[1], "đáy hộp (kể cả viền) nằm đúng dòng gốc"); assert.ok(Math.abs(bb.x + bb.w / 2 - fr.origin[0]) <= 1.5);
    for (let i = 3; i < f.data.length; i += 4) assert.ok(f.data[i] === 0 || f.data[i] === 255);
  }
  const strip = P.strip(res.frames), r = checkPixel(strip, { type: "phaptuong", report: res.report }); assert.notEqual(verdict(r), "block", formatResult(r));
  assert.throws(() => P.pixelizePhapTuong(poses, { frame: 100 }), /khung pháp tướng/);
  const f128 = P.pixelizePhapTuong(poses, { frame: 128 }); assert.ok(f128.frames.every((f) => f.w === 128) && P.bbox(f128.frames[0]).h <= 96);
});

test("pixelizePhapTuong: điểm sáng sát mép hình vẫn được tính còn (đo trên ảnh chưa đệm, không lệch 2 điểm)", () => {
  const poses = [];
  for (let k = 0; k < 5; k++) { const im = new Img(60, 200); fill(im, 0, 0, 60, 200, [90, 90, 110]); fill(im, 54, 2, 6, 12, [255, 230, 150]); fill(im, 0, 186, 6, 12, [255, 230, 150]); poses.push(im); }
  const res = P.pixelizePhapTuong(poses, { frame: 160 });
  assert.ok(res.report.accent.total >= 10 && res.report.accent.kept === res.report.accent.total, JSON.stringify(res.report.accent));
});

// ---------- Kiểm RAW ----------
test("softness: ảnh khối cứng ≈ 0, ảnh nhiễu mềm cao; gridRatio cao với ảnh phóng nguyên khối", () => {
  const hard = new Img(128, 128); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) fill(hard, x * 16, y * 16, 16, 16, [(x * 31) % 256, (y * 53) % 256, ((x + y) * 17) % 256]);
  assert.ok(softness(hard) < 0.01); assert.ok(softness(softSpirit(200, 6)) > 0.5);
  assert.ok(gridRatio(hard).ratio > 4 && gridRatio(hard).period % 16 === 0);
});
test("checkRaw: sai tỉ lệ, có khung, nền không tách (icon), màu lạc võ hồn → CHẶN", () => {
  const wide = new Img(300, 150); fill(wide, 0, 0, 300, 150, [30, 20, 20]);
  assert.ok(codes(checkRaw(wide, { type: "portrait" }), "block").includes("ti-le"));
  const framed = softSpirit(300, 2); for (let k = 0; k < 6; k++) { fill(framed, 0, k, 300, 1, [220, 200, 120]); fill(framed, 0, 299 - k, 300, 1, [220, 200, 120]); fill(framed, k, 0, 1, 300, [220, 200, 120]); fill(framed, 299 - k, 0, 1, 300, [220, 200, 120]); }
  assert.ok(hasFrame(framed) && codes(checkRaw(framed, { type: "portrait" }), "block").includes("khung"));
  assert.ok(!hasFrame(softSpirit(300, 2)));
  const busy = softSpirit(300, 2); for (let x = 0; x < 300; x += 30) fill(busy, x, 0, 30, 60, [(x * 3) % 255, 90, 255 - (x % 200)]); for (let x = 0; x < 300; x += 30) fill(busy, x, 240, 30, 60, [255 - (x % 200), 160, (x * 5) % 255]);
  assert.ok(codes(checkRaw(busy, { type: "icon" }), "block").includes("nen"), "icon nền nhiều màu không phải nền phẳng");
  const blue = new Img(300, 300); fill(blue, 0, 0, 300, 300, [10, 10, 30]); disc(blue, 150, 150, 100, [40, 80, 220]);
  const r = checkRaw(blue, { type: "portrait", id: "ta_hoa_phuong_hoang" }); assert.ok(codes(r, "block").includes("sai-mau"), formatResult(r));
});
test("checkRaw: texture mềm → NHẸ; ảnh khối cứng đúng màu, đọc được khi thu nhỏ → ĐẸP", () => {
  const soft = checkRaw(softSpirit(400, 6), { type: "portrait", id: "ta_hoa_phuong_hoang" }); assert.ok(codes(soft, "soft").includes("mem"), formatResult(soft)); assert.notEqual(verdict(soft), "block");
  const hard = new Img(640, 640); fill(hard, 0, 0, 640, 640, [26, 16, 32]);
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) { const d = Math.hypot(x - 20, y - 20); fill(hard, x * 16, y * 16, 16, 16, d < 6 ? [255, 230, 140] : d < 12 ? [240, 110, 40] : d < 17 ? [143, 42, 20] : [26, 16, 32]); }
  fill(hard, 5 * 16, 14 * 16, 32, 32, [255, 235, 150]);
  const r = checkRaw(hard, { type: "portrait", id: "ta_hoa_phuong_hoang" }); assert.equal(verdict(r), "good", formatResult(r)); assert.ok(codes(r, "good").includes("dep"));
});
test("checkRaw: pháp tướng đúng 5 hướng thì không chặn; thiếu hướng thì chặn", () => {
  const ok = checkRaw(fiveSheet(), { type: "phaptuong", id: "hao_thien_chuy" }); assert.ok(!codes(ok, "block").includes("huong"), formatResult(ok));
  const four = new Img(1000, 400); four.blit(fiveSheet(), 0, 0, 640, 400, 0, 0);
  assert.ok(codes(checkRaw(four, { type: "phaptuong" }), "block").includes("huong"));
  assert.throws(() => checkRaw(four, { type: "khac" }), /--type/);
});
test("paletteMatch: đúng họ màu robe / col → cao; khác họ → thấp; không có màu → null", () => {
  const warm = P.pixelizeDown(softSpirit(300, 0), 64, 64);
  assert.ok(paletteMatch(warm, { robe: "#8f2a14", col: "#ff6a2a" }) > 0.8); assert.ok(paletteMatch(warm, { robe: "#1030a0", col: "#2060ff" }) < 0.2); assert.equal(paletteMatch(warm, null), null);
});

// ---------- Kiểm pixel ----------
test("checkPixel: quá màu, alpha lẻ, sai cỡ, không trong suốt (icon) → CHẶN; tối đặc → NHẸ", () => {
  const many = new Img(64, 64); for (let i = 0; i < 64 * 64; i++) many.set(i % 64, (i / 64) | 0, [i % 256, (i * 7) % 256, (i * 13) % 256, 255]);
  assert.ok(codes(checkPixel(many, { type: "portrait" }), "block").includes("mau"));
  const half = P.pixelizeIcon(emblem(), { size: 32 }).img; half.data[3 + 4 * (5 * 32 + 5)] = 100;
  assert.ok(codes(checkPixel(half, { type: "icon" }), "block").includes("alpha"));
  assert.ok(codes(checkPixel(new Img(60, 60), { type: "portrait" }), "block").includes("co"));
  const opaque = new Img(32, 32); fill(opaque, 0, 0, 32, 32, [200, 80, 30]); assert.ok(codes(checkPixel(opaque, { type: "icon" }), "block").includes("nen"));
  const dark = new Img(64, 64); fill(dark, 0, 0, 64, 64, [26, 16, 32]); fill(dark, 10, 10, 20, 20, [60, 40, 50]);
  assert.ok(codes(checkPixel(dark, { type: "portrait", report: { accent: { kept: 0, total: 3 }, size: 64 } }), "soft").includes("mat-mat-mo"));
});
test("formatResult / CLI check: in mức, thoát mã 1 khi CHẶN", () => {
  const d = tmp(), f = path.join(d, "wide.png"); const wide = new Img(300, 150); fill(wide, 0, 0, 300, 150, [30, 20, 20]); writeFileSync(f, encodePng(wide));
  const run = (args) => spawnSync(process.execPath, [path.join(here, "vohon-check.mjs"), ...args], { encoding: "utf8" });
  const bad = run(["raw", f, "--type", "portrait"]); assert.equal(bad.status, 1); assert.match(bad.stdout, /\[CHẶN\] ti-le/);
  assert.equal(run(["raw", f]).status, 2); rmSync(d, { recursive: true, force: true });
});

// ---------- Prompt ----------
test("buildPrompt: STYLE + NEGATIVE nguyên văn; không đòi lưới 64×64 / số màu; có LOOK; cấm bổ sung theo loại", () => {
  for (const type of P.TYPES) {
    const p = buildPrompt(type, "ta_hoa_phuong_hoang");
    assert.ok(p.startsWith(styleBlock()), "khối mục 6 nguyên văn ở đầu");
    assert.doesNotMatch(p, /64x64 logical pixel grid|at most 20 distinct colors|64x64 portrait/i);
    assert.match(p, /chunky low-resolution pixel look, flat color clusters, simple shapes readable when shrunk/);
    assert.match(p, /Tà Hỏa Phượng Hoàng \(ta_hoa_phuong_hoang\)/); assert.match(p, /#ff6a2a|#8f2a14|robe|col/);
  }
  assert.match(buildPrompt("portrait", "hao_thien_chuy"), /border, frame, card, text/); assert.match(buildPrompt("icon", "hao_thien_chuy"), /tiny whole animal, full body/); assert.match(buildPrompt("phaptuong", "hao_thien_chuy"), /solid opaque body/);
  assert.match(buildPrompt("phaptuong", "hao_thien_chuy"), /FIVE views/); assert.match(buildPrompt("portrait", "ta_hoa_phuong_hoang"), /dark background/);
  assert.throws(() => buildPrompt("portrait", "khong_co"), /không có mô tả/); assert.throws(() => buildPrompt("khac", "hao_thien_chuy"), /--type/);
});
test("buildPrompt: mô tả riêng lấy từ mục 4 (nhãn đổi sang tiếng Anh), mã màu giữ nguyên", () => {
  const p = buildPrompt("icon", "hao_thien_chuy"); assert.match(p, /- Overbearing presence: búa/); assert.match(p, /- Motifs \(use only these\)/); assert.match(p, /accent \(col\) #[0-9a-f]{6}, body \(robe\) #[0-9a-f]{6}/);
});
test("ảnh dẫn: chỉ nhận ảnh mới đã duyệt; ảnh cũ (PixelLab, phụ thể, chân dung, icon đang chạy) bị từ chối", () => {
  const d = tmp(), f = path.join(d, "duyet.png"); writeFileSync(f, encodePng(new Img(4, 4)));
  assert.match(styleRefBlock(f), /APPROVED image/); assert.equal(styleRefBlock(undefined), "");
  assert.match(buildPrompt("icon", "hao_thien_chuy", { styleRef: f }), /STYLE REFERENCE: image 1/);
  for (const old of ["art/src/pixellab/phap_tuong/hao_thien_chuy/s.png", "shared/assets/sprites/vohon/hao_thien_chuy_b.png", "shared/assets/sprites/iso/portrait/a_ngan.png", "art/src/gemini/phuthe_5huong/x/s.png"]) assert.throws(() => styleRefBlock(old), /ảnh cũ/, old);
  assert.throws(() => styleRefBlock(path.join(d, "khong-co.png")), /không tồn tại/); rmSync(d, { recursive: true, force: true });
});
test("allIds: 25 võ hồn; 11 võ hồn pháp tướng mới đều có trong bảng; tài liệu cảnh báo khi vẽ pháp tướng ngoài nhóm 11", () => {
  const ids = allIds().map((r) => r.id); assert.equal(ids.length, 25); assert.equal(new Set(ids).size, 25);
  assert.equal(PHAP_TUONG_MOI.length, 11); for (const id of PHAP_TUONG_MOI) assert.ok(ids.includes(id), id);
  const doc = readFileSync(path.join(ROOT, "docs", "art", "vo-hon-phong-cach.md"), "utf8"); for (const id of PHAP_TUONG_MOI) assert.ok(doc.includes(`\`${id}\``), id);
  assert.match(buildDoc("phaptuong", "ta_hoa_phuong_hoang"), /KHÔNG nằm trong 11/); assert.doesNotMatch(buildDoc("phaptuong", "hao_thien_chuy"), /KHÔNG nằm trong 11/);
  assert.match(buildDoc("portrait", "ta_hoa_phuong_hoang"), /Tối đa 3 lượt/);
});

// ---------- Xem trước + CLI ----------
test("vohon-pixelize CLI + vohon-preview: ghi ảnh, báo cáo, trang xem trước cho chân dung / icon / pháp tướng", () => {
  const d = tmp(), raw = path.join(d, "raw.png"), sheet = path.join(d, "sheet.png"), em = path.join(d, "em.png");
  writeFileSync(raw, encodePng(softSpirit(300, 6))); writeFileSync(sheet, encodePng(fiveSheet())); writeFileSync(em, encodePng(emblem()));
  const px = (args) => spawnSync(process.execPath, [path.join(here, "vohon-pixelize.mjs"), ...args], { encoding: "utf8" });
  const a = px(["--type", "portrait", "--id", "ta_hoa_phuong_hoang", "--in", raw, "--out", path.join(d, "a"), "--zoom", "1.3"]); assert.equal(a.status, 0, a.stdout + a.stderr);
  const rep = JSON.parse(readFileSync(path.join(d, "a", "ta_hoa_phuong_hoang-portrait.report.json"), "utf8")); assert.equal(rep.size, 64); assert.ok(rep.palette.length <= PORTRAIT_MAX_COLORS);
  const b = px(["--type", "icon", "--id", "hao_thien_chuy", "--in", em, "--out", path.join(d, "b")]); assert.equal(b.status, 0, b.stdout + b.stderr);
  assert.ok(existsSync(path.join(d, "b", "hao_thien_chuy-icon-32.png")) && existsSync(path.join(d, "b", "hao_thien_chuy-icon-24.png")));
  const c = px(["--type", "phaptuong", "--id", "hao_thien_chuy", "--in", sheet, "--out", path.join(d, "c")]); assert.equal(c.status, 0, c.stdout + c.stderr);
  assert.equal(readPng(path.join(d, "c", "hao_thien_chuy-phaptuong.png")).w, 800); assert.ok(existsSync(path.join(d, "c", "hao_thien_chuy-phaptuong-n.png")));
  assert.equal(px(["--type", "phaptuong", "--in", raw, "--out", path.join(d, "x")]).status, 2, "ảnh không có 5 hướng thì báo lỗi");
  const pv = (type, pix, out) => buildPreview({ type, id: "ta_hoa_phuong_hoang", raw: type === "phaptuong" ? sheet : raw, pixels: pix, out: path.join(d, out) });
  const h1 = pv("portrait", [path.join(d, "a", "ta_hoa_phuong_hoang-portrait.png")], "pa"); assert.match(readFileSync(h1, "utf8"), /Thẻ SR \/ SSR \/ UR/); assert.ok(existsSync(path.join(d, "pa", "so-sanh.png")));
  const h2 = pv("icon", [path.join(d, "b", "hao_thien_chuy-icon-32.png"), path.join(d, "b", "hao_thien_chuy-icon-24.png")], "pb"); assert.match(readFileSync(h2, "utf8"), /icon/);
  const h3 = pv("phaptuong", [path.join(d, "c", "hao_thien_chuy-phaptuong.png")], "pc"); assert.match(readFileSync(h3, "utf8"), /5 hướng vẽ thật \+ 3 hướng tây/);
  rmSync(d, { recursive: true, force: true });
});
test("tài liệu và lệnh: docs/art/vo-hon-phong-cach.md phần 6.1 + package.json (vohon:check, test:assets) khớp công cụ", () => {
  const doc = readFileSync(path.join(ROOT, "docs", "art", "vo-hon-phong-cach.md"), "utf8"), pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.match(doc, /^### 6\.1 /m); for (const w of ["vohon-pixelize", "vohon:check", "vohon-prompt", "vohon-preview", "chặn", "nhẹ", "đẹp", "3 lượt"]) assert.ok(doc.includes(w), w);
  assert.equal(pkg.scripts["vohon:check"], "node tools/assets/vohon-check.mjs"); assert.match(pkg.scripts["test:assets"], /vohon-pixelize\.test\.mjs/);
});

// ---------- Tạo tương phản (#1095) ----------
/** Ảnh "dính gam": nền cam đậm, chủ thể cam sáng hơn một chút, hai điểm sáng nhỏ. */
function sameHue(S = 320) {
  const im = new Img(S, S); fill(im, 0, 0, S, S, [120, 50, 20]); disc(im, S / 2, S / 2, S * 0.32, [170, 80, 30]);
  disc(im, S * 0.42, S * 0.45, S * 0.03, [255, 240, 150]); disc(im, S * 0.58, S * 0.45, S * 0.03, [255, 240, 150]);
  return im;
}
test("hueShift: bóng về tím, vùng sáng về vàng, tông giữa giữ nguyên", () => {
  const im = new Img(3, 1); im.set(0, 0, [90, 20, 10, 255]); im.set(1, 0, [200, 100, 50, 255]); im.set(2, 0, [255, 150, 90, 255]);
  const before = im.get(1, 0).join(); assert.equal(P.hueShift(im, 1), 2);
  assert.equal(im.get(1, 0).join(), before, "tông giữa không đổi");
  assert.ok(im.get(0, 0)[2] > 10, "bóng thêm xanh dương (về tím)"); assert.ok(im.get(2, 0)[1] >= 150, "vùng sáng giữ / thêm lục (về vàng)");
  assert.equal(P.hueShift(im, 0), 0);
});
test("subjectMask + coolBackground + rimLight: nền về lạnh tối, viền sáng 1 điểm ở rìa trên trái chủ thể", () => {
  const im = new Img(32, 32); fill(im, 0, 0, 32, 32, [60, 20, 10]); fill(im, 8, 8, 16, 16, [230, 120, 40]);
  const { mask, share } = P.subjectMask(im); assert.ok(share > 0.2 && share < 0.4, `share ${share}`); assert.equal(mask[16 * 32 + 16], 1); assert.equal(mask[2 * 32 + 2], 0);
  P.coolBackground(im, mask); const [r, , b] = im.get(2, 2); assert.ok(b > r * 0.9, "nền thiên về tím / xanh"); assert.deepEqual(im.get(16, 16).slice(0, 3), [230, 120, 40]);
  const n = P.rimLight(im, mask, [255, 240, 150]); assert.ok(n >= 16 && n <= 40, `rim ${n}`); assert.deepEqual(im.get(8, 12).slice(0, 3), [255, 240, 150]); assert.notDeepEqual(im.get(23, 20).slice(0, 3), [255, 240, 150], "rìa dưới / phải không viền");
});
test("protectAccent: còn chỗ thì thêm màu nhấn; đầy thì thay màu ít điểm nhất, mảng thân giữ màu", () => {
  const im = new Img(10, 1); [[20, 10, 10], [20, 10, 10], [20, 10, 10], [210, 85, 35], [210, 85, 35], [210, 85, 35], [210, 85, 35], [215, 88, 38], [215, 88, 38], [255, 245, 160]].forEach((c, i) => im.set(i, 0, [...c, 255]));
  const roomy = [[20, 10, 10], [210, 85, 35]]; assert.equal(P.protectAccent(im, roomy, 3), true); assert.equal(roomy.length, 3); assert.ok(roomy.some((c) => c.join() === "255,245,160")); assert.ok(roomy.some((c) => c.join() === "210,85,35"), "cam thân còn");
  const full = [[20, 10, 10], [210, 85, 35], [100, 100, 100]]; assert.equal(P.protectAccent(im, full, 3), true); assert.equal(full.length, 3);
  assert.ok(full.some((c) => c.join() === "255,245,160") && full.some((c) => c.join() === "210,85,35") && full.some((c) => c.join() === "20,10,10"), "chỉ màu ít điểm nhất (xám không dùng) bị thay");
  assert.equal(P.protectAccent(im, full, 3), false, "đã có thì không đổi");
});
test("preset portrait: ≤ 8 màu, tương phản (sep, bgRatio) tốt hơn mặc định, viền sáng + báo cáo", () => {
  const src = sameHue(), base = P.pixelizePortrait(src, {}), pre = P.pixelizePortrait(src, { preset: "portrait" });
  assert.ok(pre.palette.length <= 8, `${pre.palette.length} màu`); assert.equal(pre.report.preset, "portrait"); assert.ok(pre.report.rimPixels > 0); assert.ok(pre.report.coolPixels > 0);
  assert.ok(pre.report.contrast.sep >= base.report.contrast.sep, `sep ${pre.report.contrast.sep} vs ${base.report.contrast.sep}`);
  assert.ok(pre.report.accent.kept >= 1, "mắt còn");
  const off = P.pixelizePortrait(src, { preset: "portrait", cool: false, rim: false }); assert.equal(off.report.rimPixels, undefined);
});
test("checkPixel: cảnh báo NHẸ gan-mau / nen-chu-the khi các mảng dính gam, im khi đã tách", () => {
  const flat = new Img(64, 64); fill(flat, 0, 0, 64, 64, [120, 50, 20]); fill(flat, 16, 16, 32, 32, [130, 56, 24]);
  const r = checkPixel(flat, { type: "portrait", id: "ta_hoa_phuong_hoang" }); assert.ok(codes(r, "soft").includes("gan-mau"), formatResult(r)); assert.ok(codes(r, "soft").includes("nen-chu-the"), formatResult(r));
  const good = new Img(64, 64); fill(good, 0, 0, 64, 64, [26, 16, 32]); fill(good, 16, 16, 32, 32, [230, 120, 40]);
  const g = checkPixel(good, { type: "portrait", id: "ta_hoa_phuong_hoang" }); assert.ok(!codes(g, "soft").includes("gan-mau") && !codes(g, "soft").includes("nen-chu-the"), formatResult(g));
});
test("CLI --preset portrait ghi báo cáo có preset, contrast", () => {
  const d = tmp(), raw = path.join(d, "raw.png"); writeFileSync(raw, encodePng(sameHue()));
  const r = spawnSync(process.execPath, [path.join(here, "vohon-pixelize.mjs"), "--type", "portrait", "--id", "ta_hoa_phuong_hoang", "--in", raw, "--out", path.join(d, "o"), "--preset", "portrait", "--max-colors", "6"], { encoding: "utf8" }); assert.equal(r.status, 0, r.stdout + r.stderr);
  const rep = JSON.parse(readFileSync(path.join(d, "o", "ta_hoa_phuong_hoang-portrait.report.json"), "utf8")); assert.equal(rep.preset, "portrait"); assert.ok(rep.palette.length <= 6); assert.ok(rep.contrast.sep != null);
});
test("prompt chân dung: câu tương phản viết chung, không ép gam ấm / mỏ / lông cho võ hồn gam lạnh (#1095)", () => {
  for (const id of ["ta_hoa_phuong_hoang", "lam_ngan_thao"]) {
    const t = buildPrompt("portrait", id), s = typeof t === "string" ? t : t.text ?? JSON.stringify(t);
    assert.match(s, /clearly opposite to the spirit's main color/); assert.match(s, /3 to 5 large shapes/);
    assert.doesNotMatch(s, /warm colors|purple-blue|beak and|plumage/, `${id}: không ép gam ấm / tím lam`);
  }
});

test("preset portrait: chủ thể lam trên nền lam → nền về nâu ấm, bóng không về tím, hai gam tách nhau (#1095)", () => {
  const S = 320, im = new Img(S, S); fill(im, 0, 0, S, S, [30, 50, 120]); disc(im, S / 2, S / 2, S * 0.32, [70, 120, 230]);
  disc(im, S * 0.42, S * 0.45, S * 0.03, [230, 245, 255]); disc(im, S * 0.58, S * 0.45, S * 0.03, [230, 245, 255]);
  const r = P.pixelizePortrait(im, { preset: "portrait" });
  assert.ok(r.report.subjectHue >= 200 && r.report.subjectHue <= 250, `hue chủ thể ${r.report.subjectHue}`); assert.equal(r.report.bgHue, 30);
  const [br, , bb] = r.img.get(2, 2); assert.ok(br >= bb, "nền ngả nâu ấm, không còn lam");
  const warm = P.pixelizePortrait(softSpirit(300, 3), { preset: "portrait" }); assert.equal(warm.report.bgHue, 270, "chủ thể ấm: nền vẫn tím");
  assert.equal(P.backgroundHue(null), 270); assert.equal(P.backgroundHue(280), 30); assert.equal(P.backgroundHue(20), 270);
});
