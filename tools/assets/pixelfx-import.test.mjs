// Thử pixelfx-import.mjs (#1802): chọn khung, cắt chung, xếp lưới, bảng màu khớp ELEMENT_COL, bản nhập trong repo khớp nguon.json.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { rampOf, loadRamps, pickFrames, unionBox, cropImg, packGrid, processFx, renderArgs, keyOf, MAX_W } from "./pixelfx-import.mjs";
import { decodePng, ROOT } from "./lib.mjs";

const img = (w, h, dots = []) => { const data = new Uint8Array(w * h * 4); for (const [x, y] of dots) { data.set([200, 100, 50, 255], (y * w + x) * 4); } return { w, h, data }; };

test("bảng màu hệ trong palettes.json khớp ELEMENT_COL ở skillFx.ts, dải 6 mức tối → sáng", () => {
  const src = readFileSync(path.join(ROOT, "client/src/skillFx.ts"), "utf8"), re = /^\s+(\w+):\s+\{ main: 0x(\w+), hi: 0x(\w+), lo: 0x(\w+) \},?$/gm;
  const el = JSON.parse(readFileSync(path.join(ROOT, "tools/assets/pixelfx/palettes.json"), "utf8")).elements;
  let n = 0;
  for (const m of src.matchAll(re)) { assert.deepEqual(el[m[1]], { main: m[2], hi: m[3], lo: m[4] }, m[1]); n++; }
  assert.equal(n, 8); assert.equal(Object.keys(el).length, 8);
  const r = loadRamps();
  for (const ramp of Object.values(r)) { assert.equal(ramp.length, 6); assert.ok(ramp.every((c) => /^#[0-9a-f]{6}$/.test(c))); }
  assert.deepEqual(rampOf({ main: 0xff7a2a, hi: 0xffe08a, lo: 0x8f2a14 }).slice(1, 2), ["#8f2a14"]);
});

test("pickFrames: bước 2 giữ khung cuối, trần khung nới bước", () => {
  assert.deepEqual(pickFrames(7, 2), [0, 2, 4, 6]);
  assert.deepEqual(pickFrames(6, 2), [0, 2, 4, 5]);
  assert.equal(pickFrames(100, 2, 20).length <= 20, true);
  assert.deepEqual(pickFrames(1, 2), [0]);
});

test("unionBox / cropImg / packGrid: cắt chung, lưới đầy đủ, bề ngang ≤ MAX_W", () => {
  const a = img(10, 10, [[2, 3]]), b = img(10, 10, [[6, 5]]);
  assert.deepEqual(unionBox([a, b]), { x: 2, y: 3, w: 5, h: 3 });
  assert.equal(unionBox([img(4, 4)]), null);
  const c = cropImg(b, unionBox([a, b])); assert.equal(c.data[(2 * 5 + 4) * 4 + 3], 255);
  const frames = Array.from({ length: 50 }, () => img(100, 20, [[1, 1]]));
  const g = packGrid(frames, 100, 20);
  assert.ok(g.img.w <= MAX_W && g.cols === 20 && g.rows === 3 && g.total === 60);
});

test("processFx: bỏ khung trống ở đuôi, tính lại pivot và fps", () => {
  const f = (d) => img(20, 20, d), frames = [f([[5, 6]]), f([[6, 6]]), f([[7, 8]]), f([[8, 8]]), f([]), f([])];
  const o = processFx(frames, [10, 18], 30, { stride: 2 });
  assert.deepEqual(o.meta.frame, [4, 3]); assert.deepEqual(o.meta.pivot, [5, 12]);
  assert.equal(o.meta.frames, 3); assert.equal(o.meta.cells, 3); assert.equal(o.meta.fps, 20);
  const png = decodePng(o.png); assert.equal(png.w, 12); assert.equal(png.h, 3);
  assert.throws(() => processFx([f([])], [0, 0], 30), /trống/);
});

test("renderArgs / keyOf: lệnh xác định, màu hệ truyền qua --opts", () => {
  const pal = loadRamps();
  assert.deepEqual(renderArgs({ id: "spawn/poof", seed: 3 }, pal, "T"), ["tools/render.mjs", "spawn/poof", "--sheet", "--no-actor", "--seed", "3", "--out", "T"]);
  const a = renderArgs({ id: "ui/level-up", palette: "light" }, pal, "T");
  assert.deepEqual(JSON.parse(a[a.indexOf("--opts") + 1]), { palette: pal.light });
  assert.equal(keyOf("soul-rise-light"), "fx_pfx_soul_rise_light");
});

test("--check: ảnh, manifest, pixelfx.json, thông báo MIT trong repo khớp nguon.json", () => {
  const r = spawnSync(process.execPath, [path.join(ROOT, "tools/assets/pixelfx-import.mjs"), "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("processFx: bỏ khung trống ở đầu; khung trống giữa được giữ", () => {
  const f = (d) => img(20, 20, d), o = processFx([f([]), f([[5, 5]]), f([]), f([[6, 6]]), f([])], [10, 10], 30, { stride: 1 });
  assert.equal(o.meta.frames, 3); assert.deepEqual(o.meta.pivot, [5, 5]);
});
