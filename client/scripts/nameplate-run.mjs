// Chụp chuỗi khung nhân vật CHẠY cắt ngang đàn hồn thú (nhãn phải dính đầu ở mọi khung). Mã thật, server RAM riêng; ảnh ra NAMEPLATE_OUTPUT.
// Dùng: NAMEPLATE_OUTPUT=<thư mục> NAMEPLATE_PREFIX=truoc|sau node client/scripts/nameplate-run.mjs
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.NAMEPLATE_OUTPUT ?? "nameplate-run"), prefix = process.env.NAMEPLATE_PREFIX ?? "sau";
const children = [];
let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => { const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); }); });
function start(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, detached: process.platform !== "win32", env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: "ignore" });
  children.push(child);
}
async function ready(url) { for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); } throw new Error(`Không mở được ${url}`); }

try {
  await mkdir(out, { recursive: true });
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => { const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json(); assert.ok(r.ok, d.error); return d; };
  const { token } = await post("/api/login", { name: "Run " + Date.now().toString(36).slice(-5), password: "C9-local-preview!" });
  await post("/api/looks", { token, sex: 1, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
  browser = await chromium.launch({ headless: true, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.on("pageerror", (e) => console.error("[trình duyệt]", e.message));
  await page.addInitScript((t) => { localStorage.setItem("shh-token", t); localStorage.setItem("shh-onboard-v1", "1"); }, token);
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + "\nconst c9Create = GameScene.prototype.create; GameScene.prototype.create = function(...args) { window.__c9Scene = this; return c9Create.apply(this, args); };" });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__c9Scene?.players.size > 0);
  for (let i = 0; i < 4; i++) { await page.getByRole("button", { name: "Bỏ qua" }).first().click({ timeout: 1500 }).catch(() => {}); await sleep(400); }
  await sleep(1500);
  // Đàn hồn thú đứng yên thành hai hàng trước mặt nhân vật; nhân vật chạy xuyên qua giữa.
  const species = ["dien_thu", "hoi_vu_tuoc", "nhu_cot_tho_hoang", "dien_thu", "hoi_vu_tuoc", "nhu_cot_tho_hoang"];
  const origin = await page.evaluate(() => { const p = window.__c9Scene.room.state.players.get(window.__c9Scene.me); return { x: p.x, y: p.y }; });
  const places = [[30, -10], [45, 14], [70, -16], [85, 10], [105, -6], [125, 16]];
  await page.evaluate(({ species, places }) => { species.forEach((sp, i) => window.__c9Scene.room.send("test", { op: "beast", species: sp, dx: places[i][0], dy: places[i][1] })); }, { species, places });
  await page.waitForFunction((n) => window.__c9Scene.room.state.beasts.size >= n, species.length);
  await sleep(800);
  await page.screenshot({ path: resolve(out, `nhan-chay-${prefix}-0.png`) });
  await page.keyboard.down("d");
  const clip = { x: 160, y: 100, width: 640, height: 340 };
  for (let i = 1; i <= 6; i++) { await sleep(60); await page.screenshot({ path: resolve(out, `nhan-chay-${prefix}-${i}.png`), clip }); }
  await page.keyboard.up("d");
  console.log("xong", out, origin);
} finally {
  await browser?.close();
  for (const child of children) { try { process.kill(process.platform === "win32" ? child.pid : -child.pid, "SIGTERM"); } catch {} }
}
