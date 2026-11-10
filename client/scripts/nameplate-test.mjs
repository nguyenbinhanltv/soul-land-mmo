import assert from "node:assert/strict";
import { NAMEPLATE_FADED_ALPHA, easeNameplate, layoutNameplates, measureNameplate, nameplateAppearance, nameplatePriority, nameplatesOverlap, playerNameplateKind, resolveQuestMarker } from "../src/nameplate.ts";

const measured = measureNameplate([{ width: 128, height: 22 }, { width: 162, height: 18 }, { width: 24, height: 34 }], 4);
assert.deepEqual(measured, { width: 162, height: 82, offsets: [0, 26, 48] }, "đo gồm cả chữ dài, viền và dấu nhiệm vụ cao");

const R = (id, x, y, priority, extra = {}) => ({ id, x, y, width: 60, height: 16, priority, compactSize: { width: 40, height: 10 }, ...extra });
const at = (items, opt = {}) => Object.fromEntries(layoutNameplates(items, { gap: 3, ...opt }).map((p) => [p.id, p]));

// Luật 1: nhãn luôn đúng chỗ gốc trên đầu chủ (không dời ngang, không nhấc), dù bị đè.
{
  const out = at([R("a", 100, 100, 100), R("b", 100, 100, 50), R("c", 110, 104, 20)], { now: 0 });
  for (const [id, x, y] of [["a", 100, 100], ["b", 100, 100], ["c", 110, 104]]) {
    assert.equal(out[id].x, x, `${id} không dời ngang`);
    assert.ok(Math.abs(out[id].y + out[id].height / 2 - (y + 8)) < 1e-9 || out[id].compact, `${id} giữ đáy nhãn trên đầu`);
    assert.equal(out[id].slot.up, 0, `${id} không nhấc lên`);
  }
  assert.equal(out.a.alpha, 1); assert.equal(out.a.compact, false, "nhãn ưu tiên cao nhất giữ nguyên");
  assert.ok(out.b.compact && out.b.alpha === 1 || out.b.alpha < 1, "nhãn thấp hơn bị đè thì thu gọn hoặc mờ");
  assert.equal(out.c.alpha, NAMEPLATE_FADED_ALPHA, "nhãn thấp nhất không còn chỗ thu gọn thì mờ");
}
// Luật 2: chính mình / mục tiêu (pinned) không bao giờ dời, thu gọn, mờ hay ẩn, kể cả khi ưu tiên thấp hơn và đông quá maxVisible.
{
  const crowd = Array.from({ length: 41 }, (_, i) => R(`p${i}`, 422, 180, nameplatePriority(false, i < 7, false)));
  const items = [...crowd, R("me", 422, 180, 1, { pinned: true }), R("sel", 422, 180, 1, { pinned: true })];
  const placed = layoutNameplates(items, { maxVisible: 18 });
  for (const id of ["me", "sel"]) {
    const p = placed.find((x) => x.id === id);
    assert.ok(p.visible && !p.compact && p.alpha === 1 && p.x === 422 && p.slot.up === 0, `${id} luôn hiện đủ đúng chỗ`);
  }
  const shown = placed.filter((p) => p.visible && !["me", "sel"].includes(p.id));
  assert.ok(shown.length <= 18, "giữ maxVisible cho nhãn thường");
  assert.ok(shown.every((p) => p.x === 422), "không nhãn nào dời ngang");
  assert.ok(placed.filter((p) => !p.visible).length > 0, "đông thì ẩn nhãn thừa");
  assert.deepEqual(layoutNameplates(items, { maxVisible: 18 }), placed, "layout ổn định giữa hai khung đứng yên");
}
// Luật 3: nhãn mờ không cản nhãn khác; nhãn ưu tiên cao hơn không bị ảnh hưởng bởi nhãn thấp.
{
  const out = at([R("hi", 0, 0, 100), R("mid", 0, 0, 50), R("lo", 0, 0, 10)]);
  assert.equal(out.hi.alpha, 1); assert.ok(out.hi.x === 0 && !out.hi.compact);
  assert.ok(out.mid.compact || out.mid.alpha < 1);
  const far = at([R("hi", 0, 0, 100), R("lo", 500, 0, 10)]);
  assert.ok(!far.lo.compact && far.lo.alpha === 1, "không đè nhau thì cả hai đủ");
}
// Trễ chống nhấp nháy: đè thoáng qua không đổi dạng; đè đủ settle mới thu gọn; hết đè đủ hold mới trả lại.
{
  let prev = new Map(), t = 0, changes = 0, last = "01";
  const step = (overlap) => {
    const out = layoutNameplates([R("a", 0, 0, 100), R("b", overlap ? 20 : 300, 0, 10)], { gap: 3, prev, now: t });
    t += 16;
    prev = new Map(out.filter((p) => p.visible && p.slot).map((p) => [p.id, p.slot]));
    const b = out.find((p) => p.id === "b"), key = `${b.compact ? 1 : 0}${b.alpha}`;
    if (key !== last) changes++; last = key; return b;
  };
  step(false);
  for (let i = 0; i < 40; i++) step(i % 2 === 0); // đè chớp từng khung
  assert.equal(changes, 0, "đè chớp nhoáng không làm nhãn đổi dạng");
  for (let i = 0; i < 30; i++) step(true); // đè liên tục ~480 ms > settle
  assert.ok(last !== "01", "đè liên tục đủ lâu thì thu gọn / mờ");
  const bad = changes;
  for (let i = 0; i < 10; i++) step(false); // hết đè ~160 ms < hold
  assert.equal(changes, bad, "vừa hết đè chưa đủ hold thì chưa trả lại");
  for (let i = 0; i < 40; i++) step(false);
  assert.equal(last, "01", "hết đè đủ lâu thì về nhãn đủ");
}
// Đi qua nhau: nhãn người đi chỉ ở đúng đầu mình mọi khung (x khớp đầu, không nhảy ngang), kể cả khi cắt qua hồn thú và người khác.
{
  let prev = new Map(), maxJump = 0, lastX = null;
  for (let f = 0; f < 600; f++) {
    const now = f * 16.7, hx = 100 + f * 1.5;
    const items = [R("me", hx, 100, 100, { pinned: true }), R("beast", 300 + Math.sin(f / 40) * 80, 100, 20), R("other", 250 + f * 0.7, 98, 40)];
    const out = layoutNameplates(items, { gap: 3, prev, now });
    prev = new Map(out.filter((p) => p.visible && p.slot).map((p) => [p.id, p.slot]));
    for (const p of out) { const it = items.find((q) => q.id === p.id); assert.equal(p.x, it.x, `${p.id} đúng đầu chủ`); assert.equal(p.slot.up, 0); }
    const me = out.find((p) => p.id === "me");
    if (lastX !== null) maxJump = Math.max(maxJump, Math.abs(me.x - lastX));
    lastX = me.x;
  }
  assert.ok(maxJump <= 1.6, `nhãn mình chỉ đi theo đầu (bước lớn nhất ${maxJump})`);
}
// Nhãn mờ nằm dưới nhãn ghim / nhãn có bảng danh hiệu thì ẩn hẳn (không lộ sau bảng).
{
  const out = at([R("me", 0, 0, 100, { pinned: true }), R("a", 0, 0, 50), R("b", 5, 0, 40), R("c", 10, 0, 30)]);
  assert.equal(out.c.alpha, 0, "nhãn mờ dưới nhãn ghim ẩn hẳn");
  const plated = at([R("p", 0, 0, 100, { plated: true }), R("a", 0, 0, 50), R("b", 5, 0, 40), R("n", 40, 0, 30)]);
  assert.equal(plated.b.alpha, 0, "nhãn mờ dưới bảng danh hiệu ẩn hẳn");
  const free = at([R("a", 0, 0, 100), R("b", 0, 0, 50), R("c", 5, 0, 30)]);
  assert.equal(free.c.alpha, NAMEPLATE_FADED_ALPHA, "chỉ bị nhãn thường đè thì vẫn mờ");
}
// Nhóm đứng yên (NPC / biển) được chồng dọc, cố định theo khung; thực thể đang chạy không bao giờ nhấc.
{
  const items = [R("npc1", 100, 100, 60, { stationary: true }), R("sign", 100, 100, 10, { stationary: true }), R("runner", 100, 100, 20)];
  const out = at(items, { maxOffset: 64 });
  assert.equal(out.npc1.slot.up, 0);
  assert.ok(out.sign.slot.up > 0 && out.sign.alpha === 1, "biển đứng yên xếp dọc lên trên NPC");
  assert.ok(!nameplatesOverlap(out.npc1, out.sign, 3), "hai nhãn đứng yên không chồng");
  assert.equal(out.runner.slot.up, 0, "thực thể chạy không nhấc");
  assert.deepEqual(at(items, { maxOffset: 64, now: 50 }), out, "xếp dọc ổn định theo khung");
}
// easeNameplate: đuổi mượt, không vượt đích, hiện ngay khi chưa có chỗ cũ / bỏ khung lâu.
{
  assert.equal(easeNameplate(undefined, 50, 16), 50);
  assert.equal(easeNameplate(0, 112, 1e9), 112, "bỏ khung lâu (tab ẩn) thì về đích ngay");
  let x = 0;
  for (let i = 0; i < 30; i++) { x = easeNameplate(x, 112, 16.7); assert.ok(x <= 112, "không vượt đích"); }
  assert.ok(112 - x < 5, "tới đích sau ~30 khung");
}
assert.equal(nameplatePriority(true, false, false) > nameplatePriority(false, true, false), true);
assert.equal(playerNameplateKind("foe", "me", false, ["me,mate", "foe"]), "pk");
assert.equal(playerNameplateKind("mate", "me", false, ["me,mate", "foe"]), "party");
assert.equal(playerNameplateKind("stranger", "me", false), "player", "ngoài đấu trường không tự đặt PK");
assert.equal(resolveQuestMarker(["offer", "active", "ready"]).symbol, "?");
assert.equal(resolveQuestMarker(["active", "offer"]).symbol, "!");
assert.equal(resolveQuestMarker(["done"]), null);
assert.equal(resolveQuestMarker([]), null, "chưa nhận dữ liệu không hiện dấu");
assert.notEqual(resolveQuestMarker(["active"]).color, resolveQuestMarker(["ready"]).color);

const ranks = ["beast", "elite", "king", "boss", "pk"].map(nameplateAppearance);
assert.deepEqual(ranks.map((x) => x.color), ["#e9e1d0", "#ffc24a", "#c58cff", "#ff7168", "#ff766a"], "mỗi bậc có màu nhãn riêng");

console.log("nameplate: đạt");
