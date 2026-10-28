// U1 #754: lớp quản lý bảng + input, kiểm trên game thật (server RAM riêng + vite riêng + một Chromium `--mute-audio`).
// Kiểm: bấm trên bảng KHÔNG walkTo / khoá mục tiêu; bấm nền vẫn đi; Esc đóng bảng trên cùng trước, hết bảng mới huỷ khoá; mở bảng nhả phím đang giữ.
// `PANEL_OUTPUT=<thư mục>`: nơi ghi ảnh (mặc định thư mục tạm); `PANEL_TAG=truoc|sau`: tiền tố ảnh; `PANEL_SOFT=1`: chỉ ghi số đo, không assert (lượt "trước").
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.PANEL_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "u1-panel-")));
const tag = process.env.PANEL_TAG ?? "sau", soft = process.env.PANEL_SOFT === "1";
const children = [];
let browser;
const killChildren = () => { for (const child of children) { try { process.kill(process.platform === "win32" ? child.pid : -child.pid, "SIGTERM"); } catch {} } };
// Chặn treo: cả bài quá PANEL_TIMEOUT_MS (mặc định 180 s; chạy thường ~15 s) thì tắt tiến trình con rồi thoát mã 1.
const watchdog = setTimeout(() => { console.error("panel-browser quá thời gian (treo?): tắt tiến trình con rồi thoát"); killChildren(); process.exit(1); }, Number(process.env.PANEL_TIMEOUT_MS ?? 180000));
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
const check = (cond, msg) => { if (soft) { if (!cond) console.log("  (trước) không đạt:", msg); } else assert.ok(cond, msg); };

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
  const name = `U1 ${Date.now().toString(36).slice(-5)}`;
  const { token } = await post("/api/login", { name, password: "U1-local-preview!" });
  await post("/api/looks", { token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0 });
  await post("/api/awaken", { token, vohon: "lam_dien_ba_vuong_long" });

  browser = await chromium.launch({ headless: true, channel: process.env.FLOW_CHANNEL || undefined, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (e) => console.error("[trình duyệt]", e.message));
  await page.addInitScript((t) => localStorage.setItem("shh-token", t), token);
  // Chỉ lấy tham chiếu scene và đếm lệnh đi / khoá; không đổi logic. Không đếm `beastAt`: con trỏ ngữ cảnh (cập nhật mỗi khung hình) cũng gọi nó để dò hover, bấm vào hồn thú đã thành `lockTo`.
  await page.route("**/src/scenes/GameScene.ts*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: await response.text() + `
const u1Create = GameScene.prototype.create;
GameScene.prototype.create = function(...a) {
  window.__u1 = this; window.__u1n = { walk: 0, lock: 0 };
  for (const [k, c] of [["walkTo", "walk"], ["lockTo", "lock"]]) { const o = this[k]; this[k] = function(...x) { window.__u1n[c]++; return o.apply(this, x); }; }
  return u1Create.apply(this, a);
};` });
  });
  await page.goto(`${web}/choi/`);
  await page.getByRole("button", { name: "Vào Thánh Hồn Thôn" }).click();
  await page.waitForFunction(() => window.__u1?.players.size > 0);
  await page.waitForTimeout(1500);
  const counts = () => page.evaluate(() => ({ ...window.__u1n, lockId: window.__u1.lockId, goal: !!window.__u1.goal }));
  const open = () => page.evaluate(() => ["char", "bag", "roster", "reso", "friends", "world", "npc", "autoPanel", "audio", "chans", "pmenu"].filter((id) => { const e = document.getElementById(id); return e && !e.hidden; }));
  const shot = (n) => page.screenshot({ path: resolve(out, `${tag}-${n}.png`) });
  const res = { tag };

  // 1. Mở Nhân vật + Túi, bấm vào vùng KHÔNG phải nút của bảng (viền, tiêu đề, góc): game không được đi / khoá.
  await page.keyboard.press("KeyH"); await page.keyboard.press("KeyB");
  await page.waitForFunction(() => !document.getElementById("char").hidden && !document.getElementById("bag").hidden);
  const rects = await page.evaluate(() => ["char", "bag"].map((id) => { const r = document.getElementById(id).getBoundingClientRect(); return { id, x: r.left, y: r.top, w: r.width, h: r.height }; }));
  await page.evaluate(() => { const n = window.__u1n; n.walk = n.lock = 0; window.__u1.goal = null; });
  const pts = rects.flatMap((r) => [[r.x + 5, r.y + r.h - 5], [r.x + r.w - 5, r.y + r.h - 5], [r.x + r.w / 2, r.y + 6]]);
  for (const [x, y] of pts) { await page.mouse.click(x, y); await sleep(60); }
  res.clickOnPanels = { points: pts.length, ...(await counts()) };
  await shot("bam-tren-bang");
  check(res.clickOnPanels.walk === 0 && !res.clickOnPanels.goal, `bấm trên bảng không được đi: ${JSON.stringify(res.clickOnPanels)}`);

  // 1b. Con trỏ đứng yên trên nền, bảng mở ra ngay dưới con trỏ rồi bấm không dịch chuột (trình duyệt chưa kịp báo chuột rời canvas).
  await page.keyboard.press("Escape"); await page.keyboard.press("Escape");
  await page.mouse.move(640, 360); await page.evaluate(() => { const n = window.__u1n; n.walk = n.lock = 0; window.__u1.goal = null; });
  await page.keyboard.press("KeyB"); await page.waitForFunction(() => !document.getElementById("bag").hidden);
  await page.mouse.down(); await page.mouse.up(); await sleep(80);
  res.clickUnderStillCursor = await counts();
  await shot("bam-duoi-con-tro");
  check(res.clickUnderStillCursor.walk === 0, `bảng mở dưới con trỏ đứng yên: ${JSON.stringify(res.clickUnderStillCursor)}`);
  await page.keyboard.press("KeyH"); await page.waitForFunction(() => !document.getElementById("char").hidden);

  // 1c. Phaser còn nghe mousedown ở cấp window và chỉ lọc theo "chuột đang trên canvas": con trỏ trên nền nhưng sự kiện bấm rơi vào bảng
  // (trạng thái isOver cũ, bấm do mã gửi) vẫn không được thành lệnh đi.
  const ground = await page.evaluate(() => { for (const [x, y] of [[640, 40], [30, 400], [1250, 400], [640, 690], [640, 360]]) { if (document.elementFromPoint(x, y) === window.__u1.game.canvas) return [x, y]; } return null; });
  assert.ok(ground, "không tìm được điểm nền trống để đặt con trỏ");
  await page.mouse.move(ground[0], ground[1]); await sleep(100);
  await page.evaluate(() => { const n = window.__u1n; n.walk = n.lock = 0; window.__u1.goal = null; });
  await page.evaluate(() => { const r = document.getElementById("bag").getBoundingClientRect(); document.getElementById("bag").dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: r.left + r.width - 5, clientY: r.top + r.height - 5, button: 0 })); });
  await sleep(80);
  res.mousedownOnPanelWhileOverCanvas = await counts();
  check(res.mousedownOnPanelWhileOverCanvas.walk === 0, `mousedown rơi vào bảng: ${JSON.stringify(res.mousedownOnPanelWhileOverCanvas)}`);

  // 2. Bấm nền ngoài bảng vẫn phải đi (kiểm chứng bài kiểm không "mù").
  await page.evaluate(() => { window.__u1n.walk = 0; });
  const gx = Math.round(rects[0].x + rects[0].w + 8), gy = 90;
  await page.keyboard.press("Escape"); await page.keyboard.press("Escape");
  // Điểm bấm lấy từ `ground` (phần tử ngay dưới điểm đó là canvas): thẻ Hướng dẫn tân thủ nằm giữa màn hình chặn bấm đúng ý, nên không dùng toạ độ cố định.
  await page.mouse.move(ground[0], ground[1]); await sleep(100); await page.mouse.click(ground[0], ground[1]); await sleep(80);
  res.clickOnGround = await counts();
  check(res.clickOnGround.walk >= 1, `bấm nền phải đi: ${JSON.stringify(res.clickOnGround)}`);

  // 2b. Bản đồ khu vực (N) đang mở rồi bấm phím mở bảng (#1045): bản đồ đóng, bảng hiện (không chìm sau lớp phủ).
  for (const [key, id] of [["KeyB", "bag"], ["KeyH", "char"], ["KeyV", "roster"], ["KeyL", "friends"]]) {
    await page.keyboard.press("KeyN"); await page.waitForFunction(() => !document.getElementById("mapview").hidden);
    await page.keyboard.press(key); await sleep(80);
    const st = await page.evaluate((i) => ({ map: !document.getElementById("mapview").hidden, shown: !document.getElementById(i).hidden }), id);
    res["mapThen" + key] = st;
    check(!st.map && st.shown, `N rồi ${key}: bản đồ đóng, ${id} hiện: ${JSON.stringify(st)}`);
    await page.keyboard.press("Escape"); await sleep(60);
  }

  // 3. Esc nhiều lớp: có khoá + hai bảng → Esc 1 đóng bảng trên cùng (bảng vừa bấm), Esc 2 đóng bảng còn lại, Esc 3 mới huỷ khoá.
  await page.keyboard.press("KeyH"); await page.keyboard.press("KeyB");
  await page.waitForFunction(() => !document.getElementById("char").hidden && !document.getElementById("bag").hidden);
  await page.evaluate(() => { window.__u1.lockId = "u1-fake"; });
  const b = rects[1];
  await page.mouse.click(b.x + b.w - 5, b.y + b.h - 5); // bấm vào Túi: Túi nổi lên trên cùng
  const steps = [];
  for (let i = 0; i < 3; i++) { await page.keyboard.press("Escape"); await sleep(80); steps.push({ open: await open(), lockId: (await counts()).lockId }); if (i === 0) await shot("esc-1"); }
  res.esc = steps;
  check(steps[0].open.length === 1 && steps[0].open[0] === "char" && steps[0].lockId === "u1-fake", `Esc 1 chỉ đóng Túi: ${JSON.stringify(steps[0])}`);
  check(steps[1].open.length === 0 && steps[1].lockId === "u1-fake", `Esc 2 đóng nốt Nhân vật, còn khoá: ${JSON.stringify(steps[1])}`);
  check(steps[2].open.length === 0 && steps[2].lockId === "", `Esc 3 mới huỷ khoá: ${JSON.stringify(steps[2])}`);

  // 4. Mở bảng nhả phím đang giữ, kể cả khi hệ điều hành còn gửi phím lặp.
  await page.keyboard.down("KeyD"); await sleep(60);
  const held = await page.evaluate(() => !!window.__u1.keys.KeyD);
  await page.click("#bagBtn"); await sleep(60);
  await page.keyboard.down("KeyD"); await sleep(60); await page.keyboard.down("KeyD"); await sleep(60); // lặp phím
  const afterOpen = await page.evaluate(() => !!window.__u1.keys.KeyD);
  await page.keyboard.up("KeyD"); await page.keyboard.down("KeyD"); await sleep(60);
  const pressedAgain = await page.evaluate(() => !!window.__u1.keys.KeyD);
  await page.keyboard.up("KeyD");
  res.keys = { held, afterOpen, pressedAgain };
  check(held && !afterOpen && pressedAgain, `nhả phím khi mở bảng: ${JSON.stringify(res.keys)}`);
  await page.keyboard.press("Escape");

  // 4b. Nút ⇆ (mở bảng kia rồi nâng bảng đang bấm trong cùng lượt): vẫn nhả phím, bảng đang bấm ở trên cùng (Esc đóng nó trước).
  await page.keyboard.press("KeyH"); await page.waitForFunction(() => !document.getElementById("char").hidden);
  await page.keyboard.down("KeyD"); await sleep(60);
  await page.click("#char button.swap"); await sleep(80);
  const swapState = await page.evaluate(() => ({ keyD: !!window.__u1.keys.KeyD, bag: !document.getElementById("bag").hidden, charZ: Number(document.getElementById("char").style.zIndex), bagZ: Number(document.getElementById("bag").style.zIndex) }));
  await page.keyboard.up("KeyD"); await page.keyboard.press("Escape"); await sleep(80);
  res.swap = { ...swapState, openAfterEsc: await open() };
  check(swapState.bag && !swapState.keyD && swapState.charZ > swapState.bagZ && res.swap.openAfterEsc.join() === "bag", `nút ⇆: ${JSON.stringify(res.swap)}`);
  await page.keyboard.press("Escape"); await page.keyboard.press("Escape");

  // 4c. Nút Cài đặt / Tự động khi bảng khác đang mở (#1044): chỉ còn một bảng; đóng bằng đúng hàm của bảng (hết dual-win, aria-expanded về false).
  await page.keyboard.press("KeyH"); await page.keyboard.press("KeyB");
  await page.waitForFunction(() => !document.getElementById("char").hidden && !document.getElementById("bag").hidden);
  await page.evaluate(() => document.getElementById("audioBtn").click()); await sleep(80);
  res.settingsOverDual = await page.evaluate(() => ({ dual: document.body.classList.contains("dual-win"), tabs: !!document.getElementById("dualTabs") && !document.getElementById("dualTabs").hidden, bagBtn: document.getElementById("bagBtn").getAttribute("aria-expanded") }));
  res.settingsOverDual.open = await open();
  check(res.settingsOverDual.open.join() === "audio" && !res.settingsOverDual.dual && !res.settingsOverDual.tabs && res.settingsOverDual.bagBtn !== "true", `Cài đặt đóng Nhân vật + Túi đúng cách: ${JSON.stringify(res.settingsOverDual)}`);
  await page.keyboard.press("Escape");
  await page.keyboard.press("KeyL"); await page.waitForFunction(() => !document.getElementById("friends").hidden);
  await page.evaluate(() => document.getElementById("autoBtn").click()); await sleep(80);
  res.autoOverFriends = await open();
  check(res.autoOverFriends.join() === "autoPanel", `Tự động đóng Bạn bè: ${JSON.stringify(res.autoOverFriends)}`);
  await page.evaluate(() => document.getElementById("audioBtn").click()); await sleep(80);
  res.settingsOverAuto = await open();
  check(res.settingsOverAuto.join() === "audio", `Cài đặt đóng Tự động: ${JSON.stringify(res.settingsOverAuto)}`);
  await page.keyboard.press("Escape"); await sleep(80);

  // 5. 960×540: hotbar / bảng vẫn chặn bấm xuyên (cùng bài 1).
  await page.setViewportSize({ width: 960, height: 540 }); await sleep(500);
  await page.keyboard.press("KeyB"); await sleep(200);
  const br = await page.evaluate(() => { const r = document.getElementById("bag").getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await page.evaluate(() => { window.__u1n.walk = 0; });
  await page.mouse.click(br.x + br.w - 4, br.y + br.h - 4); await sleep(80);
  res.small = await counts();
  await shot("960x540");
  check(res.small.walk === 0, `960×540 bấm trên Túi không đi: ${JSON.stringify(res.small)}`);

  await writeFile(resolve(out, `${tag}-do.json`), JSON.stringify(res, null, 2));
  console.log(JSON.stringify({ output: out, ...res }, null, 2));
} finally {
  clearTimeout(watchdog);
  await browser?.close();
  killChildren();
}
