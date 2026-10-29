// Thư hệ thống (docs/design/thu.md mục 5.24, bước P2): hằng `MAIL`, nguồn `MAIL_KINDS` và `MemoryStore.mail*` (cùng luật với PgStore: chống tạo trùng, hạn, hộp đầy, nhận một lần, chỉ thư của mình).
// Phần chạy trong phòng (tin `mail`, túi đầy, hoàn khi lỗi) do bot thử (BOT_ONLY=mail).
// Chạy: npm run test:mail --prefix server
import assert from "node:assert/strict";
import { MemoryStore } from "../src/db.ts";
import { BAG_SLOTS, ITEMS, MAIL, MAIL_KINDS, RING_ITEM, mailDaysLeft } from "../../shared/data.ts";

function test(title: string, fn: () => void | Promise<void>) { return Promise.resolve(fn()).then(() => console.log(`✓ ${title}`)); }
const stack = ITEMS.find((i) => i.stack > 1)!.id;
const bag = { items: [], honTe: 0, slots: BAG_SLOTS } as never;
const mk = (dedup: string, extra: Partial<Parameters<MemoryStore["mailSend"]>[1]> = {}) => ({ kind: "gm", dedup, title: "Quà", ...extra });

await test("MAIL: giá trị hợp lý, nguồn có tên người gửi", () => {
  for (const k of ["ttlDays", "warnDays", "boxMax", "maxAttach", "maxQty", "maxHonTe", "titleMax", "bodyMax", "claimAllMax"] as const) assert.ok(Number.isInteger(MAIL[k]) && MAIL[k] > 0, k);
  assert.ok(MAIL.warnDays < MAIL.ttlDays && MAIL.claimAllMax <= MAIL.boxMax);
  for (const k of ["welfare", "bicanh", "gm"]) assert.ok(MAIL_KINDS[k], `nguồn ${k}`);
  assert.equal(mailDaysLeft(1000 + 86_400_000 * 2 + 1, 1000), 3); assert.equal(mailDaysLeft(0, 5), 0);
});
await test("mailSend / mailList: mới nhất trước, chống tạo trùng theo dedup, bản sao", async () => {
  const s = new MemoryStore();
  assert.equal(await s.mailSend(1, mk("a", { items: [{ code: stack, qty: 2 }] })), "ok");
  assert.equal(await s.mailSend(1, mk("a")), "dup", "cùng dedup: không ra thư thứ hai");
  assert.equal(await s.mailSend(2, mk("a")), "ok", "dedup chỉ trùng trong cùng tài khoản");
  await s.mailSend(1, mk("b"));
  const l = await s.mailList(1);
  assert.deepEqual(l.map((m) => m.title), ["Quà", "Quà"]); assert.ok(l[0].createdAt >= l[1].createdAt);
  l[1].items.push({ code: "x", qty: 1 }); assert.equal((await s.mailList(1)).find((m) => m.items.length > 1), undefined, "bản sao");
  assert.deepEqual((await s.mailList(3)), []);
});
await test("mailSend: nội dung sai bị ném (nguồn lạ, vật phẩm có dữ liệu riêng / lạ, quá dài, quá trần)", async () => {
  const s = new MemoryStore();
  for (const bad of [{ kind: "la" }, { kind: "__proto__" }, { dedup: "" }, { title: "" }, { title: "x".repeat(MAIL.titleMax + 1) }, { body: "x".repeat(MAIL.bodyMax + 1) }, { honTe: -1 }, { honTe: 1.5 }, { honTe: MAIL.maxHonTe + 1 },
    { items: [{ code: RING_ITEM, qty: 1 }] }, { items: [{ code: "khong_co", qty: 1 }] }, { items: [{ code: stack, qty: 0 }] }, { items: [{ code: stack, qty: MAIL.maxQty + 1 }] },
    { items: Array.from({ length: MAIL.maxAttach + 1 }, () => ({ code: stack, qty: 1 })) }, { ttlMs: 0 }]) await assert.rejects(() => s.mailSend(1, mk("z", bad)), JSON.stringify(bad));
  assert.deepEqual(await s.mailList(1), []);
});
await test("Hết hạn: thư ẩn và dọn; dedup cũ dùng lại được sau khi hết hạn; nhận thư hết hạn thất bại", async () => {
  const s = new MemoryStore();
  await s.mailSend(1, mk("e", { honTe: 5, ttlMs: 30 })); await s.mailSend(1, mk("k"));
  const id = (await s.mailList(1)).find((m) => m.honTe === 5)!.id;
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(await s.mailClaim(1, id, bag), "gone"); assert.equal((await s.mailList(1)).length, 1);
  assert.equal(await s.mailSend(1, mk("e")), "ok");
});
await test("mailClaim: nhận một lần (ba lần cùng lúc chỉ một thắng), thư của người khác / lạ là 'gone', không ghi túi khi thất bại", async () => {
  const s = new MemoryStore(), seen: unknown[] = [];
  const orig = (s as unknown as { putBag: (...a: unknown[]) => void }).putBag.bind(s);
  (s as unknown as { putBag: (...a: unknown[]) => void }).putBag = (...a) => { seen.push(a); orig(...a); };
  await s.mailSend(1, mk("c", { honTe: 7, items: [{ code: stack, qty: 3 }] }));
  const id = (await s.mailList(1))[0].id;
  assert.equal(await s.mailClaim(2, id, bag), "gone", "thư của người khác"); assert.equal(await s.mailClaim(1, 9999, bag), "gone"); assert.equal(seen.length, 0);
  const race = await Promise.all([s.mailClaim(1, id, bag), s.mailClaim(1, id, bag), s.mailClaim(1, id, bag)]);
  assert.deepEqual(race.slice().sort(), ["gone", "gone", "ok"]); assert.equal(seen.length, 1, "chỉ một lần ghi túi");
  const m = (await s.mailList(1))[0]; assert.ok(m.claimed && m.read);
});
await test("mailRead / mailDelete: đọc chỉ đánh dấu; xóa chỉ thư đã nhận hoặc không đính kèm; xóa rồi dedup vẫn chặn tạo lại", async () => {
  const s = new MemoryStore();
  await s.mailSend(1, mk("t")); await s.mailSend(1, mk("g", { honTe: 1 }));
  const [g, t] = await s.mailList(1); // g (mới hơn) có đính kèm
  assert.equal(g.read, false); await s.mailRead(1, g.id); await s.mailRead(2, t.id); assert.equal((await s.mailList(1))[0].read, true);
  assert.equal((await s.mailList(1)).find((m) => m.id === t.id)!.read, false, "đọc thư của người khác không đổi gì");
  assert.equal(await s.mailDelete(1, g.id), false, "còn đính kèm chưa nhận: không xóa");
  assert.equal(await s.mailDelete(2, t.id), false, "thư của người khác"); assert.equal(await s.mailDelete(1, t.id), true);
  assert.equal(await s.mailSend(1, mk("t")), "dup", "xóa mềm: dedup còn chặn");
  await s.mailClaim(1, g.id, bag); assert.equal(await s.mailDelete(1, g.id), true); assert.deepEqual(await s.mailList(1), []);
});
await test("Hộp đầy: dọn thư cũ nhất đã nhận / không đính kèm; toàn thư còn đính kèm thì 'full'", async () => {
  const s = new MemoryStore();
  for (let i = 0; i < MAIL.boxMax; i++) assert.equal(await s.mailSend(1, mk(`p${i}`, { honTe: 1 })), "ok");
  assert.equal(await s.mailSend(1, mk("over", { honTe: 1 })), "full"); assert.equal((await s.mailList(1)).length, MAIL.boxMax);
  const oldest = (await s.mailList(1)).at(-1)!; await s.mailClaim(1, oldest.id, bag);
  assert.equal(await s.mailSend(1, mk("over", { honTe: 1 })), "ok", "dọn thư đã nhận cũ nhất");
  const l = await s.mailList(1); assert.equal(l.length, MAIL.boxMax); assert.ok(!l.some((m) => m.id === oldest.id));
});
