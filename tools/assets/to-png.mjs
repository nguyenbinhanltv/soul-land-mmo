// Đổi ảnh WebP / JPEG (đuôi .png nhưng không phải PNG: Microsoft Copilot, một số dịch vụ khác lưu WebP) sang PNG thật bằng Chrome headless.
//   node tools/assets/to-png.mjs <ảnh-vào> [<ảnh-ra.png>]       (ra mặc định: <tên>.png cạnh ảnh vào, ghi đè nếu đã là .png giả; ảnh gốc giữ ở <tên>.orig)
// Chrome tự giải mã; chụp đúng cỡ gốc 1:1 (tỉ lệ thiết bị 1, tắt tiếng, cổng gỡ lỗi ngẫu nhiên, không đụng cổng của phiên khác).
// Ảnh WebP lossy có nhiễu nén (màu nền #FF00FF lệch vài đơn vị, viền mờ): gemini-import xử lý được nhưng nên đặt --tol lớn hơn và --fringe 6 nếu còn viền hồng.
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const [src, outArg] = process.argv.slice(2);
if (!src) { console.error("Cách dùng: to-png.mjs <ảnh-vào> [<ảnh-ra.png>]"); process.exit(1); }
const head = readFileSync(src).subarray(0, 12);
if (head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) { console.log(`${src} đã là PNG thật, không cần đổi`); process.exit(0); }
const kind = head.subarray(0, 4).toString() === "RIFF" && head.subarray(8, 12).toString() === "WEBP" ? "WebP" : head[0] === 0xff && head[1] === 0xd8 ? "JPEG" : "";
if (!kind) { console.error(`${src}: không phải PNG / WebP / JPEG`); process.exit(1); }
const out = outArg ?? src.replace(/\.[^.]+$/, "") + ".png";
const chromePath = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const tmp = mkdtempSync(path.join(os.tmpdir(), "to-png-"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn(chromePath, ["--headless=new", "--mute-audio", "--remote-debugging-port=0", `--user-data-dir=${tmp}`, "--force-device-scale-factor=1", "--hide-scrollbars", "--allow-file-access-from-files", "--no-first-run", "about:blank"], { stdio: "ignore" });
try {
  let port = 0;
  for (let i = 0; i < 100 && !port; i++) { await sleep(100); const f = path.join(tmp, "DevToolsActivePort"); if (existsSync(f)) port = +readFileSync(f, "utf8").split("\n")[0]; }
  if (!port) throw new Error("Chrome không bật cổng gỡ lỗi");
  const target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let seq = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const cdp = (method, params = {}) => new Promise((res) => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const html = `<!doctype html><body style="margin:0;background:#fff"><img id="i" src="file:///${path.resolve(src).replace(/\\/g, "/")}" style="display:block;image-rendering:pixelated">`;
  const page = path.join(tmp, "p.html"); writeFileSync(page, html);
  await cdp("Page.enable"); await cdp("Page.navigate", { url: "file:///" + page.replace(/\\/g, "/") });
  let w = 0, h = 0;
  for (let i = 0; i < 100 && !w; i++) { await sleep(100); const r = await cdp("Runtime.evaluate", { expression: "(()=>{const i=document.getElementById('i');return i&&i.complete?[i.naturalWidth,i.naturalHeight]:[0,0]})()", returnByValue: true }); [w, h] = r.result?.result?.value ?? [0, 0]; }
  if (!w) throw new Error("Chrome không giải mã được ảnh");
  await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await sleep(200);
  const shot = await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  if (path.resolve(out) === path.resolve(src)) renameSync(src, src.replace(/\.[^.]+$/, "") + ".orig");
  writeFileSync(out, Buffer.from(shot.result.data, "base64"));
  console.log(`[to-png] ${kind} ${w}×${h} → ${out}`);
  ws.close();
} finally { chrome.kill(); await sleep(300); try { rmSync(tmp, { recursive: true, force: true }); } catch {} }
