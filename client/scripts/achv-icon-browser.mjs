// Màn Thành Tựu thật, dữ liệu thử; dùng manifest/ảnh thật, không nối phòng game.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { chromium } from "playwright";

const out = process.env.ACHV_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "achv-icon-"));
await mkdir(out, { recursive: true });
const port = await new Promise((done) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
const vite = spawn(process.execPath, ["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(port)], { cwd: fileURLToPath(new URL("../../", import.meta.url)), stdio: ["ignore", "pipe", "pipe"] });
let log = "", browser;
for (const stream of [vite.stdout, vite.stderr]) stream.on("data", (d) => { log = (log + d).slice(-4000); });
const dataPath = fileURLToPath(new URL("../../shared/data.ts", import.meta.url)).replaceAll("\\", "/");
try {
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) break; await new Promise((r) => setTimeout(r, 100)); if (i === 99) throw new Error(log); }
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio"] });
  for (const dpr of [1, 2]) {
    const context = await browser.newContext({ deviceScaleFactor: dpr });
    const page = await context.newPage(), errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${url}/choi/`); await page.clock.install();
    await page.evaluate(async (dataPath) => {
      await (await import("/src/uiArt.ts")).loadUiArt();
      document.querySelector("#overlay")?.remove();
      document.querySelector("#hud").hidden = false; document.querySelector("#hud").style.display = "block";
      const mod = await import("/src/achvScreen.ts"), { ACHV } = await import(`/@fs/${dataPath}`);
      window.achvTest = mod; window.achvSent = [];
      const levels = ACHV.filter((a) => a.group === "cap");
      window.achvFixture = { stats: { [levels[0].stat]: levels[1].need }, claimed: [levels[0].id], ready: 1 };
      mod.bindAchv((type, payload) => window.achvSent.push({ type, payload }), () => {});
      mod.openAchv(); mod.onAchv(window.achvFixture);
    }, dataPath);
    for (const [width, height] of [[1280, 720], [1920, 1080], [640, 360], [390, 844]]) for (const fs of [0, 1, 2]) {
      await page.setViewportSize({ width, height });
      await page.evaluate((fs) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); }, fs);
      await page.locator("#achv .p2-nav-icon, #achv .av-icon").evaluateAll(async (imgs) => { await Promise.all(imgs.map((i) => i.decode())); });
      const state = await page.locator("#achv").evaluate((el) => ({
        nav: [...el.querySelectorAll(".p2-nav-i")].map((b) => ({ label: b.textContent, h: b.getBoundingClientRect().height, w: b.getBoundingClientRect().width, key: b.dataset.id })),
        imgs: [...el.querySelectorAll(".p2-nav-icon, .av-icon")].map((i) => ({ src: i.src, width: i.naturalWidth, h: i.hidden, alt: i.alt, decorative: i.getAttribute("aria-hidden") })),
        claimed: el.querySelector('.av-claimed .av-st')?.textContent,
      }));
      assert.equal(state.nav.length, 6); assert.equal(state.imgs.length, 7);
      assert.ok(state.nav.every((n) => n.h >= 43.5 && n.w >= 44), "vùng bấm nhóm ≥44px");
      for (const label of ["Cấp", "Sưu tầm", "Săn", "Nhiệm vụ", "Đấu trường", "Bí Cảnh"]) assert.ok(state.nav.some((n) => n.label.includes(label)));
      for (const key of ["level", "collect", "hunt", "quest", "arena", "bicanh", "claimed"]) assert.ok(state.imgs.some((i) => i.src.includes(`achv_${key}${dpr === 1 ? "_1x" : ""}.png`)));
      assert.ok(state.imgs.every((i) => i.width === (dpr === 1 ? 24 : 32) && !i.h && !i.alt && i.decorative === "true"));
      assert.match(state.claimed, /Đã nhận/);
      if (width === 390) assert.ok(await page.locator('#achv .p2-body').evaluate((el) => el.clientWidth > 250), "màn dọc hẹp vẫn đủ bề rộng đọc nội dung");
      assert.equal(await page.locator('#achv .av-todo .av-icon, #achv .av-ready .av-icon').count(), 0);
      if (dpr === 1 && fs === 0) await page.screenshot({ path: resolve(out, `thanh-tuu-${width}x${height}.png`) });
    }
    // Bấm trực tiếp lên ảnh vẫn chọn đúng nhóm; không phát ý định nhận thưởng.
    await page.locator('#achv .p2-nav-i[data-id="hunt"] img').click();
    assert.match(await page.locator('#achv .av-list').getAttribute('aria-label'), /Săn/);
    assert.ok(await page.locator('#achv .p2-nav').evaluate((nav) => { const n = nav.getBoundingClientRect(), s = nav.querySelector('.sel').getBoundingClientRect(); return s.left >= n.left - 1 && s.right <= n.right + 1; }), 'nhóm được chọn nằm trong tầm nhìn sau dựng lại');
    await page.locator('#achv .p2-nav-i[data-id="cap"] img').click();
    assert.equal(await page.evaluate(() => achvSent.filter((x) => x.payload.op === 'claim').length), 0);
    await page.evaluate(() => { for (const img of document.querySelectorAll('#achv .p2-nav-icon, #achv .av-icon')) img.dispatchEvent(new Event('error')); });
    assert.ok(await page.locator('#achv .p2-nav-icon, #achv .av-icon').evaluateAll((imgs) => imgs.every((i) => i.hidden)));
    assert.match(await page.locator('#achv').innerText(), /Đã nhận/);
    assert.match(await page.locator('#achv .p2-nav').innerText(), /Sưu tầm/);
    assert.deepEqual(errors, []); await context.close();
  }
  console.log(`✓ Thành Tựu: 6 nhóm + huy hiệu, 4 viewport × 3 cỡ chữ × DPR1/2, vùng bấm, chọn nhóm, fallback: ${out}`);
} finally { await browser?.close(); vite.kill(); vite.stdout.destroy(); vite.stderr.destroy(); vite.unref(); }
