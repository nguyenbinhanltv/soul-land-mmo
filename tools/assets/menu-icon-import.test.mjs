import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildIcons, BUDGET, FRAMES } from "./menu-icon-import.mjs";
import { decodePng } from "./lib.mjs";

test("16 icon menu × 2 bản, đúng khung, trong ngân sách, khóa đúng danh sách client", () => {
  const { files, keys } = buildIcons();
  assert.equal(keys.length, 16);
  const ui = readFileSync(new URL("../../client/src/uiIcons.ts", import.meta.url), "utf8");
  for (const k of keys) assert.ok(ui.includes(`"${k.slice(8)}"`), k);
  assert.equal(files.size, 32);
  const sum = { 2: 0, 1: 0 };
  for (const [f, buf] of files) {
    const img = decodePng(buf), one = f.endsWith("_1x.png");
    assert.equal(img.w, one ? FRAMES._1x : FRAMES[""]); assert.equal(img.h, img.w);
    assert.ok([...Array(img.w * img.h).keys()].some((i) => img.data[i * 4 + 3] === 255), `${f} trống`);
    sum[one ? 1 : 2] += buf.length;
  }
  assert.ok(sum[2] <= BUDGET && sum[1] <= BUDGET);
});

test("--check: ảnh và manifest trong repo khớp kết quả cắt", () => {
  execFileSync(process.execPath, [fileURLToPath(new URL("./menu-icon-import.mjs", import.meta.url)), "--check"], { stdio: "pipe" });
});
