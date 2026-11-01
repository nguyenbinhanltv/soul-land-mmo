// #1566: kiểm trạng thái Thư và Thành Tựu với sender / đồng hồ giả trong game thật, Chrome tắt tiếng.
// `REFRESH_OUTPUT=<thư mục>`: nơi ghi ảnh (mặc định thư mục tạm); `REFRESH_TAG=truoc|sau`: tiền tố ảnh;  `REFRESH_SOFT=1`: chỉ ghi số đo, không assert (lượt "trước").
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.REFRESH_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "refresh-")));
const tag = process.env.REFRESH_TAG ?? "sau", soft = process.env.REFRESH_SOFT === "1";
const children = [];
let browser;
const killChildren = () => { for (const child of children) { try { process.kill(process.platform === "win32" ? child.pid : -child.pid, "SIGTERM"); } catch {} } };
// Chặn treo: cả bài quá REFRESH_TIMEOUT_MS (mặc định 300 s) thì tắt tiến trình con rồi thoát mã 1.
const watchdog = setTimeout(() => { console.error("mail-achv-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.REFRESH_TIMEOUT_MS ?? 300000));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => {
  const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); });
});
function start(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, detached: process.platform !== "win32", env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  let log = "";
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (d) => { log = (log + d).slice(-12000); });
  child.on("exit", (code) => { if (code) console.error(log); });
  return () => log;
}
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw new Error(`Không mở được ${url}`);
}
const check = (cond, msg) => { if (soft) { if (!cond) console.log("  (trước) không đạt:", msg); } else assert.ok(cond, msg); };
const clientLog = []; // lỗi / cảnh báo console của trang, in kèm khi trượt

try {
  await mkdir(out, { recursive: true });
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  const serverLog = start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["client/node_modules/vite/bin/vite.js", "client", "--config", "client/vite.config.ts", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => {
    const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json(); assert.ok(r.ok, data.error); return data;
  };
  const name = `U1 ${Date.now().toString(36).slice(-5)}`;
  const { token } = await post("/api/login", { name, password: "U1-local-preview!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });

  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || undefined, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (e) => console.error("[trình duyệt]", e.message));
  page.on("websocket", (ws) => { const t0 = Date.now(); clientLog.push(`ws mở ${ws.url().slice(-40)}`); ws.on("close", () => clientLog.push(`ws đóng sau ${Date.now() - t0} ms`)); });
  page.on("console", (m) => { if (["warning", "error"].includes(m.type())) clientLog.push(m.text().slice(0, 200)); });
  await page.addInitScript((t) => { localStorage.setItem("shh-token", t); }, token);
  await page.addInitScript(() => localStorage.setItem("soul-land-audio-v1", JSON.stringify({ muted: true })));
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `
const resoCreate = GameScene.prototype.create;
GameScene.prototype.create = function(...a) { window.__resoScene = this; return resoCreate.apply(this, a); };` });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__resoScene?.players.size > 0);
  await page.evaluate(async () => {
    window.__modules = { mail: await import("/src/mailScreen.ts?refresh-test"), achv: await import("/src/achvScreen.ts?refresh-test") };
    window.__sent = [];
    window.__timers = new Map(); let seq = 1000000;
    const set = window.setTimeout.bind(window), clear = window.clearTimeout.bind(window);
    window.setTimeout = (fn, ms, ...args) => ms === 6000 ? (window.__timers.set(++seq, () => fn(...args)), seq) : set(fn, ms, ...args);
    window.clearTimeout = (id) => { if (!window.__timers.delete(id)) clear(id); };
    window.__tick = () => { const pending = [...window.__timers.values()]; window.__timers.clear(); for (const fn of pending) fn(); };
    for (const [key, mod] of Object.entries(window.__modules)) mod[key === "mail" ? "bindMail" : "bindAchv"]((type, payload) => window.__sent.push({ type, ...payload }), () => {});
  });
  const data = {
    mail: { list: [{ id: 1, from: "Hệ thống", title: "Quà Thánh Hồn Thôn", body: "Thư cũ vẫn đọc được khi làm mới thất bại.", honTe: 100, items: [], at: Date.now(), exp: Date.now() + 86400000, read: true, claimed: false }], pending: 1, unread: 0 },
    achv: { stats: { level: 100 }, claimed: [], ready: 1 },
  };
  for (const key of ["mail", "achv"]) {
    const cap = key === "mail" ? "Mail" : "Achv", panel = page.locator(`#${key}`);
    const call = (name, value) => page.evaluate(({ key, name, value }) => window.__modules[key][name](value), { key, name, value });
    const open = () => call(`open${cap}`), close = () => call(`close${cap}`);
    const reply = (value = data[key]) => call(`on${cap}`, value);
    const tick = () => page.evaluate(() => window.__tick());
    const text = () => panel.innerText();
    const shot = (name) => page.screenshot({ path: resolve(out, `${tag}-${key}-${name}.png`), animations: "disabled" });
    const count = () => page.evaluate(() => window.__timers.size);
    await open(); check(await panel.locator("[aria-busy=true]").count() === 1, `${key}: tải lần đầu`);
    await tick(); check((await text()).includes("Thử lại"), `${key}: lỗi lần đầu`);
    await panel.getByRole("button", { name: "Thử lại", exact: true }).click();
    await reply();
    if (key === "mail") await panel.locator(".ml-row").click();
    for (const font of [0, 1, 2]) {
      await page.setViewportSize({ width: 960, height: 540 });
      await page.evaluate((font) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (font) document.body.classList.add(`a11y-fs-${font}`); }, font);
      await close(); await open();
      check((await text()).includes("Đang cập nhật"), `${key}: cache cần nhãn đang cập nhật`);
      await shot(`fs${font}-dang-tai`);
      await tick();
      check((await text()).includes("Cập nhật thất bại"), `${key}: cache timeout cần báo lỗi`);
      check((await text()).includes("Dữ liệu cũ"), `${key}: cache cần nhãn dữ liệu cũ`);
      check(await panel.locator(key === "mail" ? ".ml-row" : ".av-row").count() > 0, `${key}: giữ nội dung cũ`);
      await shot(`fs${font}-loi`);
      if (!soft) {
        const retry = panel.getByRole("button", { name: "Thử lại", exact: true });
        check(await retry.evaluate((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }), `${key}: nút Thử lại nhìn thấy ở cả ba cỡ chữ`);
        const n = await page.evaluate(() => window.__sent.length);
        await retry.click();
        check(await page.evaluate(({ key, n }) => window.__sent.length === n + 1 && window.__sent.at(-1).type === key && window.__sent.at(-1).op === "get", { key, n }), `${key}: thử lại chỉ gửi get`);
      }
      await reply();
      check(!(await text()).includes("Thử lại") && !(await text()).includes("Dữ liệu cũ"), `${key}: phản hồi xóa cảnh báo`);
      await shot(`fs${font}-thanh-cong`);
    }
    if (!soft) {
      await close(); await open(); await close(); await open();
      check(await count() === 1, `${key}: mở nhanh chỉ một timer`);
      await close(); check(await count() === 0, `${key}: đóng xóa timer`);
      await reply(); await open(); await reply();
      check(await count() === 0, `${key}: tin mới xóa timer`);
      await tick(); check(!(await text()).includes("Thử lại"), `${key}: không timeout sau thành công`);
      await close(); await open();
      const claim = panel.locator(key === "mail" ? ".ml-claim" : ".av-claim").first();
      if (key === "mail" && !await claim.count()) await panel.locator(".ml-row").click();
      await claim.click();
      check(await count() === 1, `${key}: claim thay timer tải`);
      await reply({ ...data[key], claimedNow: key === "mail" ? { count: 1, honTe: 100, items: [] } : { id: "level_t1", honTe: 100, items: [] } });
      await tick();
      check((await text()).includes(key === "mail" ? "Nhận 1 thư" : "Nhận thành tựu"), `${key}: timeout không ghi đè claim`);
      check(!(await text()).includes("Cập nhật thất bại"), `${key}: không cảnh báo sau claim`);
      await close(); await open(); await reply({ ...data[key], err: "Túi không đủ chỗ" }); await tick();
      check((await text()).includes("Túi không đủ chỗ"), `${key}: giữ lỗi từ server`);
      await close(); await open(); await tick(); await reply();
      check(!(await text()).includes("Thử lại"), `${key}: hồi phục bằng tin đến muộn`);
      await close(); await open(); await reply();
      await panel.locator(key === "mail" ? ".ml-claim" : ".av-claim").first().click();
      await tick();
      check((await text()).includes("Máy chủ chưa trả lời: thử lại sau."), `${key}: claim timeout báo đúng lỗi hành động`);
      const claimAgain = panel.locator(key === "mail" ? ".ml-claim" : ".av-claim").first();
      check(await claimAgain.isEnabled(), `${key}: claim timeout nhả busy`);
      await claimAgain.click(); await reply();
      check(await count() === 0, `${key}: thử claim lại không dư timer`);
      await close(); await open(); await reply(key === "mail" ? { list: [], pending: 0, unread: 0 } : { stats: {}, claimed: [], ready: 0 });
      check((await text()).includes(key === "mail" ? "Hộp thư trống" : "Chưa đạt thành tựu nào"), `${key}: giữ trạng thái rỗng`);

    }
    await close();
  }
  console.log(`${soft ? "Đối chiếu trước sửa" : "Thư / Thành Tựu: đạt"}. Ảnh: ${out}`);
} finally {
  clearTimeout(watchdog);
  await browser?.close(); killChildren();
}
