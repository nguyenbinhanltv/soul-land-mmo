// Kiểm thử ngưỡng chỉ tiêu bố cục (L4 #1662): node --test tools/maps/lib/nguong.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { violations, CRITERIA, GROUP_OF_KIND } from "./nguong.mjs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const good = { kind: "hunt", chanCung: 20, chanTrong: 20, nhoPct: 5, hepPct: 10, thoangPct: 60, kepCheo: 2, ngoCut: 8, sauKhe: 0 };

test("đúng ngưỡng thì không vượt (biên inclusive)", () => assert.deepEqual(violations(good), []));

test("vượt từng chỉ tiêu: ≤ và ≥ đều bắt", () => {
  const v = violations({ ...good, chanCung: 27.5, thoangPct: 25.1, sauKhe: 2181 });
  assert.deepEqual(v.map((x) => [x.key, x.op, x.limit]), [["chanCung", "≤", 20], ["thoangPct", "≥", 60], ["sauKhe", "≤", 0]]);
});

test("ngưỡng đổi theo loại map; PvP / phụ bản dùng chặn trong sân (bỏ viền)", () => {
  const town = { ...good, kind: "town", chanCung: 35, nhoPct: 3, hepPct: 6, thoangPct: 70, kepCheo: 1, ngoCut: 2 };
  assert.deepEqual(violations(town), []);
  assert.equal(violations({ ...town, kind: "arena" }).length > 0, true);
  const pvp = { kind: "arena", chanCung: 40, chanTrong: 10, nhoPct: 0, hepPct: 3, thoangPct: 80, kepCheo: 0, ngoCut: 0, sauKhe: 0 };
  assert.deepEqual(violations(pvp), []); // chanCung 40% (viền) không tính, chanTrong 10% đạt
  assert.equal(violations({ ...pvp, chanTrong: 16 })[0].key, "chanCung");
});

test("loại map lạ hoặc thiếu số thì bỏ qua, mọi chỉ tiêu có đủ ba nhóm", () => {
  assert.deepEqual(violations({ ...good, kind: "khac", chanCung: 99 }), []);
  assert.deepEqual(violations({ kind: "hunt" }), []);
  for (const c of CRITERIA) for (const gr of new Set(Object.values(GROUP_OF_KIND))) assert.equal(typeof (c.max ?? c.min)[gr], "number", `${c.key}/${gr}`);
});

test("do-luong --canh-bao: cảnh báo vẫn thoát 0, --strict thoát 1", () => {
  const root = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
  const run = (...a) => spawnSync(process.execPath, [path.join(root, "tools/maps/do-luong.mjs"), "--canh-bao", ...a], { cwd: root, encoding: "utf8", env: { ...process.env, LUONG_STRICT: "" } });
  const a = run();
  assert.equal(a.status, 0, a.stderr);
  assert.match(a.stdout, /vượt chỉ tiêu bố cục/);
  assert.equal(run("--strict").status, 1);
});
