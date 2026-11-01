// Đo độ to (RMS dBFS) từng nhóm tiếng mẫu trong shared/assets/audio/sfx rồi in bảng `GROUP_TRIM_DB` (client/src/audio/soundMap.ts) đưa mọi nhóm về độ to mục tiêu
// theo loại (G8, #399). Giải mã bằng Chrome headless (--mute-audio, cổng debug ngẫu nhiên, tắt đúng PID mình bật), không cần ffmpeg.
// Dùng: node tools/audio/measure-sfx.mjs [--json ra.json]    Chạy lại khi thêm / thay clip trong tools/audio/sfx-catalog.json.
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../shared/assets/audio");
const OUT = process.argv.includes("--json") ? process.argv[process.argv.indexOf("--json") + 1] : null;
/** Độ to mục tiêu (RMS dBFS) theo khóa nhóm; khóa không liệt kê lấy mục tiêu của loại (tiền tố). Tiếng ngắn / nền thấp hơn tiếng chiến đấu; tuyệt kỹ T3 to hơn hồn kỹ thường. */
const TARGET = { "swing-": -22, "hit-": -22, "skill-t3-ult": -21, "skill-t3-ct": -22, "skill-t3-avatar": -21, "skill-": -23, "beast-boss": -17, "beast-die": -20, "beast-": -22, "ring-": -24, "step-": -34,
  "amb-bird": -30, "amb-cricket": -28, "amb-fire": -28, "amb-fountain": -31, "amb-": -26, "ui-": -22, "pk-open": -18, "pk-kill": -19, "pk-heartbeat": -22, "pk-": -20 };
/** Trần tăng / giảm (dB) và chừa đỉnh: không đẩy đỉnh tiếng lên quá PEAK_MAX dBFS (bộ nén ở AudioManager lo phần còn lại). */
const TRIM_MIN = -9, TRIM_MAX = 9, PEAK_MAX = -1.5;
const targetOf = (k) => { const hit = Object.keys(TARGET).filter((p) => k === p || (p.endsWith("-") && k.startsWith(p))).sort((a, b) => b.length - a.length)[0]; return TARGET[hit]; };
const html = `<script>
window.run = async () => {
  const m = await (await fetch("/sfx/manifest.json")).json(); const res = {}; const packs = {};
  for (const [name] of Object.entries(m.packs)) { const buf = await (await fetch("/sfx/" + name + ".ogg")).arrayBuffer(); packs[name] = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(buf); }
  for (const c of m.clips) {
    const b = packs[c.pack], d = b.getChannelData(0), s = Math.floor(c.start * b.sampleRate), e = Math.min(d.length, Math.floor((c.start + c.duration) * b.sampleRate));
    let sum = 0, pk = 0; for (let i = s; i < e; i++) { sum += d[i] * d[i]; pk = Math.max(pk, Math.abs(d[i])); }
    const rms = Math.sqrt(sum / Math.max(1, e - s));
    const k = c.group.replace(/^(skill-t3-(?:ult|ct))-.*-(start|fly|boom)$/, "$1-$2").replace(/^(skill-t3-avatar).*/, "$1").replace(/^(skill-[a-z]+)-(start|fly|boom)$/, "$1");
    (res[k] ||= []).push({ rms, pk, dur: c.duration });
  }
  return res;
};</script>`;
const srv = http.createServer((q, r) => { if (q.url === "/") { r.setHeader("content-type", "text/html"); return r.end(html); }
  const f = path.join(ROOT, q.url); fs.readFile(f, (e, d) => e ? (r.statusCode = 404, r.end()) : r.end(d)); }).listen(0, "127.0.0.1", async () => {
  const port = srv.address().port, dbg = 9400 + Math.floor(Math.random() * 400);
  const ud = fs.mkdtempSync(path.join(process.env.TEMP || "/tmp", "chr-"));
  const ch = spawn(process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--mute-audio", `--remote-debugging-port=${dbg}`, `--user-data-dir=${ud}`, `http://127.0.0.1:${port}/`]);
  try {
    let t; for (let i = 0; i < 50 && !t; i++) { await new Promise((r) => setTimeout(r, 300)); try { t = (await (await fetch(`http://127.0.0.1:${dbg}/json`)).json()).find((x) => x.type === "page"); } catch {} }
    const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r)); ws.send(JSON.stringify({ id: 99, method: "Page.navigate", params: { url: `http://127.0.0.1:${port}/` } })); await new Promise((r) => setTimeout(r, 2000));
    const out = await new Promise((resolve) => { ws.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id === 1) resolve(j.result); }; ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: "run()", awaitPromise: true, returnByValue: true } })); });
    const db = (x) => 20 * Math.log10(Math.max(1e-6, x));
    const rows = Object.entries(out.result.value).map(([k, a]) => {
      const rms = db(Math.sqrt(a.reduce((s, x) => s + x.rms ** 2, 0) / a.length)), pk = db(Math.max(...a.map((x) => x.pk)));
      const trim = Math.round(Math.min(TRIM_MAX, Math.max(TRIM_MIN, Math.min(targetOf(k) - rms, PEAK_MAX - pk))) * 2) / 2;
      return { group: k, n: a.length, rmsDb: +rms.toFixed(1), peakDb: +pk.toFixed(1), trimDb: trim, afterDb: +(rms + trim).toFixed(1) };
    });
    if (OUT) fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
    console.log(rows.map((r) => `${r.group.padEnd(22)} rms ${String(r.rmsDb).padStart(6)}  đỉnh ${String(r.peakDb).padStart(5)}  trim ${String(r.trimDb).padStart(5)}  sau ${String(r.afterDb).padStart(6)}`).join("\n"));
    console.log("\n// GROUP_TRIM_DB (dán vào soundMap.ts)\n" + JSON.stringify(Object.fromEntries(rows.filter((r) => r.trimDb !== 0).map((r) => [r.group, r.trimDb]))));
    ws.close();
  } finally { spawn("taskkill", ["/PID", String(ch.pid), "/T", "/F"]); srv.close(); }
});
