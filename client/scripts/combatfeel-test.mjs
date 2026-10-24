import assert from "node:assert/strict";
import { damageTextStyle, footDustCount, HIT_HE_STYLE } from "../src/combatFeelRules.ts";

assert.equal(footDustCount("low", false, true), 0);
assert.equal(footDustCount("mid", true, true), 0);
assert.equal(footDustCount("mid", false, true), 3);
assert.equal(footDustCount("mid", false, false), 1);
assert.equal(footDustCount("high", false, true), 5);
assert.notEqual(HIT_HE_STYLE.cuong_cong.shape, HIT_HE_STYLE.man_cong.shape);
assert.notEqual(HIT_HE_STYLE.khong_che.fps, HIT_HE_STYLE.phu_tro.fps);
assert.ok(damageTextStyle("heal", false, undefined).color !== damageTextStyle("damage", false, "fire").color);
assert.ok(damageTextStyle("crit", true, "ice").font > damageTextStyle("damage", false, "ice").font);
assert.equal(damageTextStyle("heal", false, undefined).color, "#7dff8a");
assert.equal(damageTextStyle("shield", false, undefined).color, "#9ad8ff");
console.log("combatfeel-test: đạt");
