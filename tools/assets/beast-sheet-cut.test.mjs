// Thử cutter v2 (#864) trên TỜ THẬT trong art/src/beast-anim: lưới theo khoảng trống, neo cỡ khối hướng, phân mức, --patch, giữ byte #870.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { readPng, ROOT } from "./lib.mjs";
import { cutSpecies } from "./beast-sheet-cut.mjs";
import { fakeSheets } from "./beast-sheet-fake.mjs";
import { layoutFor, parsePatch, applyPatches, blockFactors, levelOf, summarize } from "./beast-sheet-cut-lib.mjs";
import { sheetPlan } from "./beast-sheet-lib.mjs";
import { Img } from "./lib.mjs";

const raw = (id) => Object.fromEntries("AB".split("").map((l) => [l, readPng(path.join(ROOT, "art", "src", "beast-anim", id, `to${l}.png`))]));

test("Thiết Giáp Tê Ngưu tờ A (lệch bước hàng 9–12): lưới đều mất 6 khung, dò khoảng trống cắt đủ 110", () => {
  const sheets = raw("thiet_giap_te_nguu");
  const old = cutSpecies({ species: "thiet_giap_te_nguu", sheets, grid: "uniform" });
  assert.equal(old.report.missing, 6);
  const res = cutSpecies({ species: "thiet_giap_te_nguu", sheets });
  assert.equal(res.report.frames, 110);
  assert.equal(res.report.missing, 0);
  assert.equal(res.report.sheets.A.grid, "gap");
  assert.equal(res.report.summary.block, 0);
});

test("giữ byte #870: Phong Lang / Kim Linh Ưng cắt với --scale cũ ra đúng sheet đang ở shared/assets", () => {
  for (const [id, scale] of [["phong_lang", 0.462], ["kim_linh_ung", 0.453]]) {
    const res = cutSpecies({ species: id, sheets: raw(id), scale });
    assert.equal(res.report.scaleInfo.source, "--scale");
    assert.equal(res.report.blocks, undefined, "đặt tay thì không hiệu chỉnh khối");
    const want = readPng(path.join(ROOT, "shared", "assets", "sprites", "beast", `${id}_anim.png`));
    assert.deepEqual(Buffer.from(res.sheet.data), Buffer.from(want.data), id);
  }
});

test("neo cỡ: Ám Kim tự động báo hệ số tự động vs dùng, đề xuất hệ số vừa khung, kéo ne / n về cỡ ảnh tĩnh", () => {
  const res = cutSpecies({ species: "am_kim_khung_trao_hung", sheets: raw("am_kim_khung_trao_hung") });
  const si = res.report.scaleInfo;
  assert.ok(si.auto > si.fit && si.suggested && si.suggested <= si.fit, JSON.stringify(si));
  assert.ok(res.report.issues.some((i) => i.level === "block" && /đề xuất --scale/.test(i.msg)));
  for (const d of ["ne", "n"]) {
    const b = res.report.blocks[d];
    assert.ok(b.ratioShared > 1.3 && Math.abs(b.ratioAfter - 1) < 0.1, `${d}: ${JSON.stringify(b)}`);
  }
  const hand = cutSpecies({ species: "am_kim_khung_trao_hung", sheets: raw("am_kim_khung_trao_hung"), scale: 0.55 });
  assert.equal(hand.report.summary.block, 0);
});

test("blockFactors: trong ngưỡng thì giữ 1, lệch thì kéo về neo (kẹp 0,6–1,6)", () => {
  const f = blockFactors({ s: [100], e: [100], n: [150], ne: [300] }, { s: 100, e: 100, n: 100, ne: 100 }, 1, 0.12);
  assert.equal(f.s.factor, 1);
  assert.ok(Math.abs(f.n.factor - 1 / 1.5) < 1e-9);
  assert.equal(f.ne.factor, 0.6);
});

test("cảnh báo phân mức: thiếu khung / vượt khung = block, vượt ô lưới đều = info, tóm tắt đếm đúng", () => {
  assert.equal(levelOf("THIẾU khung s/idle/3 (tờ A cột 3 hàng 0)"), "block");
  assert.equal(levelOf("một số khung vượt khung 96×96 ở hệ số 0.7 (nhỏ nhất vừa: 0.5), bị cắt mép"), "block");
  assert.equal(levelOf("khung s/die/0: hình vượt ô tờ A", { gapGrid: false }), "info");
  assert.equal(levelOf("khung s/die/0: hình vượt ô tờ A", { gapGrid: true }), "warn");
  assert.equal(levelOf("khung e/idle/1: chân lệch 20% chiều cao ô"), "info");
  assert.equal(levelOf("khung e/idle/1: chân lệch 35% chiều cao ô"), "warn");
  const s = summarize([{ level: "info", code: "a" }, { level: "warn", code: "a" }, { level: "block", code: "b" }]);
  assert.deepEqual([s.info, s.warn, s.block, s.total, s.byCode.a], [1, 1, 1, 3, 2]);
});

test("--patch: cú pháp, dời / bỏ hình theo ô, báo trong report", () => {
  assert.deepEqual(parsePatch("A:5,3=4,3"), { sheet: "A", from: "5,3", to: "4,3" });
  assert.deepEqual(parsePatch("B:0,1=-"), { sheet: "B", from: "0,1", to: null });
  assert.throws(() => parsePatch("A:5=4"));
  const pieces = new Map([["5,3", "x"], ["4,3", "y"], ["0,0", "z"]]);
  const done = applyPatches(pieces, [parsePatch("A:5,3=4,3"), parsePatch("A:0,0=-"), parsePatch("B:5,3=0,0")], "A");
  assert.deepEqual([...pieces], [["4,3", "x"]]);
  assert.ok(done.some((d) => /ô 4,3 đã có hình, hình cũ bị thay/.test(d)), "ghi đè ô đích phải có cảnh báo");
  assert.equal(levelOf("tờ A --patch: ô 4,3 đã có hình, hình cũ bị thay"), "warn");
  assert.ok(applyPatches(new Map([["0,0", 1]]), [parsePatch("A:0,0=9,9")], "A", new Set(["0,0"])).some((d) => /ngoài kế hoạch/.test(d)));
  const sheets = fakeSheets("phong_lang", { seed: 3 });
  const res = cutSpecies({ species: "phong_lang", sheets, patches: [parsePatch("A:0,0=-")] });
  assert.equal(res.report.missing, 1);
  assert.match(res.report.warnings.join("\n"), /--patch: bỏ hình ô 0,0/);
});

test("không dò được lưới theo khoảng trống thì dùng lưới đều (dự phòng) và ghi rõ", () => {
  const sh = sheetPlan(96)[0], blank = new Img(sh.w, sh.h);
  for (let i = 0; i < blank.data.length; i += 4) { blank.data[i] = 255; blank.data[i + 2] = 255; blank.data[i + 3] = 255; }
  const l = layoutFor(blank, sh);
  assert.match(l.mode, /^uniform/);
  assert.equal(l.cellOf(sh.w - 1, sh.h - 1).row, sh.rows - 1);
  assert.equal(layoutFor(blank, sh, "uniform").mode, "uniform");
});

test("--grid lạ bị từ chối; beast-recut-all từ chối --out trong repo", () => {
  const sh = sheetPlan(96)[0];
  assert.throws(() => layoutFor(new Img(sh.w, sh.h), sh, "foo"), /--grid chỉ nhận/);
  const run = spawnSync(process.execPath, ["tools/assets/beast-recut-all.mjs", "--out", path.join(ROOT, "shared", "x")], { encoding: "utf8", cwd: ROOT });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /thư mục repo/);
});
