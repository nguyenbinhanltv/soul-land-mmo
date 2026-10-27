import test from "node:test";
import assert from "node:assert/strict";
import { clientEntry, upsert } from "./phuthe-import.mjs";

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
