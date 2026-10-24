import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Img, encodePng, readPng } from "./lib.mjs";
import { inspectPng, packAtlas, optimizePng, renderPreview, qualityCheck } from "./quality.mjs";

function samplePng(w = 4, h = 3) {
  const img = new Img(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) img.set(x, y, [x ? 26 : 0, y ? 16 : 0, 32, x && y ? 255 : 0]);
  return encodePng(img);
}

test("inspectPng báo kích thước, bảng màu, viền và neo của asset", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "asset-quality-"));
  const file = path.join(dir, "sprite.png");
  writeFileSync(file, samplePng());
  const result = inspectPng(file, { frame: [4, 3], origin: [2, 2], palette: new Set(["#1a1020"]), requireOutline: true });
  assert.deepEqual(result.size, [4, 3]);
  assert.deepEqual(result.frame, [4, 3]);
  assert.deepEqual(result.origin, [2, 2]);
  assert.equal(result.hasOutline, true);
  assert.equal(result.colors, 1);
  assert.equal(result.bytes, readFileSync(file).length);
});

test("optimizePng giữ nguyên từng điểm ảnh và không làm file lớn hơn", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "asset-quality-"));
  const input = path.join(dir, "in.png"), output = path.join(dir, "out.png");
  writeFileSync(input, samplePng(12, 8));
  const result = optimizePng(input, output);
  assert.deepEqual(readPng(output).data, readPng(input).data);
  assert.ok(result.after <= result.before);
});

test("packAtlas xếp asset theo manifest, tách trang khi đầy và ghi tọa độ", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "asset-quality-"));
  mkdirSync(path.join(dir, "sprites"));
  writeFileSync(path.join(dir, "sprites", "a.png"), samplePng(3, 2));
  writeFileSync(path.join(dir, "sprites", "b.png"), samplePng(3, 2));
  const result = packAtlas([
    { key: "a", file: "sprites/a.png", frame: [3, 2] },
    { key: "b", file: "sprites/b.png", frame: [3, 2] },
  ], { root: dir, outDir: path.join(dir, "atlas"), size: 4, padding: 1 });
  assert.equal(result.pages.length, 2);
  assert.deepEqual(result.sprites.a.frame, [3, 2]);
  assert.deepEqual(result.sprites.b.frame, [3, 2]);
  assert.notEqual(result.sprites.a.page, result.sprites.b.page);
});

test("renderPreview tạo trang xem chung có key và thông tin chất lượng", () => {
  const html = renderPreview({
    assets: [{ key: "a", url: "sprites/a.png", size: [3, 2], colors: 2, bytes: 12, origin: [1, 1] }],
  }, { title: "Preview asset" });
  assert.match(html, /Preview asset/);
  assert.match(html, /sprites\/a\.png/);
  assert.match(html, /data-key="a"/);
});

test("qualityCheck báo origin manifest sai so với neo chuẩn của sheetSpec", () => {
  const manifest = JSON.parse(readFileSync(path.join(process.cwd(), "shared/assets/sprites/manifest.json"), "utf8"));
  const source = manifest.sprites.find((entry) => typeof entry !== "string" && entry.key === "hs_body_m_0");
  const result = qualityCheck({ sprites: [{ ...source, origin: [0, 0] }] });
  assert.match(result.errors.join("\n"), /hs_body_m_0: manifest\.origin lệch neo/);
  assert.deepEqual(result.assets[0].expectedOrigin, [32, 58]);
});
