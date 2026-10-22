import assert from "node:assert/strict";
import { createPresenceBackend, presenceBackend } from "../src/presence.ts";
import { claimBuyback, editBuyback } from "../src/rooms/MapRoom.ts";
import { arenaDeliver, arenaEnqueue, arenaQueued } from "../src/rooms/arenaQueue.ts";

const backend = createPresenceBackend({ mode: "local" });
try {
  assert.equal(backend.mode, "local");
  assert.equal(await backend.acquireLease("account:7", "worker-a", 1000), true);
  assert.equal(await backend.acquireLease("account:7", "worker-b", 1000), false);
  assert.equal(await backend.renewLease("account:7", "worker-a", 1000), true);
  assert.equal(await backend.releaseLease("account:7", "worker-b"), false);
  assert.equal(await backend.releaseLease("account:7", "worker-a"), true);
  assert.equal(await backend.acquireLease("account:7", "worker-b", 1000), true);

  await backend.putJson("arena:match", { id: "m-1", status: "queued" }, 1000);
  assert.deepEqual(await backend.getJson("arena:match"), { id: "m-1", status: "queued" });
  await backend.putJson("party:live:7", { acc: 7, sid: "s-7" });
  assert.deepEqual(await backend.getJsonMany(["party:live:7", "party:live:8"]), [{ acc: 7, sid: "s-7" }, null]);
  assert.equal(await backend.withLock("party:1", "worker-b", 1000, async (value) => ({ ...(value ?? {}), members: [7] })), true);
  assert.deepEqual(await backend.getJson("party:1"), { members: [7] });

  assert.equal(await backend.withLock("ttl:document", "worker-a", 25, async () => {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return { keep: true };
  }, 0), true);
  await new Promise((resolve) => setTimeout(resolve, 35));
  assert.deepEqual(await backend.getJson("ttl:document"), { keep: true });

  const [lockedA, lockedB] = await Promise.all([
    backend.withLock("race", "worker-a", 1000, async (value) => {
      await new Promise((resolve) => setTimeout(resolve, 25));
      return { ...(value ?? {}), a: true };
    }),
    backend.withLock("race", "worker-b", 1000, async (value) => ({ ...(value ?? {}), b: true })),
  ]);
  assert.equal(lockedA, true);
  assert.equal(lockedB, true);
  assert.deepEqual(await backend.getJson("race"), { a: true, b: true });
  console.log("✓ Presence local: lease, TTL document, lock và idempotency");

  await presenceBackend.acquireLease("arena:queue:lock", "other", 5000);
  const rec = { elo: 1000 } as never;
  const entry = { id: "solo:99", members: [{ accountId: 99, name: "t", rec }], elo: 1000, since: Date.now(), canFound: () => true, ready: () => true,
    found: () => true, requeue() {}, abort() {}, rollback() {} };
  await assert.rejects(arenaEnqueue(entry), /khóa hàng chờ/);
  assert.equal(arenaQueued(99), undefined);
  await presenceBackend.releaseLease("arena:queue:lock", "other");
  await arenaEnqueue(entry);
  assert.equal(arenaQueued(99), entry);
  let rolled = 0;
  const x = { ...entry, id: "solo:100", members: [{ accountId: 100, name: "x", rec }], rollback() { rolled++; } };
  await arenaEnqueue(x);
  assert.equal(arenaDeliver(x, "room-1", entry), true);
  assert.equal(arenaQueued(100), undefined);
  await presenceBackend.presence.publish("arena:rollback", { id: "solo:100" });
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(rolled, 1);
  assert.equal(arenaQueued(100), x);
  let foundN = 0;
  const y = { ...entry, id: "solo:101", members: [{ accountId: 101, name: "y", rec }], found: () => { foundN++; return true; } };
  await arenaEnqueue(y);
  await presenceBackend.presence.publish("arena:found", { id: "solo:101", owner: "tiến-trình-khác", roomId: "r", foe: entry });
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(foundN, 0);
  assert.equal(arenaQueued(101), y);
  await presenceBackend.presence.publish("arena:found", { id: "solo:101", owner: presenceBackend.workerId, roomId: "r", foe: entry });
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(foundN, 1);
  assert.equal(arenaQueued(101), undefined);
  await presenceBackend.putJson("buyback:7", [{ key: "k1", item: { code: "x" }, price: 5 }], 60_000);
  const [c1, c2] = await Promise.all([claimBuyback(7, "k1"), claimBuyback(7, "k1")]);
  assert.equal([c1, c2].filter(Boolean).length, 1);
  assert.deepEqual(await presenceBackend.getJson("buyback:7"), []);
  await presenceBackend.putJson("buyback:8", [{ key: "e", item: { code: "x" }, price: 5 }], 60_000);
  const sold = { key: "y", item: { code: "y" }, price: 7 } as never;
  const [claimed] = await Promise.all([claimBuyback(8, "e"), editBuyback(8, (cur) => [sold, ...cur])]);
  assert.ok(claimed);
  assert.deepEqual((await presenceBackend.getJson<{ key: string }[]>("buyback:8"))?.map((x) => x.key), ["y"]);
  console.log("✓ Mua lại: hai lần nhận cùng một món ở presence chỉ một lần được trao");
  console.log("✓ Hàng chờ đấu trường: tin found chỉ do tiến trình chủ của bên đó xử lý");
  console.log("✓ Hàng chờ đấu trường: bên cục bộ ghép trực tiếp được rollback khi đối thủ hủy");
  console.log("✓ Hàng chờ đấu trường: không lấy được khóa thì rollback và báo lỗi");
} finally {
  await backend.close();
  process.exit(process.exitCode ?? 0);
}
