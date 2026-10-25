import assert from "node:assert/strict";
import { layoutNameplates, nameplateAppearance, stackNameplate } from "../src/nameplate.ts";

const player = stackNameplate(["faction", "name", "title"]);
assert.deepEqual(player, { faction: 0, name: 8, title: 16 });
assert.ok(player.title - player.name >= 8, "danh hiệu phải cách tên đủ xa");

const npc = stackNameplate(["name", "title", "action", "quest"]);
assert.deepEqual(npc, { name: 0, title: 8, action: 16, quest: 24 });
assert.ok(npc.quest - npc.action >= 8, "dấu nhiệm vụ phải cách nhãn thao tác đủ xa");

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
assert.ok(Math.abs(selected.y - party.y) >= (selected.height + party.height) / 2 + 3, "hai khung nhãn không chồng nhau");

const ranks = ["beast", "elite", "king", "boss", "pk"].map(nameplateAppearance);
assert.deepEqual(ranks.map((x) => x.color), ["#e9e1d0", "#ffc24a", "#c58cff", "#ff7168", "#ff766a"], "mỗi bậc có màu nhãn riêng");

console.log("nameplate: đạt");
