// Thành Tựu (docs/design/thanh-tuu.md mục 5.23, bước P1 + P2): hình dạng danh mục, bảng quan hệ trần thưởng (cân bằng) và `MemoryStore.achvGet / achvBump / achvClaim`
// (cùng luật với PgStore). Phần chạy trong phòng (tin `achv`, nhận đúp, túi đầy, hoàn khi lỗi) do bot thử (BOT_ONLY=achv).
// Chạy: npm run test:achv --prefix server
import assert from "node:assert/strict";
import { MemoryStore } from "../src/db.ts";
import { ACHV, ACHV_CAP, ACHV_COUNTERS, ACHV_GROUPS, ACHV_STATS, ARENA_SHARDS, AUTO_BONUS_MAX, BAG_SLOTS, AUTO_DAILY_SECS, AUTO_TOKEN, AUTO_TOKEN_SECS, CHECKIN, ITEMS, MAX_LEVEL, MAX_STARS, QUESTS,
  SHARD_BUY, VOHON, achvDef, achvReached, achvReady } from "../../shared/data.ts";
import { achvGives, achvStats } from "../src/rooms/achv.ts";

function test(title: string, fn: () => void | Promise<void>) { return Promise.resolve(fn()).then(() => console.log(`✓ ${title}`)); }
const sum = (f: (r: (typeof ACHV)[number]["reward"]) => number) => ACHV.reduce((a, x) => a + f(x.reward), 0);

await test("ACHV: hình dạng (mã duy nhất, nhóm / chỉ số hợp lệ, ngưỡng nguyên dương tăng dần trong cùng chỉ số, trong phạm vi nguồn)", () => {
  assert.equal(new Set(ACHV.map((a) => a.id)).size, ACHV.length, "mã duy nhất");
  const groups = new Set<string>(ACHV_GROUPS.map((g) => g.code));
  for (const a of ACHV) {
    assert.ok(groups.has(a.group), `${a.id}: nhóm ${a.group}`); assert.ok((ACHV_STATS as readonly string[]).includes(a.stat), `${a.id}: chỉ số ${a.stat}`);
    assert.ok(Number.isInteger(a.need) && a.need > 0, `${a.id}: ngưỡng`); assert.ok(a.name.length > 0 && !a.name.includes("{n}"));
    assert.ok(!!(a.reward.honTe || a.reward.shards || a.reward.items?.length), `${a.id}: có thưởng`);
  }
  for (const stat of ACHV_STATS) {
    const needs = ACHV.filter((a) => a.stat === stat).map((a) => a.need);
    assert.ok(needs.length > 0, `chỉ số ${stat} có thành tựu`); assert.ok(needs.every((n, i) => i === 0 || n > needs[i - 1]), `${stat}: ngưỡng tăng dần`);
  }
  const top = (stat: string) => Math.max(...ACHV.filter((a) => a.stat === stat).map((a) => a.need));
  assert.ok(top("level") <= MAX_LEVEL && top("owned") <= VOHON.length && top("stars") <= MAX_STARS && top("quests") <= QUESTS.length, "ngưỡng cao nhất không vượt nguồn");
  assert.ok(ACHV.some((a) => a.stat === "owned" && a.need === VOHON.length), "mốc sưu tầm cuối = đủ VOHON");
});
await test("Quan hệ trần TỔNG thưởng (cả danh mục): Hồn Tệ, mảnh, Ủy Thác Lệnh, loại quà", () => {
  assert.ok(sum((r) => r.honTe ?? 0) <= ACHV_CAP.honTeK * CHECKIN.cycleCap.honTe, `Hồn Tệ ${sum((r) => r.honTe ?? 0)} ≤ ${ACHV_CAP.honTeK} × cycleCap`);
  assert.ok(sum((r) => r.shards ?? 0) <= ACHV_CAP.shardsK * SHARD_BUY.daily, "mảnh ≤ shardsK × hạn mức mua một ngày");
  assert.ok(ARENA_SHARDS.length > 0, "mảnh chỉ bốc trong ARENA_SHARDS (SR / SSR, không UR)");
  const tokens = sum((r) => (r.items ?? []).filter((x) => x.code === AUTO_TOKEN).reduce((a, x) => a + x.qty, 0));
  assert.ok(tokens * AUTO_TOKEN_SECS <= ACHV_CAP.autoK * AUTO_DAILY_SECS && tokens * AUTO_TOKEN_SECS <= AUTO_BONUS_MAX, "Ủy Thác Lệnh: tổng giờ ≤ autoK × AUTO_DAILY_SECS và AUTO_BONUS_MAX");
  for (const a of ACHV) for (const x of a.reward.items ?? []) {
    assert.ok(ITEMS.some((i) => i.id === x.code), `${x.code} có trong ITEMS`); assert.equal(x.code, AUTO_TOKEN, `${a.id}: chỉ Ủy Thác Lệnh (không hồn hoàn / cốt / hạch / trang bị)`);
    assert.ok(Number.isInteger(x.qty) && x.qty > 0);
  }
  for (const a of ACHV) { const r = a.reward; assert.ok(Number.isInteger(r.honTe ?? 0) && Number.isInteger(r.shards ?? 0), `${a.id}: số nguyên`); }
});
await test("Thưởng tăng dần theo bậc trong cùng chỉ số", () => {
  const val = (a: (typeof ACHV)[number]) => (a.reward.honTe ?? 0) + (a.reward.shards ?? 0) * SHARD_BUY.base + (a.reward.items?.length ?? 0) * 1000;
  for (const stat of ACHV_STATS) { const v = ACHV.filter((a) => a.stat === stat).map(val); assert.ok(v.every((x, i) => i === 0 || x >= v[i - 1]), `${stat}: thưởng không giảm`); }
});
await test("achvReached / achvReady / achvDef: ranh giới, thiếu chỉ số, mã lạ", () => {
  const def = achvDef("level_10")!;
  assert.equal(achvReached(def, { level: 9 }), false); assert.equal(achvReached(def, { level: 10 }), true); assert.equal(achvReached(def, {}), false);
  assert.equal(achvReady({ level: 20 }, []), 2); assert.equal(achvReady({ level: 20 }, ["level_10"]), 1); assert.equal(achvReady({}, []), 0);
  for (const x of [undefined, null, 1, "", "khong_co", {}]) assert.equal(achvDef(x), undefined);
});
await test("achvStats: cấp / sưu tầm / sao lấy cao nhất từ võ hồn đã nạp, chuỗi nhiệm vụ xong, bộ đếm thiếu = 0", () => {
  const ch = (level: number, stars: number) => ({ level, stars }), done = (chain: string) => ({ chain, step: QUESTS.find((c) => c.id === chain)!.steps.length, accepted: false, prog: [] });
  const d = { owned: [ch(12, 0), ch(40, 2), ch(7, 5)], quest: done(QUESTS[0].id), chains: [{ chain: QUESTS[1].id, step: 0, accepted: true, prog: [0] }, { chain: "la", step: 99, accepted: false, prog: [] }] } as never;
  assert.deepEqual(achvStats(d, { elite: 3 }, 4), { level: 40, owned: 3, stars: 5, quests: 1, arenaWins: 4, elite: 3, king: 0, world: 0, bicanh: 0 });
});
await test("achvGives: quà đúng bảng; mảnh luôn thuộc ARENA_SHARDS", () => {
  for (const a of ACHV) {
    const g = achvGives(a);
    assert.equal(g.honTe, a.reward.honTe ?? 0);
    assert.equal(g.gives.reduce((s, x) => s + x.qty, 0), (a.reward.shards ?? 0) + (a.reward.items ?? []).reduce((s, x) => s + x.qty, 0));
    for (const x of g.gives.slice((a.reward.items ?? []).length)) assert.ok(ARENA_SHARDS.some((id) => x.code.includes(id)), `${x.code} là mảnh SR / SSR`);
  }
});
await test("MemoryStore.achvBump / achvGet: upsert, chỉ tăng, mã / số lạ bị từ chối, bản sao", async () => {
  const s = new MemoryStore();
  assert.deepEqual(await s.achvGet(1), { claimed: [], counters: {} });
  await s.achvBump(1, "elite", 1); await s.achvBump(1, "elite", 2); await s.achvBump(1, "bicanh", 1);
  assert.deepEqual((await s.achvGet(1)).counters, { elite: 3, bicanh: 1 });
  for (const [k, n] of [["la", 1], ["elite", 0], ["elite", -1], ["elite", 1.5], ["elite", NaN], ["elite", 1e9]] as const) await assert.rejects(() => s.achvBump(1, k, n), `${k} ${n}`);
  const got = await s.achvGet(1); got.counters.elite = 99; got.claimed.push("x");
  assert.deepEqual(await s.achvGet(1), { claimed: [], counters: { elite: 3, bicanh: 1 } }, "bản sao, không sửa thẳng dữ liệu lưu");
  assert.ok(ACHV_COUNTERS.every((k) => ACHV.some((a) => a.stat === k)), "mỗi bộ đếm có thành tựu dùng");
});
await test("MemoryStore.achvClaim: nhận một lần, đã nhận / chưa đạt không ghi túi, mã lạ ném", async () => {
  const s = new MemoryStore();
  const bag = { items: [], honTe: 50, slots: BAG_SLOTS } as never, seen: unknown[] = [];
  const orig = (s as unknown as { putBag: (...a: unknown[]) => void }).putBag.bind(s);
  (s as unknown as { putBag: (...a: unknown[]) => void }).putBag = (...a) => { seen.push(a); orig(...a); };
  const need = (n: number) => (c: { elite?: number }) => (c.elite ?? 0) >= n;
  assert.equal(await s.achvClaim(1, "elite_1", need(1), bag), "low"); assert.equal(seen.length, 0, "chưa đạt: không ghi túi");
  await s.achvBump(1, "elite", 1);
  assert.equal(await s.achvClaim(1, "elite_1", need(1), bag), "ok"); assert.equal(seen.length, 1);
  assert.equal(await s.achvClaim(1, "elite_1", need(1), bag), "dup"); assert.equal(seen.length, 1, "nhận đúp: không ghi túi lần hai");
  assert.deepEqual((await s.achvGet(1)).claimed, ["elite_1"]);
  const race = await Promise.all([s.achvClaim(2, "elite_1", () => true, bag), s.achvClaim(2, "elite_1", () => true, bag), s.achvClaim(2, "elite_1", () => true, bag)]);
  assert.deepEqual(race.slice().sort(), ["dup", "dup", "ok"], "ba lần nhận cùng lúc: đúng một lần thắng");
  await assert.rejects(() => s.achvClaim(1, "khong_co", () => true, bag));
  assert.deepEqual(await s.achvGet(3), { claimed: [], counters: {} }, "tài khoản khác không bị ảnh hưởng");
});
