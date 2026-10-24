// S2 (#548): gọi PixelLab `POST /v2/vfx` (artist lite, ~1 lượt / hiệu ứng) cho sheet hiệu ứng chiêu; tải sheet + json về thư mục nháp.
// Key đọc từ file lúc chạy (PIXELLAB_KEY_FILE, mặc định ~/.config/pixellab/api-key.txt), không in, không ghi.
//   node tools/assets/pixellab-vfx.mjs --name <tên> --desc "<mô tả>" --out <thư mục nháp> [--artist lite|pro]
// Ra: <out>/<tên>.png (sheet), <tên>.json (khung / pivot), <tên>.gif, <tên>.meta.json (usage, canvas, frames, fps, anchor).
// Mỗi lần in lượt dùng (usage của job) và chênh số dư (số dư cập nhật trễ vài giây).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (n, d = "") => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const fail = (m) => { console.error(`[pixellab-vfx] ${m}`); process.exit(1); };
const KEY = readFileSync(opt("--key-file", process.env.PIXELLAB_KEY_FILE ?? path.join(os.homedir(), ".config", "pixellab", "api-key.txt")), "utf8").trim();
const BASE = "https://api.pixellab.ai/v2", H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
async function api(method, p, body) {
  const r = await fetch(BASE + p, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) fail(`${p} ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j;
}
const balance = async () => (await api("GET", "/balance")).subscription?.generations;

const name = opt("--name"), desc = opt("--desc"), out = opt("--out"), artist = opt("--artist", "lite");
if (!name || !desc || !out) fail("cần --name, --desc, --out");
mkdirSync(out, { recursive: true });
const before = await balance(), t0 = Date.now();
let res = await api("POST", "/vfx", { description: desc, artist, name });
const job = res.background_job_id ?? res.data?.background_job_id;
const quoted = res.quoted_generations ?? res.data?.quoted_generations;
if (!job) fail(`không có job: ${JSON.stringify(res).slice(0, 300)}`);
for (;;) {
  await new Promise((r) => setTimeout(r, 6000));
  res = await api("GET", `/background-jobs/${job}`);
  if (res.status === "completed") break;
  if (res.status === "failed") fail(`lỗi: ${JSON.stringify(res.last_response).slice(0, 300)}`);
  if (Date.now() - t0 > 10 * 60000) fail("quá 10 phút");
}
const o = res.last_response ?? res;
const files = o.files ?? {};
const urls = Array.isArray(files) ? files : Object.values(files);
for (const u of urls) {
  const url = typeof u === "string" ? u : u.url;
  if (!url || /\.zip(\?|$)/.test(url)) continue;
  const ext = (url.split("?")[0].match(/\.(png|json|gif)$/) ?? [])[1]; if (!ext) continue;
  const b = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(path.join(out, `${name}${/-normals\.png/.test(url) ? "-normals" : ""}.${ext}`), b);
}
const meta = { name, desc, quoted, usage: o.usage ?? null, canvas: o.canvas, frames: o.frames, fps: o.fps, loop: o.loop, anchor: o.anchor, message: o.message, effect_id: o.effect_id };
writeFileSync(path.join(out, `${name}.meta.json`), JSON.stringify(meta, null, 1));
const after = await balance();
console.log(`[pixellab-vfx] ${name}: quote=${quoted ?? "?"} usage=${JSON.stringify(o.usage ?? null)} ${o.canvas?.w}x${o.canvas?.h} ${o.frames}f@${o.fps} số dư ${before} → ${after} (${Math.round((Date.now() - t0) / 1000)}s)`);
