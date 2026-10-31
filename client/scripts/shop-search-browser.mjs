// #1520: kiểm mã mua thực sự gửi khi lọc, Túi cập nhật từ server và đổi NPC.
// SHOP_TAG=truoc: tái hiện lỗi gốc; SHOP_OUTPUT: thư mục ảnh; SHOP_TIMEOUT_MS: trần thời gian.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.SHOP_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "shop-search-")));
const tag = process.env.SHOP_TAG ?? "sau";
const children = [];
let browser;
const killChildren = () => { for (const child of children) { if (child.exitCode !== null || !child.pid) continue; try { if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"]); else process.kill(-child.pid, "SIGTERM"); } catch {} } };
// Chặn treo: cả bài quá SHOP_TIMEOUT_MS (mặc định 180 s; chạy thường ~15 s) thì tắt tiến trình con rồi thoát mã 1.
const watchdog = setTimeout(() => { console.error("shop-search-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.SHOP_TIMEOUT_MS ?? 180000));
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
  return () => log;
}
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw new Error(`Không mở được ${url}`);
}
const clientLog = []; // lỗi / cảnh báo console của trang, in kèm khi trượt

try {
  await mkdir(out, { recursive: true });
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api }, resolve(root,"client"));
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
  page.setDefaultTimeout(15000);
  // Vite trả HTML cho đường dẫn gói riêng không có; mô phỏng 404 như server thật.
  await page.route("**/private/**", route => route.fulfill({ status:404, body:"" }));
  // Giữ phản hồi thoáng qua trong ảnh trên máy chụp chậm; không thay logic nhận / gộp hoặc dữ liệu game.
  page.on("pageerror", (e) => console.error("[trình duyệt]", e.stack));
  page.on("websocket", (ws) => { const t0 = Date.now(); clientLog.push(`ws mở ${ws.url().slice(-40)}`); ws.on("close", () => clientLog.push(`ws đóng sau ${Date.now() - t0} ms`)); });
  page.on("console", (m) => { if (["warning", "error"].includes(m.type())) clientLog.push(m.text().slice(0, 200)); });
  await page.addInitScript((t) => { localStorage.setItem("shh-token", t); localStorage.setItem("soul-land-audio-v1", JSON.stringify({muted:true})); }, token);
  // Chỉ phơi tham chiếu scene cho bài thử; không đổi logic của game.
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `
const shopCreate = GameScene.prototype.create;
GameScene.prototype.create = function(...a) { window.__shopScene = this; return shopCreate.apply(this, a); };` });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__shopScene?.players.size > 0, null, { timeout:60000 });
  await page.locator(".g-skip").waitFor();
  await page.locator(".g-skip").click();
  await page.locator(".ob-skip").click();
  const test = (m) => page.evaluate((m) => window.__shopScene.room.send("test", m), m);
  const shot = (name) => page.screenshot({ path:resolve(out, `${tag}-${name}.png`) });
  const pt = await page.evaluate(() => { const p = window.__shopScene.portals.find(p => p.to === "nac_dinh_thanh"); return {x:p.x+p.w/2,y:p.y+p.h/2}; });
  await test({op:"goto", ...pt}); await sleep(500);
  await page.evaluate(() => window.__shopScene.room.send("travel", {portal:"Đi Nặc Đinh Thành"}));
  await page.waitForFunction(() => window.__shopScene.room.state.mapId === "nac_dinh_thanh" && window.__shopScene.players.size > 0);
  await page.waitForFunction(() => window.__shopScene.bag && window.__shopScene.npcs.some(n=>n.id==="thuong_nhan"));
  await sleep(2500);
  await test({op:"coin", n:10000}); await sleep(500);
  const npc = await page.evaluate(() => { const n = window.__shopScene.npcs.find(n => n.id === "thuong_nhan"); return {x:n.x,y:n.y+40}; });
  await test({op:"goto", ...npc}); await sleep(500);
  await page.waitForFunction(p => { const s=window.__shopScene, me=s.room.state.players.get(s.room.sessionId); return me && Math.hypot(me.x-p.x,me.y-p.y)<10; },npc);
  await page.evaluate(() => window.__shopScene.talk("thuong_nhan"));
  await sleep(800);
  await page.locator("#npc button").filter({hasText:"Mua đan dược, mở rộng túi"}).click();
  // Sender mô phỏng tại ranh giới gửi: ghi đúng payload, không gửi mua lên server.
  await page.evaluate(() => {
    const room = window.__shopScene.room;
    window.__shopSend = room.send.bind(room); window.__buys = [];
    room.send = (type, msg) => { if (type === "buy") window.__buys.push(msg); else window.__shopSend(type,msg); };
  });
  for (const fs of [0,1,2]) {
    await page.setViewportSize({width:960,height:540});
    await page.evaluate(fs => { document.body.classList.remove("a11y-fs-1","a11y-fs-2"); if(fs) document.body.classList.add(`a11y-fs-${fs}`); },fs);
    const search = page.getByRole("searchbox", {name:"Tìm món trong cửa hàng"});
    await search.fill("");
    await page.locator('.s2-card[data-code="hoi_huyet_dan"]').click();
    await page.evaluate(() => { window.__oldBuy = document.querySelector(".s2-buy"); window.__buys = []; });
    await search.fill("hoi hon dan");
    assert.equal(await search.evaluate(e => e === document.activeElement), true, "giữ focus khi lọc");
    await shot(`fs${fs}-tim-B`);
    if (tag === "truoc") {
      await page.locator(".s2-buy").click();
      assert.equal(await page.evaluate(() => window.__buys[0].code), "hoi_huyet_dan", "tái hiện mua nhầm A");
      console.log("Tái hiện trước sửa: tìm B nhưng gửi A"); break;
    }
    assert.equal(await page.locator('.s2-card[aria-selected="true"]:visible').count(),1);
    await page.locator(".s2-buy").click();
    assert.deepEqual(await page.evaluate(() => window.__buys), [{code:"hoi_hon_dan",qty:1,npc:"thuong_nhan"}]);
    await page.evaluate(() => window.__oldBuy.click());
    assert.equal(await page.evaluate(() => window.__buys.length),1,"nút cũ không gửi A");
    await search.fill("hoi thanh phu");
    assert.equal(await page.locator(".s2-card:visible").count(),1,"chỉ một món B khớp");
    await page.locator(".s2-buy").click();
    assert.equal(await page.evaluate(() => window.__buys.at(-1).code),"hoi_thanh_phu","gửi đúng món duy nhất còn hiện");
    await search.fill("khongco1520");
    assert.equal(await page.locator(".s2-buy").count(),0,"không kết quả không có nút Mua");
    assert.equal(await page.locator('.s2-card[aria-selected="true"]').count(),0);
    await shot(`fs${fs}-rong`);
    await search.press("Escape");
    assert.equal(await search.inputValue(),"");
    assert.equal(await search.evaluate(e => e === document.activeElement),true);
    await page.locator(".s2-buy").click();
    assert.equal(await page.evaluate(() => window.__buys.at(-1).code),"hoi_huyet_dan","xoá tìm chọn món đầu");
    console.log(`Cỡ chữ ${fs}: sender B, không A; rỗng và xoá tìm đạt`);
  }
  if (tag !== "truoc") {
    const search = page.getByRole("searchbox", {name:"Tìm món trong cửa hàng"});
    await search.fill("hoi hon dan");
    const before = await page.evaluate(() => { const s=window.__shopScene; s.room.send=window.__shopSend; return {n:s.bag.items.filter(i=>i.code==="hoi_hon_dan").reduce((n,i)=>n+i.qty,0),coin:s.bag.honTe}; });
    await page.locator(".s2-buy").click();
    await page.waitForFunction(b => window.__shopScene.bag.honTe < b.coin,before);
    const after = await page.evaluate(() => window.__shopScene.bag.items.filter(i=>i.code==="hoi_hon_dan").reduce((n,i)=>n+i.qty,0));
    assert.equal(after,before.n+1,"mua thật cập nhật Túi từ server");
    assert.equal(await search.inputValue(),"hoi hon dan");
    assert.match(await page.locator(".s2-dhead small").innerText(),new RegExp(`đang có ${after}`));
    // Đổi NPC qua entry point HUD với bag thật; sender của NPC mới được mô phỏng.
    await search.fill("dai hoi hon dan");
    await page.evaluate(async () => {
      const h=await import("/src/hudNpc.ts"); window.__campBuys=[];
      h.closeNpc(); h.openNpc("thuong_nhan_luu_dong", window.__shopScene.bag, {buy:(code,qty)=>window.__campBuys.push({code,qty})});
    });
    await page.locator("#npc button").filter({hasText:"Mua đan dược, phù chú"}).click();
    assert.equal(await page.locator(".s2-buy").count(),0,"NPC trại không có đan lớn đang tìm");
    await search.fill("hoi hon dan");
    await page.locator(".s2-buy").click();
    assert.deepEqual(await page.evaluate(()=>window.__campBuys),[{code:"hoi_hon_dan",qty:1}]);
    await shot("doi-NPC");
    console.log("Mua thật cập nhật Túi; đổi NPC đạt");
  }
  console.log(`Ảnh ${tag}: ${out}`);
} catch(e) { console.error(clientLog.join("\n")); throw e; }
finally { clearTimeout(watchdog); await browser?.close(); killChildren(); }
