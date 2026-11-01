// #1601: thẻ Làm quen không che nội dung bảng toàn màn (Túi, Hồn sư, Thư, Thành Tựu, Đội hình) bằng game thật, Chrome tắt tiếng.
// Đo hộp chồng nhau (thẻ #onboard với bảng đang mở) ở 4 cỡ màn × 3 cỡ chữ. `COVER_PREFIX=truoc` đổi tiền tố ảnh; `COVER_SOFT=1` chỉ in lỗi (chụp "trước"); `COVER_OUTPUT` là thư mục ảnh.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.COVER_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "onboard-cover-")));
const prefix = process.env.COVER_PREFIX ?? "sau", soft = process.env.COVER_SOFT === "1";
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
const PANELS = [["char", "#char"], ["bag", "#bag"], ["mail", "#mail"], ["achv", "#achv"], ["vohon", "#roster"]];
const problems = [];
try {
  await mkdir(out, { recursive: true });
  const api = `http://127.0.0.1:${await port()}`, webPort = await port(), web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: api.split(":").at(-1), GAME_TEST: "1" });
  start(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api }, resolve(root, "client"));
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, data) => { const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); assert.ok(r.ok); return r.json(); };
  const name = `CV ${Date.now().toString(36).slice(-6)}`;
  const { token } = await post("/api/login", { name, password: "Che-bang-local!" });
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
  await page.locator(".g-skip").click(); // bỏ hướng dẫn điều khiển → Làm quen bước 1 bắt đầu
  await page.locator("#onboard:not([hidden])").waitFor();
  const setSize = async (w, h, fs) => {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(async (f) => { const { setA11yPrefs } = await import("/src/a11y.ts"); setA11yPrefs({ font: f }); }, fs);
    await sleep(200);
  };
  const openPanel = async (hub, sel) => {
    await page.locator("#hubBtn").click();
    await page.locator(`[data-hub="${hub}"]`).click();
    await page.locator(`${sel}:not([hidden])`).waitFor();
    await sleep(350); // đủ một nhịp tick 250 ms của onboard
  };
  const closePanel = async (sel) => {
    for (let i = 0; i < 3 && await page.locator(`${sel}:visible`).count(); i++) { await page.keyboard.press("Escape"); await sleep(120); }
    await page.locator(`${sel}:visible`).waitFor({ state: "hidden" });
  };
  // Thẻ "che" bảng khi hai hộp giao nhau VÀ thẻ nằm trên bảng (z-index thẻ >= z-index bảng; elementFromPoint không dùng được vì #hud pointer-events:none).
  const rects = (sel) => page.evaluate((s) => {
    const pe = document.querySelector(s), o = document.querySelector("#onboard"), p = pe.getBoundingClientRect(), c = o.getBoundingClientRect();
    const w = Math.min(p.right, c.right) - Math.max(p.left, c.left), h = Math.min(p.bottom, c.bottom) - Math.max(p.top, c.top);
    const area = w > 0 && h > 0 && !o.hidden ? w * h : 0;
    const z = (e) => Number.parseInt(getComputedStyle(e).zIndex, 10) || 0;
    return { covers: area > 0 && z(o) >= z(pe), area, zCard: z(o), zPanel: z(pe), cover: o.dataset.cover === "1", h: c.height, step: o.querySelector(".ob-head b")?.textContent ?? "" };
  }, sel);
  // Luồng thật (không phải xem lại): mở Thư khi đang bước 1 thì thẻ thu gọn và bước KHÔNG đổi; đóng thì hiện đủ; mở Đội hình thì bước 1 tự qua bước 2.
  await setSize(1280, 720, 0);
  await openPanel("mail", "#mail");
  assert.equal(await page.locator("#onboard").getAttribute("data-cover"), "1");
  assert.match(await page.locator("#onboard .ob-head b").textContent(), /bước 1\/6/);
  await closePanel("#mail");
  await sleep(350);
  assert.equal(await page.locator("#onboard").getAttribute("data-cover"), null);
  assert.ok(await page.locator("#onboard p").isVisible(), "đóng bảng thì đoạn hướng dẫn hiện lại");
  await openPanel("vohon", "#roster");
  assert.match(await page.locator("#onboard .ob-head b").textContent(), /bước 2\/6/);
  await closePanel("#roster");
  await page.evaluate(() => document.querySelector("#onboard .ob-skip")?.click());
  // Bỏ qua ngay trên dải gọn (bảng đang mở) phải tắt hẳn thẻ, kể cả sau khi đóng bảng (review #1611).
  await page.evaluate(async (n) => { const ob = await import("/src/onboard.ts"); ob.onboardReview(); }, name);
  await openPanel("mail", "#mail");
  assert.equal(await page.locator("#onboard").getAttribute("data-cover"), "1");
  await page.locator("#onboard .ob-skip").click();
  assert.equal(await page.locator("#onboard:visible").count(), 0, "Bỏ qua trên dải gọn thì thẻ tắt");
  await closePanel("#mail"); await sleep(350);
  assert.equal(await page.locator("#onboard:visible").count(), 0, "đóng bảng không làm thẻ hiện lại");
  await page.evaluate(async () => { const ob = await import("/src/onboard.ts"); ob.onboardReview(); });
  for (const [w, h] of [[640, 360], [960, 540], [1280, 720], [1920, 1080]]) for (const fs of [0, 1, 2]) {
    await setSize(w, h, fs);
    for (const [hub, sel] of PANELS) {
      // Bước 1 chờ Đội hình: mở Đội hình thì bước tự qua → đặt lại về bước 1 để mọi bảng đều đo với bước 1 (như ảnh trinh sát).
      await page.evaluate(async (n) => { const ob = await import("/src/onboard.ts"); ob.onboardReview(); }, name);
      await page.locator("#onboard:not([hidden])").waitFor();
      await openPanel(hub, sel);
      const tag = `${w}×${h}, chữ ${fs}, ${sel}`;
      const m = await rects(sel);
      if (m.covers) problems.push(`${tag}: thẻ che bảng ${Math.round(m.area)} px²`);
      if (!m.cover) problems.push(`${tag}: thẻ chưa thu gọn khi bảng mở`);
      if (m.cover && m.h > 80) problems.push(`${tag}: thẻ thu gọn cao ${Math.round(m.h)} px (> 80, không còn một dòng)`);
      if (!/bước 1\/6/.test(m.step)) problems.push(`${tag}: bước đổi (${m.step})`);
      if (fs === 1 || (w === 1280 && fs === 0)) await page.screenshot({ path: resolve(out, `${prefix}-${w}x${h}-chu-${fs}-${hub}.png`) });
      await closePanel(sel);
      await page.locator("#onboard:not([hidden])").waitFor();
      await sleep(350);
      assert.equal(await page.evaluate(() => document.querySelector("#onboard").dataset.cover ?? ""), "", `${tag}: đóng bảng thì thẻ hiện lại đủ`);
    }
  }
  if (problems.length) console.log(problems.join("\n"));
  if (!soft) assert.deepEqual(problems, [], "thẻ Làm quen che bảng đang mở");
  assert.deepEqual(errors, []);
  console.log(`✓ Thẻ Làm quen không che Hồn sư / Túi / Thư / Thành Tựu / Đội hình, 4 cỡ màn × 3 cỡ chữ: ${out}`);
} finally { clearTimeout(watchdog); await browser?.close(); stop(); }
