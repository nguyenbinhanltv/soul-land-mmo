// Sổ tay hồn thú (#1720): `MemoryStore.dexGet / dexSee / dexKill` (cùng luật với PgStore) và tên hiện theo sổ của `beastNameSeen`.
// Phần chạy trong phòng (ghi khi hạ, tin `dex`) do bot thử. Chạy: npm run test:dex --prefix server
import assert from "node:assert/strict";
import { MemoryStore } from "../src/db.ts";
import { BEASTS, BEAST_REVEAL, beastName, beastNameSeen } from "../../shared/data.ts";

function test(title: string, fn: () => void | Promise<void>) { return Promise.resolve(fn()).then(() => console.log(`✓ ${title}`)); }
const a = BEASTS[0].id, b = BEASTS[1].id;

await test("dexGet: tài khoản chưa có dòng = rỗng", async () => { assert.deepEqual(await new MemoryStore().dexGet(1), {}); });
await test("dexSee: tạo dòng kills 0, gặp lại không xóa số lần hạ", async () => {
  const s = new MemoryStore();
  await s.dexSee(1, a); assert.deepEqual(await s.dexGet(1), { [a]: 0 });
  await s.dexKill(1, a); await s.dexSee(1, a); assert.deepEqual(await s.dexGet(1), { [a]: 1 });
});
await test("dexKill: tạo dòng nếu chưa gặp, cộng dồn, mỗi tài khoản riêng", async () => {
  const s = new MemoryStore();
  await s.dexKill(1, b); await s.dexKill(1, b); await s.dexKill(2, b);
  assert.deepEqual(await s.dexGet(1), { [b]: 2 }); assert.deepEqual(await s.dexGet(2), { [b]: 1 });
});
await test("mã loài lạ bị từ chối ở cả hai hàm ghi", async () => {
  const s = new MemoryStore();
  await assert.rejects(s.dexSee(1, "khong_co"), /mã loài/); await assert.rejects(s.dexKill(1, "khong_co"), /mã loài/);
  assert.deepEqual(await s.dexGet(1), {});
});
await test("dexGet trả bản sao: sửa kết quả không đổi dữ liệu lưu", async () => {
  const s = new MemoryStore(); await s.dexKill(1, a);
  (await s.dexGet(1))[a] = 99; assert.deepEqual(await s.dexGet(1), { [a]: 1 });
});
await test("beastNameSeen: thường luôn ???, chỉ loài trong sổ / có tên riêng thì hiện tên", () => {
  assert.equal(beastNameSeen(0, 0), BEAST_REVEAL.unknown);
  assert.equal(beastNameSeen(0, 0, true), beastName(0, 0));
  assert.equal(beastNameSeen(1, 0), beastName(1, 0));
});
