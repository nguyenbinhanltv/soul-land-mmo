// Thử kế hoạch phát hiệu ứng pixelfx (pixelfx.ts, #1802 P2): chọn khóa theo độ hiếm / mức hiệu ứng, bù chân → tâm ô, thiếu meta thì không phát.
import assert from "node:assert/strict";
import { deathKeys, hatchKey, reviveKey, lootKey, pfxPlan, setPixelfxMeta, PFX_STYLE } from "../src/pixelfx.ts";
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
assert.deepEqual(deathKeys(0, "high"), [], "thú thường giữ bụi cũ");
assert.deepEqual(deathKeys(1, "mid"), ["fx_pfx_poof"]);
assert.deepEqual(deathKeys(1, "low"), [], "mức Thấp bỏ tinh anh");
assert.deepEqual(deathKeys(2, "high"), ["fx_pfx_poof", "fx_pfx_soul_rise_light"]);
assert.deepEqual(deathKeys(3, "low"), ["fx_pfx_soul_rise_light"], "thú vương / boss luôn có hồn bay lên");
assert.equal(hatchKey("low"), null); assert.equal(hatchKey("mid"), "fx_pfx_poof");
assert.equal(reviveKey("low", false), null, "mức Thấp: người khác bỏ"); assert.equal(reviveKey("low", true), "fx_pfx_respawn_beam_light"); assert.equal(reviveKey("mid", false), "fx_pfx_respawn_beam_light");
console.log("pixelfx-test OK");

// #1818: lớp pixelfx hệ chiêu nhường sheet chính: chỉ phát khi còn dưới nửa trần
import { pfxLayerRoom, elementPfxKey } from "../src/pixelfx.ts";
assert.equal(pfxLayerRoom(0, 10), true); assert.equal(pfxLayerRoom(4, 10), true); assert.equal(pfxLayerRoom(5, 10), false);
assert.equal(pfxLayerRoom(2, 6), true); assert.equal(pfxLayerRoom(3, 6), false); assert.equal(pfxLayerRoom(0, 1), true); assert.equal(pfxLayerRoom(1, 3), false);
assert.equal(elementPfxKey("ice", "hit", "low"), null); assert.equal(elementPfxKey("ice", "hit", "mid"), "fx_pfx_ice_shatter_ice"); assert.equal(elementPfxKey("wood", "hit", "high"), null);

// #1815 nhóm 3: chọn sheet trạng thái
import { statusPfxKeys, STATUS_PFX, STATUS_PFX_CAP, STATUS_PFX_PER_BODY } from "../src/statusPfx.ts";
assert.deepEqual(statusPfxKeys(() => true, "low"), []);
assert.deepEqual(statusPfxKeys((s) => s === "burn", "mid"), ["fx_pfx_st_burning"]);
const all = statusPfxKeys(() => true, "high");
assert.equal(all.length, STATUS_PFX_PER_BODY); assert.deepEqual(all, ["fx_pfx_st_frozen", "fx_pfx_st_stunned"]); // khống chế trước
assert.deepEqual(statusPfxKeys((s) => s === "armor" || s === "silence", "high"), []); // trạng thái chưa có sheet: giữ biểu tượng cũ
assert.ok(Object.values(STATUS_PFX).every((k) => k.startsWith("fx_pfx_st_")) && STATUS_PFX_CAP.low === 0 && STATUS_PFX_CAP.mid < STATUS_PFX_CAP.high);
import { STATUS_PFX_STYLE } from "../src/statusPfx.ts";
assert.ok(STATUS_PFX_STYLE.fx_pfx_st_poisoned.k <= 0.5 && STATUS_PFX_STYLE.fx_pfx_st_poisoned.alpha <= 0.6); // Trúng độc: nhỏ, mờ, không trùm đầu
assert.ok(Object.keys(STATUS_PFX_STYLE).every((k) => Object.values(STATUS_PFX).includes(k)));
import { STATUS_PFX_DEPTH } from "../src/statusPfx.ts";
assert.ok(STATUS_PFX_DEPTH < 99983.8 && STATUS_PFX_DEPTH < 99984); // dưới bảng danh hiệu (titlePlate.ts) và tên
