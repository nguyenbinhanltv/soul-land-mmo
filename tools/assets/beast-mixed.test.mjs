// Thử cấu hình TRỘN theo hướng (#861): hướng lấy từ tờ legacy (A gộp s / se / e, B gộp ne / n) hoặc tờ direction 3:2 mới (D = ne, E = n), tờ direction thắng.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT, Img, readPng, encodePng } from "./lib.mjs";
import { cutSpecies } from "./beast-sheet-cut.mjs";
import { mixedPlan, sheetPlan } from "./beast-sheet-lib.mjs";
import { checkSpecies } from "./beast-sheet-check.mjs";
import { speciesStatus } from "./beast-status.mjs";
import { blockDirs } from "./beast-import.mjs";

const ART = path.join(ROOT, "art", "src", "beast-anim");
const load = (id, l) => readPng(path.join(ART, id, `to${l}.png`));
const legacy = { A: load("phong_lang", "A"), B: load("phong_lang", "B") };
const direction = { D: load("thai_than_cu_vien", "D"), E: load("thai_than_cu_vien", "E") }; // 3:2, thay cho hình học của ne / n

test("mixedPlan: chỉ legacy / chỉ direction giữ nguyên sheetPlan; trộn thì tờ direction thắng hướng của tờ legacy", () => {
  const d = (w, h) => ({ w, h }), L = { A: d(1024, 1536), B: d(1254, 1254) }, D = { D: d(1536, 1024), E: d(1536, 1024) };
  assert.deepEqual(mixedPlan(96, L), sheetPlan(96, "auto"));
  assert.deepEqual(mixedPlan(96, { A: d(1536, 1024), B: d(1536, 1024), C: d(1536, 1024) }), sheetPlan(96, "direction"));
  const both = mixedPlan(96, { ...L, ...D });
  assert.deepEqual(both.map((p) => p.id), ["D", "E", "A"], "B bị bỏ hẳn: ne / n đã có tờ direction");
  assert.deepEqual(both.find((p) => p.id === "A").skip, []);
  const part = mixedPlan(96, { ...L, D: D.D });
  assert.deepEqual(part.find((p) => p.id === "B").skip, ["ne"]);
  const noB = mixedPlan(96, { A: L.A, D: D.D });
  assert.deepEqual(noB.find((p) => p.absent), { ...sheetPlan(96, "auto")[1], dirs: ["n"], absent: true });
});

test("cutter: A / B legacy + D / E direction mới → đủ 5 hướng × 22 khung, tờ B không còn đọc", () => {
  const r = cutSpecies({ species: "phong_lang", sheets: { ...legacy, ...direction } });
  assert.deepEqual(Object.keys(r.report.sheets).sort(), ["A", "D", "E"]);
  assert.equal(r.frames.size, 5 * 22);
  assert.equal(r.report.missing, 0);
  assert.ok(!r.report.warnings.some((w) => /ô trống|thiếu tờ/.test(w)), r.report.warnings.join("\n"));
  const only = cutSpecies({ species: "phong_lang", sheets: { A: legacy.A, ...direction } });
  assert.equal(only.frames.size, 5 * 22, "B không cần khi D / E đã phủ ne / n");
});

test("cutter: chỉ D mới (ne), n vẫn lấy từ tờ B legacy; hàng ne của B bị bỏ, không báo ô trống / thiếu", () => {
  const r = cutSpecies({ species: "phong_lang", sheets: { ...legacy, D: direction.D } });
  assert.equal(r.frames.size, 5 * 22);
  assert.deepEqual(r.report.sheets.B.dirsOverridden, ["ne"]);
  assert.deepEqual(r.report.sheets.B.dirsUsed, ["n"]);
  assert.ok(!r.report.warnings.some((w) => /ô trống|THIẾU|thiếu tờ/.test(w)), r.report.warnings.join("\n"));
  // hình ne / n khác nhau theo tờ nguồn: ne từ D (thai_than), n từ B (phong_lang)
  const pure = cutSpecies({ species: "phong_lang", sheets: legacy });
  assert.deepEqual(Buffer.from(r.frames.get("n/idle/0").data).length, Buffer.from(pure.frames.get("n/idle/0").data).length);
  assert.notDeepEqual(Buffer.from(r.frames.get("ne/idle/0").data), Buffer.from(pure.frames.get("ne/idle/0").data));
});

test("cutter: thiếu tờ legacy mà hướng chưa ai phủ thì báo thiếu đúng hướng (importer đọc được khối chặn)", () => {
  const r = cutSpecies({ species: "phong_lang", sheets: { A: legacy.A, D: direction.D } });
  assert.equal(r.frames.size, 4 * 22);
  assert.ok(r.report.warnings.includes("thiếu tờ B (n)"));
  const miss = r.report.issues.filter((i) => /^thiếu tờ/.test(i.msg));
  assert.deepEqual(miss.map((i) => i.level), ["block"]);
  assert.deepEqual(blockDirs(miss), ["n"]);
});

test("tương thích ngược: chỉ legacy cho đúng kết quả cũ (không có khóa mới trong report)", () => {
  const r = cutSpecies({ species: "phong_lang", sheets: legacy });
  assert.equal(r.frames.size, 5 * 22);
  assert.ok(Object.values(r.report.sheets).every((s) => !("dirsOverridden" in s)));
});

test("check / status: hướng có tờ direction không còn bị tờ legacy hỏng kéo xuống; bố cục báo hon-hop", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "beast-mixed-")), root = path.join(dir, "phong_lang");
  try {
    for (const [id, f] of [["phong_lang", "A"]]) { mkdirSyncSafe(root); copyFileSync(path.join(ART, id, `to${f}.png`), path.join(root, `to${f}.png`)); }
    writeFileSync(path.join(root, "toB.png"), encodePng(new Img(1024, 1024))); // B legacy hỏng (không có hình)
    for (const l of "DE") copyFileSync(path.join(ART, "thai_than_cu_vien", `to${l}.png`), path.join(root, `to${l}.png`));
    const r = checkSpecies("phong_lang", { dir: root });
    assert.notEqual(r.blockLevel.ne, "chặn");
    assert.notEqual(r.blockLevel.n, "chặn");
    const st = speciesStatus("phong_lang", { root: dir });
    assert.equal(st.layout, "hon-hop");
    assert.deepEqual(st.missing, []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
import { mkdirSync } from "node:fs";
function mkdirSyncSafe(d) { mkdirSync(d, { recursive: true }); }
