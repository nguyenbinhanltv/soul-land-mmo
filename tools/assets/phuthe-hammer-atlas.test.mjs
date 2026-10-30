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
import { weaponPoseGripPolicy } from "./phuthe-sheet-check.mjs";

test("ngoại lệ cán dọc chỉ cho danh sách nhóm cứng đã duyệt, attack/cast và không bỏ kiểm A", () => {
  const base = { clip: "attack", axisDegrees: 90, primaryDistance: 2, secondaryDistance: 44 };
  for (const id of ["hao_thien_chuy", "ta_hoa_phuong_hoang", "cuu_tinh_that_sat_kiem", "nguyet_nhan", "pha_hon_thuong", "quy_mi"]) {
    for (const clip of ["attack", "cast"]) for (const axisDegrees of [-90, 75, 90, 105, 270]) {
      const result = weaponPoseGripPolicy({ ...base, id, clip, axisDegrees });
      assert.equal(result.primaryOnly, true, `${id}/${clip}/${axisDegrees}`);
      assert.equal(result.blocked, false);
    }
    for (const change of [{ primaryDistance: 2.01 }, { primaryDistance: NaN }, { primaryDistance: Infinity }, { axisDegrees: 74.9 }, { axisDegrees: 105.1 }, { axisDegrees: NaN }, { axisDegrees: Infinity }, { clip: "idle" }, { clip: "walk" }, { clip: "hurt" }]) {
      assert.equal(weaponPoseGripPolicy({ ...base, id, ...change }).blocked, true, `${id}: ${JSON.stringify(change)}`);
    }
    // Ngoài khung dọc, ngưỡng B vẫn đúng 20px và không nhận số đo không hữu hạn.
    for (const secondaryDistance of [20, 20.01, NaN, Infinity]) {
      const result = weaponPoseGripPolicy({ ...base, id, axisDegrees: 0, secondaryDistance });
      assert.equal(result.primaryOnly, false);
      assert.equal(result.blocked, secondaryDistance !== 20);
    }
  }
  for (const id of ["ky_nhung_thong_thien_cuc", "lam_ngan_thao", "", "khong_ton_tai"]) {
    assert.equal(weaponPoseGripPolicy({ ...base, id }).primaryOnly, false);
    assert.equal(weaponPoseGripPolicy({ ...base, id }).blocked, true);
    assert.equal(weaponPoseGripPolicy({ ...base, id, secondaryDistance: 20 }).blocked, false);
  }
});

test("bộ một tay dọc đã nhập: đúng nguồn, tỷ lệ cố định và A sau cắt đạt cả 130 khung", () => {
  const base = path.join(ROOT, "art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-a");
  const report = JSON.parse(fs.readFileSync(path.join(base, "import/_report.json"), "utf8"));
  const sources = JSON.parse(fs.readFileSync(path.join(base, "sources.json"), "utf8"));
  for (const { raw } of Object.values(sources)) { assert.ok(!raw.includes("\\"), "nguồn dùng dấu / để chạy trên mọi hệ điều hành"); assert.ok(fs.existsSync(path.join(ROOT, raw))); }
  assert.equal(report.frames, 130); assert.equal(report.failures.length, 0); assert.equal(report.edge, 0);
  assert.ok(report.maxA <= 2);
  for (const side of ["b", "f"]) {
    const imported = fs.readFileSync(path.join(base, `import/vkanim_hao_thien_chuy_${side}.png`));
    assert.deepEqual(imported, fs.readFileSync(path.join(ROOT, `shared/assets/sprites/vukhianim/hao_thien_chuy_${side}.png`)));
    assert.deepEqual(imported, fs.readFileSync(path.join(base, `../vkanim_hao_thien_chuy_${side}.png`)), "đường nhập mặc định không được giữ sheet cũ");
  }
  for (const dir of DIRS) {
    const plan = JSON.parse(fs.readFileSync(path.join(base, `final/${dir}/compose-plan.json`), "utf8"));
    assert.equal(new Set(plan.poses.filter(p => !p.unused).map(p => p.headScale)).size, 1, "không phóng riêng từng pose");
    assert.equal(plan.geometryFailures.length, 0);
    for (const f of plan.plan.filter(f => ["attack", "cast"].includes(f.anim))) {
      const d = plan.distances.find(d => d.name === `${f.sex}/${f.name}`);
      assert.ok(d.near[0] <= 2);
      const shaft = plan.poses[f.pose].shaftLength * plan.poses[f.pose].headScale * plan.scale;
      assert.ok(shaft <= 47 * 1.4, "cán không vượt1,4lần thân LPC thấp nhất");
      if (!d.primaryOnly) assert.ok(d.secondaryShaftDistance <= 20);
    }
  }
});

test("atlas chùy thật: từ chối thiếu marker; tám pose, 26 khung, grip nam/nữ không chạm mép", () => {
  const base = path.join(ROOT, "art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/s");
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "hao-atlas-test-"));
  const raw = path.join(base, "attempt3/poses.raw.png"), hash = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex"), before = hash(raw);
  const run = (file, dir = "s", extra = []) => spawnSync(process.execPath, [path.join(ROOT, "tools/assets/phuthe-hammer-atlas.mjs"), "--raw", file, "--dir", dir, "--out", folder, ...extra], { encoding: "utf8", cwd: ROOT, maxBuffer: 8 * 1024 * 1024 });
  try {
    const bad = run(path.join(base, "attempt1/poses.raw.png"));
    assert.equal(bad.status, 1); assert.match(bad.stderr, /marker/);
    const good = run(raw);
    assert.equal(good.status, 0, good.stderr + good.stdout);
    const report = JSON.parse(fs.readFileSync(path.join(folder, "compose-plan.json"), "utf8"));
    assert.equal(report.poses.length, 8); assert.equal(report.plan.length, 26); assert.equal(report.geometryFailures.length, 0);
    for (const pose of report.poses) assert.ok(Math.abs(pose.headSize * pose.headScale - 200) < 1e-8, "chuẩn hoá hai chiều đầu búa, không để impact phình riêng");
    for (const sex of ["m", "f"]) {
      assert.equal(report.checks[sex].level, "pass");
      const frames = report.plan.filter((f) => f.sex === sex);
      assert.equal(frames.length, 13);
      assert.equal(new Set(frames.filter((f) => f.anim === "attack").map((f) => f.pose)).size, 4);
      for (const frame of frames) assert.equal(frame.hands.length, ["attack", "cast"].includes(frame.anim) ? 2 : 1);
    }
    for (const d of report.distances) { assert.equal(d.edge, 0); assert.ok(d.near.every((v) => v <= 2)); assert.ok(d.pixels >= 15); assert.ok(d.gripSpan <= d.shaftLength + 2, "tay B phải trên cán, không chỉ chạm đầu búa"); }
    const offsets = new Map();
    for (const f of report.plan) { const key = `${f.anim}/${f.pose}`; assert.ok(f.gripOffset >= 0); if (offsets.has(key)) assert.equal(f.gripOffset, offsets.get(key)); offsets.set(key, f.gripOffset); }
    const invalidOmission = run(raw, "s", ["--omit-unused", "0"]);
    assert.equal(invalidOmission.status, 1); assert.match(invalidOmission.stderr, /pose đang dùng/);
    const north = path.join(base, "../n/attempt3/poses.raw.png");
    const missingUnused = run(north, "n");
    assert.equal(missingUnused.status, 1); assert.match(missingUnused.stderr, /marker/);
    const selectedNorth = run(north, "n", ["--omit-unused", "7"]);
    assert.equal(selectedNorth.status, 0, selectedNorth.stderr + selectedNorth.stdout);
    const northPlan = JSON.parse(fs.readFileSync(path.join(folder, "compose-plan.json"), "utf8"));
    assert.deepEqual(northPlan.omittedPoses, [7]); assert.ok(northPlan.poses[7].unused); assert.ok(northPlan.plan.every((f) => f.pose !== 7));
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

test("neo A theo pose: cán nện dọc chỉ kiểm A, không xoay theo hai tay", () => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "hao-pose-a-test-"));
  try {
    const result = spawnSync(process.execPath, [path.join(ROOT, "tools/assets/phuthe-hammer-atlas.mjs"), "--raw", path.join(ROOT, "art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-atlas/s/attempt3/poses.raw.png"), "--dir", "s", "--pose-a", "--out", folder], { encoding: "utf8", cwd: ROOT, maxBuffer: 8 * 1024 * 1024 });
    assert.equal(result.status, 0, result.stderr + result.stdout);
    const report = JSON.parse(fs.readFileSync(path.join(folder, "grip-check.json"), "utf8"));
    assert.equal(report.level, "ok"); assert.equal(report.secondaryTolerance, 20);
    assert.equal(report.issues.length, 0);
    assert.ok(report.distances.filter(d => d.secondaryShaftDistance > 20).every(d => d.primaryOnly));
    for (const d of report.distances) { assert.equal(d.primaryAnchorError, 0); assert.ok(d.near[0] <= 2); assert.equal(d.edge, 0); }
    const impact = report.distances.find((d) => d.name === "m/s/attack/3"), cast = report.distances.find((d) => d.name === "m/s/cast/1");
    assert.ok(Math.abs(impact.axisDegrees - 90) < 1, "góc nện theo pose atlas dọc");
    assert.ok(impact.secondaryShaftDistance > 35 && cast.secondaryShaftDistance > 43, "không lấy đầu búa thay cán hoặc nới dung sai để qua");
  } finally {
    assert.ok(path.resolve(folder).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(folder, { recursive: true, force: true });
  }
});

test("sheet chùy cuối: đủ hai nửa, đúng grip theo clip và hàng nữ đo trực tiếp", () => {
  const dir = path.join(ROOT, "art/src/phuthe-anim/hao_thien_chuy/vukhi/pose-a/import"), entries = JSON.parse(fs.readFileSync(path.join(dir, "manifest-entry.json"), "utf8"));
  assert.deepEqual(entries.map((e) => e.key).sort(), ["vkanim_hao_thien_chuy_b", "vkanim_hao_thien_chuy_f"]);
  const images = entries.map((e) => readPng(path.join(dir, `${e.key}.png`)));
  const colors = new Set();
  for (const im of images) for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3]) colors.add(`${im.data[i]},${im.data[i + 1]},${im.data[i + 2]}`);
  assert.ok(colors.size <= 32, "viền cutter nằm trong bảng 32 màu, không thêm màu thứ 33");
  for (const im of images) assert.deepEqual([im.w, im.h], [1664, 1280]);
  for (const entry of entries) {
    assert.equal(entry.anim.kind, "vukhi"); assert.equal(Object.keys(entry.anim.grip).length, 65);
    for (const [key, grip] of Object.entries(entry.anim.grip)) assert.equal(grip.length, ["attack", "cast"].includes(key.split("/")[1]) ? 4 : 2);
  }
  let frames = 0;
  for (const d of DIRS) {
    const plan = JSON.parse(fs.readFileSync(path.join(dir, "../final", d, "compose-plan.json"), "utf8"));
    for (const [index, pose] of plan.poses.entries()) {
      if (pose.unused) { assert.ok(plan.plan.every((f) => f.pose !== index)); continue; }
      assert.ok(pose.headSize >= pose.headWidth && pose.headSize >= pose.headLength, `${d}: xét cả hai chiều đầu búa`);
      assert.equal(pose.headScale, plan.poses[0].headScale, `${d}: một tỷ lệ cố định cho cả atlas`);
    }
    assert.equal(plan.geometryFailures.length, 0);
    for (const f of plan.plan) {
      const x0 = (gameAnims("A")[f.anim][0] + f.frame) * 128, y0 = gameRow(f.sex, d) * 128, near = f.hands.map(() => Infinity);
      let pixels = 0;
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) if (images.some((im) => im.alpha(x0 + x, y0 + y))) {
        pixels++; assert.ok(x >= 2 && x < 126 && y >= 2 && y < 126, `${f.sex}/${f.name}: chạm mép`);
        f.hands.forEach(([hx, hy], i) => { near[i] = Math.min(near[i], Math.hypot(x + .5 - hx, y + .5 - hy)); });
      }
      assert.ok(pixels >= 15); assert.ok(near[0] <= 2, `${f.sex}/${f.name}: lệch tay A ${near[0]}`);
      const measurement = plan.distances.find(d => d.name === `${f.sex}/${f.name}`);
      if (!measurement.primaryOnly) assert.ok(measurement.secondaryShaftDistance <= 20);
      frames++;
    }
  }
  assert.equal(frames, 130);
});
