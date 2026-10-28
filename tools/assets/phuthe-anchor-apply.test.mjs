// Thử lệnh ghi neo tay vào anchor.json (phuthe-anchor-apply.mjs).
import test from "node:test";
import assert from "node:assert/strict";
import { applyAnchors } from "./phuthe-anchor-apply.mjs";

const dirs = ["s", "se", "e", "ne", "n"], sex = (dx = 0) => Object.fromEntries(dirs.map((d) => [d, { dx, dy: 0, scale: 1, tx: 0, ty: -26 }]));
const entry = (dx = 0) => ({ frame: 96, m: sex(dx), f: sex(dx), manual: true });

test("gộp mục mới, khóa xếp tên, đánh dấu manual, giữ mục cũ", () => {
  const r = applyAnchors({ b: { ...entry(), manual: false } }, { a: { ...entry(2), manual: undefined } });
  assert.deepEqual(Object.keys(r.all), ["a", "b"]);
  assert.equal(r.all.a.manual, true); assert.equal(r.all.a.m.s.dx, 2); assert.equal(r.all.b.manual, false);
});
test("ghi đè mục manual cũ (người chỉnh là chủ)", () => {
  assert.equal(applyAnchors({ a: entry(1) }, { a: entry(5) }).all.a.m.e.dx, 5);
});
test("mục sai (thiếu hướng, scale ngoài dải) hoặc rỗng thì lỗi, không gộp", () => {
  const bad = entry(); delete bad.f.n; bad.m.s.scale = 9;
  assert.throws(() => applyAnchors({}, { a: bad }), /scale[\s\S]*thiếu f\/n/);
  assert.throws(() => applyAnchors({}, {}), /không có mục/);
});
