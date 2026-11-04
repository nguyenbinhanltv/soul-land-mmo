import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { ROOT, readPng, sheetSpec, toHex, npcReplyPalette } from "./lib.mjs";
import path from "node:path";

for (const id of ["lao_kiet_khac", "lo_ren_thien_dau", "trieu_vo_cuc", "tho_may", "tho_may_thien_dau"]) test(`${id}: pose giữ chân, thân và hướng LPC`, () => {
  const record = JSON.parse(readFileSync(path.join(ROOT, "art/src/npc-reply", id, "nguon.json"), "utf8"));
  const sourceFile = path.join(ROOT, record.source), source = readPng(sourceFile), pose = readPng(path.join(ROOT, record.output));
  const mask = record.maskSource ? readPng(path.join(ROOT, record.maskSource)) : null, palette = npcReplyPalette(id);
  for (const layer of record.layers ?? []) assert.equal(createHash("sha256").update(readFileSync(path.join(ROOT, layer.file))).digest("hex"), layer.sha256, "lớp LPC nguồn không đổi");
  assert.equal(createHash("sha256").update(readFileSync(sourceFile)).digest("hex"), record.sourceSha256, "không thay sheet idle gốc");
  assert.equal(createHash("sha256").update(readFileSync(path.join(ROOT, record.output))).digest("hex"), record.outputSha256, "đầu ra khớp hồ sơ");
  assert.deepEqual([pose.w, pose.h], [320, 64]);
  assert.deepEqual(sheetSpec(`npc_reply_${id}`, [64, 64], true).size, [320, 64]);
  for (let row = 0; row < 5; row++) {
    let different = 0;
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
      const a = source.get(x, row * 64 + y), b = pose.get(row * 64 + x, y);
      assert.ok(b[3] === 0 || b[3] === 255, "alpha nhị phân");
      if (b[3]) assert.ok(palette.has(toHex(b)), "giữ đúng bảng màu LPC nguồn");
      if (mask && !mask.alpha(x, row * 64 + y) && !(y > 0 && mask.alpha(x, row * 64 + y - 1))) assert.deepEqual(b, a, "ngoài vùng đầu/tóc/khăn giữ nguyên pixel");
      // Bím tóc có thể xuống ngang eo; thân ngoài stencil đã kiểm ở trên, chân luôn đứng yên.
      if (y >= 54 || (y >= 48 && !mask)) assert.deepEqual(b, a, `chân và thân dưới đứng yên (${row}, ${x}, ${y})`);
      if (y >= 40 && y <= 45 && x >= 25 && x <= 28) assert.deepEqual(b, a, "cẳng tay / thân giữa không đổi");
      if (!a.every((v, i) => v === b[i])) different++;
    }
    assert.ok(different > 0, "pose khác idle");
  }
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    assert.deepEqual(pose.get(64 + x, y), pose.get(128 + x, y), "se/e chung pose ngang như LPC gốc");
    assert.deepEqual(pose.get(128 + x, y), pose.get(192 + x, y), "e/ne chung pose ngang như LPC gốc");
  }
});
