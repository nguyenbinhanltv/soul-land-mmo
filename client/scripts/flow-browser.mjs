// Luồng đầu của người chơi mới bằng giao diện thật (#713): landing "/" → "Vào chơi" /choi → đăng nhập (tên chưa có = tạo tài khoản)
// → tạo nhân vật LPC → Lễ thức tỉnh (chọn võ hồn) → vào game (HUD hiện, đi được). Server RAM riêng (GAME_TEST=1).
// Chạy trên bản build (client/dist do server phục vụ, giống prod; thiếu thì tự build, FLOW_BUILD=1 để build lại).
// Kiểm thêm: 17 thẻ võ hồn không chồng nhau (#712), không pageerror / console.error ngoài danh sách cho phép.
// Chạy: npm run test:flow-browser --prefix client. Máy chưa tải Chromium của Playwright thì FLOW_CHANNEL=chrome (dùng Chrome cài sẵn).
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = fileURLToPath(new URL("../../", import.meta.url));
const out = resolve(process.env.FLOW_OUTPUT ?? await mkdtemp(resolve(tmpdir(), "flow-browser-")));
const children = [];
let stopping = false;
let browser, page;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const port = () => new Promise((done, reject) => {
  const s = createServer(); s.on("error", reject); s.listen(0, "127.0.0.1", () => { const n = s.address().port; s.close(() => done(n)); });
});
function start(args, env) {
  const child = spawn(process.execPath, args, { cwd: root, env: { ...process.env, DATABASE_URL: "", REDIS_URL: "", ADMIN_ACCOUNTS: "", ...env }, stdio: ["ignore", "pipe", "pipe"] });
  children.push(child);
  let log = "";
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (d) => { log = (log + d).slice(-12000); });
  child.on("exit", (code) => { if (code && !stopping) console.error(log); });
}
function stopAll() {
  stopping = true;
  for (const c of children) {
    if (c.exitCode !== null || !c.pid) continue;
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(c.pid), "/T", "/F"]); else c.kill("SIGTERM");
  }
}
async function ready(url) {
  for (let i = 0; i < 150; i++) { if (await fetch(url).then((r) => r.ok).catch(() => false)) return; await sleep(200); }
  throw new Error(`Không mở được ${url}`);
}

// Lỗi console được phép: file riêng tư (/private/present.json) không có trong repo, server trả 404 là bình thường.
const ALLOWED = [{ url: /\/private\//, text: /404/ }];
const problems = [];
const step = (s) => console.log(`✓ ${s}`);

try {
  await mkdir(out, { recursive: true });
  // Server chỉ phục vụ client/dist nếu thư mục đã có lúc khởi động: build trước rồi mới bật.
  if (process.env.FLOW_BUILD || !existsSync(resolve(root, "client/dist/choi/index.html"))) {
    const b = spawnSync(process.execPath, ["client/node_modules/vite/bin/vite.js", "build", "client"], { cwd: root, encoding: "utf8" });
    if (b.status !== 0) throw new Error(`Build client lỗi:
${(b.stdout + b.stderr).slice(-3000)}`);
  }
  else console.log("(dùng lại client/dist có sẵn; sửa mã client thì chạy FLOW_BUILD=1)");
  const apiPort = await port(), web = `http://127.0.0.1:${apiPort}`;
  start(["server/node_modules/tsx/dist/cli.mjs", "--tsconfig", "server/tsconfig.json", "server/src/index.ts"], { PORT: String(apiPort), GAME_TEST: "1" });
  await ready(`${web}/health`);

  const launch = { headless: true, args: ["--mute-audio", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] };
  if (process.env.FLOW_CHANNEL) launch.channel = process.env.FLOW_CHANNEL;
  browser = await chromium.launch(launch);
  page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const url = m.location().url ?? "";
    if (ALLOWED.some((a) => a.url.test(url) && a.text.test(m.text()))) return;
    problems.push(`console.error: ${m.text()}${url ? ` (${url})` : ""}`);
  });
  page.setDefaultTimeout(15000);
  const shot = (name) => page.screenshot({ path: resolve(out, `${name}.png`) });

  // 1. Landing → "Vào chơi".
  await page.goto(`${web}/`);
  await page.getByRole("link", { name: "Vào chơi", exact: true }).first().click();
  await page.waitForURL(/\/choi\/?$/);
  step("landing: 'Vào chơi' sang /choi");
  // Mở lại với ?lag=1 chỉ để game phơi `window.__scene` (đọc vị trí); chưa có phiên nên không mất gì.
  await page.goto(`${web}/choi/?lag=1${process.env.C8_UI0 === "1" ? "&ui=0" : ""}`); // C8_UI0=1: chạy giao diện cũ (?ui=0); mặc định ui2 bật (đợt 5a)

  // 2. Tên chưa có → tạo tài khoản bằng mật khẩu.
  const name = `Flow ${Date.now().toString(36).slice(-6)}`;
  await page.locator("#name").fill(name);
  await page.locator("#pass").fill("Flow-test-1!");
  await page.locator("#go").click();
  await page.getByRole("heading", { name: "Tạo nhân vật" }).waitFor();
  step("đăng ký bằng mật khẩu → màn tạo nhân vật");

  // 3. Tạo nhân vật: Tự tạo (LPC) → Ngẫu nhiên → xác nhận.
  await page.locator("#mLpc").click();
  await page.locator("#rnd").click();
  await shot("tao-nhan-vat");
  await page.locator("#ok").click();
  await page.getByRole("heading", { name: "Lễ thức tỉnh" }).waitFor();
  step("tạo nhân vật LPC → Lễ thức tỉnh");

  // 4. Lễ thức tỉnh: mọi thẻ có khung riêng, không chồng nhau, và nhận được chuột thật.
  const cards = page.locator(".vgrid button");
  const n = await cards.count();
  assert.ok(n >= 17, `Lễ thức tỉnh chỉ có ${n} thẻ võ hồn (cần ≥ 17 SSR)`);
  const boxes = [];
  for (let i = 0; i < n; i++) {
    const c = cards.nth(i);
    await c.scrollIntoViewIfNeeded();
    const r = await c.evaluate((el) => {
      const b = el.getBoundingClientRect(), k = document.getElementById("card"), kr = k.getBoundingClientRect(), top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return { id: el.dataset.id, x: b.x - kr.x + k.scrollLeft, y: b.y - kr.y + k.scrollTop, w: b.width, h: b.height, fixed: getComputedStyle(el).position === "fixed", hit: el === top || el.contains(top) };
    });
    assert.ok(r.w > 20 && r.h > 20, `thẻ ${r.id} không có khung (${r.w}×${r.h})`);
    assert.ok(!r.fixed, `thẻ ${r.id} bị position:fixed (trùng lớp .acard thao tác?)`);
    assert.ok(r.hit, `thẻ ${r.id} bị thẻ khác che ở giữa`);
    boxes.push(r);
  }
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const a = boxes[i], b = boxes[j];
    const overlap = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 4 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 4;
    assert.ok(!overlap, `thẻ ${a.id} chồng lên thẻ ${b.id}`);
  }
  await shot("thuc-tinh");
  step(`${n} thẻ võ hồn không chồng nhau`);

  // Click thật (Playwright tự báo lỗi nếu thẻ khác chặn chuột), rồi Thức tỉnh.
  await cards.nth(0).click();
  await page.locator("#aw:not([disabled])").click();
  await page.locator("#go").click();
  step("chọn võ hồn, thức tỉnh, bấm vào game");

  // 5. Vào game: HUD hiện, phòng có mình, đi được.
  await page.locator("#hud:not([hidden])").waitFor({ timeout: 30000 });
  await page.waitForFunction(() => window.__scene?.players?.size > 0, null, { timeout: 30000 });
  const pos = () => page.evaluate(() => { const s = window.__scene, p = s.room.state.players.get(s.me); return { x: p.x, y: p.y }; });
  await page.locator("#guide").waitFor({ state: "visible" }); // thẻ hướng dẫn (M6 #752) hiện trước khi thử đi
  await sleep(500);
  const before = await pos();
  await page.keyboard.down("KeyD");
  await sleep(900);
  await page.keyboard.up("KeyD");
  await sleep(300);
  const after = await pos();
  assert.ok(Math.hypot(after.x - before.x, after.y - before.y) > 8, `giữ phím D mà nhân vật đứng yên (${before.x},${before.y} → ${after.x},${after.y})`);
  await shot("vao-game");
  step("vào game: HUD hiện, nhân vật đi được");

  // 5b. Hướng dẫn lần đầu (M6 #752): hiện ở bước 1, giữ D đã sang bước 2, nút Bỏ qua tắt và ghi nhớ; nút "?" mở lại; tải lại không hiện.
  const guide = page.locator("#guide");
  await guide.waitFor({ state: "visible" });
  assert.match(await guide.locator(".g-head b").textContent(), /bước 2\/4/, "giữ D xong mà hướng dẫn chưa sang bước 2");
  await guide.getByRole("button", { name: "Bỏ qua" }).click();
  await guide.waitFor({ state: "hidden" });
  await page.locator("#guideBtn").click();
  assert.match(await guide.locator(".g-head b").textContent(), /bước 1\/4/, "nút ? không mở lại hướng dẫn từ bước 1");
  await guide.getByRole("button", { name: "Đóng" }).click();
  await guide.waitFor({ state: "hidden" });
  step("hướng dẫn lần đầu: bước theo phím, Bỏ qua, nút ? xem lại");

  // 5a'. Bí Cảnh (#877 P5): hub có thẻ Bí Cảnh; mở ra thấy phụ bản Luyện Hồn Cảnh, lượt n/m, đếm ngược làm mới 05:00 và nút Khiêu Chiến; Esc đóng.
  await page.locator("#hubBtn").click();
  await page.locator('#hub [data-hub="bicanh"]').click();
  const bc = page.locator("#bicanh");
  await bc.locator(".bc-runs").waitFor({ state: "visible" });
  assert.match(await bc.locator(".bc-name").textContent(), /Luyện Hồn Cảnh/);
  assert.match(await bc.locator(".bc-runs").textContent(), /^Lượt \d+\/\d+$/, "thiếu lượt n/m");
  assert.match(await bc.locator(".p2-cd").textContent(), /05:00/, "đếm ngược phải ghi mốc làm mới 05:00");
  assert.equal(await bc.locator(".p2-primary").textContent(), "Khiêu Chiến");
  assert.ok(await bc.locator(".bc-buy").isVisible(), "thiếu nút mua lượt");
  await page.keyboard.press("Escape");
  await bc.waitFor({ state: "hidden" });
  await sleep(300);
  step("Bí Cảnh: hub mở màn danh sách (lượt, đếm ngược 05:00, Khiêu Chiến), Esc đóng");

  // 5b'. #1027: bấm nút HUD đè lên vùng bấm của trận truyền tống (Phaser nghe mousedown cấp window) không được mở bảng Bản đồ thế giới.
  // Bản chập chờn ở CI: nút Đóng của #guide rơi trúng vùng trận tùy máy chạy chậm / nhanh nên bảng #world mở đè lên và chặn chuột.
  const zones = await page.evaluate(() => {
    const s = window.__scene, cam = s.cameras.main, out = [];
    for (const z of s.children.list) if (z.type === "Zone" && z.input?.enabled) out.push({ x: z.x, y: z.y });
    // Dừng camera theo nhân vật, đặt giữa vùng bấm đầu tiên để pixel màn hình của nó biết chắc (zone nằm ở toạ độ thế giới).
    const z0 = out[0]; if (!z0) return 0;
    cam.stopFollow(); cam.centerOn(z0.x, z0.y);
    return out.length;
  });
  assert.ok(zones > 0, "không có vùng bấm (Zone) nào để kiểm");
  await page.evaluate(() => {
    const el = document.getElementById("guideBtn"), r = window.__scene.game.canvas.getBoundingClientRect();
    // Mọi vùng bấm: gửi mousedown giả lên nút HUD tại đúng giữa vùng đó.
    const cam = window.__scene.cameras.main;
    for (const z of window.__scene.children.list) {
      if (z.type !== "Zone" || !z.input?.enabled) continue;
      const gx = (z.x - cam.scrollX - cam.width / 2) * cam.zoom + cam.width / 2, gy = (z.y - cam.scrollY - cam.height / 2) * cam.zoom + cam.height / 2;
      if (gx < 0 || gy < 0 || gx > cam.width || gy > cam.height) continue; // vùng ngoài màn hình thì không có gì để bấm trúng
      const cx = r.left + gx * r.width / cam.width, cy = r.top + gy * r.height / cam.height;
      el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: cx, clientY: cy, button: 0, buttons: 1 }));
      window.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, clientX: cx, clientY: cy, button: 0 }));
    }
  });
  await sleep(200);
  assert.ok(await page.locator("#world").isHidden(), "bấm nút HUD đè lên vùng trận truyền tống làm mở bảng Bản đồ thế giới");
  assert.ok(await page.locator("#npc").isHidden(), "bấm nút HUD đè lên vùng NPC làm mở hộp thoại NPC");
  // Trả camera về theo nhân vật (như GameScene khi dựng người chơi) để bước 5c bấm thật không rơi trúng vùng bấm do ta đặt camera.
  await page.evaluate(() => { const s = window.__scene, v = s.players.get(s.me); if (v) s.cameras.main.startFollow(v.root, true, 0.2, 0.2); });
  await page.waitForFunction(() => { const s = window.__scene, v = s.players.get(s.me), c = s.cameras.main; return !v || (Math.abs(c.midPoint.x - v.root.x) < 3 && Math.abs(c.midPoint.y - v.root.y) < 3); });
  step("bấm nút HUD đè lên vùng trận / NPC không mở bảng");

  // 5c. #990: gõ dở trong ô chat rồi bấm xuống bản đồ: ô chat mất tiêu điểm (chữ dở còn), W đi được và không rơi vào ô chat; Esc vẫn thoát ô.
  const chatState = () => page.evaluate(() => ({ focus: document.activeElement?.id ?? "", value: document.getElementById("chat").value, keyW: !!window.__scene.keys.KeyW }));
  await page.keyboard.press("Enter"); await page.keyboard.type("ab");
  const typed = await chatState();
  assert.ok(typed.focus === "chat" && typed.value === "ab", `Enter không mở ô chat nhận chữ: ${JSON.stringify(typed)}`);
  const vp = page.viewportSize(), ground = await page.evaluate(([w, h]) => { for (const [x, y] of [[w / 2, h * 0.35], [w / 2, h * 0.15], [w * 0.08, h / 2], [w * 0.92, h / 2]]) { if (document.elementFromPoint(x, y) === window.__scene.game.canvas) return [x, y]; } return null; }, [vp.width, vp.height]);
  assert.ok(ground, "không tìm được điểm nền trống để bấm");
  await page.mouse.click(ground[0], ground[1]);
  // #1089: Phaser xếp mousedown vào hàng đợi và chỉ xử lý (bỏ tiêu điểm ô chat) ở khung hình kế; bấm W ngay thì máy chậm sẽ gửi W lúc ô chat còn tiêu điểm
  // (client đúng khi bỏ phím đó). Người chơi thật không bấm nền và W trong cùng một khung: chờ ô chat mất tiêu điểm rồi mới bấm W.
  await page.waitForFunction(() => document.activeElement?.id !== "chat");
  await page.keyboard.down("KeyW"); await sleep(80);
  const clicked = await chatState();
  await page.keyboard.up("KeyW");
  assert.ok(clicked.focus !== "chat" && clicked.value === "ab" && clicked.keyW, `bấm nền: ô chat phải mất tiêu điểm, W đi, chữ dở còn: ${JSON.stringify(clicked)}`);
  await page.evaluate(() => { document.getElementById("chat").value = ""; });
  await page.keyboard.press("Enter"); await page.keyboard.press("Escape");
  assert.notEqual((await chatState()).focus, "chat", "Esc không thoát ô chat");
  step("ô chat: bấm bản đồ bỏ tiêu điểm, W không gõ vào ô, Esc vẫn thoát");

  assert.deepEqual(problems, [], `Có lỗi trình duyệt:\n${problems.join("\n")}`);
  step("không có pageerror / console.error ngoài danh sách cho phép");
  console.log(`Ảnh: ${out}`);
} catch (e) {
  console.error(`✗ ${e.message}`);
  if (problems.length) console.error(`Lỗi trình duyệt đã gặp:\n${problems.join("\n")}`);
  // Ảnh lúc trượt (artifact CI): màn hình thật tại bước lỗi.
  await page?.screenshot({ path: resolve(out, "truot.png"), fullPage: true }).catch(() => {});
  console.error(`Ảnh: ${out}`);
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
  stopAll();
}
