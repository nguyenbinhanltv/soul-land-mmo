// Trợ năng (#600): lớp body theo tuỳ chọn, ký hiệu bậc, bảng phím khớp GameScene.ts, CSS mù màu đủ 5 bậc, tab Cài đặt đủ 5.
// Chạy: node --experimental-strip-types client/scripts/a11y-test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { A11Y_STORAGE_KEY, FONT_SIZES, KEY_GROUPS, TIER_GLYPHS, a11yClasses, readA11yPrefs, tierGlyph } from "../src/a11y.ts";

assert.deepEqual(a11yClasses({ font: 0, colorblind: false }), []);
assert.deepEqual(a11yClasses({ font: 2, colorblind: true }), ["a11y-fs-2", "a11y-cb"]);
assert.equal(FONT_SIZES.length, 3); assert.deepEqual(FONT_SIZES.map((f) => f.k), [1, 1.25, 1.5]);
assert.deepEqual(readA11yPrefs(), { font: 0, colorblind: false }, "không có localStorage thì mặc định");

assert.equal(TIER_GLYPHS.length, 5); assert.equal(new Set(TIER_GLYPHS).size, 5, "mỗi bậc một hình riêng");
assert.equal(tierGlyph(-3), "○"); assert.equal(tierGlyph(9), "★");

const root = new URL("../src/", import.meta.url);
const css = readFileSync(new URL("ui2-settings.css", root), "utf8");
for (let t = 0; t < 5; t++) assert.ok(css.includes(`.ui-chip[data-tier="${t}"]::before{content:`) || css.includes(`.ui-chip[data-tier="${t}"]::before{content:`), `chip bậc ${t} có ký hiệu`);
for (const t of [0, 1, 3, 4]) assert.ok(css.includes(`.ui-cell[data-tier="${t}"]:not(.empty)::before`), `ô bậc ${t} đổi hình (bậc 2 giữ hình vuông)`);
assert.ok(css.includes("html.reduce-motion *"), "giảm chuyển động toàn cục");
assert.ok(!/body\.a11y-fs-\d[^{]*\{[^}]*font-size/.test(css), "cỡ chữ chỉ đổi token --fs-*");

// mỗi phím ghi trong bảng phải thật sự được GameScene xử lý
const scene = readFileSync(new URL("scenes/GameScene.ts", root), "utf8"), bar = readFileSync(new URL("hudBar.ts", root), "utf8");
for (const g of KEY_GROUPS) for (const r of g.rows) {
  if (r.code === "Arrow") continue;
  const ok = scene.includes(`"${r.code}"`) || scene.includes(`e.code === "${r.code}"`) || /^Digit/.test(r.code) || ["KeyU", "KeyZ", "KeyR", "KeyG"].includes(r.code);
  assert.ok(ok, `${r.key}: GameScene không xử lý ${r.code}`);
}
assert.ok(bar.includes('SKILL_KEYS = ["U", "I", "O", "P"]') && bar.includes('BONE_SKILL_KEYS = ["Z", "X", "C"]') && bar.includes('AVA_KEY = "R"') && bar.includes('FUSION_KEY = "G"'), "bảng phím lệch hud");

// Cài đặt: 5 tab, mỗi tab một trang
const panel = readFileSync(new URL("audio/settingsPanel.ts", root), "utf8");
const tabs = [...panel.matchAll(/\["(\w+)", "[^"]+"\]/g)].map((m) => m[1]).filter((id) => ["audio", "fx", "ui", "a11y", "keys"].includes(id));
assert.deepEqual(tabs, ["audio", "fx", "ui", "a11y", "keys"]);
for (const id of tabs) assert.ok(panel.includes(`data-set-page="${id}"`), `thiếu trang ${id}`);
console.log("a11y: ok");
