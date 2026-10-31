// Đo FPS / bộ nhớ trang thử hiệu ứng (`?thu=fx`) bằng Chrome thật qua CDP (H8 #491). Không cần server game: phục vụ `client/dist` qua `vite preview`.
// Chrome luôn `--mute-audio`, cổng gỡ lỗi tự chọn (`--remote-debugging-port=0`, không đụng 9333), tắt đúng PID mình bật.
// Chạy: npm run build --prefix client && node client/scripts/fx-measure.mjs <chế độ> [--base http://127.0.0.1:4491] [--secs 25] [--cpu 4] [--mobile] [--swiftshader]
//   chế độ `fps`: ma trận 40 / 60 người × trước (legacy=1) / sau H8, in bảng markdown;
//   chế độ `all`: tung mọi chiêu hai vòng (`__castAll`), in số texture / pool và lỗi console.
//   chế độ `damage`: 40 người × 60 giây, không/có số nổi, Cao/Thấp/Giảm chuyển động; JSON từng lượt, nghỉ 15 giây, không ép GC.
// Tham số: `--urls "<query1>,<query2>"` để đo query tùy ý (mỗi query một dòng).
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cpus, totalmem, release } from "node:os";

const args = process.argv.slice(2);
const mode = args[0] && !args[0].startsWith("--") ? args[0] : "fps";
const opt = (n, d) => { const i = args.indexOf("--" + n); return i < 0 ? d : args[i + 1]?.startsWith("--") || args[i + 1] === undefined ? true : args[i + 1]; };
const BASE = opt("base", "http://127.0.0.1:4491"), SECS = +opt("secs", 25), CPU = +opt("cpu", 1), MOBILE = !!opt("mobile", false), SOFT = !!opt("swiftshader", false);
const CHROME = process.env.CHROME_BIN || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), "fxm-"));
  const gpu = SOFT ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"];
  const p = spawn(CHROME, ["--headless=new", "--mute-audio", "--enable-precise-memory-info", "--remote-debugging-port=0", `--user-data-dir=${dir}`, "--window-size=1280,720", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", ...gpu, "about:blank"], { stdio: "ignore" });
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
  await c.send("Page.navigate", { url: `${BASE}/choi/?thu=fx&bar=0&zoom=2&${query}` });
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
  if (mode === "damage") {
    if (SOFT || MOBILE || CPU !== 1) throw new Error("Phép đo số nổi cần GPU thật, CPU 1×, màn 1280×720");
    await c.send("Page.addScriptToEvaluateOnNewDocument", { source: `
      window.__glCount={live:0,made:0};
      for(const C of [WebGLRenderingContext,WebGL2RenderingContext]) {
        const create=C.prototype.createTexture, del=C.prototype.deleteTexture, live=new WeakSet();
        C.prototype.createTexture=function(){const t=create.call(this);if(t){live.add(t);__glCount.live++;__glCount.made++;}return t};
        C.prototype.deleteTexture=function(t){if(t&&live.delete(t))__glCount.live--;return del.call(this,t)};
      }
    ` });
    console.log(JSON.stringify({ machine: { cpu: cpus()[0].model, ramGiB: totalmem()/2**30, os: release() }, browser: await c.send("Browser.getVersion"), seconds: 60, restSeconds: 15 }));
    for (const [level, reduce] of [["high", false], ["low", false], ["high", true]]) for (const visible of [false, true]) {
      c.errors.length = 0;
      await c.send("Page.navigate", { url: `${BASE}/choi/?thu=fx&bar=0&zoom=2&stress=40&ct=40&mix=t3&seed=1541&gov=0&lv=${level}&reduce=${+reduce}` });
      let ready = false;
      for (let i=0;i<120;i++) { await sleep(250); if(await c.ev("!!window.__damage").catch(()=>false)){ready=true;break;} }
      if(!ready) throw new Error("Trang đo chưa sẵn sàng");
      await c.ev("document.fonts.ready", true); await sleep(5000);
      const gpu = await c.ev(`(()=>{const gl=document.querySelector('canvas').getContext('webgl2')||document.querySelector('canvas').getContext('webgl');const e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)})()`);
      if (!gpu || /swiftshader|llvmpipe|software/i.test(gpu)) throw new Error("Không có GPU thật: " + gpu);
      await c.send("HeapProfiler.startSampling", { samplingInterval:32768, includeObjectsCollectedByMajorGC:true, includeObjectsCollectedByMinorGC:true });
      await c.ev(`(()=>{
        const a=window.__dm={frames:[],long:[],samples:[],heap0:performance.memory.usedJSHeapSize,gl0:{...__glCount},start:performance.now(),done:false};
        a.observer=new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.startTime>=a.start)a.long.push(e.duration)});a.observer.observe({type:'longtask'});
        let last=performance.now(),sample=last;
        const frame=t=>{a.frames.push(t-last);last=t;if(t-sample>=250){a.samples.push({...__damage.stats(),...__glCount,heap:performance.memory.usedJSHeapSize});sample=t;}if(!a.done)requestAnimationFrame(frame)};
        __damage.start(${visible});requestAnimationFrame(frame);
      })()`);
      await sleep(60000);
      const result = await c.ev(`(()=>{const a=__dm;a.done=true;a.observer.disconnect();const stats=__damage.stats();__damage.stop();const f=a.frames.slice(5).sort((a,b)=>a-b);return {seconds:(performance.now()-a.start)/1000,fps:1000*f.length/f.reduce((a,b)=>a+b,0),p1:1000/f[Math.floor(f.length*.99)],longtasks:a.long.length,longtaskMs:a.long.reduce((a,b)=>a+b,0),...stats,textPeak:Math.max(...a.samples.map(s=>s.texts)),glStart:a.gl0.live,glPeak:Math.max(...a.samples.map(s=>s.live)),glEnd:__glCount.live,glCreated:__glCount.made-a.gl0.made,heapStart:a.heap0,heapEnd:performance.memory.usedJSHeapSize,heapPeak:Math.max(...a.samples.map(s=>s.heap))}})()`);
      const sampled = await c.send("HeapProfiler.stopSampling");
      if(sampled.error) throw new Error(JSON.stringify(sampled.error));
      result.sampledAllocatedBytes = sampled.result.profile.samples.reduce((sum,s)=>sum+s.size,0);
      await sleep(15000);
      const rest = await c.ev("({...__damage.stats(),gl:__glCount.live,heap:performance.memory.usedJSHeapSize})");
      console.log(JSON.stringify({ level, reduce, visible, gpu, ...result, rest, errors:[...c.errors] }));
      if(c.errors.length || rest.texts || result.offered < 4700 || result.offered > 4900) throw new Error("Lượt đo không hợp lệ");
    }
  } else if (mode === "all") {
    await c.send("Emulation.setCPUThrottlingRate", { rate: CPU });
    await c.send("Page.navigate", { url: `${BASE}/choi/?thu=fx&bar=0&pt=1&cine=0&lv=${lvArg}${opt("reduce", false) ? "&reduce=1" : ""}` });
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
