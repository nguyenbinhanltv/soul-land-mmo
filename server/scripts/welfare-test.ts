// Phúc Lợi: Sổ Điểm Danh (docs/design/phuc-loi.md mục 5.21, bước P1 + P2): hàm thuần, bảng quan hệ trần quà (cân bằng) và `MemoryStore.checkinGet / checkinClaim`
// (cùng luật với PgStore). Phần chạy trong phòng (tin `welfare`, đẩy ngày, ký bù, túi đầy, hoàn khi lỗi) do bot thử (BOT_ONLY=welfare).
// Chạy: npm run test:welfare --prefix server
import assert from "node:assert/strict";
import { MemoryStore, type CheckinPatch } from "../src/db.ts";
import { ARENA_SHARDS, AUTO_BONUS_MAX, AUTO_DAILY_SECS, AUTO_TOKEN, AUTO_TOKEN_SECS, CHECKIN, ITEMS, SHARD_BUY, SHOP, TONG_WEEK_REWARD, checkinCount, checkinDay, checkinFee, checkinOpen,
  checkinValue, vnAt, vnDayNum } from "../../shared/data.ts";
import { bagFits, checkinGives, welfareView } from "../src/rooms/welfare.ts";

function test(title: string, fn: () => void | Promise<void>) { return Promise.resolve(fn()).then(() => console.log(`✓ ${title}`)); }
const R = CHECKIN.rewards, sum = (f: (r: (typeof R)[number]) => number) => R.reduce((a, r) => a + f(r), 0);
const tokens = (r: (typeof R)[number]) => (r.items ?? []).filter((x) => x.code === AUTO_TOKEN).reduce((a, x) => a + x.qty, 0);

await test("CHECKIN: hình dạng (days ô, mốc trong phạm vi, phí = makeupMax − makeupFree bậc, tăng dần, days ≤ 30 để vừa mask)", () => {
  assert.equal(R.length, CHECKIN.days); assert.ok(CHECKIN.days <= 30);
  assert.ok(CHECKIN.milestones.every((i) => Number.isInteger(i) && i >= 0 && i < CHECKIN.days) && CHECKIN.milestones.includes(CHECKIN.days - 1), "ô cuối là mốc");
  assert.ok(CHECKIN.makeupFree >= 1 && CHECKIN.makeupMax > CHECKIN.makeupFree && CHECKIN.makeupMax <= CHECKIN.days);
  assert.equal(CHECKIN.makeupFee.length, CHECKIN.makeupMax - CHECKIN.makeupFree);
  assert.ok(CHECKIN.makeupFee.every((f, k) => Number.isInteger(f) && f > 0 && (k === 0 || f > CHECKIN.makeupFee[k - 1])), "phí lũy tiến");
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(checkinFee), [0, 0, ...CHECKIN.makeupFee, null, null]);
});
await test("Quan hệ trần quà (mỗi chu kỳ): Hồn Tệ, mảnh, Ủy Thác Lệnh, đan / phù, loại quà", () => {
  const cap = CHECKIN.cycleCap;
  assert.equal(cap.honTe, 3 * TONG_WEEK_REWARD.rest.honTe);
  assert.ok(sum((r) => r.honTe ?? 0) <= cap.honTe, "Hồn Tệ ≤ 3 × thưởng tuần tông (không hạng nhất)");
  assert.ok(sum((r) => r.shards ?? 0) <= SHARD_BUY.daily && cap.shards === SHARD_BUY.daily, "mảnh ≤ hạn mức mua một ngày");
  assert.ok(ARENA_SHARDS.length > 0, "mảnh chỉ bốc trong ARENA_SHARDS (SR / SSR, không UR)");
  assert.ok(sum(tokens) * AUTO_TOKEN_SECS <= AUTO_DAILY_SECS && sum(tokens) * AUTO_TOKEN_SECS <= AUTO_BONUS_MAX, "Ủy Thác Lệnh: giờ cộng ≤ AUTO_DAILY_SECS và AUTO_BONUS_MAX");
  const shop = new Set(SHOP.map((s) => s.code)), ok = new Set(["hoi_huyet_dan", "hoi_hon_dan", "hoi_thanh_phu", AUTO_TOKEN]);
  for (const r of R) for (const x of r.items ?? []) {
    assert.ok(ITEMS.some((i) => i.id === x.code), `${x.code} có trong ITEMS`); assert.ok(ok.has(x.code), `${x.code}: chỉ đan nhỏ / Hồi Thành Phù / Ủy Thác Lệnh`);
    assert.ok(shop.has(x.code), `${x.code} có trong SHOP`); assert.ok(Number.isInteger(x.qty) && x.qty > 0);
  }
  const potions = sum((r) => (r.items ?? []).filter((x) => x.code !== AUTO_TOKEN).reduce((a, x) => a + x.qty * SHOP.find((s) => s.code === x.code)!.price, 0));
  assert.ok(potions <= cap.honTe * cap.shopShare, `đan / phù theo giá SHOP (${potions}) ≤ ${cap.shopShare} × Hồn Tệ trần`);
  assert.ok(R.every((r) => !!(r.honTe || r.shards || r.items?.length)), "ô nào cũng có quà");
});
await test("Mốc lớn hơn ô thường; ô cuối là quà lớn nhất; phí ký bù trả tiền ≥ giá trị quà ô đắt nhất (ký bù bằng tiền không có lời)", () => {
  const val = R.map(checkinValue), normal = val.filter((_, i) => !CHECKIN.milestones.includes(i)), top = Math.max(...val);
  for (const i of CHECKIN.milestones) assert.ok(val[i] > Math.max(...normal), `mốc ${i + 1} lớn hơn mọi ô thường`);
  assert.equal(val[CHECKIN.days - 1], top, "ô cuối lớn nhất");
  assert.ok(CHECKIN.makeupFee[0] >= top, `phí đầu ${CHECKIN.makeupFee[0]} ≥ giá trị ô đắt nhất ${top}`);
});
await test("checkinDay / checkinOpen / checkinCount: ranh giới 00:00 giờ Việt Nam, ô tương lai, hết chu kỳ, số lạ", () => {
  const t = Date.UTC(2026, 9, 28, 12, 0), d0 = vnDayNum(t); // 19:00 VN ngày 28
  const before = vnAt(t, "23:59"), after = vnAt(t, "00:00", 1);
  assert.equal(vnDayNum(before), d0); assert.equal(vnDayNum(after), d0 + 1, "00:00 đổi ngày");
  assert.deepEqual(checkinDay(d0, d0), { i: 0, over: false });
  assert.deepEqual(checkinDay(d0, d0 + CHECKIN.days - 1), { i: CHECKIN.days - 1, over: false });
  assert.equal(checkinDay(d0, d0 + CHECKIN.days).over, true, "ngày thứ days + 1 đã hết chu kỳ");
  assert.equal(checkinDay(d0 + 1, d0).over, true, "đồng hồ lùi: không hợp lệ");
  assert.equal(checkinOpen(0, 0), true); assert.equal(checkinOpen(1, 0), false); assert.equal(checkinOpen(0, CHECKIN.days), false);
  for (const x of [-1, 0.5, NaN, Infinity, 1e9]) assert.equal(checkinOpen(0, x), false, `ô ${x} không hợp lệ`);
  assert.equal(checkinCount(0b10110), 3);
});
await test("welfareView: chưa từng ký, đang chạy, đã hết chu kỳ; lượt ký bù và hạn chu kỳ", () => {
  const now = Date.UTC(2026, 9, 28, 12, 0), d0 = vnDayNum(now);
  assert.deepEqual(welfareView(null, now), { cycle: 0, day: -1, mask: 0, now, endsAt: 0, makeupLeft: CHECKIN.makeupMax, free: CHECKIN.makeupFree, fee: 0 });
  const row = { cycle: 2, startDay: d0 - 3, mask: 0b101, makeupUsed: 2, lastAt: now - 1, ver: 4 }, v = welfareView(row, now);
  assert.equal(v.day, 3); assert.equal(v.cycle, 2); assert.equal(v.mask, 5); assert.equal(v.makeupLeft, CHECKIN.makeupMax - 2); assert.equal(v.free, 0); assert.equal(v.fee, CHECKIN.makeupFee[0]);
  assert.equal(v.endsAt, vnAt(now, "00:00", CHECKIN.days - 3), "hết chu kỳ lúc 00:00 sau ô cuối");
  const over = welfareView({ ...row, startDay: d0 - CHECKIN.days }, now);
  assert.equal(over.day, -1); assert.equal(over.endsAt, 0); assert.equal(over.makeupLeft, CHECKIN.makeupMax, "chu kỳ mới có đủ lượt"); assert.equal(over.mask, 5, "vẫn thấy mask chu kỳ vừa hết");
});
await test("checkinGives: quà đúng bảng; mảnh luôn thuộc ARENA_SHARDS", () => {
  for (let i = 0; i < CHECKIN.days; i++) {
    const g = checkinGives(i), r = R[i];
    assert.equal(g.honTe, r.honTe ?? 0);
    assert.equal(g.gives.reduce((a, x) => a + x.qty, 0), (r.shards ?? 0) + (r.items ?? []).reduce((a, x) => a + x.qty, 0));
    for (const x of g.gives.slice((r.items ?? []).length)) assert.ok(ARENA_SHARDS.some((id) => x.code.includes(id)), `${x.code} là mảnh SR / SSR`);
  }
});
await test("bagFits: tính chung ô trống cho cả danh sách quà, tận dụng chồng cũ, ô khóa không gộp, mã lạ bị từ chối", () => {
  const item = (code: string, qty: number, extra = {}) => ({ id: Math.random().toString(), code, qty, vohonId: null, ...extra });
  const d = (bag: unknown[], slots: number) => ({ bag, bagSlots: slots }) as never;
  assert.equal(bagFits(d([], 1), [{ code: "hoi_huyet_dan", qty: 2 }, { code: "hoi_hon_dan", qty: 2 }]), false, "hai mã khác nhau cần hai ô");
  assert.equal(bagFits(d([], 2), [{ code: "hoi_huyet_dan", qty: 2 }, { code: "hoi_hon_dan", qty: 2 }]), true);
  assert.equal(bagFits(d([item("hoi_huyet_dan", 1)], 1), [{ code: "hoi_huyet_dan", qty: 1 }]), true, "cộng vào chồng cũ, không cần ô mới");
  assert.equal(bagFits(d([item("hoi_huyet_dan", 1, { locked: true })], 1), [{ code: "hoi_huyet_dan", qty: 1 }]), false, "ô khóa không gộp");
  assert.equal(bagFits(d([], 5), [{ code: "khong_co", qty: 1 }]), false, "mã lạ");
});

const acc = (s: MemoryStore, id: number) => { s.names.set(id, `T${id}`); };
const bag = (honTe = 0) => ({ honTe, items: [] });
const patch = (o: Partial<CheckinPatch> = {}): CheckinPatch => ({ expect: null, cycle: 1, startDay: 100, mask: 1, makeupUsed: 0, lastAt: 1000, bit: 1, makeupMax: CHECKIN.makeupMax, ...o });
await test("MemoryStore.checkinClaim: lần đầu, ký đúp, ver lỗi thời, cùng chu kỳ ghi thêm bit, ký bù đếm lượt", async () => {
  const s = new MemoryStore(); acc(s, 1);
  assert.equal(await s.checkinGet(1), null);
  assert.equal(await s.checkinClaim(1, patch(), bag(50)), 1);
  assert.equal(await s.checkinClaim(1, patch(), bag(99)), null, "đã có dòng mà expect = null: tranh chấp, không ghi gì");
  assert.equal(s.bags.get(1)!.honTe, 50, "ghi hỏng thì túi không đổi");
  assert.equal(await s.checkinClaim(1, patch({ expect: 1, mask: 1, bit: 1 }), bag(99)), null, "ô đã ký");
  assert.equal(await s.checkinClaim(1, patch({ expect: 0, mask: 3, bit: 2, lastAt: 2000 }), bag(99)), null, "ver lỗi thời");
  assert.equal(await s.checkinClaim(1, patch({ expect: 1, mask: 3, bit: 2, lastAt: 2000 }), bag(70)), 2);
  assert.equal(await s.checkinClaim(1, patch({ expect: 2, mask: 7, bit: 4, makeupUsed: 1, lastAt: 2000 }), bag(80)), 3, "ký bù dùng một lượt");
  assert.equal(await s.checkinClaim(1, patch({ expect: 3, mask: 15, bit: 8, makeupUsed: 3, lastAt: 2000 }), bag(1)), null, "nhảy 2 lượt cùng lúc");
  assert.deepEqual(await s.checkinGet(1), { cycle: 1, startDay: 100, mask: 7, makeupUsed: 1, lastAt: 2000, ver: 3 });
  assert.equal(s.bags.get(1)!.honTe, 80);
});
await test("MemoryStore.checkinClaim: đồng hồ lùi bị từ chối; vượt makeupMax / ô lạ bị ném lỗi; chu kỳ mới đặt lại mask và lượt", async () => {
  const s = new MemoryStore(); acc(s, 1);
  await s.checkinClaim(1, patch({ lastAt: 5000 }), bag());
  assert.equal(await s.checkinClaim(1, patch({ expect: 1, mask: 3, bit: 2, lastAt: 4999 }), bag()), null, "last_at lùi");
  await assert.rejects(() => s.checkinClaim(1, patch({ expect: 1, mask: 3, bit: 2, makeupUsed: CHECKIN.makeupMax + 1, lastAt: 6000 }), bag()), /không hợp lệ/);
  for (const bit of [0, 3, -1, 1 << 30, 1.5]) await assert.rejects(() => s.checkinClaim(1, patch({ expect: 1, mask: bit | 1, bit, lastAt: 6000 }), bag()), /không hợp lệ/, `ô ${bit}`);
  assert.equal(await s.checkinClaim(1, patch({ expect: 1, cycle: 3, startDay: 130, mask: 1, bit: 1, lastAt: 6000 }), bag()), null, "nhảy chu kỳ cách 2");
  assert.equal(await s.checkinClaim(1, patch({ expect: 1, cycle: 2, startDay: 130, mask: 3, bit: 2, lastAt: 6000 }), bag()), null, "chu kỳ mới mà mask không chỉ có bit đầu");
  assert.equal(await s.checkinClaim(1, patch({ expect: 1, cycle: 2, startDay: 130, mask: 1, bit: 1, lastAt: 6000 }), bag()), 2, "chu kỳ mới: ô 1 dù chu kỳ cũ đã ký bit 1");
  assert.deepEqual(await s.checkinGet(1), { cycle: 2, startDay: 130, mask: 1, makeupUsed: 0, lastAt: 6000, ver: 2 });
});
await test("MemoryStore.checkinClaim: túi hỏng thì không ghi sổ; hai lần ghi dồn chỉ một thắng", async () => {
  const s = new MemoryStore(); acc(s, 1);
  await assert.rejects(() => s.checkinClaim(1, patch(), { honTe: -1, items: [] }));
  assert.equal(await s.checkinGet(1), null, "lỗi túi: sổ không đổi");
  const r = await Promise.all([s.checkinClaim(1, patch(), bag(10)), s.checkinClaim(1, patch(), bag(10))]);
  assert.deepEqual(r.slice().sort(), [1, null], "hai nơi cùng ký ô đầu: một thắng");
});
console.log("welfare-test: xong");
