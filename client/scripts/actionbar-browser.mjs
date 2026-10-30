// C8: kiểm tra HUD trong game thật trên server RAM riêng; ảnh chỉ ghi ra thư mục tạm/artifact.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readdir, realpath, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

/** Esc đóng bảng trên cùng; khi không còn bảng nào, Esc mở menu hub (#hub nằm bên phải, chặn chuột vào nút ở dưới): đóng nó lại để bước sau bấm được. */
async function escClose(page) {
  await page.keyboard.press("Escape");
  if (await page.locator("#hub").isVisible()) await page.keyboard.press("Escape");
}

const installed = fileURLToPath(new URL("../../", import.meta.url));
const root = await realpath(resolve(process.env.C8_SOURCE_ROOT ?? installed));
const out = resolve(process.env.C8_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "c8-preview-")));
const before = process.env.C8_PHASE === "before", phase = before ? "before" : "after";
const children = [], samples = [], nameSamples = [], nameFailures = [];
const viewports = [[960, 540, false], [1280, 720, false], [1920, 1080, false]];
if (process.env.C8_TOUCH === "1") viewports.push([844, 390, true]);
const namesOnly = process.env.C8_NAMES_ONLY === "1";
let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => {
  const s = createServer(); s.on("error", reject);
  s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); });
});
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
async function hook(page, op, data = {}) {
  return page.evaluate(({ op, data }) => new Promise((done, reject) => {
    const room = window.__c8Scene.room;
    const timer = setTimeout(() => { off(); reject(new Error(`Hook ${op} quá hạn`)); }, 5000);
    const off = room.onMessage("test", (m) => { if (m.op === op) { clearTimeout(timer); off(); done(m); } });
    room.send("test", { op, ...data });
  }), { op, data });
}
// Giữ fixture thiếu lực qua cả khung vẽ/chụp: vùng an toàn hồi MP trước khi máy CI chậm kịp đọc HUD.
async function withEmptyMp(page, check) {
  await hook(page, "ready", { mp: 0 });
  let running = true;
  const drain = (async () => {
    while (running) { await hook(page, "drain", { pct: 100 }); await sleep(100); }
  })();
  try { await Promise.race([check(), drain]); }
  finally { running = false; await drain; }
}
async function screenshot(page, name, size) {
  await page.screenshot({ path: resolve(out, `${phase}-${size}-${name}.png`) });
}

async function layoutBounds(page) {
  return page.evaluate(() => {
    const guide = document.querySelector("#guide"), g = guide.getBoundingClientRect();
    const guideVisible = !guide.hidden && getComputedStyle(guide).display !== "none";
    const team = [...document.querySelectorAll("#team button")].map((e) => {
      const r = e.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { slot: e.dataset.slot, reachable: e.contains(hit), overlappingGuide: guideVisible && r.left < g.right && r.right > g.left && r.top < g.bottom && r.bottom > g.top };
    });
    const tabs = [...document.querySelectorAll("#chattabs button")].map((e) => ({ text: e.textContent, scroll: e.scrollWidth, width: e.clientWidth }));
    return { guideVisible, team, tabs };
  });
}

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
  for (const [width, height, touch] of viewports) {
    const size = `${width}x${height}`;
    const { token } = await post("/api/login", { name: `C8 ${width} ${Date.now().toString(36)}`, password: "C8-local-preview!" });
    await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
    await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(30000);
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript((token) => { localStorage.setItem("shh-token", token); }, token);
    // Chỉ lấy tham chiếu cảnh để gửi ý định/hook local và đọc state; không thay dữ liệu hay hàm vẽ game.
    await page.route("**/src/scenes/GameScene.ts*", async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + "\nconst c8Create = GameScene.prototype.create; GameScene.prototype.create = function(...args) { window.__c8Scene = this; return c8Create.apply(this, args); };" });
    });
    await page.goto(`${web}/choi/`);
    await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
    await page.waitForFunction(() => window.__c8Scene?.owned?.list.length >= 2 && window.__c8Scene.players.size > 0);
    for (const vohon of ["cuu_tinh_that_sat_kiem", "thien_can_bach_ngoc_dinh"]) await hook(page, "grant", { vohon });
    await page.waitForFunction(() => window.__c8Scene.owned.list.length === 4);
    const list = await page.evaluate(() => window.__c8Scene.owned.list);
    const team = [list[1].rowId, list[0].rowId, list[2].rowId, list[3].rowId];
    await page.evaluate((slots) => window.__c8Scene.room.send("team", { slots }), team);
    for (const v of list) await hook(page, "set", { rowId: v.rowId, level: 40, rings: [100, 1000, 10000, 50000] });
    await page.waitForFunction(() => window.__c8Scene.owned.team.every((r) => r > 0) && window.__c8Scene.owned.list.every((v) => v.level === 40 && v.rings.length === 4));
    await page.waitForFunction(() => document.querySelector('.sk[data-i="0"]:not(.locked)'));
    await page.waitForTimeout(9500);
    const initialLayout = await layoutBounds(page);
    if (!touch && !before) {
      assert.ok(initialLayout.guideVisible, `Phải kiểm guide đang mở: ${size}`);
      assert.equal(initialLayout.tabs.length, 7); // 6 kênh chat + tab "Tin" (hệ thống, #755)
      if (initialLayout.team.some((e) => e.overlappingGuide || !e.reachable) || initialLayout.tabs.some((e) => e.scroll > e.width)) nameFailures.push({ size, initialLayout });
    }
    await screenshot(page, "san-sang", size);
    if (!touch) {
      const second = page.locator('#team button[data-slot="1"]');
      await second.click();
      await page.waitForFunction((id) => window.__c8Scene.owned.active === id, team[1]);
      await page.waitForFunction(() => [...document.querySelectorAll("#skills .sk-name")].some((e) => e.textContent === "Chu Võng Thúc Phược"));
      // Thanh gọn: tên hồn kỹ không hiện trên ô (display:none), chỉ ở chú thích và aria-label.
      const labels = await page.locator("#skills .sk-name").evaluateAll((els) => els.map((el) => ({ name: el.textContent, shown: getComputedStyle(el).display !== "none" })));
      const clearance = await page.evaluate(() => {
        const a = document.querySelector("#actrow").getBoundingClientRect();
        return [...document.querySelectorAll("#guide, #cmdChip")].filter((e) => !e.hidden && getComputedStyle(e).display !== "none").map((e) => {
          const b = e.getBoundingClientRect();
          return { id: e.id, overlapping: a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top };
        });
      });
      const layout = await layoutBounds(page);
      nameSamples.push({ size, labels, clearance, initialLayout, layout });
      if (!before && (layout.team.some((e) => e.overlappingGuide || !e.reachable) || layout.tabs.some((e) => e.scroll > e.width))) nameFailures.push({ size, layout });
      await screenshot(page, "ten-day-du", size);
      if (!before && clearance.some((e) => e.overlapping)) nameFailures.push({ size, clearance });
      if (!before) {
        assert.ok(labels.every((l) => !l.shown), `Tên hồn kỹ không được hiện trên ô: ${JSON.stringify(labels)}`);
        const ring = page.locator('#skills .sk[data-i="0"]');
        await ring.hover(); await page.waitForFunction(() => !document.querySelector("#tip").hidden);
        assert.ok((await page.locator("#tip").innerText()).includes(await ring.locator(".sk-name").textContent()), "Rê chuột phải hiện tên hồn kỹ ở chú thích");
        await page.mouse.move(0, 0);
      }
      if (namesOnly) { await context.close(); console.log(`Tên hồn kỹ ${phase} ${size}: ${JSON.stringify(labels)}`); continue; }
      if (await page.locator("#guide").isVisible()) await page.getByRole("button", { name: "Bỏ qua", exact: true }).click();
      await page.waitForFunction(() => window.__c8Scene.vit.swCd - (performance.now() - window.__c8Scene.vitAt) / 1000 <= 0);
      await page.locator('#team button[data-slot="0"]').click();
      await page.waitForFunction((id) => window.__c8Scene.owned.active === id, team[0]);
      await page.waitForFunction(() => window.__c8Scene.vit.swCd - (performance.now() - window.__c8Scene.vitAt) / 1000 <= 0);
    } else if (namesOnly) { await context.close(); continue; }
    if (!before) {
      assert.equal(await page.locator("#actrow .action-group").count(), 3);
      await page.waitForFunction(() => [...document.querySelectorAll("#bskills .ico img")].every((img) => img.complete && img.naturalWidth > 0));
      const boneIcons = await page.locator("#bskills .ico img").evaluateAll((imgs) => imgs.map((img) => {
        const r = img.getBoundingClientRect(), cell = img.closest("button").getBoundingClientRect();
        return { loaded: img.complete && img.naturalWidth > 0, inside: r.width > 0 && r.height > 0 && r.x >= cell.x && r.y >= cell.y && r.right <= cell.right && r.bottom <= cell.bottom };
      }));
      assert.equal(boneIcons.length, 3, "Giữ đủ ba ảnh hồn cốt từ main");
      assert.ok(boneIcons.every((icon) => icon.loaded && icon.inside), "Ảnh hồn cốt phải tải được và nằm trong ô");
      const geometry = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll("#actbar button")];
        return buttons.map((b) => {
          const r = b.getBoundingClientRect(), key = b.querySelector(".key").getBoundingClientRect();
          const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return { label: b.getAttribute("aria-label"), x: r.x, y: r.y, w: r.width, h: r.height,
            keyInside: key.x >= r.x && key.y >= r.y && key.right <= r.right && key.bottom <= r.bottom,
            reachable: b.contains(hit), covering: hit?.closest("[id]")?.id, centered: r.x < innerWidth / 2 + 36 && r.right > innerWidth / 2 - 36 && r.y < innerHeight / 2 + 36 && r.bottom > innerHeight / 2 - 36 };
        });
      });
      for (const b of geometry) {
        assert.ok(b.w >= 44 && b.h >= 44, `Vùng chạm nhỏ: ${b.label}`);
        assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= width && b.y + b.h <= height, `Nút tràn: ${b.label}`);
        assert.ok(b.keyInside, `Phím ngoài khung: ${b.label}`);
        assert.ok(b.reachable, `Nút bị che: ${b.label} (${b.covering})`);
        assert.ok(!b.centered, `Nút che vùng cảnh báo giữa màn: ${b.label}`);
      }
      // Ô đội hình: avatar tròn + số cấp + thanh sinh lực, không tên.
      const names = await page.locator("#team button").evaluateAll((els) => els.map((e) => {
        const av = e.querySelector(".av")?.getBoundingClientRect(), lv = e.querySelector(".lv"), hp = e.querySelector(".hpb")?.getBoundingClientRect();
        return { avatar: !!av && av.width > 0 && Math.abs(av.width - av.height) < 1, level: lv?.textContent ?? "", hp: !!hp && hp.height > 0, hasName: [...e.children].some((c) => c.matches("span:not(.av)") && c.textContent) };
      }));
      assert.ok(names.every((n) => n.avatar && /^\d+$/.test(n.level) && n.hp && !n.hasName), `Ô đội hình sai: ${JSON.stringify(names)}`);
      const contrast = await page.evaluate(() => {
        const luminance = (color) => {
          const rgb = color.match(/[\d.]+/g).slice(0, 3).map((n) => Number(n) / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
          return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
        };
        return [...document.querySelectorAll("#actbar .key,#team .lv")].filter((e) => e.textContent && e.getBoundingClientRect().height).map((e) => {
          let parent = e, bg = getComputedStyle(parent).backgroundColor;
          while (bg === "rgba(0, 0, 0, 0)" && parent.parentElement) { parent = parent.parentElement; bg = getComputedStyle(parent).backgroundColor; }
          const a = luminance(getComputedStyle(e).color), b = luminance(bg);
          return { text: e.textContent, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
        });
      });
      assert.ok(contrast.every((c) => c.ratio >= 4.5), `Tương phản chữ: ${JSON.stringify(contrast.filter((c) => c.ratio < 4.5))}`);
      const first = page.locator('#team button[data-slot="0"]');
      if (touch) {
        const r = await first.boundingBox();
        const cdp = await context.newCDPSession(page);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r.x + r.width / 2, y: r.y + r.height / 2 }] });
        await page.waitForTimeout(500);
        await page.waitForFunction(() => !document.querySelector("#tip").hidden);
        assert.match(await page.locator("#tip").innerText(), /Lam Điện Bá Vương Long/);
        await screenshot(page, "tooltip", size);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await cdp.detach();
      } else {
        await first.hover(); await page.waitForFunction(() => !document.querySelector("#tip").hidden);
        assert.match(await page.locator("#tip").innerText(), /Lam Điện Bá Vương Long/);
        await screenshot(page, "tooltip", size);
      }
      await escClose(page);
      const bag = page.getByRole("button", { name: "Mở túi dùng vật phẩm tiêu hao (B)" });
      if (touch) await bag.tap(); else await bag.click();
      await page.waitForFunction(() => !document.querySelector("#bag").hidden);
      assert.match(await page.locator("#bag .bfilter .on").innerText(), /Tiêu hao/);
      if (touch) await bag.tap(); else await bag.click();
      assert.ok(await page.locator("#bag").isVisible(), "Bấm Tiêu hao lần nữa giữ Túi mở");
      await escClose(page);
      for (const [item, panel] of [["settings", "audio"], ["auto", "autoPanel"]]) {
        // Nút menu cũ đã bỏ: mở bằng hub (huy hiệu giữa trên rồi thẻ / mục rail).
        await page.evaluate((id) => { if (document.getElementById("hub").hidden) document.getElementById("hubBtn").click(); document.querySelector(`[data-hub="${id}"]`).click(); }, item);
        await page.waitForFunction((id) => !document.getElementById(id).hidden, panel);
        if (touch) await bag.tap(); else await bag.click();
        await page.waitForFunction(() => !document.querySelector("#bag").hidden);
        assert.ok(await page.locator(`#${panel}`).evaluate((e) => e.hidden), `Tiêu hao phải đóng ${panel}`);
        const filter = page.locator("#bag .bfilter .on");
        assert.match(await filter.innerText(), /Tiêu hao/);
        assert.ok(await filter.evaluate((e) => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }), "Bộ lọc Tiêu hao không bị bảng khác che");
        await escClose(page);
      }
      // Server bỏ qua lệnh đổi khi còn hồi chiêu: đợi sẵn sàng trước thao tác thật.
      await page.waitForFunction(() => document.querySelector("#bag").hidden);
      await page.waitForFunction(() => window.__c8Scene.vit.swCd - (performance.now() - window.__c8Scene.vitAt) / 1000 <= 0);
      const second = page.locator('#team button[data-slot="1"]');
      if (touch) await second.tap(); else await second.click();
      await page.waitForFunction((rowId) => window.__c8Scene.owned.active === rowId, team[1]);

      await page.waitForFunction(() => [...document.querySelectorAll("#team .cdn")].some((e) => e.textContent));
      await screenshot(page, "doi-vo-hon", size);
      await page.waitForFunction(() => window.__c8Scene.vit.swCd - (performance.now() - window.__c8Scene.vitAt) / 1000 <= 0);
      // Server tính hồi chiêu theo tick của nó: máy chậm có thể còn hồi chiêu khi client đã tính hết, nên bấm lại tới khi đổi được.
      for (let tries = 0; tries < 6; tries++) {
        await page.keyboard.press("1");
        if (await page.waitForFunction((rowId) => window.__c8Scene.owned.active === rowId, team[0], { timeout: 2500 }).then(() => true, () => false)) break;
      }
      await page.waitForFunction((rowId) => window.__c8Scene.owned.active === rowId, team[0], { timeout: 1000 });
      samples.push({ size, touch, geometry, names, contrast, errors });
    }
    await withEmptyMp(page, async () => {
      await page.waitForFunction(() => document.querySelectorAll(".sk.nomp").length >= 4);
      await screenshot(page, "thieu-hon-luc", size);
      if (!before) {
        // Thiếu hồn lực: huy hiệu "!" (hình, không chỉ màu); lý do ở dòng cuối chú thích.
        assert.ok((await page.locator(".sk.nomp").evaluateAll((els) => els.map((e) => getComputedStyle(e, "::after").content))).every((c) => c === '"!"'));
        assert.equal(await page.locator(".sk.ava").getAttribute("aria-disabled"), "true");
      }
    });
    // Cảnh chiến đấu thật: quái do hook server tạo, chiêu và hồi chiêu do server quyết định.
    await hook(page, "ready");
    await hook(page, "warp", { mapId: "tinh_dau_ngoai_vi" });
    await page.waitForFunction(() => window.__c8Scene?.mapId === "tinh_dau_ngoai_vi" && window.__c8Scene.players.size > 0 && window.__c8Scene.owned);
    await hook(page, "clear", { all: true });
    const beast = await hook(page, "spawn", { species: "liet_trao_hung", tier: 1, hpx: 1000, dx: 32 });
    await page.waitForFunction((bid) => window.__c8Scene.room.state.beasts.has(bid), beast.bid);
    await page.evaluate((bid) => { window.__c8Scene.targetBeast = bid; }, beast.bid);
    const skill = page.locator('.sk[data-i="0"]');
    if (touch) await skill.tap(); else await skill.click();
    // Đo cùng một khung hình đang hồi chiêu; chụp ảnh có thể xong sau khi hồi chiêu đã hết.
    const cooldown = await (await page.waitForFunction(() => {
      const e = document.querySelector('.sk[data-i="0"]');
      const p = Number(e?.dataset.p);
      return p > 0 ? { p, seconds: e.querySelector(".cdn").textContent,
        gradient: getComputedStyle(e.querySelector(".ui-cd")).backgroundImage } : false;
    })).jsonValue();
    if (!before) {
      assert.ok(Number(cooldown.seconds.replace(",", ".")) > 0, "Hồi chiêu phải hiện số giây dương khi p>0");
      assert.match(cooldown.gradient, /conic-gradient/);
      samples.at(-1).cooldown = cooldown;
    }
    await screenshot(page, "hoi-chieu", size);
    if (!before) {
      const active = await page.evaluate(() => window.__c8Scene.owned.active);
      await hook(page, "set", { rowId: active, level: 80, rings: [100, 1000, 10000, 50000, 50000, 50000, 50000, 50000] });
      await hook(page, "ready");
      await page.waitForFunction(() => document.querySelector(".sk.ava:not(.locked)"));
      const avatar = page.locator(".sk.ava");
      if (touch) await avatar.tap(); else await avatar.click();
      await page.waitForFunction(() => document.querySelector('.sk[data-i="3"].ct'));
      // Hồn kỹ Chân Thân phải thấy biểu tượng, không mang lớp `empty` (ô P trống trước khi biến hình thì lớp này được gỡ).
      assert.ok(await page.locator('.sk[data-i="3"].ct').evaluate((e) => !e.classList.contains("empty") && e.querySelector(".ico").getBoundingClientRect().width > 0), "Ô Chân Thân phải hiện biểu tượng");
      await screenshot(page, "chan-than", size);
      assert.equal(await avatar.getAttribute("aria-disabled"), "false");
      await hook(page, "rest", { s: 120 });
      await page.waitForFunction(() => !document.querySelector('.sk[data-i="3"].ct'));
      // Hồi quy #1418: ô P loadout = -1 (ô trống) vẫn phải hiện hồn kỹ Chân Thân (biểu tượng + hồi chiêu) khi biến hình, và trở lại trống khi hết.
      // Tin `loadout` có giới hạn tần suất (nhóm social): gửi lại tới khi server nhận.
      for (let tries = 0; tries < 6; tries++) {
        await page.evaluate((rowId) => window.__c8Scene.room.send("loadout", { rowId, skills: [0, 1, 2, -1] }), active);
        if (await page.waitForFunction(() => document.querySelector('.sk[data-i="3"].empty'), null, { timeout: 2500 }).then(() => true, () => false)) break;
      }
      await page.waitForFunction(() => document.querySelector('.sk[data-i="3"].empty'), null, { timeout: 1000 });
      await hook(page, "ready");
      await page.waitForFunction(() => document.querySelector(".sk.ava:not(.locked)"));
      if (touch) await avatar.tap(); else await avatar.click();
      await page.waitForFunction(() => document.querySelector('.sk[data-i="3"].ct'));
      const ctCell = await page.locator('.sk[data-i="3"]').evaluate((e) => ({ empty: e.classList.contains("empty"), ico: e.querySelector(".ico").getBoundingClientRect().width,
        opacity: getComputedStyle(e).opacity, cd: getComputedStyle(e.querySelector(".ui-cd")).display, border: getComputedStyle(e).borderStyle }));
      assert.ok(!ctCell.empty && ctCell.ico > 0 && ctCell.opacity === "1" && ctCell.cd !== "none" && ctCell.border !== "dashed", `Ô P trống phải hiện hồn kỹ Chân Thân: ${JSON.stringify(ctCell)}`);
      await screenshot(page, "chan-than-p-trong", size);
      await hook(page, "rest", { s: 120 });
      await page.waitForFunction(() => document.querySelector('.sk[data-i="3"].empty:not(.ct)'));
    }
    const unexpected = errors.filter((e) => !e.includes("Unexpected token '<'"));
    assert.deepEqual(unexpected, [], "Lỗi trình duyệt mới");
    await context.close();
    console.log(`✓ ${phase} ${size}: game thật, đội hình, hồi chiêu, thiếu hồn lực${before ? "" : ", vùng chạm, phím, tooltip"}`);
  }
  await writeFile(resolve(out, `${phase}-metrics.json`), JSON.stringify(samples, null, 2));
  await writeFile(resolve(out, `${phase}-names.json`), JSON.stringify(nameSamples, null, 2));
  assert.deepEqual(nameFailures, [], "Tên hồn kỹ phải hiển thị đầy đủ bằng pixel, không clamp/overflow/che chữ");
  if (!before && !namesOnly) {
    const images = new Set(await readdir(out));
    const sections = viewports.map(([w, h, touch]) => {
      const size = `${w}x${h}`, state = touch ? "san-sang" : "ten-day-du";
      const beforeImage = `before-${size}-${state}.png`;
      const beforeFigure = images.has(beforeImage) ? `<figure><figcaption>Trước sửa tên</figcaption><a href="${beforeImage}"><img src="${beforeImage}" alt="Game trước sửa tên ở ${size}"></a></figure>` : "";
      return `<section><h2>${size}</h2><div${beforeFigure ? ' class="pair"' : ""}>${beforeFigure}<figure><figcaption>Sau sửa tên</figcaption><a href="after-${size}-${state}.png"><img src="after-${size}-${state}.png" alt="Game sau sửa tên ở ${size}"></a></figure></div><p>${["san-sang", "tooltip", "doi-vo-hon", "thieu-hon-luc", "hoi-chieu"].map((s) => `<a href="after-${size}-${s}.png">${({ "san-sang": "Ban đầu, guide đang mở", tooltip: "Chú thích", "doi-vo-hon": "Đổi võ hồn", "thieu-hon-luc": "Thiếu hồn lực", "hoi-chieu": "Hồi chiêu" })[s]}</a>`).join(" · ")}</p></section>`;
    }).join("");
    await writeFile(resolve(out, "index.html"), `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C8 — Thanh kỹ năng và đội hình</title><style>body{margin:24px;background:#211b29;color:#f4ead5;font:16px/1.5 system-ui}h1{font-size:26px}h2{font-size:20px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}img{display:block;width:100%;height:auto;image-rendering:pixelated}a{color:#b9dfff}section{margin:32px 0}@media(max-width:800px){.pair{grid-template-columns:1fr}}</style><h1>C8 — Thanh kỹ năng và ô đội hình</h1><p>Ảnh game thật bằng Chrome headless, tắt âm thanh. Server RAM local riêng; không nối DB prod. Hồi quy AFTER không cần baseline của nhánh PR. Nếu có ảnh trước thì dùng cùng fixture để đối chiếu. Tải toàn bộ artifact, giải nén rồi mở index.html. Bấm ảnh để xem PNG gốc ở độ phân giải thực.</p>${sections}</html>`);
  }
  console.log(`Ảnh C8: ${out}`);
} finally {
  await browser?.close();
  for (const child of children) child.kill("SIGTERM");
}
