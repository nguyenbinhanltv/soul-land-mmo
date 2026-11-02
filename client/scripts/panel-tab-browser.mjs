// #1675: mở bảng bằng phím tắt (V B H K L M, và bảng Tự Động) thì Tab đi qua nút trong bảng, không đổi mục tiêu game; Esc đóng rồi Tab lại đổi mục tiêu.
// Game thật (server RAM + vite riêng, Chromium `--mute-audio`), 4 cỡ màn × 3 cỡ chữ. `TAB_SOFT=1`: chỉ in lỗi (chụp "trước"); `TAB_OUTPUT`: thư mục ảnh; `TAB_PREFIX`: tiền tố ảnh.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.TAB_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "panel-tab-")));
const prefix = process.env.TAB_PREFIX ?? "sau", soft = process.env.TAB_SOFT === "1";
const children = [];
let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
function start(args, env, cwd = root) {
  const c = spawn(process.execPath, args, { cwd, env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(c);
  let log = ""; for (const s of [c.stdout, c.stderr]) s.on("data", (d) => { log = (log + d).slice(-6000); });
  c.on("exit", (code) => { if (code) console.error(log); });
}
function stop() {
  for (const c of children) if (c.exitCode === null && c.pid) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(c.pid), "/T", "/F"]); else c.kill("SIGTERM");
  }
}
const watchdog = setTimeout(() => { stop(); process.exit(1); }, 270000);
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw Error(`Không mở được ${url}`);
}
// [phím, id phần tử bảng]; "auto" mở bằng hàm của bảng Tự Động sau một lần bấm phím (T là bật / tắt tự săn, không phải bảng).
const PANELS = [["KeyV", "roster"], ["KeyB", "bag"], ["KeyH", "char"], ["KeyK", "reso"], ["KeyL", "friends"], ["KeyM", "mapview"], ["auto", "autoPanel"]];
const problems = [];
try {
  await mkdir(out, { recursive: true });
  const api = `http://127.0.0.1:${await port()}`, webPort = await port(), web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: api.split(":").at(-1), GAME_TEST: "1" });
  start(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api }, resolve(root, "client"));
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, data) => { const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); assert.ok(r.ok); return r.json(); };
  const { token } = await post("/api/login", { name: `TB ${Date.now().toString(36).slice(-6)}`, password: "Tab-bang-local!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || "chrome", args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(15000);
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((t) => { localStorage.setItem("shh-token", t); localStorage.setItem("soul-land-audio-v1", JSON.stringify({ muted: true })); }, token);
  await page.route("**/private/**", (route) => route.fulfill({ status: 404, body: "" }));
  // Đếm số lần game "đổi mục tiêu" (Tab ngoài bảng); không đổi logic.
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `
const tbCreate = GameScene.prototype.create;
GameScene.prototype.create = function(...a) {
  window.__tb = { cycle: 0 };
  const o = this.cycleTarget; this.cycleTarget = function(...x) { window.__tb.cycle++; return o.apply(this, x); };
  return tbCreate.apply(this, a);
};` });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.locator(".g-skip").waitFor({ timeout: 60000 });
  await page.locator(".g-skip").click();
  await sleep(500);
  const setSize = async (w, h, fs) => {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(async (f) => { const { setA11yPrefs } = await import("/src/a11y.ts"); setA11yPrefs({ font: f }); }, fs);
    await sleep(200);
  };
  const ids = PANELS.map((p) => p[1]);
  const where = () => page.evaluate((list) => {
    const a = document.activeElement;
    return { tag: a ? `${a.tagName}${a.id ? "#" + a.id : ""}` : "null", in: list.find((id) => { const e = document.getElementById(id); return e && !e.hidden && a && e.contains(a); }) ?? "", cycle: window.__tb.cycle };
  }, ids);
  // Esc chỉ khi còn bảng / menu mở (Esc lúc không có gì mở sẽ mở Menu).
  const anyOpen = () => page.evaluate((list) => [...list, "hub"].some((id) => { const e = document.getElementById(id); return e && !e.hidden; }), ids);
  const closeAll = async () => { for (let i = 0; i < 6 && await anyOpen(); i++) { await page.keyboard.press("Escape"); await sleep(80); } };
  const tabs = async (shift) => { for (let i = 0; i < 4; i++) { await page.keyboard.press(shift ? "Shift+Tab" : "Tab"); await sleep(20); } };
  for (const [w, h] of [[640, 360], [844, 390], [960, 540], [1280, 720]]) for (const fs of [0, 1, 2]) {
    await setSize(w, h, fs);
    for (const [key, id] of PANELS) {
      const tag = `${w}×${h}, chữ ${fs}, ${id}`;
      await closeAll();
      await page.evaluate(() => document.activeElement?.blur());
      if (key === "auto") { await page.keyboard.press("ShiftLeft"); await page.evaluate(async () => { const m = await import("/src/autoPanel.ts"); m.toggleAutoPanel(); }); }
      else await page.keyboard.press(key);
      if (!await page.locator(`#${id}:not([hidden])`).waitFor({ timeout: 3000 }).then(() => true).catch(() => false)) { problems.push(`${tag}: bảng không mở`); continue; }
      await sleep(120);
      const c0 = (await where()).cycle;
      await tabs(false);
      const w1 = await where();
      if (w1.in !== id) problems.push(`${tag}: sau Tab ×4 tiêu điểm ở ${w1.tag}, không nằm trong bảng`);
      if (w1.cycle !== c0) problems.push(`${tag}: Tab đổi mục tiêu game ${w1.cycle - c0} lần`);
      await tabs(true);
      const w2 = await where();
      if (w2.in !== id) problems.push(`${tag}: Shift+Tab ra khỏi bảng (${w2.tag})`);
      if (w2.cycle !== c0) problems.push(`${tag}: Shift+Tab đổi mục tiêu game`);
      if (w === 1280 && fs === 0) await page.screenshot({ path: resolve(out, `${prefix}-${w}x${h}-chu-${fs}-${id}.png`) });
      await page.keyboard.press("Escape"); await sleep(120);
      if (await page.locator(`#${id}:visible`).count()) { problems.push(`${tag}: Esc không đóng bảng`); continue; }
      const w3 = await where();
      if (w3.in) problems.push(`${tag}: đóng bảng mà tiêu điểm còn trong bảng`);
      await page.keyboard.press("Tab");
      const w4 = await where();
      if (w4.cycle !== w3.cycle + 1) problems.push(`${tag}: sau khi đóng, Tab không phải đổi mục tiêu (${w4.cycle - w3.cycle})`);
    }
  }
  // Chuột: mở Túi bằng bấm chuột (Menu → Túi) thì tiêu điểm KHÔNG bị kéo vào bảng.
  await setSize(1280, 720, 0); await closeAll();
  await page.locator("#hubBtn").click(); await page.locator('[data-hub="bag"]').click();
  await page.locator("#bag:not([hidden])").waitFor(); await sleep(200);
  const wm = await where();
  if (wm.in) problems.push(`mở Túi bằng chuột mà tiêu điểm bị kéo vào bảng (${wm.tag})`);
  await closeAll();
  if (problems.length) console.log(problems.join("\n"));
  if (!soft) assert.deepEqual(problems, [], "Tab trong bảng mở bằng phím");
  assert.deepEqual(errors, []);
  console.log(`✓ Mở bảng bằng phím thì Tab xoay trong bảng (V B H K L M, Tự Động), 4 cỡ màn × 3 cỡ chữ: ${out}`);
} finally { clearTimeout(watchdog); await browser?.close(); stop(); }
