// #1687: trong sân (thanh trận có pointer-events:none nên "bị che" = điểm ở tâm rơi vào 魂) Đại Đấu Hồn Trường, huy hiệu Menu 魂 (giữa trên) không được che đồng hồ đếm ngược / nút Rời sân của thanh trận; rời sân thì 魂 hiện lại.
// Quét 640x360, 844x390, 960x540, 1280x720 × cỡ chữ 0-2 (dựng thanh trận bằng showArena của hudArena.ts, không cần hai tài khoản).
// ARENA_CLOCK_OUTPUT: thư mục ảnh; ARENA_CLOCK_TIMEOUT_MS: trần thời gian (mặc định 180 s).
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.ARENA_CLOCK_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "arena-clock-")));
const children = [];
let browser;
const killChildren = () => { for (const child of children) { if (child.exitCode !== null || !child.pid) continue; try { if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); else process.kill(-child.pid, "SIGTERM"); } catch {} } };
const watchdog = setTimeout(() => { console.error("arena-clock-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.ARENA_CLOCK_TIMEOUT_MS ?? 180000));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => {
  const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); });
});
function start(args, env, cwd = root) {
  const child = spawn(process.execPath, args, { cwd, detached: process.platform !== "win32", env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  let log = "";
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (d) => { log = (log + d).slice(-12000); });
  child.on("exit", (code) => { if (code) console.error(log); });
}
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw new Error(`Không mở được ${url}`);
}
const clientLog = [];
const SIZES = [[640, 360], [844, 390], [960, 540], [1280, 720]];
const SIDES = [{ sid: "me", name: "Hồn sư A", elo: 1000, pct: 1, alive: 4, total: 4 }, { sid: "foe", name: "Hồn sư B", elo: 1012, pct: 0.8, alive: 3, total: 4 }];

try {
  await mkdir(out, { recursive: true });
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api }, resolve(root, "client"));
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => {
    const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json(); assert.ok(r.ok, data.error); return data;
  };
  const { token } = await post("/api/login", { name: `AC ${Date.now().toString(36).slice(-5)}`, password: "Arena-clock-preview!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || undefined, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.setDefaultTimeout(20000);
  await page.route("**/private/**", (route) => route.fulfill({ status: 404, body: "" }));
  page.on("pageerror", (e) => console.error("[trình duyệt]", e.stack));
  page.on("console", (m) => { if (["warning", "error"].includes(m.type())) clientLog.push(m.text().slice(0, 200)); });
  await page.addInitScript((t) => { localStorage.setItem("shh-token", t); localStorage.setItem("soul-land-audio-v1", JSON.stringify({ muted: true })); }, token);
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.locator(".g-skip").waitFor(); await page.locator(".g-skip").click();
  await page.locator(".ob-skip").click();
  const failures = [];
  for (const [w, h] of SIZES) {
    await page.setViewportSize({ width: w, height: h });
    for (const fs of [0, 1, 2]) {
      const tag = `${w}x${h} chữ ${fs}`;
      const m = await page.evaluate(async ({ fs, sides }) => {
        document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`);
        const hud = await import("/src/hudArena.ts");
        hud.showArena({ phase: "fight", time: 178, me: "me", friendly: false, watchers: 0, sides }, () => {});
        await new Promise((r) => setTimeout(r, 250));
        const hit = (sel) => { const e = document.querySelector(sel), b = e.getBoundingClientRect(); const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return { ok: !(t && t.closest("#hubBtn")), by: t ? (t.id || t.className || t.tagName) : null }; };
        const res = { clock: hit("#arenaBar .aclock b"), leave: hit("#arenaBar .aleave") };
        hud.showArena(null, () => {});
        await new Promise((r) => setTimeout(r, 100));
        const hub = document.getElementById("hubBtn"), hb = hub.getBoundingClientRect(), cs = getComputedStyle(hub);
        res.hubBack = cs.visibility !== "hidden" && cs.display !== "none" && hb.width > 0;
        hud.showArena({ phase: "fight", time: 178, me: "me", friendly: false, watchers: 0, sides }, () => {});
        return res;
      }, { fs, sides: SIDES });
      if (!m.clock.ok) failures.push(`${tag}: đồng hồ bị che bởi ${m.clock.by}`);
      if (!m.leave.ok) failures.push(`${tag}: nút Rời sân bị che bởi ${m.leave.by}`);
      if (!m.hubBack) failures.push(`${tag}: rời sân mà 魂 không hiện lại`);
      await page.screenshot({ path: resolve(out, `clock-${w}x${h}-fs${fs}.png`) });
      await page.evaluate(async () => { (await import("/src/hudArena.ts")).showArena(null, () => {}); });
    }
  }
  if (failures.length) { console.error(failures.join("\n")); throw new Error(`${failures.length} lỗi 魂 che thanh trận`); }
  console.log("✓ Thanh trận đấu trường: đồng hồ và Rời sân không bị 魂 che, rời sân thì 魂 hiện lại (4 cỡ màn × 3 cỡ chữ)");
  console.log(`Ảnh: ${out}`);
} catch (e) { console.error(clientLog.join("\n")); throw e; }
finally { clearTimeout(watchdog); await browser?.close().catch(() => {}); killChildren(); }
