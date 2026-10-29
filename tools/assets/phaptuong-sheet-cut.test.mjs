import { test } from "node:test";
import assert from "node:assert/strict";
import { Img, ISO_DIRS } from "./lib.mjs";
import { cutSheets } from "./phaptuong-sheet-cut.mjs";

function fixture() {
  return Object.fromEntries(ISO_DIRS.map((dir, d) => {
    const im = new Img(1024, 1024);
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) im.set(x, y, [255, 0, 255, 255]);
    for (let f = 0; f < 16; f++) for (let y = 80; y <= 200; y++) for (let x = 100; x <= 156; x++) im.set(f % 4 * 256 + x, Math.floor(f / 4) * 256 + y, [20 + d * 4, 80 + f * 3, 180, 255]);
    return [dir, im];
  }));
}

test("ghép đúng thứ tự hướng và 8 thở + 8 đánh, nền trong suốt, neo chân cố định", () => {
  const { sheet, colors } = cutSheets(fixture());
  assert.equal(sheet.w, 2560); assert.equal(sheet.h, 800); assert.ok(colors <= 48);
  assert.equal(sheet.get(0, 0)[3], 0);
  assert.notDeepEqual(sheet.get(80, 124).slice(0, 3), sheet.get(15 * 160 + 80, 4 * 160 + 124).slice(0, 3));
  for (let d = 0; d < 5; d++) for (let f = 0; f < 16; f++) {
    assert.equal(sheet.get(f * 160 + 80, d * 160 + 124)[3], 255);
    assert.equal(sheet.get(f * 160 + 80, d * 160 + 125)[3], 0);
  }
});

test("từ chối thiếu hướng, sai tỉ lệ, ô rỗng và hình chạm mép", () => {
  const missing = fixture(); delete missing.n;
  assert.throws(() => cutSheets(missing), /n: cần tờ vuông/);
  const ratio = fixture(); ratio.e = new Img(1536, 1024);
  assert.throws(() => cutSheets(ratio), /e: cần tờ vuông/);
  const empty = fixture(); empty.s = new Img(1024, 1024);
  assert.throws(() => cutSheets(empty), /ô rỗng/);
  const edge = fixture(); edge.s.set(0, 100, [0, 40, 90, 255]);
  assert.throws(() => cutSheets(edge), /chạm mép/);
});
