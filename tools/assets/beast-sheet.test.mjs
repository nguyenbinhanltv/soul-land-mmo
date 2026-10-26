import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { Img, hex, OUTLINE, ISO_BEAST_FOOT, encodePng, readPng } from "./lib.mjs";
import { ANIMS, COLS, DIRS, BAND_ROWS, animSlot, sheetPlan, sheetCells } from "./beast-sheet-lib.mjs";
import { fakeSheets } from "./beast-sheet-fake.mjs";
import { cutSpecies } from "./beast-sheet-cut.mjs";
import { buildPreview, encodeGif } from "./beast-sheet-preview.mjs";
import { buildPrompt, buildDoc } from "./beast-sheet-prompt.mjs";
import { speciesInfo } from "./beast-sheet-lib.mjs";

const opaque = (im) => { let n = 0; for (let i = 3; i < im.data.length; i += 4) if (im.data[i]) n++; return n; };
const frameAt = (res, F, dir, anim, n) => {
  const { band, col } = animSlot(anim), im = new Img(F, F);
  im.blit(res.sheet, (col + n) * F, (DIRS.indexOf(dir) * BAND_ROWS + band) * F, F, F, 0, 0);
  return im;
};

test("bố cục tờ: 3 + 2 hướng cho khung nhỏ, mỗi hướng một tờ cho khung lớn, ô không trùng", () => {
  for (const [F, n] of [[64, 2], [96, 2], [128, 5], [192, 5]]) {
    const plan = sheetPlan(F);
    assert.equal(plan.length, n);
    assert.deepEqual(plan.flatMap((s) => s.dirs), DIRS);
    for (const s of plan) {
      const keys = sheetCells(s).map((c) => `${c.col},${c.row}`);
      assert.equal(new Set(keys).size, keys.length);
      assert.equal(keys.length, s.dirs.length * ANIMS.reduce((a, [, k]) => a + k, 0));
      assert.ok(sheetCells(s).every((c) => c.col < COLS && c.row < s.rows));
    }
  }
});

test("cắt tờ giả lập: đủ 110 khung, chân về một điểm neo, bỏ vụn, viền tối, ít màu", () => {
  const F = speciesInfo("phong_lang").frame, res = cutSpecies({ species: "phong_lang", sheets: fakeSheets("phong_lang", { seed: 3 }) });
  assert.equal(res.report.frames, 110);
  assert.equal(res.report.missing, 0);
  assert.ok(res.report.dropped > 0, "phải bỏ đốm vụn");
  assert.equal(res.sheet.w, COLS * F);
  assert.equal(res.sheet.h, DIRS.length * BAND_ROWS * F);
  const outline = hex(OUTLINE), colors = new Set();
  for (const [name, im] of res.frames) {
    assert.equal(im.w, F);
    const [, anim] = name.split("/");
    let bottom = -1, edgeDark = 0;
    for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {
      const p = im.get(x, y);
      if (p[3]) { bottom = Math.max(bottom, y); colors.add(`${p[0]},${p[1]},${p[2]}`); if (p[0] === outline[0] && p[1] === outline[1] && p[2] === outline[2]) edgeDark++; }
    }
    assert.ok(edgeDark > 20, `${name}: thiếu viền`);
    // đáy hộp bao (gồm một vòng viền) nằm ở chân neo ± 1 với mọi khung; khung chết nằm sát đất cũng vậy
    assert.ok(Math.abs(bottom - (F - ISO_BEAST_FOOT - 1)) <= 2, `${name}: chân ở ${bottom}`);
    assert.ok(anim !== "idle" || opaque(im) > 200);
  }
  assert.ok(colors.size <= 24 + 1, `${colors.size} màu`);
  assert.deepEqual(res.entry.frame, [F, F]);
  assert.equal(res.entry.anim.anims.hurt.col, 4);
});

test("khung đứng cùng hướng đồng cỡ sau khi cắt dù tờ giả lệch ngẫu nhiên", () => {
  const F = speciesInfo("kim_linh_ung").frame, res = cutSpecies({ species: "kim_linh_ung", sheets: fakeSheets("kim_linh_ung", { seed: 7 }) });
  const areas = [0, 1, 2, 3].map((n) => opaque(frameAt(res, F, "e", "idle", n)));
  assert.ok(Math.max(...areas) / Math.min(...areas) < 1.15, areas.join(","));
});

test("tờ lỗi: báo thiếu khung, khung phóng quá, hình ở ô trống", () => {
  const res = cutSpecies({ species: "phong_lang", sheets: fakeSheets("phong_lang", { seed: 3, bad: true }) });
  assert.ok(res.report.missing >= 1);
  const w = res.report.warnings.join("\n");
  assert.match(w, /THIẾU khung s\/idle\/3/);
  assert.match(w, /lệch/);
  assert.match(w, /ô trống/);
});

test("boss khung 192 (5 tờ một hướng, nhiều điểm vật) cắt được với bảng màu tự động", () => {
  const res = cutSpecies({ species: "thai_than_cu_vien", sheets: fakeSheets("thai_than_cu_vien", { seed: 2 }) });
  assert.equal(res.report.frames, 110);
  assert.equal(res.report.missing, 0);
  assert.equal(res.sheet.w, COLS * 192);
  assert.ok(res.report.palette <= 24);
});

test("thiếu cả tờ B thì báo và vẫn cắt tờ A", () => {
  const sheets = fakeSheets("phong_lang", { seed: 3 });
  const res = cutSpecies({ species: "phong_lang", sheets: { A: sheets.A } });
  assert.match(res.report.warnings.join("\n"), /thiếu tờ B/);
  assert.equal(res.report.frames, 66);
});

test("ảnh nền trong suốt thật cũng cắt được, GIF xem trước ghi đủ file", () => {
  const sheets = fakeSheets("phong_lang", { seed: 5 });
  for (const im of Object.values(sheets)) for (let i = 0; i < im.data.length; i += 4) if (im.data[i] === 255 && im.data[i + 1] === 0 && im.data[i + 2] === 255) im.data[i + 3] = 0;
  const res = cutSpecies({ species: "phong_lang", sheets });
  assert.equal(res.report.missing, 0);
  const dir = mkdtempSync(path.join(os.tmpdir(), "beast-sheet-")), F = res.entry.frame[0];
  // dựng thư mục như beast-sheet-cut ghi để thử trang xem trước
  return import("node:fs").then(async (fs) => {
    const { encodePng } = await import("./lib.mjs");
    fs.writeFileSync(path.join(dir, "phong_lang_anim.png"), encodePng(res.sheet));
    fs.writeFileSync(path.join(dir, "manifest-entry.json"), JSON.stringify(res.entry));
    const html = buildPreview("phong_lang", dir, 2);
    assert.ok(existsSync(html));
    for (const [anim] of ANIMS) for (const d of DIRS) assert.ok(existsSync(path.join(dir, "preview", "gif", `${anim}_${d}.gif`)));
    assert.ok(existsSync(path.join(dir, "preview", "tinh", "e.png")));
    for (const [anim] of ANIMS) assert.ok(existsSync(path.join(dir, "preview", "gif", `xoay_${anim}.gif`)));
    const turn = readFileSync(path.join(dir, "preview", "xoay-vong.html"), "utf8");
    assert.ok(turn.includes("gif/xoay_idle.gif") && turn.includes("tinh/n.png") && turn.includes("gif/hurt_ne.gif"));
    assert.ok(readFileSync(html, "utf8").includes("xoay-vong.html"));
    const gif = readFileSync(path.join(dir, "preview", "gif", "walk_e.gif"));
    assert.equal(gif.subarray(0, 6).toString(), "GIF89a");
    assert.equal(gif[gif.length - 1], 0x3b);
    assert.equal(gif.readUInt16LE(6), F * 2);
  });
});

test("encodeGif: một khung nhỏ có đúng kích thước và đuôi", () => {
  const im = new Img(4, 4); im.set(1, 1, [200, 10, 10, 255]);
  const g = encodeGif([im, im], 100, 2);
  assert.equal(g.readUInt16LE(6), 8);
  assert.equal(g[g.length - 1], 0x3b);
});

test("mẫu prompt: có tên, họ, bậc, kích thước ảnh, hướng và không chứa số cân bằng", () => {
  for (const [id, family, tier] of [["phong_lang", "quad", "Tím / Đen"], ["kim_linh_ung", "bird", "Tím / Đen"], ["thai_than_cu_vien", "quad", "boss thế giới"]]) {
    const info = speciesInfo(id), plan = sheetPlan(info.frame);
    assert.equal(info.family, family);
    for (const sh of plan) {
      const p = buildPrompt(info, sh, info.desc), doc = buildDoc(info, sh, plan, info.desc);
      assert.match(p, new RegExp(`exactly ${sh.w}x${sh.h} pixels`));
      assert.match(p, /#FF00FF/);
      for (const d of sh.dirs) assert.match(p, new RegExp(`direction "${d}"`));
      assert.ok(doc.includes(info.name) && doc.includes(tier));
    }
  }
});

// Fixture hình học chỉ kiểm công cụ; không phải ảnh hồn thú dùng trong game.
function geometrySheets(frame = 96, bSize = 1024) {
  return Object.fromEntries(sheetPlan(frame).map((sh) => {
    const w = sh.id === 'B' && frame <= 96 ? bSize : sh.w;
    const h = sh.id === 'B' && frame <= 96 ? bSize : sh.h;
    const im = new Img(w, h), factor = w / sh.w;
    for (const c of sheetCells(sh)) {
      const left = Math.round((c.col * sh.w / sh.cols + 40) * factor);
      const top = Math.round((c.row * sh.h / sh.rows + 28) * factor);
      const right = Math.round((c.col * sh.w / sh.cols + 120) * factor);
      const bottom = Math.round((c.row * sh.h / sh.rows + 100) * factor);
      for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) im.set(x, y, [90, 110, 70, 255]);
    }
    return [sh.id, im];
  }));
}
function opaqueBox(im) {
  let x0 = im.w, y0 = im.h, x1 = -1, y1 = -1;
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y)) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { w: x1 - x0 + 1, h: y1 - y0 + 1, x0, y0, x1, y1 };
}

test('chuẩn hóa từng tờ: B1254 cùng đơn vị A, không phình thân vì canvas', () => {
  const sheets = geometrySheets(96, 1254), before = Buffer.from(sheets.B.data);
  const legacy = cutSpecies({ species: 'phong_lang', sheets, scale: 0.55 });
  assert.equal(opaqueBox(legacy.frames.get('e/idle/0')).w, 46);
  assert.equal(opaqueBox(legacy.frames.get('ne/idle/0')).w, 56);
  for (const options of [{ scale: 0.55 }, { fill: 0.6 }, {}]) {
    const res = cutSpecies({ species: 'phong_lang', sheets, ...options, normalizeSize: true });
    const a = opaqueBox(res.frames.get('e/idle/0')), b = opaqueBox(res.frames.get('ne/idle/0'));
    assert.ok(Math.abs(a.w - b.w) <= 1, `rộng A=${a.w}, B=${b.w}`);
    assert.ok(Math.abs(a.h - b.h) <= 1, `cao A=${a.h}, B=${b.h}`);
    assert.equal(a.y1, b.y1);
    assert.deepEqual(Buffer.from(sheets.B.data), before);
    assert.deepEqual(res.report.sheets.B.originalSize, [1254, 1254]);
    assert.deepEqual(res.report.sheets.B.expectedSize, [1024, 1024]);
    assert.equal(res.report.sheets.B.factor, 1024 / 1254);
    assert.equal(res.report.sheets.A.factor, 1);
    assert.equal(res.report.missing, 0);
  }
});

test('chuẩn hóa từ chối sai aspect thay vì kéo riêng hai trục', () => {
  assert.throws(() => cutSpecies({ species: 'phong_lang', sheets: { B: new Img(1254, 1200) }, normalizeSize: true }), /tỉ lệ.*B|B.*tỉ lệ/);
});


test('cỡ chuẩn: byte đầu ra legacy không đổi, normalize factor1 cũng không đổi (cả A–E)', () => {
  for (const [species, hash] of [
    ['phong_lang', 'f126872f4cd9e2b0cfc8357eb1145337121e1a67c1aafac8d1e236ebd051c0d4'],
    ['thai_than_cu_vien', '2bbc31c9166f69f1356b724be82ab9a84a6dd9495a7b6ec395c46d2e6e379af8'],
  ]) {
    const sheets = fakeSheets(species, { seed: 2 });
    const legacy = cutSpecies({ species, sheets });
    assert.equal(createHash('sha256').update(legacy.sheet.data).digest('hex'), hash);
    const normalized = cutSpecies({ species, sheets, normalizeSize: true });
    assert.deepEqual(normalized.sheet.data, legacy.sheet.data);
    assert.deepEqual(normalized.report.warnings.filter((w) => !w.includes("hình vượt ô") && !w.includes("mép ảnh nguồn")), legacy.report.warnings);
  }
});

test('normalization giữ alpha nhị phân, viền, palette, neo chân và không autofill từng khung', () => {
  const sheets = geometrySheets(96, 1254);
  for (let y = 28; y < 100; y++) for (let x = 80; x < 120; x++) sheets.A.set(x, y, [0, 0, 0, 0]);
  const res = cutSpecies({ species: 'phong_lang', sheets, scale: 0.55, normalizeSize: true });
  const colors = new Set();
  for (const im of res.frames.values()) {
    const b = opaqueBox(im);
    assert.ok(Math.abs(b.y1 - (96 - ISO_BEAST_FOOT)) <= 1);
    assert.ok(b.x0 > 0 && b.x1 < 95 && b.y0 > 0 && b.y1 < 95);
    let outline = 0;
    for (let i = 0; i < im.data.length; i += 4) {
      const p = im.data.subarray(i, i + 4);
      assert.ok(p[3] === 0 || p[3] === 255);
      if (!p[3]) continue;
      colors.add(p.slice(0, 3).join(','));
      if (p[0] === 26 && p[1] === 16 && p[2] === 32) outline++;
    }
    assert.ok(outline > 0);
  }
  assert.ok(colors.size <= 25);
  assert.ok(opaqueBox(res.frames.get('s/idle/0')).w < opaqueBox(res.frames.get('s/idle/1')).w * 0.7);
});

test('normalization không che thiếu khung, sai lưới, hình vượt ô hoặc ảnh nguồn cắt mép', () => {
  const sheets = geometrySheets(96, 1254);
  // Xóa một ô thật, vẽ vào ô vốn trống và nối qua ranh giới cột.
  for (let y = 28; y < 100; y++) for (let x = 40; x < 120; x++) sheets.A.set(x, y, [0, 0, 0, 0]);
  for (let y = 420; y < 450; y++) for (let x = 720; x < 750; x++) sheets.A.set(x, y, [90, 110, 70, 255]);
  for (let y = 28; y < 70; y++) for (let x = 0; x < 185; x++) sheets.A.set(x, y, [90, 110, 70, 255]);
  for (let y = 156; y < 228; y++) for (let x = 40; x < 120; x++) sheets.A.set(x, y, [0, 0, 0, 0]);
  const res = cutSpecies({ species: 'phong_lang', sheets, scale: 0.55, normalizeSize: true });
  const warnings = res.report.warnings.join('\n');
  assert.match(warnings, /THIẾU khung s\/walk\/0/);
  assert.match(warnings, /ô trống/);
  assert.match(warnings, /vượt ô/);
  assert.match(warnings, /mép ảnh nguồn/);
});

test('CLI normalization báo SHA256 byte RAW, kích thước thật và không ghi lại nguồn', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'beast-normalize-'));
  try {
    const sheets = geometrySheets(96, 1254), files = {};
    for (const [id, im] of Object.entries(sheets)) {
      files[id] = path.join(dir, id + '.png');
      writeFileSync(files[id], encodePng(im));
    }
    const before = readFileSync(files.B);
    const run = spawnSync(process.execPath, ['tools/assets/beast-sheet-cut.mjs', '--species', 'phong_lang', '--sheet', 'A=' + files.A, '--sheet', 'B=' + files.B, '--out', path.join(dir, 'out'), '--normalize-size', '--scale', '0.55'], { encoding: 'utf8' });
    assert.equal(run.status, 0, run.stderr);
    const report = JSON.parse(readFileSync(path.join(dir, 'out/_report.json')));
    assert.equal(report.sheets.B.sourceSha256, createHash('sha256').update(before).digest('hex'));
    assert.deepEqual(report.sheets.B.size, [1254, 1254]);
    assert.equal(report.sheets.B.normalizedMode, 'canonical-units');
    assert.deepEqual(readFileSync(files.B), before);
    const missing = spawnSync(process.execPath, ['tools/assets/beast-sheet-cut.mjs', '--species', 'phong_lang', '--sheet', 'B=' + files.B, '--out', path.join(dir, 'partial'), '--normalize-size'], { encoding: 'utf8' });
    assert.match(missing.stderr, /thiếu tờ A/);
    writeFileSync(files.B, encodePng(new Img(1254, 1200)));
    const invalid = spawnSync(process.execPath, ['tools/assets/beast-sheet-cut.mjs', '--species', 'phong_lang', '--sheet', 'B=' + files.B, '--out', path.join(dir, 'invalid'), '--normalize-size'], { encoding: 'utf8' });
    assert.equal(invalid.status, 2);
    assert.match(invalid.stderr, /sai tỉ lệ/);
    assert.equal(existsSync(path.join(dir, 'invalid')), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});


test('helper preview tạo bundle offline trước/sau và bằng chứng hash từ RAW, không đổi nguồn', async () => {
  const { buildComparison } = await import('./beast-sheet-normalization-preview.mjs');
  const dir = mkdtempSync(path.join(os.tmpdir(), 'beast-preview-bundle-'));
  try {
    const sources = {};
    for (const [id, im] of Object.entries(geometrySheets(96, 1254))) {
      const file = path.join(dir, id + '.png');
      writeFileSync(file, encodePng(im)); sources[id] = file;
    }
    const hash = createHash('sha256').update(readFileSync(sources.B)).digest('hex');
    const result = buildComparison('phong_lang', sources, path.join(dir, 'bundle'));
    assert.equal(result.sources.B.sha256, hash);
    assert.deepEqual(result.sources.B.size, [1254, 1254]);
    assert.equal(result.normalization.B.factor, 1024 / 1254);
    assert.equal(result.frames.before, 110);
    assert.equal(result.frames.after, 110);
    assert.equal(result.pixelBytesEqual, false);
    for (const mode of ['before', 'after']) {
      assert.ok(existsSync(path.join(dir, 'bundle', mode, 'preview/index.html')));
      for (const d of DIRS) for (const [a] of ANIMS) assert.ok(existsSync(path.join(dir, 'bundle', mode, 'preview/gif', a + '_' + d + '.gif')));
      const png = readPng(path.join(dir, 'bundle', mode, 'phong_lang_anim.png'));
      assert.equal(png.w, 576); assert.equal(png.h, 1920);
    }
    assert.equal(createHash('sha256').update(readFileSync(sources.B)).digest('hex'), hash);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
