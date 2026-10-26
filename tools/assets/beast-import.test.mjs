// Thử beast-import (H4): sửa manifest theo văn bản, nhận khối chặn, chạy thật trong thư mục tạm (không đụng shared/).
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, copyFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { ROOT } from "./lib.mjs";
import { blockDirs, upsertEntry } from "./beast-import.mjs";

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
  assert.deepEqual(blockDirs([I("warn", "x")]), []);
});

test("CLI: nhập một loài chưa nhập vào thư mục tạm, chạy lại không đổi, --dry-run không ghi", () => {
  const manifest = path.join(ROOT, "shared", "assets", "sprites", "manifest.json");
  const hasSrc = existsSync(path.join(ROOT, "art", "src", "beast-anim", "quy_anh_bao", "toA.png"));
  if (!hasSrc || !/"key": "beast_quy_anh_bao",/.test(readFileSync(manifest, "utf8")) || /"key": "beast_quy_anh_bao_anim"/.test(readFileSync(manifest, "utf8"))) return; // loài thử đã nhập vào main: bỏ qua
  const tmp = mkdtempSync(path.join(os.tmpdir(), "beast-import-"));
  try {
    copyFileSync(manifest, path.join(tmp, "manifest.json"));
    const go = (...a) => spawnSync(process.execPath, [SCRIPT, "--species", "quy_anh_bao", "--sprites", tmp, ...a], { encoding: "utf8" });
    const dry = go("--dry-run"); assert.equal(dry.status, 0, dry.stderr); assert.match(dry.stdout, /sẽ nhập mới/);
    assert.ok(!existsSync(path.join(tmp, "beast")), "dry-run không ghi");
    const a = go(); assert.equal(a.status, 0, a.stderr); assert.match(a.stdout, /đã nhập mới/);
    assert.ok(existsSync(path.join(tmp, "beast", "quy_anh_bao_anim.png")) && existsSync(path.join(tmp, "beast", "quy_anh_bao_anim_n.png")));
    const m1 = readFileSync(path.join(tmp, "manifest.json"), "utf8");
    const b = go(); assert.match(b.stdout, /không đổi/);
    assert.equal(readFileSync(path.join(tmp, "manifest.json"), "utf8"), m1);
    assert.match(go("--dry-run").stdout, /giống bản đã nhập/);
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
