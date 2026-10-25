// Đo FPS / bộ nhớ trang thử hiệu ứng (`?thu=fx`) bằng Chrome thật qua CDP (H8 #491). Không cần server game: phục vụ `client/dist` qua `vite preview`.
// Chrome luôn `--mute-audio`, cổng gỡ lỗi tự chọn (`--remote-debugging-port=0`, không đụng 9333), tắt đúng PID mình bật.
// Chạy: npm run build --prefix client && node client/scripts/fx-measure.mjs <chế độ> [--base http://127.0.0.1:4491] [--secs 25] [--cpu 4] [--mobile] [--swiftshader]
//   chế độ `fps`: ma trận 40 / 60 người × trước (legacy=1) / sau H8, in bảng markdown;
//   chế độ `all`: tung mọi chiêu hai vòng (`__castAll`), in số texture / pool và lỗi console.
// Tham số: `--urls "<query1>,<query2>"` để đo query tùy ý (mỗi query một dòng).
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const mode = args[0] && !args[0].startsWith("--") ? args[0] : "fps";
const opt = (n, d) => { const i = args.indexOf("--" + n); return i < 0 ? d : args[i + 1]?.startsWith("--") || args[i + 1] === undefined ? true : args[i + 1]; };
const BASE = opt("base", "http://127.0.0.1:4491"), SECS = +opt("secs", 25), CPU = +opt("cpu", 1), MOBILE = !!opt("mobile", false), SOFT = !!opt("swiftshader", false);
const CHROME = process.env.CHROME_BIN || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), "fxm-"));
  const gpu = SOFT ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"];
  const p = spawn(CHROME, ["--headless=new", "--mute-audio", "--remote-debugging-port=0", `--user-data-dir=${dir}`, "--window-size=1280,720", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", ...gpu, "about:blank"], { stdio: "ignore" });
  let port = 0;
  for (let i = 0; i < 100 && !port; i++) { await sleep(150); const f = join(dir, "DevToolsActivePort"); if (existsSync(f)) port = +readFileSync(f, "utf8").split("\n")[0]; }
  if (!port) { p.kill(); throw new Error("Chrome không bật được"); }
  const tgt = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const wait = new Map(), errors = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); }
    else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text);
    else if (d.method === "Runtime.consoleAPICalled" && (d.params.type === "error" || d.params.type === "warning")) errors.push(`${d.params.type}: ` + d.params.args.map((a) => a.value ?? a.description).join(" "));
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Runtime.enable"); await send("Page.enable");
  const ev = async (expr, await_ = false) => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: await_ }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails)); return r.result?.result?.value; };
  const close = () => { try { ws.close(); } catch { /* đã đóng */ } try { execFileSync("taskkill", ["/PID", String(p.pid), "/T", "/F"], { stdio: "ignore" }); } catch { /* đã tắt */ } try { rmSync(dir, { recursive: true, force: true }); } catch { /* Chrome còn giữ file */ } };
  return { send, ev, close, errors };
}

/** Một lượt đo: mở trang, chờ 5 s, lấy mẫu `SECS` giây bằng rAF trong trang (không dùng actualFps làm trơn). */
async function run(c, query) {
  c.errors.length = 0;
  if (MOBILE) { await c.send("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true }); await c.send("Emulation.setTouchEmulationEnabled", { enabled: true }); }
  await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
  await c.send("Page.navigate", { url: `${BASE}/?thu=fx&bar=0&zoom=2&${query}` });
  for (let i = 0; i < 80; i++) { await sleep(250); if (await c.ev("!!window.__fx").catch(() => false)) break; }
  await sleep(5000);
  await c.ev(`(()=>{window.__ft=[];let l=performance.now();const f=t=>{window.__ft.push(t-l);l=t;if(!window.__stop)requestAnimationFrame(f)};window.__stop=false;requestAnimationFrame(f)})()`);
  const lv = [], t0 = Date.now();
  while (Date.now() - t0 < SECS * 1000) { await sleep(1000); lv.push(await c.ev("__fx.level()")); }
  const r = await c.ev(`(()=>{window.__stop=true;const a=window.__ft.slice(5).sort((x,y)=>x-y),n=a.length,s=a.reduce((x,y)=>x+y,0);return{fps:1000*n/s,p1:1000/a[Math.min(n-1,Math.floor(n*0.99))],worst:1000/a[n-1],level:__fx.level(),cap:__fx.cap(),sheets:__fx.sheets(),sprites:__fx.sprites(),parts:__fx.parts(),pooled:__fx.pooled(),ptPool:__fx.ptPooled(),ptActive:__fx.ptActive(),tex:__fx.tex(),heap:performance.memory?.usedJSHeapSize}})()`);
  r.levels = [...new Set(lv)].join(">"); r.errors = [...c.errors];
  return r;
}

const fmt = (r) => `${r.fps.toFixed(0)} | ${r.p1.toFixed(0)} | ${r.levels} | ${r.sheets}/${r.pooled} | ${r.parts} | ${r.ptActive}`;
const c = await launch();
try {
  const lvArg = opt("lv", "high");
  if (mode === "all") {
    await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await c.send("Page.navigate", { url: `${BASE}/?thu=fx&bar=0&pt=1&cine=0&lv=${lvArg}${opt("reduce", false) ? "&reduce=1" : ""}` });
    for (let i = 0; i < 120; i++) { await sleep(250); if (await c.ev("!!window.__castAll && !!window.__fx").catch(() => false)) break; }
    await sleep(3000);
    await c.send("HeapProfiler.collectGarbage"); const heap0 = await c.ev("performance.memory?.usedJSHeapSize");
    const r = await c.ev("__castAll(240)", true);
    await c.send("HeapProfiler.collectGarbage"); await sleep(500);
    const heap1 = await c.ev("performance.memory?.usedJSHeapSize");
    console.log(JSON.stringify({ ...r, heap0, heap1, heapGrowMB: +((heap1 - heap0) / 1048576).toFixed(1), errors: c.errors }));
    process.exitCode = r.grew || c.errors.length ? 1 : 0;
  } else {
    const custom = opt("urls", "");
    const plan = custom ? String(custom).split(",").map((q) => [q, q]) : [];
    if (!custom) for (const P of [40, 60]) for (const legacy of [1, 0]) plan.push([`${P} người, ${legacy ? "TRƯỚC (legacy)" : "SAU H8"}`, `stress=${P}&mix=t3&ct=${P}&lv=${lvArg}&legacy=${legacy}`]);
    console.log(`| Ca | FPS tb | FPS p1 | mức hiệu ứng (theo thời gian) | sheet đang chạy / pool | hạt | pháp tướng |\n|---|---|---|---|---|---|---|`);
    for (const [name, q] of plan) { const r = await run(c, q); console.log(`| ${name} | ${fmt(r)} |${r.errors.length ? " LỖI: " + r.errors.slice(0, 2).join(" ; ") : ""}`); }
  }
} finally { c.close(); }
