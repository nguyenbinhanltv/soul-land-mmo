// Lỗi giao diện ô Giáp to + nền tooltip nhiều ô: server RAM + vite riêng + Chromium `--mute-audio`; mặc đủ 10 ô trang bị, quét cỡ chữ 0/1/2 × 640x360..1920x1080.
// Kiểm: mọi ô trang bị cùng chiều rộng, ô Giáp cao bằng ô Mũ; tooltip nền liền (không border-image). Ảnh ra thư mục `BAG_OUTPUT`; `GT_PROBE=1` chụp thêm tooltip Túi / hồn cốt / hồn hạch; `GT_DPR` đổi tỉ lệ điểm ảnh.
// Kiểm: bố cục 4 cỡ, dấu đang mặc, kéo hai chiều, tab cảm ứng; chụp Túi riêng / cùng Hồn sư.
// `BAG_OUTPUT=<thư mục>`: nơi ghi ảnh (mặc định thư mục tạm); `BAG_TAG=truoc|sau`: tiền tố ảnh;  `BAG_SOFT=1`: chỉ ghi số đo, không assert (lượt "trước"); `GT_TIMING=1`: in các bước chậm nhất; `GT_KEEP_LOOP=1`: không cho vòng vẽ game nghỉ lúc quét (tái hiện #1617).
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
const clientLog = []; // lỗi / cảnh báo console của trang, in kèm khi trượt
const killChildren = () => { for (const child of children) { try { process.kill(process.platform === "win32" ? child.pid : -child.pid, "SIGTERM"); } catch {} } };
// Chặn treo: cả bài quá BAG_TIMEOUT_MS (mặc định 180 s; chạy thường ~15 s) thì tắt tiến trình con rồi thoát mã 1.
// Bước đang chạy + mốc thời gian từng bước: watchdog cắt thì in ra bước nào, đã chạy bao lâu, trang ở trạng thái gì (chậm hay treo thật).
const t0 = Date.now(), marks = []; let step = "khởi động";
const mark = (s) => { step = s; marks.push([Date.now() - t0, s]); };
let page;
// Bước tốn thời gian nhất (mốc trước → mốc sau): chỉ ra chậm ở đâu thay vì chỉ "quá giờ".
const slowest = (n) => marks.slice(1).map((m, i) => [marks[i][1], m[0] - marks[i][0]]).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k}=${v} ms`).join("; ");
const watchdog = setTimeout(async () => {
  const state = page ? await Promise.race([page.evaluate(() => ({ url: location.pathname, tip: document.getElementById("tip")?.hidden, char: !!document.getElementById("char")?.offsetParent, vp: [innerWidth, innerHeight] })).catch((e) => `trang không trả lời: ${e.message.slice(0, 80)}`), sleep(3000).then(() => "trang không trả lời trong 3 s")]) : "chưa mở trang";
  console.error(`giap-tooltip-browser quá thời gian ${Date.now() - t0} ms: đang ở bước "${step}" (${marks.length} mốc); trạng thái trang: ${JSON.stringify(state)}; bước chậm nhất: ${slowest(5)}; console: ${clientLog.slice(-5).join(" ; ")}`);
  killChildren(); process.exit(1);
}, Number(process.env.BAG_TIMEOUT_MS ?? 180000));
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

try {
  mark("khởi động server + vite");
  await mkdir(out, { recursive: true });
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  const serverLog = start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => {
    const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json(); assert.ok(r.ok, data.error); return data;
  };
  mark("đăng nhập + tạo nhân vật");
  const name = `U1 ${Date.now().toString(36).slice(-5)}`;
  const { token } = await post("/api/login", { name, password: "U1-local-preview!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });

  mark("mở trình duyệt");
  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || undefined, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: Number(process.env.GT_DPR ?? 1) });
  // `GT_CPU_THROTTLE=<n>`: làm chậm CPU trang n lần (mô phỏng runner CI chậm) để tái hiện lỗi thời điểm.
  if (Number(process.env.GT_CPU_THROTTLE) > 1) { const cdp = await page.context().newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.GT_CPU_THROTTLE) }); }
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
  mark("tải trang /choi/ + vào game");
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__u1?.players.size > 0);
  await page.waitForTimeout(1500);
  mark("cấp đồ + mặc trang bị");
  const test = async (data) => { await page.evaluate((d) => window.__u1.room.send("test", d), data); await sleep(350); };
  const SLOTS = ["vu_khi","mu","ao","dai","giay","day_chuyen","vong_trai","vong_phai","nhan_trai","nhan_phai"];
  for (const s of SLOTS) await test({ op: "gear", tpl: `${s}_chi_bao`, ilvl: 7, enhance: 15 });
  await test({ op: "give", code: "hon_cot", qty: 4 });
  await page.evaluate(() => { document.querySelector("#guide .g-skip")?.click(); document.querySelector("#onboard .ob-skip")?.click(); });
  await page.evaluate(() => { for (const it of window.__u1.bag.items.filter((i) => i.code === "trang_bi")) window.__u1.room.send("equipgear", { id: it.id }); });
  await page.waitForFunction((n) => window.__u1.gear.items.length >= n, SLOTS.length);
  await page.keyboard.press("KeyH");
  await page.locator("#char .cdtabs button").first().click();
  await page.waitForSelector("#char .ecell.has");
  if (process.env.GT_PROBE) {
    await test({ op: "gear", tpl: "ao_chi_bao", ilvl: 9, enhance: 3 });
    await test({ op: "give", code: "hon_cot", qty: 2 }); await test({ op: "give", code: "hon_hach", qty: 2 });
    await page.keyboard.press("KeyB"); await sleep(600);
    for (const [name, sel] of [["bag-gear", '#bag .bslot[data-id]:not(.empty)']]) {
      const n = await page.locator(sel).count();
      for (let i = 0; i < Math.min(n, 8); i++) { await page.locator(sel).nth(i).hover(); await sleep(300); await page.screenshot({ path: resolve(out, `${tag}-probe-${name}-${i}.png`) }); }
    }
    await page.locator("#char .cdtabs button").nth(1).click(); await sleep(400);
    await page.locator("#char .bcell").first().hover(); await sleep(300); await page.screenshot({ path: resolve(out, `${tag}-probe-bone.png`) });
    await page.locator("#char .cdtabs button").nth(2).click(); await sleep(400);
    await page.locator("#char .bcell, #char .ccell").first().hover(); await sleep(300); await page.screenshot({ path: resolve(out, `${tag}-probe-core.png`) });
    await page.mouse.move(2, 2);
  }
  mark("bắt đầu quét");
  // Từ đây chỉ đo DOM (ô trang bị, tooltip): cho vòng vẽ Phaser nghỉ. Nếu không, mỗi lần đổi cỡ khung (tới 1920x1080) game vẽ lại canvas bằng swiftshader (CPU)
  // tranh CPU với layout / chụp ảnh, runner chậm thì cả bài vượt watchdog 180 s dù không treo (#1617). `GT_KEEP_LOOP=1`: giữ vòng vẽ (lượt "trước").
  if (process.env.GT_KEEP_LOOP !== "1") await page.evaluate(() => window.__u1.game.loop.sleep());
  const results = [];
  for (const fs of [0, 1, 2]) for (const [width, height] of [[640,360],[960,540],[1280,720],[1920,1080]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate((n) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (n) document.body.classList.add(`a11y-fs-${n}`); }, fs);
    await sleep(500);
    const tag2 = `${tag}-fs${fs}-${width}x${height}`;
    mark(`${tag2} bố cục`);
    const cells = await page.evaluate(() => [...document.querySelectorAll("#char .ecell")].map((c) => { const r = c.getBoundingClientRect(); return { slot: c.dataset.slot, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 }; }));
    await page.screenshot({ path: resolve(out, `${tag2}-bang.png`) });
    const ao = cells.find((c) => c.slot === "ao"), mu = cells.find((c) => c.slot === "mu");
    check(cells.length === 10, `đủ 10 ô trang bị ${tag2}`);
    check(cells.every((c) => c.w === mu.w), `mọi ô trang bị cùng chiều rộng ${tag2}: ${JSON.stringify(cells)}`);
    check(ao.h === mu.h && ao.w === ao.h || fs > 0 && ao.h === mu.h, `ô Giáp cao bằng ô Mũ ${tag2}: ao ${ao.w}x${ao.h}, mu ${mu.w}x${mu.h}`);
    // #1634: hai nút "Mặc tốt nhất" theo cỡ chữ của bảng (bằng chữ thân bảng, 12 / 15 / 18 px), không tràn khung bảng
    const btn = await page.evaluate(() => {
      const px = (el) => parseFloat(getComputedStyle(el).fontSize), box = document.querySelector("#char").getBoundingClientRect();
      const bs = [...document.querySelectorAll("#char .f2-nut-chinh, #char .f2-nut-phu")].filter((b) => b.textContent.startsWith("Mặc tốt nhất"));
      return { tab: px(document.querySelector("#char")), fonts: bs.map(px), n: bs.length, over: bs.some((b) => b.scrollWidth > b.clientWidth + 1 || b.getBoundingClientRect().right > box.right + 1) };
    });
    check(btn.n === 2 && btn.fonts.every((f) => f === btn.tab), `nút Mặc tốt nhất cỡ chữ bằng chữ thân bảng (--fs-m: 12 / 15 / 18 px) ${tag2}: ${JSON.stringify(btn)}`);
    check(!btn.over, `nút Mặc tốt nhất không tràn ${tag2}`);
    // rê chuột vào ô Giáp và ô Mũ: chụp tooltip
    for (const slot of ["ao", "mu"]) {
      mark(`${tag2} ${slot} rê chuột`);
      const el = page.locator(`#char .ecell[data-slot="${slot}"]`);
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await el.hover();
      if (process.env.GT_OLD_WAIT) await sleep(350);
      else {
        // Chú thích hiện sau HOVER_MS (250 ms, tooltip.ts) tính từ pointerover; máy chậm thì trễ hơn: chờ theo trạng thái, không ngủ cố định.
        const shown = await page.waitForFunction(() => { const t = document.getElementById("tip"); return !!t && !t.hidden && t.getBoundingClientRect().width > 0; }, null, { timeout: 5000 }).then(() => true, () => false);
        if (!shown) console.log(`  chú thích ${slot} không hiện ${tag2}: ${JSON.stringify(await page.evaluate((sl) => {
          const c = document.querySelector(`#char .ecell[data-slot="${sl}"]`), t = document.getElementById("tip"), r = c?.getBoundingClientRect();
          const at = r ? document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) : null;
          return { vp: [innerWidth, innerHeight], cell: r && [r.x, r.y, r.width, r.height].map(Math.round), tipped: c?.hasAttribute("data-tipped"), hasTitle: c?.hasAttribute("title"), tipHidden: t?.hidden, tipExists: !!t, atPoint: at ? `${at.tagName}#${at.id}.${at.className}`.slice(0, 80) : null, covered: !!at && !c?.contains(at), charOpen: !!document.getElementById("char")?.offsetParent };
        }, slot))} | console: ${clientLog.slice(-5).join(" ; ")}`);
      }
      mark(`${tag2} ${slot} chụp`);
      const tip = await page.evaluate(() => { const t = document.getElementById("tip"); if (!t) return null; const r = t.getBoundingClientRect(), cs = getComputedStyle(t); return { x: r.x, y: r.y, w: r.width, h: r.height, display: cs.display, op: cs.opacity, bg: cs.backgroundColor, bi: cs.borderImageSource.slice(0, 60), bis: cs.borderImageSlice, biw: cs.borderImageWidth, bir: cs.borderImageRepeat, bw: cs.borderTopWidth }; });
      await page.screenshot({ path: resolve(out, `${tag2}-tip-${slot}.png`) });
      if (slot === "ao") results.push({ fs, width, height, cells, tip });
      check(tip && tip.bis !== undefined && tip.bi === "none" && tip.w > 0, `tooltip ${slot} nền liền (không border-image) ${tag2}: ${JSON.stringify(tip)}`);
      check(tip && /^rgb\(26, 16, 32\)$/.test(tip.bg), `tooltip ${slot} nền Mực đặc ${tag2}`);
      await page.mouse.move(2, 2); await sleep(150);
    }
  }
  mark("xong");
  if (process.env.GT_TIMING) console.log(`tổng ${Date.now() - t0} ms; bước chậm nhất:`, slowest(5));
  await writeFile(resolve(out, `${tag}-do.json`), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results.map((r) => ({ fs: r.fs, res: `${r.width}x${r.height}`, ao: r.cells.find((c) => c.slot === "ao"), mu: r.cells.find((c) => c.slot === "mu"), tip: r.tip && { w: r.tip.w, h: r.tip.h, bg: r.tip.bg, biw: r.tip.biw } })), null, 1));
} finally {
  clearTimeout(watchdog);
  await browser?.close();
  killChildren();
}
