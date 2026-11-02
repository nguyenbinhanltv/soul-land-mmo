// #1689: bấm "Xếp hàng đấu hồn" (server trả tin "arena" k = "queue" bật) thì hộp NPC đóng, ô "Đang tìm đối thủ…" + nút Hủy (#arenaQ) thấy đủ, không bị #npc phủ.
// Quét 640x360, 844x390, 960x540, 1280x720 x cỡ chữ 0-2 (dựng bằng openNpc + setArenaQueue, đúng thứ tự GameScene gọi).
// ARENA_QUEUE_OUTPUT: thư mục ảnh; ARENA_QUEUE_TIMEOUT_MS: trần thời gian (mặc định 180 s).
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.ARENA_QUEUE_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "arena-queue-")));
const children = [];
let browser;
const killChildren = () => { for (const child of children) { if (child.exitCode !== null || !child.pid) continue; try { if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); else process.kill(-child.pid, "SIGTERM"); } catch {} } };
const watchdog = setTimeout(() => { console.error("arena-queue-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.ARENA_QUEUE_TIMEOUT_MS ?? 180000));
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
      const m = await page.evaluate(async ({ fs }) => {
        document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`);
        const npc = await import("/src/hudNpc.ts"), ar = await import("/src/hudArena.ts");
        npc.closeNpc(); ar.setArenaQueue(null, () => {});
        const act = new Proxy({}, { get: () => () => {} });
        npc.openNpc("dau_hon_truong", { slots: 30, honTe: 0, items: [], bones: [], cores: [], gears: [], buyback: [], sold: [] }, act);
        await new Promise((r) => setTimeout(r, 200));
        const opened = !document.getElementById("npc").hidden;
        ar.setArenaQueue({ elo: 1000, secs: 2 }, () => {});   // server báo đã xếp hàng (tin "arena" k = "queue" on)
        await new Promise((r) => setTimeout(r, 250));
        const q = document.getElementById("arenaQ"), n = document.getElementById("npc"), qb = q.getBoundingClientRect(), nb = n.getBoundingClientRect();
        const cancel = q.querySelector("button").getBoundingClientRect();
        const at = (b) => document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        const tText = at(q.querySelector("small").getBoundingClientRect()), tBtn = at(cancel);
        return { opened, npcHidden: n.hidden, qVisible: !q.hidden && qb.width > 0, qIn: qb.top >= 0 && qb.bottom <= innerHeight + 1 && qb.left >= 0 && qb.right <= innerWidth + 1,
          textOk: !!tText && q.contains(tText), btnOk: !!tBtn && tBtn === q.querySelector("button"), covered: !n.hidden && !(nb.right <= qb.left || nb.left >= qb.right || nb.bottom <= qb.top || nb.top >= qb.bottom), by: tBtn ? (tBtn.closest("#npc") ? "#npc" : tBtn.id || tBtn.tagName) : null };
      }, { fs });
      if (!m.opened) failures.push(`${tag}: hộp NPC không mở (điều kiện đầu)`);
      if (!m.qVisible || !m.qIn) failures.push(`${tag}: ô "Đang tìm đối thủ…" không nằm trọn trong màn (${JSON.stringify(m)})`);
      if (!m.npcHidden) failures.push(`${tag}: hộp NPC vẫn mở sau khi xếp hàng`);
      if (m.covered) failures.push(`${tag}: hộp NPC phủ lên ô xếp hàng`);
      if (!m.textOk || !m.btnOk) failures.push(`${tag}: ô xếp hàng / nút Hủy bị ${m.by} che`);
      await page.screenshot({ path: resolve(out, `queue-${w}x${h}-fs${fs}.png`) });
      await page.evaluate(async () => { (await import("/src/hudNpc.ts")).closeNpc(); (await import("/src/hudArena.ts")).setArenaQueue(null, () => {}); });
    }
  }
  if (failures.length) { console.error(failures.join("\n")); throw new Error(`${failures.length} lỗi hộp NPC che ô xếp hàng đấu trường`); }
  console.log("✓ Xếp hàng đấu trường: hộp NPC đóng, ô Đang tìm đối thủ + nút Hủy thấy đủ (4 cỡ màn × 3 cỡ chữ)");
  console.log(`Ảnh: ${out}`);
} catch (e) { console.error(clientLog.join("\n")); throw e; }
finally { clearTimeout(watchdog); await browser?.close().catch(() => {}); killChildren(); }
