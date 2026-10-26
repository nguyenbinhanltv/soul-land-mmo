// Thử credits.mjs (#973): ghi công hồn thú hoạt ảnh gom từ art/src/beast-anim/<loài>/NGUON.md, thiếu bảng thì --check báo lỗi,
// hai nhánh cùng thêm một loài mới (NGUON.md riêng) merge không xung đột.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { buildCredits, validate, readAnimSources, OUT, parseTables } from "./credits.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const MD = readFileSync(path.join(ROOT, "art/CREDITS.md"), "utf8");
const nguon = (extra = "") => `# Loài thử\n\nLỖI: toA — hướng — ...\n${extra}`;
const table = (desc = "ChatGPT dựng raw") => `\n## Ghi công\n\n| File | Key | Công cụ | Mô tả / prompt | Ngày | Ghi chú |\n|---|---|---|---|---|---|\n| \`art/src/beast-anim/x/\` | - | ChatGPT / Codex \`image_gen.imagegen\` | ${desc} | - | - |\n`;
const run = (anim) => { const r = buildCredits({ md: MD, anim }); return { r, errs: validate(r) }; };

test("credits.json thật khớp CREDITS.md + mọi NGUON.md; mọi loài có tờ đều có bảng Ghi công", () => {
  const anim = readAnimSources();
  const withSheets = Object.entries(anim).filter(([, a]) => a.hasSheets);
  assert.ok(withSheets.length >= 30);
  for (const [id, a] of withSheets) assert.ok(a.md && parseTables(a.md).some((t) => t.section === "Ghi công" && t.rows.length), id);
  const { r, errs } = run(anim);
  assert.deepEqual(errs, []);
  assert.equal(JSON.stringify(r.data) + "\n", readFileSync(OUT, "utf8"));
});

test("loài có tờ mà NGUON.md thiếu bảng ghi công: lỗi nêu đúng loài; có bảng thì hết lỗi", () => {
  const bad = run({ x: { md: nguon(), hasSheets: true } });
  assert.ok(bad.errs.some((e) => /art\/src\/beast-anim\/x\/NGUON\.md.*thiếu bảng "## Ghi công"/.test(e)), bad.errs.join("\n"));
  assert.ok(run({ x: { md: null, hasSheets: true } }).errs.some((e) => /x\/NGUON\.md/.test(e)));
  assert.deepEqual(run({ x: { md: nguon(table()), hasSheets: true } }).errs, []);
  assert.deepEqual(run({ x: { md: null, hasSheets: false } }).errs, [], "thư mục chưa có tờ thì không bắt buộc");
});

test("dòng ghi công thiếu mô tả bị báo; dòng đủ gom vào nhóm công cụ ChatGPT mà không đổi số đếm", () => {
  assert.ok(run({ x: { md: nguon(table("")), hasSheets: true } }).errs.some((e) => /thiếu công cụ hoặc mô tả/.test(e)));
  const base = run({}).r.data, withRow = run({ x: { md: nguon(table()), hasSheets: true } }).r.data;
  assert.deepEqual(withRow, base);
});

test("hai nhánh cùng thêm một loài mới (NGUON.md riêng) rồi merge: không xung đột; CREDITS.md và credits.json không đổi", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "credits-merge-"));
  const git = (...a) => { const r = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: dir, encoding: "utf8" }); assert.equal(r.status, 0, `git ${a.join(" ")}: ${r.stderr}`); return r.stdout; };
  try {
    git("init", "-q", "-b", "main");
    writeFileSync(path.join(dir, "CREDITS.md"), "## Hồn thú hoạt ảnh — raw chờ preview\n\nCâu trỏ.\n");
    git("add", "."); git("commit", "-q", "-m", "gốc");
    for (const [br, id] of [["a", "loai_a"], ["b", "loai_b"]]) {
      git("checkout", "-q", "-b", br, "main");
      const d = path.join(dir, "art/src/beast-anim", id); spawnSync("mkdir", ["-p", d]);
      writeFileSync(path.join(d, "NGUON.md"), nguon(table(`loài ${id}`)));
      git("add", "."); git("commit", "-q", "-m", id);
    }
    git("checkout", "-q", "a"); git("merge", "-q", "--no-edit", "b");
    assert.equal(readFileSync(path.join(dir, "CREDITS.md"), "utf8"), "## Hồn thú hoạt ảnh — raw chờ preview\n\nCâu trỏ.\n");
    const anim = readAnimSources(path.join(dir, "art/src/beast-anim"));
    assert.deepEqual(Object.keys(anim), ["loai_a", "loai_b"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
