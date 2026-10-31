// X4: UI sender giả, Chrome tắt âm; fixture chỉ dùng trong bài kiểm thử.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "node:net";
const out = process.env.RANK_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "rank-ui-"));
await mkdir(out, { recursive: true });
const port = await new Promise((done) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
const vite = spawn(process.execPath, ["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(port)], { cwd: fileURLToPath(new URL("../../", import.meta.url)), stdio: ["ignore", "pipe", "pipe"] });
let viteLog = "";
for (const stream of [vite.stdout, vite.stderr]) stream.on("data", (d) => { viteLog = (viteLog + d).slice(-4000); });
let browser;
try {
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) break; await new Promise((r) => setTimeout(r, 100)); if (i === 99) throw new Error(viteLog); }
  console.log("Vite sẵn sàng");
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio"] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = []; page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url + "/choi/");
  console.log("Chrome mở trang");
  await page.clock.install();
  await page.evaluate(async () => {
    window.rk = await import("/src/rankScreen.ts");
    document.querySelector("#overlay")?.remove();
    document.querySelector("#hud").hidden = false;
    document.querySelector("#hud").style.display = "block";
    window.sent = [];
    rk.bindRank((type, payload) => sent.push({ type, payload })); rk.openRank();
    rk.onRankBoards({ k: "boards", list: [ { board: "cap", group: "Người chơi", name: "Cấp", period: 0 }, { board: "suu_tam", group: "Người chơi", name: "Sưu tầm", period: 0 }, { board: "suc_manh", group: "Người chơi", name: "Sức mạnh", period: 0 } ] });
  });
  const pick = async (board) => page.locator(`[data-board="${board}"]`).click();
  const nav = async (name) => page.locator("#rank .p2-nav-i").filter({ hasText: name }).click();
  const fixture = async (kind) => page.evaluate((kind) => {
    if (kind === "res") rk.onRankResonance({ page: 1, pageSize: 10, total: 11, hasNext: true, list: [{ name: "<b>Đường Tam</b>", score: 200, milestones: 2, me: true }], me: { rank: 1, score: 200 } });
    if (kind === "arena") rk.onRankArena({ list: Array.from({ length: 12 }, (_, i) => ({ name: `Hồn sư ${i + 1}`, elo: 2000 - i, me: false })), me: null });
    if (kind === "tong") rk.onRankTong({ week: 20261101, min: 10, me: 7, cur: { tongs: [{ tong: "hao_thien_tong", avg: 20.5, active: 2 }], top: { hao_thien_tong: [{ name: "Đường Tam", points: 30 }] } } });
  }, kind);
  console.log("Bắt đầu kiểm chuyển bảng");
  await pick("cong_minh"); assert.equal(await page.locator("#rank .rk-skel").count(), 1); await fixture("res");
  assert.equal(await page.locator("#rank .rk-who b").count(), 0);
  assert.match(await page.locator("#rank").innerText(), /<b>Đường Tam<\/b>/);
  await page.locator('#rank [data-pg="1"]').click();
  await fixture("res");
  assert.equal(await page.locator("#rank .rk-pg-l").innerText(), "Trang 1/2"); // Kiểm trang và nhịp gửi.
  await page.evaluate(() => rk.onRankResonance({ page: 2, pageSize: 10, total: 11, hasNext: false, list: [{ name: "Trang hai", score: 1, me: false }], me: null }));
  assert.equal(await page.locator("#rank .rk-pg-l").innerText(), "Trang 2/2");
  await nav("Đấu trường"); await nav("Tông môn"); await fixture("arena");
  assert.equal(await page.locator("#rank .rk-row").count(), 0);
  await page.clock.fastForward(20000);
  assert.equal(await page.evaluate(() => sent.at(-1).type), "tong");
  await fixture("tong"); assert.match(await page.locator("#rank").innerText(), /không có hạng cá nhân toàn server/);
  await nav("Đấu trường"); await page.clock.fastForward(20000); await fixture("arena");
  const before = await page.evaluate(() => sent.length);
  await page.locator('#rank [data-pg="1"]').click();
  assert.equal(await page.evaluate(() => sent.length), before); // Kiểm trang và nhịp gửi.
  assert.match(await page.locator("#rank").innerText(), /Hồn sư 11/);
  await nav("Người chơi"); await pick("cong_minh");
  await page.clock.fastForward(20000);
  assert.equal(await page.locator("#rank .rk-retry").count(), 1);
  await page.locator("#rank .rk-retry").click();
  await page.evaluate(() => rk.onRankResonance({ page: 1, pageSize: 10, total: 0, hasNext: false, list: [], me: null }));
  assert.match(await page.locator("#rank").innerText(), /Chưa có ai/);
  assert.match(await page.locator("#rank .rk-mine").innerText(), /Chưa có hạng/);
  await page.clock.fastForward(20000);
  await page.locator("#rank .p2-primary").click();
  await page.clock.fastForward(7000);
  assert.equal(await page.locator("#rank .rk-retry").count(), 1);
  assert.match(await page.locator("#rank").innerText(), /Chưa có ai/); // lỗi vẫn giữ dữ liệu trước
  for (const fs of [0, 1, 2]) {
    await page.evaluate((fs) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); }, fs);
    await fixture("res"); await page.screenshot({ path: resolve(out, `cong-minh-chu-${fs}.png`) });
    await nav("Đấu trường"); await fixture("arena"); await page.screenshot({ path: resolve(out, `elo-chu-${fs}.png`) });
    await nav("Tông môn"); await fixture("tong"); assert.ok(await page.locator("#rank .rk-paper").evaluateAll((es) => es.every((e) => e.getBoundingClientRect().height > 20))); await page.screenshot({ path: resolve(out, `tong-tuan-chu-${fs}.png`) });
    await nav("Người chơi"); await pick("cong_minh");
  }
  assert.deepEqual(errors, []);
  console.log(`✓ UI sender giả và ảnh ba cỡ chữ: ${out}`);
} finally { await browser?.close(); vite.kill(); }
