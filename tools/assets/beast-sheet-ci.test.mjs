// Thử CI nhẹ tờ hồn thú (#866): chọn loài từ file PR đổi, phân loại lỗi chặn CI.
import test from "node:test";
import assert from "node:assert/strict";
import { changedFromFiles, isCiBlocker, summaryMarkdown, evaluate } from "./beast-sheet-ci.mjs";

test("changedFromFiles: chỉ tờ toX.png kích hoạt loài; công cụ đánh dấu riêng", () => {
  const r = changedFromFiles(["art/src/beast-anim/phong_lang/toA.png", "art/src/beast-anim/phong_lang/toB.png", "art/src/beast-anim/quy_ho/NGUON.md", "art/src/beast-anim/u_minh_lang/toC.prompt.txt", "README.md"]);
  assert.deepEqual(r, { species: ["phong_lang"], toolsChanged: false });
  assert.equal(changedFromFiles(["tools/assets/beast-sheet-cut.mjs"]).toolsChanged, true);
  assert.equal(changedFromFiles(["tools/assets/lib.mjs"]).toolsChanged, false);
});

test("isCiBlocker: chặn đúng 4 nhóm, còn lại cảnh báo", () => {
  const b = (code, msg = "", sev = "block") => isCiBlocker({ sev, code, msg });
  assert.ok(b("kich-thuoc") && b("nen") && b("luoi") && b("hinh-dinh"));
  assert.ok(b("so-hinh", "dải có 5 hình, cần 6: thiếu khung."));
  assert.ok(!b("so-hinh", "dải có 7 hình, cần 6: thừa hình / mảnh rời."));
  assert.ok(!b("co-than") && !b("kich-thuoc", "", "light") && !b("nen", "", "note"));
});

test("evaluate + summaryMarkdown chạy trên loài thật, không chặn khi loài đạt", () => {
  const x = evaluate("hac_boi_da_tru");
  assert.equal(x.blockers.length, 0);
  const md = summaryMarkdown([x]);
  assert.match(md, /hac_boi_da_tru/);
  assert.match(md, /Không có lỗi chặn CI/);
});

test("runLocal (#971): tờ toA 948×1659 (file tạm, xoá sau khi thử) → thoát 1, in 'sai kích thước' + cách sửa", async () => {
  const { mkdirSync, rmSync, writeFileSync } = await import("node:fs");
  const { spawnSync } = await import("node:child_process");
  const { default: path } = await import("node:path");
  const { deflateSync } = await import("node:zlib");
  const { ROOT } = await import("./lib.mjs");
  // PNG trắng 948×1659 (RGB) tự dựng, không cần thư viện ảnh.
  const w = 948, h = 1659, crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (b) => { let r = ~0; for (const x of b) r = crcT[(r ^ x) & 255] ^ (r >>> 8); return ~r >>> 0; };
  const chunk = (ty, d) => { const b = Buffer.concat([Buffer.from(ty), d]), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(d.length); c.writeUInt32BE(crc(b)); return Buffer.concat([l, b, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h, 255); for (let y = 0; y < h; y++) raw[y * (w * 3 + 1)] = 0;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
  const dir = path.join(ROOT, "art", "src", "beast-anim", "zz_test_971");
  mkdirSync(dir, { recursive: true });
  try {
    writeFileSync(path.join(dir, "toA.png"), png);
    const r = spawnSync(process.execPath, [path.join(ROOT, "tools/assets/beast-sheet-ci.mjs"), "--local"], { cwd: ROOT, encoding: "utf8" });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /LỖI: zz_test_971\/toA/);
    assert.match(r.stderr, /948×1659/);
    assert.match(r.stderr, /1024×1536/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("changedFromFiles (#972): turnaround.png kích hoạt loài; candidates/*.png thì không", () => {
  const r = changedFromFiles(["art/src/beast-anim/bang_vu_ung/turnaround.png", "art/src/beast-anim/liet_hoa_tich_dich/candidates/A82A2.png"]);
  assert.deepEqual(r.species, ["bang_vu_ung"]);
});
