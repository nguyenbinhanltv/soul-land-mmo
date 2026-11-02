// Hồi quy bảng Nhiệm Vụ ở Menu (#1605) bằng Chrome tắt âm: 4 cỡ màn × 3 cỡ chữ (a11y-fs-*), dữ liệu giả (1 chuỗi + 3 bài hằng ngày chưa nhận, như tài khoản mới).
// Kiểm: bảng mở, nằm trọn trong màn, số trong dòng đếm = số dòng liệt kê, không tràn ngang, dòng cuối cuộn tới được, tiêu điểm bàn phím vào bảng,
// Esc (ngăn xếp bảng) và nút × đóng được, vẽ lại khi dữ liệu đổi, trạng thái rỗng. `QUEST_MODE=truoc` chụp ảnh "trước" (hành vi cũ: toast + khung theo dõi); `QUEST_OUTPUT` đặt thư mục ảnh.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";
import { chromium } from "playwright";

const before = process.env.QUEST_MODE === "truoc", prefix = before ? "truoc" : "sau";
const out = process.env.QUEST_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "quest-panel-"));
await mkdir(out, { recursive: true });
const root = fileURLToPath(new URL("../../", import.meta.url));
const dataUrl = "/@fs/" + resolve(root, "shared/data.ts").split("\\").join("/");
const port = await new Promise((done) => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
const vite = spawn(process.execPath, ["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(port)], { cwd: root, stdio: ["ignore", "pipe", "pipe"] });
let log = "", browser;
for (const stream of [vite.stdout, vite.stderr]) stream.on("data", (d) => { log = (log + d).slice(-4000); });
try {
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) break; await new Promise((r) => setTimeout(r, 100)); if (i === 99) throw new Error(log); }
  browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--mute-audio"] });
  const page = await browser.newPage();
  const errors = []; page.on("pageerror", (e) => errors.push(e.stack ?? e.message));
  await page.goto(url + "/choi/");
  // Đợi game vẽ xong màn đăng nhập rồi mới gỡ #overlay: gỡ sớm thì loginScreen() chạy sau getElementById ra null (pageerror, chập chờn trên CI chậm, #1619).
  await page.waitForSelector("#credits-open", { state: "attached" });
  await page.evaluate(async (dataUrl) => {
    await (await import("/src/uiArt.ts")).loadUiArt();
    document.querySelector("#overlay")?.remove();
    const hud = document.querySelector("#hud"); hud.hidden = false; hud.style.display = "block";
    const D = await import(dataUrl), Q = await import("/src/hudQuest.ts"), S = await import("/src/questScreen.ts"), P = await import("/src/panelStack.ts");
    const F = await import("/src/feedback.ts");
    Object.assign(window, { D, Q, S, P, F });
    Q.setQuest({ chain: D.QUEST_STARTER, step: 1, accepted: true, prog: [0, 0], status: "active" });
    const ids = D.dailyIds("2026-11-01");
    Q.setDaily({ day: "2026-11-01", i: 0, route: {}, list: ids.map((chain) => ({ chain, step: 0, accepted: false, prog: [], status: "offer" })) });
    P.initPanelStack([{ id: "quests", close: S.closeQuests }], () => {}, new AbortController().signal);
  }, dataUrl);
  const viewports = [[640, 360], [960, 540], [1280, 720], [1920, 1080]];
  for (const [width, height] of viewports) for (const fs of [0, 1, 2]) {
    await page.setViewportSize({ width, height });
    await page.evaluate((fs) => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); }, fs);
    const tag = `${width}×${height}, chữ ${fs}`;
    if (before) { // hành vi cũ: toast "Đang theo dõi N nhiệm vụ" + mở khung theo dõi, không có bảng
      await page.evaluate(() => { const n = window.Q.revealQuestTracker(); window.F.toast("quest", `Đang theo dõi ${n} nhiệm vụ`, "Khung theo dõi ở góc trái, dưới thông tin nhân vật; gặp NPC có dấu trên đầu để nhận / trả"); });
      await page.waitForTimeout(300);
      await page.screenshot({ path: resolve(out, `${prefix}-${width}x${height}-chu-${fs}.png`) });
      continue;
    }
    await page.evaluate(() => window.S.openQuests());
    await page.waitForTimeout(150);
    await page.screenshot({ path: resolve(out, `${prefix}-${width}x${height}-chu-${fs}.png`) });
    const m = await page.evaluate(() => {
      const p = document.querySelector("#quests"), r = p.getBoundingClientRect(), list = p.querySelector(".qj-list"), rows = [...p.querySelectorAll(".qj-row")];
      const body = p.querySelector(".p2-body"); list.scrollTop = list.scrollHeight; body.scrollTop = body.scrollHeight; // cuộn cả danh sách lẫn thân bảng (màn thấp: thân cuộn)
      const last = rows.at(-1).getBoundingClientRect(), lr = body.getBoundingClientRect();
      return { open: !p.hidden, r: { l: r.left, t: r.top, rt: r.right, b: r.bottom }, vw: innerWidth, vh: innerHeight, count: p.querySelector(".qj-count").textContent, rows: rows.length,
        aria: list.getAttribute("aria-label"), overX: list.scrollWidth > list.clientWidth + 1 || body.scrollWidth > body.clientWidth + 1, lastVisible: last.bottom <= lr.bottom + 1,
        focusIn: p.contains(document.activeElement) };
    });
    assert.ok(m.open, `${tag}: bảng mở`);
    assert.ok(m.r.l >= 0 && m.r.t >= 0 && m.r.rt <= m.vw && m.r.b <= m.vh, `${tag}: bảng nằm trọn trong màn ${JSON.stringify(m)}`);
    assert.equal(m.rows, 4, `${tag}: 1 chuỗi + 3 bài hằng ngày = 4 dòng`);
    assert.equal(m.count, `Đang có ${m.rows} nhiệm vụ`, `${tag}: dòng đếm khớp số dòng`);
    assert.match(m.aria, new RegExp(`^${m.rows} `), `${tag}: nhãn danh sách khớp số dòng`);
    assert.ok(!m.overX, `${tag}: danh sách không tràn ngang`);
    assert.ok(m.lastVisible, `${tag}: dòng cuối cuộn tới được`);
    assert.ok(m.focusIn, `${tag}: tiêu điểm bàn phím nằm trong bảng`);
    assert.equal(await page.evaluate(() => window.P.closeTopPanel()), true, `${tag}: Esc (ngăn xếp bảng) đóng được bảng`);
    assert.equal(await page.evaluate(() => document.querySelector("#quests").hidden), true, `${tag}: bảng đã đóng`);
  }
  if (!before) {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => window.S.openQuests());
    await page.locator("#quests .scr-x").click();
    assert.equal(await page.evaluate(() => document.querySelector("#quests").hidden), true, "nút × đóng bảng");
    await page.evaluate(() => { window.S.openQuests(); window.Q.setDaily({ day: "2026-11-01", i: 0, route: {}, list: window.D.dailyIds("2026-11-01").map((chain) => ({ chain, step: 0, accepted: true, prog: [], status: "done" })) }); });
    assert.equal(await page.evaluate(() => document.querySelectorAll("#quests .qj-row").length), 1, "bảng vẽ lại khi dữ liệu đổi (bài xong bị bỏ)");
    await page.evaluate(() => { window.Q.setQuest({ chain: window.D.QUEST_STARTER, step: 0, accepted: true, prog: [], status: "done" }); });
    const empty = await page.evaluate(() => ({ rows: document.querySelectorAll("#quests .qj-row").length, text: document.querySelector("#quests .p2-body").textContent, n: window.S.questCount() }));
    assert.equal(empty.rows, 0); assert.equal(empty.n, 0); assert.match(empty.text, /Chưa có nhiệm vụ/, "trạng thái rỗng");
    await page.screenshot({ path: resolve(out, `${prefix}-rong.png`) });
  }
  assert.deepEqual(errors, []);
  console.log(`✓ ${before ? "Ảnh trước" : "Bảng Nhiệm Vụ"}: 4 cỡ màn × 3 cỡ chữ: ${out}`);
} finally { await browser?.close(); vite.kill(); vite.stdout.destroy(); vite.stderr.destroy(); vite.unref(); }
