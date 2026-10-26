// Hồn thú: `_anim` lỗi thì sheet tĩnh hiện tạm ngay, không ẩn ~27 s chờ thử lại (#1084); `_anim` tải bình thường thì không tải sheet tĩnh (#1075).
// Chrome thật + server RAM riêng. `FLOW_CHANNEL=chrome` nếu chưa cài Chromium của Playwright.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const children = [];
let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => {
  const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); });
});
function start(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, detached: process.platform !== "win32", env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: "ignore" });
  children.push(child);
}
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw new Error(`Không mở được ${url}`);
}
/** Vào Thánh Hồn Thôn; `blockAnim`: chặn mọi file `beast/*_anim*.png`. Trả các file hồn thú đã xin và khoảng thời gian tới khi hết hồn thú bị ẩn vì chờ sheet. */
async function run(web, token, blockAnim, species = []) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const reqs = new Set();
  page.on("request", (r) => { const m = /\/beast\/([a-z_]+)\.png/.exec(r.url()); if (m) reqs.add(m[1]); });
  await page.addInitScript(({ token }) => localStorage.setItem("shh-token", token), { token });
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + "\nconst bfCreate = GameScene.prototype.create; GameScene.prototype.create = function(...args) { window.__bfScene = this; return bfCreate.apply(this, args); };" });
  });
  const block = /\/beast\/[a-z_]+_anim(_n)?\.png/;
  if (blockAnim) await page.route(block, (r) => r.abort());
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  const t0 = Date.now();
  // Cảnh (create) chỉ dựng khi đợt preload xong: preload không được bị giữ lại chờ `_anim` thử lại.
  await page.waitForFunction(() => window.__bfScene?.players.size > 0 && window.__bfScene.beasts.size > 0, null, { timeout: 60000 });
  const ms = Date.now() - t0;
  // Sheet tĩnh của mọi loài có _anim đã có texture (hồn thú loài đó không còn ẩn chờ ảnh).
  const has = () => page.evaluate((sp) => sp.every((k) => window.__bfScene.textures.exists(k)), species.map((a) => `beast_${a.replace(/_anim$/, "")}`));
  let shown = false;
  for (let i = 0; i < 40 && !(shown = await has()); i++) await sleep(250);
  if (!blockAnim) await sleep(4000); // bình thường: chờ thêm để thấy có xin sheet tĩnh thừa không
  // Gỡ chặn: `_anim` thử lại nền phải tới và thay sheet tĩnh (trong ~1 lượt thử lại đủ backoff).
  let replaced = !blockAnim;
  if (blockAnim) {
    await page.unroute(block);
    const anim = species.map((a) => a.replace(/^/, "beast_"));
    for (let i = 0; i < 120 && !(replaced = await page.evaluate((ks) => ks.every((k) => window.__bfScene.textures.exists(k)), anim)); i++) await sleep(250);
  }
  await page.close();
  return { reqs: [...reqs], ms, shown, replaced };
}

try {
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => {
    const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json(); assert.ok(r.ok, data.error); return data;
  };
  const { token } = await post("/api/login", { name: `Bf ${Date.now().toString(36).slice(-5)}`, password: "Join-local-test!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
  browser = await chromium.launch({ channel: process.env.FLOW_CHANNEL || undefined, headless: true, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });

  const ok = await run(web, token, false);
  const animOf = ok.reqs.filter((k) => k.endsWith("_anim"));
  assert.ok(animOf.length > 0, `Bản đồ không có loài nào có _anim để kiểm: ${ok.reqs}`);
  for (const a of animOf) assert.ok(!ok.reqs.includes(a.replace(/_anim$/, "")), `_anim tải được mà vẫn xin sheet tĩnh: ${a}`);
  console.log(`✓ _anim tải bình thường: ${animOf.length} loài chỉ xin _anim, không xin sheet tĩnh`);

  const bad = await run(web, token, true, animOf);
  assert.ok(bad.ms < 8000, `_anim bị chặn: vào được phòng sau ${bad.ms} ms (cần < 8000, trước sửa ~27000: preload chờ _anim thử lại hết)`);
  assert.ok(bad.shown, "_anim bị chặn: sheet tĩnh của loài có _anim chưa có texture");
  for (const a of animOf) assert.ok(bad.reqs.includes(a.replace(/_anim$/, "")), `_anim lỗi mà không xin sheet tĩnh: ${a}`);
  assert.ok(bad.replaced, "Gỡ chặn _anim: sheet hoạt ảnh không tới thay sheet tĩnh trong 30 s");
  console.log(`✓ _anim bị chặn: vào phòng sau ${bad.ms} ms, hồn thú hiện bằng sheet tĩnh, gỡ chặn thì _anim tới thay`);
} finally {
  await browser?.close().catch(() => {});
  for (const c of children) { try { process.platform === "win32" ? spawn("taskkill", ["/pid", String(c.pid), "/t", "/f"], { stdio: "ignore" }) : process.kill(-c.pid); } catch {} }
}
