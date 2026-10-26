import assert from "node:assert/strict";
import { readPng } from "../../tools/assets/lib.mjs";

const mod = await import("../src/contextCursor.ts").catch((e) => {
  if (e.code === "ERR_MODULE_NOT_FOUND") return {};
  throw e;
});
assert.equal(typeof mod.resolveCursor, "function", "C12 cần bộ chọn cursor chỉ hiển thị");
const { resolveCursor, pickupHintAllowed, cursorStyle, ContextCursor } = mod;
assert.equal(resolveCursor({ enabled: true }), "default");
assert.equal(resolveCursor({ enabled: true, blocked: true }), "blocked");
assert.equal(resolveCursor({ enabled: true, blocked: true, loot: true }), "pickup");
assert.equal(resolveCursor({ enabled: true, loot: true, beast: true }), "attack");
assert.equal(resolveCursor({ enabled: true, beast: true, npc: true }), "talk");
assert.equal(resolveCursor({ enabled: true, beast: true, native: true }), "native", "vùng tương tác cũ không bị cursor quái ghi đè");
assert.equal(resolveCursor({ enabled: false, npc: true, blocked: true }), "default", "chết/xem trận/thiếu state không gợi ý hành động");
assert.equal(resolveCursor({ enabled: true, loot: undefined }), "default");
assert.equal(resolveCursor({ enabled: true, drop: true, loot: undefined, blocked: true }), "default", "chưa biết quyền đồ rơi không được biến thành báo nền bị chặn");
assert.equal(resolveCursor({ enabled: true, drop: true, loot: false, blocked: true }), "default", "đồ bị giữ quyền/ngoài tầm vẫn giữ cursor thường");

const drop = { owner: "other", ownerTtl: 10, party: 7 };
assert.equal(pickupHintAllowed(drop, "me", 7), true);
assert.equal(pickupHintAllowed(drop, "me", 0), false);
assert.equal(pickupHintAllowed({ ...drop, ownerTtl: 0 }, "me", 0), true);
assert.equal(pickupHintAllowed({ ...drop, owner: "me" }, "me", 0), true);
assert.equal(pickupHintAllowed({ ...drop, owner: "" }, "me", 0), true);
for (const incomplete of [{}, { owner: "me" }, { ...drop, ownerTtl: NaN }, { ...drop, party: undefined }]) {
  assert.equal(pickupHintAllowed(incomplete, "me", 7), false, "thiếu dữ liệu quyền thì không tự suy đoán nhặt được");
}
const one = cursorStyle("attack", "https://example.test/choi/", false);
assert.match(one, /cursor_attack_32\.png[^ ]*"\) 2 2, crosshair$/);
const two = cursorStyle("talk", "https://example.test/choi/", true);
assert.match(two, /image-set\(.*cursor_talk_32.*1x.*cursor_talk_64.*2x/);
assert.match(two, /\) 2 2, url\(.*\) 2 2, pointer$/);

// DOM tối thiểu cho lifecycle: event thật, không có Phaser hay tin mạng.
const win = new EventTarget(), doc = new EventTarget(), canvas = new EventTarget();
win.CSS = { supports: () => true };
doc.defaultView = win; doc.baseURI = "https://example.test/choi/"; doc.visibilityState = "visible";
doc.elementFromPoint = () => canvas;
const values = new Map([["cursor", "crosshair"]]);
let writes = 0;
canvas.ownerDocument = doc;
canvas.style = {
  getPropertyValue: (k) => values.get(k) ?? "", getPropertyPriority: () => "",
  setProperty: (k, v) => { writes++; values.set(k, v.replaceAll(" 1x", " 1dppx").replaceAll(" 2x", " 2dppx")); }, removeProperty: (k) => values.delete(k),
};
const pointer = (type, pointerType = "mouse") => {
  const e = new Event(type); Object.assign(e, { pointerType, clientX: 10, clientY: 10 }); return e;
};
const c = new ContextCursor(canvas);
c.show("attack"); assert.equal(values.get("cursor"), "crosshair", "chưa có chuột thì không áp cursor ảnh");
canvas.dispatchEvent(pointer("pointermove")); c.show("attack");
assert.match(values.get("cursor"), /cursor_attack_32/);
const stableWrites = writes; c.show("attack");
assert.equal(writes, stableWrites, "CSS chuẩn hóa image-set không làm ghi lại cursor mỗi frame");
win.dispatchEvent(new Event("blur")); assert.equal(values.get("cursor"), "crosshair");
canvas.dispatchEvent(pointer("pointermove")); c.show("pickup");
doc.elementFromPoint = () => ({}); c.show("attack");
assert.equal(values.get("cursor"), "crosshair", "overlay che canvas phải trả cursor cũ");
doc.elementFromPoint = () => canvas;
canvas.dispatchEvent(pointer("pointermove", "touch")); c.show("attack");
assert.equal(values.get("cursor"), "crosshair", "touch không ép cursor ảnh");
canvas.dispatchEvent(pointer("pointermove")); c.show("talk");
canvas.dispatchEvent(pointer("pointerleave")); assert.equal(values.get("cursor"), "crosshair");
canvas.dispatchEvent(pointer("pointermove")); c.show("blocked"); c.destroy();
canvas.dispatchEvent(pointer("pointermove")); c.show("attack");
assert.equal(values.get("cursor"), "crosshair", "shutdown bỏ listener và không bật lại cursor");
const shapes = new Set();
for (const kind of ["default", "attack", "talk", "pickup", "blocked"]) {
  const img = (n) => readPng(new URL(`../../shared/assets/sprites/iso/ui/cursor_${kind}_${n}.png`, import.meta.url));
  const small = img(32), large = img(64);
  assert.deepEqual([small.w, small.h, large.w, large.h], [32, 32, 64, 64]);
  shapes.add(Buffer.from(small.data).toString("base64"));
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const p = small.get(x, y);
    assert.ok(p[3] === 0 || p[3] === 255, "alpha pixel không mờ");
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) assert.deepEqual(large.get(x * 2 + dx, y * 2 + dy), p, "DPR2 giữ cụm pixel cùng hotspot logic");
  }
}
assert.equal(shapes.size, 5, "5 ngữ cảnh có hình khác nhau");
console.log("contextcursor: đạt (ưu tiên, thiếu dữ liệu, hotspot/DPI, touch/overlay/blur/leave/shutdown)");
