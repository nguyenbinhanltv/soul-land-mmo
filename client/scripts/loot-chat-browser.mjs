// #1462: kiểm thông báo nhận đồ trên game thật. LOOT_TAG=truoc: chỉ chụp ảnh đối chiếu.
// LOOT_OUTPUT: thư mục ảnh; LOOT_TIMEOUT_MS: trần thời gian toàn bài.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.LOOT_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "loot-chat-")));
const tag = process.env.LOOT_TAG ?? "sau";
const children = [];
let browser;
const killChildren = () => { for (const child of children) { try { process.kill(process.platform === "win32" ? child.pid : -child.pid, "SIGTERM"); } catch {} } };
// Chặn treo: cả bài quá LOOT_TIMEOUT_MS (mặc định 180 s; chạy thường ~15 s) thì tắt tiến trình con rồi thoát mã 1.
const watchdog = setTimeout(() => { console.error("loot-chat-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.LOOT_TIMEOUT_MS ?? 180000));
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
  // Giữ phản hồi thoáng qua trong ảnh trên máy chụp chậm; không thay logic nhận / gộp hoặc dữ liệu game.
  await page.addInitScript(() => {
    const timeout = window.setTimeout.bind(window);
    window.setTimeout = (fn, ms, ...args) => [2200, 4200, 9000].includes(ms) ? 0 : timeout(fn, ms, ...args);
  });
  page.on("pageerror", (e) => console.error("[trình duyệt]", e.message));
  page.on("websocket", (ws) => { const t0 = Date.now(); clientLog.push(`ws mở ${ws.url().slice(-40)}`); ws.on("close", () => clientLog.push(`ws đóng sau ${Date.now() - t0} ms`)); });
  page.on("console", (m) => { if (["warning", "error"].includes(m.type())) clientLog.push(m.text().slice(0, 200)); });
  await page.addInitScript((t) => { localStorage.setItem("shh-token", t); }, token);
  // Chỉ lấy tham chiếu scene và đếm lệnh đi / khoá; không đổi logic. Không đếm `beastAt`: con trỏ ngữ cảnh (cập nhật mỗi khung hình) cũng gọi nó để dò hover, bấm vào hồn thú đã thành `lockTo`.
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `
const lootCreate = GameScene.prototype.create;
GameScene.prototype.create = function(...a) { window.__lootScene = this; return lootCreate.apply(this, a); };` });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__lootScene?.players.size > 0, null, { timeout:60000 });
  await page.waitForTimeout(1500);
  await page.locator(".g-skip").click();
  await page.locator(".ob-skip").click();
  for (const [width, height, touch] of [[960,540,false],[1280,720,false],[640,360,true]]) {
    await page.reload();
    await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
    await page.waitForFunction(() => window.__lootScene?.players.size > 0, null, { timeout:60000 });
    await page.setViewportSize({ width, height });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled:touch });
    await cdp.detach();
    await page.evaluate((touch) => document.body.classList.toggle("touch", touch), touch);
    await page.evaluate(async (rootPath) => {
      const f = await import("/src/feedback.ts"), d = await import("/@fs/" + rootPath + "/shared/data.ts");
      const base = { id: "loot-test", kind: "manh_vo_hon", code: d.shardCode("pha_hon_thuong"), qty: 1, years: null, stars: null, enhance: 0, stats: null, vohon: null };
      window.__lootTest = { f, d, base };
      document.getElementById("toasts")?.replaceChildren();
      for (let n = 0; n < 5; n++) f.lootToasts(n ? [{ ...base, qty:n }] : [], [{ ...base, qty:n+1 }]);
    }, root.replaceAll("\\", "/"));
    await page.screenshot({ animations:"disabled", path: resolve(out, `${tag}-${width}x${height}-x5.png`) });
    console.log(width, await page.locator("#chatbox").boundingBox(), await page.locator("#log").boundingBox());
    if (tag !== "truoc") {
      assert.match(await page.locator("#log").innerText(), /Nhận Mảnh Phá Hồn Thương ×5/);
      assert.equal(await page.locator('.toast[data-k="loot"]').count(), 0, "đồ thường chỉ vào chat");
    }
    await page.evaluate(() => {
      const { f, d, base } = window.__lootTest;
      f.lootToasts([], [{ ...base, code:d.RING_ITEM, years:9999 }]);
    });
    if (tag !== "truoc") assert.equal(await page.locator('.toast[data-k="loot"]').count(), 0, "hồn hoàn dưới ngưỡng chỉ chat");
    await page.evaluate(() => {
      const { f, d, base } = window.__lootTest;
      f.lootToasts([], [{ ...base, code:d.RING_ITEM, years:10000 }]);
      f.lootToasts([], [{ ...base, code:d.RING_ITEM, years:10001 }]);
    });
    if (tag !== "truoc") {
      assert.equal(await page.locator('.toast[data-k="loot"]').count(), 1, "chỉ một thanh đồ hiếm kể cả đang mờ");
      assert.match(await page.locator("#log").innerText(), /Hồn hoàn/);
      await page.locator('.toast[data-k="loot"]').waitFor({ state:"visible" });
    }
    await page.screenshot({ animations:"disabled", path: resolve(out, `${tag}-${width}x${height}-hiem.png`) });
    if (tag !== "truoc") assert.equal(await page.locator('.toast[data-k="loot"]').evaluate((e) => getComputedStyle(e).opacity), "1", "toast hiếm hiện rõ sau hiệu ứng vào");
    if (tag !== "truoc") {
      for (const code of ["hon_cot", "hon_hach"]) {
        await page.evaluate((code) => {
          const { f, base } = window.__lootTest;
          f.lootToasts([], [{ ...base, code, years:1, stars:1 }]);
        }, code);
        assert.equal(await page.locator('.toast[data-k="loot"]').count(), 1, `${code} bậc thấp vẫn giữ đúng một toast`);
      }
      const inventoryChecks = await page.evaluate(() => {
        const { f, d, base } = window.__lootTest;
        const core = { ...base, code:d.CORE_ITEM, stats:{set:d.CORE_SETS[0].id,main:"hp",subs:[]} };
        const a = { ...base, code:d.EQUIP_ITEM, stats:{tpl:d.EQUIP_TEMPLATES[0].id,ilvl:1,roll:0,affixes:[],luck:0} };
        const b = { ...a,id:"đổi-chỗ",stats:{...a.stats,tpl:d.EQUIP_TEMPLATES[1].id} };
        return {
          setChange:f.lootGained([core],[{...core,stats:{...core.stats,set:d.CORE_SETS[1].id}}]).length,
          swap:f.lootGained([a],[b]).length,
          distinct:f.lootGained([],[a,b]).length,
        };
      });
      assert.deepEqual(inventoryChecks, {setChange:0,swap:0,distinct:2}, "đổi tại chỗ / đổi trang bị không nhận giả; hai loại nhận thật vẫn tách dòng");
      await page.evaluate(async () => {
        const c = await import("/src/chat.ts");
        const realNow = Date.now, at = realNow();
        try {
          Date.now = () => at;
          c.chatLoot("test-gop", "kiểm gộp", 2);
          c.chatLoot("xen-ke", "xen kẽ", 1);
          Date.now = () => at + 2000;
          c.chatLoot("test-gop", "kiểm gộp", 3);
          Date.now = () => at + 2001;
          c.chatLoot("test-gop", "kiểm gộp", 1);
        } finally { Date.now = realNow; }
      });
      const text = await page.locator("#log").innerText();
      assert.match(text, /Nhận kiểm gộp ×5\nNhận kiểm gộp(?:\n|$)/, "cộng lượng qua dòng xen kẽ, hết hai giây tách dòng");
      await page.locator("#chat-expand").dispatchEvent("pointerdown");
      assert.equal(await page.locator("#chat-expand").getAttribute("aria-expanded"), "true");
      await page.locator("#chat-expand").dispatchEvent("pointerdown");
    }
    await page.evaluate(async () => {
      const { f } = window.__lootTest;
      const chat = await import("/src/chat.ts");
      chat.log("Túi đồ đã đầy.", "#ffb35c");
      window.__lootScene.room.send("pickup");
    });
    if (tag !== "truoc") {
      await page.locator("#chat-system-filter").dispatchEvent("pointerdown");
      assert.equal(await page.locator("#chat-system-filter").getAttribute("aria-pressed"), "false");
      assert.match(await page.locator("#log").innerText(), /Túi đồ đã đầy/);
      assert.doesNotMatch(await page.locator("#log").innerText(), /Nhận Mảnh/);
      await page.locator('.toast[data-k="info"]:not(.out)').filter({ hasText:"Không có hồn hoàn hay vật phẩm nào ở gần" }).waitFor();
      await page.locator("#chat-system-filter").dispatchEvent("pointerdown");
    }
    await page.screenshot({ animations:"disabled", path: resolve(out, `${tag}-${width}x${height}-loi.png`) });
    if (tag !== "truoc" && touch) {
      const box = await page.locator("#log").boundingBox();
      assert.ok(box && box.y >= 0 && box.y + box.height <= height, "hai dòng chat nằm trong màn cảm ứng");
      assert.ok(await page.locator("#chat-expand").isVisible(), "chạm mở chat từ trạng thái thu nhỏ");
    }
  }
  console.log(`Ảnh ${tag}: ${out}`);
} finally {
  clearTimeout(watchdog);
  await browser?.close(); killChildren();
}
