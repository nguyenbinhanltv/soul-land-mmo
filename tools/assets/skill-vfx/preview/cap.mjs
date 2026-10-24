// Quay màn hình trang thử `?thu=fx` bằng Chrome headless (CDP screencast): mỗi việc = một chiêu, hai bản (trước: sv=0 chỉ G3; sau: có sheet).
// Chrome: --mute-audio, GPU thật (d3d11), cổng debug ngẫu nhiên (DevToolsActivePort), thư mục profile tạm; chỉ tắt đúng PID của mình.
//   node cap.mjs --base http://127.0.0.1:5391 --out <thư mục khung> --jobs <jobs.json> [--dur 2400] [--w 640 --h 360]
// jobs.json: [{ "name": "ld_0_sau", "q": "skill=lam_dien_ba_vuong_long:0&sv=1" }, ...]; q nối vào ?thu=fx&bar=0&zoom=1&auto=0...
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (n, d = "") => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const base = opt("--base"), out = path.resolve(opt("--out")), jobs = JSON.parse(readFileSync(opt("--jobs"), "utf8")), DUR = +opt("--dur", "2400"), W = +opt("--w", "640"), H = +opt("--h", "360");
const profile = path.join(out, "_profile"); rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--mute-audio", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", `--window-size=${W},${H}`, "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
const pid = chrome.pid;
const kill = () => { try { execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" }); } catch {} };
process.on("exit", kill); process.on("SIGINT", () => { kill(); process.exit(1); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let port = 0;
for (let i = 0; i < 100 && !port; i++) { await sleep(200); const f = path.join(profile, "DevToolsActivePort"); if (existsSync(f)) port = +readFileSync(f, "utf8").split("\n")[0]; }
if (!port) { kill(); throw new Error("không có cổng debug"); }
let tgt; for (let i = 0; i < 50 && !tgt; i++) { try { tgt = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); } catch {} if (!tgt) await sleep(200); }
const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map(), ev = [];
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method) for (const h of ev) h(d); };
const cdp = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await cdp("Page.enable"); await cdp("Runtime.enable");
ev.push((d) => { if (d.method === "Runtime.exceptionThrown") console.log("[lỗi trang]", (d.params.exceptionDetails.exception?.description ?? JSON.stringify(d.params.exceptionDetails)).slice(0, 400)); if (d.method === "Runtime.consoleAPICalled" && d.params.type === "error") console.log("[console.error]", JSON.stringify(d.params.args.map((a) => a.value ?? a.description)).slice(0, 300)); });
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: false });
const evalJs = async (e) => (await cdp("Runtime.evaluate", { expression: e, returnByValue: true })).result?.result?.value;

for (const j of jobs) {
  const dir = path.join(out, j.name); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  await cdp("Page.navigate", { url: `${base}/?thu=fx&bar=0&zoom=1&cine=${j.cine ?? 0}&${j.q}` });
  for (let i = 0; i < 100; i++) { await sleep(150); if (await evalJs("!!window.__fx")) break; }
  const frames = []; let n = 0, t0 = null;
  const h = async (d) => {
    if (d.method !== "Page.screencastFrame") return;
    const ts = d.params.metadata.timestamp; t0 ??= ts;
    const f = `${String(n).padStart(4, "0")}.png`; writeFileSync(path.join(dir, f), Buffer.from(d.params.data, "base64")); frames.push({ f, ts }); n++;
    await cdp("Page.screencastFrameAck", { sessionId: d.params.sessionId });
  };
  ev.push(h);
  await cdp("Page.startScreencast", { format: "png", everyNthFrame: 3 });
  await sleep(DUR);
  await cdp("Page.stopScreencast"); ev.splice(ev.indexOf(h), 1);
  const fps = await evalJs("window.__fx && window.__fx.fps()");
  const fire = await evalJs("(performance.timeOrigin + window.__t0) / 1000");
  for (const q of frames) q.t = Math.round((q.ts - fire) * 1000); // ms kể từ lúc phát chiêu (âm = trước)
  writeFileSync(path.join(dir, "times.json"), JSON.stringify({ frames, fps, fire }));
  console.log(`[cap] ${j.name}: ${frames.length} khung / ${DUR} ms, fps trang ${Math.round(fps)}`);
}
kill(); ws.close(); await sleep(800); try { rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(0);
