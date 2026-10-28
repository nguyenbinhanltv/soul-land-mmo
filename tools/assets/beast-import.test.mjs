// Thử beast-import (H4): sửa manifest theo văn bản, nhận khối chặn, chạy thật trong thư mục tạm (không đụng shared/).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { ROOT, encodePng } from "./lib.mjs";
import { fakeSheets } from "./beast-sheet-fake.mjs";
import { blockDirs, parseDirsOk, pickDirsOk, upsertEntry } from "./beast-import.mjs";

const SCRIPT = path.join(ROOT, "tools", "assets", "beast-import.mjs");
const stat = (k, map) => `    {\n      "key": "${k}",\n      "frame": [\n        96,\n        96\n      ],\n      "iso": true,\n      "static": true,\n      "map": "${map}"\n    }`;
const base = () => `{\n  "about": "x",\n  "sprites": [\n${stat("beast_a", "m1")},\n${stat("beast_b", "m2")},\n${stat("beast_c", "m3")}\n  ]\n}\n`;
const entry = (v = 1) => ({ key: "beast_b_anim", frame: [96, 96], iso: true, anim: { dirs: ["s"], cols: 6, rowsPerDir: 4, anims: {}, origin: [48, 88 + v] } });
const keys = (t) => JSON.parse(t).sprites.map((e) => e.key);

test("upsertEntry: chèn sau entry tĩnh, chép map, giữ thứ tự và entry khác", () => {
  const r = upsertEntry(base(), "b", entry());
  assert.equal(r.action, "mới");
  assert.deepEqual(keys(r.text), ["beast_a", "beast_b", "beast_b_anim", "beast_c"]);
  assert.equal(JSON.parse(r.text).sprites[2].map, "m2");
  const cut = base().indexOf(stat("beast_c", "m3"));
  assert.ok(r.text.startsWith(base().slice(0, cut).replace(/\n$/, "")) && r.text.endsWith(base().slice(cut)), "phần trước và sau giữ nguyên từng ký tự");
});

test("upsertEntry: chạy lại không đổi; entry khác thì cập nhật tại chỗ", () => {
  const once = upsertEntry(base(), "b", entry()).text;
  const again = upsertEntry(once, "b", entry());
  assert.equal(again.action, "giữ"); assert.equal(again.text, once);
  const upd = upsertEntry(once, "b", entry(2));
  assert.equal(upd.action, "cập nhật");
  assert.deepEqual(keys(upd.text), ["beast_a", "beast_b", "beast_b_anim", "beast_c"]);
  assert.equal(JSON.parse(upd.text).sprites[2].anim.origin[1], 90);
  assert.equal(upsertEntry(upd.text, "b", entry(2)).action, "giữ");
});

test("upsertEntry: thiếu ảnh tĩnh thì lỗi rõ", () => {
  assert.throws(() => upsertEntry(base(), "z", { ...entry(), key: "beast_z_anim" }), /chưa có entry ảnh tĩnh beast_z/);
});

test("blockDirs: nhận hướng của dòng chặn, dòng không rõ hướng là cả loài, bỏ qua warn", () => {
  const I = (level, msg) => ({ level, msg });
  assert.deepEqual(blockDirs([I("block", "THIẾU khung ne/idle/2 (tờ A cột 2 hàng 4)"), I("block", "khung se/walk/1 chạm mép khung"), I("warn", "khung n/die/0 lệch")]).sort(), ["ne", "se"]);
  assert.deepEqual(blockDirs([I("block", "khối e: hệ số 0.7 làm khung vượt khung 96×96")]), ["e"]);
  assert.deepEqual(blockDirs([I("block", "một số khung vượt khung 96×96 ở hệ số 0.716")]), ["cả loài"]);
  assert.deepEqual(blockDirs([I("block", "thiếu tờ C (e)"), I("block", "thiếu tờ D (ne, n)")]).sort(), ["e", "n", "ne"]);
  assert.deepEqual(blockDirs([I("warn", "x")]), []);
});

test("CLI: nhập loài chưa có anim (tờ giả, thư mục tạm), chạy lại không đổi, không ghi đè bản khác nếu thiếu --force", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "beast-import-")), src = path.join(tmp, "src"), sp = path.join(tmp, "sprites");
  try {
    mkdirSync(path.join(src, "phong_lang"), { recursive: true }); mkdirSync(sp);
    for (const [id, im] of Object.entries(fakeSheets("phong_lang"))) writeFileSync(path.join(src, "phong_lang", `to${id}.png`), encodePng(im));
    writeFileSync(path.join(sp, "manifest.json"), `{\n  "sprites": [\n${stat("beast_phong_lang", "tinh_dau_ngoai_vi")}\n  ]\n}\n`);
    const go = (...a) => spawnSync(process.execPath, [SCRIPT, "--species", "phong_lang", "--sprites", sp, "--src", src, ...a], { encoding: "utf8" });
    const png = path.join(sp, "beast", "phong_lang_anim.png"), nPng = path.join(sp, "beast", "phong_lang_anim_n.png"), mf = path.join(sp, "manifest.json");
    const dry = go("--dry-run"); assert.equal(dry.status, 0, dry.stderr); assert.match(dry.stdout, /sẽ nhập mới/);
    assert.ok(!existsSync(path.join(sp, "beast")), "dry-run không ghi");
    const a = go(); assert.equal(a.status, 0, a.stderr); assert.match(a.stdout, /đã nhập mới/);
    assert.ok(existsSync(png) && existsSync(nPng));
    assert.deepEqual(JSON.parse(readFileSync(mf, "utf8")).sprites.map((e) => e.key), ["beast_phong_lang", "beast_phong_lang_anim"]);
    const m1 = readFileSync(mf, "utf8"), p1 = readFileSync(png);
    assert.match(go().stdout, /không đổi/); assert.equal(readFileSync(mf, "utf8"), m1);
    assert.match(go("--dry-run").stdout, /giống bản đã nhập/);
    rmSync(nPng); assert.match(go().stdout, /đã cập nhật/); assert.ok(existsSync(nPng), "thiếu _n thì sinh lại");
    // bản đã nhập khác kết quả cắt lại: không ghi đè khi thiếu --force
    writeFileSync(png, Buffer.concat([p1, Buffer.from("x")]));
    const noForce = go(); assert.match(noForce.stdout, /cần --force/); assert.notEqual(Buffer.compare(readFileSync(png), p1), 0, "không ghi đè");
    assert.match(go("--force").stdout, /đã cập nhật/); assert.equal(Buffer.compare(readFileSync(png), p1), 0);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test("parseDirsOk / pickDirsOk: theo thứ tự chuẩn, khai theo loài ưu tiên, --dirs-ok-only trừ khối chặn", () => {
  assert.deepEqual(parseDirsOk("e, s,se"), ["s", "se", "e"]);
  for (const bad of ["", "s,s", "s,x", "tay"]) assert.throws(() => parseDirsOk(bad), /--dirs-ok sai/, bad);
  assert.equal(pickDirsOk("a", [], {}), undefined, "không cờ thì giữ hành vi cũ");
  assert.deepEqual(pickDirsOk("a", ["ne"], { dirsOk: ["s", "e"], dirsOkBy: { a: ["s"] } }), { dirs: ["s"], rejected: [] });
  assert.deepEqual(pickDirsOk("b", ["ne"], { dirsOk: ["s", "ne"] }), { dirs: ["s", "ne"], rejected: ["ne"] }, "hướng cutter chặn bị từ chối");
  assert.deepEqual(pickDirsOk("a", ["ne", "n"], { dirsOkOnly: true }).dirs, ["s", "se", "e"]);
});

test("CLI --dirs-ok: ghi anim.dirsOk vào manifest (đúng thứ tự), đủ 5 hướng thì không ghi, khai sai thì báo lỗi", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "beast-import-dirs-")), src = path.join(tmp, "src"), sp = path.join(tmp, "sprites");
  try {
    mkdirSync(path.join(src, "phong_lang"), { recursive: true }); mkdirSync(sp);
    for (const [id, im] of Object.entries(fakeSheets("phong_lang"))) writeFileSync(path.join(src, "phong_lang", `to${id}.png`), encodePng(im));
    writeFileSync(path.join(sp, "manifest.json"), `{\n  "sprites": [\n${stat("beast_phong_lang", "tinh_dau_ngoai_vi")}\n  ]\n}\n`);
    const go = (...a) => spawnSync(process.execPath, [SCRIPT, "--species", "phong_lang", "--sprites", sp, "--src", src, ...a], { encoding: "utf8" });
    const anim = () => JSON.parse(readFileSync(path.join(sp, "manifest.json"), "utf8")).sprites.find((e) => e.key === "beast_phong_lang_anim")?.anim;
    assert.equal(go("--dirs-ok", "x").status, 2);
    const a = go("--dirs-ok", "phong_lang=e,s,se"); assert.equal(a.status, 0, a.stderr); assert.match(a.stdout, /đã nhập mới/); assert.match(a.stdout, /s, se, e/);
    assert.deepEqual(anim().dirsOk, ["s", "se", "e"]);
    assert.match(go("--dirs-ok", "s,se,e", "--dry-run").stdout, /giống bản đã nhập/, "chạy lại cùng danh sách không đổi");
    assert.match(go("--dirs-ok", "s,se", "--dry-run").stdout, /khác bản đã nhập/);
    const all = go("--dirs-ok", "s,se,e,ne,n", "--force"); assert.equal(all.status, 0, all.stderr);
    assert.equal(anim().dirsOk, undefined, "đủ 5 hướng: bỏ dirsOk");
    assert.equal(go("--dirs-ok-only", "--dry-run").status, 0);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test("CLI cấu hình trộn: A / B legacy + D / E direction mới nhập đủ 5 hướng; chỉ D mới + A thì n báo thiếu, dirsOk-only nhập 4 hướng", () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), "beast-import-mixed-")), src = path.join(tmp, "src", "phong_lang"), sp = path.join(tmp, "sprites");
  try {
    mkdirSync(src, { recursive: true }); mkdirSync(sp);
    const put = (id, im) => writeFileSync(path.join(src, `to${id}.png`), encodePng(im)), dir = fakeSheets("phong_lang", { layout: "direction" });
    for (const [id, im] of Object.entries(fakeSheets("phong_lang"))) put(id, im);
    writeFileSync(path.join(sp, "manifest.json"), `{
  "sprites": [
${stat("beast_phong_lang", "tinh_dau_ngoai_vi")}
  ]
}
`);
    const go = (...a) => spawnSync(process.execPath, [SCRIPT, "--species", "phong_lang", "--sprites", sp, "--src", path.dirname(src), ...a], { encoding: "utf8" });
    const anim = () => JSON.parse(readFileSync(path.join(sp, "manifest.json"), "utf8")).sprites.find((e) => e.key === "beast_phong_lang_anim")?.anim;
    put("D", dir.D);
    const part = go("--dry-run", "--dirs-ok-only"); assert.equal(part.status, 0, part.stderr + part.stdout); assert.match(part.stdout, /sẽ nhập mới/);
    put("E", dir.E);
    const full = go(); assert.equal(full.status, 0, full.stderr + full.stdout); assert.match(full.stdout, /đã nhập mới/);
    assert.equal(anim().dirsOk, undefined, "đủ 5 hướng từ A + D + E");
    rmSync(path.join(src, "toB.png")); // B legacy không cần khi D / E phủ ne / n: chạy lại giống bản đã nhập
    assert.match(go("--dry-run").stdout, /giống bản đã nhập/);
    rmSync(path.join(src, "toE.png")); // n không còn nguồn: chặn đúng hướng n, nhập phần còn lại bằng --dirs-ok-only
    const miss = go("--dry-run"); assert.match(miss.stdout, /bỏ qua \(chặn\)/); assert.match(miss.stdout, /thiếu tờ B \(n\)/);
    const ok = go("--dirs-ok-only", "--force"); assert.equal(ok.status, 0, ok.stderr + ok.stdout); assert.deepEqual(anim().dirsOk, ["s", "se", "e", "ne"]);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test("CLI: tùy chọn sai báo lỗi", () => {
  const bad = (...a) => spawnSync(process.execPath, [SCRIPT, "--species", "x", ...a], { encoding: "utf8" });
  assert.equal(bad("--scale", "x=abc").status, 2);
  assert.equal(bad("--patch", "x").status, 2);
  assert.equal(bad("--lạ").status, 2);
});
