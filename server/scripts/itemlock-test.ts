// Hàm khóa món đồ (#559, itemLock.ts): khóa theo id tăng dần, hai bên tranh cùng món chỉ một bên chạy, fail-closed khi Redis lỗi, không Redis thì chạy thẳng.
// Chạy: npm run test:itemlock --prefix server (RAM). Có REDIS_URL cục bộ + REDIS_PREFIX bắt đầu bằng "test" thì chạy thêm với Redis thật.
import assert from "node:assert/strict";
import { createPresenceBackend, type PresenceBackend } from "../src/presence.ts";
import { ItemLockBusy, itemLockKey, withItemLocks } from "../src/itemLock.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Backend RAM giả làm chế độ Redis: cùng khóa lease (SET NX) và fencing, để thử đúng luồng withItemLocks.
const asRedis = (b: PresenceBackend, over: Partial<PresenceBackend> = {}): PresenceBackend => Object.create(b, { mode: { value: "redis" }, ...Object.fromEntries(Object.entries(over).map(([k, v]) => [k, { value: v }])) });

async function suite(name: string, base: PresenceBackend) {
  const b = base.mode === "redis" ? base : asRedis(base);
  const A = "a0000000-0000-4000-8000-00000000000", id = (n: number) => `${A}${n}`;
  // Hai bên cùng một món: đúng một bên chạy, bên kia ItemLockBusy; xong thì nhả.
  let ran = 0, busy = 0;
  await Promise.all([1, 2].map((k) => withItemLocks(b, [id(1)], async () => { ran++; await sleep(60); }).catch((e) => { if (e instanceof ItemLockBusy) busy++; else throw e; })));
  assert.equal(ran, 1, `${name}: đúng một bên được chạy`); assert.equal(busy, 1, `${name}: bên còn lại bị từ chối`);
  assert.equal(await b.get(itemLockKey(id(1))), null, `${name}: khóa đã nhả`);
  await withItemLocks(b, [id(1)], async () => { ran++; });
  assert.equal(ran, 2, `${name}: nhả xong lấy lại được`);
  // Nhiều món: khóa theo id tăng dần, bỏ trùng; fencing token tăng qua mỗi lần lấy.
  const order: string[] = [];
  const spy = asRedis(base, { acquireFenced: async (k: string, o: string, t?: number, f?: string) => { order.push(k); return b.acquireFenced(k, o, t, f); } });
  const base1 = (await withItemLocks(b, [id(5)], async (g) => g.fence[id(5)]));
  await withItemLocks(spy, [id(3), id(2), id(3), id(1)], async (g) => { assert.deepEqual(Object.keys(g.fence).sort(), [id(1), id(2), id(3)]); assert.equal(await g.held(), true); });
  assert.deepEqual(order, [id(1), id(2), id(3)].map(itemLockKey), `${name}: thứ tự khóa tăng dần`);
  assert.ok((await withItemLocks(b, [id(5)], async (g) => g.fence[id(5)])) > base1, `${name}: fencing token tăng`);
  // Một món trong danh sách bận: không giữ khóa món khác (nhả hết), lệnh không chạy.
  await withItemLocks(b, [id(2)], async () => {
    let started = false;
    await assert.rejects(withItemLocks(b, [id(1), id(2), id(3)], async () => { started = true; }), (e) => e instanceof ItemLockBusy && e.itemId === id(2));
    assert.equal(started, false); assert.equal(await b.get(itemLockKey(id(1))), null, `${name}: khóa món nhỏ hơn đã nhả`);
  });
  // Khóa mất giữa chừng (hết hạn, bên khác lấy): held() báo false.
  await withItemLocks(b, [id(6)], async (g) => { await b.delete(itemLockKey(id(6))); assert.equal(await g.held(), false); }, 1000);
  // Lỗi của run vẫn nhả khóa và ném lên.
  await assert.rejects(withItemLocks(b, [id(7)], async () => { throw new Error("boom"); }), /boom/);
  assert.equal(await b.get(itemLockKey(id(7))), null);
  // Fencing dùng một bộ đếm chung: không để lại khóa `:fence` theo từng món.
  assert.equal(await b.get(`${itemLockKey(id(5))}:fence`), null, `${name}: không có khóa fence riêng của món`);
  // Hết hạn (TTL ngắn): khóa bị bỏ rơi tự mở.
  assert.ok(await b.acquireFenced(itemLockKey(id(8)), "ghost", 30)); await sleep(50);
  await withItemLocks(b, [id(8)], async () => {});
  console.log(`✓ ${name}`);
}

await suite("khóa món (RAM giả Redis)", createPresenceBackend({ mode: "local" }));

// Fail-closed: Redis lỗi thì lệnh không chạy và lỗi được ném.
{
  const dead = asRedis(createPresenceBackend({ mode: "local" }), { acquireFenced: async () => { throw new Error("redis down"); } });
  let ran = false;
  await assert.rejects(withItemLocks(dead, ["x"], async () => { ran = true; }), /redis down/);
  assert.equal(ran, false); console.log("✓ fail-closed khi Redis lỗi");
}
// Không REDIS_URL (chế độ local): chạy thẳng, không đụng khóa.
{
  const local = createPresenceBackend({ mode: "local" });
  let n = 0;
  await Promise.all([1, 2].map(() => withItemLocks(local, ["x"], async () => { n++; await sleep(10); })));
  assert.equal(n, 2); assert.equal(await local.get(itemLockKey("x")), null); console.log("✓ không Redis: giữ nguyên hành vi");
}
if (process.env.REDIS_URL?.trim() && process.env.REDIS_PREFIX?.trim().startsWith("test")) {
  const real = createPresenceBackend();
  try { await suite("khóa món (Redis thật)", real); } finally { await real.close(); }
} else console.log("⚠ bỏ qua phần Redis thật (cần REDIS_URL cục bộ và REDIS_PREFIX bắt đầu bằng \"test\")");
process.exit(0);
