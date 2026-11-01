// #1647: thanh kỹ năng / vật phẩm `#actbar` không tràn khỏi màn và không che nút khác, ở mọi cỡ cửa sổ giữa 640 và 1280 px × cỡ chữ 0–2, cả chuột lẫn cảm ứng.
// Server RAM riêng (GAME_TEST=1) + Vite riêng; chạy: npm run test:actbar-fit-browser (đặt ACTBAR_FIT_OUT=<thư mục> để lưu ảnh).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, realpath } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const installed = fileURLToPath(new URL("../../", import.meta.url));
const root = await realpath(resolve(process.env.ACTBAR_FIT_ROOT ?? installed));
const out = resolve(process.env.ACTBAR_FIT_OUT ?? await mkdtemp(resolve(tmpdir(), "actbar-fit-")));
const SIZES = [[640, 360], [700, 400], [800, 480], [844, 390], [900, 500], [902, 400], [960, 540], [1280, 720]];
const FONTS = [0, 1, 2];
const children = [];
let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => {
  const s = createServer(); s.on("error", reject);
  s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); });
});
function start(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child); let log = "";
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (d) => { log = (log + d).slice(-8000); });
  child.on("exit", (code) => { if (code) console.error(log); });
}
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw new Error(`Không mở được ${url}`);
}

/** Đo trong trang: mọi ô nhìn thấy của #actbar phải nằm trọn trong màn, bấm được (không bị nút khác che), không đè khung chat / nút khác. */
function measure() {
  const vw = innerWidth, vh = innerHeight, rect = (e) => e.getBoundingClientRect();
  const vis = (e) => { const r = rect(e), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  const bar = document.getElementById("actbar"), br = rect(bar);
  const cells = [...bar.querySelectorAll(".sk,.tm,.qbag,.more-btn")].filter(vis);
  const others = [...document.querySelectorAll("#chatbox,#hubBtn,#radar,#joy,#lcol,#rcol")].filter(vis).map((e) => ({ id: e.id, r: rect(e) }));
  const problems = [];
  if (br.right > vw + 0.5 || br.left < -0.5) problems.push(`#actbar ${br.left.toFixed(0)}→${br.right.toFixed(0)} ra ngoài màn rộng ${vw}`);
  for (const c of cells) {
    const r = rect(c), name = c.className.toString().split(" ").slice(0, 2).join(".") + (c.dataset.i ? `[${c.dataset.i}]` : "");
    if (r.left < -0.5 || r.right > vw + 0.5 || r.top < -0.5 || r.bottom > vh + 0.5) problems.push(`ô ${name} ${r.left.toFixed(0)}→${r.right.toFixed(0)} ngoài màn`);
    const hit = document.elementFromPoint(Math.min(vw - 1, Math.max(0, r.x + r.width / 2)), Math.min(vh - 1, Math.max(0, r.y + r.height / 2)));
    if (!c.contains(hit) && !hit?.closest("#toasts,.f2-toast"))   // thông báo nổi tạm thời không tính là che problems.push(`ô ${name} bị che bởi ${hit?.id || hit?.className || hit?.tagName}`);
    for (const o of others) {
      if (o.id === "lcol" || o.id === "rcol") continue; // khối chứa lớn trong suốt; che thật đã bắt bằng elementFromPoint
      if (r.left < o.r.right - 1 && r.right > o.r.left + 1 && r.top < o.r.bottom - 1 && r.bottom > o.r.top + 1) problems.push(`ô ${name} đè ${o.id}`);
    }
  }
  return { bar: { left: br.left, right: br.right }, cells: cells.length, problems };
}

try {
  await mkdir(out, { recursive: true });
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  start([resolve(installed, "server/node_modules/tsx/dist/cli.mjs"), "--tsconfig", resolve(root, "server/tsconfig.json"), resolve(root, "server/src/index.ts")], { PORT: String(apiPort), GAME_TEST: "1" });
  start([resolve(installed, "client/node_modules/vite/bin/vite.js"), resolve(root, "client"), "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => {
    const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json(); assert.ok(r.ok, data.error); return data;
  };
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const { token } = await post("/api/login", { name: `AF ${Date.now().toString(36)}`, password: "AF-local-preview!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
  const failures = [];
  for (const touch of [false, true]) {
    const context = await browser.newContext({ viewport: { width: SIZES[0][0], height: SIZES[0][1] }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(30000);
    await page.addInitScript((t) => { localStorage.setItem("shh-token", t); }, token);
    await page.goto(`${web}/choi/`);
    await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
    await page.waitForSelector("#skills .sk:not(.empty)", { state: "attached" }); await page.waitForTimeout(1500);
    await page.evaluate(() => { document.querySelector("#guide .g-skip")?.click(); document.querySelector("#onboard .ob-skip")?.click(); });
    for (const [w, h] of SIZES) {
      await page.setViewportSize({ width: w, height: h });
      for (const fs of FONTS) {
        await page.evaluate((fs) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); }, fs);
        await page.mouse.move(1, 1); await page.waitForTimeout(250);
        const m = await page.evaluate(measure), tag = `${touch ? "cảm ứng" : "chuột"} ${w}x${h} cỡ chữ ${fs}`;
        if (m.problems.length) { failures.push(`${tag}: ${m.problems.join("; ")}`); await page.screenshot({ path: resolve(out, `loi-${touch ? "touch" : "mouse"}-${w}x${h}-fs${fs}.png`) }); }
        else console.log(`✓ ${tag}: #actbar ${m.bar.left.toFixed(0)}→${m.bar.right.toFixed(0)}, ${m.cells} ô`);
      }
      await page.screenshot({ path: resolve(out, `${touch ? "touch" : "mouse"}-${w}x${h}.png`) });
    }
    await context.close();
  }
  if (failures.length) { console.error(failures.join("\n")); throw new Error(`${failures.length} cấu hình bị tràn / che nút`); }
  console.log(`actbar-fit-browser: đạt (${SIZES.length} cỡ × ${FONTS.length} cỡ chữ × chuột + cảm ứng). Ảnh: ${out}`);
} finally {
  await browser?.close().catch(() => {});
  for (const c of children) c.kill();
}
