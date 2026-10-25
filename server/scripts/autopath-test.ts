// Kiểm thử đường đi của tự săn (#291, mục 5.13): clearLine (đi thẳng được không) và findPath (A* khi vướng), hàm thuần, không cần server.
// Chạy: npm run test:autopath --prefix server
import assert from "node:assert/strict";
import { AUTO_MOVE, TILE } from "../../shared/data.ts";
import { clearLine, findPath, pathLength } from "../../shared/path.ts";
import type { SolidGrid } from "../../shared/move.ts";

function test(title: string, fn: () => void) { fn(); console.log(`✓ ${title}`); }
/** Bản đồ 40×30 trống, viền chặn; `wall` thêm một bức tường dọc ở cột 20 từ hàng 5 tới 24 (chừa hai đầu để đi vòng). */
function grid(wall: boolean): SolidGrid {
  const MW = 40, MH = 30, solid = new Uint8Array(MW * MH);
  for (let x = 0; x < MW; x++) { solid[x] = 1; solid[(MH - 1) * MW + x] = 1; }
  for (let y = 0; y < MH; y++) { solid[y * MW] = 1; solid[y * MW + MW - 1] = 1; }
  if (wall) for (let y = 5; y <= 24; y++) solid[y * MW + 20] = 1;
  return { MW, MH, solid };
}
const at = (tx: number, ty: number) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });

test("clearLine: chỗ trống thì thông, có tường ở giữa thì không", () => {
  assert.equal(clearLine(grid(false), at(10, 15), at(30, 15)), true);
  assert.equal(clearLine(grid(true), at(10, 15), at(30, 15)), false);
  assert.equal(clearLine(grid(true), at(10, 15), at(10, 20)), true); // cùng phía tường
});
test("clearLine: cùng một điểm, đường chéo xuyên tường, đường vượt qua đầu tường", () => {
  assert.equal(clearLine(grid(true), at(10, 15), at(10, 15)), true);
  assert.equal(clearLine(grid(true), at(10, 2), at(30, 15)), false);
  assert.equal(clearLine(grid(true), at(10, 2), at(30, 2)), true); // hàng 2 nằm trên đầu tường (hàng 5)
});
test("findPath: đường thẳng thông thì không có điểm giữa, chỉ đích", () => {
  const g = grid(false), a = at(10, 15), b = at(18, 15), path = findPath(g, a, b, AUTO_MOVE.path);
  assert.equal(path.length, 1); assert.ok(Math.hypot(path[0].x - b.x, path[0].y - b.y) < 4);
});
test("findPath: tường chắn ở giữa thì đi vòng qua đầu tường, dài hơn đường thẳng", () => {
  const g = grid(true), a = at(15, 15), b = at(25, 15), path = findPath(g, a, b, AUTO_MOVE.path), end = path.at(-1)!;
  assert.ok(path.length >= 2, "phải có điểm rẽ");
  assert.ok(Math.hypot(end.x - b.x, end.y - b.y) < 4, "tới được đích");
  assert.ok(pathLength(a, path) > Math.hypot(b.x - a.x, b.y - a.y) + TILE, "dài hơn đường thẳng");
  for (let i = 0, p = a; i < path.length; p = path[i++]) assert.ok(clearLine(g, p, path[i]), `đoạn ${i} phải đi thẳng được`);
});
test("Điều kiện tính lại đường thẳng của tự săn: toạ độ NaN (chưa tính) phải tính, gần chỗ cũ thì không", () => {
  // Cùng biểu thức như steer() ở autoHunt.ts: `> 6` với NaN luôn sai nên trước #291 không bao giờ tính (lỗi gốc).
  const stale = (l: { px: number; py: number; bx: number; by: number }, p: { x: number; y: number }, b: { x: number; y: number }) =>
    !(Math.hypot(l.px - p.x, l.py - p.y) <= 6 && Math.hypot(l.bx - b.x, l.by - b.y) <= 6);
  const nan = { px: NaN, py: NaN, bx: NaN, by: NaN }, p = { x: 100, y: 100 }, b = { x: 200, y: 100 };
  assert.equal(Math.hypot(nan.px - p.x, nan.py - p.y) > 6, false); // biểu thức cũ
  assert.equal(stale(nan, p, b), true);
  assert.equal(stale({ px: 100, py: 100, bx: 200, by: 100 }, { x: 103, y: 100 }, { x: 202, y: 100 }), false);
  assert.equal(stale({ px: 100, py: 100, bx: 200, by: 100 }, { x: 110, y: 100 }, b), true);
});
console.log("✓ autopath");
