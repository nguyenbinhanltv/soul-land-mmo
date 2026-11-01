// Kiểm lựa chọn Thư bằng Chrome tắt âm; sender giả không đổi giao thức/server.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { chromium } from "playwright";

const before = process.argv.includes("--before");
const out = process.env.MAIL_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "mail-ui-"));
await mkdir(out, { recursive: true });
const port = await new Promise((done) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
const vite = spawn(process.execPath, ["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(port)], { cwd: fileURLToPath(new URL("../../", import.meta.url)), stdio: ["ignore", "pipe", "pipe"] });
let log = "", browser;
for (const stream of [vite.stdout, vite.stderr]) stream.on("data", (d) => { log = (log + d).slice(-4000); });
try {
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) break; await new Promise((r) => setTimeout(r, 100)); if (i === 99) throw new Error(log); }
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio"] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url + "/choi/");
  // Đợi game vẽ xong màn đăng nhập rồi mới gỡ #overlay: gỡ sớm thì loginScreen() chạy sau getElementById ra null (pageerror, chập chờn trên CI chậm, #1619).
  await page.waitForSelector("#credits-open", { state: "attached" });
  await page.evaluate(async () => {
    window.ml = await import("/src/mailScreen.ts");
    document.querySelector("#overlay")?.remove();
    document.querySelector("#hud").hidden = false;
    document.querySelector("#hud").style.display = "block";
    window.sent = [];
    ml.bindMail((type, payload) => sent.push({ type, payload }), () => {});
    ml.openMail();
  });
  const fixture = (list) => page.evaluate((list) => ml.onMail({ list, unread: list.filter((m) => !m.read).length, pending: list.filter((m) => m.honTe && !m.claimed).length }), list);
  const mail = (id, extra = {}) => ({ id, from: "Hệ thống", title: `Thư ${id}`, body: `Nội dung thư ${id} vẫn đọc được.`, honTe: 0, items: [], at: Date.now(), exp: Date.now() + 864000000, read: false, claimed: false, ...extra });
  const nav = (name) => page.locator("#mail .p2-nav-i").filter({ hasText: name }).click();
  const row = (id) => page.locator(`#mail .ml-row[data-id="${id}"]`);
  const emptyDetail = async () => assert.equal(await page.locator("#mail .ml-act").count(), 0, "Thư ẩn không còn nút hành động");
  const sent = () => page.evaluate(() => window.sent.map((x) => x.payload));
  for (const fs of [0, 1, 2]) {
    await page.evaluate((fs) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); }, fs);
    await nav("Tất cả"); await fixture([mail(1, { read: true }), mail(2)]); await row(1).click();
    const count = (await sent()).length;
    await nav("Chưa đọc");
    assert.equal(await row(1).count(), 0);
    assert.equal(await page.locator("#mail .ml-del").count(), before ? 1 : 0);
    assert.equal((await sent()).length, count, "Đổi mục không tự gửi lệnh");
    await page.screenshot({ path: resolve(out, `${before ? "truoc" : "sau"}-doi-muc-chu-${fs}.png`) });
    await nav("Có quà"); await fixture([mail(3, { honTe: 120 }), mail(4, { honTe: 30 })]); await row(3).click();
    await page.locator("#mail .ml-claim").click();
    assert.deepEqual((await sent()).at(-1), { op: "claim", id: 3 });
    await fixture([mail(3, { honTe: 120, read: true, claimed: true }), mail(4, { honTe: 30 })]);
    assert.equal(await row(3).count(), 0);
    assert.equal(await page.locator("#mail .ml-del").count(), before ? 1 : 0);
    await page.screenshot({ path: resolve(out, `${before ? "truoc" : "sau"}-nhan-qua-chu-${fs}.png`) });
    if (before) continue;
    await emptyDetail();
    // Đọc trong Chưa đọc giữ dòng vừa mở, kể cả sau xác nhận và thư mới.
    await nav("Chưa đọc"); await fixture([mail(5), mail(6)]); await row(5).click();
    assert.deepEqual((await sent()).at(-1), { op: "read", id: 5 });
    await fixture([mail(7), mail(5, { read: true }), mail(6)]);
    assert.equal(await row(5).getAttribute("aria-pressed"), "true");
    assert.match(await page.locator("#mail .ml-body").innerText(), /thư 5/);
    await page.screenshot({ path: resolve(out, `sau-dang-doc-chu-${fs}.png`) });
    await row(6).click(); assert.equal(await row(5).count(), 0);
    await nav("Tất cả"); await nav("Chưa đọc"); assert.equal(await row(6).count(), 0); await emptyDetail();
    // Server làm thư rời bộ lọc, xóa thư cuối, hộp trống: không chọn hộ thư khác.
    await fixture([mail(8)]); await row(8).click(); await page.locator("#mail .ml-del").click();
    assert.deepEqual((await sent()).at(-1), { op: "del", id: 8 });
    await fixture([]); await emptyDetail(); assert.match(await page.locator("#mail").innerText(), /Hộp thư trống/);
    await nav("Có quà"); await fixture([mail(9, { honTe: 1 })]); await row(9).click();
    const n = (await sent()).length;
    await fixture([mail(9, { honTe: 1, claimed: true, read: true })]); await emptyDetail();
    assert.match(await page.locator("#mail").innerText(), /Không có thư nào trong mục này/);
    assert.equal((await sent()).length, n);
    await nav("Tất cả"); await fixture([mail(10, { read: true })]); await row(10).click();
    await fixture([mail(11)]); await emptyDetail();
    assert.equal(await row(11).getAttribute("aria-pressed"), "false");
    await nav("Chưa đọc"); await row(11).click();
    await page.evaluate(() => { ml.closeMail(); ml.openMail(); });
    await emptyDetail(); assert.equal(await row(11).count(), 0, "Đóng bảng bỏ giữ dòng đã đọc");
    await nav("Có quà"); await fixture([mail(12, { honTe: 1 }), mail(13, { honTe: 1 })]);
    await row(12).click(); await page.locator("#mail .p2-primary").click();
    assert.deepEqual((await sent()).at(-1), { op: "claimAll" });
    await fixture([mail(12, { honTe: 1, read: true, claimed: true }), mail(13, { honTe: 1, read: true, claimed: true })]);
    await emptyDetail(); assert.equal(await page.locator("#mail .ml-row").count(), 0);
    await nav("Tất cả"); await row(12).click(); await page.locator("#mail .ml-del").click();
    const afterDel = (await sent()).length;
    await fixture([mail(13, { honTe: 1, read: true, claimed: true })]); await emptyDetail();
    assert.equal(await row(13).getAttribute("aria-pressed"), "false");
    assert.equal((await sent()).length, afterDel, "Xóa không tự đọc/nhận/xóa thư kế tiếp");
  }
  assert.deepEqual(errors, []);
  console.log(`✓ ${before ? "Tái hiện hai lỗi" : "Hồi quy lựa chọn Thư"}, ba cỡ chữ: ${out}`);
} finally { await browser?.close(); vite.kill(); }
