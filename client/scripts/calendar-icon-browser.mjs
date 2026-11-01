// Lịch thật với dữ liệu thử; ảnh/manifest thật, không nối phòng game hoặc chèn ảnh thay thế.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { chromium } from "playwright";

const out = process.env.CALENDAR_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "calendar-icon-"));
await mkdir(out, { recursive: true });
const port = await new Promise((done) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
const vite = spawn(process.execPath, ["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(port)], { cwd: fileURLToPath(new URL("../../", import.meta.url)), stdio: ["ignore", "pipe", "pipe"] });
let log = "", browser;
for (const stream of [vite.stdout, vite.stderr]) stream.on("data", (d) => { log = (log + d).slice(-4000); });
const types = ["king", "world", "arena", "auto", "daily", "weekly"];
const dataPath = fileURLToPath(new URL("../../shared/data.ts", import.meta.url)).replaceAll("\\", "/");
try {
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) break; await new Promise((r) => setTimeout(r, 100)); if (i === 99) throw new Error(log); }
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio"] });
  for (const dpr of [1, 2]) {
    const context = await browser.newContext({ deviceScaleFactor: dpr });
    const page = await context.newPage(), errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(url + "/choi/");
    await page.clock.install();
    await page.evaluate(async (dataPath) => {
      await (await import("/src/uiArt.ts")).loadUiArt();
      document.querySelector("#overlay")?.remove();
      document.querySelector("#hud").hidden = false; document.querySelector("#hud").style.display = "block";
      const cal = await import("/src/calendarScreen.ts"), { EVENT_DEFS } = await import(`/@fs/${dataPath}`);
      window.calendarTest = cal;
      const now = Date.now(), start = now - 12 * 3_600_000;
      const king = EVENT_DEFS.find((x) => x.id.startsWith("king:")), world = EVENT_DEFS.find((x) => x.id.startsWith("world:"));
      const make = (def, s, e, d) => ({ id: def.id, name: def.name, kind: "slot", s, e, d, map: def.map, mapName: "Tinh Đấu Đại Sâm Lâm", boss: "Hồn thú thử nghiệm" });
      window.calendarFixture = { now, weekStart: start, items: [make(king, now - 60_000, now + 900_000, 0), make(world, now + 1_800_000, now + 2_700_000, 0), make(king, now - 7_200_000, now - 6_000_000, 1)], fixed: EVENT_DEFS.filter((x) => x.kind !== "slot").map((x) => ({ ...x, at: x.kind === "reset" ? "00:00" : undefined, weekly: x.id === "reset:tong" })) };
      cal.bindCalendar(() => {}); cal.openCalendar(); cal.onCalendar(window.calendarFixture);
    }, dataPath);
    for (const [width, height] of [[1280, 720], [1920, 1080], [640, 360]]) for (const fs of [0, 1, 2]) {
      await page.setViewportSize({ width, height });
      await page.evaluate((fs) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); }, fs);
      await page.locator("#calendar .p2-body, #calendar .cal-grid").evaluateAll((els) => { for (const el of els) { el.scrollTop = 0; el.scrollLeft = 0; } });
      await page.locator("#calendar .cal-icon").evaluateAll(async (imgs) => { await Promise.all(imgs.map((i) => i.decode())); });
      const state = await page.locator("#calendar").evaluate((el) => ({
        icons: [...el.querySelectorAll(".cal-icon")].map((i) => ({ src: i.src, width: i.naturalWidth, hidden: i.hidden, alt: i.alt, decorative: i.getAttribute("aria-hidden") })),
        live: el.querySelector(".cal-live")?.textContent, soon: el.querySelector(".cal-soon")?.textContent, past: el.querySelector(".cal-past")?.textContent,
      }));
      for (const type of types) assert.ok(state.icons.some((i) => i.src.includes(`calendar_${type}${dpr === 1 ? "_1x" : ""}.png`)), `${type}: đúng loại/DPR`);
      assert.equal(state.icons.length, 7);
      assert.ok(state.icons.every((i) => i.width === (dpr === 1 ? 24 : 32) && !i.hidden && !i.alt && i.decorative === "true"));
      assert.match(state.live, /Đang mở/); assert.match(state.soon, /Sắp mở/); assert.match(state.past, /■/);
      assert.ok(await page.locator("#calendar .p2-body").evaluate((el) => el.clientHeight > 60), "vùng đọc Lịch còn đủ cao ở màn thấp/chữ lớn");
      if (dpr === 1) {
        await page.screenshot({ path: resolve(out, `lich-${width}x${height}-chu-${fs}.png`) });
        // Màn nhỏ vẫn cuộn được đến cuối, không mất các thẻ dưới khung nhìn.
        await page.locator("#calendar .p2-body").evaluate((el) => { el.scrollTop = el.scrollHeight; });
        await page.screenshot({ path: resolve(out, `lich-${width}x${height}-chu-${fs}-cuon.png`) });
        if (width === 640) for (const state of ["live", "soon"]) {
          await page.locator(`#calendar .cal-${state}`).scrollIntoViewIfNeeded();
          await page.screenshot({ path: resolve(out, `lich-${width}x${height}-chu-${fs}-${state}.png`) });
        }
      }
    }
    await page.evaluate(() => {
      for (const img of document.querySelectorAll("#calendar .cal-icon")) img.dispatchEvent(new Event("error"));
    });
    assert.equal(await page.locator("#calendar .cal-icon").evaluateAll((imgs) => imgs.every((i) => i.hidden)), true);
    assert.match(await page.locator("#calendar").innerText(), /Đại Đấu Hồn Trường/);
    assert.match(await page.locator("#calendar .cal-live").innerText(), /Đang mở/);
    await page.evaluate(() => { calendarTest.onCalendar({ ...calendarFixture, fixed: [{ id: "ma_la", name: "Mục lạ vẫn đọc được", kind: "always" }], items: [] }); });
    assert.equal(await page.locator("#calendar .cal-icon").count(), 0);
    assert.match(await page.locator("#calendar").innerText(), /Mục lạ vẫn đọc được/);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(`✓ Lịch: sáu loại, ba trạng thái, ba cỡ chữ × ba viewport, DPR1/2, fallback: ${out}`);
} finally { await browser?.close(); vite.kill(); vite.stdout.destroy(); vite.stderr.destroy(); vite.unref(); }
