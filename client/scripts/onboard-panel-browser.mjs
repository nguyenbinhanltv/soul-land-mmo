// #1601: thẻ Làm quen không che bảng toàn màn (Hồn sư, Túi, Thư, Thành Tựu) khi đang mở; đo hộp chồng nhau trên game RAM thật.
// Chrome tắt tiếng, server GAME_TEST=1 ở cổng 3700–3799, không đụng cổng CDP. ONBOARD_LABEL (truoc / sau) đặt tên ảnh, ONBOARD_OUTPUT là thư mục ảnh,
// ONBOARD_SOFT=1 chỉ đo và in (để chụp bản "trước"), không assert phần chồng nhau.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.ONBOARD_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "onboard-1601-")));
const label = process.env.ONBOARD_LABEL ?? "sau", soft = process.env.ONBOARD_SOFT === "1", children = [];
let browser;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const free = (p) => new Promise(done => { const s = createServer(); s.once("error", () => done(false)); s.listen(p, "127.0.0.1", () => s.close(() => done(true))); });
async function port(from) { for (let p = from; p < 3800; p++) if (await free(p)) return p; throw Error("Hết cổng 3700–3799"); }
function start(args, env, cwd = root) {
  const c = spawn(process.execPath, args, { cwd, env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(c);
  let log = ""; for (const s of [c.stdout, c.stderr]) s.on("data", d => { log = (log + d).slice(-6000); });
  c.on("exit", code => { if (code) console.error(log); });
}
function stop() {
  for (const c of children) if (c.exitCode === null && c.pid) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(c.pid), "/T", "/F"]); else c.kill("SIGTERM");
  }
}
const watchdog = setTimeout(() => { stop(); process.exit(1); }, 300000);
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then(r => r.ok).catch(() => false)) return; await sleep(200); }
  throw Error(`Không mở được ${url}`);
}
const inter = (a, b) => { const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x), h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y); return w > 0 && h > 0 ? Math.round(w * h) : 0; };
try {
  await mkdir(out, { recursive: true });
  const apiPort = await port(3700), api = `http://127.0.0.1:${apiPort}`;
  const webPort = await port(apiPort + 1), web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api }, resolve(root, "client"));
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, data) => { const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); assert.ok(r.ok); return r.json(); };
  const name = `LQ ${Date.now().toString(36).slice(-6)}`;
  const { token } = await post("/api/login", { name, password: "Lam-quen-local!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || "chrome", args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(15000);
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(t => { localStorage.setItem("shh-token", t); localStorage.setItem("soul-land-audio-v1", JSON.stringify({ muted: true })); }, token);
  await page.route("**/private/**", route => route.fulfill({ status: 404, body: "" }));
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForSelector("#hud", { state: "visible", timeout: 60000 });
  await page.locator(".g-skip").click();
  const card = page.locator("#onboard");
  await card.waitFor({ state: "visible" });
  assert.equal(await card.locator("h4").textContent(), "Chọn võ hồn ra trận");
  // Bảng Thư / Thành Tựu cần tin server: chỉ đo hộp, nên mở bằng hàm mở của bảng sau khi gắn bộ gửi giả (bảng hiện, nội dung giữ chỗ).
  await page.evaluate(async () => {
    const m = await import("/src/mailScreen.ts"), a = await import("/src/achvScreen.ts");
    window.__ob = { m, a };
  });
  const panels = [
    { id: "char", open: () => page.keyboard.press("KeyH"), close: () => page.keyboard.press("KeyH") },
    { id: "bag", open: () => page.keyboard.press("KeyB"), close: () => page.keyboard.press("KeyB") },
    { id: "mail", open: () => page.evaluate(() => { const e = document.getElementById("mail"); e.hidden = false; window.__ob.m.openMail(); e.hidden = false; }), close: () => page.evaluate(() => window.__ob.m.closeMail()) },
    { id: "achv", open: () => page.evaluate(() => { const e = document.getElementById("achv"); e.hidden = false; window.__ob.a.openAchv(); e.hidden = false; }), close: () => page.evaluate(() => window.__ob.a.closeAchv()) },
  ];
  const report = [];
  for (const [width, height] of [[1280, 720], [960, 540]]) {
    await page.setViewportSize({ width, height });
    await sleep(300);
    for (const p of panels) {
      await p.open();
      await page.locator(`#${p.id}:not([hidden])`).waitFor();
      await sleep(400);
      const panel = await page.locator(`#${p.id}`).boundingBox();
      const shown = await card.isVisible(), box = shown ? await card.boundingBox() : null;
      const area = box ? inter(box, panel) : 0;
      report.push({ size: `${width}x${height}`, panel: p.id, card: shown ? "hiện" : "ẩn", cardBox: box && [box.x, box.y, box.width, box.height].map(Math.round), panelBox: [panel.x, panel.y, panel.width, panel.height].map(Math.round), overlapPx2: area });
      await page.screenshot({ path: resolve(out, `${label}-${width}x${height}-${p.id}.png`) });
      if (!soft) assert.equal(area, 0, `${width}x${height} ${p.id}: thẻ Làm quen chồng lên bảng ${area} px²`);
      await p.close();
      await sleep(200);
    }
  }
  console.table(report);
  assert.deepEqual(errors, []);
  console.log(`Ảnh: ${out}`);
} finally { clearTimeout(watchdog); await browser?.close(); stop(); }
