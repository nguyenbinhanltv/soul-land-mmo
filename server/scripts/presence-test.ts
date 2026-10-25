import assert from "node:assert/strict";
import { createPresenceBackend, presenceBackend, isRedisFailure } from "../src/presence.ts";
import { claimBuyback, editBuyback } from "../src/rooms/MapRoom.ts";
import { arenaDeliver, arenaEnqueue, arenaQueued, arenaLiveOpen, arenaLivePhase, arenaLiveHold, arenaLiveHeld, arenaLiveWatch, arenaLiveUnwatch, arenaLiveOpenList, arenaLiveRelease, arenaLiveClose } from "../src/rooms/arenaQueue.ts";
import { FriendHub, friends } from "../src/friends.ts";

// #561: chỉ lỗi mang dấu hiệu ioredis mới được coi là lỗi Redis; mã socket chung (pg, fetch) vẫn phải làm server thoát có kiểm soát.
assert.equal(isRedisFailure(Object.assign(new Error("Reached the max retries per request limit (which is 2)."), { name: "MaxRetriesPerRequestError" })), true);
assert.equal(isRedisFailure(new Error("Connection is closed.")), true);
assert.equal(isRedisFailure(Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" })), false);
assert.equal(isRedisFailure(Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" })), false);
console.log("✓ isRedisFailure: chỉ nhận dấu hiệu ioredis, không nhận mã socket chung");

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
  const sides = [{ name: "A", elo: 1000 }, { name: "B", elo: 1000 }];
  await arenaLiveOpen({ roomId: "r1", mode: "1v1", sides, phase: "wait", secs: 30 });
  assert.deepEqual(await arenaLiveOpenList(), [], "pha chờ chưa mở cho người xem");
  assert.equal(await arenaLiveHold("r1", 5, Date.now() + 60_000, 2), "gone");
  await arenaLivePhase("r1", "fight", 90);
  const [live] = await arenaLiveOpenList();
  assert.ok(live.roomId === "r1" && live.watchers === 0 && live.secs > 80 && live.secs <= 90);
  const holds = await Promise.all([5, 6, 7].map((acc) => arenaLiveHold("r1", acc, Date.now() + 60_000, 2)));
  assert.equal(holds.filter((h) => typeof h === "object").length, 2, "chỗ xem tối đa 2 dù ba người giành cùng lúc");
  assert.equal(holds.filter((h) => h === "full").length, 1);
  await arenaLiveOpen({ roomId: "r2", mode: "2v2", sides, phase: "fight", secs: 30 });
  assert.equal(await arenaLiveHold("r2", 5, Date.now() + 60_000, 2), "other", "một tài khoản chỉ xem một trận");
  assert.equal(await arenaLiveHeld("r1", 5), true);
  await arenaLiveWatch("r1", "sess-5", 5);
  assert.equal((await arenaLiveOpenList()).find((l) => l.roomId === "r1")?.watchers, 1);
  await arenaLiveUnwatch("r1", "sess-5");
  await arenaLiveRelease("r1", 6);
  assert.equal(await arenaLiveHeld("r1", 6), false);
  await arenaLiveClose("r1"); await arenaLiveClose("r2");
  assert.deepEqual(await arenaLiveOpenList(), []);
  await presenceBackend.putJson("arena:live", { ma: { roomId: "ma", owner: "tiến-trình-chết", mode: "1v1", sides, phase: "fight", end: Date.now() + 60_000, holds: {}, watching: {} } });
  assert.deepEqual(await arenaLiveOpenList(), [], "trận của tiến trình hết lease không hiện");
  await presenceBackend.putJson("arena:live", { qh: { roomId: "qh", owner: presenceBackend.workerId, mode: "1v1", sides, phase: "fight", end: Date.now() - 3_600_000, holds: {}, watching: {} } });
  assert.deepEqual(await arenaLiveOpenList(), [], "trận quá hạn không hiện dù chủ còn sống");
  await arenaLiveOpen({ roomId: "r3", mode: "1v1", sides, phase: "fight", secs: 30 });
  assert.deepEqual(Object.keys((await presenceBackend.getJson<Record<string, unknown>>("arena:live")) ?? {}), ["r3"], "lần ghi dọn trận ma");
  await presenceBackend.delete("arena:live");
  await arenaLivePhase("r3", "fight", 60);
  assert.deepEqual(Object.keys((await presenceBackend.getJson<Record<string, unknown>>("arena:live")) ?? {}), ["r3"], "ghi pha mở lại mục đã bị dọn");
  await arenaLiveClose("r3");
  console.log("✓ Sổ xem trận ở presence: pha, giữ chỗ nguyên tử, một trận mỗi tài khoản, dọn trận của tiến trình chết");
  console.log("✓ Mua lại: hai lần nhận cùng một món ở presence chỉ một lần được trao");
  console.log("✓ Hàng chờ đấu trường: tin found chỉ do tiến trình chủ của bên đó xử lý");
  console.log("✓ Hàng chờ đấu trường: bên cục bộ ghép trực tiếp được rollback khi đối thủ hủy");
  console.log("✓ Hàng chờ đấu trường: không lấy được khóa thì rollback và báo lỗi");

  // Bạn bè / chặn nhiều tiến trình (#326): mỗi FriendHub là một tiến trình, cùng dùng presence của `backend`.
  const p1 = new FriendHub(backend, "tiến-trình-1"), p2 = new FriendHub(backend, "tiến-trình-2");
  await Promise.all([p1.ready, p2.ready]);
  const A = { id: 1, name: "Đường Tam" }, B = { id: 2, name: "Tiểu Vũ" }, C = { id: 3, name: "Đới Mộc Bạch" };
  const online = new Set<number>(), where = (acc: number) => (online.has(acc) ? { mapId: `map-${acc}`, ch: 1 } : null);
  const row = (list: { id: number; name: string }[], fans: number[]) => ({ friends: list, blocks: [], fans });
  const seen = (hub: FriendHub, acc: number) => hub.view(acc, where).list;
  p1.enter(A.id, "sa", A.name, row([B], [B.id])); online.add(A.id);
  p2.enter(B.id, "sb", B.name, row([A], [A.id])); online.add(B.id);
  assert.deepEqual(seen(p1, A.id), [{ name: B.name, mutual: true, map: "map-2", ch: 1 }]);
  assert.deepEqual(p2.mutualOnline(B.id), [A.id]);
  assert.deepEqual(p1.mutualOnline(A.id), [B.id]);
  const rm = p2.remove(B.id, A.name);
  assert.ok(!("error" in rm) && rm.notes.some((n) => n.to[0] === A.id && !n.text), "tiến trình 2 báo A gửi lại bảng");
  assert.deepEqual(seen(p1, A.id), [{ name: B.name, mutual: false }]);
  assert.deepEqual(p1.mutualOnline(A.id), []);
  console.log("✓ Bạn bè nhiều tiến trình: bị xóa ở tiến trình khác thì thôi thấy bản đồ / kênh ngay");
  assert.ok(!("error" in p2.add(B.id, A)));
  assert.equal(seen(p1, A.id)[0].mutual, true);
  assert.equal(p1.blocked(B.id, A.id), false);
  const bl = p2.block(B.id, A);
  assert.ok(!("error" in bl) && bl.notes.some((n) => n.to[0] === A.id && !n.text));
  assert.equal(p1.blocked(B.id, A.id), true, "kiểm phía người gửi ở tiến trình 1 thấy chặn của tiến trình 2");
  assert.deepEqual(seen(p1, A.id), [{ name: B.name, mutual: false }]);
  console.log("✓ Chặn nhiều tiến trình: người gửi ở tiến trình khác thấy bị chặn, thôi thấy vị trí");
  await p2.settled();
  const p3 = new FriendHub(backend, "tiến-trình-3"); await p3.ready;
  assert.equal(p3.blocked(B.id, A.id), true);
  assert.deepEqual(p3.mutualOnline(B.id), []);
  console.log("✓ Tiến trình mở sau nạp danh sách của người đang trong game từ presence");
  assert.ok(!("error" in p1.add(A.id, C)));
  p2.enter(C.id, "sc", C.name, row([A], [])); online.add(C.id);
  assert.equal(seen(p1, A.id).find((e) => e.name === C.name)?.mutual, true);
  p2.leave(C.id, "sc"); online.delete(C.id);
  assert.equal(seen(p1, A.id).find((e) => e.name === C.name)?.mutual, true, "rời game: fans giữ đúng hai bên đã thêm nhau");
  // B sang tiến trình 3 (phiên mới, vẫn chặn A) trước khi tin rời của phiên cũ ở tiến trình 2 tới: tin rời đó không xóa phiên mới.
  p3.enter(B.id, "sb2", B.name, { friends: [], blocks: [A], fans: [] });
  await p3.settled();
  // Tin lệch thứ tự: bản cũ của phiên `sb` (đã bỏ chặn) tới sau lúc phiên `sb2` vào thì bị bỏ.
  await backend.presence.publish("friend:state", { w: "tiến-trình-2", acc: B.id, sid: "sb", v: 999, friends: [A.id], blocks: [] });
  assert.equal(p1.blocked(B.id, A.id), true, "tin cũ của phiên đã có phiên mới không bỏ chặn");
  // Tiến trình chưa biết phiên cũ: tạm có hai phiên thì gộp chặt (chặn của phiên nào cũng tính, bạn chỉ khi mọi phiên có).
  const p4 = new FriendHub(backend, "tiến-trình-4"); await p4.ready;
  await backend.presence.publish("friend:state", { w: "x", acc: B.id, sid: "sb-lạ", v: 1, friends: [A.id], blocks: [] });
  assert.equal(p4.blocked(B.id, A.id), true);
  await backend.presence.publish("friend:state", { w: "x", acc: B.id, sid: "sb-lạ", v: 2, friends: [A.id], blocks: [], gone: true });
  p4.close();
  p2.leave(B.id, "sb");
  await p2.settled();
  assert.equal(p1.blocked(B.id, A.id), true, "tin rời của phiên cũ không bỏ chặn của phiên mới");
  assert.deepEqual(Object.keys((await backend.getJson<Record<string, unknown>>("friend:state")) ?? {}).sort(), [String(A.id), String(B.id)]);
  p3.leave(B.id, "sb2"); online.delete(B.id);
  await p3.settled();
  assert.equal(p1.blocked(B.id, A.id), false);
  assert.deepEqual(seen(p1, A.id), [{ name: B.name, mutual: false }, { name: C.name, mutual: true }]);
  await backend.presence.publish("friend:state", { w: "cũ", acc: B.id, sid: "sb2", v: 1, friends: [A.id], blocks: [A.id] });
  assert.equal(p1.blocked(B.id, A.id), false, "tin cũ của phiên đã rời tới sau không dựng lại bản sao");
  const doc = await backend.getJson<Record<string, unknown>>("friend:state");
  assert.deepEqual(Object.keys(doc ?? {}), [String(A.id)]);
  // Tiến trình giữ D đã chết (mục cũ còn trong tài liệu); D vào rồi rời ở tiến trình 5: không rơi về bản sao cũ.
  const D = { id: 4, name: "Áo Tư Tạp" };
  await backend.putJson("friend:state", { ...doc, [D.id]: { y1: { sid: "y1", v: 1, friends: [A.id], blocks: [A.id], w: "tiến-trình-2" } } });
  const p5 = new FriendHub(backend, "tiến-trình-5"); await p5.ready;
  assert.equal(p5.blocked(D.id, A.id), true);
  p5.enter(D.id, "x1", D.name, row([], []));
  assert.equal(p5.blocked(D.id, A.id), false);
  p5.leave(D.id, "x1");
  await p5.settled();
  assert.equal(p5.blocked(D.id, A.id), false, "vào rồi rời ở chính tiến trình này: bản sao cũ đã kết thúc");
  assert.equal(p1.blocked(D.id, A.id), false);
  assert.deepEqual(Object.keys((await backend.getJson<Record<string, unknown>>("friend:state")) ?? {}), [String(A.id)]);
  console.log("✓ Vào lại sau khi tiến trình cũ chết: bản sao cũ của chính tài khoản kết thúc");
  // Tiến trình giữ E bị kill (hết lease, mục còn trong tài liệu): tiến trình mở sau không nạp mục đó, lần ghi kế tiếp dọn nó khỏi tài liệu.
  const E = { id: 5, name: "Ninh Vinh Vinh" };
  await backend.putJson("friend:state", { ...(await backend.getJson<object>("friend:state")), [E.id]: { z1: { sid: "z1", v: 1, friends: [A.id], blocks: [A.id], w: "tiến-trình-chết" } } });
  const p6 = new FriendHub(backend, "tiến-trình-6"); await p6.ready;
  assert.equal(p6.blocked(E.id, A.id), false, "mục của tiến trình hết lease không nạp");
  p6.enter(C.id, "sc2", C.name, row([], [])); online.add(C.id);
  await p6.settled();
  assert.deepEqual(Object.keys((await backend.getJson<Record<string, unknown>>("friend:state")) ?? {}).sort(), [String(A.id), String(C.id)]);
  p6.leave(C.id, "sc2"); online.delete(C.id);
  await p6.settled();
  console.log("✓ Dọn presence: mục bạn bè / chặn của tiến trình chết không nạp và bị xóa khỏi tài liệu");
  // Không khóa được tài liệu: ghi lại tối đa FLUSH_TRIES lần rồi bỏ, không lặp vô hạn.
  await backend.acquireLease("friend:state:lock", "kẹt", 60_000);
  const p7 = new FriendHub(backend, "tiến-trình-7"); await p7.ready;
  p7.enter(C.id, "sc3", C.name, row([], []));
  const t0 = Date.now(); await p7.settled();
  assert.ok(Date.now() - t0 < 15_000, "vòng ghi lại có giới hạn");
  await backend.releaseLease("friend:state:lock", "kẹt");
  p7.leave(C.id, "sc3"); await p7.settled();
  console.log("✓ Không khóa được tài liệu bạn bè / chặn: vòng ghi lại dừng sau số lần giới hạn");
  for (const h of [p1, p2, p3, p5, p6, p7]) h.close();
  friends.enter(9, "s9", "Một tiến trình", row([], []));
  assert.equal(await presenceBackend.getJson("friend:state"), null, "không có Redis thì không ghi presence");
  console.log("✓ Rời game ở tiến trình khác: bản sao bỏ, tài liệu presence chỉ còn người đang trong game");
} catch (e) {
  console.error("✗", e); // process.exit ở finally nuốt lỗi: in ra và trả mã lỗi
  process.exitCode = 1;
} finally {
  await backend.close();
  process.exit(process.exitCode ?? 0);
}
