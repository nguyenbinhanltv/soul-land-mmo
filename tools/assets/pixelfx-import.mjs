// #1802: nhập hiệu ứng pixelfx (patch-gg/pixelfx, MIT) làm sprite sheet. KHÔNG nhúng thư viện chạy ở client (CPU từng pixel):
// xuất sheet offline bằng `node tools/render.mjs <nhóm>/<tên> --sheet --no-actor` của pixelfx, rồi công cụ này cắt: bớt khung (30 → 15 fps),
// cắt vùng chứa chung mọi khung, xếp lưới ≤ 2048 điểm ngang, đổi màu theo bảng hệ (palettes.json = ELEMENT_COL của skillFx.ts) và đăng ký
// khóa `fx_pfx_<tên>` bằng validate.mjs. Sheet thô KHÔNG vào repo (chỉ ở thư mục tạm / artifacts); nguồn, lệnh, seed, bảng màu, SHA256 ở art/src/pixelfx/nguon.json.
//
//   node tools/assets/pixelfx-import.mjs --src <thư mục pixelfx đã npm i> [--spec tools/assets/pixelfx/lo-mau.json] [--only a,b] [--allow-sha]
//   node tools/assets/pixelfx-import.mjs --src <…> --preview <thư mục>   (chỉ xuất bản đã xử lý + meta ra thư mục, không đụng repo; dùng cho xem trước P0)
//   node tools/assets/pixelfx-import.mjs --check                         (không cần pixelfx: so ảnh trong repo với nguon.json + manifest + pixelfx.json)
import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ROOT, SPRITES, MANIFEST, decodePng, encodePng } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PFX_DIR = path.join(HERE, "pixelfx");
export const DEFAULT_SPEC = path.join(PFX_DIR, "lo-mau.json");
export const NGUON = path.join(ROOT, "art/src/pixelfx/nguon.json");
export const META = path.join(SPRITES, "pixelfx.json");
export const FX_DIR = path.join(SPRITES, "iso/fx");
/** Bề ngang tối đa của lưới (điểm): GPU yếu giới hạn texture; hàng nhiều thì xếp xuống dưới. */
export const MAX_W = 2048;
export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

// ---------- Hàm thuần (có test) ----------
const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
const rgb = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const toHex = (v) => "#" + v.map(hex2).join("");
/** Dải 6 mức tối → sáng từ { main, hi, lo } của ELEMENT_COL (pixelfx nhận dải màu qua tùy chọn `palette`). */
export function rampOf({ main, hi, lo }) {
  const L = rgb(lo), M = rgb(main), H = rgb(hi);
  return [mix(L, [0, 0, 0], 0.4), L, mix(L, M, 0.5), M, mix(M, H, 0.5), H].map(toHex);
}

/** Dải 6 mức của từng hệ, đọc từ palettes.json. */
export function loadRamps(file = path.join(PFX_DIR, "palettes.json")) {
  const els = JSON.parse(readFileSync(file, "utf8")).elements;
  return Object.fromEntries(Object.entries(els).map(([k, v]) => [k, rampOf({ main: parseInt(v.main, 16), hi: parseInt(v.hi, 16), lo: parseInt(v.lo, 16) })]));
}

/** Chọn khung: bước `stride`, luôn giữ khung cuối (hiệu ứng một lần kết thúc đúng cảnh cuối), không vượt `max`. */
export function pickFrames(n, stride, max = Infinity) {
  let s = Math.max(1, stride);
  const count = (st) => Math.floor((n - 1) / st) + 1 + ((n - 1) % st ? 1 : 0);
  while (count(s) > max) s++;
  const out = [];
  for (let i = 0; i < n; i += s) out.push(i);
  if (out[out.length - 1] !== n - 1) out.push(n - 1);
  return out;
}

/** Hộp bao nhỏ nhất chứa mọi điểm có alpha > 0 của nhiều ảnh cùng cỡ. null nếu trống. */
export function unionBox(imgs) {
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (const im of imgs) for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) if (im.data[(y * im.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

/** Cắt `box` từ ảnh RGBA { w, h, data }. */
export function cropImg(im, box) {
  const data = new Uint8Array(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) data.set(im.data.subarray(((box.y + y) * im.w + box.x) * 4, ((box.y + y) * im.w + box.x + box.w) * 4), y * box.w * 4);
  return { w: box.w, h: box.h, data };
}

/** Xếp khung vào lưới đầy đủ (hàng cuối thiếu thì chép khung cuối: texture không có ô trống, fxSheet đếm khung theo frameTotal). */
export function packGrid(frames, cw, ch) {
  const cols = Math.max(1, Math.min(frames.length, Math.floor(MAX_W / cw)));
  const rows = Math.ceil(frames.length / cols), w = cols * cw, h = rows * ch, data = new Uint8Array(w * h * 4);
  for (let i = 0; i < cols * rows; i++) {
    const f = frames[Math.min(i, frames.length - 1)], ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch;
    for (let y = 0; y < ch; y++) data.set(f.data.subarray(y * cw * 4, (y + 1) * cw * 4), ((oy + y) * w + ox) * 4);
  }
  return { img: { w, h, data }, cols, rows, total: cols * rows };
}

/** Tách khung ra khỏi sheet của pixelfx theo JSON kiểu Aseprite (frame rect). */
export function splitSheet(sheet, json) {
  return json.frames.map((f) => {
    const { x, y, w, h } = f.frame, data = new Uint8Array(w * h * 4);
    for (let r = 0; r < h; r++) data.set(sheet.data.subarray(((y + r) * sheet.w + x) * 4, ((y + r) * sheet.w + x + w) * 4), r * w * 4);
    return { w, h, data };
  });
}

/**
 * Xử lý một hiệu ứng từ khung thô: chọn khung, cắt chung, xếp lưới. Trả { png, meta } với meta.pivot = điểm chân sau khi cắt (tính từ góc trên trái khung),
 * fps = fps gốc / bước thật (bước thật tính từ số khung đã chọn).
 */
export function processFx(allFrames, pivot, fps, { stride = 2, max = Infinity } = {}) {
  // Bỏ khung trống ở đuôi (hiệu ứng một lần mờ hết trước khi kết thúc): không tốn bộ nhớ ảnh, fxSheet tự mờ dần ở cuối.
  let end = allFrames.length;
  while (end > 1 && !unionBox([allFrames[end - 1]])) end--;
  const frames = allFrames.slice(0, end);
  const idx = pickFrames(frames.length, stride, max), picked = idx.map((i) => frames[i]);
  const box = unionBox(picked);
  if (!box) throw new Error("hiệu ứng trống");
  const cut = picked.map((f) => cropImg(f, box)), g = packGrid(cut, box.w, box.h);
  const span = (frames.length - 1) / Math.max(1, idx.length - 1);
  return { png: encodePng(g.img), meta: { frame: [box.w, box.h], cols: g.cols, rows: g.rows, frames: idx.length, cells: g.total, fps: Math.round((fps / span) * 100) / 100, pivot: [pivot[0] - box.x, pivot[1] - box.y], stride: idx.length > 1 ? idx[1] - idx[0] : 1, src: { frames: frames.length, fps, frame: [frames[0].w, frames[0].h] } } };
}

// ---------- Chạy pixelfx ----------
export const keyOf = (name) => `fx_pfx_${name.replace(/-/g, "_")}`;
const fileOf = (name) => path.join(FX_DIR, `pfx_${name.replace(/-/g, "_")}.png`);

function gitSha(src) {
  const r = spawnSync("git", ["-C", src, "rev-parse", "HEAD"], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : "";
}

/** Lệnh render (mảng đối số, không qua shell) của một mục spec. */
export function renderArgs(e, palettes, out) {
  const a = ["tools/render.mjs", e.id, "--sheet", "--no-actor", "--seed", String(e.seed ?? 1), "--out", out];
  const opts = { ...(e.palette ? { palette: palettes[e.palette] } : {}), ...(e.options ?? {}) }; // options: tùy chọn riêng của hiệu ứng (vd chữ `text` của level-up)
  if (Object.keys(opts).length) a.push("--opts", JSON.stringify(opts));
  return a;
}

function renderOne(src, e, palettes, tmp) {
  const args = renderArgs(e, palettes, tmp), r = spawnSync(process.execPath, args, { cwd: src, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${e.id}: render lỗi\n${r.stdout}${r.stderr}`);
  const name = e.id.split("/")[1], png = readFileSync(path.join(tmp, e.id, `${name}.png`)), json = JSON.parse(readFileSync(path.join(tmp, e.id, `${name}.json`), "utf8"));
  return { png, json, cmd: `node ${args.map((x) => (x === tmp ? "<thư-mục-tạm>" : x)).join(" ")}` };
}

function main() {
  const argv = parseArgv();
  if (argv.check) return check();
  const spec = JSON.parse(readFileSync(argv.spec, "utf8")), only = argv.only ? argv.only.split(",") : null;
  if (!argv.src) throw new Error("thiếu --src <thư mục pixelfx>");
  const sha = gitSha(argv.src);
  if (sha !== spec.sha && !argv.allowSha) throw new Error(`pixelfx ở ${sha || "không phải git"}, spec cần ${spec.sha} (--allow-sha để bỏ qua)`);
  const palettes = loadRamps();
  const tmp = mkdtempSync(path.join(tmpdir(), "pfx-")), nguon = existsSync(NGUON) && !argv.preview ? JSON.parse(readFileSync(NGUON, "utf8")) : { effects: {} }, metaAll = existsSync(META) && !argv.preview ? JSON.parse(readFileSync(META, "utf8")) : {};
  try {
    for (const e of spec.effects) {
      if (only && !only.includes(e.name)) continue;
      const r = renderOne(argv.src, e, palettes, tmp), sheet = decodePng(r.png), frames = splitSheet(sheet, r.json), px = r.json.meta.pixelfx;
      const o = processFx(frames, px.pivot, px.fps, e), key = keyOf(e.name), fx = { ...o.meta, loop: !!px.loop };
      const info = { key, id: e.id, pixelfxSha: sha, cmd: r.cmd, palette: e.palette ?? null, seed: e.seed ?? 1, stride: e.stride ?? 2, rawSha256: sha256(r.png), sha256: sha256(o.png), role: e.role ?? "" };
      if (argv.preview) {
        mkdirSync(argv.preview, { recursive: true });
        writeFileSync(path.join(argv.preview, `${key}.png`), o.png); writeFileSync(path.join(argv.preview, `${key}.json`), JSON.stringify({ ...fx, ...info }, null, 1));
      } else {
        mkdirSync(FX_DIR, { recursive: true }); writeFileSync(fileOf(e.name), o.png);
        register(key, fx, e, info);
        nguon.effects[key] = info; metaAll[key] = fx;
      }
      console.log(`[pixelfx] ${key}  ${fx.frame.join("×")}  ${fx.frames} khung @${fx.fps}fps  ${(o.png.length / 1024).toFixed(0)} KB`);
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  if (!argv.preview) {
    nguon.pixelfx = { repo: "https://github.com/patch-gg/pixelfx", sha: spec.sha, license: "MIT", spec: path.relative(ROOT, argv.spec).split(path.sep).join("/") };
    mkdirSync(path.dirname(NGUON), { recursive: true });
    writeFileSync(NGUON, JSON.stringify(sortKeys(nguon), null, 2) + "\n"); writeFileSync(META, JSON.stringify(sortKeys(metaAll), null, 2) + "\n");
    ensureCredits();
  }
}
function parseArgv() {
  const a = process.argv.slice(2), get = (n) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : ""; };
  return { src: get("--src"), spec: get("--spec") || DEFAULT_SPEC, only: get("--only"), preview: get("--preview"), check: a.includes("--check"), allowSha: a.includes("--allow-sha") };
}
const sortKeys = (o) => ({ ...o, ...(o.effects ? { effects: Object.fromEntries(Object.entries(o.effects).sort(([a], [b]) => a.localeCompare(b))) } : {}) });

function register(key, fx, e, info) {
  const r = spawnSync(process.execPath, [path.join(HERE, "validate.mjs"), "--register", key, "--iso", "--keep-order", "--no-credits", "--frame", fx.frame.join("x"), "--tool", "pixelfx (patch-gg, MIT)", "--prompt", `pixelfx ${e.id}; ${info.cmd}`, "--note", "x"], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stdout + r.stderr);
}

/** Một dòng chung cho cả bộ ở mục "Asset bên ngoài" của CREDITS.md (từng khóa ghi ở nguon.json; MIT cần giữ thông báo bản quyền). */
const CREDITS_ROW = "| `shared/assets/sprites/iso/fx/pfx_*.png` (khóa `fx_pfx_*`, hiệu ứng pixelfx) | patch-gg (pixelfx); Hugo Duprez (Sprite Fusion); rehan-remade (Hollow Crown) | https://github.com/patch-gg/pixelfx | MIT | Xuất sprite sheet offline, bớt khung 30 → 15 fps, cắt vùng chứa, xếp lưới, đổi màu theo bảng hệ; đổi tên theo quy ước `fx_pfx_*`; nguồn từng khóa (SHA commit, lệnh, seed, SHA256): `art/src/pixelfx/nguon.json`. Không dùng phông Patch Pixel (không MIT) |";
export function ensureCredits() {
  const f = path.join(ROOT, "art/CREDITS.md"), raw = readFileSync(f, "utf8"), eol = raw.includes("\r\n") ? "\r\n" : "\n", lines = raw.replace(/\r\n/g, "\n").split("\n");
  const i = lines.findIndex((l) => l.startsWith("| `shared/assets/sprites/iso/fx/pfx_*.png`"));
  if (i >= 0) lines[i] = CREDITS_ROW;
  else {
    let j = lines.indexOf("## Asset bên ngoài") + 1;
    while (j < lines.length && !lines[j].startsWith("|")) j++;
    while (j < lines.length && lines[j].startsWith("|")) j++;
    lines.splice(j, 0, CREDITS_ROW);
  }
  writeFileSync(f, lines.join(eol));
}

function check() {
  const nguon = JSON.parse(readFileSync(NGUON, "utf8")), meta = JSON.parse(readFileSync(META, "utf8")), manifest = JSON.parse(readFileSync(MANIFEST, "utf8")), bad = [];
  const keys = new Set(manifest.sprites.map((e) => (typeof e === "string" ? e : e.key)));
  for (const [key, info] of Object.entries(nguon.effects)) {
    const name = key.replace(/^fx_pfx_/, ""), f = path.join(FX_DIR, `pfx_${name}.png`);
    if (!existsSync(f) || sha256(readFileSync(f)) !== info.sha256) bad.push(`${key}: ảnh lệch SHA256`);
    if (!keys.has(key)) bad.push(`${key}: thiếu trong manifest`);
    const m = meta[key], im = existsSync(f) ? decodePng(readFileSync(f)) : null;
    if (!m) bad.push(`${key}: thiếu trong pixelfx.json`);
    else if (im && (im.w !== m.cols * m.frame[0] || im.h !== m.rows * m.frame[1])) bad.push(`${key}: kích thước ảnh không khớp lưới trong pixelfx.json`);
  }
  for (const k of Object.keys(meta)) if (!nguon.effects[k]) bad.push(`${k}: có trong pixelfx.json nhưng thiếu nguon.json`);
  const doc = readFileSync(path.join(ROOT, "docs/art/nguon-giay-phep.md"), "utf8");
  if (!["Copyright (c) 2026 Patch", "Hugo Duprez", "rehan-remade", "Permission is hereby granted"].every((t) => doc.includes(t))) bad.push("docs/art/nguon-giay-phep.md thiếu thông báo MIT của pixelfx");
  if (bad.length) throw new Error(`pixelfx lệch:\n${bad.join("\n")}`);
  console.log(`[pixelfx] ${Object.keys(nguon.effects).length} hiệu ứng khớp nguon.json, manifest, pixelfx.json`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
