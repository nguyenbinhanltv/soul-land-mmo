// Thử công cụ phụ thể v2 kiểu VŨ KHÍ (#1312, epic #1020; đặc tả phu-the-vu-khi.md (thư mục docs/art)): bảng 25 dòng, marker điểm cầm đo bằng frameAnchors,
// nộm có marker, prompt `--kind vukhi`, cutter ghi `anim.grip` + sheet `vkanim_*`, kiểm tờ (diem-cam, marker-troi). Tờ thử là tờ TỔNG HỢP (phuthe-sheet-fake.mjs).
// Bảng 25 dòng nằm ở phu-the-vu-khi.md (thư mục docs/art); test dùng BẢNG MẪU nhúng dưới đây (cùng định dạng) để không phụ thuộc file đó, và có một test đối chiếu file thật nếu có.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { ROOT, encodePng, readPng, hex } from "./lib.mjs";
import * as L from "./phuthe-sheet-lib.mjs";
import { gripPoints, gripMarker, dummySheet, writeDummies, bodyAnchors } from "./phuthe-sheet-dummy.mjs";
import { buildDirectionPrompt, buildTurnaroundPrompt, referencesFor } from "./phuthe-sheet-prompt.mjs";
import { vukhiLessonsFor, lessonsFor, parseLessons } from "./phuthe-sheet-lessons.mjs";
import { fakeSheet } from "./phuthe-sheet-fake.mjs";
import { cutPhuThe } from "./phuthe-sheet-cut.mjs";
import { prepareSheet } from "./phuthe-sheet-cut-lib.mjs";
import { buildPreview } from "./phuthe-sheet-preview.mjs";
import { analyzeSheet } from "./phuthe-sheet-check.mjs";

test("Phá Hồn Thương dọc: n/attack 1,2 giữ tay hiện hữu đúng bước qua dummy/checker/cutter", () => {
  const id = "pha_hon_thuong", frame = 128, gripN = L.gripCounts("2 tay (theo clip)");
  const dummyKey = "#D0D000", guideKey = "#7A5CFF", gripKey = "#00FF60";
  const out = tmp("grip-dung-buoc");
  for (const sex of ["m", "f"]) {
    const poseFrames = L.sheetCells("A").map((c) => ({ name: `${sex}/n/${c.anim}/${c.frame}`, axisDegrees: 90, secondaryShaftDistance: 0 }));
    const options = { group: "A", dir: "n", frame, key: dummyKey, dummyKey, guideKey, gripKey, gripN, sex, id, poseFrames };
    const board = dummySheet(options);
    for (const c of board.cells) {
      const [hx, hy] = c.grip.hands[0];
      for (let y = Math.floor(hy - 38); y <= Math.ceil(hy); y++) for (let x = Math.floor(hx - 4); x <= Math.ceil(hx + 4); x++) board.img.set(c.col * L.CELL + x, c.row * L.CELL + y, [180, 80, 40, 255]);
    }
    const prep = prepareSheet(board.img, options);
    for (const missing of [undefined, poseFrames.map((p) => ({ ...p, name: p.name.replace(`${sex}/`, "khac/") })), []]) {
      const unapproved = dummySheet({ ...options, poseFrames: missing });
      for (const n of [1, 2]) {
        const g = unapproved.cells.find((c) => c.anim === "attack" && c.frame === n).grip;
        assert.equal(g.hands.length, 2); assert.equal(g.fallback, true, "thiếu góc đúng giới/khung thì giữ hành vi cũ");
      }
    }
    for (const c of board.cells.filter((c) => c.anim === "cast" || c.anim === "attack" && [0, 3].includes(c.frame))) {
      assert.equal(c.grip.hands.length, 2); assert.equal(c.grip.fallback, false, "đã đo đủ hai tay thì không bỏ tay B");
    }
    for (const n of [1, 2]) {
      const cell = board.cells.find((c) => c.anim === "attack" && c.frame === n);
      const prepared = prep.cells.find((c) => c.anim === "attack" && c.frame === n);
      assert.equal(cell.grip.hands.length, 1); assert.equal(cell.grip.step, n); assert.equal(cell.grip.fallback, false);
      assert.deepEqual(prepared.grip.hands, cell.grip.hands);
      const old = gripPoints({ sex, dir: "n", clip: "attack", step: n, frame, count: 2 });
      assert.equal(old.fallback, true); assert.notEqual(old.step, n, "đối chứng thực: cơ chế cũ lấy tay ở bước khác");
      for (const axisDegrees of [0, 74.9, 105.1, NaN]) assert.deepEqual(gripPoints({ sex, dir: "n", clip: "attack", step: n, frame, count: 2, id, axisDegrees }), old);
      assert.deepEqual(gripPoints({ sex, dir: "n", clip: "attack", step: n, frame, count: 2, id: "bang_phuong_hoang", axisDegrees: 90 }), old);
    }
    const file = path.join(out, `${sex}.png`); writeFileSync(file, encodePng(board.img));
    const checked = analyzeSheet(file, { ...options, kind: "vukhi" });
    assert.equal(checked.issues.filter((i) => i.sev === "block").length, 0, JSON.stringify(checked.issues));
    for (const extra of [{ id: "bang_phuong_hoang" }, { poseFrames: poseFrames.map((p) => ({ ...p, axisDegrees: 0 })) }]) {
      const rejected = analyzeSheet(file, { ...options, kind: "vukhi", ...extra });
      assert.ok(rejected.issues.some((i) => i.sev === "block" && i.code === "diem-cam" && /C[23]/.test(i.where)), "không miễn nominal tay cho mã ngoài danh sách hoặc góc ngang");
    }
    const cut = cutPhuThe({ id, kind: "vukhi", sheets: { E: board.img }, frame, dummyKey, guideKey, gripKey, dummySex: sex, poseFrames, partial: true });
    assert.equal(cut.report.summary.block, 0);
    for (const n of [1, 2]) {
      const hand = board.cells.find((c) => c.anim === "attack" && c.frame === n).grip.hands[0];
      const expected = [+(hand[0] / 2 - 64).toFixed(1), +(hand[1] / 2 - 90).toFixed(1)];
      for (const e of cut.entries) assert.deepEqual(e.anim.grip[`n/attack/${n}`], expected, "cutter không bịa B hoặc lấy tay từ bước khác");
    }
  }
});

test("số tay theo clip: nộm / chuẩn bị cutter giữ một tay lúc nghỉ, hai tay khi đánh / thi triển", () => {
  const counts = L.gripCounts("2 tay (theo clip)");
  assert.deepEqual(counts, { idle: 1, walk: 1, attack: 2, cast: 2, hurt: 1 });
  assert.ok(Object.values(L.gripCounts("2 tay")).every((n) => n === 2));
  assert.ok(Object.values(L.gripCounts("1 tay")).every((n) => n === 1));
  assert.equal(L.gripCountAt(2, "idle"), 2);
  assert.throws(() => L.gripCountAt({ idle: 3 }, "idle"), /không hợp lệ/);
  const board = dummySheet({ group: "A", dir: "s", frame: 128, key: "#00D0D0", guideKey: "#7A5CFF", gripKey: "#00FF60", gripN: counts });
  const prep = prepareSheet(board.img, { group: "A", dir: "s", frame: 128, dummyKey: "#00D0D0", guideKey: "#7A5CFF", gripKey: "#00FF60", gripN: counts });
  for (const cell of board.cells) assert.equal(cell.grip.hands.length, counts[cell.anim]);
  for (const cell of prep.cells) assert.equal(cell.grip.hands.length, counts[cell.anim]);
  const femaleNorth = gripPoints({ sex: "f", dir: "n", clip: "attack", step: 0, frame: 128, count: 2 });
  assert.equal(femaleNorth.hands.length, 2, "không loại tay nện nữ đang nâng ngang lưng");
  assert.equal(femaleNorth.step, 0, "dùng đúng điểm tay khung hiện tại nếu đã đo được");
  assert.equal(femaleNorth.fallback, false);
  for (const sex of ["m", "f"]) for (const dir of ["s", "e", "n"]) {
    const cast = gripPoints({ sex, dir, clip: "cast", step: 2, frame: 128, count: 2 });
    assert.equal(cast.hands.length, 2); assert.equal(cast.step, 2); assert.equal(cast.fallback, false, `${sex}/${dir}: cast giữ hai tay đang giơ, không fallback xuống bụng`);
  }
  for (const sex of ["m", "f"]) {
    const raisedEast = gripPoints({ sex, dir: "e", clip: "attack", step: 3, frame: 128, count: 2 });
    assert.equal(raisedEast.hands.length, 2); assert.equal(raisedEast.step, 3); assert.equal(raisedEast.fallback, false, "tay slash nâng trên lưng có thật, không dùng khung thấp lân cận");
    const raw = bodyAnchors(sex, "e", "attack", 3), hand = raw.hands.find((h) => h.n >= 20 && h.n <= 80 && h.y < raw.back.y && Math.abs(h.x - raw.back.x) >= 10);
    assert.ok(hand); assert.ok(raisedEast.hands.some(([x, y]) => x === (32 + hand.x) * 2 && y === (32 + hand.y) * 2));
  }
  const measuredRaisedHand = bodyAnchors("f", "n", "attack", 0).hands.find((h) => h.x === 39.5 && h.y === 41.5);
  assert.ok(measuredRaisedHand, "điểm có thật trên LPC, không phải gương/ước lượng từ nam");
  assert.ok(femaleNorth.hands.some(([x, y]) => x === (32 + measuredRaisedHand.x) * 2 && y === (32 + measuredRaisedHand.y) * 2));
  for (const dir of L.DIRS) for (const cell of L.sheetCells("A").filter((c) => ["attack", "cast"].includes(c.anim))) {
    const g = gripMarker({ dir, clip: cell.anim, step: L.bodyStepOf(cell.anim, L.framesOf("A")[cell.anim], cell.frame), frame: 128, count: 2 });
    assert.equal(g.hands.length, 2, `${dir}/${cell.anim}/${cell.frame}: cần tìm khung lân cận nếu tay bị che`);
  }
  if (existsSync(L.DOC_VUKHI)) for (const id of ["hao_thien_chuy", "cuu_tinh_that_sat_kiem", "quy_mi", "pha_hon_thuong", "bang_phuong_hoang"]) assert.deepEqual(L.gripCounts(L.phutheInfo(id, "vukhi").hands), counts, id);
});

test("cutter theo clip: anim.grip ghi hai tọa độ cho nghỉ / đi / hurt và bốn cho attack / cast", () => {
  const spec = SPEC.replaceAll("| cứng | 2 tay |", "| cứng | 2 tay (theo clip) |");
  const id = "hao_thien_chuy", info = L.phutheInfo(id, "vukhi", spec), counts = L.gripCounts(info.hands);
  const sheet = fakeSheet({ group: "A", dir: "s", frame: 128, key: info.dummyKey, guideKey: info.guideKey, gripKey: info.gripKey, gripN: 2 }).img;
  const r = cutPhuThe({ id, kind: "vukhi", sheets: { A: sheet }, specMd: spec, partial: true });
  assert.equal(r.report.summary.block, 0);
  assert.ok(r.entries.length);
  for (const entry of r.entries) for (const [name, points] of Object.entries(entry.anim.grip)) assert.equal(points.length, counts[name.split("/")[1]] * 2, name);
  const out = tmp("preview-vukhi");
  writeFileSync(path.join(out, "manifest-entry.json"), JSON.stringify(r.entries));
  for (const entry of r.entries) writeFileSync(path.join(out, `${entry.key}.png`), encodePng(r.halves[entry.key.endsWith("_b") ? "b" : "f"]));
  const preview = buildPreview(id, out, 1);
  assert.match(readFileSync(preview, "utf8"), /trước có|sau có/, "preview phải tải vkanim, không chỉ vhanim");
});
import { checkPhuThe } from "./phuthe-sheet-check.mjs";

const SPEC = `| # | Võ hồn (\`id\`) | Dạng vũ khí | Nhóm | Tay | Điểm cầm trên nộm | Ghi chú hoạt ảnh |
|---|---|---|---|---|---|---|
| 4 | Tà Hỏa Phượng Hoàng (\`ta_hoa_phuong_hoang\`) | đao cong lưỡi lửa: sống đao uốn như cánh phượng | cứng | 1 tay | \`tay\` thuận ở chuôi; đeo \`lưng\` ngang hông khi đứng yên | \`attack\` chém cung rộng; \`cast\` giơ cao |
| 5 | U Minh Linh Miêu (\`u_minh_linh_mieu\`) | găng vuốt báo: bốn vuốt dài tím sẫm | găng-vuốt | găng | \`tay\` cả hai bàn; vuốt vươn khỏi đầu ngón | \`attack\` cào chéo; \`cast\` vuốt xòe |
| 18 | Lam Ngân Thảo (\`lam_ngan_thao\`) | roi dây cỏ: bó dây lam thẫm xoắn như thừng | mềm | 1 tay | \`tay\` thuận giữ gốc bó dây; dây thả dài | \`attack\` dây quất; \`cast\` dây cuộn |
| 19 | Hạo Thiên Chùy (\`hao_thien_chuy\`) | đại chùy: đầu búa vuông khối mẻ | cứng | 2 tay | \`tay\` hai tay trên cán; vác \`vai\` khi đứng yên | \`attack\` nâng lên nện xuống; \`cast\` nện đất |
`;
const read = (f) => readFileSync(path.join(ROOT, f), "utf8");
const tmp = (n) => mkdtempSync(path.join(os.tmpdir(), `vukhi-${n}-`));
const infoOf = (id) => ({ ...L.phutheInfo(id, "vukhi", SPEC) });
const codes = (s, sev) => s.issues.filter((i) => i.sev === sev).map((i) => i.code);

// ---------- lib ----------
test("bảng vũ khí: đọc đúng dạng / nhóm / tay / điểm cầm; cứng → A, mềm và găng-vuốt → B; khung 128 chỉ Hạo Thiên Chùy", () => {
  const t = L.parseVukhiTable(SPEC);
  assert.deepEqual(t.map((r) => r.id), ["ta_hoa_phuong_hoang", "u_minh_linh_mieu", "lam_ngan_thao", "hao_thien_chuy"]);
  assert.deepEqual(t.map((r) => r.group), ["A", "B", "B", "A"]);
  assert.deepEqual(t.map((r) => r.frame), [96, 96, 96, 128]);
  const h = t.find((r) => r.id === "hao_thien_chuy");
  assert.equal(h.n, 19); assert.equal(h.type, "cứng"); assert.equal(h.hands, "2 tay"); assert.match(h.shape, /đại chùy/); assert.match(h.attach, /vác `vai`/); assert.match(h.motion, /nện đất/);
  assert.equal(L.allVukhiIds(SPEC).length, 4);
});

test("phutheInfo kiểu vũ khí: có gripKey khác nền / nộm / vạch; kiểu phụ thể cũ không có; kiểu lạ ném lỗi; võ hồn thiếu trong bảng ném lỗi", () => {
  const v = infoOf("lam_ngan_thao");
  assert.equal(v.kind, "vukhi"); assert.equal(v.group, "B"); assert.ok(v.gripKey);
  assert.equal(L.phutheInfo("lam_ngan_thao").gripKey, undefined); assert.equal(L.phutheInfo("lam_ngan_thao").kind, "phuthe");
  const dist = (a, b) => { const x = hex(a), y = hex(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
  for (const id of L.allPhutheIds()) {
    const k = L.gripKeyOf(id);
    assert.ok(dist(k, "#FF00FF") > 120, `${id}: marker gần nền`);
    assert.ok(dist(k, L.dummyKeyOf(id)) >= 120, `${id}: marker gần màu nộm`);
    assert.ok(dist(k, L.guideKeyOf(id)) >= 120, `${id}: marker gần màu vạch`);
  }
  assert.throws(() => L.checkKind("pha-the"), /phuthe \/ vukhi/);
  assert.throws(() => L.phutheInfo("bach_ho", "vukhi", SPEC), /không có trong bảng 25 vũ khí/);
});

test("tên sheet / thư mục theo kiểu: vkanim_<id>_b / _f; phụ thể cũ vẫn vhanim; tờ vũ khí ở <id>/vukhi", () => {
  assert.equal(L.gameKey("hao_thien_chuy", "b", "vukhi"), "vkanim_hao_thien_chuy_b");
  assert.equal(L.gameKey("hao_thien_chuy", "f"), "vhanim_hao_thien_chuy_f");
  assert.equal(L.animDir("x", "vukhi", "/r"), path.join("/r", "x", "vukhi")); assert.equal(L.animDir("x", "phuthe", "/r"), path.join("/r", "x"));
});

// ---------- điểm cầm / marker ----------
test("điểm cầm: đo từ hands[] của frameAnchors, đổi sang toạ độ ô 256; tay thuận trước (s: bên trái ảnh, n: bên phải)", () => {
  for (const frame of [96, 128]) for (const dir of ["s", "e", "n"]) for (const [clip, step] of [["idle", 0], ["attack", 2], ["cast", 1]]) {
    const g = gripPoints({ dir, clip, step, frame });
    assert.ok(g.hands.length >= 1, `${dir}/${clip}: không đo được tay`);
    for (const [x, y] of g.hands) assert.ok(x > 0 && y > 0 && x < L.CELL && y < L.CELL, "điểm cầm ngoài ô");
    // khớp đúng một mảng da cẳng tay của frameAnchors (cùng toạ độ sau đổi)
    const a = bodyAnchors("m", dir, clip, g.step), k = L.CELL / frame, [bx, by] = L.bodyOffset(frame);
    const near = a.hands.some((h) => Math.hypot((bx + h.x) * k - g.hands[0][0], (by + h.y) * k - g.hands[0][1]) < 0.5);
    assert.ok(near, `${dir}/${clip}: điểm cầm A không phải đầu mút cẳng tay`);
  }
  const s = gripPoints({ dir: "s", clip: "idle", step: 0, frame: 96 }), n = gripPoints({ dir: "n", clip: "idle", step: 0, frame: 96 });
  assert.ok(s.hands[0][0] < s.hands[1][0], "s: tay thuận (phải của hồn sư) ở bên trái ảnh"); assert.ok(n.hands[0][0] > n.hands[1][0], "n: tay thuận ở bên phải ảnh");
  assert.ok(s.shoulder[1] < s.back[1], "vai nằm trên lưng"); assert.equal(s.shoulder[0], s.back[0]);
});

test("điểm cầm: khung không đo ra tay thì dùng bước thân lân cận và báo fallback; không bao giờ ném lỗi", () => {
  for (const dir of L.DIRS) for (const clip of L.CLIPS) for (let step = 0; step < L.bodyAnim(clip).ms.length; step++) {
    const g = gripPoints({ dir, clip, step, frame: 96 });
    assert.equal(typeof g.fallback, "boolean"); assert.ok(Array.isArray(g.hands));
  }
});

test("marker: tay thuận A = chấm đặc, tay B = vòng hở giữa; cùng một màu khóa; nằm đúng điểm cầm", () => {
  const m = gripMarker({ dir: "s", clip: "idle", step: 0, frame: 96 }), set = new Set(m.pts.map(([x, y]) => `${x},${y}`));
  const [[ax, ay], [bx, by]] = m.hands.map((h) => h.map(Math.floor));
  assert.ok(set.has(`${ax},${ay}`), "tâm chấm A đặc"); assert.ok(!set.has(`${bx},${by}`), "tâm vòng B hở"); assert.ok(set.has(`${bx + L.GRIP_RING_IN + 1},${by}`), "vòng B có thành");
  assert.ok(m.pts.every(([x, y]) => Math.min(Math.hypot(x - m.hands[0][0], y - m.hands[0][1]), Math.hypot(x - m.hands[1][0], y - m.hands[1][1])) <= L.GRIP_R + 1.5));
});

test("nộm kiểu vũ khí: bảng nộm có marker đúng màu khóa đè lên nộm; không có gripKey thì không có điểm màu marker (bảng cũ không đổi)", () => {
  const key = L.GRIP_KEY, gk = hex(key), count = (img) => { let n = 0; for (let i = 0; i < img.data.length; i += 4) if (img.data[i] === gk[0] && img.data[i + 1] === gk[1] && img.data[i + 2] === gk[2]) n++; return n; };
  const withGrip = dummySheet({ group: "B", dir: "s", frame: 96, key: L.DUMMY_KEY, guideKey: L.GUIDE_KEY, gripKey: key }), plain = dummySheet({ group: "B", dir: "s", frame: 96, key: L.DUMMY_KEY, guideKey: L.GUIDE_KEY });
  assert.ok(count(withGrip.img) > 22 * 100, "mỗi ô có marker"); assert.equal(count(plain.img), 0);
  assert.ok(withGrip.cells.every((c) => c.grip && c.grip.hands.length >= 1)); assert.ok(plain.cells.every((c) => !c.grip));
  // chỉ thêm marker: mọi điểm không phải màu marker giống hệt bảng cũ
  const bg = L.BG_KEY;
  for (let i = 0; i < plain.img.data.length; i += 4) {
    const p = [0, 1, 2].map((k) => withGrip.img.data[i + k]);
    if (p[0] === gk[0] && p[1] === gk[1] && p[2] === gk[2]) continue;
    assert.deepEqual(p, [0, 1, 2].map((k) => plain.img.data[i + k]));
  }
  assert.ok(bg);
});

test("writeDummies kiểu vũ khí ghi 6 ảnh nộm có marker; kiểu cũ không", () => {
  const out = tmp("nom");
  const files = writeDummies("ta_hoa_phuong_hoang", out, { kind: "vukhi", frame: 96, specMd: SPEC }), gk = hex(L.gripKeyOf("ta_hoa_phuong_hoang"));
  const count = (f) => { const im = readPng(f); let n = 0; for (let i = 0; i < im.data.length; i += 4) if (im.data[i] === gk[0] && im.data[i + 1] === gk[1] && im.data[i + 2] === gk[2]) n++; return n; };
  assert.equal(files.length, 6);
  for (const f of files) assert.ok(count(f) > 100, `${path.basename(f)}: thiếu marker`);
  const old = writeDummies("ta_hoa_phuong_hoang", tmp("nom-cu"), { frame: 96 });
  assert.equal(old.length, 6); for (const f of old) assert.equal(count(f), 0, "kiểu cũ không có marker");
});

// ---------- prompt ----------
const promptOf = (id, dir = "e") => {
  const info = { ...infoOf(id), frame: L.phutheInfo(id).frame, dummyKey: L.dummyKeyOf(id), guideKey: L.guideKeyOf(id), noDummy: false, conceptRef: false };
  info.frame = L.parseVukhiTable(SPEC).find((r) => r.id === id).frame; info.gripKey = L.gripKeyOf(id);
  const sheet = L.sheetPlan(info.group).find((s) => s.dirs[0] === dir);
  return { info, sheet, text: buildDirectionPrompt(info, sheet) };
};

test("prompt vũ khí: STYLE / NEGATIVE nguyên văn, dòng bảng 25 + màu / motif mục 4, mô tả marker, chỉ vẽ vũ khí, không chữ cánh / đuôi / thú", () => {
  for (const id of ["ta_hoa_phuong_hoang", "u_minh_linh_mieu", "lam_ngan_thao", "hao_thien_chuy"]) {
    const { info, text } = promptOf(id);
    assert.ok(text.startsWith(L.styleBlock()), `${id}: STYLE nguyên văn`);
    assert.match(text, /WEAPON:/); assert.ok(text.includes(info.shape), `${id}: dạng vũ khí`); assert.ok(text.includes(info.attach), `${id}: điểm cầm`);
    assert.match(text, /GRIP MARKER/); assert.ok(text.includes(info.gripKey)); assert.match(text, /a filled DOT marks the main hand A, a RING/);
    assert.match(text, /draw ONLY the weapon/); assert.match(text, /never redraw the hero's body, face, hands, fingers or forearms/i);
    assert.match(text, /BACKGROUND: one flat solid #FF00FF/); assert.match(text, /GRID: 6 columns x 4 rows/);
    assert.doesNotMatch(text.slice(L.styleBlock().length), /\b(wings?|tails?|creature|beast|animal|spirit)\b/i, `${id}: còn chữ cánh / đuôi / thú / spirit sau khối STYLE`);
    assert.ok(!text.includes("Form:"), `${id}: dòng "Hình mẫu" (cả con thú) không vào prompt vũ khí`);
    assert.match(text, /Palette:/); assert.match(text, /Motifs \(use only these\):/);
  }
});

test("prompt vũ khí: bố cục theo nhóm (A 13 khung, B 22 khung); bài học CHỈ @VUKHI; tham chiếu thứ tự nộm → turnaround; turnaround cũng có marker", () => {
  const a = promptOf("hao_thien_chuy").text, b = promptOf("lam_ngan_thao").text;
  assert.match(a, /13 occupied cells/); assert.match(b, /22 occupied cells/);
  assert.match(a, /LESSONS/); assert.match(a, /Draw ONLY the held weapon/);
  assert.doesNotMatch(a, /wing root|Limbs of the creature/);
  const { info, sheet } = promptOf("lam_ngan_thao"), refs = referencesFor("direction", info, sheet);
  assert.ok(refs[0].required && /MANNEQUIN BOARD/.test(refs[0].en) && !/spirit/.test(refs[0].en)); assert.match(refs[1].en, /TURNAROUND/);
  const t = buildTurnaroundPrompt(info);
  assert.match(t, /GRIP MARKER/); assert.match(t, /martial-soul weapon held by a hero/); assert.doesNotMatch(t.slice(L.styleBlock().length), /\b(wings?|tails?|creature|spirit)\b/i);
  // kiểu cũ không đổi
  const old = buildDirectionPrompt({ ...L.phutheInfo("lam_ngan_thao"), frame: 96, noDummy: false }, L.sheetPlan("B")[2]);
  assert.doesNotMatch(old, /GRIP MARKER|WEAPON:/); assert.match(old, /SPIRIT:/);
});

test("bài học: @VUKHI chỉ vào prompt vũ khí, không lọt sang prompt phụ thể cũ; cú pháp @VUKHI hợp lệ, nhóm lạ vẫn báo lỗi", () => {
  const md = read("art/src/phuthe-anim/lessons.md"), vk = vukhiLessonsFor("direction", md);
  assert.ok(vk.length >= 4 && vk.every((l) => l.groups.has("VUKHI")));
  for (const g of L.GROUPS) for (const st of ["turnaround", "direction"]) assert.ok(!lessonsFor(st, g, md).some((l) => l.groups?.has("VUKHI")), `${g}/${st}: bài @VUKHI lọt sang phụ thể cũ`);
  assert.ok(vukhiLessonsFor("turnaround", md).length >= 1);
  assert.doesNotThrow(() => parseLessons("- [direction @VUKHI] Draw it."));
  assert.throws(() => parseLessons("- [direction @ZZZ] Draw it."), /nhóm lạ/);
});

// ---------- cutter + kiểm ----------
const fakeSet = (id, { bad = [], drift = [0, 0] } = {}) => {
  const info = infoOf(id), sheets = {};
  for (const dir of L.DIRS) sheets[L.SHEET_ID[dir]] = fakeSheet({ group: info.group, dir, frame: info.frame, key: info.dummyKey, guideKey: info.guideKey, gripKey: info.gripKey, gripN: L.gripCount(info.hands), seed: 3 + L.DIRS.indexOf(dir), drift, bad }).img;
  return { info, sheets };
};
const CUT = {};
const cutOf = (id) => (CUT[id] ??= (() => { const { info, sheets } = fakeSet(id, { drift: [5, -3] }); return { info, sheets, r: cutPhuThe({ id, kind: "vukhi", sheets, specMd: SPEC }) }; })());

test("cutter vũ khí: không chặn; sheet vkanim_<id>_b / _f; manifest có anim.kind và anim.grip; marker và nộm không lọt vào sheet", () => {
  for (const [id, cols, F] of [["lam_ngan_thao", 22, 96], ["hao_thien_chuy", 13, 128]]) {
    const { info, r } = cutOf(id);
    assert.equal(r.report.summary.block, 0, JSON.stringify(r.report.issues.filter((i) => i.level !== "info")));
    assert.equal(r.report.kind, "vukhi"); assert.equal(r.report.gripKey, info.gripKey);
    const keys = r.entries.map((e) => e.key);
    assert.ok(keys.length >= 1 && keys.every((k) => k.startsWith(`vkanim_${id}_`)), keys.join());
    for (const e of r.entries) { assert.equal(e.anim.kind, "vukhi"); assert.deepEqual(e.frame, [F, F]); assert.equal(e.anim.cols, cols); assert.equal(e.anim.gripSex, "m"); }
    const ims = Object.values(r.halves).filter(Boolean);
    assert.ok(ims.length >= 1);
    for (const im of ims) for (const key of [info.gripKey, info.dummyKey, info.guideKey]) { const c = hex(key); for (let i = 0; i < im.data.length; i += 4) if (im.data[i + 3]) assert.ok(Math.abs(im.data[i] - c[0]) + Math.abs(im.data[i + 1] - c[1]) + Math.abs(im.data[i + 2] - c[2]) > 60, `lọt điểm màu khóa ${key}`); }
    // vũ khí thật sự có trong sheet (thanh BLADE từ tay thuận)
    assert.ok(ims.reduce((n, im) => { let k = 0; for (let i = 3; i < im.data.length; i += 4) if (im.data[i]) k++; return n + k; }, 0) > 5000);
  }
});

test("cutter vũ khí: anim.grip có khoá <hướng>/<clip>/<khung> cho mọi khung đo ra tay, toạ độ từ gốc chân (tay thuận trước), khớp gripPoints", () => {
  const { r } = cutOf("lam_ngan_thao"), grip = r.entries[0].anim.grip, F = 96, [ox, oy] = L.frameOrigin(F), fr = L.framesOf("B");
  assert.ok(Object.keys(grip).length >= L.totalFrames("B") * 5 * 0.9, `chỉ có ${Object.keys(grip).length} khung có điểm cầm`);
  for (const [k, v] of Object.entries(grip)) {
    assert.match(k, /^(s|se|e|ne|n)\/(idle|walk|attack|cast|hurt)\/\d+$/); assert.ok(v.length === 2 || v.length === 4, k); assert.ok(v.every(Number.isFinite));
    for (let i = 0; i < v.length; i += 2) assert.ok(Math.abs(v[i]) < F / 2 && v[i + 1] > -F && v[i + 1] < F / 2, `${k}: điểm cầm ngoài khung ${v}`);
  }
  const [dir, clip, f] = ["s", "idle", 0], step = L.bodyStepOf(clip, fr[clip], f), g = gripPoints({ dir, clip, step, frame: F }).hands[0], v = grip[`${dir}/${clip}/${f}`];
  assert.ok(Math.abs(v[0] - ((g[0] * F) / L.CELL - ox)) < 0.06 && Math.abs(v[1] - ((g[1] * F) / L.CELL - oy)) < 0.06);
  assert.equal(r.report.gripFrames, Object.keys(grip).length);
});

test("cutter kiểu phụ thể cũ không đổi: khoá vhanim, không anim.kind / anim.grip", () => {
  const id = "ta_hoa_phuong_hoang", info = L.phutheInfo(id), sheets = {};
  for (const dir of L.DIRS) sheets[L.SHEET_ID[dir]] = fakeSheet({ group: info.group, dir, frame: info.frame, key: info.dummyKey, guideKey: info.guideKey, seed: 1 }).img;
  const r = cutPhuThe({ id, sheets });
  assert.ok(r.entries.every((e) => e.key.startsWith("vhanim_") && e.anim.kind === undefined && e.anim.grip === undefined)); assert.equal(r.report.kind, "phuthe"); assert.equal(r.report.gripKey, undefined);
});

const checkDir = (id, opt) => {
  const { info, sheets } = fakeSet(id, opt), dir = tmp("check");
  for (const [sid, img] of Object.entries(sheets)) writeFileSync(path.join(dir, `to${sid}.png`), encodePng(img));
  return { info, r: checkPhuThe(id, { kind: "vukhi", dir, specMd: SPEC }), dir };
};

test("kiểm tờ vũ khí: tờ sạch không chặn; mặc định thư mục là <id>/vukhi", () => {
  const { r } = checkDir("lam_ngan_thao", {});
  assert.equal(r.kind, "vukhi"); assert.notEqual(r.level, "chặn", JSON.stringify(r.sheets.flatMap((s) => s.issues.filter((i) => i.sev === "block"))));
  assert.equal(r.sheets.flatMap((s) => s.issues).filter((i) => i.code === "diem-cam" || i.code === "marker-troi").length, 0);
  assert.equal(path.relative(L.ANIM_ROOT, L.animDir("lam_ngan_thao", "vukhi")), path.join("lam_ngan_thao", "vukhi"));
});

test("kiểm tờ vũ khí: vũ khí lơ lửng cách tay ở khung đứng → diem-cam (CHẶN với mềm / găng B, nhẹ với cứng A)", () => {
  const b = checkDir("lam_ngan_thao", { bad: ["float"] }).r, a = checkDir("hao_thien_chuy", { bad: ["float"] }).r;
  assert.equal(b.level, "chặn"); assert.ok(b.sheets.some((s) => codes(s, "block").includes("diem-cam")), "B: diem-cam phải chặn");
  assert.ok(a.sheets.some((s) => codes(s, "light").includes("diem-cam")), "A: diem-cam nhẹ"); assert.ok(!a.sheets.some((s) => codes(s, "block").includes("diem-cam")));
  assert.ok(b.sheets.flatMap((s) => s.issues).filter((i) => i.code === "diem-cam").every((i) => /marker điểm cầm/.test(i.msg)));
});

test("kiểm tờ vũ khí: marker bị vẽ lệch khỏi tay nộm → marker-troi nhẹ; kiểu phụ thể cũ không kiểm marker", () => {
  const r = checkDir("lam_ngan_thao", { bad: ["mdrift"] }).r;
  assert.ok(r.sheets.some((s) => codes(s, "light").includes("marker-troi")), JSON.stringify(r.sheets.map((s) => s.issues.map((i) => i.code))));
  assert.notEqual(r.level, "chặn");
});

test("CLI: phuthe-sheet-dummy / -prompt / -check nhận --kind vukhi, kiểu lạ thì thoát 2 (cần bảng 25 dòng thật)", { skip: !existsSync(L.DOC_VUKHI) && "phu-the-vu-khi.md (thư mục docs/art) chưa có (PR #1310 chưa gộp)" }, () => {
  const run = (f, args) => spawnSync(process.execPath, [path.join(ROOT, "tools", "assets", f), ...args], { encoding: "utf8" });
  const all = run("phuthe-sheet-prompt.mjs", ["--all", "--kind", "vukhi"]);
  assert.equal(all.status, 0, all.stderr); assert.equal(all.stdout.trim().split("\n").length, 25);
  const out = tmp("cli"), p = run("phuthe-sheet-prompt.mjs", ["--id", "hao_thien_chuy", "--stage", "direction", "--dir", "e", "--kind", "vukhi", "--out", out]);
  assert.equal(p.status, 0, p.stderr); assert.ok(existsSync(path.join(out, "hao_thien_chuy-toC.md"))); assert.ok(existsSync(path.join(out, "hao_thien_chuy-nom-toC.png")));
  const md = readFileSync(path.join(out, "hao_thien_chuy-toC.md"), "utf8");
  assert.match(md, /art\/src\/phuthe-anim\/hao_thien_chuy\/vukhi\/toC\.png/); assert.match(md, /--kind vukhi/); assert.match(md, /Marker điểm cầm/);
  assert.equal(run("phuthe-sheet-prompt.mjs", ["--id", "hao_thien_chuy", "--kind", "pha-the"]).status, 2);
  assert.equal(run("phuthe-sheet-prompt.mjs", ["--id", "hao_thien_chuy", "--kind", "vukhi", "--no-dummy"]).status, 2);
});

test("bảng 25 dòng thật (nếu file đã có): đúng 25 võ hồn trùng bảng phụ thể, nhóm 12 cứng / 6 mềm / 7 găng-vuốt, mọi dòng có mô tả mục 4", { skip: !existsSync(L.DOC_VUKHI) && "phu-the-vu-khi.md (thư mục docs/art) chưa có (PR #1310 chưa gộp)" }, () => {
  const t = L.parseVukhiTable();
  assert.equal(t.length, 25); assert.deepEqual(t.map((r) => r.id).sort(), L.allPhutheIds().sort());
  assert.deepEqual(["cứng", "mềm", "găng-vuốt"].map((k) => t.filter((r) => r.type === k).length), [12, 6, 7]);
  for (const r of t) { assert.ok(L.parseStyleBrief(r.id), r.id); assert.ok(r.shape && r.hands && r.attach && r.motion, r.id); assert.equal(L.phutheInfo(r.id, "vukhi").gripKey != null, true); }
  assert.equal(t.find((r) => r.id === "hao_thien_chuy").frame, 128);
});

// ---------- nhập vào game (phuthe-import.mjs --kind vukhi) ----------
import { run as importRun, clientEntry, upsertCreditsRow } from "./phuthe-import.mjs";
import { sheetSpec } from "./lib.mjs";

/** Ghi kết quả cutter (tờ giả) ra thư mục như `phuthe-sheet-cut.mjs --out`, và dựng thư mục sprites / CREDITS tạm có sẵn mục `vh_<id>_f`. */
function stage(id) {
  const { r } = cutOf(id), dir = tmp("cut"), sprites = tmp("spr"), credits = path.join(tmp("cr"), "CREDITS.md");
  for (const [half, im] of Object.entries(r.halves)) if (im) writeFileSync(path.join(dir, `vkanim_${id}_${half}.png`), encodePng(im));
  writeFileSync(path.join(dir, "manifest-entry.json"), JSON.stringify(r.entries, null, 2) + "\n");
  writeFileSync(path.join(sprites, "manifest.json"), `{\n  "sprites": [\n    {\n      "key": "vh_${id}_f",\n      "iso": true\n    },\n    {\n      "key": "zz",\n      "iso": true\n    }\n  ]\n}\n`);
  writeFileSync(credits, "# Credits\n\n## Asset tạo bằng AI (ChatGPT)\n\nmô tả\n\n| File | Key | Công cụ | Mô tả | Ngày | Ghi chú |\n|---|---|---|---|---|---|\n| `a.png` | `x` | t | m | 2026-01-01 | g |\n\n## Asset bên ngoài\n");
  return { r, dir, sprites, credits, nguon: path.join(tmp("ng"), "NGUON.md") };
}

test("sheetSpec: vkanim_* → vukhianim/<id>_<nửa>.png, khung 96 / 128; khoá hỏng / khung lạ thì null; vhanim giữ vohonanim", () => {
  assert.deepEqual(sheetSpec("vkanim_hao_thien_chuy_b", [128, 128], true), { file: "vukhianim/hao_thien_chuy_b.png", frame: [128, 128], kind: "vhanim", vukhi: true, iso: true });
  assert.equal(sheetSpec("vkanim_x_b", [64, 64], true), null); assert.equal(sheetSpec("vkanim_x_b", undefined, true), null); assert.equal(sheetSpec("vkanim_x_c", [96, 96], true), null);
  assert.equal(sheetSpec("vhanim_x_b", [96, 96], true).file, "vohonanim/x_b.png");
});

test("importer vũ khí: chép ảnh vào vukhianim, mục manifest giữ kind / grip / gripSex đặt sau vh_<id>_f, credit một dòng mỗi nửa, chạy lại không đổi", () => {
  const id = "lam_ngan_thao", s = stage(id), o = { id, kind: "vukhi", dir: s.dir, sprites: s.sprites, credits: s.credits, nguon: s.nguon, date: "2026-10-30" };
  importRun(o);
  const mf = JSON.parse(readFileSync(path.join(s.sprites, "manifest.json"), "utf8")).sprites, keys = mf.map((e) => e.key), halves = s.r.entries.map((e) => e.key);
  assert.deepEqual(keys, [`vh_${id}_f`, `vkanim_${id}_b`, `vkanim_${id}_f`, "zz"], "mục vũ khí liền sau vh_<id>_f, trước mục khác (nửa không có điểm ảnh ghi blank)");
  for (const k of [`vkanim_${id}_b`, `vkanim_${id}_f`]) if (!halves.includes(k)) { const m = mf.find((x) => x.key === k); assert.equal(m.blank, true); assert.equal(m.anim.kind, "vukhi"); assert.ok(!existsSync(path.join(s.sprites, "vukhianim", `${id}_${k.slice(-1)}.png`))); }
  for (const e of s.r.entries) {
    const m = mf.find((x) => x.key === e.key), half = e.key.slice(-1);
    assert.equal(m.anim.kind, "vukhi"); assert.deepEqual(m.anim.grip, e.anim.grip); assert.equal(m.anim.gripSex, "m"); assert.deepEqual(m.anim.clips, e.anim.anims); assert.equal(m.anim.cols, e.anim.cols);
    assert.ok(!("anims" in m.anim) && !("origin" in m.anim) && !("group" in m.anim), "bỏ trường chỉ của công cụ");
    assert.ok(existsSync(path.join(s.sprites, "vukhianim", `${id}_${half}.png`)) && !existsSync(path.join(s.sprites, "vohonanim")), "ảnh ở vukhianim, không đụng vohonanim");
    assert.equal(readPng(path.join(s.sprites, "vukhianim", `${id}_${half}.png`)).w, e.frame[0] * e.anim.cols);
  }
  const cr = readFileSync(s.credits, "utf8");
  for (const k of halves) assert.equal(cr.split(`\`${k}\``).length - 1, 1, `credit ${k}`);
  assert.ok(cr.indexOf(`vkanim_${id}_`) < cr.indexOf("## Asset bên ngoài") && cr.includes("2026-10-30") && cr.includes("`x` | t | m"), "chèn cuối bảng ChatGPT, giữ dòng cũ");
  const snap = [readFileSync(path.join(s.sprites, "manifest.json"), "utf8"), cr, readFileSync(path.join(s.sprites, "vukhianim", `${id}_${halves[0].slice(-1)}.png`))];
  importRun({ ...o, date: "2027-01-01" });
  assert.equal(readFileSync(path.join(s.sprites, "manifest.json"), "utf8"), snap[0], "manifest không đổi khi chạy lại"); assert.equal(readFileSync(s.credits, "utf8"), snap[1], "credit giữ ngày cũ");
  assert.ok(Buffer.compare(readFileSync(path.join(s.sprites, "vukhianim", `${id}_${halves[0].slice(-1)}.png`)), snap[2]) === 0);
});

test("importer vũ khí: dry-run không ghi; --anchor bị từ chối; mục đặt sau vhanim_<id>_f nếu đã có phụ thể hoạt ảnh; CREDITS thiếu mục ChatGPT thì báo lỗi", () => {
  const id = "lam_ngan_thao", s = stage(id), before = readFileSync(path.join(s.sprites, "manifest.json"), "utf8");
  importRun({ id, kind: "vukhi", dir: s.dir, sprites: s.sprites, credits: s.credits, nguon: s.nguon, dryRun: true });
  assert.equal(readFileSync(path.join(s.sprites, "manifest.json"), "utf8"), before); assert.ok(!existsSync(path.join(s.sprites, "vukhianim")));
  assert.throws(() => importRun({ id, kind: "vukhi", dir: s.dir, sprites: s.sprites, anchor: "x.json" }), /--anchor chỉ cho phụ thể/);
  writeFileSync(path.join(s.sprites, "manifest.json"), before.replace(`"zz"`, `"vhanim_${id}_f"`));
  importRun({ id, kind: "vukhi", dir: s.dir, sprites: s.sprites });
  const keys = JSON.parse(readFileSync(path.join(s.sprites, "manifest.json"), "utf8")).sprites.map((e) => e.key);
  assert.equal(keys.indexOf(`vkanim_${id}_b`) - keys.indexOf(`vhanim_${id}_f`) >= 1, true); assert.equal(keys[keys.indexOf(`vhanim_${id}_f`) - 0], `vhanim_${id}_f`);
  assert.throws(() => upsertCreditsRow("# x\n", { key: "k", file: "f", id, date: "d" }), /chưa có mục/);
});

test("importer phụ thể cũ không đổi: clientEntry không mang kind / grip", () => {
  const e = clientEntry({ key: "vhanim_x_b", frame: [96, 96], iso: true, anim: { cols: 22, anims: { idle: { col: 0, n: 4 } } } }, false);
  assert.deepEqual(Object.keys(e.anim), ["cols", "clips"]);
});
