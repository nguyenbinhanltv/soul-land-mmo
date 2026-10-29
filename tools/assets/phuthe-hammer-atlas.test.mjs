// Hồi quy hợp đồng atlas thật: không đoán gốc thiếu, giữ RAW, bốn pose attack và đủ tay nam/nữ.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib.mjs";
import { readPng } from "./lib.mjs";
import { DIRS, gameAnims, gameRow } from "./phuthe-sheet-lib.mjs";

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
    for (const pose of report.poses) assert.ok(Math.abs(pose.headWidth * pose.headScale - 200) < 1e-8, "chuẩn hoá bề ngang đầu búa, không để impact phình riêng");
    assert.ok(report.plan.every((f) => f.pose !== 4), "s bỏ impact chính diện khỏi chuỗi đã chọn");
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

test("sheet chùy cuối: đủ hai nửa, đúng grip theo clip và hàng nữ đo trực tiếp", () => {
  const dir = path.join(ROOT, "art/src/phuthe-anim/hao_thien_chuy/vukhi"), entries = JSON.parse(fs.readFileSync(path.join(dir, "manifest-entry.json"), "utf8"));
  assert.deepEqual(entries.map((e) => e.key).sort(), ["vkanim_hao_thien_chuy_b", "vkanim_hao_thien_chuy_f"]);
  const images = entries.map((e) => readPng(path.join(dir, `${e.key}.png`)));
  for (const im of images) assert.deepEqual([im.w, im.h], [1664, 1280]);
  for (const entry of entries) {
    assert.equal(entry.anim.kind, "vukhi"); assert.equal(Object.keys(entry.anim.grip).length, 65);
    for (const [key, grip] of Object.entries(entry.anim.grip)) assert.equal(grip.length, ["attack", "cast"].includes(key.split("/")[1]) ? 4 : 2);
  }
  let frames = 0;
  for (const d of DIRS) {
    const plan = JSON.parse(fs.readFileSync(path.join(dir, "pose-atlas/result", d, "compose-plan.json"), "utf8"));
    for (const f of plan.plan) {
      const x0 = (gameAnims("A")[f.anim][0] + f.frame) * 128, y0 = gameRow(f.sex, d) * 128, near = f.hands.map(() => Infinity);
      let pixels = 0;
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (images.some((im) => im.alpha(x0 + x, y0 + y))) {
        pixels++; assert.ok(x >= 2 && x < 126 && y >= 2 && y < 126, `${f.sex}/${f.name}: chạm mép`);
        f.hands.forEach(([hx, hy], i) => { near[i] = Math.min(near[i], Math.hypot(x + .5 - hx, y + .5 - hy)); });
      }
      assert.ok(pixels >= 15); assert.ok(near.every((v) => v <= 2), `${f.sex}/${f.name}: lệch tay ${near}`); frames++;
    }
  }
  assert.equal(frames, 130);
});
