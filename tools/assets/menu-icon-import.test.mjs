import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildIcons, spliceManifest, BUDGET, FRAMES } from "./menu-icon-import.mjs";
import { decodePng } from "./lib.mjs";

test("23 icon menu × 2 bản, đúng khung, trong ngân sách, khóa đúng danh sách client", () => {
  const { files, keys } = buildIcons();
  assert.equal(keys.length, 23);
  const ui = readFileSync(new URL("../../client/src/uiIcons.ts", import.meta.url), "utf8");
  for (const k of keys) assert.ok(ui.includes(`"${k.slice(8)}"`), k);
  assert.equal(files.size, 46);
  const sum = { 2: 0, 1: 0 };
  for (const [f, buf] of files) {
    const img = decodePng(buf), one = f.endsWith("_1x.png");
    assert.equal(img.w, one ? FRAMES._1x : FRAMES[""]); assert.equal(img.h, img.w);
    assert.ok([...Array(img.w * img.h).keys()].some((i) => img.data[i * 4 + 3] === 255), `${f} trống`);
    const alpha = [...Array(img.w * img.h).keys()].map((i) => img.data[i * 4 + 3]);
    assert.ok(alpha.includes(0), `${f} thiếu nền trong`);
    assert.ok(alpha.every((a) => a === 0 || a === 255), `${f} viền bán trong suốt`);
    sum[one ? 1 : 2] += buf.length;
  }
  assert.ok(sum[2] <= BUDGET && sum[1] <= BUDGET);
});

test("manifest: đăng ký đủ cặp menu mới, chạy lại không đổi và giữ entry khác", () => {
  const text = '{"sprites":[{"key": "gi_menu_forge_1x", "iso": true}, {"key":"khac"}]}';
  const keys = ["gi_menu_achv", "gi_menu_mail"];
  const next = spliceManifest(text, keys);
  assert.equal(spliceManifest(next, keys), next);
  assert.deepEqual(JSON.parse(next).sprites.map((s) => s.key).sort(), ["gi_menu_forge_1x", "gi_menu_achv", "gi_menu_achv_1x", "gi_menu_mail", "gi_menu_mail_1x", "khac"].sort());
});

test("--check: ảnh và manifest trong repo khớp kết quả cắt", () => {
  execFileSync(process.execPath, [fileURLToPath(new URL("./menu-icon-import.mjs", import.meta.url)), "--check"], { stdio: "pipe" });
});
