// Thử công cụ hoạt ảnh hồn thú v2 (#865): bài học, prompt theo giai đoạn, sổ trạng thái, NGUON tự sinh, bố cục theo hướng.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { ROOT, Img, readPng, encodePng } from "./lib.mjs";
import { cutSpecies } from "./beast-sheet-cut.mjs";
import { sheetPlan, speciesInfo, TURNAROUND, DIRS } from "./beast-sheet-lib.mjs";
import { parseLessons, lessonsFor, LESSONS_FILE } from "./beast-sheet-lessons.mjs";
import { buildPrompt, buildDirectionPrompt, buildTurnaroundPrompt, stageDocs, referencesFor } from "./beast-sheet-prompt.mjs";
import { buildStatus, statusMarkdown } from "./beast-status.mjs";
import { buildNguon, readSourceJson } from "./beast-nguon.mjs";
import { checkSpecies } from "./beast-sheet-check.mjs";

test("bài học: file thật phân tích được; mỗi giai đoạn có bài; lọc theo họ; cú pháp sai thì báo", () => {
  const md = readFileSync(LESSONS_FILE, "utf8");
  const all = parseLessons(md);
  assert.ok(all.length >= 10);
  for (const l of all) { assert.ok(l.text.length > 20); assert.doesNotMatch(l.text, /\d+\s*px|\bpixels?\b/i, "không số pixel trong bài học"); }
  for (const st of ["turnaround", "direction", "sheet"]) assert.ok(lessonsFor(st, "quad", md).length >= 5, st);
  assert.ok(lessonsFor("direction", "bird", md).some((l) => /bird/.test(l.text)));
  assert.ok(!lessonsFor("direction", "quad", md).some((l) => /bird/.test(l.text)));
  assert.throws(() => parseLessons("- [lạ] câu"), /giai đoạn lạ/);
  assert.throws(() => parseLessons("- [@rồng] câu"), /họ lạ/);
  assert.deepEqual(lessonsFor("direction", "quad", "- [all] A line // vi\n- [turnaround] B line").map((l) => l.text), ["A line"]);
});

test("turnaround: 1 ảnh 3:2, 5 hướng × idle / hurt / die, có bài học và ảnh tham chiếu theo thứ tự", () => {
  const info = speciesInfo("phong_lang"), p = buildTurnaroundPrompt(info, info.desc);
  assert.match(p, /landscape 3:2 aspect ratio/);
  assert.match(p, new RegExp(`${TURNAROUND.cols} columns x ${TURNAROUND.rows} rows`));
  for (const d of DIRS) assert.match(p, new RegExp(`direction "${d}"`));
  assert.match(p, /row 1 = IDLE/);
  assert.match(p, /row 2 = HURT/);
  assert.match(p, /row 3 = DIE/);
  assert.match(p, /LESSONS/);
  assert.match(p, /image 1 = the static reference/);
  assert.doesNotMatch(p, /exactly \d+x\d+|eyes shut|collapse sideways/);
  const docs = stageDocs(info, "turnaround", info.desc);
  assert.equal(docs.length, 1);
  assert.equal(docs[0][0], "phong_lang-turnaround.md");
});

test("direction: mỗi hướng một tờ 1536×1024 6×4, kể cả loài khung nhỏ; tham chiếu cố định ảnh tĩnh → turnaround → tờ tùy chọn", () => {
  for (const id of ["phong_lang", "thai_than_cu_vien"]) {
    const info = speciesInfo(id), plan = sheetPlan(info.frame, "direction");
    assert.deepEqual(plan.map((s) => s.id), ["A", "B", "C", "D", "E"]);
    for (const [i, sh] of plan.entries()) {
      assert.deepEqual([sh.w, sh.h, sh.cols, sh.rows, sh.dirs.length], [1536, 1024, 6, 4, 1]);
      const p = buildDirectionPrompt(info, sh, info.desc), refs = referencesFor("direction", info, sh);
      assert.equal(sh.dirs[0], DIRS[i]);
      assert.deepEqual(refs.map((r) => r.n), [1, 2, 3]);
      assert.deepEqual(refs.map((r) => r.required), [true, true, false]);
      assert.match(p, /image 2 = the approved TURNAROUND/);
      assert.match(p, new RegExp(`column "${sh.dirs[0]}"`));
      assert.match(p, new RegExp(`direction "${sh.dirs[0]}"`));
      assert.match(p, /never copy its poses/);
    }
  }
  assert.equal(stageDocs(speciesInfo("phong_lang"), "direction", "x").length, 5);
  assert.equal(stageDocs(speciesInfo("phong_lang"), "direction", "x", ["ne"]).length, 1);
});

test("sheet (v1 / dự phòng) giữ bố cục A / B; tờ B đính tờ A đã duyệt làm tham chiếu thứ hai; có bài học", () => {
  const info = speciesInfo("phong_lang"), plan = sheetPlan(info.frame);
  assert.deepEqual(plan.map((s) => [s.id, s.dirs.length]), [["A", 3], ["B", 2]]);
  assert.equal(referencesFor("sheet", info, plan[0]).length, 1);
  assert.equal(referencesFor("sheet", info, plan[1]).length, 2);
  assert.match(buildPrompt(info, plan[1], info.desc), /approved first sheet \(A\)/);
  assert.match(buildPrompt(info, plan[0], info.desc), /LESSONS/);
});

test("tài liệu theo giai đoạn nêu beast-nguon, giới hạn 3 lượt và cấm dùng tờ lỗi làm tham chiếu", () => {
  const info = speciesInfo("kim_linh_ung");
  for (const st of ["turnaround", "direction", "sheet"]) for (const [, md] of stageDocs(info, st, info.desc)) {
    assert.match(md, /tối đa 3 lượt/);
    assert.match(md, /beast-nguon/);
    assert.match(md, /dùng ảnh hỏng|dùng tờ hỏng|dùng tờ lỗi|\*\*Không\*\* dùng/);
    assert.doesNotMatch(md, /chọn kích thước/);
  }
});

test("sheetPlan: auto theo cỡ khung, direction luôn 5 tờ một hướng", () => {
  assert.equal(sheetPlan(96).length, 2);
  assert.equal(sheetPlan(96, "direction").length, 5);
  assert.equal(sheetPlan(192, "auto").length, 5);
});

test("sổ trạng thái: đủ trường, ổn định giữa hai lần chạy, bảng MD đủ dòng", () => {
  const only = ["quy_ho", "thai_than_cu_vien", "hac_boi_da_tru"], st = buildStatus({ only });
  assert.equal(st.items.length, 3);
  const q = st.items.find((x) => x.id === "quy_ho");
  assert.equal(q.sheets.length, 2);
  assert.equal(q.layout, "sheet");
  assert.deepEqual(q.missing, []);
  assert.match(q.sheets[0].sha256, /^[0-9a-f]{64}$/);
  const t = st.items.find((x) => x.id === "thai_than_cu_vien");
  assert.equal(t.state, "chan");
  assert.equal(t.blocks.e, "chặn");
  assert.equal(t.imported, true);
  assert.deepEqual(buildStatus({ only }), st);
  const md = statusMarkdown(st);
  assert.match(md, /tự sinh/);
  assert.equal(md.split("\n").filter((l) => l.startsWith("| ") && l.includes("`")).length, 3);
});

test("NGUON tự sinh: hash, cỡ, nguồn unknown không đoán, dòng LỖI từ công cụ + --eye, chưa duyệt mắt thì ghi rõ", () => {
  const r = checkSpecies("quy_ho");
  const md = buildNguon("quy_ho", r, { eye: [{ sheet: "toB", text: "hướng — N H8 C3–4 — die lộ mặt" }], eyeOk: ["toA"], issue: "769" });
  assert.match(md, /tự sinh/);
  assert.match(md, /#769/);
  assert.match(md, /SHA256 `24139325686d96136af0a51951257a7d6208275755f6f954cd936027f75a980b`/);
  assert.match(md, /\*\*1254×1254\*\*/);
  assert.match(md, /seed: unknown/);
  assert.match(md, /^LỖI: toB — hướng — N H8 C3–4 — die lộ mặt \(mắt\)$/m);
  assert.match(md, /Duyệt bằng mắt: đã xem/);
  const none = buildNguon("quy_ho", r, {});
  assert.equal((none.match(/chưa duyệt bằng mắt/g) ?? []).length, 2);
  assert.doesNotMatch(none, /\(mắt\)/);
  assert.equal(readSourceJson(path.join(os.tmpdir(), "khong-co.json")), null);
});

test("NGUON: turnaround.png được ghi (hash, cỡ, prompt, --eye), loài chỉ có turnaround không ném lỗi; --write không ghi đè NGUON có sẵn", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "beast-nguon-")), run = (...args) => spawnSync(process.execPath, [path.join(ROOT, "tools", "assets", "beast-nguon.mjs"), "--species", "quy_ho", "--dir", dir, ...args], { encoding: "utf8" });
  try {
    assert.equal(run().status, 2); // chưa có gì
    const im = new Img(8, 6); im.set(1, 1, [200, 10, 10, 255]);
    writeFileSync(path.join(dir, "turnaround.png"), encodePng(im));
    writeFileSync(path.join(dir, "turnaround.prompt.txt"), "prompt thử");
    const ok = run("--eye", "turnaround=hướng — ne — vẽ ngang", "--model", "m-thử");
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /## turnaround/);
    assert.ok(ok.stdout.includes("**8×6**"));
    assert.ok(ok.stdout.includes("turnaround.prompt.txt"));
    assert.match(ok.stdout, /model: m-thử/);
    assert.ok(ok.stdout.split("\n").includes("LỖI: turnaround — hướng — ne — vẽ ngang (mắt)"));
    assert.equal(run("--write").status, 0);
    assert.ok(existsSync(path.join(dir, "NGUON.md")));
    const again = run("--write");
    assert.equal(again.status, 1);
    assert.match(again.stderr, /đã có/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("cutter: loài khung nhỏ cắt được 5 tờ 3:2 theo hướng (tự nhận bố cục), đủ 5 hướng × 22 khung", () => {
  // Tờ thật 3:2 của Thái Thản dùng làm ảnh thử hình học; phong_lang khung 96 theo bố cục v1 sẽ cần A / B, ở đây phải nhận ra bố cục theo hướng.
  const sheets = Object.fromEntries("ABCDE".split("").map((l) => [l, readPng(path.join(ROOT, "art", "src", "beast-anim", "thai_than_cu_vien", `to${l}.png`))]));
  const r = cutSpecies({ species: "phong_lang", sheets });
  assert.deepEqual(Object.keys(r.report.sheets).sort(), ["A", "B", "C", "D", "E"]);
  assert.equal(r.frames.size, 5 * 22);
});
