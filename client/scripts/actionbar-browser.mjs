// C8: kiểm tra HUD trong game thật trên server RAM riêng; ảnh chỉ ghi ra thư mục tạm/artifact.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, realpath, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const installed = fileURLToPath(new URL("../../", import.meta.url));
const root = await realpath(resolve(process.env.C8_SOURCE_ROOT ?? installed));
const out = resolve(process.env.C8_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "c8-preview-")));
const before = process.env.C8_PHASE === "before", phase = before ? "before" : "after";
const children = [], samples = [];
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
async function screenshot(page, name, size) {
  await page.screenshot({ path: resolve(out, `${phase}-${size}-${name}.png`) });
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
  for (const [width, height, touch] of [[1280, 720, false], [960, 540, false], [844, 390, true]]) {
    const size = `${width}x${height}`;
    const { token } = await post("/api/login", { name: `C8 ${width} ${Date.now().toString(36)}`, password: "C8-local-preview!" });
    await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
    await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(30000);
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript((token) => localStorage.setItem("shh-token", token), token);
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
    await screenshot(page, "san-sang", size);
    if (!before) {
      assert.equal(await page.locator("#actrow .action-group").count(), 3);
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
      const names = await page.locator("#team button>span").evaluateAll((els) => els.map((e) => ({ name: e.textContent, clipped: e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1 })));
      assert.ok(names.every((n) => !n.clipped), `Tên bị cắt: ${JSON.stringify(names)}`);
      const contrast = await page.evaluate(() => {
        const luminance = (color) => {
          const rgb = color.match(/[\d.]+/g).slice(0, 3).map((n) => Number(n) / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
          return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
        };
        return [...document.querySelectorAll("#actbar .key,#actbar .sk-name,#actbar .sk-state,#actbar .action-label,#team button>span,#team small")].filter((e) => e.textContent && e.getBoundingClientRect().height).map((e) => {
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
      await page.keyboard.press("Escape");
      const bag = page.getByRole("button", { name: "Mở túi dùng vật phẩm tiêu hao (B)" });
      if (touch) await bag.tap(); else await bag.click();
      await page.waitForFunction(() => !document.querySelector("#bag").hidden);
      assert.match(await page.locator("#bag .bfilter .on").innerText(), /Tiêu hao/);
      await page.keyboard.press("Escape");
      // Đổi võ hồn qua nút thật, đợi state server rồi đổi về bằng bàn phím.
      const second = page.locator('#team button[data-slot="1"]');
      if (touch) await second.tap(); else await second.click();
      await page.waitForFunction((rowId) => window.__c8Scene.owned.active === rowId, team[1]);

      await page.waitForFunction(() => [...document.querySelectorAll("#team .cdn")].some((e) => e.textContent));
      await screenshot(page, "doi-vo-hon", size);
      await page.waitForFunction(() => window.__c8Scene.room.state.players.get(window.__c8Scene.me).swCd <= 0);
      await page.keyboard.press("1");
      await page.waitForFunction((rowId) => window.__c8Scene.owned.active === rowId, team[0]);
      samples.push({ size, touch, geometry, names, contrast, errors });
    }
    await hook(page, "ready", { mp: 0 });
    await page.waitForFunction(() => document.querySelectorAll(".sk.nomp").length >= 4);
    await screenshot(page, "thieu-hon-luc", size);
    if (!before) {
      assert.ok((await page.locator(".sk.nomp .sk-state").allTextContents()).every((text) => text === "Thiếu lực"));
      assert.equal(await page.locator(".sk.ava").getAttribute("aria-disabled"), "true");
    }
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
    await page.waitForFunction(() => Number(document.querySelector('.sk[data-i="0"]')?.dataset.p) > 0);
    await screenshot(page, "hoi-chieu", size);
    if (!before) {
      assert.ok(await page.locator('.sk[data-i="0"] .cdn').innerText());
      assert.match(await page.locator('.sk[data-i="0"] .ui-cd').evaluate((e) => getComputedStyle(e).backgroundImage), /conic-gradient/);
    }
    if (!before) {
      const active = await page.evaluate(() => window.__c8Scene.owned.active);
      await hook(page, "set", { rowId: active, level: 80, rings: [100, 1000, 10000, 50000, 50000, 50000, 50000, 50000] });
      await hook(page, "ready");
      await page.waitForFunction(() => document.querySelector(".sk.ava:not(.locked)"));
      const avatar = page.locator(".sk.ava");
      if (touch) await avatar.tap(); else await avatar.click();
      await page.waitForFunction(() => document.querySelector('.sk[data-i="3"].ct'));
      await screenshot(page, "chan-than", size);
      assert.equal(await avatar.getAttribute("aria-disabled"), "false");
      await hook(page, "rest", { s: 120 });
      await page.waitForFunction(() => !document.querySelector('.sk[data-i="3"].ct'));
    }
    const unexpected = errors.filter((e) => !e.includes("Unexpected token '<'"));
    assert.deepEqual(unexpected, [], "Lỗi trình duyệt mới");
    await context.close();
    console.log(`✓ ${phase} ${size}: game thật, đội hình, hồi chiêu, thiếu hồn lực${before ? "" : ", vùng chạm, phím, tooltip"}`);
  }
  await writeFile(resolve(out, `${phase}-metrics.json`), JSON.stringify(samples, null, 2));
  if (!before) {
    const sections = ["1280x720", "960x540", "844x390"].map((size) => `<section><h2>${size}</h2><div class="pair"><figure><figcaption>Trước C8</figcaption><img src="before-${size}-san-sang.png" alt="Game trước C8 ở ${size}"></figure><figure><figcaption>Sau C8</figcaption><img src="after-${size}-san-sang.png" alt="Game sau C8 ở ${size}"></figure></div><p>${["tooltip", "doi-vo-hon", "thieu-hon-luc", "hoi-chieu"].map((state) => `<a href="after-${size}-${state}.png">${({ tooltip: "Tooltip", "doi-vo-hon": "Đổi võ hồn", "thieu-hon-luc": "Thiếu hồn lực", "hoi-chieu": "Hồi chiêu" })[state]}</a>`).join(" · ")}</p></section>`).join("");
    await writeFile(resolve(out, "index.html"), `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C8 — Thanh kỹ năng và đội hình</title><style>body{margin:24px;background:#211b29;color:#f4ead5;font:16px/1.5 system-ui}h1{font-size:26px}h2{font-size:20px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0}img{display:block;width:100%;height:auto;image-rendering:pixelated}a{color:#b9dfff}section{margin:32px 0}@media(max-width:800px){.pair{grid-template-columns:1fr}}</style><h1>C8 — Thanh kỹ năng và ô đội hình</h1><p>Ảnh game thật bằng Chrome headless, tắt âm thanh. Server RAM local riêng; không nối DB prod. Bản trước và sau dùng cùng fixture. Tải toàn bộ artifact, giải nén rồi mở index.html.</p>${sections}</html>`);
  }
  console.log(`Ảnh C8: ${out}`);
} finally {
  await browser?.close();
  for (const child of children) child.kill("SIGTERM");
}
