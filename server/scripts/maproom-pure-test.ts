// Kiểm thử hàm thuần tách khỏi MapRoom (#702): nhãn ô vật phẩm, đếm mảnh, cộng tiến độ nhiệm vụ.
// Chạy: npm run test:maproom-pure --prefix server
import assert from "node:assert/strict";
import { itemLabel, shardCount } from "../src/rooms/items.ts";
import { questBump } from "../src/rooms/questBump.ts";
import { QUEST_STARTER, questStart, questChain, itemDef, ITEMS } from "../../shared/data.ts";
import type { Item } from "../src/db.ts";

function test(title: string, fn: () => void) { fn(); console.log(`✓ ${title}`); }
const mk = (code: string, o: Partial<Item> = {}): Item => ({ id: "x", kind: "", code, qty: 1, years: null, stars: null, enhance: 0, stats: null, vohonId: null, created: 0, ...o });

test("itemLabel: đồ gộp được ghi số lượng, một món ghi tên, mã lạ có tên dự phòng", () => {
  const def = ITEMS[0];
  assert.equal(itemLabel(mk(def.id)), def.name);
  assert.equal(itemLabel(mk(def.id, { qty: 3 })), `3 ${def.name}`);
  assert.equal(itemLabel(mk("khong_co_ma_nay")), "vật phẩm lạ");
});

test("shardCount: chỉ cộng ô cùng mã và không gắn võ hồn", () => {
  const bag = [mk("a", { qty: 2 }), mk("a", { qty: 5, vohonId: 1 }), mk("b", { qty: 7 }), mk("a", { qty: 4 })];
  assert.equal(shardCount(bag, "a"), 6);
  assert.equal(shardCount(bag, "zz"), 0);
});

test("questBump: chưa nhận thì không đếm; khớp thì hit; đủ mục tiêu thì ready", () => {
  const q = questStart(QUEST_STARTER);
  const g = questChain(QUEST_STARTER)!.steps[0].goals[0];
  const ev = { k: g.k, npc: g.npc, map: g.map, zone: g.zone };
  assert.equal(questBump(q, ev), null);
  q.accepted = true;
  assert.equal(questBump(q, { k: g.k, npc: "khong_phai" }), null);
  let last: string | null = null;
  for (let i = 0; i < g.n; i++) last = questBump(q, ev);
  assert.equal(last, "ready");
  assert.equal(questBump(q, ev), null, "đã đủ thì không đếm thêm");
});
