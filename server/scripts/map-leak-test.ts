// #739: Map toàn cục không được chỉ tăng theo uptime. Khung thú vương hết hạn thì bỏ khỏi kingClaimCache; mục lastFoe của đấu trường bị dọn
// khi cả hai bên rời hàng sau ARENA.rematchSettleSecs.
import assert from "node:assert/strict";
import { ARENA } from "../../shared/data.ts";
import { kingClaimTest } from "../src/rooms/MapRoom.ts";
import { arenaLastFoeTest, sweepLastFoe } from "../src/rooms/arenaQueue.ts";

const now = Date.now(), seat = { id: "s", owner: null, state: "alive" as const, leaveAt: 0 };
const slotDoc = (slot: number, until: number) => ({ slot, until, boss: "b", seats: [seat], claimed: [slot] });
const doc = (...ds: ReturnType<typeof slotDoc>[]) => Object.fromEntries(ds.map((d) => [String(d.slot), d]));

// kingClaimCache: khung còn hạn được nhớ, khung hết hạn không được tạo.
const m = "map-leak-test", base = kingClaimTest.size();
kingClaimTest.apply(m, doc(slotDoc(1, now + 60_000), slotDoc(2, now - 1)));
assert.equal(kingClaimTest.has(m, 1), true);
assert.equal(kingClaimTest.has(m, 2), false, "khung đã hết hạn không được tạo khóa");
// Khung biến khỏi tài liệu thì khóa bị bỏ.
kingClaimTest.apply(m, doc(slotDoc(3, now + 60_000)));
assert.equal(kingClaimTest.has(m, 1), false, "khung không còn trong tài liệu phải bị bỏ");
assert.equal(kingClaimTest.has(m, 3), true);
// Khung hết hạn theo đồng hồ: kingRecs bỏ khung và khóa của nó.
kingClaimTest.recs(m, now + 120_000);
assert.equal(kingClaimTest.has(m, 3), false, "kingRecs phải dọn khóa của khung hết hạn");
assert.equal(kingClaimTest.size(), base, "kingClaimCache không còn mục thừa");
console.log("✓ kingClaimCache: dọn theo khung hết hạn / biến mất");

// lastFoe: giữ khi còn trong hàng hoặc chưa hết ARENA.rematchSettleSecs, xóa khi cả hai đã rời.
const settle = ARENA.rematchSettleSecs * 1000, t0 = 1_000_000, none = new Set<string>();
arenaLastFoeTest.set("a", "b", t0);
assert.equal(sweepLastFoe(none, t0 + settle - 1), 0, "chưa hết rematchSettleSecs thì giữ");
assert.equal(sweepLastFoe(new Set(["b"]), t0 + settle), 0, "một bên còn trong hàng thì giữ cả hai mục");
assert.equal(arenaLastFoeTest.size(), 2);
assert.equal(sweepLastFoe(none, t0 + settle), 2, "cả hai rời hàng sau rematchSettleSecs thì xóa");
assert.equal(arenaLastFoeTest.size(), 0);
console.log("✓ lastFoe: dọn khi cả hai bên rời hàng sau rematchSettleSecs");
process.exit(0);
