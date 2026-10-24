// Redis mất rồi có lại khi 2 tiến trình server đang chạy có người chơi (#561): tiến trình KHÔNG thoát, /health báo 503 lúc mất và 200 khi có lại,
// phòng mới bị từ chối lúc mất, phục hồi vào phòng được sau khi có lại. Tự bật redis-server riêng ở cổng trống (BOT_REDIS_BIN, mặc định redis-server
// trong PATH) và hai server riêng (RAM, GAME_TEST=1), chỉ tắt đúng các PID mình bật.
// Hai server cần chung một PostgreSQL (tài khoản / token dùng chung): dùng PostgreSQL chung của bot:local (đang chạy nếu vừa chạy `npm run bot:local -- --only <nhóm> --pg`,
// cổng BOT_PG_PORT 5433) hoặc BOT_PG_URL; bài thử tạo database riêng `soulbot_outage_<pid>` (có dấu của công cụ) và xoá khi xong.
// Chạy: npm run test:presence-outage --prefix server   (OUTAGE_SECS=40 để thử Redis mất lâu hơn, mặc định 8)
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import net from "node:net";
import pg from "pg";
import { pathToFileURL } from "node:url";

const OUTAGE_MS = Number(process.env.OUTAGE_SECS ?? 8) * 1000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise<number>((resolve, reject) => {
  const s = net.createServer(); s.unref(); s.on("error", reject);
  s.listen(0, () => { const { port } = s.address() as net.AddressInfo; s.close(() => resolve(port)); });
});
const { Client } = await import(pathToFileURL(createRequire(new URL("../../client/package.json", import.meta.url)).resolve("colyseus.js")).href);

const children: ChildProcess[] = [];
const logs = new Map<ChildProcess, string>();
const stop = (c: ChildProcess) => { if (c.exitCode === null && c.signalCode === null) c.kill(); };
const spawnLogged = (cmd: string, args: string[], env: NodeJS.ProcessEnv) => {
  const c = spawn(cmd, args, { env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  logs.set(c, ""); children.push(c);
  const add = (d: Buffer) => logs.set(c, logs.get(c)! + String(d));
  c.stdout!.on("data", add); c.stderr!.on("data", add);
  return c;
};
const done = (c: ChildProcess) => new Promise<number | null>((r) => c.exitCode !== null ? r(c.exitCode) : c.once("exit", (code) => r(code)));
const bin = process.env.BOT_REDIS_BIN?.trim() || "redis-server";
const startRedis = async (port: number) => {
  const c = spawnLogged(bin, ["--port", String(port), "--bind", "127.0.0.1", "--save", "", "--appendonly", "no"], process.env);
  for (let t = 0; t < 15_000; t += 50) { if (logs.get(c)!.includes("Ready to accept connections")) return c; if (c.exitCode !== null) break; await sleep(50); }
  stop(c); throw new Error(`không bật được redis-server (${bin}): ${logs.get(c)}`);
};
const healthOf = async (port: number) => fetch(`http://127.0.0.1:${port}/health`).then(async (r) => ({ status: r.status, body: await r.json() as { ok: boolean; redis?: string } }), () => null);
const waitHealth = async (port: number, status: number, ms: number) => {
  for (let t = 0; t < ms; t += 250) { if ((await healthOf(port))?.status === status) return true; await sleep(250); }
  return false;
};
const post = async (port: number, p: string, body: unknown) => {
  const r = await fetch(`http://127.0.0.1:${port}${p}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { status: r.status, ...await r.json() as Record<string, unknown> };
};
const RUN = Date.now().toString(36);
async function account(port: number, n: string, vohon: string) {
  const l = await post(port, "/api/login", { name: `${n} ${RUN}`, password: "outage1" });
  assert.ok(l.token, `đăng nhập ${n}`);
  assert.equal((await post(port, "/api/looks", { token: l.token, sex: 0, hair: 1, hairCol: 1, outfitCol: 1 })).status, 200);
  assert.equal((await post(port, "/api/awaken", { token: l.token, vohon })).status, 200);
  return l.token as string;
}
const join = async (port: number, token: string) => { const r = await new Client(`ws://127.0.0.1:${port}`).joinOrCreate("map", { token }); r.onMessage("*", () => {}); return r; };

const adminUrl = process.env.BOT_PG_URL || `postgres://postgres@localhost:${process.env.BOT_PG_PORT ?? 5433}/postgres`;
const dbName = `soulbot_outage_${process.pid}`;
const dbUrl = (() => { const u = new URL(adminUrl); u.pathname = `/${dbName}`; return u.href; })();
const withAdmin = async <T>(fn: (c: pg.Client) => Promise<T>) => { const c = new pg.Client({ connectionString: adminUrl, connectionTimeoutMillis: 3000 }); await c.connect(); try { return await fn(c); } finally { await c.end(); } };
const cleanup = () => { for (const c of children) stop(c); };
process.on("exit", cleanup);
try {
  await withAdmin(async (c) => {
    await c.query(`CREATE DATABASE "${dbName}" ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'`);
    await c.query(`COMMENT ON DATABASE "${dbName}" IS 'tools/bot-local.mjs'`);
  }).catch((e) => { throw new Error(`không nối được PostgreSQL ${adminUrl}: ${e.message} (chạy npm run bot:local -- --only looks3 --pg trước để bật PostgreSQL chung)`); });
  const rport = await freePort(), url = `redis://127.0.0.1:${rport}`;
  let redis = await startRedis(rport);
  const servers: { port: number; proc: ChildProcess }[] = [];
  for (let i = 0; i < 2; i++) {
    const port = await freePort();
    const proc = spawnLogged(process.execPath, ["--import", "tsx", "src/index.ts"], { ...process.env, GAME_TEST: "1", PORT: String(port), REDIS_URL: url, REDIS_PREFIX: `test:outage:${RUN}`, PUBLIC_ADDRESS: `localhost:${port}`, DATABASE_URL: dbUrl });
    servers.push({ port, proc });
    // Bật lần lượt: hai server cùng chạy migration trên database trống sẽ đụng nhau.
    assert.ok(await waitHealth(port, 200, 60_000), `server cổng ${port} lên được`);
  }
  const [s1, s2] = servers;
  const tokens = [await account(s1.port, "Mat Redis A", "lam_dien_ba_vuong_long"), await account(s1.port, "Mat Redis B", "bich_lan_xa_hoang"), await account(s2.port, "Mat Redis C", "nguyet_nhan")];
  const rooms = [await join(s1.port, tokens[0]), await join(s1.port, tokens[1]), await join(s2.port, tokens[2])];
  const left: (number | null)[] = rooms.map(() => null);
  rooms.forEach((r, i) => r.onLeave((code: number) => { left[i] = code; }));
  console.log("✓ 2 server + 3 hồn sư đã vào phòng, Redis riêng cổng", rport);

  // Mất Redis: kill đúng PID mình bật.
  redis.kill(); await done(redis);
  const t0 = Date.now();
  for (const s of servers) assert.ok(await waitHealth(s.port, 503, 15_000), `/health cổng ${s.port} phải báo 503 khi Redis mất`);
  assert.equal((await healthOf(s1.port))?.body.redis, "down");
  const live = await fetch(`http://127.0.0.1:${s1.port}/live`);
  assert.equal(live.status, 200, "/live vẫn 200 khi Redis mất");
  const fresh = await account(s1.port, "Mat Redis D", "u_minh_linh_mieu");
  await assert.rejects(() => join(s1.port, fresh), "vào phòng mới khi Redis mất phải bị từ chối");
  console.log("✓ Redis mất: /health 503, /live 200, phòng mới bị từ chối");
  await sleep(Math.max(0, OUTAGE_MS - (Date.now() - t0)));
  for (const s of servers) assert.equal(s.proc.exitCode, null, `server cổng ${s.port} không được thoát khi Redis mất ${OUTAGE_MS / 1000} giây`);
  for (const s of servers) assert.ok(!/Lỗi nghiêm trọng/.test(logs.get(s.proc)!), `log server cổng ${s.port} có Lỗi nghiêm trọng:\n${logs.get(s.proc)}`);
  console.log(`✓ Redis mất ${OUTAGE_MS / 1000} giây: cả 2 tiến trình vẫn chạy, không có lỗi nghiêm trọng`);

  // Có lại: cùng cổng.
  redis = await startRedis(rport);
  for (const s of servers) assert.ok(await waitHealth(s.port, 200, 30_000), `/health cổng ${s.port} phải về 200 khi Redis có lại`);
  const again = await join(s1.port, fresh);
  assert.ok(again.sessionId, "vào phòng được lại sau khi Redis có lại");
  await again.leave();
  // Phiên cũ đã mất lease (hoặc bị đóng): vào lại cùng tài khoản không bị kẹt, không có hai phiên cùng tài khoản.
  await sleep(1500);
  for (const [i, r] of rooms.entries()) if (left[i] === null) await r.leave();
  const [a1, a2] = [await join(s1.port, tokens[0]), await join(s2.port, tokens[0])];
  await sleep(1500);
  assert.ok(!a1.connection.isOpen || !a2.connection.isOpen, "một tài khoản chỉ giữ một phiên (kick xuyên tiến trình hoạt động lại)");
  for (const r of [a1, a2]) if (r.connection.isOpen) await r.leave();
  for (const s of servers) assert.equal(s.proc.exitCode, null, "server vẫn chạy sau khi phục hồi");
  for (const s of servers) assert.ok(!/Lỗi nghiêm trọng/.test(logs.get(s.proc)!), `log server cổng ${s.port} có Lỗi nghiêm trọng:\n${logs.get(s.proc)}`);
  console.log("✓ Redis có lại: /health 200, vào phòng được, một tài khoản một phiên, server không thoát");

  // Tắt có kiểm soát vẫn thoát mã 0 (đường lưu lúc tắt không kẹt vì Redis). Windows không có SIGTERM mềm (kill = dừng ngay): bỏ qua ở đó.
  if (process.platform !== "win32") {
    for (const s of servers) s.proc.kill("SIGTERM");
    for (const s of servers) assert.equal(await done(s.proc), 0, `server cổng ${s.port} tắt mã 0`);
    console.log("✓ SIGTERM: cả hai server tắt mã 0");
  }
  for (const s of servers) assert.ok(!/Unhandled error event/.test(logs.get(s.proc)!), "kết nối ioredis nào cũng có trình nghe lỗi");
} catch (e) {
  console.error("✗", e);
  for (const [c, l] of logs) if (c.spawnfile !== bin) console.error(`--- log (PID ${c.pid}) ---\n${l.split("\n").slice(-40).join("\n")}`);
  process.exitCode = 1;
} finally {
  cleanup();
  await sleep(500);
  await withAdmin((c) => c.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`)).catch(() => {});
  process.exit(process.exitCode ?? 0);
}
