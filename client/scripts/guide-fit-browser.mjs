// #1688: thẻ #guide (Hướng dẫn, Gợi ý ngữ cảnh "Bạn bị đánh", xem lại) ở màn thấp: đầu thẻ không được tụt khỏi mép trên màn (top >= 0), đáy không quá mép dưới, 魂 không che thẻ;
// nội dung dài thì cuộn trong thẻ. Quét 640x360, 844x390, 960x540, 1280x720 x cỡ chữ 0-2, khi lời nhắc Nói chuyện hiện / ẩn.
// GUIDE_FIT_OUTPUT: thư mục ảnh; GUIDE_FIT_TIMEOUT_MS: trần thời gian (mặc định 180 s).
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.GUIDE_FIT_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "guide-fit-")));
const children = [];
let browser;
const killChildren = () => { for (const child of children) { if (child.exitCode !== null || !child.pid) continue; try { if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }); else process.kill(-child.pid, "SIGTERM"); } catch {} } };
const watchdog = setTimeout(() => { console.error("guide-fit-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.GUIDE_FIT_TIMEOUT_MS ?? 180000));
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
  // NPC gần trại có thể đổi khi state đầu tiên tới: cố định ngữ cảnh CSS, không phụ thuộc thời điểm showTalk chạy.
  await page.evaluate(() => {
    const talk = document.getElementById("talk");
    let shown = false;
    const sync = () => talk.toggleAttribute("hidden", !shown);
    new MutationObserver(sync).observe(talk, { attributes: true, attributeFilter: ["hidden"] });
    window.setGuideTalkFixture = (visible) => { shown = visible; sync(); };
    sync();
  });
  const failures = [];
  for (const [w, h] of SIZES) {
    await page.setViewportSize({ width: w, height: h });
    for (const fs of [0, 1, 2]) {
      const tag = `${w}x${h} chữ ${fs}`;
      for (const talkShown of [false, true]) for (const mode of ["hint", "review"]) {
        const m = await page.evaluate(async ({ fs, mode, talkShown }) => {
          window.setGuideTalkFixture(talkShown);
          document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`);
          const g = await import("/src/guide.ts");
          const c = document.getElementById("guide");
          if (c && !c.hidden) c.querySelector(".g-skip").click();
          if (mode === "review") g.guideReview();
          else {
            // Gợi ý "Bạn bị đánh": dựng đúng DOM của guideHint (đã xem rồi thì guideHint không hiện lại), chữ lấy từ HINTS.hit.
            g.guideHint("hit");
            const card = document.getElementById("guide"); card.hidden = false; card.dataset.mode = "hint";
            card.querySelector(".g-head b").textContent = "Gợi ý"; card.querySelector(".g-dots").textContent = "";
            card.querySelector("h4").textContent = "Bạn bị đánh";
            card.querySelector("p").textContent = "Thanh máu ở góc trên trái. Lùi lại bằng W A S D hoặc đổi võ hồn bằng 1–4 (đội hình: V).";
            card.querySelector(".g-skip").hidden = true; card.querySelector(".g-onboard").hidden = true; card.querySelector(".g-next").textContent = "Đã hiểu";
          }
          await new Promise((r) => setTimeout(r, 250));
          const card = document.getElementById("guide"), r = card.getBoundingClientRect(), hubEl = document.getElementById("hubBtn"), hub = hubEl.getBoundingClientRect();
          const next = card.querySelector(".g-next").getBoundingClientRect();
          const hubOver = !(hub.right <= r.left || hub.left >= r.right || hub.bottom <= r.top || hub.top >= r.bottom) && getComputedStyle(hubEl).visibility !== "hidden";
          return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), vh: innerHeight, vw: innerWidth, hubOver, scroll: card.scrollHeight, client: card.clientHeight,
            maxH: getComputedStyle(card).maxHeight, u: getComputedStyle(document.documentElement).getPropertyValue("--u") || getComputedStyle(document.body).getPropertyValue("--u"), hudH: document.getElementById("hud").getBoundingClientRect().height, hidden: card.hidden, mode: card.dataset.mode,
            talkShown: !document.getElementById("talk").hidden, nextTop: next.top, nextBottom: next.bottom,
            nextIn: next.width > 0 && next.height > 0 && next.top >= Math.max(0, r.top) - 1 && next.bottom <= Math.min(r.bottom, innerHeight) + 1 };
        }, { fs, mode, talkShown });
        const t = `${tag} ${mode} talk ${talkShown ? "hiện" : "ẩn"}`;
        if (m.talkShown !== talkShown) failures.push(`${t}: lời nhắc không đúng trạng thái (${JSON.stringify(m)})`);
        if (m.hidden || m.mode !== mode) failures.push(`${t}: thẻ không hiện đúng chế độ (${JSON.stringify(m)})`);
        else {
          if (m.top < 0) failures.push(`${t}: đầu thẻ tụt khỏi mép trên (${JSON.stringify(m)})`);
          if (m.bottom > m.vh + 1) failures.push(`${t}: đáy thẻ quá mép dưới (${m.bottom} > ${m.vh})`);
          if (m.left < 0 || m.right > m.vw + 1) failures.push(`${t}: thẻ tràn ngang (${m.left}–${m.right} / ${m.vw})`);
          if (m.hubOver) failures.push(`${t}: 魂 đè lên thẻ`);
          if (!m.nextIn) failures.push(`${t}: nút chính khuất (${JSON.stringify(m)})`);
        }
        await page.screenshot({ path: resolve(out, `guide-${mode}-${w}x${h}-fs${fs}-talk${+talkShown}.png`) });
        await page.evaluate(() => { const c = document.getElementById("guide"); if (c && !c.hidden) { const s = c.querySelector(".g-skip"); (s.hidden ? c.querySelector(".g-next") : s).click(); } });
      }
    }
  }
  if (failures.length) { console.error(failures.join("\n")); throw new Error(`${failures.length} lỗi bố cục thẻ Hướng dẫn / Gợi ý`); }
  console.log("✓ Thẻ Hướng dẫn / Gợi ý nằm trọn trong màn, 魂 không đè (4 cỡ màn × 3 cỡ chữ × hint / review × Nói chuyện hiện / ẩn)");
  console.log(`Ảnh: ${out}`);
} catch (e) { console.error(clientLog.join("\n")); throw e; }
finally { clearTimeout(watchdog); await browser?.close().catch(() => {}); killChildren(); }
