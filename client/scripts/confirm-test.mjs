// Hộp xác nhận chung + khóa chống bấm đôi (confirmDialog.ts): hàm thuần và đối chiếu nơi gọi.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { guardOnce, lockButton, LOCK_MS } from "../src/confirmDialog.ts";

// guardOnce: lần gọi thứ hai trong LOCK_MS bị bỏ, sau đó chạy lại
let t = 0, n = 0; const g = guardOnce(() => { n++; }, LOCK_MS, () => t);
g(); g(); assert.equal(n, 1, "gọi đôi chỉ chạy một lần");
t = LOCK_MS - 1; g(); assert.equal(n, 1);
t = LOCK_MS; g(); assert.equal(n, 2, "hết thời gian khóa thì chạy lại");

// lockButton: khóa ngay, lần bấm thứ hai bị từ chối (giả nút tối thiểu)
const cls = new Set(), btn = { disabled: false, dataset: {}, classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c) } };
assert.equal(lockButton(btn, 5), true); assert.equal(btn.disabled, true); assert.ok(cls.has("busy"));
assert.equal(lockButton(btn, 5), false, "đang khóa thì từ chối");
await new Promise((r) => setTimeout(r, 20));
assert.equal(btn.disabled, false); assert.ok(!cls.has("busy"));

// nơi gọi: mọi hành động mất đồ đi qua confirmDialog, không gửi thẳng
const src = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
assert.match(src("hudBag.ts"), /a === "salvage"\) confirmDialog\(/, "Phân giải ở thẻ thao tác phải xác nhận");
assert.match(src("hudForge.ts"), /confirmDialog\([\s\S]{0,300}act\.equipSalvage/, "Phân giải ở lò rèn phải xác nhận");
assert.match(src("hudShop.ts"), /if \(ask\) confirmDialog\(/, "bán món hiếm / có giá trị phải xác nhận");
assert.match(src("hud.ts"), /confirmDialog\([^)]*Rời tổ đội/, "rời đội phải xác nhận");
assert.match(readFileSync(new URL("../src/main.ts", import.meta.url), "utf8"), /confirm\.css/);
console.log("confirm: ok");
