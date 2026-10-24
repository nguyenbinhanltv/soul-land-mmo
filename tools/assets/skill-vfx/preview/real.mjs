// Quay cảnh đánh quái THẬT trong game (server GAME_TEST=1, MemoryStore, client/dist) bằng Chrome headless qua CDP; --mute-audio.
// Dùng: node real.mjs <serverUrl> <thư mục khung> <chrome profile> <tag: sau|truoc> <jobs.json>
// jobs: [{ name, vohon?:"lam_dien_ba_vuong_long", slots:[ring0..ring3], cast: 0..3 | "ct", beasts:[{dx,dy}], dur }]
import { spawn, execFileSync } from "node:child_process";
import { readFileSync, existsSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";

const [SERVER, OUT, PROFILE, TAG, JOBS] = process.argv.slice(2);
const jobs = JSON.parse(readFileSync(JOBS, "utf8"));
mkdirSync(OUT, { recursive: true }); try { rmSync(PROFILE, { recursive: true, force: true }); } catch {} mkdirSync(PROFILE, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = async (p, b) => { const r = await fetch(SERVER + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); return { status: r.status, ...(await r.json()) }; };
const name = "Thử " + Math.random().toString(36).slice(2, 6), password = "shot-548-pass";
const l = await post("/api/login", { name, password });
if (!l.token) throw new Error("login: " + JSON.stringify(l));
await post("/api/looks", { token: l.token, sex: 0, hair: 1, hairCol: 1, outfitCol: 2 });
await post("/api/awaken", { token: l.token, vohon: "lam_dien_ba_vuong_long" });

const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--mute-audio", "--remote-debugging-port=0", `--user-data-dir=${PROFILE}`,
  "--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--window-size=960,540", "--no-first-run", "about:blank"], { stdio: "ignore" });
const kill = () => { try { execFileSync("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} };
process.on("exit", kill);
let port = 0;
for (let i = 0; i < 100 && !port; i++) { await sleep(200); const f = path.join(PROFILE, "DevToolsActivePort"); if (existsSync(f)) port = +readFileSync(f, "utf8").split("\n")[0]; }
if (!port) throw new Error("không thấy DevToolsActivePort");
const tg = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
const ws = new WebSocket(tg.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pend = new Map(), ev2 = [];
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } else if (m.method) for (const h of ev2) h(m); });
const cdp = (method, params = {}) => new Promise((res) => { const id = ++seq; pend.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) => { const r = await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
const until = async (expr, ms = 10000, what = expr) => { for (let t = 0; t < ms; t += 150) { if (await ev(expr).catch(() => false)) return true; await sleep(150); } throw new Error("hết giờ chờ: " + what); };
const hook = async (op, extra = {}) => { await ev(`window.__scene.room.send("test", ${JSON.stringify({ op, ...extra })}), true`); await sleep(260); };
const send = async (type, msg = {}) => { await ev(`window.__scene.room.send(${JSON.stringify(type)}, ${JSON.stringify(msg)}), true`); };
const shot = async (f) => { const r = await cdp("Page.captureScreenshot", { format: "png" }); writeFileSync(f, Buffer.from(r.result.data, "base64")); };
const errs = [];
ev2.push((d) => { if (d.method === "Runtime.exceptionThrown") errs.push(JSON.stringify(d.params.exceptionDetails).slice(0, 300)); });

try {
  await cdp("Page.enable"); await cdp("Runtime.enable");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
  const url = SERVER + `/?nopredict&gio=12:00&light=0&lag=1${TAG === "truoc" ? "&sv=0" : ""}`;
  await cdp("Page.navigate", { url }); await sleep(800);
  await ev(`localStorage.setItem("shh-token", ${JSON.stringify(l.token)}), localStorage.setItem("soul-land-fx-v1", ${JSON.stringify(JSON.stringify({ level: "high", reduce: false, shake: "boss", cine: true, cutin: true, halo: "halo" }))}), true`);
  await cdp("Page.navigate", { url });
  await until(`!!document.getElementById("go")`, 20000); await ev(`document.getElementById("go").click(), true`);
  await until(`!!window.__scene?.room?.state?.players?.size`, 20000);
  await sleep(2000);
  const owned = JSON.parse(await ev(`JSON.stringify(window.__scene.owned)`)); const rowId = owned.active;
  await hook("set", { rowId, level: 70, stars: 3, rings: [10, 100, 1000, 10000, 100000, 100000, 100000, 100000, 100000, 100000] });
  await hook("warp", { mapId: "lac_nhat_sam_lam" });
  await until(`window.__scene?.room?.state?.mapId === "lac_nhat_sam_lam"`, 20000); await sleep(2500);
  const me = await ev(`(()=>{const p=window.__scene.room.state.players.get(window.__scene.room.sessionId); return JSON.stringify({x:p.x,y:p.y,hp:p.hp,mp:p.mp,maxMp:p.maxMp,map:window.__scene.room.state.mapId})})()`);
  console.log("người chơi", me);
  await shot(path.join(OUT, `probe_${TAG}.png`));
  if (process.env.GOTO) { const [gx, gy] = process.env.GOTO.split(",").map(Number); await hook("goto", { x: gx, y: gy }); await sleep(800); console.log("đứng", await ev(`(()=>{const p=window.__scene.room.state.players.get(window.__scene.room.sessionId);return p.x+","+p.y})()`)); }
  const RINGS = [10, 100, 1000, 10000, 100000, 100000, 100000, 100000, 100000, 100000];
  const rows = { lam_dien_ba_vuong_long: rowId };
  let curId = "lam_dien_ba_vuong_long", curRow = rowId;
  const ensure = async (id) => {
    if (rows[id] === undefined) {
      await hook("grant", { vohon: id }); await sleep(900);
      const ow = JSON.parse(await ev(`JSON.stringify(window.__scene.owned)`));
      const row = ow.list.find((r) => r.vohon === id)?.rowId; if (row === undefined) throw new Error("không thấy hàng " + id);
      await hook("set", { rowId: row, level: 70, stars: 3, rings: RINGS }); rows[id] = row;
    }
    return rows[id];
  };
  const useVohon = async (id) => {
    if (id === curId) return; const row = await ensure(id);
    await send("team", { slots: [row, 0, 0, 0] }); await sleep(900); curId = id; curRow = row;
  };
  for (const j of jobs) {
    if (j.vohon) await useVohon(j.vohon);
    if (j.tc) { // tiên cơ: đang ra trận là võ hồn kia, đủ năng lượng rồi đổi sang võ hồn của chiêu (swCd 3 giây)
      const other = j.vohon === "lam_dien_ba_vuong_long" ? "hao_thien_chuy" : "lam_dien_ba_vuong_long";
      await hook("clear"); await hook("rest", { s: 600 });
      await useVohon(other); const mine = await ensure(j.vohon); await sleep(3500);
      await send("team", { slots: [rows[other], mine, 0, 0] }); await sleep(900);
      console.log("đội", await ev("JSON.stringify([window.__scene.owned.active, window.__scene.owned.team])"), "cần", rows[other], mine);
      await hook("clear"); await hook("rest", { s: 600 }); await hook("energy", { v: 100 }); await sleep(3500);
    }
    await hook("clear"); await hook("rest", { s: 600 });
    if (j.slots) { await send("loadout", { rowId: curRow, skills: j.slots }); await sleep(300); }
    for (const b of j.beasts ?? [{ dx: 90, dy: 40 }]) await hook("beast", { dx: b.dx, dy: b.dy, ...(b.boss ? { boss: b.boss, hpx: b.hpx ?? 200 } : {}) });
    await sleep(900);
    const dir = path.join(OUT, `${j.name}_${TAG}`); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
    const frames = []; let n = 0;
    const h = async (d) => { if (d.method !== "Page.screencastFrame") return; const f = `${String(n++).padStart(4, "0")}.png`; writeFileSync(path.join(dir, f), Buffer.from(d.params.data, "base64")); frames.push({ f, ts: d.params.metadata.timestamp }); await cdp("Page.screencastFrameAck", { sessionId: d.params.sessionId }); };
    ev2.push(h); await cdp("Page.startScreencast", { format: "png", everyNthFrame: 3 }); await sleep(500);
    const t0 = await ev(`(performance.timeOrigin + performance.now()) / 1000`);
    if (j.tc) { console.log("swCd", await ev("window.__scene.room.state.players.get(window.__scene.room.sessionId).swCd")); await send("switch", { slot: 1 }); await sleep(400); console.log("sau switch active", await ev("window.__scene.owned.active")); curId = j.vohon; curRow = rows[j.vohon]; } else if (j.cast === "ct") await send("chanthan"); else await send("skill", { i: j.cast });
    await sleep(j.dur ?? 2200);
    if (process.env.DBG) { const txt = await ev("document.body.innerText"); console.log("HUD:", txt.split(String.fromCharCode(10)).filter((s) => /iên cơ|Phá Thiên|Loạn|tầm|mục tiêu|an toàn/.test(s)).slice(-6).join(" | ")); }
    await cdp("Page.stopScreencast"); ev2.splice(ev2.indexOf(h), 1);
    for (const q of frames) q.t = Math.round((q.ts - t0) * 1000);
    const fps = await ev(`window.__scene.game.loop.actualFps`);
    writeFileSync(path.join(dir, "times.json"), JSON.stringify({ frames, fps, fire: t0 }));
    const st = await ev(`(()=>{const p=window.__scene.room.state.players.get(window.__scene.room.sessionId); return p.mp+"/"+p.maxMp})()`);
    console.log(`[real] ${j.name}_${TAG}: ${frames.length} khung, fps ${Math.round(fps)}, mp ${st}`);
    await sleep(600);
  }
  console.log("lỗi trang:", errs.length, errs.slice(0, 3));
} finally { kill(); }
process.exit(0);
