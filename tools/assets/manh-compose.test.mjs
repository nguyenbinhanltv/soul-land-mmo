// Thử manh-compose.mjs (#1305): ghép khung mảnh + icon võ hồn tất định, đủ 25 võ hồn, đúng màu viền, manifest chèn gọn.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { readVohon, buildMask, composeShard, colorCount, addManifestKeys, SHAPES } from "./manh-compose.mjs";
import { ROOT, SPRITES, MANIFEST, readPng, Img, hex, PORTRAIT_MAX_COLORS } from "./lib.mjs";

const vohon = readVohon();
const icon = (v) => readPng(path.join(SPRITES, "iso", "portrait", `${v.id}_icon24.png`));

test("đọc đủ 25 võ hồn, mỗi mã có icon 24 và đủ ba độ hiếm", () => {
  assert.equal(vohon.length, 25);
  assert.deepEqual([...new Set(vohon.map((v) => v.rarity))].sort(), ["SR", "SSR", "UR"]);
  for (const v of vohon) assert.ok(existsSync(path.join(SPRITES, "iso", "portrait", `${v.id}_icon24.png`)), v.id);
});

test("ba hình dạng khác nhau, ruột đủ rộng để chứa icon", () => {
  const masks = Object.keys(SHAPES).map((r) => buildMask(r));
  assert.equal(new Set(masks.map((m) => m.join(""))).size, 3);
  for (const m of masks) assert.ok(m.reduce((a, b) => a + b, 0) > 500);
});

test("ghép tất định, ≤ PORTRAIT_MAX_COLORS màu, viền ngoài #1a1020, viền khung theo col, icon còn hiện", () => {
  for (const v of vohon) {
    const a = composeShard(v, icon(v)), b = composeShard(v, icon(v));
    assert.deepEqual(a.data, b.data, v.id);
    assert.ok(colorCount(a) <= PORTRAIT_MAX_COLORS, `${v.id}: ${colorCount(a)} màu`);
    assert.equal(a.w, 32); assert.equal(a.h, 32);
    for (let i = 3; i < a.data.length; i += 4) assert.ok(a.data[i] === 0 || a.data[i] === 255, `${v.id}: alpha lẻ`);
    const [r, g, bl] = hex(v.col), mid = [...a.data].reduce((n, _, i) => (i % 4 === 0 && a.data[i + 3] && a.data[i] === r && a.data[i + 1] === g && a.data[i + 2] === bl ? n + 1 : n), 0);
    assert.ok(mid >= 10, `${v.id}: viền màu col chỉ ${mid} điểm`);
    const ic = icon(v); let vis = 0, kept = 0;
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) if (ic.alpha(x, y) >= 128) { vis++; if (a.alpha(x + 4, y + 4)) kept++; }
    assert.ok(kept / vis > 0.7, `${v.id}: khung che mất icon (${kept}/${vis})`);
  }
});

test("icon sai cỡ thì báo lỗi", () => {
  assert.throws(() => composeShard(vohon[0], new Img(32, 32)), /24×24/);
});

test("ảnh trong repo khớp công cụ (--check) và manifest có đủ 25 key", () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools/assets/manh-compose.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const m = readFileSync(MANIFEST, "utf8");
  for (const v of vohon) assert.ok(m.includes(`"item_manh_${v.id}"`), v.id);
});

test("addManifestKeys: chèn sau item_manh_vo_hon theo thứ tự, chạy lại không đổi, giữ kiểu xuống dòng", () => {
  for (const nl of ["\n", "\r\n"]) {
    const blk = (k) => ["    {", `      "key": "${k}",`, '      "iso": true', "    },"].join(nl) + nl;
    const base = blk("item_hon_hoan") + blk("item_manh_vo_hon") + blk("item_ruong"), out = addManifestKeys(base, ["item_manh_b", "item_manh_a"]);
    assert.equal(out, blk("item_hon_hoan") + blk("item_manh_vo_hon") + blk("item_manh_a") + blk("item_manh_b") + blk("item_ruong"));
    assert.equal(addManifestKeys(out, ["item_manh_a", "item_manh_b"]), out);
  }
  assert.throws(() => addManifestKeys("{}", ["item_manh_a"]), /item_manh_vo_hon/);
});
