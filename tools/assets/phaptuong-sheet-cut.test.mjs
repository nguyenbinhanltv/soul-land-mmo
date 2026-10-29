import { test } from "node:test";
import assert from "node:assert/strict";
import { Img, ISO_DIRS, hex, OUTLINE, ROOT, SPRITES, readPng } from "./lib.mjs";
import path from "node:path";
import { cutSheets, backgroundMask } from "./phaptuong-sheet-cut.mjs";

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

test("chỉ gỡ hồng sát nền, giữ bóng tím trong thân và có thể tắt khử viền", () => {
  const sheets = fixture(), im = sheets.s;
  im.set(100, 120, [48, 0, 96, 255]);
  for (let y = 135; y <= 145; y++) for (let x = 123; x <= 133; x++) im.set(x, y, [48, 0, 96, 255]);
  const mask = backgroundMask(im);
  assert.equal(mask[120 * im.w + 100], 1);
  assert.equal(mask[140 * im.w + 128], 0);
  assert.equal(backgroundMask(im, { despill: false })[120 * im.w + 100], 0);
  const { sheet } = cutSheets(sheets);
  assert.ok(sheet.get(80, 69)[3], "bóng tím nằm sâu vẫn có alpha sau thu");
  assert.ok(sheet.get(80, 69)[0] > sheet.get(80, 69)[1], "không thay bóng tím bằng màu xanh của thân");
});

test("viền tối kề trong suốt về OUTLINE trước khi lượng tử", () => {
  const sheets = fixture();
  for (const im of Object.values(sheets)) for (let f = 0; f < 16; f++) {
    for (let y = 80; y <= 84; y++) for (let x = 100; x <= 156; x++) im.set(f % 4 * 256 + x, Math.floor(f / 4) * 256 + y, [0, 0, 8, 255]);
  }
  const { sheet } = cutSheets(sheets), outline = hex(OUTLINE);
  assert.ok(Array.from({ length: sheet.w * sheet.h }, (_, i) => i).some((i) => sheet.data[i * 4 + 3] && outline.every((v, c) => sheet.data[i * 4 + c] === v)));
});

test("sheet Lam Ngân Thảo đã nhập tái tạo được từ năm RAW", () => {
  const sheets = Object.fromEntries(ISO_DIRS.map((d) => [d, readPng(path.join(ROOT, "art/src/phap-tuong/lam_ngan_thao", `${d}.png`))]));
  const { sheet } = cutSheets(sheets), committed = readPng(path.join(SPRITES, "phaptuong/lam_ngan_thao.png"));
  assert.equal(sheet.w, committed.w); assert.equal(sheet.h, committed.h);
  assert.ok(Buffer.from(sheet.data).equals(Buffer.from(committed.data)));
});
