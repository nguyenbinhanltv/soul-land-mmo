// #1464: kiểm Túi gọn và kéo thả trên game thật, server RAM và Chrome riêng.
// Kiểm: bố cục 4 cỡ, dấu đang mặc, kéo hai chiều, tab cảm ứng; chụp Túi riêng / cùng Hồn sư.
// `BAG_OUTPUT=<thư mục>`: nơi ghi ảnh (mặc định thư mục tạm); `BAG_TAG=truoc|sau`: tiền tố ảnh;  `BAG_SOFT=1`: chỉ ghi số đo, không assert (lượt "trước").
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.BAG_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "tui-gon-")));
const tag = process.env.BAG_TAG ?? "sau", soft = process.env.BAG_SOFT === "1";
const children = [];
let browser;
const killChildren = () => { for (const child of children) { try { process.kill(process.platform === "win32" ? child.pid : -child.pid, "SIGTERM"); } catch {} } };
// Chặn treo: cả bài quá BAG_TIMEOUT_MS (mặc định 180 s; chạy thường ~15 s) thì tắt tiến trình con rồi thoát mã 1.
const watchdog = setTimeout(() => { console.error("bag-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.BAG_TIMEOUT_MS ?? 180000));
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
  start(["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
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
  // Chỉ lấy tham chiếu scene và đếm lệnh đi / khoá; không đổi logic. Không đếm `beastAt`: con trỏ ngữ cảnh (cập nhật mỗi khung hình) cũng gọi nó để dò hover, bấm vào hồn thú đã thành `lockTo`.
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `
const u1Create = GameScene.prototype.create;
GameScene.prototype.create = function(...a) {
  window.__u1 = this; window.__u1n = { walk: 0, lock: 0 };
  for (const [k, c] of [["walkTo", "walk"], ["lockTo", "lock"]]) { const o = this[k]; this[k] = function(...x) { window.__u1n[c]++; return o.apply(this, x); }; }
  return u1Create.apply(this, a);
};` });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__u1?.players.size > 0);
  await page.waitForTimeout(1500);
  const test = async (data) => { await page.evaluate((d) => window.__u1.room.send("test", d), data); await sleep(350); };
  await test({ op: "give", code: "hon_cot", qty: 4 });
  await test({ op: "give", code: "hon_hach", qty: 4 });
  await test({ op: "give", code: "hon_hoan", qty: 4 });
  await test({ op: "gear", tpl: "mu_tu_kim", ilvl: 3, enhance: 5 });
  await page.evaluate(() => { document.querySelector("#guide .g-skip")?.click(); document.querySelector("#onboard .ob-skip")?.click(); });
  if (!soft) {
    await page.keyboard.press("KeyH"); await page.keyboard.press("KeyB");
    await page.locator('#char .cdtabs button').first().click();
    await page.waitForSelector('#char .ecell');
    const gearId = await page.evaluate(() => window.__u1.bag.items.find((i) => i.code === "trang_bi").id);
    const drag = async (source, target) => {
      const a = await source.boundingBox(), b = await target.boundingBox();
      assert.ok(a && b, "hai đầu kéo hiện trên màn hình");
      await page.mouse.move(a.x+a.width/2,a.y+a.height/2); await page.mouse.down();
      await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:15}); await sleep(150); await page.mouse.up();
    };
    await drag(page.locator(`#bag .bslot[data-id="${gearId}"]`), page.locator('#char .ecell').filter({hasText:"Mũ"}));
    await page.waitForFunction((id) => window.__u1.gear.items.some((g) => g.id === id), gearId);
    check(await page.locator(`#bag .bslot[data-id="${gearId}"] .bworn`).count() === 1, "món đang mặc có dấu góc ô");
    await page.waitForSelector('#char .ecell:not(.empty)');
    const worn = page.locator('#char .ecell:not(.empty)').first();
    await drag(worn, page.locator('#bag .bslot.empty').first());
    await page.waitForFunction((id) => !window.__u1.gear.items.some((g) => g.id === id), gearId);
    console.log("✓ kéo Túi → Hồn sư → Túi và dấu đang mặc");
    // Ô tham chiếu không báo đầy trang: 45 món thật / 50 ô + 7 món đang mặc.
    const occupancy = await page.evaluate(() => {
      const sc = window.__u1, savedBag = sc.bag, savedGear = sc.gear;
      const loose = savedBag.items.find((i) => i.vohon === null);
      sc.bag = { ...savedBag, slots:50, items:Array.from({length:45}, (_,i) => ({...loose,id:`thu-tui-${i}`})) };
      const ref = savedGear.items[0] ?? {id:"thu",code:"trang_bi",enhance:5,stats:savedBag.items.find((i) => i.code === "trang_bi").stats,slot:0};
      sc.gear = {...savedGear, items:Array.from({length:7},(_,i) => ({...ref,id:`thu-mac-${i}`}))};
      sc.renderBag();
      const full = document.querySelectorAll('#bag .bpg.full').length;
      sc.bag = savedBag; sc.gear = savedGear; sc.renderBag();
      return full;
    });
    check(occupancy === 0, "45/50 món + 7 ô đang mặc không báo trang đầy");
    // Mặc lại để các ảnh thể hiện dấu đang mặc; thao tác ô Túi chỉ mở Hồn sư.
    await page.evaluate((id) => window.__u1.room.send("equipgear", {id}), gearId);
    await page.waitForFunction((id) => window.__u1.gear.items.some((g) => g.id === id), gearId);
    const badgeClear = await page.locator(`#bag .bslot[data-id="${gearId}"]`).evaluate((cell) => {
      const a=cell.querySelector('.bworn').getBoundingClientRect(), b=cell.querySelector('.enh').getBoundingClientRect();
      return a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom;
    });
    check(badgeClear, "dấu đang mặc không che số cường hóa");
    await page.locator(`#bag .bslot[data-id="${gearId}"]`).click();
    check(await page.evaluate((id) => window.__u1.gear.items.some((g) => g.id === id), gearId), "bấm đồ mặc không tháo trong Túi");
  }
  const measures = [];
  for (const [width, height, touch] of [[960,540,false],[1280,720,false],[1920,1080,false],[640,360,true]]) {
    await page.setViewportSize({ width, height });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: touch });
    await page.evaluate((on) => document.body.classList.toggle("touch", on), touch);
    await page.evaluate(async () => { const { setPanel } = await import("/src/charPanel.ts"); setPanel("char", false); setPanel("bag", true); });
    await sleep(500);
    await page.screenshot({ path: resolve(out, `${tag}-${width}x${height}-tui.png`) });
    await page.evaluate(async () => { const { setPanel } = await import("/src/charPanel.ts"); setPanel("char", true); });
    await sleep(500);
    if (touch) await page.locator('#dualTabs [data-p="bag"]').click();
    await page.screenshot({ path: resolve(out, `${tag}-${width}x${height}-hai-bang.png`) });
    const m = await page.evaluate(() => {
      const rect = (id) => { const e = document.getElementById(id), r = e.getBoundingClientRect(); return { x:r.x, y:r.y, w:r.width, h:r.height, visible: getComputedStyle(e).display !== "none", overflow:e.scrollWidth > e.clientWidth + 1 }; };
      return { char:rect("char"), bag:rect("bag"), cols:getComputedStyle(document.querySelector("#bag .bgrid")).gridTemplateColumns.split(" ").length, filters:getComputedStyle(document.querySelector("#bag .bfilter")).display };
    });
    measures.push({ width, height, touch, ...m });
    if (!soft) {
      check(!m.bag.overflow, `Túi không tràn ngang ${width}: ${JSON.stringify(m)}`);
      if (touch) check(!m.char.visible && m.bag.visible, "cảm ứng chỉ hiện một bảng");
      else { check(m.bag.w <= 301, "Túi thu về cột hẹp tối đa 300 px"); check(m.cols === 5, "Túi cùng Hồn sư có 5 cột"); check(m.char.w <= width * .56, "Hồn sư tối đa khoảng 55% màn"); check(m.char.x + m.char.w <= m.bag.x, "hai bảng không chồng"); }
      check(m.filters === "none", "ẩn chip khi cùng Hồn sư");
      check(await page.locator('#bag .rhead .bsort').count() === 1, "Sắp xếp ở tiêu đề");
      check(await page.locator('#bag .rhead .bsellbtn').count() === 1, "Tự bán ở tiêu đề");
      check(!(await page.locator('#bag').innerText()).includes("Trang bị đang mặc (bấm để tháo)"), "bỏ khối đồ mặc cũ");
    }
    if (touch) { await page.locator('#dualTabs [data-p="char"]').click(); check(await page.locator('#char').isVisible(), "chuyển tab Hồn sư"); }
    await cdp.detach();
  }
  await writeFile(resolve(out, `${tag}-do.json`), JSON.stringify(measures, null, 2));
  console.log(JSON.stringify({ output:out, measures }, null, 2));
} finally {
  clearTimeout(watchdog);
  await browser?.close();
  killChildren();
}
