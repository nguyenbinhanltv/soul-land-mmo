// Danh Hiệu (docs/design/danh-hieu.md mục 5.25, P1): hình dạng danh mục, mã ổn định, hạn dùng, `MemoryStore.titleGet / titleGrant / titleEquip` (cùng luật với PgStore)
// và `titleAction` / `grantTitle` với phòng giả (giả mạo `equip`, danh hiệu hết hạn tự về mặc định, `titleId` công khai chỉ là mã).
// Chạy: npm run test:title --prefix server
import assert from "node:assert/strict";
import { TITLES, TITLE_DEFS, TITLE_GROUPS, TITLE_TIER_MAX, titleDef, titleExpiry, titleIdOf, titleOf, titleText, weekStartVn, type TitleDef } from "../../shared/data.ts";
// Test dùng kho trong bộ nhớ dù shell có DATABASE_URL (DB thật kiểm bằng bot --pg): bỏ biến TRƯỚC khi nạp db.ts.
delete process.env.DATABASE_URL;
const { MemoryStore, store } = await import("../src/db.ts");
const { grantTitle, titleAction, titleLeave } = await import("../src/rooms/title.ts");

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
