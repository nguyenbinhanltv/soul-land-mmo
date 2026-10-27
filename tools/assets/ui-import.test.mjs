// Thử ui:import (#885): nhập kit khớp RAW (cắt tất định), manifest chỉ đổi các mục ui2_*, không mảnh ngoài kế hoạch, ngân sách KB.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLAN, cutPlan, manifestEntry, spliceManifest } from "./ui-import.mjs";
import { budgetOf } from "./ui-sheet-cut.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

test("spliceManifest: bỏ ui2 cũ, nối ui2 mới, mục khác giữ từng byte, chịu CRLF", () => {
  const base = '{\n  "sprites": [\n    "a",\n    { "key": "ui2_cu", "iso": true },\n    {\n      "key": "b"\n    }\n  ]\n}\n';
  const out = spliceManifest(base, [{ key: "ui2_x", iso: true, nine: { x2: 8, x1: 4 } }, { key: "ui2_y", iso: true }]);
  assert.ok(!out.includes("ui2_cu"));
  assert.ok(out.includes('    "a",\n') && out.includes('    {\n      "key": "b"\n    },\n    { "key": "ui2_x"'));
  assert.deepEqual(JSON.parse(out).sprites.map((e) => (typeof e === "string" ? e : e.key)), ["a", "b", "ui2_x", "ui2_y"]);
  assert.equal(spliceManifest(out, [{ key: "ui2_x", iso: true, nine: { x2: 8, x1: 4 } }, { key: "ui2_y", iso: true }]), out, "chạy lại ra đúng byte");
  const crlf = spliceManifest(base.replaceAll("\n", "\r\n"), [{ key: "ui2_x", iso: true }]);
  assert.ok(crlf.includes("\r\n") && !/[^\r]\n/.test(crlf), "giữ CRLF");
  assert.deepEqual(JSON.parse(spliceManifest(base, [])).sprites.length, 2, "bỏ hết ui2: JSON vẫn hợp lệ");
});

test("kế hoạch nhập: đủ mảnh ui2.css cần, tất định, trong ngân sách, không trùng khoá", () => {
  const { kit, files } = cutPlan();
  const keys = kit.pieces.map((p) => p.key);
  assert.equal(new Set(keys).size, keys.length);
  const want = PLAN.flatMap((j) => j.keep).sort();
  assert.deepEqual(kit.pieces.map((p) => p.name).sort(), want);
  for (const n of ["khung_muc_lon", "khung_muc_nho", "khung_giay_lon", "khung_giay_nho", "khung_tooltip", "khung_toast", "o_trong", "tab_thuong", "nut_chinh_thuong", "nut_phu_thuong"]) assert.ok(want.includes(n), n);
  assert.equal(files.size, kit.pieces.length * 2, "mỗi mảnh có bản 2× và 1×");
  assert.deepEqual(budgetOf(kit).over, []);
  const again = cutPlan();
  for (const [f, buf] of files) assert.ok(again.files.get(f).equals(buf), `${f} đổi byte giữa hai lần cắt`);
  for (const p of kit.pieces.filter((x) => x.nine)) for (const s of ["x2", "x1"]) assert.ok(p.nine[s] * 2 < Math.min(...p.size[s]), `${p.key} ${s}: vạch chiếm hết cạnh`);
  assert.deepEqual(manifestEntry({ key: "ui2_a", nine: null }), { key: "ui2_a", iso: true });
});

test("--check: ảnh, manifest, ui-kit.json trong repo khớp kết quả cắt", () => {
  const out = execFileSync(process.execPath, [path.join(ROOT, "tools/assets/ui-import.mjs"), "--check"], { encoding: "utf8" });
  assert.match(out, /khớp/);
  const dir = path.join(ROOT, "shared/assets/sprites/iso/ui2");
  assert.equal(readdirSync(path.join(dir, "2x")).length, readdirSync(path.join(dir, "1x")).length);
  assert.ok(JSON.parse(readFileSync(path.join(ROOT, "shared/assets/sprites/manifest.json"), "utf8")).sprites.filter((e) => /^ui2_/.test(e.key ?? "")).length > 0);
});
