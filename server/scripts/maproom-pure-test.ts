// Kiểm thử hàm thuần tách khỏi MapRoom (#702): nhãn ô vật phẩm, đếm mảnh, cộng tiến độ nhiệm vụ.
// Chạy: npm run test:maproom-pure --prefix server
import assert from "node:assert/strict";
import { itemLabel, shardCount } from "../src/rooms/items.ts";
import { coreSetNoteOf, beastDmgOf, buffMask, contribOf, contributors, pickNearest, pickWeakest, fxPoint, spawnPointIn, dashPath, dashAim, progressFor, giveCandidates, addGearBonus, regenStep } from "../src/rooms/calc.ts";
import { questBump } from "../src/rooms/questBump.ts";
import { CORE_STAT_IDS, CORE_SETS, CORE_SET_2, CORE_SET_4, ELITE_RAGE, WORLD, SUPPORT_CONTRIB, QUEST_STARTER, questStart, questChain, itemDef, ITEMS } from "../../shared/data.ts";
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

test("coreSetNoteOf: chỉ báo khi đúng 2 hoặc 4 món của bộ có thật", () => {
  const cs = CORE_SETS[0];
  assert.equal(coreSetNoteOf(1, cs.id), "");
  assert.equal(coreSetNoteOf(3, cs.id), "");
  assert.equal(coreSetNoteOf(CORE_SET_2, cs.id), ` Kích hoạt bộ ${cs.name} 2 món: ${cs.set2}.`);
  assert.equal(coreSetNoteOf(CORE_SET_4, cs.id), ` Kích hoạt bộ ${cs.name} 4 món: ${cs.set4}.`);
  assert.equal(coreSetNoteOf(CORE_SET_2, "bo_la"), "");
});

test("beastDmgOf: Cuồng nộ và boss thế giới nổi giận nhân lên, không thì giữ nguyên", () => {
  assert.equal(beastDmgOf(100, false, false), 100);
  assert.equal(beastDmgOf(100, true, false), 100 * (1 + ELITE_RAGE.dmg));
  assert.equal(beastDmgOf(100, false, true), 100 * WORLD.rageDmg);
  assert.equal(beastDmgOf(100, true, true), 100 * (1 + ELITE_RAGE.dmg) * WORLD.rageDmg);
});

test("buffMask: hợp các bit, rỗng = 0", () => {
  assert.equal(buffMask([], () => 1), 0);
  assert.equal(buffMask(["a", "b", "a"], (k) => (k === "a" ? 1 : 4)), 5);
});

test("contribOf / contributors: hỗ trợ nhân SUPPORT_CONTRIB, người ở cả hai bảng chỉ tính một lần", () => {
  const dmg = new Map([["x", 10], ["y", 5]]), sup = new Map([["y", 2], ["z", 1]]);
  assert.equal(contribOf(dmg, sup, "x"), 10);
  assert.equal(contribOf(dmg, sup, "y"), 5 + 2 * SUPPORT_CONTRIB);
  assert.equal(contribOf(dmg, sup, "z"), SUPPORT_CONTRIB);
  assert.equal(contribOf(dmg, sup, "q"), 0);
  assert.deepEqual(contributors(dmg, sup).sort(), ["x", "y", "z"]);
});

test("pickNearest: con gần nhất trong bán kính, ngoài bán kính thì không chọn", () => {
  const me = { x: 0, y: 0 };
  assert.equal(pickNearest(me, 100, [["a", { x: 50, y: 0 }], ["b", { x: 20, y: 0 }], ["c", { x: 200, y: 0 }]]), "b");
  assert.equal(pickNearest(me, 10, [["a", { x: 50, y: 0 }]]), undefined);
  assert.equal(pickNearest(me, 100, []), undefined);
});

test("pickWeakest: tỉ lệ máu thấp nhất, hoà thì con gần hơn", () => {
  const me = { x: 0, y: 0 }, b = (x: number, hp: number) => ({ x, y: 0, hp, maxHp: 100 });
  assert.equal(pickWeakest(me, 100, [["a", b(10, 80)], ["b", b(50, 20)], ["c", b(30, 50)]]), "b");
  assert.equal(pickWeakest(me, 100, [["far", b(60, 30)], ["near", b(20, 30)]]), "near");
  assert.equal(pickWeakest(me, 100, [["out", b(150, 1)]]), undefined);
});

test("fxPoint: ưu tiên (x,y), rồi (x1,y1), rồi người chơi, rồi hồn thú", () => {
  const pl = (id: string) => (id === "p1" ? { x: 1, y: 2 } : undefined), bs = (id: string) => (id === "b1" ? { x: 3, y: 4 } : undefined);
  assert.deepEqual(fxPoint({ x: 9, y: 8, id: "p1" }, pl, bs), { x: 9, y: 8 });
  assert.deepEqual(fxPoint({ x: NaN, y: 8, x1: 5, y1: 6 }, pl, bs), { x: 5, y: 6 });
  assert.deepEqual(fxPoint({ id: "p1" }, pl, bs), { x: 1, y: 2 });
  assert.deepEqual(fxPoint({ to: "p1" }, pl, bs), { x: 1, y: 2 });
  assert.deepEqual(fxPoint({ bid: "b1" }, pl, bs), { x: 3, y: 4 });
  assert.equal(fxPoint({ id: "zz" }, pl, bs), null);
});

test("spawnPointIn: trong ô trừ lề, né vật cản, hết 30 lần thì lấy tâm", () => {
  const sp = { x: 100, y: 200, w: 40, h: 60 };
  assert.deepEqual(spawnPointIn(sp, () => false, () => 0), { x: 108, y: 208 });
  let n = 0;
  assert.deepEqual(spawnPointIn(sp, () => ++n <= 2, () => 1), { x: 132, y: 252 });
  assert.equal(n, 3);
  assert.deepEqual(spawnPointIn(sp, () => true, () => 0.5), { x: 120, y: 230 });
});

test("dashPath: lướt đủ quãng, dừng trước vật cản, quãng 0 thì đứng yên", () => {
  assert.deepEqual(dashPath(0, 0, { x: 1, y: 0 }, 10, () => false), { x: 10, y: 0, moved: 10 });
  assert.deepEqual(dashPath(0, 0, { x: 1, y: 0 }, 10, (x) => x >= 6), { x: 4, y: 0, moved: 4 });
  assert.deepEqual(dashPath(5, 5, { x: 0, y: 1 }, 0, () => false), { x: 5, y: 5, moved: 0 });
});

test("dashAim: hướng đơn vị, quãng chừa nửa cỡ mục tiêu + 8, không âm", () => {
  const a = dashAim({ x: 0, y: 0 }, { x: 100, y: 0 }, 500, 20);
  assert.deepEqual(a, { dir: { x: 1, y: 0 }, dist: 82 });
  assert.equal(dashAim({ x: 0, y: 0 }, { x: 100, y: 0 }, 30, 20).dist, 30);
  assert.equal(dashAim({ x: 0, y: 0 }, { x: 5, y: 0 }, 30, 20).dist, 0);
  assert.deepEqual(dashAim({ x: 3, y: 3 }, { x: 3, y: 3 }, 30, 0).dir, { x: 0, y: 0 });
});

test("progressFor: lấy dòng đã lưu theo mã, thiếu thì questStart", () => {
  const saved = [{ ...questStart("b"), accepted: true }];
  const r = progressFor(["a", "b"], saved);
  assert.deepEqual(r[0], questStart("a"));
  assert.equal(r[1].accepted, true);
  assert.deepEqual(progressFor(["a"], undefined), [questStart("a")]);
});

test("giveCandidates: bỏ ô gắn võ hồn / đã cường hóa / đang hấp thụ, rẻ trước", () => {
  const it = ITEMS.find((i) => i.kind === "hon_hoan" || i.kind === "hoan") ?? ITEMS[0];
  const bag = [mk(it.id, { id: "1", years: 1000 }), mk(it.id, { id: "2", years: 10 }), mk(it.id, { id: "3", vohonId: 5 }), mk(it.id, { id: "4", enhance: 1 }), mk(it.id, { id: "5" }), mk("khac", { id: "6" })];
  const ids = giveCandidates(bag, it.id, "5").map((i) => i.id);
  assert.ok(!ids.some((x) => ["3", "4", "5", "6"].includes(x)));
  assert.deepEqual([...ids].sort(), ["1", "2"]);
});

test("addGearBonus: cộng từng chỉ số, làm tròn 0,1, không sửa bảng gốc", () => {
  const z = () => Object.fromEntries(CORE_STAT_IDS.map((k) => [k, 0])) as Record<(typeof CORE_STAT_IDS)[number], number>;
  const b = z(), g = z(); b[CORE_STAT_IDS[0]] = 0.1; g[CORE_STAT_IDS[0]] = 0.2;
  const r = addGearBonus(b, g);
  assert.equal(r[CORE_STAT_IDS[0]], 0.3);
  assert.equal(b[CORE_STAT_IDS[0]], 0.1);
});

test("regenStep: đầy / chết thì xoá phần dư; hồi chỉ cộng phần nguyên, kẹp ở maxHp", () => {
  const bd = { regen: 5 };
  regenStep({ hp: 100, maxHp: 100 }, bd, 1, 0.1, 1); assert.equal(bd.regen, 0);
  const b = { hp: 50, maxHp: 100 };
  regenStep(b, bd, 1, 0.025, 1); assert.deepEqual([b.hp, bd.regen], [52, 0.5]);
  regenStep(b, bd, 0.5, 0.025, 1); assert.deepEqual([b.hp, bd.regen], [53, 0.75]);
  const c = { hp: 99, maxHp: 100 }; regenStep(c, { regen: 0 }, 1, 0.1, 1); assert.equal(c.hp, 100);
});
