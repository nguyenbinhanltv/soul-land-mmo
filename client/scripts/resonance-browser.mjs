// #1521: kiểm trạng thái bảng Cộng minh với sender / đồng hồ giả trong game thật, Chrome tắt tiếng.
// `RESO_OUTPUT=<thư mục>`: nơi ghi ảnh (mặc định thư mục tạm); `RESO_TAG=truoc|sau`: tiền tố ảnh;  `RESO_SOFT=1`: chỉ ghi số đo, không assert (lượt "trước").
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.RESO_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "reso-")));
const tag = process.env.RESO_TAG ?? "sau", soft = process.env.RESO_SOFT === "1";
const children = [];
let browser;
const killChildren = () => { for (const child of children) { try { process.kill(process.platform === "win32" ? child.pid : -child.pid, "SIGTERM"); } catch {} } };
// Chặn treo: cả bài quá RESO_TIMEOUT_MS (mặc định 300 s) thì tắt tiến trình con rồi thoát mã 1.
const watchdog = setTimeout(() => { console.error("resonance-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.RESO_TIMEOUT_MS ?? 300000));
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
    window.__reso = await import("/src/hudMisc.ts");
    window.__sent = [];
    window.__reso.onResonanceTop((page, size) => window.__sent.push({ page, size }));
    window.__reso.toggleReso(true);
  });
  // Đồng hồ giả chỉ sau khi đã vào game; không chờ timeout bằng sleep.
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  await page.clock.runFor(2100);
  const rank = page.locator("#reso .resrank");
  const click = (name) => rank.getByRole("button", { name, exact: true }).click();
  const text = () => rank.innerText();
  const sent = () => page.evaluate(() => window.__sent);
  const reply = (n, empty = false) => page.evaluate(({ n, empty }) => window.__reso.setResonanceTop({
    page: n, pageSize: 10, total: 21, hasNext: n < 3, me: null,
    list: empty ? [] : [{ name: n === 1 ? "Đường Tam" : "Tiểu Vũ", score: 120, milestones: 2 }],
  }), { n, empty });
  const shot = async (name) => {
    await rank.scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(out, `${tag}-${name}.png`), animations: "disabled" });
  };
  await click("Xem bảng");
  await page.clock.runFor(8001);
  check((await text()).includes("Chưa nhận được bảng xếp hạng."), "lần đầu hết hạn hiện lỗi");
  await shot("lan-dau-loi");
  await click("Thử lại");
  await reply(1);
  check(!(await text()).includes("Thử lại"), "tin thành công xoá lỗi lần đầu");
  for (const font of [0, 1, 2]) {
    await page.setViewportSize({ width: 960, height: 540 });
    await page.evaluate((font) => {
      document.body.classList.remove("a11y-fs-1", "a11y-fs-2");
      if (font) document.body.classList.add(`a11y-fs-${font}`);
    }, font);
    await page.clock.runFor(2100);
    await click("Làm mới");
    check((await text()).includes("Đường Tam"), "đang chờ vẫn đọc được bảng cũ");
    await shot(`fs${font}-dang-tai`);
    await page.clock.runFor(8001);
    check((await text()).includes("Cập nhật thất bại"), "làm mới thất bại phải báo rõ");
    check((await text()).includes("Dữ liệu cũ · Trang 1 chưa cập nhật."), "gắn nhãn bảng cũ");
    await shot(`fs${font}-lam-moi-loi`);
    await reply(1);
    check(!(await text()).includes("Cập nhật thất bại"), "tin đến muộn xoá lỗi");
    await page.clock.runFor(2100);
    await click("Sau ›");
    await page.clock.runFor(8001);
    check((await text()).includes("Chưa nhận được trang 2"), "lỗi nêu đúng trang yêu cầu");
    check((await text()).includes("Dữ liệu cũ · Trang 1"), "không giả bảng cũ là trang 2");
    await shot(`fs${font}-trang-ke-loi`);
    if (soft) { await reply(1); continue; }
    check(await rank.getByRole("button", { name: "Thử lại", exact: true }).evaluate((e) => {
      const r = e.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth
        && e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
    }), "Thử lại nằm trong màn hình và không bị che ở cả ba cỡ chữ");
    await click("Thử lại");
    check((await sent()).at(-1).page === 2, "thử lại đúng trang 2");
    const count = (await sent()).length;
    for (let i = 0; i < 5; i++) await click("Làm mới");
    check((await sent()).length === count, "bấm dồn không gửi thêm trong nhịp");
    await reply(2);
    check(!(await text()).includes("Dữ liệu cũ"), "thành công bỏ nhãn cũ");
    check((await text()).includes("Tiểu Vũ"), "hiện bảng trang 2 nhận được");
    await shot(`fs${font}-thanh-cong`);
    await reply(1);
  }
  await reply(1, true);
  check((await text()).includes("Chưa có tài khoản đạt mốc."), "giữ trạng thái rỗng");
  await shot("rong");
  console.log(`${soft ? "Đối chiếu trước sửa" : "Cộng minh: đạt lỗi lần đầu / làm mới / trang kế / tin muộn / giới hạn gửi / rỗng, ba cỡ chữ"}. Ảnh: ${out}`);
} finally {
  clearTimeout(watchdog);
  await browser?.close(); killChildren();
}
