import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Img, hex, OUTLINE, ISO_BEAST_FOOT } from "./lib.mjs";
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
