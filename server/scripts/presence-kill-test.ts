// Thử với Redis thật (#120): một tiến trình con ghi dữ liệu presence rồi bị kill (SIGKILL, đúng PID do bài thử mở); sau TTL dữ liệu của nó
// phải được dọn. Chạy: REDIS_URL=redis://127.0.0.1:<cổng riêng> npm run test:presence-kill (không dùng Redis của dịch vụ khác).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { presenceBackend, PRESENCE_TTL_MS } from "../src/presence.ts";
import { arenaLiveOpen, arenaLiveOpenList, arenaLiveHold, arenaLiveHeld } from "../src/rooms/arenaQueue.ts";
import { FriendHub } from "../src/friends.ts";

const sides = [{ name: "A", elo: 1000 }, { name: "B", elo: 1000 }];
const row = (blocks: { id: number; name: string }[]) => ({ friends: [], blocks, fans: [] });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

if (process.argv[2] === "child") {
  const hub = new FriendHub(presenceBackend);
  await hub.ready;
  await arenaLiveOpen({ roomId: "kill-room", mode: "1v1", sides, phase: "fight", secs: 300 });
  hub.enter(2, "sess-kill", "Tiểu Vũ", row([{ id: 1, name: "Đường Tam" }]));
  await hub.settled();
  assert.equal(await presenceBackend.acquireLease("account:kill", `${presenceBackend.workerId}:s`, PRESENCE_TTL_MS), true);
  await presenceBackend.putJson("kill:ttl", 1, 4000);
  console.log("ready");
  setInterval(() => {}, 1000);
} else {
  assert.equal(presenceBackend.mode, "redis", "cần REDIS_URL cục bộ");
  if (!process.env.REDIS_PREFIX?.trim().startsWith("test")) { console.error("✗ Bài thử xóa khóa presence: đặt REDIS_PREFIX bắt đầu bằng \"test\" (vd test:presence-kill)."); process.exit(1); }
  for (const k of ["account:kill", "kill:ttl", "arena:live", "friend:state"]) await presenceBackend.delete(k);
  const child = spawn(process.execPath, ["--import", "tsx", "scripts/presence-kill-test.ts", "child"], { stdio: ["ignore", "pipe", "inherit"], env: process.env });
  try {
    await new Promise<void>((resolve, reject) => {
      child.stdout!.on("data", (d) => { if (String(d).includes("ready")) resolve(); });
      child.on("exit", (c) => reject(new Error(`tiến trình con thoát sớm (mã ${c})`)));
    });
    const [room] = await arenaLiveOpenList();
    assert.equal(room?.roomId, "kill-room", "thấy trận của tiến trình khác");
    assert.equal(typeof await arenaLiveHold("kill-room", 11, Date.now() + 120_000, 4), "object");
    assert.equal(await arenaLiveHeld("kill-room", 11), true);
    const before = new FriendHub(presenceBackend); await before.ready;
    assert.equal(before.blocked(2, 1), true, "thấy danh sách chặn của tiến trình khác");
    before.close();
    assert.equal(await presenceBackend.acquireLease("account:kill", "tiến-trình-khác", PRESENCE_TTL_MS), false);
    console.log("✓ Redis: dữ liệu của tiến trình con thấy được từ tiến trình này");

    const t0 = Date.now();
    child.removeAllListeners("exit");
    const dead = new Promise((r) => child.once("exit", r));
    child.kill("SIGKILL"); await dead;
    for (;;) {
      if (!(await arenaLiveOpenList()).length) break;
      assert.ok(Date.now() - t0 < PRESENCE_TTL_MS + 10_000, "trận của tiến trình đã kill phải biến mất sau TTL");
      await sleep(500);
    }
    console.log(`✓ Redis: kill PID, trận ở sổ xem trận biến mất sau ${Math.round((Date.now() - t0) / 1000)} giây (lease ${PRESENCE_TTL_MS / 1000} giây)`);
    assert.equal(await presenceBackend.getJson("kill:ttl"), null, "khóa có TTL hết hạn");
    assert.equal(await presenceBackend.acquireLease("account:kill", "tiến-trình-này", PRESENCE_TTL_MS), true, "lease tài khoản hết TTL, nhận lại được");
    await presenceBackend.releaseLease("account:kill", "tiến-trình-này");
    const after = new FriendHub(presenceBackend); await after.ready;
    assert.equal(after.blocked(2, 1), false, "mục bạn bè của tiến trình chết không nạp");
    after.enter(3, "sess-3", "Đới Mộc Bạch", row([])); await after.settled();
    const doc = await presenceBackend.getJson<Record<string, unknown>>("friend:state");
    assert.deepEqual(Object.keys(doc ?? {}), ["3"], "mục của tiến trình chết bị dọn khỏi tài liệu");
    after.leave(3, "sess-3"); await after.settled(); after.close();
    console.log("✓ Redis: TTL hết hạn, lease tài khoản nhả, mục bạn bè của tiến trình chết bị dọn");
  } catch (e) {
    console.error("✗", e); process.exitCode = 1;
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await presenceBackend.delete("arena:live"); await presenceBackend.delete("friend:state");
    await presenceBackend.close();
    process.exit(process.exitCode ?? 0);
  }
}
