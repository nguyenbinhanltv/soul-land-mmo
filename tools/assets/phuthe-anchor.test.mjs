// Thử neo phụ thể theo tâm khối thân (tools/assets/phuthe-anchor.mjs): bào mòn bỏ lông / đuôi mảnh, tâm khối thân, scale vào dải 1,3–1,6, tệp anchor.json trong repo.
import test from "node:test";
import assert from "node:assert/strict";
import { Img } from "./lib.mjs";
import { bodyCore, erode, coreOf, bodyTarget, solveAnchor, buildAnchors, checkAnchors, readAnchors, RATIO, SCALE_RANGE, GROW_MAX } from "./phuthe-anchor.mjs";
import { DIRS, SEXES, frameOrigin } from "./phuthe-sheet-lib.mjs";

const F = 96;
/** Mặt nạ thử: thân đặc hình chữ nhật (x0..x1, y0..y1) + đuôi mảnh rộng 2 điểm kéo dài sang phải. */
function blob(x0, y0, x1, y1, tail = true) {
  const m = new Uint8Array(F * F);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) m[y * F + x] = 1;
  if (tail) for (let x = x1; x < 94; x++) for (let y = 40; y < 42; y++) m[y * F + x] = 1;
  return m;
}
const img = (mask) => { const im = new Img(F, F); for (let i = 0; i < mask.length; i++) if (mask[i]) im.data.set([200, 60, 20, 255], i * 4); return im; };

test("bào mòn bỏ đuôi mảnh, giữ khối thân: tâm không bị kéo về phía đuôi, cao ≈ thân", () => {
  const m = blob(30, 20, 49, 59);                       // thân 20 × 40, tâm (40, 40)
  const c = bodyCore(m, F, 3);
  assert.ok(Math.abs(c.cx - 40) < 0.6 && Math.abs(c.cy - 40) < 0.6, `tâm ${c.cx},${c.cy}`);
  assert.equal(c.h, 40);
  // hộp bao thì lệch: tâm hộp bao ≈ (62, 40) so với thân 40
  assert.ok(erode(m, F, F, 3)[41 * F + 80] === 0, "đuôi rộng 2 điểm bị xóa");
});

test("vật mảnh (mất sạch khi bào mòn) vẫn có tâm nhờ giảm dần số lần bào mòn; khung trống → null", () => {
  const thin = new Uint8Array(F * F); for (let y = 30; y < 50; y++) for (let x = 40; x < 43; x++) thin[y * F + x] = 1;
  const c = bodyCore(thin, F, 5);
  assert.ok(c && c.erode < 5 && Math.abs(c.cx - 41.5) < 1 && c.h >= 20);
  assert.equal(bodyCore(new Uint8Array(F * F), F, 5), null);
});

test("coreOf lấy trung vị qua các khung và hợp hai nửa (sau + trước thân)", () => {
  const a = img(blob(20, 20, 39, 59, false)), b = img(blob(40, 20, 59, 59, false)); // hai nửa ghép thành một khối 40 × 40 tâm (40, 40)
  const c = coreOf([a, b], [{ x0: 0, y0: 0 }], F, 3);
  assert.ok(Math.abs(c.cx - 40) < 0.6 && Math.abs(c.cy - 40) < 0.6, `${c.cx},${c.cy}`);
});

test("scale: trong dải 1,3–1,6 giữ 1; quá lớn thu về 1,6; quá nhỏ KHÔNG phóng to mặc định (--grow thì kéo lên 1,3); (dx, dy) đưa tâm về giữa lưng", () => {
  const target = bodyTarget("m", "s", F), [ox, oy] = frameOrigin(F), H = target.bodyH;
  const core = (ratio) => ({ cx: 60, cy: 30, h: ratio * H });
  assert.equal(solveAnchor(core(1.45), target, F).scale, 1);
  const big = solveAnchor(core(2.5), target, F); assert.equal(big.scale, Math.round((RATIO[1] / 2.5) * 100) / 100);
  assert.equal(solveAnchor(core(1.0), target, F).scale, GROW_MAX);
  assert.equal(solveAnchor(core(1.0), target, F, RATIO, SCALE_RANGE[1]).scale, 1.3);
  // sau phóng quanh gốc chân rồi dời, tâm khối thân rơi đúng điểm đích
  const a = solveAnchor(core(2.5), target, F), cx = ox + (60 - ox) * a.scale + a.dx, cy = oy + (30 - oy) * a.scale + a.dy;
  assert.ok(Math.abs(cx - (ox + target.tx)) < 0.02 && Math.abs(cy - (oy + target.ty)) < 0.02, `${cx},${cy}`);
});

test("đích là giữa lưng thân LPC (trên gốc chân, giữa thân) cho mọi giới / hướng; se / ne theo hàng e", () => {
  for (const sex of SEXES) for (const d of DIRS) {
    const t = bodyTarget(sex, d, F);
    assert.ok(t.ty < -10 && t.ty > -45 && Math.abs(t.tx) < 12 && t.bodyH > 30, `${sex}/${d} ${JSON.stringify(t)}`);
  }
  assert.deepEqual(bodyTarget("m", "se", F), bodyTarget("m", "e", F));
});

test("buildAnchors: đủ 2 giới × 5 hướng, checkAnchors không lỗi; thiếu hướng / scale ngoài khoảng thì báo", () => {
  const im = img(blob(30, 20, 49, 59)), layout = { frames: () => [{ x0: 0, y0: 0 }] };
  const e = buildAnchors([im, null], layout, F);
  assert.deepEqual(checkAnchors("x", e), []);
  assert.equal(checkAnchors("x", { ...e, m: { s: e.m.s } }).length, 4 + 0 * 1, "thiếu 4 hướng nam");
  assert.match(checkAnchors("x", { ...e, f: { ...e.f, s: { ...e.f.s, scale: 5 } } })[0], /scale/);
  assert.match(checkAnchors("x", { frame: 64 })[0], /frame/);
});

test("anchor.json trong repo: mọi mục hợp lệ", () => {
  for (const [id, e] of Object.entries(readAnchors())) assert.deepEqual(checkAnchors(id, e), [], id);
});
