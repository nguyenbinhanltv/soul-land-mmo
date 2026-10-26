// Thử beast-sheet-check.mjs / beast-sheet-grid.mjs (#863) trên vài tờ thật đã merge ở art/src/beast-anim và tờ tổng hợp.
// Số đối chiếu: bao-cao-h4.md phần "Lưới / tràn ô" (dải hàng đúng mọi tờ; 4 dải sai số hình ở Lôi Văn Hầu A, Quỷ Ảnh Báo A, Thái Thản C và D).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Img, readPng, encodePng, ROOT } from "./lib.mjs";
import { detectGrid, splitStuckFigures } from "./beast-sheet-grid.mjs";
import { analyzeSheet, checkSpecies, classifyShape, draftErrorLine, bodyNotes, poseHints, writeReport, toJson, DIE_FLAT_H, HURT_TALL_H } from "./beast-sheet-check.mjs";

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

test("toA cỡ Codex thật (quyết định chủ repo 2026-10-26 mục 2): 948×1659, 948×1660, 941×1672 là tờ A; tỉ lệ lạ, tờ nhỏ thì loại", () => {
  for (const [w, h] of [[948, 1659], [948, 1660], [941, 1672]]) assert.equal(classifyShape(w, h).kind, "A", `${w}×${h}`);
  assert.equal(classifyShape(1024, 1024).kind, "B", "1:1 vẫn là B");
  assert.equal(classifyShape(1000, 2000), null, "1:2 không phải A");
  assert.equal(classifyShape(600, 1050), null, "tờ A quá nhỏ (cạnh ngắn < 800)");
});

/** Tờ tổng hợp w×h, lưới chuẩn của toA (12 dải × 6 cột; dải thứ 4 của mỗi hướng chỉ 4 hình); figs[dải] = số hình vẽ. */
function gridSheet(w, h, figs, cols = 6) {
  const im = new Img(w, h), MG = [255, 0, 255, 255], FG = [40, 40, 40, 255];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) im.set(x, y, MG);
  figs.forEach((n, r) => {
    for (let c = 0; c < n; c++) {
      const x0 = Math.round((c + 0.25) * w / cols), y0 = Math.round((r + 0.15) * h / 12);
      for (let y = y0; y < y0 + Math.round(h / 12 * 0.7); y++) for (let x = x0; x < x0 + Math.round(w / cols * 0.5); x++) im.set(x, y, FG);
    }
  });
  return im;
}

test("toA 948×1659 / 941×1672 đúng lưới → không chặn kích thước (chỉ ghi chú hệ số); lưới sai (thiếu / thừa hình, 9 hàng) vẫn chặn", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "beast-check-toa-"));
  try {
    const put = (im) => { writeFileSync(path.join(tmp, "toA.png"), encodePng(im)); return path.join(tmp, "toA.png"); };
    const good = [6, 6, 6, 4, 6, 6, 6, 4, 6, 6, 6, 4];
    for (const [w, h] of [[948, 1659], [941, 1672]]) {
      const r = analyzeSheet(put(gridSheet(w, h, good)));
      assert.equal(r.kind, "A");
      assert.deepEqual(codes(r, "block"), [], `${w}×${h}: ${JSON.stringify(r.issues)}`);
      assert.ok(r.issues.some((i) => i.sev === "note" && i.code === "kich-thuoc" && /2026-10-26/.test(i.msg)));
      assert.ok(Math.abs(r.canonFactor - 1) < 0.01, `hệ số theo diện tích ≈ 1, được ${r.canonFactor}`);
    }
    const missing = analyzeSheet(put(gridSheet(948, 1659, [6, 6, 5, 4, 6, 6, 5, 4, 6, 6, 5, 4]))); // kiểu #981: dải đánh thiếu hình
    assert.ok(codes(missing, "block").some((c) => c === "so-hinh" || c === "hinh-dinh"), JSON.stringify(missing.issues));
    const extra = analyzeSheet(put(gridSheet(948, 1659, [7, 7, 7, 4, 7, 7, 7, 4, 7, 7, 7, 4], 7))); // kiểu #980: thừa hình (7 cột)
    assert.ok(codes(extra, "block").length > 0);
    const nine = analyzeSheet(put(gridSheet(948, 1659, [6, 6, 6, 4, 6, 6, 6, 4, 6]))); // 9 hàng, cần 12
    assert.ok(codes(nine, "block").includes("luoi"));
  } finally { rmSync(tmp, { recursive: true, force: true }); }
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

test("cỡ thân lệch (kể cả > 25%) chỉ là nhẹ: không chặn, không có dòng LỖI, có ghi chú kỹ thuật in số % (quyết định chủ repo 2026-10-26 mục 4)", () => {
  const sheet = { sheet: "toX", issues: [{ sev: "light", code: "co-than", where: "H1–4 (n)", msg: "cỡ thân idle 132% so với ảnh tĩnh (lệch 32%, quá 25%); cutter neo lại, không chặn." }] };
  assert.equal(draftErrorLine(sheet), null, "cỡ thân không sinh dòng LỖI");
  assert.deepEqual(bodyNotes(sheet), ["H1–4 (n): " + sheet.issues[0].msg]);
  assert.match(bodyNotes(sheet)[0], /132%/);
  assert.match(draftErrorLine({ sheet: "toX", issues: [...sheet.issues, { sev: "block", code: "hinh-dinh", where: "H2", msg: "dính" }] }), /hình dính/);
  assert.doesNotMatch(draftErrorLine({ sheet: "toX", issues: [...sheet.issues, { sev: "block", code: "hinh-dinh", where: "H2", msg: "dính" }] }), /cỡ thân/);
});

test("tách hình dính (tay vươn chồng sang khung bên): dải 5 hình → 6, không còn chặn; ghi chú tach-hinh nêu dải", () => {
  for (const [id, l, band] of [["loi_van_hau", "A", 10], ["quy_anh_bao", "A", 10], ["thai_than_cu_vien", "C", 2], ["thai_than_cu_vien", "D", 2]]) {
    const g = detectGrid(readPng(sheet(id, l)));
    const done = splitStuckFigures(g, g.bands.map((b, i) => (i % 4 === 3 ? 4 : 6)));
    assert.deepEqual(done.map((d) => [d.band, d.from, d.to]), [[band, 5, 6]], `${id} to${l}`);
    const xs = g.bands[band].figures.map((f) => f.x0);
    assert.deepEqual([...xs].sort((p, q) => p - q), xs, "hình sau tách vẫn theo thứ tự trái → phải");
  }
  const r = checkSpecies("thai_than_cu_vien");
  for (const l of ["C", "D"]) {
    const sh = r.sheets.find((x) => x.sheet === `to${l}`);
    assert.notEqual(sh.level, "chặn", JSON.stringify(sh.issues));
    const note = sh.issues.find((i) => i.code === "tach-hinh");
    assert.ok(note && note.sev === "note" && note.where.startsWith("H3"), JSON.stringify(sh.issues));
    assert.equal(draftErrorLine(sh)?.includes("hình dính") ?? false, false);
  }
  assert.equal(r.blockLevel.s, "pass");
});

test("tách hình dính: dải thiếu khung thật không bị 'bịa' hình; hình nằm ngang đặc (die nằm dài, đuôi dài) không có cổ hẹp thì không cắt đôi, vẫn chặn", () => {
  const W = 200, H = 10, mk = (shape) => { // shape(x, y) → 1 nếu có vật; dải cao H, các hình đặt theo cột x
    const mask = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) mask[y * W + x] = shape(x, y) ? 1 : 0;
    return mask;
  };
  const fig = (x0, x1) => ({ x0, x1, y0: 0, y1: H - 1, w: x1 - x0 + 1, h: H, area: (x1 - x0 + 1) * H });
  const grid = (mask, figs) => ({ w: W, mask, bands: [{ y0: 0, y1: H - 1, figures: figs }] });
  // thiếu khung thật, không có hình rộng bất thường
  const g0 = grid(mk(() => 1), [0, 20, 40, 60, 80].map((x) => fig(x, x + 9)));
  assert.deepEqual(splitStuckFigures(g0, [6]), []);
  // dải die 4 khung chỉ còn 3 hình, một hình nằm ngang đặc rộng 1,6 lần trung vị: không cổ hẹp → không cắt
  const solid = mk((x) => (x < 20 || (x >= 40 && x < 60) || (x >= 80 && x < 112)));
  const g1 = grid(solid, [fig(0, 19), fig(40, 59), fig(80, 111)]);
  assert.deepEqual(splitStuckFigures(g1, [4]), []);
  assert.equal(g1.bands[0].figures.length, 3);
  // cùng hình rộng nhưng là hai khung dính nhau qua cổ hẹp (1 điểm / cột, trung vị 10) → cắt
  const neck = mk((x, y) => (x < 20 || (x >= 40 && x < 60)) || (x >= 80 && x < 112 && (x < 94 || x > 97 || y === 4)));
  const g2 = grid(neck, [fig(0, 19), fig(40, 59), fig(80, 111)]);
  assert.deepEqual(splitStuckFigures(g2, [4]).map((d) => [d.from, d.to]), [[3, 4]]);
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
    const small = analyzeSheet(put("toC.png", solid(800, 1200, [255, 0, 255, 255]))); // A đúng 2:3 nhưng diện tích lệch xa cỡ chuẩn
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
    assert.deepEqual(r.sheets, []);
    assert.equal(r.turnaround.sheet, "turnaround");
    assert.deepEqual(r.blockLevel, {}, "turnaround không góp mức khối hướng");
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

test("turnaround không làm hỏng blockLevel / layout của beast-status (#972)", async () => {
  const { speciesStatus } = await import("./beast-status.mjs");
  const dir = path.join(RAW, "phong_lang"), ta = path.join(dir, "turnaround.png");
  assert.ok(!existsSync(ta));
  const before = speciesStatus("phong_lang");
  try {
    writeFileSync(ta, readFileSync(path.join(RAW, "bang_vu_ung", "turnaround.png")));
    const after = speciesStatus("phong_lang");
    assert.deepEqual(after.blocks, before.blocks);
    assert.equal(after.state, before.state);
    assert.equal(after.layout, before.layout);
    assert.deepEqual(after.missing, before.missing);
  } finally { rmSync(ta, { force: true }); }
});

test("tư thế die / hurt (#1080): nghi nằm ngang / ngửa bụng ở mức nhẹ, ô vàng, gợi ý --eye, không thành dòng LỖI:, không chặn", () => {
  const r = checkSpecies("loi_van_hau"), toB = r.sheets.find((x) => x.sheet === "toB");
  const die = toB.issues.find((i) => i.code === "die-ngang");
  assert.ok(die && die.sev === "light" && die.dir === "n", JSON.stringify(toB.issues));
  assert.ok(toB.bands[7].figures[3].state === "warn", "khung die cuối của n phải vàng trên tờ liên hệ");
  assert.equal(poseHints(toB).length, 1);
  assert.match(poseHints(toB)[0], /^--eye "toB=pose — H8 \(n\) C4 — die nằm ngang, lệch trục hướng"$/);
  assert.ok(!/nghi/.test(poseHints(toB)[0]), "giá trị --eye không mang chữ nghi / chỉ dẫn");
  assert.ok(!/die-ngang|nằm ngang/.test(draftErrorLine(toB) ?? ""), "không tự ghi LỖI: từ nghi ngờ tư thế");
  assert.ok(!allBlock(r), "không bao giờ chặn");
  const ts = checkSpecies("that_tinh_doc_thiem").sheets.find((x) => x.sheet === "toA");
  assert.ok(ts.issues.some((i) => i.code === "hurt-lat" && i.dir === "s" && i.sev === "light"), JSON.stringify(ts.issues));
  assert.ok(!ts.issues.some((i) => i.code === "hurt-lat" && i.dir === "e"), "hướng e bị loại (cánh giương cũng cao lên)");
  assert.ok(DIE_FLAT_H < 1 && HURT_TALL_H > 1);
});

test("tư thế die / hurt (#1080): loài đạt (Hắc Bối Dã Trư, Huyền Băng Thiềm, Hàn Nguyệt Ưng) không bị đoán nhầm", () => {
  for (const id of ["hac_boi_da_tru", "huyen_bang_thiem", "han_nguyet_ung"]) {
    const r = checkSpecies(id);
    for (const s of r.sheets) assert.deepEqual(s.issues.filter((i) => i.code === "die-ngang" || i.code === "hurt-lat"), [], `${id} ${s.sheet}`);
  }
});

const allBlock = (r) => r.sheets.some((s) => s.issues.some((i) => (i.code === "die-ngang" || i.code === "hurt-lat") && i.sev === "block"));
