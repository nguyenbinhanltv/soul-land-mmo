// Bài khói cho các cổng chỉ-có-ở-môi-trường-test và đường lỗi nghiêm trọng (#663), chạy trong test:unit (CI, không DB):
//  1. Server giống prod (không GAME_TEST; ADMIN_ACCOUNTS trống hoặc chỉ có người khác): hook test chỉ trả `enabled:false` (kể cả crash / gmadmin /
//     give / warp, cũng là cổng của bài `testacc`), /api/test/* không có, lệnh GM của tài khoản thường bị từ chối và không đổi gì, hook không cấp quyền admin.
//  2. Đường `fatal` (GAME_TEST=1, RAM): hook crash (ném lỗi ngoài phòng / promise bị từ chối) -> client bị ngắt, server tự thoát mã ≠ 0, log có
//     lỗi kèm stack và dòng "Tắt server: đã lưu người chơi đang online". Dữ liệu còn nguyên sau khi bật lại cần PostgreSQL: `npm run bot:local -- --fatal --pg`.
// Mỗi server là một tiến trình riêng ở cổng trống, chỉ tắt đúng PID mình bật. Chạy: npm run test:gate --prefix server
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import net from "node:net";
import { pathToFileURL } from "node:url";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const freePort = () => new Promise<number>((resolve, reject) => {
  const s = net.createServer(); s.unref(); s.on("error", reject);
  s.listen(0, () => { const { port } = s.address() as net.AddressInfo; s.close(() => resolve(port)); });
});
const { Client } = await import(pathToFileURL(createRequire(new URL("../../client/package.json", import.meta.url)).resolve("colyseus.js")).href);

const children: ChildProcess[] = [];
const logs = new Map<ChildProcess, string>();
const stop = (c: ChildProcess) => { if (c.exitCode === null && c.signalCode === null) c.kill(); };
process.on("exit", () => children.forEach(stop));
const exited = (c: ChildProcess) => new Promise<number | null>((r) => c.exitCode !== null ? r(c.exitCode) : c.once("exit", (code) => r(code)));
async function startServer(env: Record<string, string>) {
  const port = await freePort();
  const base = { ...process.env, PORT: String(port) } as Record<string, string | undefined>;
  for (const k of ["DATABASE_URL", "GAME_TEST", "ADMIN_ACCOUNTS", "REDIS_URL", "NODE_OPTIONS"]) delete base[k];
  const proc = spawn(process.execPath, ["--import", "tsx", "src/index.ts"], { env: { ...base, ...env }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
  logs.set(proc, ""); children.push(proc);
  const add = (d: Buffer) => logs.set(proc, logs.get(proc)! + String(d));
  proc.stdout!.on("data", add); proc.stderr!.on("data", add);
  for (let t = 0; t < 60_000; t += 250) {
    if (proc.exitCode !== null) throw new Error(`server thoát sớm:\n${logs.get(proc)}`);
    if (await fetch(`http://127.0.0.1:${port}/health`).then((r) => r.ok, () => false)) return { port, proc };
    await sleep(250);
  }
  stop(proc); throw new Error(`server không sẵn sàng sau 60 giây:\n${logs.get(proc)}`);
}
const post = async (port: number, p: string, body: unknown) => {
  const r = await fetch(`http://127.0.0.1:${port}${p}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { status: r.status, ...await r.json().catch(() => ({})) as Record<string, unknown> };
};
const RUN = Date.now().toString(36);
const waitFor = async (fn: () => boolean, ms = 3000) => { for (let t = 0; t < ms; t += 50) { if (fn()) return true; await sleep(50); } return fn(); };
async function enter(port: number, name: string) {
  const l = await post(port, "/api/login", { name: `${name} ${RUN}`, password: "gate-test1" });
  assert.ok(l.token, `đăng nhập ${name}`);
  assert.equal((await post(port, "/api/looks", { token: l.token, sex: 0, hair: 1, hairCol: 1, outfitCol: 1 })).status, 200);
  assert.equal((await post(port, "/api/awaken", { token: l.token, vohon: "bich_lan_xa_hoang" })).status, 200);
  const room = await new Client(`ws://127.0.0.1:${port}`).joinOrCreate("map", { token: l.token });
  const replies: Record<string, unknown>[] = [], texts: string[] = [];
  room.onMessage("test", (m: Record<string, unknown>) => replies.push(m));
  room.onMessage("log", (m: { text: string }) => texts.push(m.text));
  room.onMessage("*", () => {});
  assert.ok(await waitFor(() => !!room.state.players?.get(room.sessionId), 5000), "thấy nhân vật của mình");
  const hook = async (op: string, extra: object = {}) => { const n = replies.length; room.send("test", { op, ...extra }); await waitFor(() => replies.length > n); return replies[n]; };
  const gm = async (cmd: string) => { const n = texts.length; room.send("gm", { cmd }); await waitFor(() => texts.length > n); return texts.slice(n).join(" | "); };
  return { room, hook, gm, me: () => room.state.players.get(room.sessionId) };
}
const tests: [string, () => Promise<void>][] = [];
const test = (name: string, fn: () => Promise<void>) => tests.push([name, fn]);

test("giống prod: hook test tắt hẳn, GM từ chối người không quyền (cổng của testacc / gm)", async () => {
  const s = await startServer({ ADMIN_ACCOUNTS: "999999999" });
  try {
    assert.equal((await post(s.port, "/api/test/legacy-looks", { token: "x" })).status, 404, "/api/test/legacy-looks không có khi không GAME_TEST");
    const A = await enter(s.port, "Cong A");
    const lv0 = A.me().level;
    assert.equal((await A.hook("ping"))?.enabled, false, "hook test chỉ trả enabled:false");
    for (const op of ["gmadmin", "give", "warp", "kill", "beast", "crash"])
      assert.equal((await A.hook(op, { on: true, code: "hoi_huyet_dan", mapId: "tinh_dau_ngoai_vi", reject: false }))?.enabled, false, `hook ${op} bị tắt`);
    assert.match(await A.gm("level 100"), /Không có quyền/, "tài khoản thường: lệnh GM bị từ chối (đã có admin khác)");
    assert.match(await A.gm("coin 999999"), /Không có quyền/, "hook gmadmin không cấp quyền");
    assert.equal(A.me().level, lv0, "lệnh bị từ chối không đổi cấp");
    await sleep(1200);
    assert.equal(s.proc.exitCode, null, "hook crash không làm server thoát khi không GAME_TEST");
    await A.room.leave();
  } finally { stop(s.proc); }
  const noAdmin = await startServer({});
  try {
    const B = await enter(noAdmin.port, "Cong B");
    assert.match(await B.gm("level 100"), /Không có quyền/, "ADMIN_ACCOUNTS trống: GM tắt hẳn");
    await B.room.leave();
  } finally { stop(noAdmin.proc); }
});

for (const kind of ["throw", "reject"] as const) test(`fatal (${kind}): đóng sạch, lưu người chơi, thoát mã ≠ 0`, async () => {
  const s = await startServer({ GAME_TEST: "1" });
  try {
    const A = await enter(s.port, `Cong F${kind[0]}`);
    assert.equal((await A.hook("ping"))?.enabled, true, "GAME_TEST=1 bật hook");
    let left: number | null = null; A.room.onLeave((c: number) => { left = c; });
    assert.equal((await A.hook("crash", { reject: kind === "reject" }))?.op, "crash");
    const code = await Promise.race([exited(s.proc), sleep(20_000).then(() => "treo" as const)]);
    assert.notEqual(code, "treo", `server không thoát sau 20 giây:\n${logs.get(s.proc)}`);
    assert.ok(code !== 0 && code !== null, `mã thoát ≠ 0 (nhận ${code})`);
    const log = logs.get(s.proc)!, msg = kind === "reject" ? "promise bị từ chối không ai bắt (#270)" : "lỗi cố ý ngoài phòng (#270)";
    assert.match(log, /Lỗi nghiêm trọng ngoài phòng/, "log có Lỗi nghiêm trọng");
    assert.ok(log.includes(msg) && /\n\s+at /.test(log.slice(log.indexOf(msg))), "log có lỗi gốc kèm stack");
    assert.match(log, /Tắt server: đã lưu người chơi đang online/, "log: đã lưu người chơi trước khi thoát");
    assert.ok(await waitFor(() => left !== null), "client bị ngắt kết nối");
  } finally { stop(s.proc); }
});

let fails = 0;
for (const [name, fn] of tests) {
  try { await fn(); console.log(`✓ ${name}`); } catch (e) { fails++; console.error(`✗ ${name}\n  ${(e as Error).message}`); }
}
children.forEach(stop);
process.exit(fails ? 1 : 0);
