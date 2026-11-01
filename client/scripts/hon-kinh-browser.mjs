// #1595: ảnh Hồn Kinh Quyển trong Túi/Thư/Bí Cảnh; client thật, manifest thật, Chrome tắt âm, dữ liệu thử chỉ ở client.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = process.env.HON_KINH_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "hon-kinh-"));
await mkdir(out, { recursive: true });
const port = await new Promise((done) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
const vite = spawn(process.execPath, ["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(port)], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let log = "", browser;
for (const s of [vite.stdout, vite.stderr]) s.on("data", (d) => { log = (log + d).slice(-4000); });
try {
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) break; await new Promise((r) => setTimeout(r, 100)); if (i === 149) throw new Error(log); }
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(url + "/choi/");
  await page.evaluate(async (dataUrl) => {
    window.data = await import(dataUrl);
    await (await import("/src/uiArt.ts")).loadUiArt();
    window.bag = await import("/src/hudBag.ts"); window.mail = await import("/src/mailScreen.ts"); window.bc = await import("/src/bicanhScreen.ts");
    document.querySelector("#overlay")?.remove();
    const hud = document.querySelector("#hud"); hud.hidden = false; hud.style.display = "block";
    mail.bindMail(() => {}, () => {});
  }, "/@fs/" + root.replaceAll("\\", "/") + "/shared/data.ts");
  const icon = async (selector) => {
    const image = page.locator(selector); assert.equal(await image.count(), 1);
    await image.evaluate((i) => i.decode());
    assert.equal(await image.isVisible(), true, "ảnh hiện và tải thành công");
    assert.equal(await image.evaluate((i) => i.naturalWidth), 32, "dùng asset32px đã duyệt");
    assert.match(await image.getAttribute("src"), /sprites\/iso\/item\/hon_kinh_quyen\.png/);
    assert.equal(await image.getAttribute("alt"), "", "ảnh trang trí, tên thưởng vẫn là chữ");
  };
  for (const [width, height] of [[1280, 720], [1920, 1080], [640, 360]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => {
      mail.closeMail(); document.querySelector("#bicanhEnd").hidden = true;
      const no = () => {}, act = new Proxy({ gear: () => null, active: () => null, viewRow: () => null, combat: () => false, absorbOptions: () => [], herbOptions: () => [] }, { get: (o, k) => o[k] ?? no });
      const items = [data.BICANH.tome, "hoi_thanh_phu", "uy_thac_lenh", "hoi_huyet_dan"].map((code, i) => ({ id: `i${i}`, code, kind: data.itemDef(code).kind, qty: 3, years: null, stars: null, stats: {}, vohon: null, enhance: 0, locked: false }));
      bag.renderBag({ items, slots: 40, honTe: 12345, cd: 0 }, act); document.querySelector("#bag").hidden = false;
    });
    await icon('#bag img[src*="hon_kinh_quyen"]');
    await page.screenshot({ path: resolve(out, `tui-${width}x${height}.png`) });
    await page.evaluate(() => {
      document.querySelector("#bag").hidden = true; mail.openMail();
      mail.onMail({ list: [{ id: 1, from: "Bí Cảnh", title: "Thưởng Bí Cảnh", body: "Hồn Kinh Quyển đang chờ nhận trong thư.", honTe: 0, items: [{ code: data.BICANH.tome, qty: 2 }, { code: "hoi_thanh_phu", qty: 1 }], at: Date.now(), exp: Date.now() + 86400000, read: true, claimed: false }], unread: 0, pending: 1 });
    });
    await page.locator('#mail .ml-row[data-id="1"]').click();
    await icon('#mail img[src*="hon_kinh_quyen"]');
    await page.screenshot({ path: resolve(out, `thu-${width}x${height}.png`) });
    await page.evaluate(() => { mail.closeMail(); bc.onBiCanhRoom({ k: "end", win: true, why: "hạ hết các sóng", cleared: 3, of: 3, tomes: 2, secs: 3600 }); });
    await icon('#bicanhEnd img[src*="hon_kinh_quyen"]');
    assert.equal(await page.locator("#bicanhEnd .bc-e-icon").evaluate((i) => i.getBoundingClientRect().width), 24, "Bí Cảnh hiện24px đúng mẫu duyệt");
    await page.screenshot({ path: resolve(out, `bi-canh-${width}x${height}.png`) });
  }
  for (const extra of [{ tomes: 0, capped: true }, { tomes: 0, full: true }, { tomes: 2, refunded: true, err: "Lượt đã hoàn lại" }]) {
    await page.evaluate((extra) => bc.onBiCanhRoom({ k: "end", win: false, cleared: 0, of: 3, secs: 3600, ...extra }), extra);
    assert.equal(await page.locator("#bicanhEnd .bc-e-icon").count(), 0, "không có ảnh nhận thưởng khi không nhận/hoàn lượt");
  }
  await page.evaluate(() => bc.onBiCanhRoom({ k: "end", win: true, cleared: 3, of: 3, tomes: 2, secs: 3600 }));
  await page.locator("#bicanhEnd .bc-e-icon").evaluate((i) => i.dispatchEvent(new Event("error")));
  assert.equal(await page.locator("#bicanhEnd .bc-e-icon").isHidden(), true, "ảnh lỗi được ẩn");
  assert.match(await page.locator("#bicanhEnd .bc-rew").innerText(), /Nhận Hồn Kinh Quyển ×2 vào túi/, "ảnh lỗi vẫn giữ nhãn và số thưởng");
  console.log(`✓ Hồn Kinh Quyển: Túi/Thư/Bí Cảnh ×3 viewport, trạng thái không nhận và ảnh lỗi: ${out}`);
} finally { await browser?.close(); vite.kill(); vite.stdout.destroy(); vite.stderr.destroy(); vite.unref(); }
