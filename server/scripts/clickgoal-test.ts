// Kiểm thử bấm-để-đi (M4 #749, mục 5.11): lái theo shared/clickgoal.ts trong thế giới mô phỏng, hồn thú chặn đường / hồn sư bị choáng
// vẫn tới đích; kẹt thật thì dừng sau CLICK_GOAL.giveUpMs. Hàm thuần, không cần server. Chạy: npm run test:clickgoal --prefix server
import assert from "node:assert/strict";
import { CLICK_GOAL, TILE } from "../../shared/data.ts";
import { moveEnt, PLAYER_HW, PLAYER_HH, type SolidGrid } from "../../shared/move.ts";
import { newGoal, stepGoal, type ClickGoal } from "../../shared/clickgoal.ts";
import type { Pt } from "../../shared/path.ts";

function test(title: string, fn: () => void) { fn(); console.log(`✓ ${title}`); }
function grid(): SolidGrid {
  const MW = 40, MH = 30, solid = new Uint8Array(MW * MH);
  for (let x = 0; x < MW; x++) { solid[x] = 1; solid[(MH - 1) * MW + x] = 1; }
  for (let y = 0; y < MH; y++) { solid[y * MW] = 1; solid[y * MW + MW - 1] = 1; }
  return { MW, MH, solid };
}
const at = (tx: number, ty: number) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 });
const SPEED = 80, DT = 50;

/**
 * Chạy `ms` mili giây theo bước 50 ms: lái bằng stepGoal, đi như server (moveEnt, đứng yên khi `held`). `wall(p)`: vật chắn cứng
 * (hồn thú đứng chắn mà lưới không có) chặn bước đi. Trả về lý do dừng và vị trí cuối.
 */
function run(g: SolidGrid, goal: ClickGoal, p: Pt, ms: number, o: { beasts?: Pt[]; held?: (t: number) => boolean; blocks?: (x: number, y: number) => boolean } = {}) {
  for (let t = 0; t < ms; t += DT) {
    const r = stepGoal(goal, { at: p, near: Math.max(3, SPEED * DT / 1000), now: t, held: o.held?.(t) ?? false, grid: g, beasts: o.beasts ?? [] });
    if (r.end) return { end: r.end, t, p };
    if (r.dir && !o.held?.(t)) {
      const nx = p.x + r.dir.x * SPEED * DT / 1000, ny = p.y + r.dir.y * SPEED * DT / 1000;
      if (!o.blocks?.(nx, ny)) moveEnt(g, p, nx - p.x, ny - p.y, PLAYER_HW, PLAYER_HH);
    }
  }
  return { end: "timeout" as const, t: ms, p };
}

test("đường thông: tới đích, không tính lại", () => {
  const g = grid(), p = at(5, 15), goal = newGoal(g, p, at(25, 15), 0)!;
  const r = run(g, goal, p, 20000);
  assert.equal(r.end, "arrived"); assert.ok(Math.hypot(p.x - at(25, 15).x, p.y - at(25, 15).y) < 8);
});
test("hồn thú đứng chắn đường thẳng (lưới không có): tính lại A* đi vòng, vẫn tới đích", () => {
  const g = grid(), p = at(5, 15), dest = at(25, 15), beast = at(15, 15), goal = newGoal(g, p, dest, 0)!;
  const blocks = (x: number, y: number) => Math.abs(x - beast.x) < TILE / 2 + PLAYER_HW - 1 && Math.abs(y - beast.y) < TILE / 2 + PLAYER_HH - 1;
  const r = run(g, goal, p, 20000, { beasts: [beast], blocks });
  assert.equal(r.end, "arrived"); assert.ok(Math.hypot(p.x - dest.x, p.y - dest.y) < 8, `cách đích ${Math.hypot(p.x - dest.x, p.y - dest.y).toFixed(1)}`);
});
test("bị choáng lâu hơn giới hạn kẹt: không bỏ, hết choáng đi tiếp tới đích", () => {
  const g = grid(), p = at(5, 15), dest = at(25, 15), goal = newGoal(g, p, dest, 0)!;
  const r = run(g, goal, p, 30000, { held: (t) => t >= 1000 && t < 1000 + CLICK_GOAL.giveUpMs * 3 });
  assert.equal(r.end, "arrived"); assert.ok(Math.hypot(p.x - dest.x, p.y - dest.y) < 8);
});
test("bị đẩy lùi giữa đường: tính lại từ chỗ mới, vẫn tới đích", () => {
  const g = grid(), p = at(5, 15), dest = at(25, 15), goal = newGoal(g, p, dest, 0)!;
  const r1 = run(g, goal, p, 1500); assert.equal(r1.end, "timeout");
  p.x -= TILE * 3; p.y += TILE * 2; // đẩy lùi
  const r2 = (() => { for (let t = 1500; t < 30000; t += DT) {
    const r = stepGoal(goal, { at: p, near: 4, now: t, held: false, grid: g, beasts: [] });
    if (r.end) return r.end; if (r.dir) moveEnt(g, p, r.dir.x * SPEED * DT / 1000, r.dir.y * SPEED * DT / 1000, PLAYER_HW, PLAYER_HH);
  } return "timeout"; })();
  assert.equal(r2, "arrived"); assert.ok(Math.hypot(p.x - dest.x, p.y - dest.y) < 8);
});
test("kẹt thật (đứng im mãi, không bị khống chế): bỏ sau cỡ giveUpMs", () => {
  const g = grid(), p = at(5, 15), goal = newGoal(g, p, at(25, 15), 0)!;
  const r = run(g, goal, p, 20000, { blocks: () => true });
  assert.equal(r.end, "blocked");
  assert.ok(r.t >= CLICK_GOAL.giveUpMs - DT && r.t <= CLICK_GOAL.giveUpMs + 2 * CLICK_GOAL.stallMs + 2 * DT, `bỏ lúc ${r.t} ms`);
});
test("điểm do cờ lái (auto) bị kẹt: dừng ngay để flagTick tự tính lại", () => {
  const g = grid(), p = at(5, 15), goal = newGoal(g, p, at(25, 15), 0)!; goal.auto = true;
  const r = run(g, goal, p, 20000, { blocks: () => true });
  assert.equal(r.end, "stalled"); assert.ok(r.t <= 2 * CLICK_GOAL.stallMs + 2 * DT);
});
console.log("✓ clickgoal");
