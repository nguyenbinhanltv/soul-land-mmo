import assert from "node:assert/strict";
import { createPresenceBackend, presenceBackend } from "../src/presence.ts";
import { arenaEnqueue, arenaQueued } from "../src/rooms/arenaQueue.ts";

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
  const entry = { accountId: 99, name: "t", rec: { elo: 1000 } as never, since: Date.now(), ready: () => true, found: () => true };
  await assert.rejects(arenaEnqueue(entry), /khóa hàng chờ/);
  assert.equal(arenaQueued(99), undefined);
  await presenceBackend.releaseLease("arena:queue:lock", "other");
  await arenaEnqueue(entry);
  assert.equal(arenaQueued(99), entry);
  console.log("✓ Hàng chờ đấu trường: không lấy được khóa thì rollback và báo lỗi");
} finally {
  await backend.close();
  process.exit(process.exitCode ?? 0);
}
