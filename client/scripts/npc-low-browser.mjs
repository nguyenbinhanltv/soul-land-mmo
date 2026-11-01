// #1648: hộp thoại NPC ở màn thấp. Thương nhân / thợ rèn / Đại Đấu Hồn Trường: khi mở (chưa cuộn) phải thấy ít nhất một nút hành động chính,
// nút × luôn bấm được (kể cả khi đã cuộn xuống đáy). Quét 640x360, 844x390, 960x540, 1280x720 × cỡ chữ 0-2.
// NPC_LOW_OUTPUT: thư mục ảnh; NPC_LOW_TIMEOUT_MS: trần thời gian (mặc định 180 s).
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.NPC_LOW_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "npc-low-")));
const children = [];
let browser;
const killChildren = () => { for (const child of children) { if (child.exitCode !== null || !child.pid) continue; try { if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); else process.kill(-child.pid, "SIGTERM"); } catch {} } };
const watchdog = setTimeout(() => { console.error("npc-low-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.NPC_LOW_TIMEOUT_MS ?? 180000));
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
// [mã NPC, chữ của nút hành động chính]
const NPCS = [["thuong_nhan_thien_dau", "Mua đan dược"], ["lo_ren_thien_dau", "Cường hóa hồn cốt"], ["dau_hon_truong", "Xếp hàng đấu hồn"]];
const SIZES = [[640, 360], [844, 390], [960, 540], [1280, 720]];

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
  const { token } = await post("/api/login", { name: `NL ${Date.now().toString(36).slice(-5)}`, password: "Npc-low-preview!" });
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
    for (const fs of [0, 1, 2]) for (const [id, label] of NPCS) {
      await page.evaluate(async ({ id, fs }) => {
        document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`);
        const hud = await import("/src/hudNpc.ts");
        hud.closeNpc();
        const act = new Proxy({}, { get: () => () => {} });
        hud.openNpc(id, { slots: 30, honTe: 0, items: [], bones: [], cores: [], gears: [], buyback: [], sold: [] }, act);
        document.getElementById("npc").scrollTop = 0;
      }, { id, fs });
      await sleep(250);
      const m = await page.evaluate((label) => {
        const box = document.getElementById("npc"), r = box.getBoundingClientRect();
        const vis = (e) => { const b = e.getBoundingClientRect(); return b.height > 0 && b.top >= r.top - 1 && b.bottom <= Math.min(r.bottom, innerHeight) + 1 && b.left >= 0 && b.right <= innerWidth + 1; };
        const act = [...box.querySelectorAll(".brow .buse")].find((b) => b.textContent.includes(label));
        const x = box.querySelector(".rhead .x");
        const before = { act: act ? vis(act) : null, x: vis(x) };
        box.scrollTop = box.scrollHeight;
        const after = { x: vis(x) };
        const bye = [...box.querySelectorAll(".buse")].find((b) => b.textContent.includes("Tạm biệt"));
        box.scrollTop = 0;
        return { before, after, hasAct: !!act, boxInView: r.top >= -1 && r.bottom <= innerHeight + 1, scroll: box.scrollHeight, client: box.clientHeight, byeIn: bye ? vis(bye) : null };
      }, label);
      const tag = `${id} ${w}x${h} fs${fs}`;
      if (!m.hasAct) failures.push(`${tag}: không thấy nút "${label}"`);
      else if (!m.before.act) failures.push(`${tag}: nút "${label}" dưới nếp gập khi mới mở (${JSON.stringify(m)})`);
      if (!m.before.x || !m.after.x) failures.push(`${tag}: nút × khuất (${JSON.stringify(m)})`);
      if (!m.boxInView) failures.push(`${tag}: hộp ngoài màn`);
      if (fs === 0 || h <= 390) await page.screenshot({ path: resolve(out, `${id}-${w}x${h}-fs${fs}.png`) });
    }
  }
  if (failures.length) { console.error(failures.join("\n")); throw new Error(`${failures.length} lỗi bố cục hộp thoại NPC`); }
  console.log("✓ Hộp thoại NPC: nút chính thấy ngay, × luôn bấm được (4 cỡ màn × 3 cỡ chữ × 3 NPC)");
  console.log(`Ảnh: ${out}`);
} catch (e) { console.error(clientLog.join("\n")); throw e; }
finally { clearTimeout(watchdog); await browser?.close().catch(() => {}); killChildren(); }
