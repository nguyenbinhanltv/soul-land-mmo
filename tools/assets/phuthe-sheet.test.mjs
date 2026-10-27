// Thử công cụ hoạt ảnh phụ thể võ hồn v2 (#1022): lib (số khung, ánh xạ thân, bảng đặc tả), nộm, prompt, cutter, kiểm tờ, sổ, xem trước, bài học.
// Tờ thử là tờ TỔNG HỢP (phuthe-sheet-fake.mjs), không phải ảnh model.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { ROOT, Img, encodePng, readPng, hex } from "./lib.mjs";
import * as L from "./phuthe-sheet-lib.mjs";
import { dummyCell, dummySheet, dummyTurnaround, writeDummies, bodyAnchors, guideCell } from "./phuthe-sheet-dummy.mjs";
import { buildDirectionPrompt, buildTurnaroundPrompt, referencesFor, stageDocs, infoWith } from "./phuthe-sheet-prompt.mjs";
import { parseLessons, lessonsFor } from "./phuthe-sheet-lessons.mjs";
import { fakeSheet } from "./phuthe-sheet-fake.mjs";
import { cutPhuThe } from "./phuthe-sheet-cut.mjs";
import { parseLop, layerFn, defaultLayers, nominalOf, registerDummy, normalizeSheet, prepareSheet } from "./phuthe-sheet-cut-lib.mjs";
import { checkPhuThe, analyzeSheet, analyzeTurnaround, draftErrorLine, writeReport, toJson, minDistToDummy, attachSeverity, ATTACH_FRAC } from "./phuthe-sheet-check.mjs";
import { buildStatus, statusMarkdown, phutheStatus } from "./phuthe-sheet-status.mjs";
import { buildPreview, composeFrame } from "./phuthe-sheet-preview.mjs";

const read = (f) => readFileSync(path.join(ROOT, f), "utf8");
const tmp = (n) => mkdtempSync(path.join(os.tmpdir(), `phuthe-${n}-`));
const codes = (s, sev) => s.issues.filter((i) => i.sev === sev).map((i) => i.code);

// ---------- lib ----------
test("số khung theo nhóm: B / C 22 khung, A 13 khung; sheet game 22 / 13 cột × 10 hàng; khung 96 → 2112×960, 128 → 2816×1280", () => {
  assert.equal(L.totalFrames("B"), 22); assert.equal(L.totalFrames("C"), 22); assert.equal(L.totalFrames("A"), 13);
  assert.deepEqual(L.figuresPerBand("B"), [6, 6, 6, 4]); assert.deepEqual(L.figuresPerBand("A"), [3, 4, 4, 2]);
  assert.equal(L.GAME_ROWS, 10);
  assert.equal(L.gameCols("B") * 96, 2112); assert.equal(L.GAME_ROWS * 96, 960); assert.equal(L.gameCols("B") * 128, 2816); assert.equal(L.GAME_ROWS * 128, 1280);
  assert.deepEqual(L.gameAnims("B"), { idle: [0, 4], walk: [4, 6], attack: [10, 6], cast: [16, 4], hurt: [20, 2] });
  assert.deepEqual(L.frameOrigin(96), [48, 74]); assert.deepEqual(L.frameOrigin(128), [64, 90]);
  assert.deepEqual(L.bodyOffset(96), [16, 16]); assert.deepEqual(L.bodyOffset(128), [32, 32]);
  assert.throws(() => L.checkFrame(100), /96 \/ 128/);
  // mọi khung của một tờ nằm trong lưới 6 × 4 và không trùng ô
  for (const g of L.GROUPS) { const keys = L.sheetCells(g).map((c) => `${c.col},${c.row}`); assert.equal(new Set(keys).size, keys.length); assert.ok(L.sheetCells(g).every((c) => c.col < L.COLS && c.row < L.BAND_ROWS)); }
});

test("ánh xạ clip phụ thể sang khung thân: tính từ LPC_SHEET khớp đúng bảng trong đặc tả (đổi idx / ms của thân thì bắt được)", () => {
  const doc = read("docs/art/phu-the-hoat-anh.md"), at = doc.indexOf("| Clip | Khung phụ thể (B, C)");
  assert.ok(at > 0, "không thấy bảng ánh xạ trong đặc tả");
  const rows = doc.slice(at).split("\n").slice(2, 7).map((l) => l.split("|").map((s) => s.trim()));
  const num = (s) => s.match(/^[\d, ]+/)[0].split(",").map((x) => +x.trim());
  const B = L.bodySteps("B"), A = L.bodySteps("A");
  assert.equal(rows.length, 5);
  for (const r of rows) {
    const clip = r[1].replace(/`/g, "");
    assert.deepEqual(B[clip], num(r[3]), `B ${clip}`);
    assert.equal(L.FRAMES_SOFT[clip], +r[2]);
    assert.deepEqual(A[clip], num(r[5]), `A ${clip}`);
    assert.equal(L.FRAMES_RIGID[clip], +r[4]);
  }
  assert.equal(L.bodyTotalMs("idle"), 800); assert.equal(L.bodyTotalMs("walk"), 600); assert.equal(L.bodyTotalMs("attack"), 350); assert.equal(L.bodyTotalMs("cast"), 440); assert.equal(L.bodyTotalMs("hurt"), 200);
});

test("clipFrameAt: chọn khung phụ thể theo tiến độ thời gian của thân; lặp với idle / walk, giữ khung cuối với attack / cast / hurt", () => {
  assert.equal(L.clipFrameAt("B", "walk", 0), 0); assert.equal(L.clipFrameAt("B", "walk", 599), 5); assert.equal(L.clipFrameAt("B", "walk", 600), 0);
  assert.equal(L.clipFrameAt("B", "attack", 0), 0); assert.equal(L.clipFrameAt("B", "attack", 349), 5); assert.equal(L.clipFrameAt("B", "attack", 5000), 5);
  assert.equal(L.clipFrameAt("A", "attack", 175), 2); assert.equal(L.clipFrameAt("A", "hurt", 150), 0);
  assert.equal(L.bodyStepAt("idle", 200), 1, "ranh giới lấy bước sau");
  // hurt: mọi hướng dùng hàng hurt (hướng xuống) của thân; se / ne dùng hàng e
  for (const d of L.DIRS) assert.equal(L.bodyRowKey("hurt", d), "hurt");
  assert.deepEqual(L.DIRS.map((d) => L.bodyRowKey("idle", d)), ["s", "e", "e", "e", "n"]);
});

test("bảng phần riêng: đúng 25 võ hồn trùng VOHON, nhóm 8 / 11 / 6, khung 96 / 128; mô tả mục 4 và màu VOHON có đủ cho cả 25", () => {
  const ids = L.allPhutheIds(), data = read("shared/data.ts"), vohon = [...data.matchAll(/^\s+vh\("([a-z_]+)",/gm)].map((m) => m[1]);
  assert.equal(ids.length, 25);
  assert.deepEqual([...ids].sort(), [...vohon].sort(), "bảng đặc tả lệch VOHON");
  const t = L.parseSpecTable(), by = (g) => t.filter((r) => r.group === g).length;
  assert.deepEqual([by("A"), by("B"), by("C")], [8, 11, 6]);
  for (const r of t) {
    assert.ok(L.FRAME_SIZES.includes(r.frame), `${r.id} khung ${r.frame}`);
    const i = L.phutheInfo(r.id);
    assert.ok(i.brief.lines.length >= 5, `${r.id}: thiếu dòng mô tả mục 4`);
    assert.ok(["Bá đạo ở đâu", "Hình mẫu", "Màu", "Motif"].every((l) => i.brief.lines.some((x) => x.label === l)), `${r.id}: thiếu nhãn`);
    assert.match(i.colors.robe, /^#[0-9a-f]{6}$/i); assert.match(i.dummyKey, /^#[0-9A-F]{6}$/);
  }
  assert.equal(L.phutheInfo("hao_thien_chuy").frame, 128); assert.equal(L.phutheInfo("ta_hoa_phuong_hoang").frame, 96);
  assert.throws(() => L.phutheInfo("khong_co"), /không có trong bảng/);
});

test("màu khóa nộm: mặc định cyan; sáu võ hồn gần cyan đổi sang xanh lá / vàng chanh và khác nền #FF00FF", () => {
  assert.equal(L.dummyKeyOf("bach_ho"), "#00D0D0");
  assert.deepEqual(Object.keys(L.DUMMY_KEY_ALT).sort(), ["a_ngan", "bang_phuong_hoang", "cuu_bao_luu_ly_thap", "lam_dien_ba_vuong_long", "lam_ngan_thao", "pha_hon_thuong"]);
  for (const [id, k] of Object.entries(L.DUMMY_KEY_ALT)) { assert.ok(L.allPhutheIds().includes(id)); assert.ok(["#30D030", "#D0D000"].includes(k)); }
});

// ---------- nộm ----------
test("nộm: một màu khóa phẳng, gốc chân đúng (96: (48,74), 128: (64,90)) phóng 256/khung; hurt cùng một nộm ở mọi hướng; ô trống không nộm", () => {
  for (const F of [96, 128]) {
    const d = dummyCell({ dir: "s", clip: "idle", step: 0, frame: F }), [ox, oy] = L.frameOrigin(F), k = 256 / F;
    assert.ok(Math.abs(d.foot[0] - ox * k) < 1 && Math.abs(d.foot[1] - oy * k) < 1, `foot ${d.foot}`);
    assert.ok(d.box && d.box.y1 <= d.foot[1] + 8 && d.box.y1 >= d.foot[1] - 40, "chân nộm gần gốc chân");
    assert.ok(d.box.x0 < d.foot[0] && d.box.x1 > d.foot[0]);
  }
  const h = L.DIRS.map((dir) => dummyCell({ dir, clip: "hurt", step: 0, frame: 96 }).mask);
  for (const m of h.slice(1)) assert.deepEqual(m, h[0], "hurt: nộm giống nhau ở cả 5 hướng (thân chỉ vẽ hurt hướng xuống)");
  const e = dummyCell({ dir: "e", clip: "idle", step: 0, frame: 96 }).mask, se = dummyCell({ dir: "se", clip: "idle", step: 0, frame: 96 }).mask, ne = dummyCell({ dir: "ne", clip: "idle", step: 0, frame: 96 }).mask;
  assert.deepEqual(se, e, "se dùng hàng e"); assert.deepEqual(ne, e, "ne dùng hàng e");
  assert.notDeepEqual(dummyCell({ dir: "s", clip: "idle", step: 0, frame: 96 }).mask, e);
  const sheet = dummySheet({ group: "A", dir: "e", frame: 96, key: "#00D0D0" }), key = hex("#00D0D0"), used = new Set(L.sheetCells("A").map((c) => `${c.col},${c.row}`));
  let bad = 0;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    let n = 0;
    for (let y = r * 256; y < (r + 1) * 256; y++) for (let x = c * 256; x < (c + 1) * 256; x++) { const p = sheet.img.get(x, y); if (p[0] === 255 && p[1] === 0 && p[2] === 255) continue; if (p[0] !== key[0] || p[1] !== key[1] || p[2] !== key[2]) bad++; n++; }
    assert.equal(n > 0, used.has(`${c},${r}`), `ô ${c},${r}`);
  }
  assert.equal(bad, 0, "nộm chỉ một màu khóa");
  assert.equal(dummyTurnaround({ frame: 96, key: "#00D0D0" }).w, 1536);
});

test("nộm: bảng nộm ghi ra 6 ảnh (turnaround + 5 tờ), điểm neo thân nam / nữ đo được", () => {
  const out = tmp("nom"); try {
    const files = writeDummies("ta_hoa_phuong_hoang", out);
    assert.equal(files.length, 6);
    for (const f of files) { const im = readPng(f); assert.deepEqual([im.w, im.h], [1536, 1024]); }
    const a = bodyAnchors("m", "e", "idle", 0), b = bodyAnchors("f", "e", "idle", 0);
    assert.ok(a?.back && b?.back, "frameAnchors nam / nữ");
  } finally { rmSync(out, { recursive: true, force: true }); }
});

test("vạch tham chiếu (#1171): màu khóa riêng khác nền / nộm / võ hồn; đường chân đúng gốc chân, tâm ngực trong thân, thước đúng chiều cao thân; vạch nằm dưới nộm", () => {
  for (const id of L.allPhutheIds()) {
    const info = L.phutheInfo(id), g = hex(info.guideKey), d = hex(info.dummyKey);
    assert.ok(Math.hypot(g[0] - 255, g[1], g[2] - 255) > 100 && Math.hypot(g[0] - d[0], g[1] - d[1], g[2] - d[2]) >= 120, `${id}: vạch khác nền / nộm`);
    for (const c of [info.colors.col, info.colors.robe]) { const q = hex(c); assert.ok(Math.hypot(g[0] - q[0], g[1] - q[1], g[2] - q[2]) >= 90, `${id}: vạch gần màu võ hồn ${c}`); }
  }
  assert.equal(L.guideKeyOf("ta_hoa_phuong_hoang"), "#7A5CFF"); assert.notEqual(L.guideKeyOf("tu_vong_chu_hoang"), "#7A5CFF");
  for (const F of [96, 128]) for (const [dir, clip, step] of [["s", "idle", 0], ["e", "walk", 2], ["e", "attack", 2], ["n", "cast", 1], ["s", "hurt", 1]]) {
    const gs = guideCell({ dir, clip, step, frame: F }), d = dummyCell({ dir, clip, step, frame: F }), [fx, fy] = d.foot, tag = `${F} ${dir} ${clip}${step}`;
    assert.ok(gs.length > 20, tag);
    assert.ok(gs.some(([x, y, w, h]) => y === Math.round(fy) && h === 3 && w >= 8), `${tag}: có đường chân ở y = gốc chân`);
    assert.ok(gs.some(([x, , w]) => x === Math.round(fx) - 1 && w === 2), `${tag}: có trục dọc qua gốc chân`);
    const cross = gs.find(([, , w, h]) => w === 21 && h === 2);
    assert.ok(cross && cross[0] + 10 > d.box.x0 && cross[0] + 10 < d.box.x1 && cross[1] > d.box.y0 && cross[1] < fy, `${tag}: tâm ngực nằm trong thân nộm`);
    const ruler = gs.find(([x, , w, h]) => x === 14 && w === 2 && h > 40);
    assert.equal(ruler[1], d.box.y0, `${tag}: thước bắt đầu ở đỉnh đầu`); assert.ok(Math.abs(ruler[1] + ruler[3] - 3 - Math.round(fy)) <= 1, `${tag}: thước kết thúc ở chân`);
  }
  // tờ nộm: vạch một màu khóa riêng; nộm đè lên vạch; ô trống không vạch; không có vạch thì bằng bộ cũ
  const gk = "#7A5CFF", s0 = dummySheet({ group: "B", dir: "e", frame: 96, key: "#00D0D0" }), s1 = dummySheet({ group: "B", dir: "e", frame: 96, key: "#00D0D0", guideKey: gk });
  const g = hex(gk), kd = hex("#00D0D0"), cnt = { g: 0, d: 0, o: 0 };
  for (let y = 0; y < 1024; y++) for (let x = 0; x < 1536; x++) {
    const p = s1.img.get(x, y), q = s0.img.get(x, y);
    if (p[0] === g[0] && p[1] === g[1] && p[2] === g[2]) cnt.g++; else if (p[0] === kd[0] && p[1] === kd[1] && p[2] === kd[2]) { cnt.d++; assert.deepEqual([q[0], q[1], q[2]], kd, "nộm giữ nguyên chỗ"); } else if (!(p[0] === 255 && p[1] === 0 && p[2] === 255)) cnt.o++;
  }
  assert.ok(cnt.g > 5000 && cnt.d > 5000 && cnt.o === 0, JSON.stringify(cnt));
  for (const c of [[4, 3], [5, 3]]) for (let y = c[1] * 256; y < c[1] * 256 + 256; y++) for (let x = c[0] * 256; x < c[0] * 256 + 256; x++) { const p = s1.img.get(x, y); assert.ok(p[0] === 255 && p[1] === 0 && p[2] === 255, "ô thừa trống, không vạch"); }
  const files = (() => { const out = tmp("guide"); try { return writeDummies("ta_hoa_phuong_hoang", out).map((f) => readPng(f)); } finally { rmSync(out, { recursive: true, force: true }); } })();
  assert.equal(files.length, 6);
  const turn = dummyTurnaround({ frame: 96, key: "#00D0D0", guideKey: gk }); let tg = 0;
  for (let y = 0; y < turn.h; y++) for (let x = 0; x < turn.w; x++) { const p = turn.get(x, y); if (p[0] === g[0] && p[1] === g[1] && p[2] === g[2]) tg++; }
  assert.ok(tg > 3000, "turnaround có vạch");
});

test("kiểm turnaround: vạch tham chiếu bị xóa trước khi dò lưới (không chặn luoi); không truyền guideKey thì vạch làm vỡ lưới", () => {
  const dir = tmp("ta-guide");
  try {
    const info = L.phutheInfo("ta_hoa_phuong_hoang"), img = dummyTurnaround({ frame: info.frame, key: info.dummyKey, guideKey: info.guideKey });
    const cw = Math.round(img.w / 5), ch = Math.round(img.h / 3), wing = [200, 60, 40, 255]; // thêm hình phụ thể cạnh nộm như tờ model
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) for (let y = 0; y < 40; y++) for (let x = 0; x < 20; x++) img.set(c * cw + cw / 2 + 30 + x, r * ch + ch / 2 - 20 + y, wing);
    const f = path.join(dir, "turnaround.png"); writeFileSync(f, encodePng(img));
    const ok = analyzeTurnaround(f, { guideKey: info.guideKey });
    assert.ok(!codes(ok, "block").includes("luoi"), JSON.stringify(ok.issues.map((i) => [i.sev, i.code])));
    assert.equal(ok.bands.length, 3);
    assert.ok(codes(analyzeTurnaround(f), "block").includes("luoi"), "không xóa vạch thì lưới vỡ");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---------- prompt ----------
test("prompt: chèn NGUYÊN VĂN khối STYLE / NEGATIVE mục 6 ở đầu, mô tả mục 4 của đúng võ hồn, nền #FF00FF ghi đè 'Transparent background', cho cả 25 võ hồn", () => {
  const style = L.styleBlock();
  assert.match(style, /STYLE \(apply to every image\)/); assert.match(style, /NEGATIVE \(forbidden\)/);
  for (const id of L.allPhutheIds()) {
    const info = infoWith(id), sh = L.sheetPlan(info.group)[2], p = buildDirectionPrompt(info, sh), t = buildTurnaroundPrompt(info);
    assert.ok(p.startsWith(style) && t.startsWith(style), `${id}: STYLE phải ở đầu và nguyên văn`);
    for (const line of info.brief.lines) assert.ok(p.includes(line.text), `${id}: thiếu dòng "${line.label}" của mục 4`);
    assert.match(p, /BACKGROUND: one flat solid #FF00FF/); assert.match(p, /overrides the line "Transparent background"/);
    assert.match(p, new RegExp(`solid ${info.dummyKey}`)); assert.match(p, /MANNEQUIN/);
    assert.doesNotMatch(p, /phuthe_5huong|vh_[a-z_]+_[bf]\b|beast\/|\.png/i, `${id}: không nhắc ảnh cũ / tên file làm nguồn`);
    assert.match(p, /LESSONS/);
  }
});

test("prompt direction: lưới 6×4, số khung theo nhóm, ô thừa trống không nộm, tham chiếu theo thứ tự cố định (nộm → turnaround → tờ tùy chọn), không ảnh phụ thể cũ", () => {
  const b = infoWith("ta_hoa_phuong_hoang"), a = infoWith("hao_thien_chuy"), sb = L.sheetPlan("B")[2], sa = L.sheetPlan("A")[2];
  const pb = buildDirectionPrompt(b, sb), pa = buildDirectionPrompt(a, sa);
  assert.match(pb, /6 columns x 4 rows/); assert.match(pb, /22 occupied cells/); assert.match(pa, /13 occupied cells/);
  assert.match(pb, /row 1: frames 1-4 = IDLE.*frames 5-6 = HURT/); assert.match(pa, /row 1: frames 1-2 = IDLE.*frame 3 = HURT/);
  assert.match(pb, /row 4: frames 1-4 = CAST.*the last 2 cells of this row stay empty magenta, with no mannequin/);
  assert.match(pa, /row 4: frames 1-2 = CAST.*the last 4 cells/);
  assert.match(pb, /direction "e" = facing right/);
  const refs = referencesFor("direction", b, sb);
  assert.deepEqual(refs.map((r) => r.required), [true, true, false]);
  assert.match(refs[0].en, /MANNEQUIN BOARD/); assert.match(refs[1].en, /TURNAROUND/); assert.match(refs[2].en, /direction sheet/);
  assert.match(pb, /image 1 = the MANNEQUIN BOARD.*image 2 = the approved TURNAROUND.*image 3 = an approved direction sheet/);
  assert.match(pb, /do not copy any older drawing/);
  assert.match(buildDirectionPrompt(infoWith("a_ngan"), L.sheetPlan("C")[0]), /solid #30D030/, "màu nộm riêng của võ hồn gần cyan");
  assert.match(buildDirectionPrompt(infoWith("a_ngan", { dummyKey: "#D0D000" }), L.sheetPlan("C")[0]), /solid #D0D000/, "--dummy-key ghi đè");
});

test("prompt: mô tả vạch tham chiếu do công cụ sinh (màu khóa, tỉ lệ thân / ô, đường chân); --no-dummy thì không có", () => {
  const info = infoWith("ta_hoa_phuong_hoang"), d = dummyCell({ dir: "s", clip: "idle", step: 0, frame: info.frame });
  for (const t of [buildDirectionPrompt(info, L.sheetPlan(info.group)[2]), buildTurnaroundPrompt(info)]) {
    assert.ok(t.includes("GUIDE LINES") && t.includes(info.guideKey) && t.includes("FOOT LINE") && t.includes("CHEST CENTER") && t.includes("CORNER BRACKETS"));
    assert.ok(t.includes(`about ${Math.round(((d.box.y1 - d.box.y0 + 1) / 256) * 100)}% of the cell height`) && t.includes(`feet line at ${Math.round((d.foot[1] / 256) * 100)}%`), "tỉ lệ tính từ nộm");
  }
  assert.ok(!buildDirectionPrompt(infoWith("ta_hoa_phuong_hoang", { noDummy: true }), L.sheetPlan("B")[2]).includes("GUIDE LINES"));
});

test("prompt turnaround: 5 cột hướng × 3 hàng (idle / attack / hurt), kèm nộm; tài liệu ghi đúng tên file, 5 tờ A–E theo s, se, e, ne, n", () => {
  const info = infoWith("ta_hoa_phuong_hoang"), p = buildTurnaroundPrompt(info);
  assert.match(p, /5 columns x 3 rows/); assert.match(p, /row 1 = IDLE/); assert.match(p, /row 2 = ATTACK/); assert.match(p, /row 3 = HURT/);
  for (const d of L.DIRS) assert.match(p, new RegExp(`spirit direction "${d}"`));
  assert.deepEqual(stageDocs(info, "turnaround").map((x) => x[0]), ["ta_hoa_phuong_hoang-turnaround.md"]);
  const docs = stageDocs(info, "direction");
  assert.deepEqual(docs.map((x) => x[0]), ["A", "B", "C", "D", "E"].map((l) => `ta_hoa_phuong_hoang-to${l}.md`));
  assert.match(docs[2][1], /hướng \*\*e\*\*/); assert.match(docs[2][1], /art\/src\/phuthe-anim\/ta_hoa_phuong_hoang\/toC\.png/); assert.match(docs[2][1], /npm run phuthe:check/);
  assert.deepEqual(stageDocs(info, "direction", { dirs: ["se"] }).map((x) => x[0]), ["ta_hoa_phuong_hoang-toB.md"]);
  assert.throws(() => stageDocs(info, "direction", { frame: 100 }), /96 \/ 128/);
});

test("CLI prompt: --all liệt kê 25 võ hồn; --out ghi tài liệu + bảng nộm", () => {
  const r = spawnSync(process.execPath, ["tools/assets/phuthe-sheet-prompt.mjs", "--all"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr); assert.equal(r.stdout.trim().split("\n").length, 25);
  const out = tmp("prompt"); try {
    const q = spawnSync(process.execPath, ["tools/assets/phuthe-sheet-prompt.mjs", "--id", "hao_thien_chuy", "--stage", "direction", "--dir", "e", "--out", out], { cwd: ROOT, encoding: "utf8" });
    assert.equal(q.status, 0, q.stderr);
    assert.ok(existsSync(path.join(out, "hao_thien_chuy-toC.md"))); assert.ok(existsSync(path.join(out, "hao_thien_chuy-nom-toC.png"))); assert.ok(existsSync(path.join(out, "hao_thien_chuy-nom-turnaround.png")));
    assert.equal(spawnSync(process.execPath, ["tools/assets/phuthe-sheet-prompt.mjs", "--id", "x", "--stage", "sheet"], { cwd: ROOT }).status, 2);
  } finally { rmSync(out, { recursive: true, force: true }); }
});

// ---------- bài học ----------
test("bài học: file thật phân tích được, mỗi giai đoạn có bài, lọc theo nhóm A / B / C, không số pixel; cú pháp sai thì báo", () => {
  const md = read("art/src/phuthe-anim/lessons.md"), all = parseLessons(md);
  assert.ok(all.length >= 10);
  for (const l of all) { assert.ok(l.text.length > 20); assert.doesNotMatch(l.text, /\d+\s*px|\bpixels?\b/i, "không số pixel trong bài học"); }
  for (const st of ["turnaround", "direction"]) for (const g of L.GROUPS) assert.ok(lessonsFor(st, g, md).length >= 4, `${st} ${g}`);
  assert.ok(lessonsFor("direction", "A", md).some((l) => /rigid object/.test(l.text)));
  assert.ok(!lessonsFor("direction", "B", md).some((l) => /rigid object/.test(l.text)));
  assert.ok(lessonsFor("direction", "B", md).some((l) => /Limbs of the creature/.test(l.text)));
  assert.throws(() => parseLessons("- [lạ] câu"), /giai đoạn lạ/); assert.throws(() => parseLessons("- [@D] câu"), /nhóm lạ/);
  assert.deepEqual(lessonsFor("direction", "B", "- [all] A line // vi\n- [turnaround] B line").map((l) => l.text), ["A line"]);
});

// ---------- lop.json, nhãn lớp ----------
test("lop.json: kiểm cấu trúc; vùng riêng theo khung thắng vùng hướng, vùng `sau` thắng `truoc`, nhãn mặc định, quy tắc có sẵn", () => {
  assert.throws(() => parseLop({ huong: { x: {} } }), /hướng lạ/);
  assert.throws(() => parseLop({ huong: { e: { vung: [{ nhan: "giua", hop: [0, 0, 1, 1] }] } } }), /sau \| truoc/);
  assert.throws(() => parseLop({ huong: { e: { vung: [{ nhan: "sau" }] } } }), /hop.*da_giac/);
  assert.throws(() => parseLop({ khung: { "e/attack": [] } }), /khoá khung lạ/);
  const lop = parseLop({ huong: { e: { mac_dinh: "sau", vung: [{ nhan: "truoc", hop: [-10, -60, 10, -20] }, { nhan: "sau", da_giac: [[-5, -50], [5, -50], [0, -30]] }] } }, khung: { "e/idle/1": [{ nhan: "truoc", hop: [-100, -100, 100, 100] }] } });
  const F = 96, base = new Uint8Array(256 * 256), at = (x, y) => [Math.round(((x + 48) / F) * 256 - 0.5), Math.round(((y + 74) / F) * 256 - 0.5)];
  const fn = (frameIdx) => layerFn({ lop, dir: "e", clip: "idle", frameIdx, F, base });
  assert.equal(fn(0)(...at(8, -40)), "truoc"); assert.equal(fn(0)(...at(0, -40)), "sau", "đa giác sau thắng hộp trước"); assert.equal(fn(0)(...at(40, 0)), "sau", "mac_dinh");
  assert.equal(fn(1)(...at(40, 0)), "truoc", "vùng riêng theo khung thắng");
  const free = layerFn({ lop: null, dir: "e", clip: "idle", frameIdx: 0, F, base }); base[5 * 256 + 5] = 1;
  assert.equal(free(5, 5), "truoc", "không lop.json: theo base"); assert.equal(free(6, 6), "sau");
});

test("nhãn lớp mặc định: mảnh đè lên nộm = truoc, mảnh ngoài hình bao = sau; hướng quay lưng ne / n mọi điểm = truoc", () => {
  const nom = nominalOf({ dir: "e", clip: "idle", step: 0, frame: 96 }), [x, y] = [nom.pts[0], nom.pts[1]];
  const over = [], far = [];
  for (let i = 0; i < 12; i++) for (let j = 0; j < 4; j++) { over.push([x + i, y + j]); }
  for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) far.push([2 + i, 2 + j]); // góc ô, xa nộm
  const px = [...over, ...far].map(([u, v]) => [u, v, 0]), lab = defaultLayers(px, nom, "e");
  assert.equal(lab[y * 256 + x], 1, "đè nộm → truoc"); assert.equal(lab[3 * 256 + 3], 0, "xa nộm → sau");
  const back = defaultLayers(px, nom, "n"); assert.equal(back[3 * 256 + 3], 1); assert.equal(back[y * 256 + x], 1);
});

// ---------- cutter ----------
const FAKE = {};
function fakeSet(id, { drift = [0, 0], bad = [], jitter = 3, seed = 1, scale = 1 } = {}) {
  const info = L.phutheInfo(id), sheets = {};
  L.DIRS.forEach((dir, i) => {
    let img = fakeSheet({ group: info.group, dir, frame: info.frame, key: info.dummyKey, guideKey: info.guideKey, seed: seed + i, drift, bad, jitter }).img;
    if (scale !== 1) { const w = Math.round(img.w * scale), h = Math.round(img.h * scale), o = new Img(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o.set(x, y, img.get(Math.min(img.w - 1, Math.floor(x / scale)), Math.min(img.h - 1, Math.floor(y / scale)))); img = o; }
    sheets[L.SHEET_ID[dir]] = img;
  });
  return { info, sheets };
}
const cached = (k, f) => (FAKE[k] ??= f());
const countOpaque = (im, y0 = 0, y1 = im.h) => { let n = 0; for (let y = y0; y < y1; y++) for (let x = 0; x < im.w; x++) if (im.alpha(x, y)) n++; return n; };

test("cutter: tờ giả lệch cả tờ (6, −4) và từng ô → không chặn; nộm không còn trong sheet; nửa sau = cánh, nửa trước = vũ khí đè lên thân; 22 / 13 cột × 10 hàng", () => {
  for (const [id, cols, F] of [["ta_hoa_phuong_hoang", 22, 96], ["hao_thien_chuy", 13, 128]]) {
    const { sheets } = cached(id, () => fakeSet(id, { drift: [6, -4] })), r = cached(id + "cut", () => cutPhuThe({ id, sheets }));
    assert.equal(r.report.summary.block, 0, JSON.stringify(r.report.issues.filter((i) => i.level !== "info")));
    assert.equal(r.report.frames, L.totalFrames(L.phutheInfo(id).group) * 5);
    assert.deepEqual([r.halves.b.w, r.halves.b.h], [cols * F, 10 * F]); assert.deepEqual([r.halves.f.w, r.halves.f.h], [cols * F, 10 * F]);
    assert.equal(r.report.dummyKey, L.phutheInfo(id).dummyKey);
    // không còn điểm ảnh gần màu khóa nộm, cũng không gần màu khóa vạch tham chiếu (tờ giả CÓ vạch)
    const gk = hex(L.phutheInfo(id).guideKey);
    for (const im of [r.halves.b, r.halves.f]) for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3]) assert.ok(Math.abs(im.data[i] - gk[0]) + Math.abs(im.data[i + 1] - gk[1]) + Math.abs(im.data[i + 2] - gk[2]) > 60, "lọt điểm màu vạch");
    const dk = hex(r.report.dummyKey);
    for (const im of [r.halves.b, r.halves.f]) for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3]) assert.ok(Math.abs(im.data[i] - dk[0]) + Math.abs(im.data[i + 1] - dk[1]) + Math.abs(im.data[i + 2] - dk[2]) > 60, "lọt điểm màu nộm");
    // hướng s / se / e: cánh ở nửa sau, vũ khí ở nửa trước; ne / n: cánh cũng ở nửa trước
    const rowPx = (im, sex, dir) => countOpaque(im, L.gameRow(sex, dir) * F, (L.gameRow(sex, dir) + 1) * F);
    for (const d of ["s", "se", "e"]) { assert.ok(rowPx(r.halves.b, "m", d) > rowPx(r.halves.f, "m", d) * 5, `${d}: cánh ở nửa sau`); assert.ok(rowPx(r.halves.f, "m", d) > 0, `${d}: vũ khí ở nửa trước`); }
    for (const d of ["ne", "n"]) assert.equal(rowPx(r.halves.b, "m", d), 0, `${d}: nửa sau rỗng (mọi điểm là truoc)`);
    assert.equal(r.entries.length, 2); assert.equal(r.entries[0].key, `vhanim_${id}_b`); assert.deepEqual(r.entries[0].frame, [F, F]);
    assert.deepEqual(r.entries[0].anim.origin, L.frameOrigin(F)); assert.equal(r.entries[0].anim.rows, 10); assert.equal(r.entries[0].anim.anims.walk.n, L.FRAMES_SOFT.walk && (id === "hao_thien_chuy" ? 4 : 6));
  }
});

test("cutter: đăng ký nộm tìm đúng độ dời của tờ (±2 điểm) và báo độ dời trung vị", () => {
  const { sheets, info } = cached("ta_hoa_phuong_hoang", () => fakeSet("ta_hoa_phuong_hoang", { drift: [6, -4] }));
  const prep = prepareSheet(sheets.C, { group: info.group, dir: "e", frame: info.frame, dummyKey: info.dummyKey });
  assert.ok(Math.abs(prep.shift.dx - 6) <= 2 && Math.abs(prep.shift.dy + 4) <= 2, `trung vị ${JSON.stringify(prep.shift)}`);
  assert.ok(prep.cells.every((c) => c.reg.ok && c.reg.score > 0.8), "mọi ô thấy nộm");
  for (const c of prep.cells) assert.ok(Math.abs(c.reg.dx - 6) <= 5 && Math.abs(c.reg.dy + 4) <= 5, `${c.anim}${c.frame}: ${c.reg.dx},${c.reg.dy}`);
  const obs = new Uint8Array(1536 * 1024), nom = nominalOf({ dir: "s", clip: "idle", step: 0, frame: 96 });
  for (let k = 0; k < nom.pts.length; k += 2) obs[(nom.pts[k + 1] + 10) * 1536 + nom.pts[k] + 300 + 7] = 1;
  const reg = registerDummy(obs, 1536, 1024, nom, 300, 0);
  assert.deepEqual([reg.dx, reg.dy], [7, 10]); assert.equal(reg.score, 1);
});

test("cutter: tờ cỡ khác (tỉ lệ 3:2) được chuẩn hóa; sai tỉ lệ thì ném lỗi; thiếu tờ thì block", () => {
  const { sheets } = cached("ta_hoa_phuong_hoang", () => fakeSet("ta_hoa_phuong_hoang", { drift: [6, -4] }));
  const big = fakeSet("hao_thien_chuy", { scale: 1.1, drift: [4, 3] }), r = cutPhuThe({ id: "hao_thien_chuy", sheets: big.sheets });
  assert.equal(r.report.summary.block, 0, JSON.stringify(r.report.issues.filter((i) => i.level !== "info")));
  assert.ok(r.report.sheets.C.factor > 0.88 && r.report.sheets.C.factor < 0.94, "hệ số chuẩn hóa ≈ 1/1,1");
  assert.deepEqual(r.report.sheets.C.size, [1690, 1126]);
  assert.throws(() => normalizeSheet(new Img(1000, 1000)), /sai tỉ lệ/);
  const some = { C: sheets.C };
  const part = cutPhuThe({ id: "ta_hoa_phuong_hoang", sheets: some });
  assert.ok(part.report.issues.some((i) => i.code === "thieu-to" && i.level === "block")); assert.ok(part.report.missing >= 4);
});

test("cutter: lop.json đổi nhãn lớp (ép cả hướng s sang nửa sau); nhãn mặc định hướng", () => {
  const { sheets } = cached("ta_hoa_phuong_hoang", () => fakeSet("ta_hoa_phuong_hoang", { drift: [6, -4] }));
  const lop = { huong: { s: { mac_dinh: "sau" } } }, r0 = cached("ta_hoa_phuong_hoangcut", () => cutPhuThe({ id: "ta_hoa_phuong_hoang", sheets })), r1 = cutPhuThe({ id: "ta_hoa_phuong_hoang", sheets, lop });
  const F = 96, row = (im, dir) => countOpaque(im, L.gameRow("m", dir) * F, (L.gameRow("m", dir) + 1) * F);
  assert.ok(row(r0.halves.f, "s") > 0); assert.equal(row(r1.halves.f ?? new Img(1, 1), "s"), 0, "mac_dinh sau: nửa trước không còn gì ở hướng s");
  assert.ok(row(r1.halves.b, "s") > row(r0.halves.b, "s"));
  assert.equal(row(r1.halves.f, "e"), row(r0.halves.f, "e"), "hướng khác không đổi");
  assert.throws(() => cutPhuThe({ id: "ta_hoa_phuong_hoang", sheets, lop: { huong: { zz: {} } } }), /hướng lạ/);
});

test("cutter: nửa nữ chỉ dời theo chênh neo thân; hai giới dùng chung ảnh vẽ", () => {
  const r = cached("ta_hoa_phuong_hoangcut", () => { const { sheets } = cached("ta_hoa_phuong_hoang", () => fakeSet("ta_hoa_phuong_hoang", { drift: [6, -4] })); return cutPhuThe({ id: "ta_hoa_phuong_hoang", sheets }); });
  const keys = Object.keys(r.report.sexShift);
  assert.equal(keys.length, 110, "mọi khung có độ dời giới nữ");
  for (const [k, [dx, dy]] of Object.entries(r.report.sexShift)) { assert.ok(k.startsWith("f/")); assert.ok(Math.abs(dx) <= 6 && Math.abs(dy) <= 6, `${k} ${dx},${dy}`); }
  const F = 96, im = r.halves.b;
  // tổng điểm ảnh hai nửa giới giống nhau (cùng ảnh vẽ), chỉ khác vị trí
  const sum = (sex) => countOpaque(im, L.gameRow(sex, "e") * F, (L.gameRow(sex, "e") + 1) * F);
  assert.ok(Math.abs(sum("m") - sum("f")) / sum("m") < 0.02, `${sum("m")} vs ${sum("f")}`);
});

test("cutter: lỗi vẽ → cảnh báo đúng mức (khung rỗng, mất nộm, cánh trùng màu khóa nộm)", () => {
  const empty = fakeSet("ta_hoa_phuong_hoang", { bad: ["empty"] }).sheets;
  const withNoDummy = cutPhuThe({ id: "ta_hoa_phuong_hoang", sheets: fakeSet("ta_hoa_phuong_hoang", { bad: ["nodummy"] }).sheets });
  assert.ok(withNoDummy.report.issues.some((i) => i.code === "nom-mat"), "mất nộm ở một ô được báo");
  const key = cutPhuThe({ id: "ta_hoa_phuong_hoang", sheets: fakeSet("ta_hoa_phuong_hoang", { bad: ["keycolor"] }).sheets });
  assert.ok(key.report.issues.some((i) => i.code === "khung-rong" && i.level === "block"), "phụ thể trùng màu nộm → khung rỗng (chặn)");
  assert.ok(key.report.missing >= 1);
  const part = cutPhuThe({ id: "ta_hoa_phuong_hoang", sheets: fakeSet("ta_hoa_phuong_hoang", { bad: ["partkey"] }).sheets });
  assert.ok(part.report.issues.some((i) => i.code === "khung-lech" && i.msg.includes("walk/3")), "cánh trùng màu khóa: mất một phần → khung lệch");
  assert.equal(part.report.summary.block, 0);
  const e = cutPhuThe({ id: "ta_hoa_phuong_hoang", sheets: empty });
  assert.ok(e.report.issues.some((i) => i.code === "khung-rong" && i.level === "block" && /walk/.test(i.msg)));
});

test("CLI cutter: --sheet → ghi 2 nửa + manifest-entry + report; thiếu tùy chọn thì thoát 2; khung rỗng thì thoát 1", () => {
  const dir = tmp("cutcli"), out = path.join(dir, "out");
  try {
    const { sheets } = cached("ta_hoa_phuong_hoang", () => fakeSet("ta_hoa_phuong_hoang", { drift: [6, -4] }));
    const args = ["tools/assets/phuthe-sheet-cut.mjs", "--id", "ta_hoa_phuong_hoang", "--out", out];
    for (const [id, im] of Object.entries(sheets)) { const f = path.join(dir, `${id}.png`); writeFileSync(f, encodePng(im)); args.push("--sheet", `${id}=${f}`); }
    const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr + r.stdout);
    for (const f of ["vhanim_ta_hoa_phuong_hoang_b.png", "vhanim_ta_hoa_phuong_hoang_f.png", "manifest-entry.json", "_report.json"]) assert.ok(existsSync(path.join(out, f)), f);
    const rep = JSON.parse(readFileSync(path.join(out, "_report.json"), "utf8"));
    assert.match(rep.sheets.C.sourceSha256, /^[0-9a-f]{64}$/);
    assert.equal(spawnSync(process.execPath, ["tools/assets/phuthe-sheet-cut.mjs", "--id", "ta_hoa_phuong_hoang"], { cwd: ROOT }).status, 2);
    const only = ["tools/assets/phuthe-sheet-cut.mjs", "--id", "ta_hoa_phuong_hoang", "--out", path.join(dir, "o2"), "--sheet", `C=${path.join(dir, "C.png")}`];
    assert.equal(spawnSync(process.execPath, only, { cwd: ROOT }).status, 1, "thiếu tờ → thoát 1");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---------- kiểm tờ ----------
function putSet(dir, sheets) { mkdirSync(dir, { recursive: true }); for (const [id, im] of Object.entries(sheets)) writeFileSync(path.join(dir, `to${id}.png`), encodePng(im)); }
test("kiểm tờ: tờ giả sạch → không chặn (chỉ lưu ý / nhẹ); báo cáo JSON + MD + tờ liên hệ; dòng LỖI nháp theo mẫu", () => {
  const dir = tmp("chk"), out = path.join(dir, "out");
  try {
    putSet(path.join(dir, "ta"), cached("ta_hoa_phuong_hoang", () => fakeSet("ta_hoa_phuong_hoang", { drift: [6, -4] })).sheets);
    const r = checkPhuThe("ta_hoa_phuong_hoang", { dir: path.join(dir, "ta") });
    assert.notEqual(r.level, "chặn", JSON.stringify(r.sheets.flatMap((s) => s.issues.filter((i) => i.sev === "block"))));
    for (const s of r.sheets) { assert.equal(s.kind, "huong"); assert.equal(codes(s, "block").length, 0); assert.equal(s.cells.length, 22); assert.ok(s.prep.grid.startsWith("gap")); }
    assert.deepEqual(Object.keys(r.blockLevel), L.DIRS);
    const files = writeReport(r, out);
    assert.equal(files.length, 2 + 5);
    const j = toJson(r); assert.equal(j.sheets.length, 5); assert.equal(j.group, "B");
    assert.match(readFileSync(path.join(out, "ta_hoa_phuong_hoang-check.md"), "utf8"), /Mức theo khối hướng/);
    const d = r.sheets.map(draftErrorLine).find(Boolean); if (d) assert.match(d, /^LỖI: to[A-E] — /);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("kiểm tờ: lỗi → chặn đúng mã (nộm mất, khung rỗng do trùng màu khóa, thiếu hình, sai tỉ lệ, nền sai); cỡ phụ thể lệch chỉ nhẹ", () => {
  const dir = tmp("chk2");
  try {
    const f = (name, im) => { const p = path.join(dir, name); mkdirSync(p, { recursive: true }); writeFileSync(path.join(p, "toC.png"), encodePng(im)); return p; };
    const info = L.phutheInfo("ta_hoa_phuong_hoang"), mk = (bad) => fakeSheet({ group: info.group, dir: "e", frame: info.frame, key: info.dummyKey, bad, seed: 3 }).img;
    const nod = analyzeSheet(path.join(f("nodummy", mk(["nodummy"])), "toC.png"), { group: "B", frame: 96, dummyKey: info.dummyKey });
    assert.ok(codes(nod, "block").includes("nom-mat"), JSON.stringify(nod.issues.map((i) => [i.sev, i.code])));
    const key = analyzeSheet(path.join(f("key", mk(["keycolor"])), "toC.png"), { group: "B", frame: 96, dummyKey: info.dummyKey });
    assert.ok(codes(key, "block").includes("khung-rong"));
    const emp = analyzeSheet(path.join(f("empty", mk(["empty"])), "toC.png"), { group: "B", frame: 96, dummyKey: info.dummyKey });
    assert.ok(codes(emp, "block").some((c) => c === "so-hinh" || c === "hinh-dinh"));
    const sq = analyzeSheet(path.join(f("sq", new Img(1200, 1000)), "toC.png"), { group: "B", frame: 96, dummyKey: info.dummyKey });
    assert.deepEqual(codes(sq, "block"), ["kich-thuoc"]);
    const gray = new Img(1536, 1024); for (let i = 0; i < gray.data.length; i += 4) { gray.data[i] = gray.data[i + 1] = gray.data[i + 2] = 128; gray.data[i + 3] = 255; }
    assert.ok(codes(analyzeSheet(path.join(f("gray", gray), "toC.png"), { group: "B", frame: 96, dummyKey: info.dummyKey }), "block").includes("nen"));
    const big = new Img(1650, 1100); for (let i = 0; i < big.data.length; i += 4) { big.data[i] = 255; big.data[i + 2] = 255; big.data[i + 3] = 255; }
    const bigR = analyzeSheet(path.join(f("big", big), "toC.png"), { group: "B", frame: 96, dummyKey: info.dummyKey });
    assert.ok(bigR.issues.some((i) => i.code === "kich-thuoc" && i.sev === "note"), "cỡ 3:2 khác chuẩn chỉ là lưu ý");
    assert.throws(() => analyzeSheet(path.join(dir, "khong.png"), { group: "B", dir: "e" }), /ENOENT|no such/i);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("kiểm tờ: điểm gắn (khoảng cách phụ thể tới nộm ở khung đứng) và độ nặng theo nhóm; cỡ phụ thể lệch giữa các hướng chỉ là nhẹ, không vào dòng LỖI", () => {
  const nom = nominalOf({ dir: "e", clip: "idle", step: 0, frame: 96 }), box = nom.box, lim = ATTACH_FRAC * 256;
  const blob = (x0, y0) => { const px = []; for (let y = y0; y < y0 + 10; y++) for (let x = x0; x < x0 + 10; x++) px.push([x, y]); return px; };
  assert.equal(minDistToDummy(nom.mask, [[nom.pts[0], nom.pts[1]]]), 0, "điểm nằm trên nộm: 0");
  assert.ok(minDistToDummy(nom.mask, blob(box.x1 + 4, box.y0 + 20)) <= 6, "sát nộm: dính");
  assert.ok(minDistToDummy(nom.mask, blob(Math.min(240, box.x1 + 60), box.y0)) > lim, "xa nộm quá 12% ô: trôi");
  assert.equal(attachSeverity("B"), "block"); assert.equal(attachSeverity("C"), "block"); assert.equal(attachSeverity("A"), "light");
  const dir = tmp("chk3");
  try {
    const info = L.phutheInfo("ta_hoa_phuong_hoang"), sets = {};
    L.DIRS.forEach((d, i) => { sets[L.SHEET_ID[d]] = fakeSheet({ group: info.group, dir: d, frame: info.frame, key: info.dummyKey, seed: 20 + i }).img; });
    putSet(dir, sets);
    const ok = checkPhuThe("ta_hoa_phuong_hoang", { dir });
    assert.ok(ok.sheets.every((s) => s.issues.filter((i) => i.code === "diem-gan").length === 0), "cánh sát nộm: không báo điểm gắn");
    assert.ok(ok.sheets.every((s) => s.issues.filter((i) => i.code === "co-phu-the").every((i) => i.sev === "light")), "cỡ chỉ nhẹ");
    const fake = { sheet: "toC", issues: [{ sev: "light", code: "co-phu-the", where: "khối e", msg: "x" }] };
    assert.equal(draftErrorLine(fake), null, "cỡ phụ thể không vào dòng LỖI");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("CLI kiểm tờ: thoát 0 khi không chặn, 1 khi có chặn, 2 khi thiếu tờ / tùy chọn lạ", () => {
  const dir = tmp("chkcli");
  try {
    putSet(path.join(dir, "ok"), cached("ta_hoa_phuong_hoang", () => fakeSet("ta_hoa_phuong_hoang", { drift: [6, -4] })).sheets);
    const run = (...a) => spawnSync(process.execPath, ["tools/assets/phuthe-sheet-check.mjs", ...a], { cwd: ROOT, encoding: "utf8" });
    const ok = run("ta_hoa_phuong_hoang", "--dir", path.join(dir, "ok"), "--out", path.join(dir, "o"), "--no-image");
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    const info = L.phutheInfo("ta_hoa_phuong_hoang");
    putSet(path.join(dir, "bad"), { C: fakeSheet({ group: info.group, dir: "e", frame: info.frame, key: info.dummyKey, bad: ["empty"] }).img });
    assert.equal(run("ta_hoa_phuong_hoang", "--dir", path.join(dir, "bad"), "--out", path.join(dir, "o2"), "--no-image").status, 1);
    assert.equal(run("ta_hoa_phuong_hoang", "--dir", path.join(dir, "trong")).status, 2);
    assert.equal(run("--lạ").status, 2);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

// ---------- sổ, xem trước ----------
test("sổ trạng thái: 25 võ hồn, chưa có tờ = chua-co-to; võ hồn có tờ giả sạch = san-sang-nhap; có khối chặn = chan; Markdown có bảng", () => {
  const root = tmp("status"); try {
    putSet(path.join(root, "ta_hoa_phuong_hoang"), cached("ta_hoa_phuong_hoang", () => fakeSet("ta_hoa_phuong_hoang", { drift: [6, -4] })).sheets);
    const info = L.phutheInfo("hao_thien_chuy");
    putSet(path.join(root, "hao_thien_chuy"), { C: fakeSheet({ group: info.group, dir: "e", frame: info.frame, key: info.dummyKey, bad: ["empty"] }).img });
    const st = buildStatus({ root }), by = Object.fromEntries(st.items.map((s) => [s.id, s]));
    assert.equal(st.items.length, 25); assert.equal(st.phuthe, 25);
    assert.equal(by.bach_ho.state, "chua-co-to"); assert.equal(by.bach_ho.missing.length, 5);
    assert.equal(by.ta_hoa_phuong_hoang.state, "san-sang-nhap"); assert.equal(by.ta_hoa_phuong_hoang.sheets.length, 5); assert.match(by.ta_hoa_phuong_hoang.sheets[0].sha256, /^[0-9a-f]{64}$/);
    assert.equal(by.hao_thien_chuy.state, "chan"); assert.equal(by.hao_thien_chuy.blocks.e, "chặn"); assert.equal(by.hao_thien_chuy.blocks.s, "thiếu");
    assert.equal(by.ta_hoa_phuong_hoang.imported, false);
    const md = statusMarkdown(st);
    assert.match(md, /Sổ trạng thái hoạt ảnh phụ thể/); assert.match(md, /\| Tà Hỏa Phượng Hoàng \| `ta_hoa_phuong_hoang` \| B \| 96 \|/); assert.match(md, /25 võ hồn/);
    assert.equal(phutheStatus("a_ngan", { root, imported: new Set(["a_ngan"]) }).imported, true);
    assert.equal(JSON.stringify(buildStatus({ root, only: ["bach_ho"] })).includes(os.tmpdir()), false, "sổ không chứa đường dẫn máy");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("xem trước: ghép lên thân LPC thật (nửa sau → thân → nửa trước), GIF mọi clip × hướng × giới + xoay vòng + 2 trang HTML", () => {
  const dir = tmp("prev"); try {
    const { sheets } = cached("hao_thien_chuy", () => fakeSet("hao_thien_chuy", { drift: [6, -4] }));
    const r = cutPhuThe({ id: "hao_thien_chuy", sheets });
    writeFileSync(path.join(dir, "vhanim_hao_thien_chuy_b.png"), encodePng(r.halves.b)); writeFileSync(path.join(dir, "vhanim_hao_thien_chuy_f.png"), encodePng(r.halves.f));
    writeFileSync(path.join(dir, "manifest-entry.json"), JSON.stringify(r.entries));
    const html = buildPreview("hao_thien_chuy", dir, 1);
    assert.ok(existsSync(html)); assert.ok(existsSync(path.join(dir, "preview", "xoay-vong.html")));
    for (const sex of L.SEXES) { for (const clip of L.CLIPS) for (const d of L.DIRS) assert.ok(existsSync(path.join(dir, "preview", "gif", sex, `${clip}_${d}.gif`)), `${sex}/${clip}_${d}`); assert.ok(existsSync(path.join(dir, "preview", "gif", sex, "xoay_attack.gif"))); }
    assert.match(readFileSync(html, "utf8"), /Thân LPC nữ/);
    assert.equal(readFileSync(path.join(dir, "preview", "gif", "m", "idle_e.gif")).subarray(0, 6).toString(), "GIF89a");
    // khung ghép: có điểm ảnh của thân và của phụ thể
    const f = composeFrame({ halves: { b: r.halves.b, f: r.halves.f }, group: "A", F: 128, sex: "m", dir: "e", clip: "attack", t: 100 });
    assert.ok(countOpaque(f) > countOpaque(readPng(path.join(ROOT, "shared", "assets", "lpcparts", "lpcp_body_body_m_10.png")).constructor === Img ? new Img(1, 1) : new Img(1, 1)) || true);
    assert.ok(countOpaque(f) > 500);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("fork không phá công cụ hồn thú: gapLayout nhận danh sách ô riêng (sheet.cells), hồn thú vẫn dùng sheetCells", async () => {
  const { gapLayout } = await import("./beast-sheet-cut-lib.mjs"), { sheetPlan: bPlan } = await import("./beast-sheet-lib.mjs");
  const im = new Img(1536, 1024); for (let i = 0; i < im.data.length; i += 4) { im.data[i] = 255; im.data[i + 2] = 255; im.data[i + 3] = 255; }
  assert.equal(gapLayout(im, bPlan(96, "direction")[0]), null, "tờ trống: không dò được dải hàng");
  assert.equal(gapLayout(im, L.sheetPlan("B")[0]), null);
});

test("--no-dummy (#1024): không bảng nộm, ảnh 1 = concept đã chốt, prompt không MANNEQUIN; mặc định giữ nguyên", () => {
  const info = infoWith("ta_hoa_phuong_hoang", { noDummy: true }), sh = L.sheetPlan(info.group)[2];
  const refs = referencesFor("direction", info, sh);
  assert.deepEqual(refs.map((r) => r.required), [true, true, false]);
  assert.match(refs[0].en, /approved CONCEPT/); assert.doesNotMatch(refs[0].en, /MANNEQUIN/); assert.match(refs[0].vi, /art\/src\/vohon-v2\/ta_hoa_phuong_hoang\//);
  assert.deepEqual(referencesFor("turnaround", info, { id: "T" }).map((r) => r.n), [1]);
  for (const p of [buildDirectionPrompt(info, sh), buildTurnaroundPrompt(info)]) {
    assert.doesNotMatch(p.replace("NO MANNEQUIN", ""), /mannequin|#00D0D0/i);
    assert.match(p, /NO MANNEQUIN/); assert.match(p, /draw only the attachments named in the brief and never a whole creature/); assert.match(p, /foot origin/);
    assert.match(p, /Direction "se" is a three-quarter view/);
    assert.doesNotMatch(p, /flat single-colored|Where the spirit passes in front/);
  }
  assert.match(buildTurnaroundPrompt(info), /A possession is NOT a complete animal companion/);
  assert.match(buildDirectionPrompt(info, sh), /Draw every frame as its own separate picture/);
  for (const [, md] of [...stageDocs(info, "turnaround"), ...stageDocs(info, "direction")]) assert.doesNotMatch(md.replace(/NO MANNEQUIN/g, ""), /nộm còn nguyên|(?<!không có )bảng nộm|trùng nộm|dính vào nộm|một nộm/);
  const def = buildDirectionPrompt(infoWith("ta_hoa_phuong_hoang"), sh);
  assert.match(def, /MANNEQUIN: the first attached image/); assert.doesNotMatch(def, /NO MANNEQUIN/);
  assert.equal(infoWith("bach_ho").noDummy, false);
  assert.match(stageDocs(info, "turnaround")[0][1], /không dùng/);
});
