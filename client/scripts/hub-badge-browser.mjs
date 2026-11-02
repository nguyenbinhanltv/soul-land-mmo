// #1638: huy hiệu 魂 (#hubBtn) và các phần HUD khác không chặn nút đầu bảng khi bảng toàn màn mở (hit-test tâm nút), bằng game thật, Chrome tắt tiếng.
// 4 cỡ màn × 3 cỡ chữ (a11y-fs-*) × các bảng. Điều khiển "đầu bảng" = nút / ô chọn thấy được trong 96 px trên cùng của bảng, và nút "Sắp xếp" của Túi;
// tâm của nó phải trúng chính nó (elementFromPoint), không phải #hubBtn hay phần HUD khác. `BADGE_SOFT=1` chỉ in lỗi (lượt "trước"); `BADGE_OUTPUT` thư mục ảnh.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.BADGE_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "hub-badge-")));
const soft = process.env.BADGE_SOFT === "1";
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
const watchdog = setTimeout(() => { stop(); process.exit(1); }, 420000);
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw Error(`Không mở được ${url}`);
}
// [thẻ Menu (data-hub), bộ chọn bảng]
const PANELS = [["bag", "#bag"], ["char", "#char"], ["vohon", "#roster"], ["mail", "#mail"], ["achv", "#achv"], ["calendar", "#calendar"], ["welfare", "#welfare"]];
const OPEN = "#bag:visible,#char:visible,#roster:visible,#mail:visible,#achv:visible,#calendar:visible,#welfare:visible,#hub:visible,.ui2-screen:visible";
const problems = [];
try {
  await mkdir(out, { recursive: true });
  const api = `http://127.0.0.1:${await port()}`, webPort = await port(), web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: api.split(":").at(-1), GAME_TEST: "1" });
  start(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api }, resolve(root, "client"));
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, data) => { const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); assert.ok(r.ok); return r.json(); };
  const { token } = await post("/api/login", { name: `HB ${Date.now().toString(36).slice(-6)}`, password: "Huy-hieu-local!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || "chrome", args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(15000);
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((t) => { localStorage.setItem("shh-token", t); localStorage.setItem("soul-land-audio-v1", JSON.stringify({ muted: true })); }, token);
  await page.route("**/private/**", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.locator(".g-skip").waitFor({ timeout: 60000 });
  await page.locator(".g-skip").click();
  const skipOnboard = () => page.evaluate(() => document.querySelector("#onboard .ob-skip")?.click());
  await skipOnboard();
  const setSize = async (w, h, fs) => {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(async (f) => { const { setA11yPrefs } = await import("/src/a11y.ts"); setA11yPrefs({ font: f }); }, fs);
    await sleep(200);
  };
  const closeAll = async () => { for (let i = 0; i < 4 && await page.locator(OPEN).count(); i++) { await page.keyboard.press("Escape"); await sleep(120); } };
  // Điều khiển đầu bảng bị chặn: tâm không trúng chính nó (hoặc con / cha của nó). Chỉ xét điều khiển thật sự thấy được trên màn hình.
  const blocked = (sel) => page.evaluate((s) => {
    const panel = document.querySelector(s), pr = panel.getBoundingClientRect(), bad = [];
    const label = (e) => `${e.tagName.toLowerCase()}${e.id ? "#" + e.id : ""}${typeof e.className === "string" && e.className.trim() ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
    const clipped = (e, r) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { if (getComputedStyle(p).overflow === "visible") continue; const q = p.getBoundingClientRect(); if (r.right <= q.left || r.left >= q.right || r.bottom <= q.top || r.top >= q.bottom) return true; } return false; };
    const ctrls = [...panel.querySelectorAll("button, select, input, [role=tab]")].filter((e) => {
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none" && (r.top - pr.top < 96 || e.classList.contains("bsort")) && !clipped(e, r);
    });
    for (const e of ctrls) {
      const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
      const hit = document.elementFromPoint(x, y);
      if (hit && !e.contains(hit) && !hit.contains(e)) bad.push(`${label(e)} "${(e.textContent || e.title || "").trim().slice(0, 14)}" bị ${label(hit)} chặn`);
    }
    return { count: ctrls.length, bad };
  }, sel);
  for (const [w, h] of [[640, 360], [960, 540], [1280, 720], [1920, 1080]]) for (const fs of [0, 1, 2]) {
    await setSize(w, h, fs);
    for (const [hub, sel] of PANELS) {
      const tag = `${w}×${h}, chữ ${fs}, ${hub}`;
      await closeAll(); await skipOnboard();
      // Mở Hub bằng chính huy hiệu (hoặc phím Esc khi huy hiệu đang ẩn), rồi chọn thẻ.
      await page.keyboard.press("Escape"); await sleep(80);
      if (!await page.locator("#hub:visible").count()) await page.locator("#hubBtn").click({ force: true }).catch(() => {});
      await page.locator(`[data-hub="${hub}"]`).click({ force: true, timeout: 3000 }).catch(() => {});
      if (!await page.locator(`${sel}:not([hidden])`).first().isVisible().catch(() => false)) { problems.push(`${tag}: không mở được bảng để đo`); continue; }
      await sleep(250);
      const m = await blocked(sel);
      if (hub === "bag") assert.ok(m.count > 0, `${tag}: có điều khiển đầu bảng để đo`);
      for (const b of m.bad) problems.push(`${tag}: ${b}`);
      if (hub === "bag" && fs === 2) await page.screenshot({ path: resolve(out, `${w}x${h}-chu-${fs}-tui.png`) });
    }
  }
  await closeAll();
  if (problems.length) console.log(problems.join("\n"));
  if (!soft) assert.deepEqual(problems, [], "nút đầu bảng bị 魂 / HUD chặn hoặc bảng không mở được");
  assert.deepEqual(errors, []);
  console.log(`✓ Nút đầu bảng không bị 魂 / HUD chặn, 4 cỡ màn × 3 cỡ chữ: ${out}`);
} finally { clearTimeout(watchdog); await browser?.close(); stop(); }
