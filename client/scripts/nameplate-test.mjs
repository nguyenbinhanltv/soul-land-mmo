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
