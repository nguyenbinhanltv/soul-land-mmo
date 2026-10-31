// #739: Map toàn cục không được chỉ tăng theo uptime. Khung thú vương hết hạn thì bỏ khỏi kingClaimCache; mục lastFoe của đấu trường bị dọn
// khi cả hai bên rời hàng quá hạn (trận + ARENA.rematchSecs).
import assert from "node:assert/strict";
import { ARENA, CHANNEL_CD } from "../../shared/data.ts";
import { channelSwitchAt, leftRoom, sweepChannelMaps } from "../src/rooms/procState.ts";
import { kingClaimTest } from "../src/rooms/testState.ts";
import { LAST_FOE_TTL_MS, arenaLastFoeTest, sweepLastFoe } from "../src/rooms/arenaQueue.ts";

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

// lastFoe: giữ trong lúc đấu và cửa sổ chờ lại, xóa khi cả hai đã rời hàng quá LAST_FOE_TTL_MS.
const ttl = LAST_FOE_TTL_MS, t0 = 1_000_000, none = new Set<string>();
arenaLastFoeTest.set("a", "b", t0);
assert.equal(sweepLastFoe(none, t0 + ARENA.rematchSettleSecs * 1000 + 1), 0, "đang đấu (vắng hàng quá rematchSettleSecs) thì vẫn giữ");
assert.equal(sweepLastFoe(none, t0 + ttl - 1), 0, "chưa hết trận + rematchSecs thì giữ");
assert.equal(sweepLastFoe(new Set(["b"]), t0 + ttl), 0, "một bên còn trong hàng thì giữ cả hai mục");
assert.equal(arenaLastFoeTest.size(), 2);
assert.equal(sweepLastFoe(none, t0 + ttl), 2, "cả hai rời hàng quá hạn thì xóa");
assert.equal(arenaLastFoeTest.size(), 0);
console.log("✓ lastFoe: giữ suốt trận + rematchSecs, dọn khi cả hai bên rời hàng quá hạn");

// #957: channelSwitchAt / leftRoom: dòng hết hạn bị dọn, dòng còn hạn giữ nguyên.
const cs = CHANNEL_CD * 1000, tc = 5_000_000, lock = (until: number) => ({ mapId: "m", roomId: "r", ch: 1, until });
channelSwitchAt.set(1, tc - cs); channelSwitchAt.set(2, tc - cs + 1);
leftRoom.set(1, lock(tc)); leftRoom.set(2, lock(tc + 1));
assert.equal(sweepChannelMaps(tc), 2, "một dòng mỗi Map hết hạn");
assert.deepEqual([...channelSwitchAt.keys()], [2], "channelSwitchAt còn hạn giữ nguyên");
assert.deepEqual([...leftRoom.keys()], [2], "leftRoom còn hạn giữ nguyên");
assert.equal(sweepChannelMaps(tc + cs), 2);
assert.equal(channelSwitchAt.size + leftRoom.size, 0);
console.log("✓ channelSwitchAt / leftRoom: dọn dòng hết hạn, giữ dòng còn hạn");
process.exit(0);
