// Dòng trạng thái "Chờ nhịp săn, tìm con tiếp" (#1713) trong bảng Tự động không tràn / không bị cắt ở 640×360, 844×390, 960×540 × cỡ chữ 0–2.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, realpath, mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const installed = fileURLToPath(new URL("../../", import.meta.url));
const root = await realpath(resolve(process.env.AUTOSTATUS_SOURCE_ROOT ?? installed));
const out = resolve(process.env.AUTOSTATUS_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "autostatus-")));
const children = []; let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => { const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); }); });
function start(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child); let log = "";
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (d) => { log = (log + d).slice(-8000); });
  child.on("exit", (code) => { if (code) console.error(log); });
}
async function ready(url) { for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); } throw new Error(`Không mở được ${url}`); }
const failures = [];
const check = (ok, msg) => { if (!ok) { failures.push(msg); console.error("LỖI:", msg); } };
try {
  await mkdir(out, { recursive: true });
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  start([resolve(installed, "server/node_modules/tsx/dist/cli.mjs"), "--tsconfig", resolve(root, "server/tsconfig.json"), resolve(root, "server/src/index.ts")], { PORT: String(apiPort), GAME_TEST: "1" });
  start([resolve(installed, "client/node_modules/vite/bin/vite.js"), resolve(root, "client"), "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => { const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json(); assert.ok(r.ok, d.error); return d; };
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  for (const [width, height, touch] of [[640, 360, true], [844, 390, true], [960, 540, false]]) {
    const size = `${width}x${height}`;
    const { token } = await post("/api/login", { name: `AS ${width} ${Date.now().toString(36)}`, password: "AS-local-preview!" });
    await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
    await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
    const page = await (await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 })).newPage();
    page.setDefaultTimeout(20000);
    // Chỉ lấy tham chiếu cảnh + hàm đặt trạng thái để đưa vào tin `autost` giả (cùng đường hiển thị với tin thật).
    await page.route("**/src/scenes/GameScene.ts*", async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + "\nconst asCreate = GameScene.prototype.create; GameScene.prototype.create = function(...a) { window.__as = this; window.__setAutoStatus = setAutoStatus; return asCreate.apply(this, a); };" });
    });
    await page.addInitScript((t) => localStorage.setItem("shh-token", t), token);
    await page.goto(`${web}/choi/`);
    await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
    await page.waitForFunction(() => window.__as?.players?.size > 0 && !document.getElementById("hud")?.hidden, null, { timeout: 30000 });
    for (let i = 0; i < 4; i++) { const b = page.locator("#onboard:not([hidden]) .ob-skip, .guide:not([hidden]) button:has-text(\"Bỏ qua\")").first(); if (!(await b.isVisible().catch(() => false))) break; await b.click({ timeout: 2000 }).catch(() => {}); await sleep(300); }
    // Máy chủ không bật tự săn ở làng, nên lấy tin `auto` thật (op get) rồi phát lại với on = true qua đúng bộ nghe của cảnh; trạng thái `autost` đưa vào bằng setAutoStatus.
    await page.evaluate(async () => {
      const room = window.__as.room, list = room.onMessageHandlers.events.auto; let got;
      list.push((m) => { got = m; });
      room.send("auto", { op: "get" });
      for (let i = 0; i < 50 && !got; i++) await new Promise((r) => setTimeout(r, 100));
      if (!got?.cfg) throw new Error("tin auto: " + JSON.stringify(got));
      window.__autoGot = got;
    });
    await page.evaluate(() => { document.getElementById("autoChip").click(); });
    await page.waitForFunction(() => !document.getElementById("autoPanel").hidden);
    await sleep(600); // mở bảng gửi `get`: đợi tin trả lời xong rồi mới phát lại với on = true
    await page.evaluate(() => window.__as.room.onMessageHandlers.emit("auto", { ...window.__autoGot, on: true }));
    for (const fs of [0, 1, 2]) {
      await page.evaluate((fs) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); window.__setAutoStatus({ k: "rest", rate: null }); }, fs);
      await sleep(250);
      const m = await page.evaluate(() => {
        const p = document.getElementById("autoPanel").getBoundingClientRect(), box = document.querySelector("#autoPanel [data-a=job]"), t = box.querySelector("b"), r = box.getBoundingClientRect(), tr = t.getBoundingClientRect();
        return { text: t.textContent, shown: !box.hidden && r.width > 0, inPanel: r.left >= p.left - 1 && r.right <= p.right + 1, textIn: tr.left >= r.left - 1 && tr.right <= r.right + 1, boxScrollOk: box.scrollWidth <= box.clientWidth + 1 };
      });
      console.log(size, `fs${fs}`, JSON.stringify(m));
      check(m.shown && m.text === "Chờ nhịp săn, tìm con tiếp", `${size} fs${fs}: dòng trạng thái "${m.text}" shown=${m.shown}`);
      check(m.inPanel && m.textIn && m.boxScrollOk, `${size} fs${fs}: chữ tràn khỏi khung ${JSON.stringify(m)}`);
      await page.screenshot({ path: resolve(out, `${size}-fs${fs}.png`) });
    }
    await page.context().close();
  }
} finally {
  await browser?.close().catch(() => {});
  for (const c of children) c.kill();
}
if (failures.length) { console.error(`${failures.length} lỗi`); process.exit(1); }
console.log("autostatus-browser: ok. Ảnh:", out);
