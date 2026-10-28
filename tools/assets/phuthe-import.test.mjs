import test from "node:test";
import assert from "node:assert/strict";
import { clientEntry, upsert, nguonBlock, upsertNguon } from "./phuthe-import.mjs";
import { buildAnchors, animLayout } from "./phuthe-anchor.mjs";
import { DIRS } from "./phuthe-sheet-lib.mjs";
import { Img } from "./lib.mjs";

const cut = { key: "vhanim_x_b", frame: [96, 96], iso: true, anim: { group: "B", cols: 22, rows: 10, anims: { idle: { col: 0, n: 4 } }, origin: [48, 74] } };
const text = `{\n  "sprites": [\n    {\n      "key": "vh_x_f",\n      "iso": true\n    },\n    {\n      "key": "vh_y_b",\n      "iso": true\n    }\n  ]\n}`;

test("clientEntry đổi anims thành clips, bỏ trường công cụ", () => {
  const e = clientEntry(cut, false);
  assert.deepEqual(e, { key: "vhanim_x_b", iso: true, frame: [96, 96], anim: { cols: 22, clips: { idle: { col: 0, n: 4 } } } });
  assert.equal(clientEntry(cut, true).blank, true);
});

test("upsert: thêm sau mục chỉ định, chạy lại giữ nguyên, đổi thì cập nhật", () => {
  const e = clientEntry(cut, false), a = upsert(text, e, "vh_x_f");
  assert.equal(a.action, "mới");
  assert.ok(a.text.indexOf("vhanim_x_b") > a.text.indexOf("vh_x_f") && a.text.indexOf("vhanim_x_b") < a.text.indexOf("vh_y_b"));
  assert.doesNotThrow(() => JSON.parse(a.text));
  assert.equal(upsert(a.text, e, "vh_x_f").action, "giữ");
  assert.equal(upsert(a.text, { ...e, blank: true }, "vh_x_f").action, "cập nhật");
});

test("vhanimSize: rộng = cols × khung, cao = 10 × khung; cols hỏng thì [0, 0]", async () => {
  const { vhanimSize } = await import("./lib.mjs");
  assert.deepEqual(vhanimSize(96, 22), [2112, 960]);
  assert.deepEqual(vhanimSize(128, 13), [1664, 1280]);
  for (const bad of [0, -1, 2.5, undefined]) assert.deepEqual(vhanimSize(96, bad), [0, 0]);
});

test("clientEntry: dirsOk (nhập từng hướng) được giữ, đủ 5 hướng / thiếu trường thì không ghi (định dạng cũ)", () => {
  const part = { ...cut, anim: { ...cut.anim, dirsOk: ["s", "e"] } };
  assert.deepEqual(clientEntry(part, false).anim.dirsOk, ["s", "e"]);
  assert.equal("dirsOk" in clientEntry({ ...cut, anim: { ...cut.anim, dirsOk: [...DIRS] } }, false).anim, false);
  assert.equal("dirsOk" in clientEntry(cut, false).anim, false);
  assert.deepEqual(clientEntry(cut, false), { key: "vhanim_x_b", iso: true, frame: [96, 96], anim: { cols: 22, clips: { idle: { col: 0, n: 4 } } } }, "mục cũ không đổi một byte");
  // thêm hướng sau này → cập nhật; nhập đủ → bỏ trường
  const a = upsert(text, clientEntry(part, false), "vh_x_f");
  assert.equal(upsert(a.text, clientEntry(part, false), "vh_x_f").action, "giữ");
  assert.equal(upsert(a.text, clientEntry(cut, false), "vh_x_f").action, "cập nhật");
});

test("NGUON ghi từng hướng: khối có mốc, chạy lại không đổi, thay khối khi đổi hướng, giữ CRLF, nhập đủ thì ghi 'Đủ 5 hướng'", () => {
  const b = nguonBlock(["s", "e"]);
  assert.match(b, /\| se \(tờ B\) \| CHƯA nhập/); assert.match(b, /\| s \(tờ A\) \| đã nhập/); assert.match(b, /Nhập từng hướng: s, e\./);
  const once = upsertNguon("# NGUON\n\nnội dung\n", ["s", "e"]);
  assert.ok(once.startsWith("# NGUON\n\nnội dung\n\n") && once.includes(b));
  assert.equal(upsertNguon(once, ["s", "e"]), once, "chạy lại không đổi");
  const more = upsertNguon(once, ["s", "se", "e"]);
  assert.ok(more.includes("| se (tờ B) | đã nhập") && !more.includes("Nhập từng hướng: s, e."));
  assert.equal(more.match(/phuthe-import:huong -->/g).length, 2, "chỉ một khối");
  assert.match(upsertNguon(more, undefined), /Đủ 5 hướng\./);
  assert.ok(upsertNguon("a\r\nb\r\n", ["s"]).split("\r\n").length > 3 && !upsertNguon("a\r\nb\r\n", ["s"]).replace(/\r\n/g, "").includes("\n"));
});

test("neo (phuthe-anchor): hướng chưa nhập ghi neo đơn vị, hướng nhập đo như cũ", () => {
  const F = 96, im = new Img(22 * F, 10 * F);
  // khối đục 20×40 gần chân ở mọi khung của hướng s (hàng 0 và 5) và e (2 và 7)
  for (const row of [0, 5, 2, 7]) for (let c = 0; c < 4; c++) for (let y = 30; y < 70; y++) for (let x = 38; x < 58; x++) im.set(c * F + x, row * F + y, [200, 100, 50, 255]);
  const a = buildAnchors([im, null], animLayout("B", F), F, { dirsOk: ["s", "e"] });
  for (const sex of ["m", "f"]) for (const d of ["se", "ne", "n"]) assert.deepEqual([a[sex][d].dx, a[sex][d].dy, a[sex][d].scale], [0, 0, 1], `${sex}/${d}`);
  for (const sex of ["m", "f"]) for (const d of ["s", "e"]) assert.ok(a[sex][d].scale > 0 && Number.isFinite(a[sex][d].dx), `${sex}/${d} đo thật`);
});
