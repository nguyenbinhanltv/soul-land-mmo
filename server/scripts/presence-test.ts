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
  console.log("✓ Presence local: lease, TTL document, lock và idempotency");
} finally {
  await backend.close();
}
