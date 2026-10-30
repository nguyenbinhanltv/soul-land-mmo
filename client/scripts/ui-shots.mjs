// Chụp giao diện game ở nhiều cỡ màn để làm ảnh trước / sau cho PR giao diện (UI Kit v2, #877 / #878).
// Cần server đang chạy với GAME_TEST=1 (hook "test"; ví dụ `GAME_TEST=1 PORT=2547 npm run dev:server`, hoặc bản build: `npm run build` rồi `npm start`)
// và client đã build (server phục vụ client/dist). KHÔNG trỏ DB thật; không có DATABASE_URL thì dữ liệu chỉ ở RAM.
//   node client/scripts/ui-shots.mjs --server http://localhost:2547 --out <thư mục> [--sizes 1366x768,1280x720,960x540,1920x1080] [--only dang-nhap,hud,tui] [--tag truoc] [--dpr 1] [--outer] [--styles <thư mục>] [--name <tên hồn sư>]
// Cỡ ghi trong tên ảnh là cỡ vùng hiển thị thật (đặt bằng Emulation.setDeviceMetricsOverride, không tính khung cửa sổ Chrome).
// Mã cảnh (--only): dang-nhap, tao-nhan-vat, the-vao-ban-do, hud, hud-tien-do, tui, nhan-vat, hai-cua-so, doi-hinh, hon-cot, cong-minh, ban-be, tu-dong, tong-ket, uy-thac, ban-do, the-gioi, cai-dat, hub, thanh-tuu, thu, npc, cua-hang, tho-ren, bi-canh.
// Luật: đúng MỘT Chrome headless, luôn --mute-audio, cổng CDP ngẫu nhiên (không dùng 9333), chụp tuần tự từng cỡ; xong tắt đúng PID của mình.
// Chrome tìm ở biến CHROME (đường dẫn) hoặc đường dẫn cài đặt mặc định (Chrome, rồi Edge).
import { spawn } from "node:child_process";
import { readFileSync, existsSync, mkdirSync, writeFileSync, mkdtempSync, rmSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { AUTO_DEFAULTS } from "../../shared/data.ts";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const SERVER = opt("server", process.env.SERVER_URL ?? "http://localhost:2567");
const OUT = opt("out", "ui-shots");
const SIZES = opt("sizes", "1366x768,1280x720,960x540,1920x1080").split(",").map((s) => s.trim().split("x").map(Number));
const ONLY = opt("only", "") ? new Set(opt("only", "").split(",")) : null;
const TAG = opt("tag", "");
const DPR = +opt("dpr", "1");
const FS = opt("fs", ""); // --fs 1|2: thêm lớp a11y-fs-N (cỡ chữ Lớn / Rất lớn) sau khi vào bản đồ
const STYLES = opt("styles", ""); // --styles <thư mục>: cùng mỗi ảnh ghi thêm <tag>-<cảnh>.json (computed style của mọi phần tử DOM ngoài canvas) để so trước / sau không nhiễu bởi nền bản đồ (node tools/ui-styles-diff.mjs)
const PROBE = opt("probe", ""); // --probe <tệp.json>: [{ "scene": "10-hud", "sel": "#bskills .bsk", "props": ["border-top-style"] }]; sau ảnh của cảnh khớp tiền tố, in các luật CSS khớp phần tử kèm độ đặc hiệu (tìm luật thua do độ ưu tiên)
const FLIP = opt("flip", ""); // --flip <tệp.jsonl>: (bản build đã đánh dấu `--u2:1` vào luật ui2) mô phỏng độ đặc hiệu cũ (+0,1,1) với mới trên mọi phần tử, ghi các thuộc tính đổi người thắng
const OUTER = argv.includes("--outer"); // cỡ = cửa sổ Chrome (vùng hiển thị nhỏ hơn: khung tab / thanh địa chỉ), như người chơi mở cửa sổ 960×540
const CHROMES = [process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);
const CHROME = CHROMES.find((p) => existsSync(p));
if (!CHROME) { console.error("Không thấy Chrome / Edge: đặt biến CHROME."); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = async (p, b) => { const r = await fetch(SERVER + p, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); return { status: r.status, ...(await r.json()) }; };
const want = (id) => !ONLY || ONLY.has(id);

// Chạy trong trang: computed style (các thuộc tính ảnh hưởng hình) của mọi phần tử DOM nhìn thấy ngoài canvas, khoá theo đường đi trong cây.
const DUMP_STYLES = `() => {
  const P = ["display","position","visibility","opacity","color","background-color","background-image","background-size","background-position","border-top-width","border-right-width","border-bottom-width","border-left-width","border-top-style","border-top-color","border-right-color","border-bottom-color","border-left-color","border-image-source","border-image-slice","border-image-width","border-top-left-radius","box-shadow","text-shadow","outline","font-family","font-size","font-weight","font-style","line-height","letter-spacing","text-align","text-transform","text-decoration-line","padding-top","padding-right","padding-bottom","padding-left","margin-top","margin-right","margin-bottom","margin-left","width","height","left","top","gap","transform","filter","z-index","cursor","overflow-x","overflow-y","white-space"];
  const out = {}, seen = new Map();
  const walk = (el, path) => {
    for (const c of el.children) {
      if (c.tagName === "CANVAS" || c.tagName === "SCRIPT" || c.tagName === "STYLE") continue;
      const n = c.tagName.toLowerCase() + (c.id ? "#" + c.id : "") + (c.classList.length ? "." + [...c.classList].sort().join(".") : "");
      const p = path + ">" + n, k = (seen.get(p) ?? 0) + 1; seen.set(p, k);
      const cs = getComputedStyle(c);
      if (cs.display !== "none") { const o = {}; for (const q of P) o[q] = cs.getPropertyValue(q); out[p + "#" + k] = o; walk(c, p + "#" + k); }
    }
  };
  walk(document.body, "body"); return out;
}`;

// Chạy trong trang: với phần tử khớp `sel` đầu tiên, liệt kê luật khai báo từng thuộc tính theo thứ tự thắng tăng dần (cuối cùng thắng).
const PROBE_FN = String.raw`(sel, props) => {
  const el = document.querySelector(sel); if (!el) return "KHÔNG THẤY " + sel;
  const spec = (s) => { let a = 0, b = 0, c = 0; s = s.replace(/\[[^\]]*\]/g, () => (b++, "")).replace(/::?(where)\((?:[^()]|\([^)]*\))*\)/g, "").replace(/#[\w-]+/g, () => (a++, "")).replace(/\.[\w-]+/g, () => (b++, "")).replace(/::?[\w-]+(\([^)]*\))?/g, () => (b++, "")).replace(/[a-zA-Z][\w-]*/g, () => (c++, "")); return [a, b, c]; };
  const out = []; let order = 0;
  const walk = (rules, sheet) => { for (const r of rules) { if (r.cssRules && !r.selectorText) { walk(r.cssRules, sheet); continue; } if (!r.selectorText) continue; order++;
    const parts = r.selectorText.split(/,(?![^(]*\))/).map((x) => x.trim()).filter((x) => { try { return el.matches(x); } catch { return false; } });
    if (!parts.length) continue;
    for (const p of props) { const v = r.style.getPropertyValue(p); if (!v) continue; const best = parts.map(spec).sort((x, y) => y[0] - x[0] || y[1] - x[1] || y[2] - x[2])[0];
      out.push({ p, v: v.slice(0, 50), imp: r.style.getPropertyPriority(p) === "important", sp: best, order, sel: parts.join(" , ").slice(0, 110), sheet }); } } };
  [...document.styleSheets].forEach((sh, i) => { try { walk(sh.cssRules, i); } catch {} });
  const cmp = (x, y) => (x.imp - y.imp) || (x.sp[0] - y.sp[0]) || (x.sp[1] - y.sp[1]) || (x.sp[2] - y.sp[2]) || (x.order - y.order);
  return props.map((p) => p + " @ " + sel + "\n" + out.filter((o) => o.p === p).sort(cmp).map((o) => "   (" + o.sp.join(",") + ")" + (o.imp ? "!" : "") + " #" + o.order + " " + o.v + "  <-  " + o.sel).join("\n")).join("\n");
}`;

const FLIP_FN = String.raw`() => {
  const SH = { border: ["border-top-width","border-top-style","border-top-color","border-right-width","border-right-style","border-right-color","border-bottom-width","border-bottom-style","border-bottom-color","border-left-width","border-left-style","border-left-color"], "border-color": ["border-top-color","border-right-color","border-bottom-color","border-left-color"], "border-width": ["border-top-width","border-right-width","border-bottom-width","border-left-width"], "border-style": ["border-top-style","border-right-style","border-bottom-style","border-left-style"], padding: ["padding-top","padding-right","padding-bottom","padding-left"], margin: ["margin-top","margin-right","margin-bottom","margin-left"], "border-top": ["border-top-width","border-top-style","border-top-color"], "border-bottom": ["border-bottom-width","border-bottom-style","border-bottom-color"], "border-left": ["border-left-width","border-left-style","border-left-color"], "border-right": ["border-right-width","border-right-style","border-right-color"], background: ["background-color","background-image","background-size","background-position","background-repeat"], inset: ["top","right","bottom","left"], gap: ["row-gap","column-gap"], "border-radius": ["border-top-left-radius"], font: ["font-size","font-family","font-weight","line-height"], outline: ["outline-width","outline-style","outline-color"] };
  const spec = (s) => { let a = 0, b = 0, c = 0; s = s.replace(/\[[^\]]*\]/g, () => (b++, "")).replace(/::?where\((?:[^()]|\([^)]*\))*\)/g, "").replace(/#[\w-]+/g, () => (a++, "")).replace(/\.[\w-]+/g, () => (b++, "")).replace(/::?[\w-]+(\([^)]*\))?/g, () => (b++, "")).replace(/[a-zA-Z][\w-]*/g, () => (c++, "")); return [a, b, c]; };
  const rules = []; let order = 0;
  const walk = (rs) => { for (const r of rs) { if (r.cssRules && !r.selectorText) { walk(r.cssRules); continue; } if (!r.selectorText) continue; order++;
    const decl = []; const css = r.style.cssText;
    for (const m of css.matchAll(/(?:^|;)\s*([a-z-]+)\s*:\s*((?:[^;(]|\([^)]*\))*)/g)) { const p = m[1]; if (p === "--u2" || p.startsWith("--")) continue; for (const q of (SH[p] ?? [p])) decl.push([q, m[2].trim() + "@" + p, r.style.getPropertyPriority(p) === "important"]); }
    if (!decl.length) continue;
    rules.push({ order, u2: r.style.getPropertyValue("--u2") === "1", sel: r.selectorText, parts: r.selectorText.split(/,(?![^(]*\))/).map((x) => x.trim()), decl }); } };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch {} }
  const byEl = new Map();
  for (const r of rules) for (const part of r.parts) { let els; try { els = document.body.querySelectorAll(part); } catch { continue; } const sp = spec(part);
    for (const el of els) { if (el.closest("canvas")) continue; let a = byEl.get(el); if (!a) byEl.set(el, a = []); a.push({ r, sp }); } }
  const key = (m, mode) => { const sp = m.sp.slice(); if (mode === "old" && m.r.u2) sp[1] += 1, sp[2] += 1; return sp; };
  const better = (x, y, mode) => { if (!y) return true; if (x.imp !== y.imp) return x.imp; const a = key(x.m, mode), b = key(y.m, mode); for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]; return x.m.r.order > y.m.r.order; };
  const out = new Map();
  for (const [el, ms] of byEl) {
    const win = new Map();
    for (const m of ms) for (const [p, v, imp] of m.r.decl) { const w = win.get(p) ?? { old: null, nw: null }; const c = { m, v, imp }; if (better(c, w.old, "old")) w.old = c; if (better(c, w.nw, "new")) w.nw = c; win.set(p, w); }
    for (const [p, w] of win) if (w.old.m.r !== w.nw.m.r && w.old.v !== w.nw.v) { const k = p + " | THẮNG-CŨ #" + w.old.m.r.order + (w.old.m.r.u2 ? " [ui2]" : "") + " " + w.old.m.r.sel.slice(0, 90) + " | THẮNG-MỚI #" + w.nw.m.r.order + (w.nw.m.r.u2 ? " [ui2]" : "") + " " + w.nw.m.r.sel.slice(0, 90); const e = out.get(k) ?? { n: 0, el: el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + "." + [...el.classList].join(".") }; e.n++; out.set(k, e); }
  }
  return [...out].map(([k, e]) => ({ k, n: e.n, el: e.el }));
}`;

async function runSize(W, H) {
  const profile = mkdtempSync(path.join(tmpdir(), "ui-shots-"));
  const chrome = spawn(CHROME, ["--headless=new", "--mute-audio", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--enable-gpu", "--ignore-gpu-blocklist",
    `--window-size=${W},${H}`, "--no-first-run", "about:blank"], { stdio: "ignore" });
  const tag = `${TAG ? TAG + "-" : ""}${W}x${H}${OUTER ? "-cua-so" : ""}${DPR !== 1 ? "@" + DPR + "x" : ""}`;
  try {
    let port = 0;
    for (let i = 0; i < 150 && !port; i++) { await sleep(100); const f = path.join(profile, "DevToolsActivePort"); if (existsSync(f)) port = +readFileSync(f, "utf8").split("\n")[0]; }
    if (!port) throw new Error("Chrome không mở cổng gỡ lỗi");
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    let seq = 0; const pending = new Map();
    ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
    const cdp = (method, params = {}) => new Promise((res) => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
    const ev = async (expr) => { const r = await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 300)); return r.result?.result?.value; };
    const until = async (expr, ms = 20000) => { for (let t = 0; t < ms; t += 200) { if (await ev(expr).catch(() => false)) return true; await sleep(200); } throw new Error("hết giờ chờ: " + expr); };
    const test = (o) => ev(`(window.__scene.room.send("test", ${JSON.stringify(o)}), new Promise(r=>setTimeout(()=>r(true),250)))`);
    const shot = async (file) => { const r = await cdp("Page.captureScreenshot", { format: "png" }); writeFileSync(path.join(OUT, `${tag}-${file}.png`), Buffer.from(r.result.data, "base64")); console.log("ảnh", `${tag}-${file}`);
      if (PROBE) for (const q of JSON.parse(readFileSync(PROBE, "utf8"))) if (file.startsWith(q.scene)) console.log("PROBE", file, await ev(`(${PROBE_FN})(${JSON.stringify(q.sel)}, ${JSON.stringify(q.props)})`));
      if (FLIP) appendFileSync(FLIP, JSON.stringify({ file, flips: await ev(`(${FLIP_FN})()`) }) + "\n");
      if (STYLES) { mkdirSync(STYLES, { recursive: true }); writeFileSync(path.join(STYLES, `${tag}-${file}.json`), JSON.stringify(await ev(`(${DUMP_STYLES})()`))); } };
    const key = async (code, k) => { for (const type of ["keyDown", "keyUp"]) await cdp("Input.dispatchKeyEvent", { type, code, key: k, windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0) }); await sleep(500); };
    const step = async (id, fn) => { if (!want(id)) return; try { await fn(); } catch (e) { console.log("LỖI cảnh", id, String(e).slice(0, 200)); } };
    const click = (id) => ev(`document.getElementById(${JSON.stringify(id)})?.click(), true`);
    // Mở một mục của hub (các nút menu cũ ở cột trái đã bỏ): mở ngăn kéo bằng huy hiệu nếu đang đóng rồi bấm thẻ.
    const hubOpen = (id) => ev(`(document.getElementById("hub")?.hidden && document.getElementById("hubBtn")?.click(), document.querySelector('[data-hub="${id}"]')?.click(), true)`);

    await cdp("Page.enable"); await cdp("Runtime.enable");
    if (!OUTER) await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
    const name = opt("name", "Đường Tam " + Math.random().toString(36).slice(2, 6)), password = "ui-shots-pass";
    await step("dang-nhap", async () => { await cdp("Page.navigate", { url: SERVER + "/choi?nopredict" }); await sleep(2500); await shot("01-dang-nhap"); });
    const l = await post("/api/login", { name, password });
    if (!want("dang-nhap")) { await cdp("Page.navigate", { url: SERVER + "/choi?nopredict" }); await sleep(1500); } // localStorage cần trang cùng nguồn, không phải about:blank
    await ev(`localStorage.setItem("shh-token", ${JSON.stringify(l.token)}), localStorage.setItem("shh-audio", JSON.stringify({muted:true})), true`);
    await step("tao-nhan-vat", async () => { await cdp("Page.navigate", { url: SERVER + "/choi?nopredict" }); await sleep(2500); await shot("02-tao-nhan-vat"); });
    await post("/api/looks", { token: l.token, sex: 0, hair: 1, hairCol: 1, outfitCol: 2 });
    await post("/api/awaken", { token: l.token, vohon: "lam_dien_ba_vuong_long" });
    await cdp("Page.navigate", { url: SERVER + "/choi?nopredict" });
    await until(`!!document.getElementById("go")`); await sleep(800);
    await step("the-vao-ban-do", () => shot("03-the-vao-ban-do"));
    await click("go");
    await until(`!!window.__scene?.room?.state?.players?.size`); await sleep(2500);
    if (FS) await ev(`document.body.classList.add("a11y-fs-${FS}"), true`);
    await step("hud", () => shot("10-hud-mac-dinh"));
    for (const v of ["lam_ngan_thao", "thanh_phong_ky", "bach_ho"]) { await test({ op: "grant", vohon: v }); await sleep(300); }
    await test({ op: "coin", n: 123456 });
    for (const [code, qty] of [["hon_hoan", 6], ["hon_cot", 3], ["hon_hach", 3]]) await test({ op: "give", code, qty });
    const rows = JSON.parse(await ev(`JSON.stringify(window.__scene.owned.list.map(v=>v.rowId))`));
    await test({ op: "set", rowId: rows[0], level: 60, stars: 3, rings: "[1000,1000,10000,10000,30000]" });
    await sleep(1200);
    await step("hud-tien-do", () => shot("11-hud-co-tien-do"));
    // Khung gộp Nhiệm vụ | Tổ đội (góc phải): tin giả "party" phát lại vào bộ nghe (không gửi gì lên server); dọn toast để khung không bị che.
    await step("khung-nv-to-doi", async () => {
      const fakeParty = (m) => ev(`(window.__scene.room.onMessageHandlers.emit("party", ${JSON.stringify(m)}), true)`);
      const clearToasts = () => ev(`(document.querySelectorAll("#toasts .toast").forEach((e) => e.remove()), true)`);
      await clearToasts(); await sleep(300); await shot("12-khung-nhiem-vu");
      await fakeParty({ id: 0, max: 5, members: [], invites: [{ name: "Đường Tam", secs: 30 }] }); await clearToasts(); await sleep(400); await shot("13-khung-to-doi-loi-moi");
      const me = { name: "Tiểu Vũ", leader: true, me: true, sid: "a", map: "", ch: 1, level: 20, vh: 0, hp: 80, maxHp: 100, dead: false, off: false };
      await fakeParty({ id: 7, max: 5, members: [me, ...["Đường Tam", "Đới Mộc Bạch", "Chu Trúc Thanh", "Mã Hồng Tuấn"].map((name, i) => ({ ...me, name, leader: false, me: false, sid: "b" + i, hp: 40 + i * 10 }))], invites: [] }); await clearToasts(); await sleep(400); await shot("14-khung-to-doi");
      await click("sbFold"); await sleep(300); await shot("15-khung-thu-gon"); await click("sbFold");
      await click("sbTabQuest"); await fakeParty({ id: 0, max: 5, members: [], invites: [] }); await sleep(200);
    });
    await step("tui", async () => { await key("KeyB", "b"); await shot("20-tui"); await key("KeyB", "b"); });
    await step("nhan-vat", async () => { await key("KeyH", "h"); await shot("21-nhan-vat-trang-bi"); await key("BracketRight", "]"); await shot("22-nhan-vat-hon-cot"); await key("Escape", "Escape"); });
    await step("hai-cua-so", async () => { await key("KeyH", "h"); await key("KeyB", "b"); await shot("24-hai-cua-so"); await key("Escape", "Escape"); await key("Escape", "Escape"); });
    await step("doi-hinh", async () => { await key("KeyV", "v"); await shot("30-doi-hinh"); await key("Escape", "Escape"); });
    // Mục Hồn cốt / Hồn hạch / Mảnh của bảng Võ Hồn (đợt 2b-2): mở tab dưới, gắn vài món từ túi, chụp, mở bảng cường hóa.
    await step("hon-cot", async () => {
      const tab = (t) => ev(`document.querySelector('#roster .rtabs [data-tab="${t}"]')?.click(), true`);
      const eq = async (n) => { for (let i = 0; i < n; i++) { await ev(`document.querySelector("#roster .bitem .sbtn")?.click(), true`); await sleep(700); } };
      await key("KeyV", "v"); await tab("bone"); await sleep(400); await eq(2); await shot("40-hon-cot");
      await ev(`document.querySelector("#roster .bcell:not(.empty)")?.click(), true`); await sleep(500); await shot("41-hon-cot-chon");
      await ev(`[...document.querySelectorAll("#roster .buse")].find((b) => b.textContent.includes("Cường hóa"))?.click(), true`); await sleep(500);
      await ev(`document.querySelector("#roster .aopt")?.click(), true`); await sleep(500); await ev(`(document.getElementById("roster").scrollTop = 1e5, true)`); await sleep(200); await shot("42-hon-cot-cuong-hoa");
      await tab("core"); await sleep(400); await eq(3); await shot("43-hon-hach");
      await ev(`document.querySelector("#roster .ccell:not(.empty)")?.click(), true`); await sleep(500); await shot("44-hon-hach-chon"); await ev(`(document.getElementById("roster").scrollTop = 1e5, true)`); await sleep(200); await shot("46-hon-hach-duoi");
      await tab("manh"); await sleep(400); await shot("45-manh");
      await key("Escape", "Escape");
    });
    await step("cong-minh", async () => { await key("KeyK", "k"); await shot("31-cong-minh"); await key("Escape", "Escape"); });
    await step("ban-be", async () => { await key("KeyL", "l"); await shot("32-ban-be"); await key("Escape", "Escape"); });
    await step("tu-dong", async () => { await hubOpen("auto"); await sleep(500); await shot("33-tu-dong"); await key("Escape", "Escape"); }); // mục hub luôn MỞ (không bật / tắt như nút cũ): đóng bằng Esc
    // Tổng kết tự động và Ủy thác trở về: phát lại tin giả vào bộ nghe của phòng (không gửi gì lên server; chỉ để chụp bố cục).
    const fake = (type, msg) => ev(`(window.__scene.room.onMessageHandlers.emit(${JSON.stringify(type)}, ${JSON.stringify(msg)}), true)`);
    await step("tong-ket", async () => {
      await hubOpen("auto"); await sleep(400);
      await fake("auto", { on: false, left: 36000, max: 43200, bonus: 0, cfg: AUTO_DEFAULTS, why: "Hết đan hồi sinh lực", sum: { secs: 1830, kills: 142, xp: 98200, coins: 3650, loot: [["Hồn hoàn 1000 năm", 2], ["Tiên thảo", 5]], sold: [12, 840] } }).catch(() => {});
      await sleep(500); await shot("38-tong-ket-tu-dong"); await key("Escape", "Escape");
    });
    await step("uy-thac", async () => {
      await fake("offline", { away: 21600, secs: 21600, used: 21000, map: "Thánh Hồn Thôn", zone: "Rừng ngoài", kills: 1280, weak: 14, xp: 856000, coins: 42500,
        items: [{ name: "Hồn hoàn 10 năm", qty: 6 }, { name: "Tiên thảo", qty: 12 }, { name: "Hồn hạch Lam Ngân 1★", qty: 3 }], left: 21600, max: 43200, bonus: 3600, bonusUsed: 1800, equipLost: 2, stop: "túi đầy" });
      await sleep(500); await shot("39-uy-thac"); await ev(`(document.querySelector("#offline .buse")?.click(), true)`);
    });
    await step("ban-do", async () => { await key("KeyN", "n"); await sleep(600); await shot("34-ban-do-khu-vuc"); await key("Escape", "Escape"); });
    await step("the-gioi", async () => { await key("KeyM", "m"); await sleep(600); await shot("35-the-gioi"); await key("Escape", "Escape"); });
    await step("cai-dat", async () => { await hubOpen("settings"); await sleep(500); await shot("37-cai-dat"); await hubOpen("settings"); });
    await step("hub", async () => { await key("Escape", "Escape"); await sleep(400); await shot("36-hub"); await key("Escape", "Escape"); });
    // NPC: dịch tới NPC có vai trò đó trong bản đồ hiện tại (vị trí lấy ở client), gửi "talk" như phím tương tác; không có thì bỏ qua cảnh.
    const npcShot = async (role, file, prep) => {
      const ok = await ev(`(() => { const s = window.__scene, n = s.npcs.find((n) => ${role === "talk" ? "true" : `n.def?.role === "${role}"`}); if (!n) return false; window.__npcId = n.id; window.__npcXY = [n.x, n.y]; return true; })()`);
      if (!ok) { console.log("bỏ qua cảnh", file, "(bản đồ không có NPC", role + ")"); return; }
      const [nx, ny] = await ev(`window.__npcXY`);
      await test({ op: "goto", x: nx, y: ny + 40 }); await sleep(600);
      await ev(`(window.__scene.talk(window.__npcId), true)`); await sleep(1200);
      if (prep) await prep(); await shot(file);
      await key("Escape", "Escape"); // một Escape đóng hộp thoại; Escape thừa sẽ mở menu hub (ui2)
      if (await ev(`!!document.getElementById("hub") && !document.getElementById("hub").hidden`)) await key("Escape", "Escape");
    };
    await step("npc", () => npcShot("talk", "50-npc"));
    if (want("cua-hang") || want("tho-ren")) await (async () => { try { // Thánh Hồn Thôn không có thương nhân / thợ rèn: đi cổng sang Nặc Đinh Thành
      const pt = await ev(`(() => { const r = window.__scene.portals.find((p) => p.to === "nac_dinh_thanh"); return r ? [r.x + r.w / 2, r.y + r.h / 2] : null; })()`);
      if (pt) { await test({ op: "goto", x: pt[0], y: pt[1] }); await sleep(600); }
      await ev(`(window.__scene.room.send("travel", { portal: "Đi Nặc Đinh Thành" }), true)`);
      await until(`window.__scene?.room?.state?.mapId === "nac_dinh_thanh" && !!window.__scene.room.state.players?.size`, 30000); await sleep(2500); } catch (e) { console.log("LỖI đi cổng", String(e).slice(0, 200)); }
    })();
    await step("cua-hang", () => npcShot("shop", "51-cua-hang"));
    await step("tho-ren", () => npcShot("forge", "52-tho-ren"));
    // Bí Cảnh (P5): mở từ hub, hộp xác nhận mua lượt, vào phòng thật (HUD chuẩn bị / sóng), kết quả thật (hết giờ) và kết quả giả (thắng có quyển, lỗi hệ thống).
    await step("bi-canh", async () => {
      await ev(`(window.__scene.room.send("bicanh", { op: "get" }), true)`); await sleep(500);
      await key("Escape", "Escape"); await sleep(300); await ev(`(document.querySelector('[data-hub="bicanh"]')?.click(), true)`); await sleep(900); await shot("60-bi-canh-danh-sach");
      await ev(`(document.querySelector(".bc-buy")?.click(), true)`); await sleep(400); await shot("61-bi-canh-mua-luot"); await key("Escape", "Escape");
      await ev(`(document.querySelector(".p2-primary")?.click(), true)`);
      await until(`!document.getElementById("bicanhHud")?.hidden`, 30000); await sleep(600); await shot("62-bi-canh-hud-chuan-bi");
      await until(`document.querySelector("#bicanhHud .bc-h-t")?.textContent?.startsWith("Sóng")`, 15000); await sleep(1500); await shot("63-bi-canh-hud-song");
      await test({ op: "bcfast", s: 0 }); await until(`!document.getElementById("bicanhEnd")?.hidden`, 15000); await sleep(500); await shot("64-bi-canh-ket-qua-thua");
      await fake("bicanh", { k: "end", win: true, reason: "win", why: "hạ hết các sóng", cleared: 3, of: 3, tomes: 2, secs: 8 }); await sleep(400); await shot("65-bi-canh-ket-qua-thang");
      await fake("bicanh", { k: "end", win: false, reason: "dead", why: "đội võ hồn gục hết", cleared: 1, of: 3, tomes: 0, secs: 8, err: "Không lưu được kết quả: quyển chưa nhận, lượt đã được hoàn lại.", refunded: true }); await sleep(400); await shot("66-bi-canh-ket-qua-loi");
    });
    // Thành Tựu (#1317): thẻ hub đã bật, danh sách khi chưa đạt gì (trống), có mốc nhận được (nhóm Săn), vừa nhận, lỗi từ server.
    await step("thanh-tuu", async () => {
      const open = async () => { await key("Escape", "Escape"); await sleep(300); await ev(`(document.querySelector('[data-hub="achv"]')?.click(), true)`); await sleep(900); };
      await key("Escape", "Escape"); await sleep(300); await shot("69-thanh-tuu-hub");
      await open(); await shot("70-thanh-tuu-rong"); await key("Escape", "Escape");
      await test({ op: "achv", key: "elite", n: 12 }); await test({ op: "achv", key: "king", n: 1 });
      await open(); await ev(`(document.querySelector('.p2-nav-i[data-id="hunt"]')?.click(), true)`); await sleep(300); await shot("71-thanh-tuu-nhan-duoc");
      await ev(`(document.querySelector(".av-claim")?.click(), true)`); await sleep(900); await shot("72-thanh-tuu-da-nhan");
      await fake("achv", { stats: { level: 1, owned: 2, stars: 1, quests: 0, arenaWins: 0, elite: 12, king: 1, world: 0, bicanh: 0 }, claimed: [], ready: 3, err: "Túi không đủ chỗ cho phần thưởng: bỏ hoặc bán bớt đồ rồi thử lại." }); await sleep(300); await shot("73-thanh-tuu-loi");
      await key("Escape", "Escape");
    });
    // Thư (#1336): thẻ hub đã bật, hộp trống, có thư (mới / có quà / sắp hết hạn), vừa nhận, lỗi từ server.
    await step("thu", async () => {
      const open = async () => { await key("Escape", "Escape"); await sleep(300); await ev(`(document.querySelector('[data-hub="mail"]')?.click(), true)`); await sleep(900); };
      await key("Escape", "Escape"); await sleep(300); await shot("74-thu-hub");
      await open(); await shot("75-thu-rong"); await key("Escape", "Escape");
      await test({ op: "mail", title: "Chào mừng đến Rừng Săn Hồn", body: "Thư thử: hộp thư chỉ có thư do hệ thống gửi.", dedup: "shot:1" });
      await test({ op: "mail", title: "Quà từ Phúc Lợi", body: "Quà điểm danh gửi qua thư vì túi đã đầy.", honTe: 120, dedup: "shot:2", kind: "welfare" });
      await test({ op: "mail", title: "Thưởng Bí Cảnh", body: "Hồn Kinh Quyển chờ nhận.", honTe: 30, items: [{ code: "hoi_huyet_dan", qty: 3 }], dedup: "shot:3", kind: "bicanh", ttlMs: 2 * 86400000 });
      await open(); await shot("76-thu-danh-sach");
      await ev(`(document.querySelector('.ml-row[data-st="gift"]')?.click(), true)`); await sleep(400); await shot("77-thu-doc-thu");
      await ev(`(document.querySelector(".ml-claim")?.click(), true)`); await sleep(900); await shot("78-thu-da-nhan");
      await fake("mail", { list: [{ id: 9, from: "Phúc Lợi", title: "Quà từ Phúc Lợi", body: "", honTe: 120, items: [], at: Date.now() - 86400000, exp: Date.now() + 5 * 86400000, read: false, claimed: false }], unread: 1, pending: 1, err: "Túi không đủ chỗ cho phần đính kèm: bỏ hoặc bán bớt đồ rồi thử lại." }); await sleep(300); await shot("79-thu-loi");
      await key("Escape", "Escape");
    });
    ws.close();
  } finally {
    chrome.kill(); spawn("taskkill", ["/PID", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
    await sleep(800);
    try { rmSync(profile, { recursive: true, force: true }); } catch { /* Chrome còn giữ tệp: bỏ qua, nằm ở thư mục tạm */ }
  }
}

for (const [W, H] of SIZES) await runSize(W, H);
