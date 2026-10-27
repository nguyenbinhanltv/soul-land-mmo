import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Img, encodePng, decodePng, quantChannel, quantizeNormal, normalAngleError } from "./lib.mjs";
import { quantFile } from "./normal-quant.mjs";

test("quantChannel giữ 128 (phẳng) và 255, còn lại rơi vào lưới 5 bit", () => {
  assert.equal(quantChannel(128), 128);
  assert.equal(quantChannel(255), 255);
  assert.equal(quantChannel(0), 0);
  assert.equal(quantChannel(250), 248);
  assert.equal(quantChannel(251), 255);
  for (let v = 0; v < 256; v++) assert.ok(v >= 251 ? quantChannel(v) === 255 : quantChannel(v) % 8 === 0 && Math.abs(quantChannel(v) - v) <= 4);
  assert.equal(quantChannel(77, 8), 77);
});

test("quantizeNormal chỉ đụng điểm có alpha, sai số góc nhỏ, chạy lại không đổi", () => {
  const img = new Img(32, 32);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const nx = Math.sin(x / 5) * 0.6, ny = Math.cos(y / 7) * 0.6, nz = Math.sqrt(1 - nx * nx - ny * ny);
    img.set(x, y, [Math.round((nx + 1) * 127.5), Math.round((ny + 1) * 127.5), Math.round((nz + 1) * 127.5), x < 4 ? 0 : 255]);
  }
  const orig = new Img(32, 32, img.data.slice()), q = quantizeNormal(new Img(32, 32, img.data.slice()));
  for (let i = 0; i < orig.data.length; i += 4) if (!orig.data[i + 3]) assert.deepEqual([...q.data.slice(i, i + 4)], [...orig.data.slice(i, i + 4)]);
  const err = normalAngleError(orig, q);
  assert.ok(err.mean < 2 && err.max < 4, `sai số ${err.mean} / ${err.max}`);
  const again = quantizeNormal(new Img(32, 32, q.data.slice()));
  assert.deepEqual([...again.data], [...q.data]);
});

test("quantFile ghi đè file _n nhỏ hơn, lần hai không đổi", () => {
  const img = new Img(64, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) img.set(x, y, [(x * 37 + y * 11) & 255, (x * 5 + y * 29) & 255, 200 + ((x + y) & 31), 255]);
  const f = path.join(mkdtempSync(path.join(os.tmpdir(), "nq-")), "a_n.png");
  writeFileSync(f, encodePng(img));
  const r = quantFile(f);
  assert.ok(r.bytesAfter < r.bytesBefore && !r.quantized);
  assert.equal(readFileSync(f).length, r.bytesAfter);
  assert.equal(decodePng(readFileSync(f)).w, 64);
  const r2 = quantFile(f);
  assert.ok(r2.quantized && r2.bytesAfter === r2.bytesBefore);
});

test("quantFile vẫn ghi khi PNG sau lượng tử không nhỏ hơn, để --check qua được", () => {
  const img = new Img(2, 2);
  img.set(0, 0, [130, 128, 255, 255]); img.set(1, 0, [128, 128, 255, 255]); img.set(0, 1, [128, 128, 255, 255]); img.set(1, 1, [128, 128, 255, 255]);
  const f = path.join(mkdtempSync(path.join(os.tmpdir(), "nq-")), "b_n.png");
  writeFileSync(f, encodePng(img));
  const r = quantFile(f);
  assert.equal(r.quantized, false);
  assert.deepEqual([...decodePng(readFileSync(f)).data.slice(0, 3)], [128, 128, 255]);
  assert.equal(quantFile(f, 5, false).quantized, true);
});
