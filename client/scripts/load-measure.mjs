// Đo tải asset khi vào / đổi bản đồ bằng Chrome thật qua CDP (#716): số request và byte theo loại, nguồn (mạng / cache), thời gian tới khi
// scene bản đồ sẵn sàng (create() chạy xong phần dựng ô). Cần server GAME_TEST=1 đang chạy (phục vụ cả client/dist): bật bằng
//   env -u DATABASE_URL GAME_TEST=1 PORT=3716 npx tsx server/src/index.ts   (sau `npm run build`)
// Chạy: node client/scripts/load-measure.mjs [--base http://127.0.0.1:3716] [--maps a,b,c] [--json] [--samples] [--shot ảnh.png]
// (--samples: in một URL mẫu mỗi nhóm; --shot: chụp màn hình sau lượt vào game nóng; biến môi trường QS="&query" thêm query vào địa chỉ trang)
// Chrome luôn `--mute-audio`, cổng gỡ lỗi tự chọn (`--remote-debugging-port=0`, không đụng 9333), tắt đúng PID mình bật.
// Mỗi bản đồ đo hai lượt trong CÙNG một hồ sơ Chrome: "lạnh" (lần đầu thấy bản đồ này, cache có thể đã có đồ dùng chung) và "nóng" (lần sau).
// --ram N: thay cho các lượt trên, warp N lần xoay vòng qua --maps rồi in bộ nhớ client sau mỗi lần (số key / số khung hình texture, MB điểm ảnh
// ước tính w×h×4, heap JS) để thấy texture của bản đồ đã ghé có tăng không trần không (#716 bước 5 / 6).
// --latency MS: thêm độ trễ mạng mỗi request (CDP Network.emulateNetworkConditions, băng thông không giới hạn) để thấy lợi của việc giảm số file.
// --verify-atlas: warp qua --maps rồi so từng điểm ảnh texture `iso:*` / `prop_*` (cả `_n`) với file gốc (atlas cắt lại phải giống hệt, #716 bước 6).
// Thêm một lượt "tải lại trang" (vào game từ đầu, cache nóng) để thấy chi phí mở phiên.
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf("--" + n); return i < 0 ? d : args[i + 1]?.startsWith("--") || args[i + 1] === undefined ? true : args[i + 1]; };
const BASE = String(opt("base", "http://127.0.0.1:3716")), JSON_OUT = !!opt("json", false), SAMPLES = !!opt("samples", false), SHOT = opt("shot", ""), RAM = +opt("ram", 0) || 0, LATENCY = +opt("latency", 0) || 0, VERIFY = !!opt("verify-atlas", false);
const MAPS = String(opt("maps", "nac_dinh_thanh,tinh_dau_ngoai_vi,thien_dau_thanh,loi_tinh_dau")).split(",");
const CHROME = process.env.CHROME_BIN || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Nhóm theo đường dẫn: 2 đoạn đầu (vd `sprites/iso`), riêng `sprites/<tiền tố key>_*` tách theo tiền tố tên file (beast, vh, fx…). */
function kind(u) {
  const p = new URL(u).pathname.replace(/^\/choi\//, "/").replace(/^\//, "");
  const seg = p.split("/");
  if (seg[0] === "sprites" && seg.length === 2) return "sprites/" + (seg[1].match(/^([a-z]+)_/)?.[1] ?? seg[1].replace(/\..*/, ""));
  if (seg[0] === "assets") return "assets (js/css/font)";
  if (seg.length === 1) return /\.json$/.test(p) ? "json bản đồ / manifest" : /\.png$/.test(p) ? "png gốc" : seg[0];
  return seg.slice(0, 2).join("/");
}

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), "ldm-"));
  const gpu = ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"];
  const p = spawn(CHROME, ["--headless=new", "--mute-audio", "--enable-precise-memory-info", "--remote-debugging-port=0", `--user-data-dir=${dir}`, "--window-size=1280,720", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", ...gpu, "about:blank"], { stdio: "ignore" });
  let port = 0;
  for (let i = 0; i < 100 && !port; i++) { await sleep(150); const f = join(dir, "DevToolsActivePort"); if (existsSync(f)) port = +readFileSync(f, "utf8").split("\n")[0]; }
  if (!port) { p.kill(); throw new Error("Chrome không bật được"); }
  const tgt = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
  const ws = new WebSocket(tgt.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const wait = new Map(), reqs = new Map(), errors = []; // requestId → { url, cached, bytes, status }
  let rec = null; // bộ ghi đang bật: mảng các request hoàn tất
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); return; }
    const pm = d.params;
    if (d.method === "Runtime.exceptionThrown") errors.push(pm.exceptionDetails.exception?.description ?? pm.exceptionDetails.text);
    else if (d.method === "Runtime.consoleAPICalled" && pm.type === "error") errors.push(pm.args.map((a) => a.value ?? a.description).join(" "));
    if (d.method === "Network.requestWillBeSent") reqs.set(pm.requestId, { url: pm.request.url, t0: pm.timestamp, wall: pm.wallTime * 1000, cached: false, bytes: 0, status: 0 });
    else if (d.method === "Network.responseReceived") { const r = reqs.get(pm.requestId); if (r) { r.status = pm.response.status; r.cached = !!pm.response.fromDiskCache || !!pm.response.fromMemoryCache; } }
    else if (d.method === "Network.requestServedFromCache") { const r = reqs.get(pm.requestId); if (r) r.cached = true; }
    else if (d.method === "Network.loadingFinished") { const r = reqs.get(pm.requestId); if (r) { r.bytes = pm.encodedDataLength; r.t1 = pm.timestamp; if (rec) rec.push(r); } }
    else if (d.method === "Network.loadingFailed") { const r = reqs.get(pm.requestId); if (r) { r.failed = true; if (rec) rec.push(r); } }
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Runtime.enable"); await send("Page.enable"); await send("Network.enable");
  if (LATENCY) await send("Network.emulateNetworkConditions", { offline: false, latency: LATENCY, downloadThroughput: -1, uploadThroughput: -1 });
  const ev = async (expr, await_ = false) => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: await_ }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails)); return r.result?.result?.value; };
  const record = (on) => { if (on) rec = []; else { const r = rec; rec = null; return r; } };
  const close = () => { try { ws.close(); } catch { /* đã đóng */ } try { execFileSync("taskkill", ["/PID", String(p.pid), "/T", "/F"], { stdio: "ignore" }); } catch { /* đã tắt */ } try { rmSync(dir, { recursive: true, force: true }); } catch { /* Chrome còn giữ file */ } };
  return { send, ev, record, close, errors };
}

const post = async (path, body) => (await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();

/** Tổng hợp một lượt: tổng request / mạng / cache / byte và bảng theo loại. */
function summarize(list, t0, ms) {
  // Mốc: nối phòng mới (matchmake) → request file cuối xong → sẵn sàng; hiệu = thời gian dựng (giải mã + create()).
  const mm = list.find((r) => /matchmake\//.test(r.url)), files = list.filter((r) => r.t1 && r.wall <= t0 + ms && !/^(blob|data):/.test(r.url) && /\.(png|json|ogg|m4a)/.test(r.url));
  const lastFile = Math.max(0, ...files.map((r) => r.wall + (r.t1 - r.t0) * 1000));
  const marks = mm && lastFile ? { joinMs: Math.round(mm.wall - t0), loadMs: Math.round(lastFile - mm.wall), buildMs: Math.round(t0 + ms - lastFile) } : null;
  const local = list.filter((r) => /^(blob|data):/.test(r.url)).length; // Phaser tải ảnh qua XHR → blob: (không phải request mạng)
  list = list.filter((r) => !/^(blob|data):/.test(r.url));
  const by = new Map();
  for (const r of list) {
    const k = kind(r.url), s = by.get(k) ?? { n: 0, net: 0, bytes: 0, ex: r.url.slice(0, 120) };
    s.n++; if (!r.cached) s.net++; s.bytes += r.cached ? 0 : r.bytes; by.set(k, s);
  }
  const tot = { n: list.length, net: list.filter((r) => !r.cached).length, kb: Math.round(list.reduce((a, r) => a + (r.cached ? 0 : r.bytes), 0) / 1024) };
  return { marks, tot: { ...tot, local }, by: [...by].sort((a, b) => b[1].n - a[1].n).map(([k, s]) => ({ kind: k, n: s.n, net: s.net, kb: Math.round(s.bytes / 1024), ex: s.ex })) };
}

const c = await launch();
const out = [];
try {
  const name = "ldm" + Date.now().toString(36).slice(-6);
  const login = await post("/api/login", { name, password: crypto.randomUUID().slice(0, 12) });
  await post("/api/looks", { token: login.token, sex: 0, hair: 0, hairCol: 0, outfitCol: 0, skin: 0, mode: "preset" });
  await post("/api/awaken", { token: login.token, vohon: "lam_dien_ba_vuong_long" });
  await c.send("Page.navigate", { url: `${BASE}/choi/` });
  await sleep(1500);
  await c.ev(`localStorage.setItem("shh-token", ${JSON.stringify(login.token)}); localStorage.setItem("shh-name", ${JSON.stringify(name)})`);
  const ready = (map) => `(()=>{const s=window.__scene;return !!(s&&s.isoMap&&s.room?.state?.mapId==="${map}"&&s.sys?.isActive())})()`;
  const wait = async (map, t0) => { for (let i = 0; i < 1200; i++) { if (await c.ev(ready(map)).catch(() => false)) return Date.now() - t0; await sleep(20); } return -1; };
  const idle = async () => { await sleep(1500); }; // gom nốt request nền (nhạc, ảnh giao diện tải sau)

  // Bộ nhớ client: số texture, MB điểm ảnh (w×h×4 của ảnh nguồn, gồm normal map), heap JS (Chrome có --enable-precise-memory-info).
  const memExpr = `(()=>{const g=window.__scene.game,t=g.textures,by={};let px=0,n=0;for(const k of t.getTextureKeys()){const tx=t.get(k);let b=0;for(const s of tx.source){b+=s.width*s.height*4;n++}for(const d of tx.dataSource){b+=d.width*d.height*4}px+=b;const g2=k.match(/^[a-zA-Z]+/)?.[0]??k;by[g2]=by[g2]||[0,0];by[g2][0]++;by[g2][1]+=b}return {keys:t.getTextureKeys().length,srcs:n,by:Object.entries(by).map(([k,v])=>k+":"+v[0]+"/"+Math.round(v[1]/1048576)+"MB").sort((a,b)=>parseInt(b.split("/")[1])-parseInt(a.split("/")[1])).slice(0,10).join(" "),pxMB:Math.round(px/1048576),heapMB:Math.round(performance.memory.usedJSHeapSize/1048576)}})()`;
  if (VERIFY) {
    c.record(true);
    await c.send("Page.navigate", { url: `${BASE}/choi/?nopredict${process.env.QS ?? ""}` });
    for (let i = 0; i < 1200; i++) { if (await c.ev(`!!document.getElementById("go")`).catch(() => false)) break; await sleep(50); }
    await c.ev(`document.getElementById("go").click()`);
    await wait("thanh_hon_thon", Date.now()); await idle();
    const cmp = `(async()=>{const t=window.__scene.game.textures,res={n:0,bad:[]};const px=(im)=>{const cv=document.createElement("canvas");cv.width=im.width;cv.height=im.height;const x=cv.getContext("2d",{willReadFrequently:true});x.drawImage(im,0,0);return x.getImageData(0,0,cv.width,cv.height).data};
      for(const k of t.getTextureKeys()){const m=k.match(/^(iso:.+?|prop_.+?)(_n)?$/);if(!m||k.includes("~")||!(k.startsWith("iso:")||k.startsWith("prop_")))continue;const base=m[1],n=m[2]?"_n":"";const url=base.startsWith("iso:")?"iso/"+base.slice(4).replace(/\.png$/,"")+n+".png":"sprites/iso/props/"+base.slice(5)+n+".png";
        const o=new Image();o.src=url+"?v=cmp";try{await o.decode()}catch{res.bad.push(k+" (không tải được gốc)");continue}
        const a=px(t.get(k).getSourceImage()),b=px(o);res.n++;let diff=0;if(a.length!==b.length)diff=-1;else for(let i=0;i<a.length;i+=4){if(a[i+3]!==b[i+3]||(a[i+3]&&(Math.abs(a[i]-b[i])>1||Math.abs(a[i+1]-b[i+1])>1||Math.abs(a[i+2]-b[i+2])>1)))diff++}
        if(diff)res.bad.push(k+" diff="+diff)}
      return res})()`;
    let tot = 0, bad = [];
    for (const map of ["thanh_hon_thon", ...MAPS]) {
      if (map !== "thanh_hon_thon") { await c.ev(`window.__scene.room.send("test", { op: "warp", mapId: "${map}", x: 0, y: 0 })`); await wait(map, Date.now()); await idle(); }
      const r = await c.ev(cmp, true); tot += r.n; bad.push(...r.bad.map((b) => map + ": " + b));
      console.log(`${map}: so ${r.n} texture ô / vật, lệch ${r.bad.length}`);
    }
    console.log(`Tổng so ${tot}, lệch ${bad.length}` + (bad.length ? "\n" + bad.slice(0, 20).join("\n") : ""));
  }
  if (RAM) {
    c.record(true);
    await c.send("Page.navigate", { url: `${BASE}/choi/?nopredict${process.env.QS ?? ""}` });
    for (let i = 0; i < 1200; i++) { if (await c.ev(`!!document.getElementById("go")`).catch(() => false)) break; await sleep(50); }
    await c.ev(`document.getElementById("go").click()`);
    await wait("thanh_hon_thon", Date.now()); await idle();
    console.log("| # | Bản đồ | Sẵn sàng (ms) | key | nguồn | MB điểm ảnh | heap JS MB |\n|---|---|---|---|---|---|---|");
    const m0 = await c.ev(memExpr); console.log(`| 0 | thanh_hon_thon | - | ${m0.keys} | ${m0.srcs} | ${m0.pxMB} | ${m0.heapMB} |`);
    for (let i = 1; i <= RAM; i++) {
      const map = MAPS[(i - 1) % MAPS.length], t0 = Date.now();
      await c.ev(`window.__scene.room.send("test", { op: "warp", mapId: "${map}", x: 0, y: 0 })`);
      const ms = await wait(map, t0); await idle();
      const m = await c.ev(memExpr); console.log(`| ${i} | ${map} | ${ms} | ${m.keys} | ${m.srcs} | ${m.pxMB} | ${m.heapMB} |`);
    }
    console.log("\nNhóm texture (số key / MB) lúc cuối: " + (await c.ev(memExpr)).by);
    c.record(false);
    throw new Error("__ram_done");
  }
  // Lượt "vào game từ đầu": lần 1 hồ sơ trống (lạnh thật), lần 2 tải lại (nóng).
  for (const label of ["vào game, hồ sơ trống (lạnh)", "vào game, tải lại trang (nóng)"]) {
    c.record(true);
    const t0 = Date.now();
    await c.send("Page.navigate", { url: `${BASE}/choi/?nopredict${process.env.QS ?? ""}` });
    for (let i = 0; i < 1200; i++) { if (await c.ev(`!!document.getElementById("go")`).catch(() => false)) break; await sleep(50); }
    const tLogin = Date.now() - t0; if (!(await c.ev(`!!document.getElementById("go")`))) throw new Error("không thấy nút #go: " + await c.ev("document.body.innerText.slice(0,300)"));
    await c.ev(`document.getElementById("go").click()`);
    const map = "thanh_hon_thon";
    const ms = await wait(map, t0);
    await idle();
    if (SHOT && label.includes("nóng")) { const r = await c.send("Page.captureScreenshot", { format: "png" }); writeFileSync(String(SHOT), Buffer.from(r.result.data, "base64")); }
    out.push({ label, map, readyMs: ms, loginCardMs: tLogin, ...summarize(c.record(false), t0, ms) });
  }
  // Đi từng bản đồ bằng hook warp; lượt 1 = lần đầu thấy, lượt 2 = lần sau (cache nóng).
  for (const round of ["lần đầu", "lần sau (nóng)"]) {
    for (const map of MAPS) {
      c.record(true);
      const t0 = Date.now();
      await c.ev(`window.__scene.room.send("test", { op: "warp", mapId: "${map}", x: 0, y: 0 })`);
      const ms = await wait(map, t0);
      await idle();
      out.push({ label: `warp ${round}`, map, readyMs: ms, ...summarize(c.record(false), t0, ms) });
    }
  }
} catch (e) { if (e.message !== "__ram_done") throw e; } finally { c.close(); }
if (c.errors.length) console.log(`LỖI trang (${c.errors.length}):\n` + [...new Set(c.errors)].slice(0, 8).join("\n"));
if (RAM || VERIFY) process.exit(c.errors.length ? 1 : 0);
if (JSON_OUT) console.log(JSON.stringify(out, null, 1));
else {
  console.log("| Ca | Bản đồ | Sẵn sàng (ms) | nối phòng / tải file / dựng (ms) | Request | Qua mạng | KB mạng | blob cục bộ |\n|---|---|---|---|---|---|---|---|");
  for (const o of out) console.log(`| ${o.label} | ${o.map} | ${o.readyMs} | ${o.marks ? `${o.marks.joinMs} / ${o.marks.loadMs} / ${o.marks.buildMs}` : "-"} | ${o.tot.n} | ${o.tot.net} | ${o.tot.kb} | ${o.tot.local} |`);
  console.log("\nTheo loại (request / qua mạng / KB mạng):");
  for (const o of out) console.log(`\n### ${o.label} · ${o.map}\n` + o.by.slice(0, 12).map((b) => `- ${b.kind}: ${b.n} / ${b.net} / ${b.kb}${SAMPLES ? "  ← " + b.ex : ""}`).join("\n"));
}
