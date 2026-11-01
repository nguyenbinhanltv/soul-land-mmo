// Vào phòng và đổi bản đồ liên tiếp bằng game thật (Chrome, server RAM riêng): console không được có
// "onMessage() not registered" (#714: tin server gửi lúc vào phòng bị rơi) hay lỗi giải mã schema `"refId" not found` (#715).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const WARPS = Number(process.env.JOIN_WARPS ?? 12);
const TIMEOUT_MS = Number(process.env.JOIN_TIMEOUT_MS ?? 240000);
const MAPS = ["nac_dinh_thanh", "thanh_hon_thon", "thien_dau_thanh", "tinh_dau_ngoai_vi"];
const children = [];
let browser;
const killChildren = () => { for (const c of children) { try { process.platform === "win32" ? spawn("taskkill", ["/pid", String(c.pid), "/t", "/f"], { stdio: "ignore" }) : process.kill(-c.pid); } catch {} } };
// Chặn treo: cả bài quá JOIN_TIMEOUT_MS (mặc định 240 s; chạy thường ~30 s) thì tắt server / vite / Chrome rồi thoát mã 1, không để CI / máy chờ vô hạn.
const watchdog = setTimeout(() => { console.error(`join-browser quá ${TIMEOUT_MS / 1000} s (treo?): tắt tiến trình con rồi thoát`); killChildren(); process.exit(1); }, TIMEOUT_MS);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => {
  const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); });
});
function start(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, detached: process.platform !== "win32", env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  let log = "";
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (d) => { log = (log + d).slice(-12000); });
  child.on("exit", (code) => { if (code) console.error(log); });
}
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw new Error(`Không mở được ${url}`);
}

try {
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => {
    const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json(); assert.ok(r.ok, data.error); return data;
  };
  const { token } = await post("/api/login", { name: `Vao ${Date.now().toString(36).slice(-5)}`, password: "Join-local-test!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });

  browser = await chromium.launch({ headless: true, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const bad = [];
  const watch = (kind, text) => { if (/not registered for type '(?!test')|refId|Please report this issue/i.test(text)) bad.push(`${kind}: ${text}`); }; // 'test': trả lời hook warp của chính bài này
  page.on("console", (m) => watch(m.type(), m.text()));
  page.on("pageerror", (e) => { console.error("[trình duyệt]", e.message); watch("pageerror", e.message); });
  await page.addInitScript(({ token }) => localStorage.setItem("shh-token", token), { token });
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + "\nconst jbCreate = GameScene.prototype.create; GameScene.prototype.create = function(...args) { window.__jbScene = this; return jbCreate.apply(this, args); };" });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__jbScene?.players.size > 0, null, { timeout: 60000 });
  for (let i = 0; i < WARPS; i++) {
    const to = MAPS[i % MAPS.length];
    const old = await page.evaluate(() => window.__jbScene.room.roomId);
    // #1633: đứng trên truyền tống trận rồi đổi phòng thì hộp #wpbox của phòng cũ không được còn.
    await page.evaluate(() => { window.__jbScene.wpHere = "Trận thử"; const b = document.getElementById("wpbox"); b.textContent = "Truyền tống trận · Trận thử"; b.hidden = false; });
    await page.evaluate((to) => window.__jbScene.room.send("test", { op: "warp", mapId: to }), to);
    await page.waitForFunction(({ old, to }) => window.__jbScene?.room.roomId !== old && window.__jbScene.mapId === to && window.__jbScene.players.size > 0, { old, to }, { timeout: 60000 });
    await sleep(300);
    assert.equal(await page.evaluate(() => document.getElementById("wpbox").hidden), true, `#wpbox còn hiện sau khi đổi sang ${to}`);
    assert.equal(await page.evaluate(() => window.__jbScene.wpHere), null, `wpHere còn sót sau khi đổi sang ${to}`);
  }
  // Tin riêng lúc vào phòng phải tới được cảnh: khung tổ đội đã có dữ liệu.
  await page.waitForFunction(() => window.__jbScene.party, null, { timeout: 10000 });
  assert.deepEqual(bad, [], `Console có lỗi vào phòng:\n${bad.join("\n")}`);
  console.log(`✓ ${WARPS} lần đổi bản đồ, console không có cảnh báo onMessage / lỗi refId`);
} finally {
  clearTimeout(watchdog);
  await browser?.close().catch(() => {});
  killChildren();
}
