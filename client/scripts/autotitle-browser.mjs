// Danh hiệu trên đầu nhân vật không đổi chữ / màu khi tự săn (#1811); chip "● Tự động" riêng, giữ tên tông môn.
// Game thật trên server RAM riêng. Ảnh + FPS 40 người: `AUTOTITLE_BASE=1` chạy lại với GameScene của bản trước (merge-base với origin/main) để so.
//   node client/scripts/autotitle-browser.mjs [--fps]      # sau (HEAD)
//   AUTOTITLE_BASE=1 node client/scripts/autotitle-browser.mjs [--fps]   # trước
// Trường tự săn / tông / danh hiệu chỉ đặt ở state phía trình duyệt (cảnh chỉ đọc state để vẽ); server không đổi.
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { Client } from "colyseus.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const base = process.env.AUTOTITLE_BASE === "1", fps = process.argv.includes("--fps");
const out = resolve(process.env.AUTOTITLE_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "autotitle-")));
const tag = base ? "truoc" : "sau";
const children = [], bots = [];
let browser, saved = null;
const scenePath = resolve(root, "client/src/scenes/GameScene.ts");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => { const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); }); });
function start(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child); let log = "";
  for (const s of [child.stdout, child.stderr]) s.on("data", (d) => { log = (log + d).slice(-8000); });
  child.on("exit", (code) => { if (code) console.error(log); });
}
async function ready(url) { for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); } throw new Error(`Không mở được ${url}`); }

try {
  await mkdir(out, { recursive: true });
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => { const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json(); assert.ok(r.ok, d.error); return d; };
  const run = Date.now().toString(36).slice(-5);
  async function account(i) {
    const { token } = await post("/api/login", { name: `AT ${String(i).padStart(2, "0")} ${run}`, password: "AT-local-preview!" });
    await post("/api/looks", { token, sex: i % 2, hair: 0, hairCol: 0, outfitCol: 0 });
    await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
    return { token };
  }
  const owner = await account(99);
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio", "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (e) => console.error("[trình duyệt]", e.message));
  await page.addInitScript(({ token }) => localStorage.setItem("shh-token", token), owner);
  const hook = "\nconst atCreate = GameScene.prototype.create; GameScene.prototype.create = function(...a) { window.__at = this; window.__setAutoStatus = setAutoStatus; return atCreate.apply(this, a); };";
  if (base) { // vite phục vụ từ đĩa: tạm thay GameScene.ts bằng bản trước, khôi phục ở finally
    const mb = execFileSync("git", ["merge-base", "HEAD", "origin/main"], { cwd: root }).toString().trim();
    saved = await readFile(scenePath, "utf8");
    await writeFile(scenePath, execFileSync("git", ["show", `${mb}:client/src/scenes/GameScene.ts`], { cwd: root, maxBuffer: 1 << 26 }).toString("utf8"));
  }
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()) + hook });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__at?.players.size > 0 && !document.getElementById("hud")?.hidden, null, { timeout: 30000 });
  for (let i = 0; i < 4; i++) { const b = page.locator("#onboard:not([hidden]) .ob-skip, .guide:not([hidden]) button:has-text(\"Bỏ qua\")").first(); if (!(await b.isVisible().catch(() => false))) break; await b.click({ timeout: 2000 }).catch(() => {}); await sleep(300); }

  const client = new Client(api.replace("http", "ws"));
  const nBots = fps ? 40 : 2;
  for (let i = 0; i < nBots; i++) {
    const a = await account(i);
    const room = await client.joinOrCreate("map", { token: a.token, mapId: "thanh_hon_thon" });
    room.onMessage("*", () => {}); bots.push(room);
  }
  await page.waitForFunction((n) => window.__at.players.size === n + 1, nBots);
  // Đặt hai bot cạnh chủ để chụp: bot 0 tự săn + tông + danh hiệu cao, bot 1 thường.
  const me = await page.evaluate(() => { const s = window.__at, p = s.room.state.players.get(s.me); return { x: p.x, y: p.y }; });
  bots[0].send("test", { op: "goto", x: me.x + 60, y: me.y + 6 }); bots[1].send("test", { op: "goto", x: me.x - 60, y: me.y + 6 });
  await sleep(800);
  // Chủ và bot 0: danh hiệu bậc cao + tông + tự săn (chỉ phía trình duyệt).
  const ids = await page.evaluate((sid) => {
    const s = window.__at, st = s.room.state.players;
    const set = (id, o) => { const p = st.get(id); Object.assign(p, o); };
    const other = [...st.keys()].filter((k) => k !== s.me);
    set(s.me, { level: 95, titleId: "cap_10", tong: 1, auto: true });
    set(other[0], { level: 95, titleId: "cap_10", tong: 1, auto: true });
    return { me: s.me, other };
  });
  const snap = () => page.evaluate(() => {
    const s = window.__at, v = s.players.get(s.me), o = s.players.get([...s.players.keys()].find((k) => k !== s.me));
    const t = (x) => x ? { text: x.text, color: x.style.color } : null;
    return { title: t(v.title), tong: t(v.tongT), auto: t(v.autoT), other: { title: t(o.title), tong: t(o.tongT), auto: t(o.autoT) } };
  });
  const states = [["patrol", "đi dạo", {}], ["fight", "đang đánh", { n: "Sói Xám" }], ["rest", "đứng chờ", {}], ["loot", "nhặt", { n: "Hồn Cốt" }]];
  const seen = [];
  for (const [k, name, extra] of states) {
    await page.evaluate(([k, extra]) => window.__setAutoStatus({ k, rate: null, ...extra }), [k, extra]);
    await sleep(500);
    const s = await snap(); seen.push(s);
    await page.screenshot({ path: resolve(out, `${tag}-${k}.png`), clip: { x: 340, y: 100, width: 600, height: 360 } });
    console.log(tag, name, JSON.stringify(s));
  }
  if (!base) {
    for (const s of seen) {
      assert.equal(s.title.text, seen[0].title.text, "danh hiệu không đổi chữ theo trạng thái tự săn");
      assert.equal(s.title.color, seen[0].title.color, "danh hiệu không đổi màu theo tự săn");
      assert.ok(!/Tự động|đánh|dạo|nhặt|chờ/i.test(s.title.text), "danh hiệu không chứa chữ trạng thái");
      assert.ok(s.tong.text && !/Tự động/.test(s.tong.text), "giữ tên tông môn, không ghép chữ tự săn");
      assert.equal(s.auto.text, "● Tự động"); assert.equal(s.other.auto.text, "● Tự động");
      assert.equal(s.other.title.text, s.title.text);
    }
    await page.evaluate((id) => { window.__at.room.state.players.get(id).auto = false; }, ids.me);
    await sleep(300);
    const off = await snap();
    assert.equal(off.auto.text, ""); assert.equal(off.title.text, seen[0].title.text); assert.equal(off.title.color, seen[0].title.color);
    await page.evaluate((id) => { window.__at.room.state.players.get(id).auto = true; }, ids.me);
  }
  if (fps) {
    // Thêm 4 người tự săn (đã có chữ) giữa đám đông rồi đo trung bình 3 lượt × 120 khung.
    await page.evaluate(() => { const st = window.__at.room.state.players; [...st.keys()].slice(2, 12).forEach((k) => Object.assign(st.get(k), { level: 95, titleId: "cap_10", tong: 2, auto: true })); });
    await sleep(500);
    const runs = [];
    for (let r = 0; r < 3; r++) runs.push(await page.evaluate(async () => {
      const f = []; let prev = performance.now();
      for (let i = 0; i < 150; i++) { await new Promise(requestAnimationFrame); const n = performance.now(); if (i >= 30) f.push(n - prev); prev = n; }
      const avg = f.reduce((a, b) => a + b, 0) / f.length; f.sort((a, b) => a - b);
      return { fps: +(1000 / avg).toFixed(1), p1: +(1000 / f[Math.floor(f.length * 0.99) - 1]).toFixed(1) };
    }));
    console.log(tag, "FPS 41 người (11 tự săn)", JSON.stringify(runs));
    await page.screenshot({ path: resolve(out, `${tag}-dong.png`) });
  }
  console.log(`autotitle-browser (${tag}): ok. Ảnh:`, out);
} finally {
  if (saved !== null) await writeFile(scenePath, saved);
  await Promise.allSettled(bots.map((b) => b.leave()));
  await browser?.close().catch(() => {});
  for (const c of children) c.kill();
}
