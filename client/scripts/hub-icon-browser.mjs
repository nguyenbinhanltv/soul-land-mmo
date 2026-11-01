// Hồi quy icon menu trên thẻ Hub (#1579) bằng Chrome tắt âm: 12 mục có icon, nhãn chữ giữ, ảnh lỗi thì thẻ về dạng chữ.
// `--before`: xoá icon trước khi chụp (ảnh "trước" để so sánh).
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { chromium } from "playwright";

const before = process.argv.includes("--before");
const out = process.env.HUB_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "hub-icon-"));
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
  await page.evaluate(async () => {
    await (await import("/src/uiArt.ts")).loadUiArt();
    document.querySelector("#overlay")?.remove();
    document.querySelector("#hud").hidden = false; document.querySelector("#hud").style.display = "block";
    const hub = await import("/src/hubMenu.ts");
    // chỉ nối vài mục: phần còn lại là thẻ khoá để kiểm thẻ mờ vẫn đọc được lý do
    hub.initHub(Object.fromEntries(["vohon", "char", "reso", "bag", "rank", "quest", "world", "friends", "auto", "settings", "mail"].map((id) => [id, () => {}])), new AbortController().signal);
    hub.setHubOpen(true);
  });
  for (const [width, height] of [[1280, 720], [1920, 1080], [640, 360]]) for (const fs of [0, 1, 2]) {
    await page.setViewportSize({ width, height });
    await page.evaluate((fs) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); }, fs);
    if (before) await page.evaluate(() => document.querySelectorAll(".p2-card-i,.hub-r-i").forEach((e) => e.remove()));
    await page.waitForTimeout(150);
    await page.screenshot({ path: resolve(out, `${before ? "truoc" : "sau"}-${width}x${height}-chu-${fs}.png`) });
    if (before) continue;
    const tag = `${width}×${height}, chữ ${fs}`;
    const shown = await page.evaluate(() => [...document.querySelectorAll("#hub .p2-card-i, #hub .hub-r-i")].filter((i) => !i.hidden && i.naturalWidth > 0).map((i) => i.closest("[data-hub]").dataset.hub).sort());
    assert.deepEqual(shown, ["auto", "bag", "char", "forge", "friends", "quest", "rank", "reso", "settings", "shop", "vohon", "world"], `${tag}: 12 mục có icon`);
    assert.equal(await page.locator("#hub .p2-card-i[aria-hidden=true][alt='']").count(), 11, `${tag}: icon trang trí (11 thẻ + settings ở rail)`);
    assert.equal(await page.locator('#hub [data-hub="achv"] img, #hub [data-hub="mail"] img, #hub [data-hub="tong"] img').count(), 0, `${tag}: mục chưa có icon thì không icon giả`);
    assert.equal(await page.locator('#hub [data-hub="char"]').innerText().then((t) => /Nhân Vật/.test(t)), true, `${tag}: nhãn chữ giữ`);
    assert.match(await page.locator('#hub [data-hub="shop"]').innerText(), /Tại NPC/, `${tag}: thẻ khoá vẫn đọc được lý do`);
    assert.equal(await page.locator('#hub [data-hub="shop"]').getAttribute("data-state"), "lock");
    assert.equal(await page.locator('#hub [data-hub="settings"]').innerText(), "Cài đặt");
    const fit = await page.evaluate(() => [...document.querySelectorAll("#hub .p2-card-i, #hub .hub-r-i")].every((i) => { const c = i.closest("[data-hub]").getBoundingClientRect(), r = i.getBoundingClientRect(); return r.left >= c.left - 1 && r.right <= c.right + 1 && r.top >= c.top - 1 && r.bottom <= c.bottom + 1; }));
    assert.equal(fit, true, `${tag}: icon nằm trong thẻ`);
  }
  if (!before) { // ảnh lỗi: ẩn icon, giữ chữ
    await page.evaluate(() => { document.querySelector('#hub [data-hub="bag"] .p2-card-i').dispatchEvent(new Event("error")); document.querySelector('#hub [data-hub="settings"] .hub-r-i').dispatchEvent(new Event("error")); });
    assert.equal(await page.locator('#hub [data-hub="bag"] .p2-card-i').isHidden(), true);
    assert.equal(await page.locator('#hub [data-hub="settings"] .hub-r-i').isHidden(), true);
    assert.match(await page.locator('#hub [data-hub="bag"]').innerText(), /Túi Đồ/);
  }
  assert.deepEqual(errors, []);
  console.log(`✓ Icon hub, ba kích thước × ba cỡ chữ: ${out}`);
} finally { await browser?.close(); vite.kill(); vite.stdout.destroy(); vite.stderr.destroy(); vite.unref(); }
