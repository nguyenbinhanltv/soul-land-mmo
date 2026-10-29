// Hồi quy hợp đồng atlas thật: không đoán gốc thiếu, giữ RAW, bốn pose attack và đủ tay nam/nữ.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib.mjs";

test("atlas chùy thật: từ chối thiếu marker; tám pose, 26 khung, grip nam/nữ không chạm mép", () => {
  const base = path.join(ROOT, "art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/s");
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "hao-atlas-test-"));
  const raw = path.join(base, "attempt2/poses.raw.png"), hash = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex"), before = hash(raw);
  const run = (file) => spawnSync(process.execPath, [path.join(ROOT, "tools/assets/phuthe-hammer-atlas.mjs"), "--raw", file, "--dir", "s", "--out", folder], { encoding: "utf8", cwd: ROOT, maxBuffer: 8 * 1024 * 1024 });
  try {
    const bad = run(path.join(base, "attempt1/poses.raw.png"));
    assert.equal(bad.status, 1); assert.match(bad.stderr, /marker/);
    const good = run(raw);
    assert.equal(good.status, 0, good.stderr + good.stdout);
    const report = JSON.parse(fs.readFileSync(path.join(folder, "compose-plan.json"), "utf8"));
    assert.equal(report.poses.length, 8); assert.equal(report.plan.length, 26); assert.equal(report.geometryFailures.length, 0);
    for (const sex of ["m", "f"]) {
      assert.equal(report.checks[sex].level, "pass");
      const frames = report.plan.filter((f) => f.sex === sex);
      assert.equal(frames.length, 13);
      assert.equal(new Set(frames.filter((f) => f.anim === "attack").map((f) => f.pose)).size, 4);
      for (const frame of frames) assert.equal(frame.hands.length, ["attack", "cast"].includes(frame.anim) ? 2 : 1);
    }
    for (const d of report.distances) { assert.equal(d.edge, 0); assert.ok(d.near.every((v) => v <= 2)); assert.ok(d.pixels >= 15); }
    assert.equal(hash(raw), before, "không được sửa RAW model");
    const collision = path.join(folder, "vkanim_hao_thien_chuy_f.png");
    fs.copyFileSync(raw, collision);
    const refused = run(collision);
    assert.equal(refused.status, 1); assert.match(refused.stderr, /đầu ra không được chứa RAW/);
    assert.equal(hash(collision), before, "từ chối ghi đè RAW dù tên trùng sheet đầu ra");
  } finally {
    assert.ok(path.resolve(folder).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(folder, { recursive: true, force: true });
  }
});
