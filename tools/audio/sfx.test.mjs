import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { SFX_REQUIRED, renderSfxCredits, t3RequiredGroups, validateSfxCatalog, validateSfxCredits, validateSfxManifest } from "./sfx-lib.mjs";

const load = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const catalog = await load("./sfx-catalog.json");
const manifest = await load("../../shared/assets/audio/sfx/manifest.json");
const credits = await readFile(new URL("../../art/CREDITS.md", import.meta.url), "utf8");
const clone = (v) => JSON.parse(JSON.stringify(v));

test("catalog SFX G2 hợp lệ và chỉ dùng giấy phép CC0", () => {
  assert.equal(validateSfxCatalog(catalog), true);
  assert.deepEqual([...new Set(catalog.sources.map((s) => s.license))], ["CC0-1.0"]);
  assert.ok(catalog.clips.length >= 100);
  assert.ok(new Set(catalog.clips.map((c) => c.group)).size >= 50);
});

test("catalog C4 có đủ 25 tuyệt kỹ, 25 Chân Thân và 25 tiếng biến hình", () => {
  const t3 = catalog.clips.filter((clip) => clip.t3 === true);
  assert.equal(t3.length, 175);
  assert.equal(new Set(t3.map((clip) => clip.group)).size, 175);
  assert.deepEqual(new Set(t3.map((clip) => clip.group)), new Set(t3RequiredGroups));
  assert.ok(t3.every((clip) => clip.noVoice === true && clip.kind !== "voice"));
});

test("catalog từ chối giấy phép lạ, thiếu SHA, nhóm thiếu biến thể", () => {
  const bad = clone(catalog); bad.sources[0].license = "Proprietary";
  assert.throws(() => validateSfxCatalog(bad), /giấy phép/);
  const noSha = clone(catalog); delete noSha.clips[0].inputSha256;
  assert.throws(() => validateSfxCatalog(noSha), /SHA-256/);
  const few = clone(catalog); few.clips = few.clips.filter((c) => c.group !== "swing-kiem").concat(few.clips.filter((c) => c.group === "swing-kiem").slice(0, 1));
  assert.throws(() => validateSfxCatalog(few), /swing-kiem cần ít nhất/);
  const escape = clone(catalog); escape.clips[0].input = "../x.ogg";
  assert.throws(() => validateSfxCatalog(escape), /không an toàn/);
  const badGroup = clone(catalog); badGroup.clips[0].group = "hit/linh_the";
  assert.throws(() => validateSfxCatalog(badGroup), /nhóm không hợp lệ/);
});

test("manifest khớp catalog, tổng dưới 8 MB, ghi công khớp", () => {
  const { totalBytes } = validateSfxManifest(manifest, catalog);
  assert.ok(totalBytes < 8 * 1024 * 1024);
  assert.equal(validateSfxCredits(credits, manifest), true);
  assert.ok(Object.keys(SFX_REQUIRED).every((g) => manifest.clips.some((c) => c.group === g)));
});

test("manifest lệch catalog hoặc ghi công sai thì báo lỗi", () => {
  const extra = clone(manifest); extra.clips.push({ ...extra.clips[0], id: "thua-1" });
  assert.throws(() => validateSfxManifest(extra, catalog), /số clip|thừa/);
  const moved = clone(manifest); moved.clips[0].pack = "skill";
  assert.throws(() => validateSfxManifest(moved, catalog), /lệch catalog/);
  const overrun = clone(manifest); overrun.clips[0].start = 9999;
  assert.throws(() => validateSfxManifest(overrun, catalog), /vị trí/);
  assert.throws(() => validateSfxCredits(credits.replace(/Kenney/g, "Ai đó"), manifest), /lệch manifest/);
  assert.ok(renderSfxCredits(manifest).includes("kenney.nl"));
});
