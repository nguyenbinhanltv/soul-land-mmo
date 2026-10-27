// Game thật trên server RAM riêng: kiểm bounds chữ, ưu tiên, !/?, FPS và ảnh trước/sau; không ghi ảnh vào Git.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { Client } from "colyseus.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.NAMEPLATE_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "c9-preview-")));
const children = [], bots = [];
let browser;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => {
  const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); });
});
function start(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, detached: process.platform !== "win32", env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  let log = "";
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (d) => { log = (log + d).slice(-12000); });
  child.on("exit", (code) => { if (code) console.error(log); });
}
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw new Error(`Không mở được ${url}`);
}

try {
  await mkdir(out, { recursive: true });
  const apiPort = await port(), webPort = await port(), api = `http://127.0.0.1:${apiPort}`, web = `http://127.0.0.1:${webPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  start(["client/node_modules/vite/bin/vite.js", "client", "--host", "127.0.0.1", "--port", String(webPort)], { VITE_SERVER_URL: api });
  await Promise.all([ready(`${api}/health`), ready(web)]);
  const post = async (path, body) => {
    const r = await fetch(api + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json(); assert.ok(r.ok, data.error); return data;
  };
  const run = Date.now().toString(36).slice(-5);
  async function account(i) {
    const name = `C9 ${String(i).padStart(2, "0")} ${run}`;
    const { token } = await post("/api/login", { name, password: "C9-local-preview!" });
    await post("/api/looks", { token, sex: i % 2, hair: 0, hairCol: 0, outfitCol: 0 });
    await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });
    return { name, token };
  }
  const owner = await account(40);
  browser = await chromium.launch({ headless: true, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (e) => console.error("[trình duyệt]", e.message));
  await page.addInitScript(({ token }) => localStorage.setItem("shh-token", token), owner);
  // Chỉ lấy tham chiếu scene để đo; không thay state hay logic hiển thị của game.
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + "\nconst c9Create = GameScene.prototype.create; GameScene.prototype.create = function(...args) { window.__c9Scene = this; return c9Create.apply(this, args); };" });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__c9Scene?.players.size > 0);
  await page.evaluate(() => window.__c9Scene.room.send("test", { op: "warp", mapId: "nac_dinh_thanh" }));
  await page.waitForFunction(() => window.__c9Scene?.mapId === "nac_dinh_thanh" && window.__c9Scene.npcs.some((n) => n.id === "dai_su") && window.__c9Scene.players.size > 0);
  const home = await page.evaluate(async () => {
    const s = window.__c9Scene, n = s.npcs.find((x) => x.id === "dai_su");
    for (const dx of [24, -24, 40, -40, 0]) {
      s.room.send("test", { op: "goto", x: n.x + dx, y: n.y + 24 });
      await new Promise((r) => setTimeout(r, 200));
      const p = s.room.state.players.get(s.me);
      if (Math.hypot(p.x - n.x, p.y - n.y) < 70) return { x: p.x, y: p.y, room: s.room.roomId };
    }
    throw new Error("Không đứng được gần NPC Đại Sư");
  });
  for (const [accepted, prog, symbol, filename] of [[false, [], "!", "quest-offer.png"], [true, [1], "?", "quest-ready.png"]]) {
    await page.evaluate((q) => window.__c9Scene.room.send("test", { op: "quest", step: 0, ...q }), { accepted, prog });
    await page.waitForFunction((symbol) => {
      const n = window.__c9Scene.npcs.find((n) => n.id === "dai_su"); return n.qmark?.visible && n.qmark.text === symbol;
    }, symbol);
    await page.screenshot({ path: resolve(out, filename) });
  }
  for (let i = 0; i < 40; i++) {
    const a = await account(i);
    const client = new Client(api.replace("http", "ws"));
    const town = await client.joinOrCreate("map", { token: a.token, mapId: "thanh_hon_thon" });
    town.onMessage("*", () => {});
    await new Promise((done, reject) => {
      const timer = setTimeout(() => reject(new Error("Chuyển bản đồ fixture quá hạn")), 5000);
      town.onMessage("travel", () => { clearTimeout(timer); done(); });
      town.send("test", { op: "warp", mapId: "nac_dinh_thanh", x: home.x, y: home.y });
    });
    await town.leave();
    const room = await client.joinById(home.room, { token: a.token, mapId: "nac_dinh_thanh" });
    room.onMessage("*", () => {}); bots.push(room);
    room.send("test", { op: "goto", x: home.x, y: home.y });
  }
  await page.waitForFunction(() => window.__c9Scene.players.size === 41);
  for (const b of bots.slice(0, 3)) {
    await page.evaluate((sid) => window.__c9Scene.room.send("party", { op: "invite", sid }), b.sessionId);
    await sleep(300); b.send("party", { op: "accept", name: owner.name }); await sleep(300);
  }
  await page.waitForFunction(() => window.__c9Scene.party?.members.length === 4);
  await page.waitForTimeout(500);
  // Đi qua đúng bộ xử lý chọn người của game, rồi kiểm mức ưu tiên của nhãn được chọn.
  await page.evaluate(() => {
    const s = window.__c9Scene, v = [...s.players].find(([id]) => id !== s.me)[1];
    s.input.emit("pointerdown", { worldX: v.root.x, worldY: v.root.y - 24, button: 0 }, []);
    window.__c9After = s.layoutOverheadLabels;
  });
  await page.keyboard.press("Escape");
  const samples = [];
  for (const [width, height] of [[1280, 720], [1920, 1080], [960, 540], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
    await page.waitForFunction(({ width, height }) => {
      const s = window.__c9Scene, v = s.cameras.main.worldView;
      if (s.scale.width !== width || s.scale.height !== height) return false;
      const old = window.__c9CameraSample;
      const steady = old?.width === width && Math.abs(v.x - old.x) + Math.abs(v.y - old.y) < 0.5 ? old.steady + 1 : 0;
      window.__c9CameraSample = { width, x: v.x, y: v.y, steady };
      return steady >= 6;
    }, { width, height });
    // #1092: đổi cỡ màn hình làm nhãn đổi ô (trễ settle 200 ms) rồi trượt ~120 ms; hai nhãn đổi cùng lúc có thể chồng thoáng qua. Chờ vị trí vẽ
    // ngừng đổi đủ lâu (> hold 450 ms của bộ xếp, để ô "về chỗ gốc" cũng đã xong) rồi mới đo, không nới ngưỡng chồng.
    await page.evaluate(() => { window.__c9PlateSample = null; }); // mẫu của cỡ trước không được tính cho cỡ này
    await page.waitForFunction(() => {
      const s = window.__c9Scene, now = performance.now();
      window.__c9After.call(s);
      const sig = s.nameplateLayout.filter((p) => p.visible).map((p) => {
        const t = s.nameplateShown.get(p.id);
        return `${p.id}:${p.compact ? 1 : 0}:${t ? t.dx.toFixed(1) + "," + t.up.toFixed(1) : ""}`;
      }).sort().join("|");
      const old = window.__c9PlateSample;
      if (old?.sig !== sig) { window.__c9PlateSample = { sig, since: now }; return false; }
      return now - old.since >= 800;
    }, null, { timeout: 30000, polling: "raf" });
    const check = await page.evaluate(() => {
      const s = window.__c9Scene;
      window.__c9After.call(s);
      const shown = s.nameplateLayout.filter((p) => p.visible), texts = [];
      const add = (t) => { if (t?.visible) texts.push({ text: t.text, bounds: t.getBounds() }); };
      s.players.forEach((v) => [v.label, v.title, v.tongT].forEach(add));
      s.npcs.forEach((n) => [n.nameText, n.titleText, n.mark, n.qmark].forEach(add));
      s.eliteLabels.forEach(add); s.wtexts.forEach((e) => add(e.t));
      const overlaps = [];
      for (let i = 0; i < texts.length; i++) for (const b of texts.slice(i + 1)) {
        const a = texts[i].bounds, r = b.bounds;
        if (a.left < r.right && r.left < a.right && a.top < r.bottom && r.top < a.bottom && overlaps.length < 10) overlaps.push([texts[i].text, b.text]);
      }
      return { players: s.players.size, visible: shown.length, overlaps, selected: shown.some((p) => p.id === `player:${s.selectedPlayer}`), party: s.party.members.every((m) => shown.some((p) => p.id === `player:${m.sid}`)) };
    });
    await page.screenshot({ path: resolve(out, `after-${width}x${height}.png`) });
    console.log(JSON.stringify({ width, height, ...check }));
    assert.equal(check.players, 41); assert.equal(check.overlaps.length, 0, JSON.stringify(check.overlaps));
    assert.ok(check.visible <= 18 && check.visible < 41); assert.ok(check.selected); assert.ok(check.party);
    const measure = () => page.evaluate(async () => {
      const s = window.__c9Scene, frames = []; let prev = performance.now();
      for (let i = 0; i < 90; i++) { await new Promise(requestAnimationFrame); const now = performance.now(); if (i >= 30) frames.push(now - prev); prev = now; }
      return 1000 / (frames.reduce((a, b) => a + b, 0) / frames.length);
    });
    const after = await measure();
    // Đối chứng cùng cảnh thật: tắt né/ẩn, vẽ toàn bộ nhãn theo độ lệch cũ; không đổi state server.
    await page.evaluate(() => {
      const s = window.__c9Scene;
      s.layoutOverheadLabels = function() {
        const K = this.txtK;
        this.players.forEach((v, id) => {
          const p = this.room.state.players.get(id); if (!p) return;
          const offset = p.tong ? 8 : 0;
          v.label.setScale(K).setPosition(v.root.x, v.root.y - 60 - offset * K).setVisible(!p.dead);
          v.title.setScale(K).setPosition(v.root.x, v.root.y - 60 - (offset + 8) * K).setVisible(!p.dead);
          v.tongT.setScale(K).setPosition(v.root.x, v.root.y - 60).setVisible(!!p.tong && !p.dead);
        });
        this.npcs.forEach((n) => [n.nameText, n.titleText, n.mark, n.qmark].forEach((t, i) => { if (t) t.setScale(K).setPosition(n.nameText.x, n.top - i * 8 * K).setVisible(i < 2 || (i === 2 ? this.nearNpc === n.id : !!t.text)); }));
        this.wtexts.forEach((e) => e.t.setPosition(e.x0, e.y0 - e.off * K).setVisible(true));
      };
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: resolve(out, `before-${width}x${height}.png`) });
    const before = await measure();
    samples.push({ width, height, beforeFps: +before.toFixed(1), afterFps: +after.toFixed(1), ...check });
    await page.evaluate(() => { const s = window.__c9Scene; s.layoutOverheadLabels = window.__c9After; s.layoutOverheadLabels(); });
  }
  await writeFile(resolve(out, "verification.json"), JSON.stringify(samples, null, 2));
  await writeFile(resolve(out, "preview.html"), `<!doctype html><html lang="vi"><meta charset="utf-8"><title>C9 — nhãn trong game thật</title>
    <style>body{font:16px system-ui;background:#171d20;color:#f6eedb;margin:24px}img{max-width:100%;image-rendering:pixelated}section{margin:32px 0}figure{margin:16px 0}h1,h2{color:#ffe477}</style>
    <h1>C9 — 41 hồn sư cùng màn hình</h1><p>Hai ảnh cùng state server RAM thật. Trước: tắt né/ẩn nhãn, đặt theo độ lệch cũ. Sau: bật C9. Đo bằng Chromium render phần mềm; không phải FPS thiết bị người chơi.</p>
    ${samples.map((s) => `<section><h2>${s.width}×${s.height}</h2><p>FPS ${s.beforeFps} → ${s.afterFps}; còn ${s.visible} nhãn; không chồng chữ; giữ mục tiêu và tổ đội.</p><figure><figcaption>Trước</figcaption><img src="before-${s.width}x${s.height}.png"></figure><figure><figcaption>Sau</figcaption><img src="after-${s.width}x${s.height}.png"></figure></section>`).join("")}
    <h2>Dấu nhiệm vụ</h2><p>Trạng thái do server gửi: nhận bài và chờ trả bài.</p><img src="quest-offer.png"><img src="quest-ready.png"></html>`);
  console.log(JSON.stringify({ output: out, samples }, null, 2));
} finally {
  await Promise.allSettled(bots.map((b) => b.leave()));
  await browser?.close();
  for (const child of children) { try { process.kill(process.platform === "win32" ? child.pid : -child.pid, "SIGTERM"); } catch {} }
}
