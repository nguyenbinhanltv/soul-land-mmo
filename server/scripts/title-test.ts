// Danh Hiệu (docs/design/danh-hieu.md mục 5.25, P1): hình dạng danh mục, mã ổn định, hạn dùng, `MemoryStore.titleGet / titleGrant / titleEquip` (cùng luật với PgStore)
// và `titleAction` / `grantTitle` với phòng giả (giả mạo `equip`, danh hiệu hết hạn tự về mặc định, `titleId` công khai chỉ là mã).
// Chạy: npm run test:title --prefix server
import assert from "node:assert/strict";
import { ACHV, BOSSES, RANK_BOARDS, TITLE_RANK_TIERS, TITLES, TITLE_DEFS, TITLE_GROUPS, TITLE_TIER_MAX, titleDef, titleExpiry, titleIdOf, titleOf, titleText, weekStartVn, type TitleDef } from "../../shared/data.ts";
// Test dùng kho trong bộ nhớ dù shell có DATABASE_URL (DB thật kiểm bằng bot --pg): bỏ biến TRƯỚC khi nạp db.ts.
delete process.env.DATABASE_URL;
const { MemoryStore, store } = await import("../src/db.ts");
const { grantTitle, titleAction, titleLeave, titleAchvClaimed, titleBossKilled } = await import("../src/rooms/title.ts");
const { closeTitleWeek } = await import("../src/titleWeek.ts");

function test(title: string, fn: () => void | Promise<void>) { return Promise.resolve(fn()).then(() => console.log(`✓ ${title}`)); }

/** Mã đã phát hành (lưu ở `title_owned` / `title_equipped`): CHỈ được thêm, không đổi tên / xóa. */
const TITLE_IDS = ["cap_1", "cap_2", "cap_3", "cap_4", "cap_5", "cap_6", "cap_7", "cap_8", "cap_9", "cap_10"];

await test("TITLE_DEFS: id duy nhất, nhóm / bậc hợp lệ, 10 danh hiệu cấp từ TITLES, titleOf giữ tương thích", () => {
  assert.equal(new Set(TITLE_DEFS.map((t) => t.id)).size, TITLE_DEFS.length);
  for (const t of TITLE_DEFS) {
    assert.ok((TITLE_GROUPS as readonly string[]).includes(t.group), `${t.id}: nhóm`);
    assert.ok(Number.isInteger(t.tier) && t.tier >= 1 && t.tier <= TITLE_TIER_MAX, `${t.id}: bậc`);
    assert.ok(t.name.length > 0 && ["forever", "week", "event"].includes(t.ttl));
  }
  const cap = TITLE_DEFS.filter((t) => t.group === "cap");
  assert.deepEqual(cap.map((t) => t.name), [...TITLES]);
  assert.ok(cap.every((t) => t.ttl === "forever" && t.source.kind === "level"));
  const tiers = cap.map((t) => t.tier); assert.ok(tiers.every((x, i) => i === 0 || x >= tiers[i - 1]), "bậc cấp không giảm");
  assert.equal(tiers[0], 1); assert.equal(tiers.at(-1), TITLE_TIER_MAX);
  for (const lv of [1, 10, 11, 55, 100, 999]) { assert.equal(titleDef(titleIdOf(lv))!.name, titleOf(lv)); assert.equal(titleText(undefined, lv), titleOf(lv)); }
});
await test("Mã danh hiệu ổn định: mọi mã đã phát hành còn nguyên", () => {
  for (const id of TITLE_IDS) assert.ok(titleDef(id), `mã đã phát hành ${id} không được mất`);
});
await test("titleDef / titleText: mã lạ không có; titleText rơi về danh hiệu cấp", () => {
  for (const x of [undefined, null, 1, "", "khong_co", {}]) assert.equal(titleDef(x), undefined);
  assert.equal(titleText("khong_co", 45), titleOf(45)); assert.equal(titleText("cap_10", 1), TITLES[9]);
});
await test("titleExpiry: vĩnh viễn = null; tuần = 00:00 thứ Hai kế; sự kiện cần mốc tương lai", () => {
  const now = Date.UTC(2026, 10, 4, 5), mk = (ttl: TitleDef["ttl"]): TitleDef => ({ id: "x", name: "x", group: "su_kien", tier: 1, source: { kind: "event" }, ttl });
  assert.equal(titleExpiry(mk("forever"), now), null);
  assert.equal(titleExpiry(mk("week"), now), weekStartVn(now, 1)); assert.ok(weekStartVn(now, 1) > now);
  assert.equal(titleExpiry(mk("event"), now, now + 1000), now + 1000);
  assert.throws(() => titleExpiry(mk("event"), now)); assert.throws(() => titleExpiry(mk("event"), now, now - 1)); assert.throws(() => titleExpiry(mk("event"), now, NaN));
});
await test("MemoryStore: grant idempotent (không đổi hạn khi còn hạn), mã lạ ném, hết hạn thì mở lại", async () => {
  const s = new MemoryStore(), now = Date.now();
  assert.deepEqual(await s.titleGet(1), { owned: [], equipped: null });
  assert.equal(await s.titleGrant(1, "cap_2", null), "new"); assert.equal(await s.titleGrant(1, "cap_2", now + 5000), "dup", "vĩnh viễn không bị hạ xuống có hạn");
  assert.equal((await s.titleGet(1)).owned[0].exp, null);
  await assert.rejects(() => s.titleGrant(1, "khong_co", null)); await assert.rejects(() => s.titleEquip(1, "khong_co"));
  assert.equal(await s.titleGrant(1, "cap_3", now + 60_000), "new"); assert.equal(await s.titleGrant(1, "cap_3", now + 9e9), "dup", "không kéo dài hạn");
  assert.equal((await s.titleGet(1)).owned.find((o) => o.id === "cap_3")!.exp, now + 60_000);
  s.titles.get(1)!.get("cap_3")!.exp = now - 1; // hết hạn
  assert.deepEqual((await s.titleGet(1)).owned.map((o) => o.id), ["cap_2"]);
  assert.equal(await s.titleGrant(1, "cap_3", now + 60_000), "new", "hết hạn thì mở lại");
  assert.equal(await s.titleGrant(2, "cap_2", null), "new", "tài khoản khác độc lập");
});
await test("MemoryStore.titleEquip: chỉ đeo khi sở hữu + còn hạn; null về mặc định; hết hạn thì equipped = null", async () => {
  const s = new MemoryStore(), now = Date.now();
  assert.equal(await s.titleEquip(1, "cap_5"), false, "chưa sở hữu");
  await s.titleGrant(1, "cap_5", now + 60_000);
  assert.equal(await s.titleEquip(1, "cap_5"), true); assert.equal((await s.titleGet(1)).equipped, "cap_5");
  assert.equal((await s.titleGet(2)).equipped, null, "không rò sang tài khoản khác"); assert.equal(await s.titleEquip(2, "cap_5"), false, "đeo đồ của người khác");
  s.titles.get(1)!.get("cap_5")!.exp = now - 1;
  assert.equal((await s.titleGet(1)).equipped, null, "hết hạn tự về mặc định"); assert.equal(await s.titleEquip(1, "cap_5"), false, "hết hạn không đeo được");
  assert.equal(await s.titleEquip(1, null), true); assert.equal((await s.titleGet(1)).equipped, null);
  await s.titleGrant(1, "cap_5", now + 60_000); assert.equal((await s.titleGet(1)).equipped, null, "mở lại không tự đeo (đang ở mặc định)");
});
await test("Đeo danh hiệu có hạn → hết hạn → cấp lại: không tự đeo lại, titleId công khai rỗng", async () => {
  const acc = 18000 + Math.floor(Math.random() * 1000), f = fakeRoom(acc, 1), exp = Date.now() + 60_000;
  await store.titleGrant(acc, "cap_8", exp); assert.equal(await store.titleEquip(acc, "cap_8"), true);
  titleAction(f.room, "s1", { op: "get" }); await f.idle(); assert.equal(f.p.titleId, "cap_8");
  const mem = (store as unknown as { titles: Map<number, Map<string, { exp: number | null }>> }).titles;
  mem.get(acc)!.get("cap_8")!.exp = Date.now() - 1;
  grantTitle(f.room, "s1", "cap_8"); await f.idle();
  assert.equal((await store.titleGet(acc)).equipped, null, "DB về mặc định thật");
  titleAction(f.room, "s1", { op: "get" }); await f.idle(); assert.equal(f.p.titleId, ""); assert.equal(f.sent.at(-1)!.body.equipped, null);
  titleLeave(f.d);
});
await test("MemoryStore.removeTestAccount dọn bảng danh hiệu", async () => {
  const s = new MemoryStore(); s.accounts.set("t", { id: 7, pass: "x" }); s.names.set(7, "T"); s.tests.add(7);
  await s.titleGrant(7, "cap_1", null); await s.titleGrant(7, "cap_2", null); await s.titleEquip(7, "cap_1");
  const n = await s.removeTestAccount("T");
  assert.equal(n.title_owned, 2); assert.equal(n.title_equipped, 1); assert.equal(s.titles.has(7) || s.titleEq.has(7), false);
});

/** Phòng giả vừa đủ cho title.ts: chuỗi lưu tuần tự, `ask` chạy ngay, tin riêng gom vào `sent`, log vào `logs`. */
function fakeRoom(accountId: number, level = 1) {
  const players = new Map([["s1", { titleId: "" }]]), sent: Array<{ type: string; body: any }> = [], logs: string[] = [];
  const d: any = { accountId, owned: [{ level }], titleTimer: null, travelling: false, msgLimit: false, msgTok: {} };
  let q: Promise<unknown> = Promise.resolve();
  const room: any = {
    pdata: new Map([["s1", d]]), state: { players }, log: (_id: string, t: string) => logs.push(t), ask: (_i: string, _k: string, f: () => void) => f(),
    chain: (_d: unknown, f: () => Promise<void>) => (q = q.then(f)), clients: { getById: () => ({ send: (type: string, body: any) => sent.push({ type, body }) }) },
  };
  return { room, d, sent, logs, p: players.get("s1")!, idle: () => q };
}
await test("titleAction: get mở danh hiệu cấp theo mốc; equip chỉ đeo cái đã mở; giả mạo bị từ chối, titleId công khai không đổi", async () => {
  const acc = 9100 + Math.floor(Math.random() * 1000), f = fakeRoom(acc, 25);
  titleAction(f.room, "s1", { op: "get" }); await f.idle();
  const st = f.sent.at(-1)!.body; assert.deepEqual(st.owned.map((o: { id: string }) => o.id).sort(), ["cap_1", "cap_2", "cap_3"].sort()); assert.equal(st.equipped, null); assert.equal(f.p.titleId, "");
  titleAction(f.room, "s1", { op: "equip", id: "cap_10" }); await f.idle();
  assert.equal(f.p.titleId, "", "chưa mở cấp cao thì không đeo được"); assert.ok(f.sent.at(-1)!.body.err);
  for (const bad of [{ op: "equip", id: "khong_co" }, { op: "equip", id: 5 }, { op: "equip", id: { $ne: 1 } }, { op: "grant", id: "cap_10" }, { op: "equip", id: "cap_10", level: 99 }, null, undefined]) {
    titleAction(f.room, "s1", bad as never); await f.idle(); assert.equal(f.p.titleId, "", `giả mạo ${JSON.stringify(bad)}`);
  }
  titleAction(f.room, "s1", { op: "equip", id: "cap_2" }); await f.idle();
  assert.equal(f.p.titleId, "cap_2"); assert.equal(f.sent.at(-1)!.body.equippedNow, "cap_2"); assert.equal((await store.titleGet(acc)).equipped, "cap_2");
  assert.ok(f.sent.every((x) => x.type === "title"), "chỉ tin riêng kiểu title");
  titleAction(f.room, "s1", { op: "equip", id: "" }); await f.idle();
  assert.equal(f.p.titleId, "", "mã rỗng = về mặc định theo cấp"); assert.equal((await store.titleGet(acc)).equipped, null);
  titleLeave(f.d);
});
await test("titleAction: tài khoản khác không đeo được danh hiệu của người khác; lên cấp sau lúc vào phòng vẫn đeo được cấp mới", async () => {
  const a = 12000 + Math.floor(Math.random() * 1000), fa = fakeRoom(a, 45), fb = fakeRoom(a + 1, 1);
  titleAction(fa.room, "s1", { op: "get" }); titleAction(fb.room, "s1", { op: "get" }); await Promise.all([fa.idle(), fb.idle()]);
  titleAction(fb.room, "s1", { op: "equip", id: "cap_4" }); await fb.idle();
  assert.equal(fb.p.titleId, "", "B chưa mở cap_4 dù A đã mở");
  fb.d.owned[0].level = 12; titleAction(fb.room, "s1", { op: "equip", id: "cap_2" }); await fb.idle();
  assert.equal(fb.p.titleId, "cap_2", "đạt mốc cấp 11 sau khi vào phòng: equip mở bù rồi đeo");
  titleLeave(fa.d); titleLeave(fb.d);
});
await test("grantTitle: server cấp, idempotent, tin riêng `fresh` chỉ lần đầu; mã lạ ném; danh hiệu có hạn đang đeo hết hạn thì về mặc định", async () => {
  const acc = 15000 + Math.floor(Math.random() * 1000), f = fakeRoom(acc, 1);
  assert.throws(() => grantTitle(f.room, "s1", "khong_co"));
  grantTitle(f.room, "s1", "cap_6"); await f.idle();
  assert.deepEqual(f.sent.at(-1)!.body.fresh, ["cap_6"]); const n = f.sent.length;
  grantTitle(f.room, "s1", "cap_6"); await f.idle(); assert.equal(f.sent.length, n, "lần hai không báo");
  assert.ok((await store.titleGet(acc)).owned.some((o) => o.id === "cap_6"));
  // Hết hạn: dựng danh hiệu có hạn trực tiếp ở store rồi đeo, kéo hạn về quá khứ.
  const exp = Date.now() + 60_000; await store.titleGrant(acc, "cap_7", exp); assert.equal(await store.titleEquip(acc, "cap_7"), true);
  titleAction(f.room, "s1", { op: "get" }); await f.idle(); assert.equal(f.p.titleId, "cap_7");
  const mem = (store as unknown as { titles?: Map<number, Map<string, { exp: number | null }>> }).titles;
  if (mem) { mem.get(acc)!.get("cap_7")!.exp = Date.now() - 1; titleAction(f.room, "s1", { op: "get" }); await f.idle(); assert.equal(f.p.titleId, "", "hết hạn → mặc định"); }
  titleLeave(f.d);
});

// ---------- P5: nguồn mở khoá ----------
await test("TITLE_DEFS P5: mọi nguồn trỏ tới thứ có thật; nhóm / hạn khớp nguồn; mã ổn định", () => {
  for (const t of TITLE_DEFS) {
    const src = t.source;
    if (src.kind === "achv") { assert.ok(ACHV.some((a) => a.id === src.id), `${t.id}: thành tựu`); assert.equal(t.group, "thanh_tuu"); assert.equal(t.ttl, "forever"); assert.equal(t.id, `achv_${src.id}`); }
    if (src.kind === "rank") { assert.ok(RANK_BOARDS.some((b) => b.code === src.board), `${t.id}: bảng`); assert.ok(TITLE_RANK_TIERS.some((x) => x.top === src.top)); assert.equal(t.group, "xep_hang"); assert.equal(t.ttl, "week"); assert.equal(t.id, `rank_${src.board}_top${src.top}`); }
    if (src.kind === "boss") { assert.ok(BOSSES.some((b) => b.id === src.id), `${t.id}: boss`); assert.equal(t.group, "boss"); assert.equal(t.ttl, "forever"); assert.equal(t.id, `boss_${src.id}`); }
  }
  assert.equal(TITLE_DEFS.filter((t) => t.source.kind === "rank").length, RANK_BOARDS.length * TITLE_RANK_TIERS.length, "đủ mọi bảng x mọi mức");
  assert.ok(TITLE_DEFS.some((t) => t.source.kind === "boss") && TITLE_DEFS.some((t) => t.source.kind === "achv"));
  for (const id of ["achv_level_t10", "achv_owned_all", "rank_cap_top1", "rank_suu_tam_top3", "rank_suc_manh_top10", "boss_thai_than_cu_vien", "boss_huyet_nguyet_lang_vuong"]) assert.ok(titleDef(id), `mã đã phát hành ${id} không được mất`);
});
const seedBoard = async (s: InstanceType<typeof MemoryStore>, n: number, base = 100) => {
  for (let i = 1; i <= n; i++) { s.names.set(base + i, `P${base + i}`); await s.rankPut(base + i, [{ board: "cap", period: 0, score: 100 - i, tie: 0, extra: null }]); }
};
const DAY = "2026-10-26", tiersOf = (b: string) => TITLE_RANK_TIERS.map((t) => ({ top: t.top, id: `rank_${b}_top${t.top}` }));
await test("titleCloseWeek (MemoryStore): top 1 / 3 / 10 đúng mức, không cộng dồn, bỏ tài khoản test, idempotent", async () => {
  const s = new MemoryStore(), now = Date.now(), exp = now + 7 * 86400_000;
  await seedBoard(s, 12); s.tests.add(101); // #101 là tài khoản test: bỏ khỏi bảng, #102 lên hạng 1
  const r = (await s.titleCloseWeek("cap", 0, DAY, tiersOf("cap"), exp))!;
  const of = (acc: number) => r.find((x) => x.accountId === acc)?.id;
  assert.equal(of(101), undefined); assert.equal(of(102), "rank_cap_top1"); assert.equal(of(103), "rank_cap_top3"); assert.equal(of(104), "rank_cap_top3");
  assert.equal(of(105), "rank_cap_top10"); assert.equal(of(111), "rank_cap_top10"); assert.equal(of(112), undefined, "hạng 11 ngoài mức");
  for (const acc of [102, 103, 111]) assert.equal((await s.titleGet(acc)).owned.length, 1, "mỗi bảng chỉ một danh hiệu (không cộng dồn)");
  assert.equal((await s.titleGet(102)).owned[0].exp, exp);
  assert.equal(await s.titleCloseWeek("cap", 0, DAY, tiersOf("cap"), exp), null, "chốt lần hai = bỏ");
  assert.equal(await s.titleCloseWeek("suu_tam", 0, DAY, tiersOf("suu_tam"), exp) !== null, true, "bảng khác chốt riêng");
  assert.equal((await s.titleGet(102)).owned.length, 1);
  await assert.rejects(() => s.titleCloseWeek("cap", 0, "2026-11-02", [{ top: 1, id: "khong_co" }], exp));
  assert.equal(s.titleWeeks.has("2026-11-02|cap"), false, "mã lạ: không ghi dấu chốt");
});
await test("Qua tuần: danh hiệu hết hạn → về mặc định; tuần kế đổi hạng thì cấp mới, không tự đeo lại", async () => {
  const s = new MemoryStore(), now = Date.now(); await seedBoard(s, 3);
  await s.titleCloseWeek("cap", 0, DAY, tiersOf("cap"), now + 60_000); assert.equal(await s.titleEquip(101, "rank_cap_top1"), true);
  s.titles.get(101)!.get("rank_cap_top1")!.exp = now - 1; // hết tuần kế
  for (const acc of [102, 103]) for (const v of s.titles.get(acc)!.values()) v.exp = now - 1; // cả tuần cũ hết hạn đúng ranh giới tuần (chốt tuần sau chạy sau mốc đó)
  assert.equal((await s.titleGet(101)).equipped, null, "hết hạn tự về mặc định"); assert.equal((await s.titleGet(101)).owned.length, 0);
  await s.rankPut(102, [{ board: "cap", period: 0, score: 999, tie: 0, extra: null }]);
  await s.titleCloseWeek("cap", 0, "2026-11-02", tiersOf("cap"), now + 7 * 86400_000);
  assert.deepEqual((await s.titleGet(102)).owned.map((o) => o.id), ["rank_cap_top1"]); assert.equal((await s.titleGet(102)).equipped, null);
  assert.deepEqual((await s.titleGet(101)).owned.map((o) => o.id), ["rank_cap_top3"], "xuống hạng 2-3: mức thấp hơn");
});
await test("closeTitleWeek (store dùng chung): chốt tuần vừa kết thúc đúng một lần, hạn = hết tuần kế", async () => {
  const acc = 30000 + Math.floor(Math.random() * 1000), now = Date.UTC(2026, 10, 4, 5);
  (store as unknown as { names: Map<number, string> }).names.set(acc, "TopCap"); await store.rankPut(acc, [{ board: "cap", period: 0, score: 1_000_000, tie: 0, extra: null }]);
  const n1 = await closeTitleWeek(now); assert.ok(n1 >= 1);
  const row = (await store.titleGet(acc)).owned.find((o) => o.id === "rank_cap_top1"); assert.ok(row, "đứng đầu bảng cấp"); assert.equal(row!.exp, weekStartVn(now, 1));
  assert.equal(await closeTitleWeek(now), 0, "khởi động lại / chạy lại không cấp thêm");
});
await test("bossFirst: lần hạ đầu thắng, cùng killKey (đồng đội) cũng thắng, lần hạ khác (kênh / pod khác) thua", async () => {
  const s = new MemoryStore();
  assert.equal(await s.bossFirst("b1", "roomA|1|x"), true); assert.equal(await s.bossFirst("b1", "roomA|1|x"), true, "đồng đội cùng lần hạ");
  assert.equal(await s.bossFirst("b1", "roomB|1|y"), false, "kênh khác hạ sau"); assert.equal(await s.bossFirst("b2", "roomB|1|y"), true, "boss khác độc lập");
  const rs = await Promise.all(["a", "b", "c", "d"].map((k) => s.bossFirst("b3", k))); assert.equal(rs.filter(Boolean).length, 1, "chạy đua: đúng một lần hạ thắng");
});
await test("titleBossKilled: chỉ lần hạ đầu mở danh hiệu (mọi người đóng góp cùng lần), tin riêng fresh; boss không có danh hiệu thì bỏ", async () => {
  const a = 31000 + Math.floor(Math.random() * 500), fa = fakeRoom(a), fb = fakeRoom(a + 1), fc = fakeRoom(a + 2), boss = "thien_doc_chu_hoang";
  titleBossKilled(fa.room, "s1", boss, "r1|1|b"); titleBossKilled(fb.room, "s1", boss, "r1|1|b"); titleBossKilled(fc.room, "s1", boss, "r2|1|b");
  await Promise.all([fa.idle(), fb.idle(), fc.idle()]);
  assert.deepEqual(fa.sent.at(-1)!.body.fresh, [`boss_${boss}`]); assert.deepEqual(fb.sent.at(-1)!.body.fresh, [`boss_${boss}`]);
  assert.equal(fc.sent.length, 0, "kênh khác hạ sau: không có"); assert.equal((await store.titleGet(a + 2)).owned.length, 0);
  assert.equal((await store.titleGet(a)).owned[0].exp, null, "vĩnh viễn");
  titleBossKilled(fc.room, "s1", "boss_khong_co_danh_hieu", "r3"); await fc.idle(); assert.equal(fc.sent.length, 0);
});
await test("Thành tựu: nhận bậc cuối mở danh hiệu (idempotent); thành tựu thường không; vào phòng mở bù thành tựu đã nhận từ trước", async () => {
  const a = 32000 + Math.floor(Math.random() * 500), f = fakeRoom(a);
  titleAchvClaimed(f.room, "s1", "level_t1"); await f.idle(); assert.equal(f.sent.length, 0, "thành tựu thường không gắn danh hiệu");
  titleAchvClaimed(f.room, "s1", "king_t3"); await f.idle(); assert.deepEqual(f.sent.at(-1)!.body.fresh, ["achv_king_t3"]);
  titleAchvClaimed(f.room, "s1", "king_t3"); await f.idle(); assert.equal(f.sent.length, 1, "lần hai không báo");
  const g = fakeRoom(a + 1); (store as unknown as { achv: Map<number, unknown> }).achv.set(a + 1, { claimed: new Set(["world_t3", "elite_t1"]), counters: {} });
  titleAction(g.room, "s1", { op: "get" }); await g.idle();
  assert.ok(g.sent.at(-1)!.body.owned.some((o: { id: string }) => o.id === "achv_world_t3"), "mở bù"); assert.ok(g.sent.at(-1)!.body.owned.every((o: { id: string }) => o.id !== "achv_elite_t1"));
  titleLeave(f.d); titleLeave(g.d);
});
