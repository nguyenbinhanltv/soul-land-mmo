import assert from "node:assert/strict";
import { stackNameplate } from "../src/nameplate.ts";

const player = stackNameplate(["faction", "name", "title"]);
assert.deepEqual(player, { faction: 0, name: 8, title: 16 });
assert.ok(player.title - player.name >= 8, "danh hiệu phải cách tên đủ xa");

const npc = stackNameplate(["name", "title", "action", "quest"]);
assert.deepEqual(npc, { name: 0, title: 8, action: 16, quest: 24 });
assert.ok(npc.quest - npc.action >= 8, "dấu nhiệm vụ phải cách nhãn thao tác đủ xa");

console.log("nameplate: đạt");
