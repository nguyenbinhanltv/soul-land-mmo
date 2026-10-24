// Kiểm thử tài khoản TEST (#517): mức dựng sẵn hợp lệ với luật server, Store.seedTestAccount / removeTestAccount, cờ is_test ẩn khỏi xếp hạng.
// Chạy: npm run test:seed --prefix server
// Mặc định chỉ thử MemoryStore. Đặt TEST_DATABASE_URL (một DB RIÊNG để thử, vd PostgreSQL cục bộ của bot:local) để thử cả PgStore;
// test tạo và xoá tài khoản test tên có hậu tố ngẫu nhiên, KHÔNG trỏ vào DB thật.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MemoryStore, PgStore, type Store } from "../src/db.ts";
import { buildPreset, checkSeed, PRESETS, MAX_HON_TE } from "../src/testPreset.ts";
import { VOHON, MAX_LEVEL, MAX_RINGS, MAX_STARS, TEAM_SIZE, BAG_MAX_SLOTS, BONE_ITEM, CORE_ITEM, EQUIP_ITEM, EQUIP_SLOTS, BONE_SLOTS, CORE_SLOTS, ARENA, RING_ITEM } from "../../shared/data.ts";
import { allWaypoints } from "../src/map.ts";

async function test(title: string, fn: () => Promise<void> | void) { await fn(); console.log(`✓ ${title}`); }
const PW = randomUUID();

await test("mức dựng sẵn: cả ba mức qua checkSeed (parse / giới hạn của shared/data.ts)", () => {
  for (const id of PRESETS) assert.deepEqual(checkSeed(buildPreset(id)), [], id);
});
await test("max: mọi võ hồn, mọi giới hạn tối đa, đủ bộ đồ cho từng võ hồn", () => {
  const d = buildPreset("max");
  assert.equal(d.vohons.length, VOHON.length);
  for (const v of d.vohons) { assert.equal(v.level, MAX_LEVEL); assert.equal(v.stars, MAX_STARS); assert.equal(v.rings.length, MAX_RINGS); }
  const on = (code: string, vohon: string) => d.items.filter((i) => i.code === code && i.vohon === vohon);
  for (const v of VOHON) { assert.equal(on(BONE_ITEM, v.id).length, BONE_SLOTS.length); assert.equal(on(CORE_ITEM, v.id).length, CORE_SLOTS); }
  assert.equal(d.items.filter((i) => i.code === EQUIP_ITEM && i.equipSlot !== undefined).length, EQUIP_SLOTS.length);
  assert.equal(d.team.length, TEAM_SIZE); assert.equal(d.slots, BAG_MAX_SLOTS); assert.equal(d.honTe, MAX_HON_TE);
  assert.equal(d.waypoints.length, allWaypoints().length);
  assert.ok(d.items.some((i) => i.code === RING_ITEM));
});
await test("checkSeed bắt dữ liệu sai luật (hồn hoàn quá giới hạn, hồn cốt trùng vị trí, hai món cùng ô, cấp quá bình cảnh)", () => {
  const d = buildPreset("max");
  const bad = (f: (x: ReturnType<typeof buildPreset>) => void) => { const x = structuredClone(d); f(x); return checkSeed(x).length > 0; };
  assert.ok(bad((x) => { x.vohons[0].rings[0] = 1e6; }));
  assert.ok(bad((x) => { x.items.push(structuredClone(x.items.find((i) => i.code === BONE_ITEM)!)); }));
  assert.ok(bad((x) => { x.items.push(structuredClone(x.items.find((i) => i.code === EQUIP_ITEM)!)); }));
  assert.ok(bad((x) => { x.vohons[0].rings.length = 3; }));
  assert.ok(bad((x) => { x.honTe = -1; }));
  const n = buildPreset("moi"); assert.deepEqual(checkSeed(n), []);
  n.vohons[0].level = 60; assert.ok(checkSeed(n).length > 0);
});

/** Các kịch bản chung cho mọi Store. `u` thêm hậu tố để chạy lại trên PostgreSQL không đụng tài khoản cũ. */
async function common(label: string, s: Store, u: string) {
  const nm = (x: string) => `${x}${u}`;
  await test(`${label}: seed max tạo tài khoản có cờ is_test, dữ liệu đọc lại đúng`, async () => {
    const r = await s.seedTestAccount(nm("TestMax"), PW, buildPreset("max"));
    assert.equal(r.created, true);
    const ref = await s.lookupAccount(nm("testmax"));
    assert.ok(ref && ref.isTest && ref.id === r.accountId);
    assert.equal(await s.isTestAccount(r.accountId), true);
    const list = await s.listVohons(r.accountId), ch = await s.getCharacter(r.accountId);
    assert.equal(list.length, VOHON.length);
    assert.ok(ch && ch.level === MAX_LEVEL && ch.rings.length === MAX_RINGS && ch.stars === MAX_STARS && ch.skills.length === 4);
    const team = await s.getTeam(r.accountId);
    assert.equal(team.filter(Boolean).length, TEAM_SIZE); assert.ok(team.includes(ch!.rowId));
    const { bag, starter } = await s.loadBag(r.accountId, []);
    assert.equal(starter, false); assert.equal(bag.honTe, MAX_HON_TE); assert.equal(bag.slots, BAG_MAX_SLOTS);
    const d = buildPreset("max");
    assert.equal(bag.items.length, d.items.length);
    assert.equal(bag.items.filter((i) => i.vohonId !== null).length, d.items.filter((i) => i.vohon !== undefined).length);
    assert.equal(bag.items.filter((i) => i.equipSlot !== undefined).length, EQUIP_SLOTS.length);
    assert.equal((await s.getWaypoints(r.accountId)).length, d.waypoints.length);
    assert.equal((await s.getLocation(r.accountId)).mapId, "thien_dau_thanh");
    assert.equal((await s.getLooks(r.accountId)).chosen, true);
    assert.ok(!("error" in await s.login(nm("TestMax"), PW)), "đăng nhập được bằng mật khẩu đã đặt");
  });
  await test(`${label}: seed lại bằng mức khác dựng lại sạch (không sót võ hồn / đồ cũ), giữ mật khẩu`, async () => {
    const r = await s.seedTestAccount(nm("TestMax"), null, buildPreset("moi"));
    assert.equal(r.created, false);
    assert.equal((await s.listVohons(r.accountId)).length, 2);
    const { bag, starter } = await s.loadBag(r.accountId, [{ id: randomUUID(), kind: "dan", code: "hoi_huyet_dan", qty: 5, years: null, stars: null, enhance: 0, stats: null, vohonId: null, created: Date.now() }]);
    assert.equal(starter, true); assert.equal(bag.items.length, 1); assert.equal(bag.honTe, 0);
    assert.equal((await s.getWaypoints(r.accountId)).length, 0);
    assert.ok(!("error" in await s.login(nm("TestMax"), PW)));
    await s.seedTestAccount(nm("TestMax"), null, buildPreset("giua-game"));
    assert.equal((await s.listVohons(r.accountId)).length, 6);
  });
  await test(`${label}: không ghi đè / xoá tài khoản thật (không có is_test), dữ liệu thật nguyên vẹn`, async () => {
    const real = await s.login(nm("NguoiThat"), PW);
    assert.ok(!("error" in real));
    await assert.rejects(() => s.seedTestAccount(nm("NguoiThat"), PW, buildPreset("max")), /is_test/);
    await assert.rejects(() => s.removeTestAccount(nm("NguoiThat")), /is_test/);
    await assert.rejects(() => s.removeTestAccount(nm("KhongCo")), /Không có tài khoản/);
    await assert.rejects(() => s.seedTestAccount(nm("MoiTinh"), null, buildPreset("moi")), /mật khẩu/);
    assert.equal(await s.lookupAccount(nm("MoiTinh")), null);
    assert.equal((await s.lookupAccount(nm("NguoiThat")))?.isTest, false);
    assert.ok(!("error" in await s.login(nm("NguoiThat"), PW)));
  });
  await test(`${label}: dữ liệu sai bị từ chối trước khi ghi (không tạo tài khoản dở)`, async () => {
    const d = buildPreset("moi"); d.items.push({ kind: "dan", code: "hoi_huyet_dan", qty: 0, years: null, stars: null, enhance: 0, stats: null });
    await assert.rejects(() => s.seedTestAccount(nm("TestLoi"), PW, d));
    assert.equal(await s.lookupAccount(nm("TestLoi")), null);
  });
  await test(`${label}: tài khoản test bị ẩn khỏi xếp hạng đấu trường / cộng minh / tông môn`, async () => {
    const t = (await s.seedTestAccount(nm("TestTop"), PW, buildPreset("max"))).accountId;
    const real = await s.login(nm("ThatTop"), PW); assert.ok(!("error" in real));
    const rid = (real as { accountId: number }).accountId;
    await s.awaken(rid, nm("ThatTop"), ["lam_ngan_thao"], "lam_ngan_thao", 1);
    await s.saveArena(t, ARENA.startElo, { elo: 999, wins: 99, losses: 0, draws: 0 });
    await s.saveArena(rid, ARENA.startElo, { elo: 5, wins: 1, losses: 0, draws: 0 });
    const top = await s.arenaTop(50, t);
    assert.ok(top.list.some((x) => x.accountId === rid), "người thật có trong bảng");
    assert.ok(!top.list.some((x) => x.accountId === t), "tài khoản test không có trong bảng");
    assert.equal(top.me, null, "tài khoản test không có hạng");
    assert.ok((await s.arenaTop(50, rid)).me, "người thật vẫn có hạng của mình");
    const res = await s.resonanceTop(1, 100, t);
    assert.ok(!res.list.some((x) => x.accountId === t) && res.me === null);
    const tg = `tong${u}`; // mã tông riêng mỗi lần chạy: chạy lại trên cùng database không lẫn điểm cũ
    await s.setTong(t, tg, 1); await s.addTongPoints(t, 1, tg, 50); await s.addTongPoints(rid, 1, tg, 7);
    const b = await s.tongBoard(1, 1, 10);
    assert.deepEqual(b.top[tg]?.map((e) => e.name) ?? [], [nm("ThatTop")]);
    assert.equal(b.tongs.find((x) => x.tong === tg)?.active, 1, "số thành viên hoạt động không tính tài khoản test");
  });
  await test(`${label}: --remove xoá sạch, trả số dòng mỗi bảng, tài khoản thật vẫn còn`, async () => {
    const id = (await s.lookupAccount(nm("TestTop")))!.id;
    const n = await s.removeTestAccount(nm("TestTop"));
    assert.equal(n.accounts, 1); assert.equal(n.vohons, VOHON.length); assert.ok(n.items > 0 && n.waypoints > 0 && n.arena_ratings === 1);
    assert.equal(await s.lookupAccount(nm("TestTop")), null);
    assert.equal((await s.listVohons(id)).length, 0);
    assert.equal((await s.loadBag(id, []).catch(() => null))?.bag.items.length ?? 0, 0);
    assert.ok(await s.lookupAccount(nm("ThatTop")));
    const n2 = await s.removeTestAccount(nm("TestMax"));
    assert.equal(n2.accounts, 1);
  });
}

await common("MemoryStore", new MemoryStore(), "");
const url = process.env.TEST_DATABASE_URL;
if (url) {
  const pg = new PgStore(url);
  await pg.init();
  try { await common("PgStore", pg, `-${randomUUID().slice(0, 8)}`); } finally { await pg.close(); }
} else console.log("⚠ Bỏ qua PgStore (không có TEST_DATABASE_URL).");
