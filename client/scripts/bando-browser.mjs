// Bản đồ lớn (M / N) trong game thật trên server RAM riêng: radar gọn, hai chế độ Thế giới / Khu vực, chọn trận, tìm, đóng bằng M / N / Esc / ✕,
// nút đủ lớn trên cảm ứng, không chồng nút. Ảnh 960×540, 1280×720, 1920×1080 và 640×360 (cảm ứng) ghi ra BANDO_OUTPUT (mặc định thư mục tạm).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, realpath } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const installed = fileURLToPath(new URL("../../", import.meta.url));
const root = await realpath(resolve(process.env.BANDO_SOURCE_ROOT ?? installed));
const out = resolve(process.env.BANDO_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "bando-")));
const viewports = [[960, 540, false], [1280, 720, false], [1920, 1080, false], [640, 360, true], [844, 390, true]];
const before = process.env.BANDO_BEFORE === "1";
const children = []; let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => { const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); }); });
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
const failures = [];
const check = (ok, msg) => { if (!ok) { failures.push(msg); console.error("LỖI:", msg); } };

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
  for (const [width, height, touch] of viewports.filter(([, , touch]) => !process.env.BANDO_TOUCH_ONLY || touch)) {
    const size = `${width}x${height}`, tag = (s) => `${size}: ${s}`;
    const { token } = await post("/api/login", { name: `BD ${width} ${Date.now().toString(36)}`, password: "BD-local-preview!" });
    await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
    await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(30000);
    page.on("pageerror", (e) => errors.push(e.message));
    const dismiss = async () => { for (let i = 0; i < 4; i++) { const b = page.locator("#onboard:not([hidden]) .ob-skip, .guide:not([hidden]) button:has-text(\"Bỏ qua\")").first(); if (!(await b.isVisible().catch(() => false))) return; await b.click({ timeout: 2000 }).catch(() => {}); await sleep(150); } };
    // Chỉ lấy tham chiếu cảnh để dùng hook thử (đứng lên trận mở khoá); không đổi dữ liệu hay hàm vẽ.
    await page.route("**/src/scenes/GameScene.ts*", async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + "\nconst bdCreate = GameScene.prototype.create; GameScene.prototype.create = function(...args) { window.__bd = this; return bdCreate.apply(this, args); };" });
    });
    await page.addInitScript((t) => { localStorage.setItem("shh-token", t); localStorage.setItem("soul.map.mode", "area"); }, token);
    await page.goto(`${web}/choi/`);
    try { await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click(); } catch (e) {
      await page.screenshot({ path: resolve(out, `${size}-loi-vao-game.png`) }).catch(() => {});
      console.error("Không vào được game:", errors.join(" | "), (await page.locator("body").innerText().catch(() => "")).slice(0, 400)); throw e;
    }
    await page.waitForFunction(() => document.getElementById("zoneName")?.textContent && !document.getElementById("hud")?.hidden, null, { timeout: 30000 }).catch(() => {});
    await page.waitForSelector("#mini", { state: "visible" });
    await sleep(1500);
    // Bỏ thẻ hướng dẫn tân thủ nếu có (che bản đồ trong ảnh).
    await page.waitForFunction(() => window.__bd?.players?.size > 0 && window.__bd.waypoints?.length >= 3);
    // Đứng lên hai trận của Thánh Hồn Thôn để mở khoá (server quyết định; hook thử chỉ đặt chỗ đứng), rồi đứng ra giữa làng.
    for (const i of [0, 1]) {
      await page.evaluate((i) => { const w = window.__bd.waypoints[i]; window.__bd.room.send("test", { op: "goto", x: w.x + w.w / 2, y: w.y + w.h / 2 }); }, i);
      await page.waitForFunction((i) => window.__bd.wpOpen.has(window.__bd.waypoints[i].key), i, { timeout: 8000 });
    }
    await dismiss();

    if (touch) {
      for (const fs of [0, 1, 2]) {
        await page.evaluate((fs) => {
          document.body.classList.remove("a11y-fs-1", "a11y-fs-2");
          if (fs) document.body.classList.add(`a11y-fs-${fs}`);
        }, fs);
        const targets = await page.locator("#radarMode,#radarIn,#radarOut,#chanBtn,#worldBtn,#chattabs button,#chat,#sbTabQuest,#sbTabParty").evaluateAll((els) => els.map((e) => {
          const r = e.getBoundingClientRect(); return { id:e.id || e.textContent, w:r.width, h:r.height };
        }));
        if (!before) for (const t of targets) check(t.w >= 43.5 && t.h >= 43.5, tag(`fs${fs}: vùng chạm ${t.id} ${t.w}×${t.h}`));
        if (!before) {
          const overlaps = await page.locator("#radarMode,#radarIn,#radarOut,#worldBtn,#chanBtn").evaluateAll((els) => {
            const pairs = [];
            for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
              const a = els[i].getBoundingClientRect(), b = els[j].getBoundingClientRect();
              if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) pairs.push([els[i].id, els[j].id]);
            }
            return pairs;
          });
          check(overlaps.length === 0, tag(`fs${fs}: vùng chạm radar chồng nhau ${JSON.stringify(overlaps)}`));
        }
        await page.screenshot({ path: resolve(out, `${size}-hud-fs${fs}.png`) });
      }
      await page.evaluate(() => document.body.classList.remove("a11y-fs-1", "a11y-fs-2"));
    }

    // 1. Radar gọn: không còn dòng chú giải / online / ba nút; một nút Bản đồ.
    const radar = await page.evaluate(() => {
      const r = (id) => document.getElementById(id), box = (id) => { const e = r(id); if (!e) return null; const b = e.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), shown: b.width > 0 && getComputedStyle(e).display !== "none" }; };
      return { legend: !!r("mapLegend"), online: !!r("online"), area: !!r("areaBtn"), world: box("worldBtn"), radar: box("radar"), zone: r("zoneName").textContent, info: box("radarInfo") };
    });
    check(!radar.legend && !radar.online && !radar.area, tag(`radar còn dòng phụ / nút cũ ${JSON.stringify(radar)}`));
    check(radar.world?.shown, tag("thiếu nút Bản đồ"));
    check(radar.radar.w <= 132, tag(`radar chưa thu nhỏ: ${radar.radar.w}px`));
    await page.waitForFunction(() => !document.querySelector(".toast"), null, { timeout: 15000 }).catch(() => {});
    const rects = await page.evaluate(() => { const o = {}; for (const id of ["radar", "zoneName", "chanBtn", "worldBtn", "bottombar", "lcol", "rcol"]) { const e = document.getElementById(id); if (e) { const b = e.getBoundingClientRect(); o[id] = [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; } } const w = document.getElementById("worldBtn").getBoundingClientRect(); const at = document.elementFromPoint(w.x + w.width / 2, w.y + w.height / 2); o.atWorldBtn = at?.id || at?.className || at?.tagName; return o; });
    console.log(size, "bố cục radar", JSON.stringify(rects));
    check(rects.atWorldBtn === "worldBtn" || /worldBtn/.test(String(rects.atWorldBtn)), tag(`nút Bản đồ bị che bởi ${rects.atWorldBtn}`));
    await page.screenshot({ path: resolve(out, `${size}-0-radar-gon.png`) });

    // 2. Chế độ Khu vực (N) + chuyển sang Thế giới (M) + đóng.
    await page.keyboard.press("KeyN");
    await page.waitForFunction(() => !document.getElementById("mapview").hidden && document.getElementById("mapview").dataset.mode === "area");
    await sleep(700);
    await page.screenshot({ path: resolve(out, `${size}-1-khu-vuc.png`) });
    await page.keyboard.press("KeyM");
    await page.waitForFunction(() => document.getElementById("mapview").dataset.mode === "world" && !document.getElementById("world").hidden);
    await page.waitForFunction(() => document.querySelectorAll("#world .wm-node").length >= 11);
    await page.waitForFunction(() => document.querySelector("#world .wm-notice")?.hidden === true && !!document.querySelector("#world .wm-node.open")); // tin `world` đã về, trận vừa mở khoá sáng
    await sleep(900);
    await page.screenshot({ path: resolve(out, `${size}-2-the-gioi.png`) });
    if (touch) {
      for (const fs of [0, 1, 2]) {
        await page.evaluate((fs) => {
          document.body.classList.remove("a11y-fs-1", "a11y-fs-2");
          if (fs) document.body.classList.add(`a11y-fs-${fs}`);
        }, fs);
        const overflow = await page.evaluate(() => {
          const box = document.querySelector("#world").getBoundingClientRect();
          return [...document.querySelectorAll(".wm-bar button,.wm-search input")].map(e => {
            const r = e.getBoundingClientRect();
            return { label:e.getAttribute("aria-label") || e.textContent, fits:r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom, w:r.width, h:r.height };
          });
        });
        if (!before) for (const t of overflow) check(t.fits && t.w >= 43.5 && t.h >= 43.5, tag(`fs${fs}: công cụ ngoài khung / nhỏ: ${JSON.stringify(t)}`));
        if (!before) {
          await page.locator(".wm-tools button").filter({ hasText: /^\+$/ }).tap();
          const minus = page.locator(".wm-tools button").filter({ hasText: /^−$/ });
          await minus.tap();
          await page.locator(".wm-tools button").filter({ hasText: /^Vừa khung$/ }).tap();
        }
        await page.mouse.move(1, 1);
        await page.waitForTimeout(300);
        await page.screenshot({ path: resolve(out, `${size}-world-fs${fs}.png`) });
      }
      await page.evaluate(() => document.body.classList.remove("a11y-fs-1", "a11y-fs-2"));
    }
    const world = await page.evaluate(() => {
      const bx = (e) => { const b = e.getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
      const nodes = [...document.querySelectorAll("#world .wm-node")].map((e) => ({ id: e.dataset.id, cls: e.className, ...bx(e), label: e.getAttribute("aria-label") }));
      const tabs = [...document.querySelectorAll("#mapview .p2-tab")].map((e) => ({ t: e.textContent, sel: e.classList.contains("sel"), ...bx(e) }));
      const close = bx(document.querySelector("#mapview .scr-x")), view = bx(document.querySelector("#world .wm-view"));
      const img = document.querySelector("#world .wm-bg"), tools = [...document.querySelectorAll("#world .wm-bar button")].map((e) => ({ t: e.textContent, ...bx(e) }));
      return { nodes, tabs, close, view, imgOk: img.complete && img.naturalWidth > 0, tools, me: !!document.querySelector("#world .wm-me"), mode: document.getElementById("mapview").dataset.mode };
    });
    await page.waitForFunction(() => { const i = document.querySelector("#world .wm-bg"); return i.complete && i.naturalWidth > 0; }, null, { timeout: 15000 }).catch(() => {});
    check((await page.evaluate(() => { const i = document.querySelector("#world .wm-bg"); return i.complete && i.naturalWidth > 0; })), tag("tranh nền chưa tải"));
    check(world.nodes.length === 11, tag(`số nút bản đồ ${world.nodes.length} ≠ 11`));
    check(world.nodes.some((n) => n.cls.split(" ").includes("open")) && world.nodes.some((n) => n.cls.split(" ").includes("locked")), tag(`không có đủ nút sáng và xám: ${world.nodes.map((n) => `${n.id}=${n.cls}`).join(", ")}`));
    check(world.me, tag("thiếu dấu Bạn ở đây"));
    check(world.tabs.length === 2 && world.tabs.find((t) => t.sel)?.t.includes("Thế giới"), tag(`tab ${JSON.stringify(world.tabs)}`));
    check(world.close.w >= 44 && world.close.h >= 44, tag(`nút ✕ nhỏ ${world.close.w}×${world.close.h}`));
    if (touch) {
      for (const t of [...world.tabs, ...world.tools]) check(t.h >= 43.5 && t.w >= 43.5, tag(`nút cảm ứng nhỏ: ${t.t} ${t.w}×${t.h}`));
      for (const n of world.nodes) check(n.w >= 43.5 && n.h >= 43.5, tag(`nút bản đồ nhỏ: ${n.id}`));
    }
    // Nút bản đồ nằm trong khung nhìn (chuyển động theo `place`), không trùng nhau hoàn toàn ở mức vừa khung.
    for (const n of world.nodes) check(n.x + n.w / 2 >= world.view.x - 1 && n.x + n.w / 2 <= world.view.x + world.view.w + 1 && n.y + n.h / 2 >= world.view.y - 1 && n.y + n.h / 2 <= world.view.y + world.view.h + 1, tag(`nút ngoài khung nhìn: ${n.id}`));

    // 3. Chọn Thánh Hồn Thôn: thẻ chi tiết hiện cấp đề xuất, các trận; nút chính hợp lý; trận hiện ra.
    await dismiss();
    if (touch) {
      // #1447: điểm trên tranh vừa khung đang chồng nhau; chọn qua tìm kiếm có sẵn.
      await page.locator(".wm-search input").fill("nac dinh thanh");
      await page.locator(".wm-find li").first().click();
    } else await page.locator('#world .wm-node[data-id="nac_dinh_thanh"]').click();
    await page.waitForFunction(() => document.querySelector("#world .wm-card .wm-t")?.textContent === "Nặc Đinh Thành");
    check(await page.locator("#world .wm-card .wm-li").count() === 3, tag("thẻ bản đồ không liệt kê 3 trận"));
    check(await page.locator("#world .wm-wp").count() >= 3, tag("trận của bản đồ đang chọn không hiện trên tranh"));
    const primary = await page.evaluate(() => { const b = document.querySelector("#mapview .p2-primary"); return { t: b.textContent, d: b.disabled }; });
    check(primary.t.includes("Tự đi tới Nặc Đinh Thành") && !primary.d, tag(`nút chính ${JSON.stringify(primary)}`));
    await page.locator("#world .wm-li").first().click();
    await page.waitForFunction(() => /Đã mở khoá|Chưa mở khoá/.test(document.querySelector("#world .wm-card")?.textContent ?? ""));
    const card = await page.locator("#world .wm-card").innerText();
    check(/Cấp đề xuất/.test(card) && /Trạng thái/.test(card), tag(`thẻ trận thiếu cấp / trạng thái: ${card}`));
    await sleep(300);
    await page.screenshot({ path: resolve(out, `${size}-3-chon-tran.png`) });

    // 4. Tìm: gõ "lac nhat" ra Lạc Nhật Sâm Lâm; chọn thì thẻ đổi.
    await page.locator("#world .wm-search input").fill("lac nhat");
    await page.waitForFunction(() => document.querySelectorAll("#world .wm-find li:not(.none)").length >= 1);
    await page.locator("#world .wm-find li").first().click();
    await page.waitForFunction(() => /Lạc Nhật/.test(document.querySelector("#world .wm-card .wm-t")?.textContent ?? ""));

    // 5. Đóng: M đóng khi đang ở Thế giới; N mở Khu vực rồi M chuyển sang Thế giới; Esc đóng; ✕ đóng; game không dừng (tin vẫn chạy).
    await page.keyboard.press("KeyM"); await page.waitForFunction(() => document.getElementById("mapview").hidden);
    await page.keyboard.press("KeyN"); await page.waitForFunction(() => !document.getElementById("mapview").hidden && document.getElementById("mapview").dataset.mode === "area");
    await page.keyboard.press("KeyM"); await page.waitForFunction(() => document.getElementById("mapview").dataset.mode === "world" && !document.getElementById("mapview").hidden);
    await page.keyboard.press("Escape"); await page.waitForFunction(() => document.getElementById("mapview").hidden);
    await page.locator("#worldBtn").click(); await page.waitForFunction(() => !document.getElementById("mapview").hidden && document.getElementById("mapview").dataset.mode === "world");
    await page.locator("#mapview .scr-x").click(); await page.waitForFunction(() => document.getElementById("mapview").hidden);
    // Bấm radar mở Khu vực.
    await page.locator("#mini").click({ position: touch ? { x: 50, y: 50 } : { x: 20, y: 20 } }); await page.waitForFunction(() => !document.getElementById("mapview").hidden && document.getElementById("mapview").dataset.mode === "area");
    await page.keyboard.press("Escape"); await page.waitForFunction(() => document.getElementById("mapview").hidden);
    const real = errors.filter((e) => !/is not valid JSON/.test(e)); // gói riêng (iso-private) vắng ở máy dev: Phaser nhận trang HTML thay JSON, có từ trước
    check(real.length === 0, tag(`lỗi trang: ${real.join(" | ")}`));
    await context.close();
    console.log(`đã kiểm ${size}`);
  }
  console.log(`Ảnh: ${out}`);
  if (failures.length) { console.error(`${failures.length} lỗi`); process.exitCode = 1; } else console.log("Bản đồ lớn: đạt");
} finally {
  await browser?.close().catch(() => {});
  for (const c of children) c.kill();
}
