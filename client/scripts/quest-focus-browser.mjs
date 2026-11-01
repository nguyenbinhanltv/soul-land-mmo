// #1554: bàn phím thật trên game RAM; QUEST_FOCUS_BEFORE=1 để ghi đối chứng trước sửa.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "playwright/test";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = process.env.QUEST_FOCUS_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "quest-focus-"));
const before = process.env.QUEST_FOCUS_BEFORE === "1", children = [];
let stopping = false;
let browser;
function stop() {
  stopping = true;
  for (const c of children) if (c.exitCode === null && c.pid) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(c.pid), "/T", "/F"]);
    else process.kill(-c.pid, "SIGTERM");
  }
}
const watchdog = setTimeout(() => { stop(); process.exit(1); }, 240000);
const port = () => new Promise(done => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => done(p)); }); });
function start(args, env, cwd = root) {
  const c = spawn(process.execPath, args, { cwd, detached: process.platform !== "win32", env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(c);
  let log = "";
  for (const s of [c.stdout, c.stderr]) s.on("data", d => { log = (log + d).slice(-6000); });
  c.on("exit", code => { if (code && !stopping) console.error(log); });
}
try {
  await mkdir(out, { recursive: true });
  const api = `http://127.0.0.1:${await port()}`, webPort = await port(), web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: api.split(":").at(-1), GAME_TEST: "1" });
  start(["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api }, resolve(root, "client"));
  await Promise.all([api + "/health", web].map(url => expect.poll(async () => fetch(url).then(r => r.ok).catch(() => false), { timeout: 60000 }).toBe(true)));
  const post = async (path, data) => { const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); assert.ok(r.ok); return r.json(); };
  const { token } = await post("/api/login", { name: `Focus ${Date.now().toString(36).slice(-6)}`, password: "Focus-local!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || "chrome", args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  page.setDefaultTimeout(15000);
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.addInitScript(t => { localStorage.setItem("shh-token", t); localStorage.setItem("soul-land-audio-v1", JSON.stringify({ muted: true })); }, token);
  await page.route("**/private/**", route => route.fulfill({ status: 404, body: "" }));
  await page.route("**/src/scenes/GameScene.ts*", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `\nconst focusCreate = GameScene.prototype.create;
GameScene.prototype.create = function(...a) { window.__focusScene = this; return focusCreate.apply(this, a); };` });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__focusScene?.players.size > 0, null, { timeout: 60000 });
  await page.locator(".g-skip").click();
  await page.locator(".ob-skip").click();
  await page.evaluate(async () => {
    window.__qh = await import("/src/hudQuest.ts");
  });
  // Tin riêng giả lập đi qua đúng entry point HUD, không sửa state / luật server.
  const quest = (chain, status = "active", prog = [0]) => page.evaluate(q => window.__qh.setQuest(q), { chain, step: 0, status, prog });
  const daily = (status = "active") => page.evaluate(status => window.__qh.setDaily({ day: "20261101", i: 0, route: {}, list: [{ chain: "daily:20261101:0", step: 0, status, prog: [0] }] }), status);
  const chain = page.locator('#quest [data-chain="tan_thu"] .qhead');
  const day = page.locator("#quest .qhead").filter({ hasText: "Hằng ngày" });
  const active = () => page.evaluate(() => ({ tag: document.activeElement.tagName, id: document.activeElement.id, text: document.activeElement.textContent?.slice(0, 80) }));
  const focusByTab = async target => {
    // Điểm xuất phát trong HUD, rồi Tab thật tới nút; không focus() thẳng nút cần kiểm.
    await page.locator('#sideBox .sb-tab[data-tab="quest"]').focus();
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      if (await target.evaluate(e => e === document.activeElement)) return;
    }
    if (before) { console.log(`Đối chứng Tab bị game chặn: ${JSON.stringify(await active())}`); await target.focus(); return; }
    throw Error(`Tab không tới tiêu đề: ${JSON.stringify(await active())}`);
  };
  await page.evaluate(() => {
    const scene = window.__focusScene, send = scene.room.send.bind(scene.room);
    window.__focusCommands = [];
    scene.room.send = (type, m) => { if (["input", "attack", "target"].includes(type)) window.__focusCommands.push({ type, m }); return send(type, m); };
  });
  for (const fs of [0, 1, 2]) {
    await page.evaluate(fs => { document.body.classList.remove("a11y-fs-1", "a11y-fs-2"); if (fs) document.body.classList.add(`a11y-fs-${fs}`); }, fs);
    await quest("hai_than", "done"); await quest("su_lai_khac", "done");
    await quest("tan_thu"); await daily();
    await page.evaluate(() => window.__qh.revealQuestTracker());
    await focusByTab(chain);
    await page.keyboard.press("Enter");
    const enter = { active: await active(), expanded: await chain.getAttribute("aria-expanded") };
    await page.keyboard.press("Space");
    const space = { active: await active(), expanded: await chain.getAttribute("aria-expanded") };
    if (before) {
      console.log("Đối chứng Enter/Space:", JSON.stringify({ enter, space }));
      // Cô lập render khỏi lớp phím game để đo mất focus do cập nhật tiến độ.
      await chain.focus(); await quest("tan_thu", "active", [1]);
      console.log("Đối chứng tiến độ:", JSON.stringify(await active()));
      await page.screenshot({ path: resolve(out, "truoc-focus.png") });
      assert.equal(await chain.evaluate(e => e === document.activeElement), false);
      break;
    }
    assert.equal(enter.expanded, "false"); assert.equal(space.expanded, "true");
    await expect(chain).toBeFocused();
    assert.equal(await chain.evaluate(e => e.matches(":focus-visible")), true);
    await quest("tan_thu", "active", [1]); await expect(chain).toBeFocused();
    await page.keyboard.press("Tab"); await expect(day).toBeFocused();
    await page.keyboard.press("Enter"); await expect(day).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space"); await expect(day).toHaveAttribute("aria-expanded", "true");
    await daily("ready"); await expect(day).toBeFocused();
    await daily("done"); await expect(day).toBeFocused();
    assert.equal(await day.evaluate(e => e.matches(":focus-visible")), true);
    await page.setViewportSize({ width: 1280, height: 720 });
    await day.scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(out, `sau-fs${fs}.png`) });
    await page.setViewportSize({ width: 960, height: 540 });
    // Chat / panel khác giữ nguyên focus qua cả hai loại tin.
    await page.locator("#chat").fill("đang gõ");
    await quest("tan_thu"); await daily(); await expect(page.locator("#chat")).toBeFocused();
    await page.keyboard.press("Escape");
    await page.locator('#sideBox .sb-tab[data-tab="party"]').focus();
    await quest("tan_thu"); await daily();
    await expect(page.locator('#sideBox .sb-tab[data-tab="party"]')).toBeFocused();
    // Chuột không kéo focus từ chat vào tracker, kể cả khi đang thu / mở.
    await page.locator("#chat").focus(); await chain.click(); await expect(page.locator("#chat")).toBeFocused();
    await chain.click(); await expect(page.locator("#chat")).toBeFocused();
    await focusByTab(chain); await day.click();
    assert.equal(await page.locator("#quest .qhead:focus").count(), 0, "chuột không khôi phục tiêu điểm bàn phím cũ");
    await day.click();
    // Chuỗi biến mất: mục kế tiếp theo thứ tự QUESTS, sau đó mục trước / tab khi rỗng.
    await focusByTab(chain); await quest("su_lai_khac", "offer");
    await quest("tan_thu", "done");
    const next = page.locator('#quest [data-chain="su_lai_khac"] .qhead');
    await expect(next).toBeFocused();
    await quest("su_lai_khac", "done"); await expect(day).toBeFocused();
    await page.evaluate(() => { window.__qh.setTrackerMap(""); window.__qh.setDaily({ day: "20261101", i: 0, route: {}, list: [] }); window.__qh.setQuest({ chain: "tan_thu", step: 0, status: "active", prog: [0] }); });
    // Hằng ngày còn hiện do tân thủ đã xong ở lượt render đầu, rồi ẩn khi tân thủ hoạt động lại.
    await expect(chain).toBeFocused();
    await page.evaluate(() => window.__qh.setQuest({ chain: "tan_thu", step: 999, status: "active", prog: [] }));
    await expect(page.locator('#sideBox .sb-tab[data-tab="quest"]')).toBeFocused();
    console.log(`Cỡ chữ ${fs}: thu/mở, tiến độ, Tab, chat, chuột, hoàn tất/biến mất đạt`);
  }
  if (!before) {
    const commands = await page.evaluate(() => window.__focusCommands.filter(c => c.type !== "input" || c.m.x || c.m.y));
    assert.deepEqual(commands, [], "Tab/Enter/Space không gửi di chuyển, đánh hay đổi mục tiêu");
    assert.deepEqual(errors, []);
  }
  console.log(`Ảnh: ${out}`);
} finally { clearTimeout(watchdog); await browser?.close(); stop(); }
