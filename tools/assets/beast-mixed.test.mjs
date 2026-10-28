// Thử cấu hình TRỘN theo hướng (#861): hướng lấy từ tờ legacy (A gộp s / se / e, B gộp ne / n) hoặc tờ direction 3:2 mới (D = ne, E = n), tờ direction thắng.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT, Img, readPng, encodePng } from "./lib.mjs";
import { cutSpecies } from "./beast-sheet-cut.mjs";
import { parsePatch, warnSheetId } from "./beast-sheet-cut-lib.mjs";
import { mixedPlan, sheetPlan, sheetStem, sheetIdOf, speciesInfo } from "./beast-sheet-lib.mjs";
import { stageDocs } from "./beast-sheet-prompt.mjs";
import { recutOne } from "./beast-recut-all.mjs";
import { checkSpecies, liveIssues } from "./beast-sheet-check.mjs";
import { evaluate } from "./beast-sheet-ci.mjs";
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
    mkdirSync(root, { recursive: true });
    copyFileSync(path.join(ART, "phong_lang", "toA.png"), path.join(root, "toA.png"));
    writeFileSync(path.join(root, "toB.png"), encodePng(new Img(1024, 1024))); // B legacy hỏng (không có hình)
    for (const l of "DE") copyFileSync(path.join(ART, "thai_than_cu_vien", `to${l}.png`), path.join(root, `to${l}.png`));
    const r = checkSpecies("phong_lang", { dir: root });
    assert.notEqual(r.blockLevel.ne, "chặn");
    assert.notEqual(r.blockLevel.n, "chặn");
    assert.notEqual(r.level, "chặn", "mức chung (mã thoát beast:check) không tính lỗi hàng đã bị tờ direction thay");
    assert.deepEqual(liveIssues(r.sheets.find((s) => s.sheet === "toB"), r.dirOwned), []);
    assert.deepEqual(evaluate("phong_lang", root).blockers.filter((i) => i.sheet === "toB"), [], "CI không chặn lỗi tờ B legacy đã bị D / E thay");
    const st = speciesStatus("phong_lang", { root: dir });
    assert.equal(st.layout, "hon-hop");
    assert.deepEqual(st.missing, []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---- Tờ direction THEO TÊN HƯỚNG (to-s.png…): không đụng độ toA legacy (ca bich_lan_xa: s từ tờ direction, se / e vẫn từ toA legacy) ----
test("mixedPlan: tờ theo tên hướng thắng; toA legacy giữ se / e (skip s), không còn báo se / e vắng", () => {
  const d = (w, h) => ({ w, h }), L = { A: d(1024, 1536), B: d(1254, 1254) };
  const p = mixedPlan(96, { ...L, s: d(1536, 1024) });
  assert.deepEqual(p.map((x) => x.id), ["s", "A", "B"]);
  assert.deepEqual(p.find((x) => x.id === "s").dirs, ["s"]);
  assert.deepEqual(p.find((x) => x.id === "A").skip, ["s"]);
  assert.ok(!p.some((x) => x.absent));
  const noA = mixedPlan(96, { B: L.B, s: d(1536, 1024) });
  assert.deepEqual(noA.find((x) => x.absent), { ...sheetPlan(96, "auto")[0], dirs: ["se", "e"], absent: true }, "A vắng → báo thiếu se / e, không phải s");
  assert.deepEqual(mixedPlan(96, { A: L.A, B: L.B, s: d(1536, 1024), n: d(1536, 1024) }).map((x) => x.id), ["s", "n", "A", "B"]);
  assert.deepEqual(mixedPlan(96, { A: d(1536, 1024), s: d(1536, 1024) }).find((x) => x.dirs[0] === "s").id, "s", "tờ theo tên thắng tờ mã cùng hướng");
  const only = mixedPlan(96, { s: d(1536, 1024), n: d(1536, 1024) });
  assert.deepEqual(only.map((x) => x.id), ["s", "B", "C", "D", "n"].map((x, i) => (["s", "se", "e", "ne", "n"].includes(x) ? x : "ABCDE"[i])), "chỉ tờ direction: đủ 5 mục, hướng thiếu giữ mã A..E");
  assert.deepEqual(mixedPlan(256, { A: d(1536, 1024) }), sheetPlan(256, "auto"), "khung lớn không tờ theo tên: như cũ");
  assert.equal(sheetStem("A"), "toA"); assert.equal(sheetStem("se"), "to-se"); assert.equal(sheetIdOf("to-ne"), "ne"); assert.equal(sheetIdOf("toB"), "B");
});

test("cutter: toA / toB legacy + to-s direction → s từ tờ direction, se / e từ toA legacy, đủ 5 hướng", () => {
  const r = cutSpecies({ species: "phong_lang", sheets: { ...legacy, s: direction.D } });
  assert.equal(r.frames.size, 5 * 22);
  assert.equal(r.report.missing, 0);
  assert.deepEqual(r.report.sheets.A.dirsOverridden, ["s"]);
  assert.deepEqual(r.report.sheets.A.dirsUsed, ["se", "e"]);
  assert.ok(r.report.sheets.s, "báo cáo có tờ theo tên");
  assert.ok(!r.report.warnings.some((w) => /ô trống|THIẾU|thiếu tờ/.test(w)), r.report.warnings.join("\n"));
  const pure = cutSpecies({ species: "phong_lang", sheets: legacy });
  assert.notDeepEqual(Buffer.from(r.frames.get("s/idle/0").data), Buffer.from(pure.frames.get("s/idle/0").data), "s từ tờ direction");
  const noA = cutSpecies({ species: "phong_lang", sheets: { B: legacy.B, s: direction.D } });
  assert.ok(noA.report.warnings.includes("thiếu tờ A (se, e)"));
  assert.deepEqual(blockDirs(noA.report.issues.filter((i) => /^thiếu tờ/.test(i.msg))), ["se", "e"]);
});

test("check / status / recut: to-s.png + toA / toB legacy cùng thư mục, bố cục hon-hop, không thiếu", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "beast-named-")), root = path.join(dir, "phong_lang");
  try {
    mkdirSync(root, { recursive: true });
    for (const l of "AB") copyFileSync(path.join(ART, "phong_lang", `to${l}.png`), path.join(root, `to${l}.png`));
    copyFileSync(path.join(ART, "thai_than_cu_vien", "toD.png"), path.join(root, "to-s.png"));
    const r = checkSpecies("phong_lang", { dir: root });
    assert.deepEqual(r.sheets.map((s) => s.sheet), ["toA", "toB", "to-s"]);
    assert.deepEqual(r.sheets.find((s) => s.sheet === "to-s").dirs, ["s"]);
    assert.deepEqual(r.dirOwned, ["s"]);
    const st = speciesStatus("phong_lang", { root: dir });
    assert.equal(st.layout, "hon-hop");
    assert.deepEqual(st.missing, []);
    const rc = recutOne("phong_lang", {}, dir);
    assert.equal(rc.res.frames.size, 5 * 22);
    rmSync(path.join(root, "toA.png"));
    const st2 = speciesStatus("phong_lang", { root: dir });
    assert.deepEqual(st2.missing, ["toA"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("prompt: loài có toA legacy thì tờ direction phát ra tên theo hướng (to-s.md, hướng dẫn lưu to-s.png); mặc định giữ toA..toE", () => {
  const info = speciesInfo("phong_lang");
  const byDir = stageDocs(info, "direction", info.desc, ["s", "n"], { nameByDir: true, hasTurnaround: true });
  assert.deepEqual(byDir.map(([n]) => n), ["phong_lang-to-s.md", "phong_lang-to-n.md"]);
  assert.ok(byDir[0][1].includes("phong_lang/to-s.png"));
  const letters = stageDocs(info, "direction", info.desc, ["s"], { nameByDir: false, hasTurnaround: true });
  assert.deepEqual(letters.map(([n]) => n), ["phong_lang-toA.md"]);
});

test("tờ theo tên hướng: --patch nhận mã s / se…; cảnh báo hình vượt ô của tờ lưới khoảng trống không bị hạ xuống info", () => {
  assert.deepEqual(parsePatch("s:5,3=4,3"), { sheet: "s", from: "5,3", to: "4,3" });
  assert.deepEqual(parsePatch("se:1,2=-"), { sheet: "se", from: "1,2", to: null });
  assert.deepEqual(parsePatch("ne:0,0=1,1").sheet, "ne");
  assert.throws(() => parsePatch("x:1,1=2,2"));
  assert.equal(parsePatch("A:5,3=4,3").sheet, "A");
  const r = cutSpecies({ species: "phong_lang", sheets: { ...legacy, s: direction.D }, patches: [parsePatch("s:5,3=-")] });
  assert.ok(r.report.sheets.s.patches?.length, "patch áp lên tờ s");
  // mã tờ trong cảnh báo cutter (cutter tra gapGrid theo mã này): tờ theo tên hướng không bị hạ xuống info
  assert.equal(warnSheetId("khung s/die/0: hình vượt ô tờ s, kiểm tra lưới"), "s");
  assert.equal(warnSheetId("khung se/die/0: hình vượt ô tờ se, kiểm tra lưới"), "se");
  assert.equal(warnSheetId("tờ ne: lưới theo khoảng trống"), "ne");
  assert.equal(warnSheetId("tờ A ô 1,2: bỏ mảnh rời"), "A");
  assert.equal(warnSheetId("thiếu tờ B (ne, n)"), "B");
  assert.equal(warnSheetId("tờ này lạ"), undefined);
});
