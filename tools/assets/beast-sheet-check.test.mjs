// Thử beast-sheet-check.mjs / beast-sheet-grid.mjs (#863) trên vài tờ thật đã merge ở art/src/beast-anim và tờ tổng hợp.
// Số đối chiếu: bao-cao-h4.md phần "Lưới / tràn ô" (dải hàng đúng mọi tờ; 4 dải sai số hình ở Lôi Văn Hầu A, Quỷ Ảnh Báo A, Thái Thản C và D).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Img, readPng, encodePng, ROOT } from "./lib.mjs";
import { detectGrid } from "./beast-sheet-grid.mjs";
import { analyzeSheet, checkSpecies, classifyShape, draftErrorLine, writeReport, toJson } from "./beast-sheet-check.mjs";

const RAW = path.join(ROOT, "art", "src", "beast-anim");
const sheet = (id, l) => path.join(RAW, id, `to${l}.png`);
const codes = (s, sev) => s.issues.filter((i) => i.sev === sev).map((i) => i.code);

test("cỡ hợp lệ theo tỉ lệ: A 1024×1536, B 1254² / 1024², một hướng 1536×1024; lệch tỉ lệ thì loại", () => {
  assert.equal(classifyShape(1024, 1536).kind, "A");
  assert.equal(classifyShape(1254, 1254).kind, "B");
  assert.equal(classifyShape(1024, 1024).kind, "B");
  assert.equal(classifyShape(1536, 1024).kind, "boss");
  assert.equal(classifyShape(1200, 1000), null);
});

test("dò lưới theo khoảng trống: đúng số dải hàng và số hình mỗi dải trên tờ thật (Quỷ Hổ A, B)", () => {
  for (const [l, rows] of [["A", 12], ["B", 8]]) {
    const g = detectGrid(readPng(sheet("quy_ho", l)));
    assert.equal(g.bands.length, rows, `quy_ho to${l}`);
    g.bands.forEach((b, i) => assert.equal(b.figures.length, i % 4 === 3 ? 4 : 6, `to${l} dải ${i + 1}`));
  }
});

test("dò lưới: ra đúng các dải lỗi đã đo trong báo cáo (hình dính → 5 thay vì 6)", () => {
  for (const [id, l, band] of [["loi_van_hau", "A", 10], ["quy_anh_bao", "A", 10], ["thai_than_cu_vien", "C", 2], ["thai_than_cu_vien", "D", 2]]) {
    const g = detectGrid(readPng(sheet(id, l)));
    assert.equal(g.bands[band].figures.length, 5, `${id} to${l} dải ${band + 1}`);
  }
});

test("Quỷ Hổ: B 1254² không bị coi là lỗi; không có mục chặn; có ảnh tĩnh để neo cỡ thân", () => {
  const r = checkSpecies("quy_ho");
  assert.equal(r.anchored, true);
  assert.notEqual(r.level, "chặn");
  const b = r.sheets.find((s) => s.sheet === "toB");
  assert.deepEqual(b.size, [1254, 1254]);
  assert.ok(!b.issues.some((i) => i.code === "kich-thuoc" && i.sev !== "note"));
  assert.ok(!codes(b, "block").length);
});

test("Thái Thản: tờ C và D bị chặn vì hình dính ở hàng 3 (hướng e / ne); dòng LỖI nháp nêu đúng hàng", () => {
  const r = checkSpecies("thai_than_cu_vien");
  assert.equal(r.level, "chặn");
  for (const l of ["C", "D"]) {
    const s = r.sheets.find((x) => x.sheet === `to${l}`);
    assert.equal(s.level, "chặn");
    const bad = s.issues.find((i) => i.code === "hinh-dinh");
    assert.ok(bad && bad.where.startsWith("H3"), `to${l}: ${JSON.stringify(s.issues)}`);
    const d = draftErrorLine(s); assert.match(d, /^LỖI: to[CD] — .*hình dính/); assert.match(d, /H3 \(/);
  }
  assert.equal(r.blockLevel.s, "pass");
});

test("tờ tổng hợp: tỉ lệ sai, nền lệch màu khoá, không dò được lưới → chặn; cỡ lạ đúng tỉ lệ → nhẹ", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "beast-check-test-"));
  try {
    const solid = (w, h, c) => { const im = new Img(w, h); for (let i = 0; i < w * h; i++) im.set(i % w, (i / w) | 0, c); return im; };
    const put = (name, im) => { writeFileSync(path.join(tmp, name), encodePng(im)); return path.join(tmp, name); };
    const odd = analyzeSheet(put("toA.png", solid(1200, 1000, [255, 0, 255, 255])));
    assert.deepEqual(codes(odd, "block"), ["kich-thuoc"]);
    const green = analyzeSheet(put("toB.png", solid(1024, 1024, [0, 200, 0, 255])));
    assert.ok(codes(green, "block").includes("nen") && codes(green, "block").includes("luoi"));
    const small = analyzeSheet(put("toC.png", solid(1000, 1500, [255, 0, 255, 255])));
    assert.ok(codes(small, "light").includes("kich-thuoc"));
    assert.equal(small.level, "chặn"); // nền trống: không dò được lưới
    assert.equal(draftErrorLine({ sheet: "toX", issues: [{ sev: "note", code: "nen", where: "", msg: "" }] }), null, "mục lưu ý không sinh dòng LỖI");
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test("ghi báo cáo: JSON + MD + tờ liên hệ có nhãn cho từng tờ", () => {
  const out = mkdtempSync(path.join(os.tmpdir(), "beast-check-out-"));
  try {
    const r = checkSpecies("quy_ho"), files = writeReport(r, out);
    assert.equal(files.length, 4);
    const json = JSON.parse(readFileSync(path.join(out, "quy_ho-check.json"), "utf8"));
    assert.equal(json.species, "quy_ho");
    assert.equal(json.sheets.length, 2);
    assert.deepEqual(json, JSON.parse(JSON.stringify(toJson(r))));
    assert.match(readFileSync(path.join(out, "quy_ho-check.md"), "utf8"), /# Kiểm tờ hoạt ảnh: quy_ho/);
    const png = readPng(path.join(out, "quy_ho-toA-lien-he.png"));
    assert.ok(png.w > 1000 && png.h > 1500, "ảnh liên hệ phải gồm tờ + lề nhãn");
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test("turnaround.png (#972): 1000×1000 → chặn kich-thuoc; 1536×1024 đủ lưới 5×3 → qua; thiếu hình → chặn", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "beast-ta-test-"));
  try {
    const MG = [255, 0, 255, 255], FG = [40, 40, 40, 255];
    const mk = (w, h, figs) => {
      const im = new Img(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) im.set(x, y, MG);
      for (let r = 0; r < 3; r++) for (let c = 0; c < figs[r]; c++) {
        const x0 = Math.round((c + 0.3) * w / 5), y0 = Math.round((r + 0.2) * h / 3);
        for (let y = y0; y < y0 + Math.round(h / 5); y++) for (let x = x0; x < x0 + Math.round(w / 12); x++) im.set(x, y, FG);
      }
      return im;
    };
    const put = (im) => { writeFileSync(path.join(tmp, "turnaround.png"), encodePng(im)); return path.join(tmp, "turnaround.png"); };
    assert.deepEqual(codes(analyzeSheet(put(mk(1000, 1000, [5, 5, 5]))), "block"), ["kich-thuoc"]);
    const ok = analyzeSheet(put(mk(1536, 1024, [5, 5, 5])));
    assert.equal(ok.level, "pass", JSON.stringify(ok.issues));
    const bad = analyzeSheet(put(mk(1536, 1024, [5, 4, 5])));
    assert.equal(bad.level, "chặn");
    assert.ok(codes(bad, "block").includes("so-hinh"));
    // thư mục chỉ có turnaround.png vẫn kiểm được (không ném 'không có tờ'), kèm ghi báo cáo + tờ liên hệ
    put(mk(1536, 1024, [5, 5, 5]));
    const r = checkSpecies("zz_khong_co", { dir: tmp });
    assert.deepEqual(r.sheets.map((s) => s.sheet), ["turnaround"]);
    const out = path.join(tmp, "out");
    assert.equal(writeReport(r, out).length, 3);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test("CLI --all (#972): loài chưa có tờ in 'bỏ qua', không thoát 2; in đủ mọi loài", async () => {
  const { spawnSync } = await import("node:child_process");
  const { readdirSync } = await import("node:fs");
  const empty = path.join(RAW, "zz_test_972");
  mkdirSync(empty, { recursive: true });
  try {
    const r = spawnSync(process.execPath, [path.join(ROOT, "tools/assets/beast-sheet-check.mjs"), "--all", "--no-image"], { cwd: ROOT, encoding: "utf8" });
    assert.notEqual(r.status, 2, r.stderr);
    assert.match(r.stdout, /bỏ qua zz_test_972 \(chưa có tờ\)/);
    const n = readdirSync(RAW, { withFileTypes: true }).filter((d) => d.isDirectory()).length;
    assert.equal(r.stdout.split("\n").filter((l) => /^(pass|nhẹ|chặn)\s|^bỏ qua /.test(l)).length, n);
  } finally { rmSync(empty, { recursive: true, force: true }); }
});
