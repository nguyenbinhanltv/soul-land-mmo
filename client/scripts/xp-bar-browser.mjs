// #1677: thanh kinh nghiệm `#xpTxt` (và thanh Phong Lôi) không bị cắt chữ ở cỡ chữ 0–2 và có số đọc được ở màn ≤ 640 px (chữ ngắn `#xpPct` + aria-label / chú thích).
// Game thật (server RAM + vite riêng, Chromium `--mute-audio`), 4 cỡ màn × 3 cỡ chữ × 3 trạng thái (cấp 99, bình cảnh cấp 10, cấp 7). `XP_SOFT=1`: chỉ in lỗi (chụp "trước"); `XP_OUTPUT`: thư mục ảnh; `XP_PREFIX`: tiền tố ảnh.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.XP_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "xp-bar-")));
const prefix = process.env.XP_PREFIX ?? "sau", soft = process.env.XP_SOFT === "1";
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
const CASES = [
  ["cap99", { level: 99, xp: 881999, rings: [500, 800, 2000, 6000, 13000, 25000, 60000, 100000, 100000] }],
  ["binhcanh", { level: 10, xp: 0, rings: [] }],
  ["cap7", { level: 7, xp: 0, rings: [] }],
];
const problems = [];
try {
  await mkdir(out, { recursive: true });
  const api = `http://127.0.0.1:${await port()}`, webPort = await port(), web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: api.split(":").at(-1), GAME_TEST: "1" });
  start(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api }, resolve(root, "client"));
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, data) => { const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); assert.ok(r.ok); return r.json(); };
  const { token } = await post("/api/login", { name: `XP ${Date.now().toString(36).slice(-6)}`, password: "Thanh-kn-local!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || "chrome", args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(15000);
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((t) => { localStorage.setItem("shh-token", t); localStorage.setItem("soul-land-audio-v1", JSON.stringify({ muted: true })); }, token);
  await page.route("**/private/**", (route) => route.fulfill({ status: 404, body: "" }));
  await page.route("**/src/scenes/GameScene.ts*", async (route) => { // chỉ lấy tham chiếu scene để gửi lệnh thử
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `
const xpCreate = GameScene.prototype.create;
GameScene.prototype.create = function(...a) { window.__xp = this; return xpCreate.apply(this, a); };` });
  });
  await page.goto(`${web}/choi/?nopredict`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.locator(".g-skip").waitFor({ timeout: 60000 });
  await page.locator(".g-skip").click();
  await page.waitForFunction(() => window.__xp?.owned?.list?.length > 0);
  await sleep(800);
  const rowId = await page.evaluate(() => window.__xp.owned.active);
  const setSize = async (w, h, fs) => {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(async (f) => { const { setA11yPrefs } = await import("/src/a11y.ts"); setA11yPrefs({ font: f }); }, fs);
    await sleep(250);
  };
  const measure = () => page.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 && !e.closest("[hidden]"); };
    const t = document.getElementById("xpTxt"), l = document.getElementById("leiTxt"), p = document.getElementById("xpPct"), bar = t.parentElement;
    // Chữ canh giữa nên phần tràn nằm cả hai bên, scrollWidth không thấy: đo hộp thật của chữ so với bề rộng thanh.
    const textW = (e) => { const g = document.createRange(); g.selectNodeContents(e); return g.getBoundingClientRect().width; };
    const r = p ? p.getBoundingClientRect() : { right: 0, left: 0 };
    return {
      xp: t.textContent, xpClip: textW(t) > t.parentElement.clientWidth + 1, lei: l.textContent, leiClip: vis(l) && textW(l) > l.parentElement.clientWidth + 1,
      pct: p?.textContent ?? "", pctVisible: !!p && vis(p), pctInside: r.right <= innerWidth && r.left >= 0, aria: bar.getAttribute("aria-label") ?? "",
      w640: document.body.classList.contains("ui-w640"), hasTip: bar.hasAttribute("data-tipped"),
    };
  });
  for (const [name, set] of CASES) {
    await page.evaluate(([id, s]) => window.__xp.room.send("test", { op: "set", rowId: id, ...s }), [rowId, set]);
    await sleep(1200);
    for (const [w, h] of [[640, 360], [844, 390], [960, 540], [1280, 720]]) for (const fs of [0, 1, 2]) {
      await setSize(w, h, fs);
      const m = await measure(), tag = `${w}×${h}, chữ ${fs}, ${name}`;
      if (m.w640) {
        if (!m.pctVisible || !m.pct) problems.push(`${tag}: màn nhỏ không có chữ ngắn trên thanh (${JSON.stringify(m.pct)})`);
        else if (!m.pctInside) problems.push(`${tag}: chữ ngắn tràn ra ngoài màn`);
      } else if (m.xpClip) problems.push(`${tag}: chữ thanh kinh nghiệm bị cắt (${m.xp})`);
      if (!m.w640 && m.leiClip) problems.push(`${tag}: chữ Phong Lôi bị cắt (${m.lei})`);
      if (!/\d/.test(m.aria) || !m.hasTip) problems.push(`${tag}: thanh kinh nghiệm thiếu aria-label số / chú thích (${JSON.stringify(m.aria)})`);
      if (name === "binhcanh" && !/hồn hoàn thứ 1/.test(m.aria)) problems.push(`${tag}: bình cảnh thiếu "hồn hoàn thứ N" (${JSON.stringify(m.aria)})`);
      if (name === "cap99" && !/881\.999.*882\.099/.test(m.aria)) problems.push(`${tag}: cấp 99 thiếu hai số thật (${JSON.stringify(m.aria)})`);
      if ((w === 640 || (w === 1280 && fs === 2)) && fs !== 1) await page.screenshot({ path: resolve(out, `${prefix}-${w}x${h}-chu-${fs}-${name}.png`), clip: { x: 0, y: 0, width: Math.min(w, 700), height: Math.min(h, 220) } });
    }
  }
  if (problems.length) console.log(problems.join("\n"));
  if (!soft) assert.deepEqual(problems, [], "thanh kinh nghiệm cắt chữ / mất số");
  assert.deepEqual(errors, []);
  console.log(`✓ Thanh kinh nghiệm và Phong Lôi không cắt chữ, màn ≤ 640 px có số (chữ ngắn + aria-label), 4 cỡ màn × 3 cỡ chữ × 3 trạng thái: ${out}`);
} finally { clearTimeout(watchdog); await browser?.close(); stop(); }
