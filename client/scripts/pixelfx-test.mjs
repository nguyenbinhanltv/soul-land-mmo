// Thử kế hoạch phát hiệu ứng pixelfx (pixelfx.ts, #1802 P2): chọn khóa theo độ hiếm / mức hiệu ứng, bù chân → tâm ô, thiếu meta thì không phát.
import assert from "node:assert/strict";
import { lootKey, pfxPlan, setPixelfxMeta, PFX_STYLE } from "../src/pixelfx.ts";
import { SPR } from "../src/iso.ts";

assert.equal(lootKey(-1, 3, "high"), null, "-1 = tin đầu / không có đồ mới");
assert.equal(lootKey(0, 3, "high"), "fx_pfx_collect_burst");
assert.equal(lootKey(0, 3, "mid"), "fx_pfx_collect_burst");
assert.equal(lootKey(0, 3, "low"), null, "mức Thấp: bỏ đồ thường");
assert.equal(lootKey(3, 3, "low"), "fx_pfx_power_star_light", "đồ hiếm luôn có");
assert.equal(lootKey(5, 3, "high"), "fx_pfx_power_star_light");

assert.equal(pfxPlan("fx_pfx_poof", { x: 1, y: 2 }), null, "chưa có meta: không phát");
setPixelfxMeta({ fx_pfx_poof: { fps: 15, frame: [90, 86], pivot: [45, 80] }, fx_pfx_x: { fps: 10, frame: [10, 10], pivot: [5, 5] } });
const p = pfxPlan("fx_pfx_poof", { x: 10, y: 20, light: true, delay: 50 });
assert.deepEqual([p.key, p.x, p.y, p.scale, p.fps, p.light, p.delay, p.normal], ["fx_pfx_poof", 10, 20, SPR, 15, true, 50, true]);
assert.equal(p.lift, (80 - 43) * SPR, "chân thấp hơn tâm ô thì nâng ảnh lên đúng khoảng đó");
assert.equal(pfxPlan("fx_pfx_x", { x: 0, y: 0 }).lift, 0, "chân ở tâm: không bù");
assert.ok(Object.keys(PFX_STYLE).every((k) => k.startsWith("fx_pfx_")));
console.log("pixelfx-test OK");
