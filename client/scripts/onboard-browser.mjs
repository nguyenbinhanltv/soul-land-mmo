// #1540: thẻ kết thúc trên game RAM thật; Chrome tắt tiếng, không dùng DB ngoài máy.
// ONBOARD_BEFORE=1 tải onboard.ts ở origin/main để chụp trước; ONBOARD_OUTPUT là thư mục ảnh.
import assert from "node:assert/strict";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import ts from "typescript";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.ONBOARD_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "onboard-1540-")));
const before = process.env.ONBOARD_BEFORE === "1", children = [];
let browser;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const port = () => new Promise(done => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
function start(args, env, cwd = root) {
  const c = spawn(process.execPath, args, { cwd, env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(c);
  let log = ""; for (const s of [c.stdout, c.stderr]) s.on("data", d => { log = (log + d).slice(-6000); });
  c.on("exit", code => { if (code && code !== null) console.error(log); });
}
function stop() {
  for (const c of children) if (c.exitCode === null && c.pid) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(c.pid), "/T", "/F"]); else c.kill("SIGTERM");
  }
}
const watchdog = setTimeout(() => { stop(); process.exit(1); }, 240000);
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then(r => r.ok).catch(() => false)) return; await sleep(200); }
  throw Error(`Không mở được ${url}`);
}
try {
  await mkdir(out, { recursive: true });
  const api = `http://127.0.0.1:${await port()}`, webPort = await port(), web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: api.split(":").at(-1), GAME_TEST: "1" });
  start(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api }, resolve(root, "client"));
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, data) => { const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); assert.ok(r.ok); return r.json(); };
  const name = `LQ ${Date.now().toString(36).slice(-6)}`;
  const { token } = await post("/api/login", { name, password: "Lam-quen-local!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || "chrome", args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.setDefaultTimeout(15000);
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(t => { localStorage.setItem("shh-token", t); localStorage.setItem("soul-land-audio-v1", JSON.stringify({ muted: true })); }, token);
  await page.route("**/private/**", route => route.fulfill({ status: 404, body: "" }));
  if (before) {
    const source = execFileSync("git", ["show", "origin/main:client/src/onboard.ts"], { cwd: root, encoding: "utf8" });
    const body = ts.transpileModule(source + "\nexport function onboardQuestLink() {}", { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } }).outputText;
    await page.route("**/src/onboard.ts*", route => route.fulfill({ contentType: "text/javascript", body }));
  }
  await page.route("**/src/scenes/GameScene.ts*", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `\nconst obCreate = GameScene.prototype.create;
GameScene.prototype.create = function(...a) { window.__obScene = this; window.__obHud = hud; return obCreate.apply(this, a); };` });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__obScene?.players.size > 0, null, { timeout: 60000 });
  await page.locator(".g-skip").click();
  const test = m => page.evaluate(m => window.__obScene.room.send("test", m), m);
  // Hook server chuẩn bị bài thật, các thao tác CTA sau đó chỉ được phép đọc tiến độ.
  await test({ op: "quest", step: 0, accepted: true, prog: [0] });
  await page.waitForFunction(() => window.__obHud.questTracked().some(q => q.status === "active"));
  const finish = async () => {
    for (let i = 0; i < 6; i++) {
      if (await page.locator('#onboard[data-mode="done"]:visible').count()) break;
      await page.locator("#onboard .ob-next").click();
    }
    await page.locator('#onboard[data-mode="done"]').waitFor();
  };
  await finish();
  const shot = label => page.screenshot({ path: resolve(out, `${before ? "truoc" : "sau"}-${label}.png`) });
  await shot("xong");
  if (!before) {
    const snapshot = () => page.evaluate(() => {
      const s = window.__obScene, p = s.room.state.players.get(s.me);
      return { quest: JSON.stringify(window.__obHud.questTracked()), daily: JSON.stringify(window.__obHud.dailyMsg), x: p.x, y: p.y, goal: s.goal };
    });
    // Ghi mọi lệnh có thể nhận / trả / đi, vẫn chuyển tiếp nguyên vẹn tới server.
    await page.evaluate(() => {
      window.__obWrites = [];
      const s = window.__obScene, send = s.room.send.bind(s.room);
      s.room.send = (type, data) => { if (["quest", "travel", "input"].includes(type)) window.__obWrites.push({ type, data }); send(type, data); };
    });
    const saved = await page.evaluate(n => localStorage.getItem(`soul-onboard-v1:${n}`), name);
    assert.equal(JSON.parse(saved).st, "done");
    // Khung đã mở / đã gọn, ba cỡ chữ và màn ngang thấp: CTA luôn ở trong thẻ cuộn.
    for (const [width, height] of [[960, 540], [640, 360]]) for (const font of [0, 1, 2]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(async f => { const { setA11yPrefs } = await import('/src/a11y.ts'); setA11yPrefs({ font: f }); }, font);
      await page.evaluate(async n => { const ob = await import('/src/onboard.ts'); ob.onboardAttach(n); ob.onboardBegin(); }, `Thu ${width}-${font}`);
      await finish();
      if (font % 2 === 0) await page.evaluate(() => document.querySelector('#sbFold:not([hidden])')?.click());
      await page.evaluate(() => { window.__obScene.goal = null; window.__obScene.keys = {}; });
      await sleep(250);
      await page.evaluate(() => { window.__obWrites = []; });
      const prev = await snapshot();
      const cta = page.getByRole("button", { name: "Xem nhiệm vụ", exact: true });
      await cta.scrollIntoViewIfNeeded();
      const rect = await cta.boundingBox(); assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width && rect.y + rect.height <= height);
      await shot(`${width}-chu-${font}`);
      await cta.focus(); await page.keyboard.press(font % 2 ? "Space" : "Enter");
      await page.waitForFunction(() => document.activeElement?.matches('#sideBox .sb-tab[data-tab="quest"]') && !document.querySelector('#sideBox.collapsed'));
      assert.deepEqual(await snapshot(), prev, 'CTA không thay tiến độ / vị trí / đích đi');
      assert.equal(await page.locator('#quest .qg').count() > 0, true, 'mục tiêu bài thật hiện ra');
      assert.deepEqual(await page.evaluate(() => window.__obWrites), [], 'CTA không gửi lệnh game');
    }
    assert.deepEqual(await page.evaluate(() => window.__obWrites), [], 'CTA không gửi lệnh game');
    // Trở lại hồn sư thật: bản ghi done không hiện lại, kể cả tải lại trang.
    await page.evaluate(async n => { const ob = await import('/src/onboard.ts'); ob.onboardAttach(n); ob.onboardBegin(); }, name);
    assert.equal(await page.locator('#onboard:visible').count(), 0);
    // Xem lại qua Cẩm Nang, kết thúc và bỏ qua không đổi nhiệm vụ hay bản ghi.
    for (const skip of [false, true]) {
      const prev = await snapshot();
      await page.locator('#hubBtn').click(); await page.locator('[data-hub="guide"]').click();
      await page.getByRole('button', { name: 'Xem lại hướng dẫn', exact: true }).click();
      if (skip) await page.locator('.ob-skip').click();
      else for (let i = 0; i < 6; i++) await page.locator('.ob-next').click();
      assert.equal(await page.locator('#onboard:visible').count(), 0);
      assert.deepEqual(await snapshot(), prev);
      assert.equal(await page.evaluate(n => localStorage.getItem(`soul-onboard-v1:${n}`), name), saved);
    }
    // Không có bài đã nhận / tất cả chuỗi xong: thẻ trung tính vẫn mở khung hiện hành.
    for (const accepted of [false, 'done']) {
      const { QUESTS } = await import('../../shared/data.ts');
      for (const c of QUESTS) await test({ op: 'quest', chain: c.id, step: accepted === 'done' ? c.steps.length : 0, accepted: false, prog: [] });
      if (accepted === 'done') {
        const n = await page.evaluate(() => window.__obHud.dailyMsg.list.length);
        for (let i = 0; i < n; i++) await test({ op: 'daily', i, step: 1, accepted: false, prog: [] });
        await page.waitForFunction(() => window.__obHud.dailyMsg.list.every(q => q.status === 'done') && !window.__obHud.questTracked().length);
      }
      await sleep(500);
      await page.evaluate(async n => { const ob = await import('/src/onboard.ts'); ob.onboardAttach(n); ob.onboardBegin(); }, `Trong ${accepted}`);
      await finish(); const prev = await snapshot();
      await page.getByRole('button', { name: 'Xem nhiệm vụ', exact: true }).click();
      assert.deepEqual(await snapshot(), prev);
      if (accepted === 'done') assert.equal(await page.locator('#quest .qg').count(), 0, 'xong tất cả không tạo mục tiêu giả');
    }
    // Bỏ qua lần đầu cũng không mở nhiệm vụ hoặc làm tiến độ.
    const prev = await snapshot();
    await page.evaluate(async () => { const ob = await import('/src/onboard.ts'); ob.onboardAttach('Bo qua'); ob.onboardBegin(); });
    await page.locator('.ob-skip').click(); assert.deepEqual(await snapshot(), prev);
    assert.equal(await page.locator('#onboard:visible').count(), 0);
    console.log('✓ CTA bàn phím; ba cỡ chữ × hai màn; khung gọn/mở; xem lại/bỏ qua/tài khoản cũ; không đổi dữ liệu hoặc gửi lệnh game');
  }
  assert.deepEqual(errors, []);
  console.log(`Ảnh: ${out}`);
} finally { clearTimeout(watchdog); await browser?.close(); stop(); }
