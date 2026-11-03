// Hồi quy icon nguồn Thư + nhóm bảng Xếp Hạng (#1599) bằng Chrome tắt âm: icon đúng nguồn / nhóm, nhãn chữ giữ, không tràn, ảnh lỗi thì về dạng chữ.
// `--before`: xoá icon trước khi chụp (ảnh "trước" để so sánh). HUB_OUTPUT: thư mục ảnh.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { chromium } from "playwright";

const before = process.argv.includes("--before");
const out = process.env.HUB_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "source-icon-"));
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
  // Đợi game vẽ xong màn đăng nhập rồi mới gỡ #overlay: gỡ sớm thì loginScreen() chạy sau getElementById ra null (pageerror, chập chờn trên CI chậm, #1619).
  await page.waitForSelector("#credits-open", { state: "attached" });
  await page.evaluate(async () => {
    await (await import("/src/uiArt.ts")).loadUiArt();
    document.querySelector("#overlay")?.remove();
    document.querySelector("#hud").hidden = false; document.querySelector("#hud").style.display = "block";
    const now = Date.now(), day = 86_400_000;
    const mk = (id, from, title, extra = {}) => ({ id, from, title, body: "Nội dung thư thử.", honTe: 0, items: [], at: now - id * 3600_000, exp: now + 20 * day, read: false, claimed: false, ...extra });
    const mail = await import("/src/mailScreen.ts");
    mail.bindMail(() => {}, () => {});
    mail.openMail();
    mail.onMail({ unread: 4, pending: 1, list: [mk(1, "Phúc Lợi", "Quà điểm danh", { honTe: 500 }), mk(2, "Bí Cảnh", "Phần thưởng Bí Cảnh"), mk(3, "Quản trị", "Thông báo bảo trì", { read: true }), mk(4, "Hệ thống", "Chào mừng", { read: true })] });
    window.__mail = mail;
    const rank = await import("/src/rankScreen.ts");
    rank.bindRank(() => {});
    rank.onRankBoards({ k: "boards", list: [{ board: "cap", group: "Người chơi", name: "Cấp", period: 0 }, { board: "xx", group: "Nhóm lạ", name: "Lạ", period: 0 }] });
    window.__rank = rank;
  });
  const ICON = { mail: ".ml-src", rank: ".p2-nav-ico" };
  for (const screen of ["mail", "rank"]) for (const [width, height] of [[640, 360], [844, 390], [1280, 720]]) for (const fs of [0, 1, 2]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(([screen, fs]) => {
      document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`);
      document.querySelector("#mail").hidden = screen !== "mail"; document.querySelector("#rank").hidden = screen !== "rank";
      if (screen === "mail") { window.__mail.openMail(); } else { window.__rank.openRank(); }
    }, [screen, fs]);
    if (screen === "mail") await page.evaluate(() => window.__mail.onMail({ unread: 4, pending: 1, list: [1, 2, 3, 4].map((id) => ({ id, from: ["Phúc Lợi", "Bí Cảnh", "Quản trị", "Hệ thống"][id - 1], title: ["Quà điểm danh", "Phần thưởng Bí Cảnh", "Thông báo bảo trì", "Chào mừng"][id - 1], body: "Nội dung thư thử.", honTe: id === 1 ? 500 : 0, items: [], at: Date.now(), exp: Date.now() + 20 * 86_400_000, read: id > 2, claimed: false })) }));
    if (screen === "mail") await page.locator(".ml-row").first().click(); // mở thư để hiện icon ở khung đọc
    await page.waitForTimeout(150);
    if (before) await page.evaluate(() => document.querySelectorAll(".ml-src,.p2-nav-ico").forEach((e) => e.remove()));
    await page.locator(`#${screen} img`).evaluateAll(async (imgs) => { await Promise.all(imgs.map((i) => i.decode().catch(() => {}))); });
    await page.screenshot({ path: resolve(out, `${before ? "truoc" : "sau"}-${screen}-${width}x${height}-chu-${fs}.png`) });
    if (before) continue;
    const tag = `${screen} ${width}×${height}, chữ ${fs}`;
    const sel = ICON[screen];
    const srcs = await page.locator(`#${screen} ${sel}`).evaluateAll((a) => a.map((i) => i.getAttribute("src")));
    assert.ok(srcs.length > 0 && srcs.every((x) => x.includes("_1x.png") || x.includes(".png")), `${tag}: có icon`);
    assert.equal(await page.locator(`#${screen} ${sel}[aria-hidden=true][alt='']`).count(), srcs.length, `${tag}: icon trang trí`);
    if (screen === "mail") {
      assert.equal(await page.locator(".ml-row .ml-src").count(), 4, `${tag}: mỗi thư một icon nguồn`);
      assert.equal(new Set(srcs.slice(0, 4)).size, 3, `${tag}: Phúc Lợi / Bí Cảnh / (Quản trị = Hệ thống) khác nhau`);
      const t = await page.locator(".ml-list").innerText(); assert.match(t, /Phúc Lợi/); assert.match(t, /Bí Cảnh/); assert.match(t, /Quản trị/);
      assert.match(await page.locator(".ml-detail").innerText(), /Từ Phúc Lợi/, `${tag}: nhãn chữ nguồn giữ`);
    } else {
      assert.equal(await page.locator("#rank .p2-nav-i").count(), 4, `${tag}: 4 nhóm (Người chơi, Nhóm lạ, Đấu trường, Tông môn)`);
      assert.equal(await page.locator("#rank .p2-nav-ico").count(), 3, `${tag}: nhóm có icon; nhóm lạ không icon giả`);
      assert.equal(await page.locator('#rank .p2-nav-i[data-id="Nhóm lạ"] img').count(), 0);
      assert.match(await page.locator("#rank .p2-nav").innerText(), /Người chơi[\s\S]*Đấu trường[\s\S]*Tông môn/, `${tag}: nhãn chữ giữ`);
    }
    // không tràn / không che: icon nằm trong nút chứa; nút chứa không tràn hàng cha; vùng chạm >= 44px khi cảm ứng (nav-i, ml-row)
    const bad = await page.evaluate(([screen, sel]) => [...document.querySelectorAll(`#${screen} ${sel}`)].filter((i) => { const c = i.closest("button, h3, small, .p2-nav-i") ?? i.parentElement, r = i.getBoundingClientRect(), b = c.getBoundingClientRect(); return !(r.left >= b.left - 1 && r.right <= b.right + 1 && r.top >= b.top - 1 && r.bottom <= b.bottom + 1) || r.width === 0; }).length, [screen, sel]);
    assert.equal(bad, 0, `${tag}: icon nằm trong thẻ, không tràn`);
    const small = await page.evaluate((screen) => [...document.querySelectorAll(screen === "mail" ? "#mail .ml-row" : "#rank .p2-nav-i")].filter((b) => b.getBoundingClientRect().height < 32).length, screen);
    assert.equal(small, 0, `${tag}: hàng chạm không bị ép thấp`);
    const horiz = await page.evaluate((screen) => { const r = document.querySelector(`#${screen}`); return r.scrollWidth <= r.clientWidth + 1; }, screen);
    assert.equal(horiz, true, `${tag}: không tràn ngang`);
  }
  if (!before) { // ảnh lỗi: ẩn icon, giữ chữ
    await page.evaluate(() => { document.querySelector("#rank").hidden = false; document.querySelector("#rank .p2-nav-ico").dispatchEvent(new Event("error")); });
    assert.equal(await page.locator("#rank .p2-nav-ico").first().isHidden(), true);
    assert.match(await page.locator("#rank .p2-nav").innerText(), /Người chơi/);
  }
  assert.deepEqual(errors, []);
  console.log(`✓ Icon Thư + Xếp Hạng, ba kích thước × ba cỡ chữ: ${out}`);
} finally { await browser?.close(); vite.kill(); vite.stdout.destroy(); vite.stderr.destroy(); vite.unref(); }
