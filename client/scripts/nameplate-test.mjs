import assert from "node:assert/strict";
import { layoutNameplates, measureNameplate, nameplateAppearance, nameplatePriority, nameplatesOverlap, playerNameplateKind, resolveQuestMarker } from "../src/nameplate.ts";

const measured = measureNameplate([{ width: 128, height: 22 }, { width: 162, height: 18 }, { width: 24, height: 34 }], 4);
assert.deepEqual(measured, { width: 162, height: 82, offsets: [0, 26, 48] }, "đo gồm cả chữ dài, viền và dấu nhiệm vụ cao");

const crowded = layoutNameplates([
  { id: "selected", x: 100, y: 100, width: 80, height: 16, priority: 100 },
  { id: "party", x: 100, y: 100, width: 80, height: 16, priority: 80 },
  { id: "stranger", x: 100, y: 100, width: 80, height: 16, priority: 10 },
], { gap: 3, maxVisible: 2 });
const selected = crowded.find((x) => x.id === "selected");
const party = crowded.find((x) => x.id === "party");
assert.equal(selected.visible, true, "mục tiêu được ưu tiên giữ nhãn");
assert.equal(party.visible, true, "tổ đội được ưu tiên giữ nhãn");
assert.equal(crowded.find((x) => x.id === "stranger").visible, false, "nhãn người lạ bị ẩn khi đông");
assert.ok(!nameplatesOverlap(selected, party, 3), "hai khung nhãn không chồng nhau theo cả hai trục");

const viewport = { x: 0, y: 0, width: 844, height: 390 };
const body = { id: "body", x: 422, y: 240, width: 28, height: 60, priority: 0 };
const crowd = Array.from({ length: 41 }, (_, i) => ({
  id: `p${i}`, x: 422, y: 180, width: 180 + i % 3 * 16, height: 60,
  compactSize: { width: 120, height: 22 },
  priority: nameplatePriority(i === 40, i < 7, i === 7),
}));
const placed = layoutNameplates(crowd, { viewport, obstacles: [body], maxOffset: 128 });
const visible = placed.filter((p) => p.visible);
assert.ok(visible.length < 18 && visible.length >= 8, "41 người cùng chỗ: giữ nhóm quan trọng, ẩn nhãn thừa");
assert.ok(placed.find((p) => p.id === "p40").visible, "mục tiêu được chọn sau cùng vẫn có nhãn");
assert.ok(placed.filter((p) => Number(p.id.slice(1)) < 7).every((p) => p.visible), "giữ cả tổ đội khi đông");
for (let i = 0; i < visible.length; i++) {
  const a = visible[i];
  assert.ok(a.compact, "cảnh đông bỏ các dòng phụ");
  assert.ok(!nameplatesOverlap(a, body, 3), "nhãn không che thân");
  assert.ok(a.x - a.width / 2 >= 0 && a.x + a.width / 2 <= 844 && a.y - a.height / 2 >= 0, "nhãn không ra mép màn hình");
  for (const b of visible.slice(i + 1)) assert.ok(!nameplatesOverlap(a, b, 3), `${a.id} không chồng ${b.id}`);
}
assert.deepEqual(layoutNameplates(crowd, { viewport, obstacles: [body], maxOffset: 128 }), placed, "layout ổn định giữa hai khung đứng yên");
// #828: nhãn người đang đi không đổi chỗ qua lại khi bị đè chớp nhoáng; đổi chỗ chỉ khi bị đè thật, quay về sau khi chỗ gốc trống đủ `hold`.
{
  const me = (x, now, prev, others = []) => layoutNameplates([{ id: "me", x, y: 100, width: 60, height: 16, priority: 20 }, ...others],
    { gap: 3, now, prev, hold: 450 }).find((p) => p.id === "me");
  const other = (x) => ({ id: "a", x, y: 100, width: 60, height: 16, priority: 100 });
  let t = 0, prev = new Map(), shifted = 0, last = null;
  const step = (x, others) => {
    const p = me(x, t, prev, others); t += 16;
    prev = new Map([[p.id, p.slot]]);
    const off = [Math.round(p.x - x), Math.round(p.y - 100)].join();
    if (last !== null && off !== last) shifted++;
    last = off; return p;
  };
  step(0); assert.equal(last, "0,0", "chỗ gốc khi không bị đè");
  const first = step(10, [other(20)]);
  assert.notEqual(first.slot.dx + first.slot.up, 0, "bị đè thật thì đổi chỗ ngay");
  const moved = shifted;
  for (let i = 0; i < 20; i++) step(10 + i, i % 2 ? [] : [other(20 + i)]); // lúc đè lúc không, mỗi khung
  assert.equal(shifted, moved, "đè chớp nhoáng từng khung không làm nhãn quay đi quay lại");
  for (let i = 0; i < 40; i++) step(30, []); // trống liên tục hơn 450 ms
  assert.equal(last, "0,0", "chỗ gốc trống đủ lâu thì quay về");
  assert.equal(shifted, moved + 1, "chỉ đổi một lần khi quay về");
  const one = (now, prevSlot) => layoutNameplates([{ id: "me", x: 5, y: 100, width: 60, height: 16, priority: 20 }], { prev: new Map([["me", prevSlot]]), now })[0].slot;
  const waiting = one(1000, { dx: 0, up: 28, compact: false });
  assert.equal(waiting.up, 28, "chỗ cũ còn hợp lệ: giữ trong lúc chờ");
  assert.equal(one(1200, waiting).up, 28, "chưa đủ hold thì vẫn giữ");
  assert.equal(one(1500, waiting).up, 0, "đủ hold thì về chỗ gốc");
}
// #828: hồn thú (nhãn một dòng, thân là vật cản) và người chơi cùng đi ngang nhau: có nhớ chỗ thì số lần nhãn đổi chỗ giảm hẳn, không bao giờ chồng.
{
  const sim = (useMemory) => {
    let prev = new Map(), flips = 0; const last = new Map();
    for (let f = 0; f < 600; f++) {
      const now = f * 50, items = [], obstacles = [];
      for (let i = 0; i < 6; i++) { // 3 hồn thú + 3 người đi vòng, tốc độ / pha khác nhau
        const id = (i < 3 ? "beast:" : "player:") + i, x = 300 + Math.cos(f / (23 + i * 7) + i) * 90, y = 300 + Math.sin(f / (31 + i * 5) + i * 2) * 50;
        obstacles.push({ id: "b" + id, x, y: y - 20, width: i < 3 ? 40 : 28, height: 40, priority: 0 });
        items.push({ id, x, y: y - 48 - 7, width: i < 3 ? 70 : 60, height: i < 3 ? 14 : 26, priority: i < 3 ? 20 : i === 3 ? 100 : 20 });
      }
      const out = layoutNameplates(items, { gap: 4, maxOffset: 96, obstacles, prev: useMemory ? prev : undefined, now });
      prev = new Map(out.filter((p) => p.visible && p.slot).map((p) => [p.id, p.slot]));
      const vis = out.filter((p) => p.visible);
      for (let a = 0; a < vis.length; a++) for (let b = a + 1; b < vis.length; b++) assert.ok(!nameplatesOverlap(vis[a], vis[b], 4), "không chồng nhãn");
      for (const p of vis) { const it = items.find((q) => q.id === p.id), off = Math.round(p.x - it.x) + "," + Math.round(p.y - it.y); if (last.has(p.id) && last.get(p.id) !== off) flips++; last.set(p.id, off); }
    }
    return flips;
  };
  const without = sim(false), withMemory = sim(true);
  assert.ok(withMemory * 10 < without * 8, `giữ chỗ giảm ≥ 20% số lần đổi chỗ (không nhớ ${without}, có nhớ ${withMemory})`);
}
const impossible = layoutNameplates([{ ...crowd[0], width: 900, compactSize: undefined, priority: 120 }], { viewport });
assert.equal(impossible[0].visible, false, "hết chỗ thì ẩn, kể cả ưu tiên cao cũng không vẽ chồng");
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
