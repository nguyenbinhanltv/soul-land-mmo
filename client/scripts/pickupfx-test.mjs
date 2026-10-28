// Thử kế hoạch chữ bay khi nhận (pickupFx.ts, #599): ưu tiên, cắt theo mức hiệu ứng, Giảm chuyển động, gom kinh nghiệm.
import assert from "node:assert/strict";
import { planPickup, xpDelta, XpBatch, XP_FLUSH_MS, MAX_LINES, LINE_GAP, xpText } from "../src/pickupFx.ts";

const L = [{ kind: "xp", text: "x", col: "#1" }, { kind: "coin", text: "c", col: "#2" }, { kind: "item", text: "i1", col: "#3" }, { kind: "item", text: "i2", col: "#4" }, { kind: "item", text: "i3", col: "#5" }];
const hi = planPickup(L, "high", false);
assert.deepEqual(hi.map((s) => s.text), ["i1", "i2", "i3", "c"], "đồ trước, rồi Hồn Tệ; kinh nghiệm bị cắt khi quá 4 dòng");
assert.equal(planPickup(L, "mid", false).length, MAX_LINES.mid);
assert.deepEqual(planPickup(L, "low", false).map((s) => s.text), ["i1"], "mức thấp chỉ một dòng quan trọng nhất");
assert.deepEqual(hi.map((s) => s.dy), [0, LINE_GAP, 2 * LINE_GAP, 3 * LINE_GAP]);
assert.ok(hi.every((s, i) => i === 0 || s.delay > hi[i - 1].delay), "so le thời gian");
assert.ok(hi.every((s) => s.drift) && planPickup(L, "high", true).every((s) => !s.drift), "Giảm chuyển động: không bay");
assert.deepEqual(planPickup([], "high", false), []);

const a = { vh: 1, level: 5, xp: 10 };
assert.equal(xpDelta(null, a), 0);
assert.equal(xpDelta(a, { ...a, xp: 25 }), 15);
assert.equal(xpDelta(a, { ...a, xp: 5 }), 0, "xp giảm: không phải nhận");
assert.equal(xpDelta(a, { vh: 1, level: 6, xp: 40 }), 0, "lên cấp: xp đã về mốc mới, không tính");
assert.equal(xpDelta(a, { vh: 2, level: 5, xp: 40 }), 0, "đổi võ hồn: không tính");

const b = new XpBatch();
b.add(5, 1000); b.add(7, 1200);
assert.equal(b.take(1000 + XP_FLUSH_MS - 1), 0);
assert.equal(b.take(1000 + XP_FLUSH_MS), 12, "gom cả hai lần tăng");
assert.equal(b.take(5000), 0, "đã lấy thì rỗng");
b.add(0, 6000); b.add(-3, 6000); assert.equal(b.take(9999), 0, "số không / âm bị bỏ");
assert.equal(xpText(1500), "+1.500 kinh nghiệm");
console.log("pickupfx-test: đạt");
