// Thử `image-rendering` × `border-image` × DPR × zoom CSS với một mảnh khung đã duyệt, ở kit 1× (điểm ảnh kit = 1 điểm CSS) và kit 2× (một điểm ảnh kit = ½ điểm CSS,
// tức `border-image-width` = vạch cắt / 2). UI Kit v2 P0 (#878): trả lời "kit làm ở 1× hay 2×" bằng số đo trên trình duyệt thật, ghi kết luận vào docs/art/ui-kit.md.
//   node tools/ui-border-image-probe.mjs [--browser chrome|edge] [--piece nv6_nen_bup_be|khung_tab_nhan_vat] [--out <thư mục ảnh>] [--md <tệp>]
// Mỗi ô: góc trên-trái của khung vẽ ra được so với ảnh nguồn phóng nearest-neighbour đúng tỉ lệ (khớp %) và đếm màu lạ ngoài bảng màu mảnh (nội suy làm mờ → màu lạ).
// Một trình duyệt headless, luôn --mute-audio, cổng CDP ngẫu nhiên, tắt đúng PID. Không cần server game.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { decodePng, ROOT } from "./assets/lib.mjs";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const BROWSER = opt("browser", "chrome");
const PIECE = opt("piece", "nv6_nen_bup_be");
const OUT = opt("out", "");
const NINE = { nv6_nen_bup_be: 16, khung_tab_nhan_vat: 8 }[PIECE] ?? +opt("nine", "8");
const EXE = {
  chrome: [process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome"],
  edge: [process.env.EDGE, "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"],
}[BROWSER]?.filter(Boolean).find((p) => existsSync(p));
if (!EXE) { console.error(`Không thấy trình duyệt "${BROWSER}" (chrome | edge; hoặc đặt biến CHROME / EDGE).`); process.exit(2); }

const file = path.join(ROOT, "shared", "assets", "sprites", "iso", "ui", `${PIECE}.png`);
const src = decodePng(readFileSync(file));
const palette = new Set(); for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const p = src.get(x, y); if (p[3] === 255) palette.add(p.slice(0, 3).join(",")); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const KITS = [1, 2], RENDERS = ["auto", "pixelated", "crisp-edges"], ZOOMS = [1, 1.5, 2], DPRS = [1, 2];
const BOX_W = 150, BOX_H = 100, CELL_W = 330, CELL_H = 220, COLS = 6;

function pageHtml() {
  const cells = [];
  for (const kit of KITS) for (const r of RENDERS) for (const z of ZOOMS) {
    const bw = NINE / kit;
    cells.push(`<div class="cell" data-kit="${kit}" data-r="${r}" data-z="${z}"><div style="zoom:${z}"><div class="b" style="width:${BOX_W}px;height:${BOX_H}px;border:${bw}px solid transparent;border-image:url('${pathToFileURL(file).href}') ${NINE} fill / ${bw}px stretch;image-rendering:${r}"></div></div></div>`);
  }
  return `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff}.cell{position:absolute;width:${CELL_W}px;height:${CELL_H}px;overflow:hidden}.b{box-sizing:border-box}</style>${cells.map((c, i) => c.replace('class="cell"', `class="cell" style="left:${(i % COLS) * CELL_W}px;top:${Math.floor(i / COLS) * CELL_H}px"`)).join("")}`;
}

const profile = mkdtempSync(path.join(tmpdir(), "ui-bi-probe-"));
const htmlFile = path.join(profile, "probe.html"); writeFileSync(htmlFile, pageHtml());
const browser = spawn(EXE, ["--headless=new", "--mute-audio", "--remote-debugging-port=0", `--user-data-dir=${path.join(profile, "p")}`, "--allow-file-access-from-files", "--no-first-run", "about:blank"], { stdio: "ignore" });
const rows = [];
try {
  let port = 0;
  for (let i = 0; i < 150 && !port; i++) { await sleep(100); const f = path.join(profile, "p", "DevToolsActivePort"); if (existsSync(f)) port = +readFileSync(f, "utf8").split("\n")[0]; }
  if (!port) throw new Error("trình duyệt không mở cổng gỡ lỗi");
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let seq = 0; const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const cdp = (method, params = {}) => new Promise((res) => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const version = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).Browser;
  await cdp("Page.enable");
  const W = CELL_W * COLS, H = CELL_H * Math.ceil(KITS.length * RENDERS.length * ZOOMS.length / COLS);
  for (const dpr of DPRS) {
    await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: dpr, mobile: false });
    await cdp("Page.navigate", { url: pathToFileURL(htmlFile).href }); await sleep(2500); // Edge vẽ border-image chậm hơn Chrome: chụp sớm ra ảnh trắng
    const png = Buffer.from((await cdp("Page.captureScreenshot", { format: "png" })).result.data, "base64"), shot = decodePng(png);
    if (OUT) { mkdirSync(OUT, { recursive: true }); writeFileSync(path.join(OUT, `${BROWSER}-${PIECE}-dpr${dpr}.png`), png); }
    const cells = JSON.parse((await cdp("Runtime.evaluate", { expression: `JSON.stringify([...document.querySelectorAll(".cell")].map(c=>{const r=c.getBoundingClientRect();return {kit:+c.dataset.kit,r:c.dataset.r,z:+c.dataset.z,x:r.left,y:r.top}}))`, returnByValue: true })).result.result.value);
    for (const c of cells) {
      // hộp: bao nhỏ nhất của điểm không trắng trong ô (khung vẽ có mép trong suốt: lấy theo alpha thật của nền trắng)
      let x0 = 1e9, y0 = 1e9;
      const X = Math.round(c.x * dpr), Y = Math.round(c.y * dpr), cw = CELL_W * dpr, ch = CELL_H * dpr;
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const p = shot.get(X + x, Y + y); if (p[0] !== 255 || p[1] !== 255 || p[2] !== 255) { if (x < x0) x0 = x; if (y < y0) y0 = y; } }
      if (x0 === 1e9) throw new Error(`ô trống (${c.kit}× ${c.r} zoom ${c.z} DPR ${dpr}): trình duyệt chưa vẽ khung`);
      const bw = NINE / c.kit, devBw = Math.round(bw * c.z * dpr), s = (bw * c.z * dpr) / NINE; // điểm ảnh nguồn → điểm ảnh thiết bị
      let opaque = 0, match = 0, foreign = new Set(), off = 0;
      for (let y = 0; y < devBw; y++) for (let x = 0; x < devBw; x++) {
        const e = src.get(Math.min(NINE - 1, Math.floor(x / s)), Math.min(NINE - 1, Math.floor(y / s)));
        if (e[3] !== 255) continue;
        const p = shot.get(X + x0 + x, Y + y0 + y); opaque++;
        if (p[0] === e[0] && p[1] === e[1] && p[2] === e[2]) match++;
        if (!palette.has(p.slice(0, 3).join(","))) foreign.add(p.slice(0, 3).join(","));
        else off++;
      }
      rows.push({ browser: BROWSER, version, dpr, zoom: c.z, kit: c.kit, rendering: c.r, devPxPerSrcPx: +s.toFixed(3), match: opaque ? +(100 * match / opaque).toFixed(1) : null, foreignColors: foreign.size, inPalette: opaque ? +(100 * off / opaque).toFixed(1) : null });
    }
  }
  ws.close();
} finally {
  browser.kill(); spawn("taskkill", ["/PID", String(browser.pid), "/T", "/F"], { stdio: "ignore" });
  await sleep(800); try { rmSync(profile, { recursive: true, force: true }); } catch { /* còn giữ tệp: để ở thư mục tạm */ }
}

const md = [`### ${BROWSER} ${rows[0]?.version ?? ""} · mảnh ${PIECE} (${src.w}×${src.h}, vạch cắt ${NINE})`, "",
  "| DPR | zoom CSS | kit | image-rendering | điểm thiết bị / điểm ảnh kit | khớp NN % | màu lạ | trong bảng màu % |", "|---|---|---|---|---|---|---|---|",
  ...rows.map((r) => `| ${r.dpr} | ${r.zoom} | ${r.kit}× | ${r.rendering} | ${r.devPxPerSrcPx} | ${r.match ?? "—"} | ${r.foreignColors} | ${r.inPalette ?? "—"} |`)].join("\n");
const mdIdx = argv.indexOf("--md"); if (mdIdx >= 0) writeFileSync(argv[mdIdx + 1], md + "\n");
console.log(md);
