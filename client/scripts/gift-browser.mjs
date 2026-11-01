// Hồi quy quà Thư / Thành Tựu bằng Chrome tắt âm, dữ liệu giả chỉ ở client.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { chromium } from "playwright";

const before = process.argv.includes("--before");
const out = process.env.GIFT_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "gift-ui-"));
await mkdir(out, { recursive: true });
const port = await new Promise((done) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
const vite = spawn(process.execPath, ["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(port)], { cwd: fileURLToPath(new URL("../../", import.meta.url)), stdio: ["ignore", "pipe", "pipe"] });
let log = "", browser;
for (const stream of [vite.stdout, vite.stderr]) stream.on("data", (d) => { log = (log + d).slice(-4000); });
try {
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) break; await new Promise((r) => setTimeout(r, 100)); if (i === 99) throw new Error(log); }
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio"] });
  const page = await browser.newPage();
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url + "/choi/");
  await page.evaluate(async (dataUrl) => {
    window.ml = await import("/src/mailScreen.ts"); window.av = await import("/src/achvScreen.ts");
    window.parts = await import("/src/uiParts.ts"); window.data = await import(dataUrl);
  }, "/@fs/" + fileURLToPath(new URL("../../shared/data.ts", import.meta.url)).replaceAll("\\", "/"));
  await page.evaluate(async () => {
    await (await import("/src/uiArt.ts")).loadUiArt();
    document.querySelector("#overlay")?.remove();
    document.querySelector("#hud").hidden = false; document.querySelector("#hud").style.display = "block";
    ml.bindMail(() => {}, () => {}); av.bindAchv(() => {}, () => {});
  });
  for (const [width, height] of [[1280,720], [1600,900], [1920,1080], [640,360]]) for (const fs of [0,1,2]) {
    await page.setViewportSize({ width, height });
    await page.evaluate((fs) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); }, fs);
    await page.evaluate(() => {
      av.closeAchv(); ml.openMail();
      const items = ["hoi_huyet_dan", "hoi_thanh_phu", "uy_thac_lenh", "manh_u_minh_linh_mieu", "manh_bach_ho", '<img src=x onerror="alert(1)">', ...Array(12).fill("hoi_hon_dan")].map((code, i) => ({ code, qty: i + 1 }));
      ml.onMail({ list: [{ id: 1, from: "Hệ thống", title: "Quà đính kèm", body: "Nội dung <script> vẫn là chữ.", honTe: 120, items, at: Date.now(), exp: Date.now() + 86400000, read: true, claimed: false }], unread: 0, pending: 1 });
      document.querySelector(".ml-row").click();
    });
    await page.locator(".ml-att").evaluate((e) => e.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: resolve(out, `${before ? "truoc" : "sau"}-${width}x${height}-chu-${fs}-thu.png`) });
    if (!before) {
      assert.equal(await page.locator(".ml-body script,.ml-att [onerror],.ml-att button,.ml-att a").count(), 0);
      assert.match(await page.locator(".ml-att").innerText(), /<img src=x/);
      assert.match(await page.locator('.ml-att img[src*="manh_u_minh_linh_mieu"]').getAttribute("alt"), /^$/);
      assert.equal(await page.locator('.ml-att img[src*="manh_bach_ho"]').count(), 1);
      assert.ok(await page.locator("#mail .p2-body").evaluate((e) => e.clientHeight) >= 60, "Có vùng đọc thật trên màn thấp");
      await page.locator(".ml-claim").scrollIntoViewIfNeeded();
      assert.equal(await page.locator(".ml-claim").evaluate((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }), true);
      await page.locator(".ml-att img").first().evaluate((e) => { e.src = "/anh-khong-co.png"; });
      await page.waitForFunction(() => document.querySelector(".ml-att img").hidden);
      assert.match(await page.locator(".ml-att").innerText(), /Hồi Huyết Đan ×1/);
    }
    await page.evaluate(() => {
      ml.closeMail(); av.openAchv();
      av.onAchv({ stats: { level: 99, elite: 999 }, claimed: [], ready: 1 });
      const def = { ...data.ACHV[0], reward: { honTe: 120, shards: 2, items: [{ code: "hoi_huyet_dan", qty: 3 }, { code: "manh_u_minh_linh_mieu", qty: 4 }, { code: "ma_la", qty: 5 }] } };
      document.querySelector(".av-list").replaceChildren(parts.mount(av.achvRowNode({ def, state: "ready", have: def.need, pct: 1 })));
    });
    await page.locator(".av-rw").evaluate((e) => e.scrollIntoView({ block: "start" }));
    await page.screenshot({ path: resolve(out, `${before ? "truoc" : "sau"}-${width}x${height}-chu-${fs}-thanh-tuu.png`) });
    if (!before) {
      assert.match(await page.locator(".av-rw").innerText(), /Mảnh võ hồn ×2/);
      const noOverlap = await page.evaluate(() => { const a = document.querySelector(".av-rw").getBoundingClientRect(), b = document.querySelector(".av-claim").getBoundingClientRect(); return a.right <= b.left || a.bottom <= b.top || b.bottom <= a.top; });
      assert.equal(noOverlap, true, `${width}×${height}, chữ ${fs}: quà không đè Nhận`);
      assert.ok(await page.locator("#achv .p2-body").evaluate((e) => e.clientHeight) >= 60);
    }
  }
  assert.deepEqual(errors, []);
  console.log(`✓ Quà Thư / Thành Tựu, bốn kích thước × ba cỡ chữ: ${out}`);
} finally { await browser?.close(); vite.kill(); vite.stdout.destroy(); vite.stderr.destroy(); vite.unref(); }
