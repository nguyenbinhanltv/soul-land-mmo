// #1686: hộp kết quả Đại Đấu Hồn Trường (#arenaEnd) ở màn thấp: hai nút "Về bản đồ cũ" / "Xem lại bảng xếp hạng" nằm trong vùng nhìn và trong hộp khi mới mở (không cần cuộn),
// hộp nằm trọn trong màn, 魂 không đè tiêu đề, đóng bảng thì 魂 hiện lại. Quét 640x360, 844x390, 960x540, 1280x720 x cỡ chữ 0-2 (dựng bằng arenaEnd / setArenaTop của hudArena.ts).
// ARENA_END_OUTPUT: thư mục ảnh; ARENA_END_TIMEOUT_MS: trần thời gian (mặc định 180 s).
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.ARENA_END_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "arena-end-")));
const children = [];
let browser;
const killChildren = () => { for (const child of children) { if (child.exitCode !== null || !child.pid) continue; try { if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); else process.kill(-child.pid, "SIGTERM"); } catch {} } };
const watchdog = setTimeout(() => { console.error("arena-end-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.ARENA_END_TIMEOUT_MS ?? 180000));
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
const END = { score: 1, reason: "leave", why: "đối thủ đã rời sân", foe: "Hồn sư B", elo0: 1000, elo1: 1016, rec: { elo: 1016, wins: 3, losses: 1, draws: 0 }, reward: { honTe: 1500, code: "manh_vo_hon", qty: 1, coin: 0 }, left: 3, secs: 17 };
const TOP = { list: Array.from({ length: 10 }, (_, i) => ({ name: `Hồn sư ${i + 1}`, elo: 1100 - i * 10, wins: 9 - i, losses: i, draws: 0, me: i === 3 })), me: { elo: 1016, wins: 3, losses: 1, draws: 0, rank: 4 }, start: 1000, left: 3, queued: false };

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
      const m = await page.evaluate(async ({ fs, endMsg, top }) => {
        document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`);
        const hud = await import("/src/hudArena.ts");
        hud.setArenaTop(top);
        hud.arenaEnd(endMsg, { back() {}, top() {} });
        await new Promise((r) => setTimeout(r, 250));
        const box = document.getElementById("arenaEnd"); box.scrollTop = 0;
        const r = box.getBoundingClientRect(), hubEl = document.getElementById("hubBtn"), hb = hubEl.getBoundingClientRect(), h2 = box.querySelector("h2").getBoundingClientRect();
        const inView = (b) => b.top >= 0 && b.bottom <= innerHeight + 1 && b.left >= 0 && b.right <= innerWidth + 1;
        const btn = (label) => { const e = [...box.querySelectorAll(".brow button")].find((x) => x.textContent.includes(label)), b = e.getBoundingClientRect();
          const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
          return { top: Math.round(b.top), bottom: Math.round(b.bottom), inView: inView(b), inBox: b.top >= r.top - 1 && b.bottom <= r.bottom + 1, hit: t === e || e.contains(t), by: t ? (t.id || t.className || t.tagName) : null }; };
        const hubVis = getComputedStyle(hubEl).visibility !== "hidden";
        const hubOver = hubVis && !(hb.right <= h2.left || hb.left >= h2.right || hb.bottom <= h2.top || hb.top >= h2.bottom);
        const res = { box: { top: Math.round(r.top), bottom: Math.round(r.bottom) }, vh: innerHeight, boxIn: inView(r), back: btn("Về bản đồ cũ"), rank: btn("Xem lại bảng"), hubOver, scroll: box.scrollHeight, client: box.clientHeight };
        hud.arenaEnd(null, { back() {}, top() {} });
        await new Promise((r) => setTimeout(r, 100));
        const hub2 = getComputedStyle(hubEl); res.hubBack = hub2.visibility !== "hidden";
        return res;
      }, { fs, endMsg: END, top: TOP });
      for (const k of ["back", "rank"]) {
        const b = m[k], name = k === "back" ? "Về bản đồ cũ" : "Xem lại bảng xếp hạng";
        if (!b.inView || !b.inBox) failures.push(`${tag}: nút "${name}" ngoài vùng nhìn khi mới mở (${JSON.stringify({ btn: b, box: m.box, vh: m.vh, scroll: m.scroll, client: m.client })})`);
        else if (!b.hit) failures.push(`${tag}: nút "${name}" bị ${b.by} che`);
      }
      if (!m.boxIn) failures.push(`${tag}: hộp kết quả ngoài màn (${JSON.stringify(m.box)} / ${m.vh})`);
      if (m.hubOver) failures.push(`${tag}: 魂 đè lên tiêu đề "Thắng!"`);
      if (!m.hubBack) failures.push(`${tag}: đóng bảng kết quả mà 魂 không hiện lại`);
      await page.evaluate(async (m) => { (await import("/src/hudArena.ts")).arenaEnd(m, { back() {}, top() {} }); }, END);
      await sleep(150);
      await page.screenshot({ path: resolve(out, `end-${w}x${h}-fs${fs}.png`) });
      await page.evaluate(async () => { (await import("/src/hudArena.ts")).arenaEnd(null, { back() {}, top() {} }); });
    }
  }
  if (failures.length) { console.error(failures.join("\n")); throw new Error(`${failures.length} lỗi bố cục hộp kết quả đấu trường`); }
  console.log("✓ Hộp kết quả đấu trường: hai nút thấy ngay, 魂 không đè tiêu đề (4 cỡ màn × 3 cỡ chữ)");
  console.log(`Ảnh: ${out}`);
} catch (e) { console.error(clientLog.join("\n")); throw e; }
finally { clearTimeout(watchdog); await browser?.close().catch(() => {}); killChildren(); }
