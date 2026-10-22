import assert from "node:assert/strict";
import { createPresenceBackend } from "../src/presence.ts";

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
  assert.equal(await backend.withLock("party:1", "worker-b", 1000, async (value) => ({ ...(value ?? {}), members: [7] })), true);
  assert.deepEqual(await backend.getJson("party:1"), { members: [7] });

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
} finally {
  await backend.close();
}
