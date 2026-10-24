// Đóng gói danh mục LPC (shared/data.ts: LPC_PARTS) cho chế độ "Tự tạo hồn sư": mỗi lớp / thể hình / màu vẽ sẵn của một món là MỘT sheet
// chuẩn game (bố cục LPC_SHEET), đưa vào shared/assets/lpcparts/ kèm manifest.json và ghi công vào art/CREDITS.md (L1 #508).
//   node tools/assets/lpc-parts.mjs --lpc <repo LPC> [--only <mã,mã>] [--out <thư mục>] [--credits <file.md>]   (đóng gói)
//   node tools/assets/lpc-parts.mjs --check                                                                  (kiểm, không cần kho LPC)
//
// Kho LPC (https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator) tải về NGOÀI repo game; chỉ đọc PNG trong
// `spritesheets/` và `CREDITS.csv`, không chạy code của kho đó. Nguồn từng lớp (thư mục theo thể hình) ở art/src/lpc-parts.json.
//
// Mỗi sheet: cột = các khung giữ lại của từng animation (LPC_SHEET.strips: idle 2, walk 6/9, slash 4/6, spellcast 5/7, hurt 5/6),
// hàng = hướng s / e / n (hàng Trái của LPC bỏ; tây do client lật) và hàng hurt (chỉ nhìn xuống). Ảnh KHÔNG đổi màu, không viền, không
// đưa về bảng chung: tô màu (LPC_RAMPS), viền #1a1020 và bảng màu chung làm lúc chạy ở client sau khi ghép các lớp (L3), nếu không
// các món ghép cạnh nhau không đổi màu đồng bộ được. Điều duy nhất làm ở đây là DỜI GỐC: thân LPC (nam / nữ, từng hướng) đo ở khung đứng
// của walk, mọi lớp của cùng thể hình dời cùng số điểm để chân chạm LPC_SHEET.origin (32,58); lớp khác dời khác nhau sẽ lệch nhau.
// PNG-8 (bảng màu + tRNS) khi sheet ≤ 256 màu, không thì giữ RGBA; không lượng tử hóa nên không mất màu.
//
// Ghi công: mỗi file LPC đã đọc tra đúng mục của nó trong CREDITS.csv (file màu `<thư mục>/<animation>/<màu>.png` tra
// `<thư mục>/<animation>.png`), không có hoặc giấy phép không đọc được (ngoài LICENSE_KNOWN) thì dừng. Mỗi món một dòng trong mục
// `### lpc-parts` giữa `<!-- lpc:start -->` / `<!-- lpc:end -->` của art/CREDITS.md; `lic` / `sa` của LPC_PARTS phải khớp kết quả đọc.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { deflateSync } from "node:zlib";
import path from "node:path";
import { ROOT, readPng, decodePng, encodePng, Img, LICENSE_KNOWN, licenseUse, licenseFlags } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 && !!args.splice(i, 1); };
const check = flag("--check"), lpc = opt("--lpc", process.env.LPC_DIR ?? ""), only = opt("--only", ""), outOpt = opt("--out", ""), creditsOpt = opt("--credits", "");
if (args.length) { console.error(`tham số lạ: ${args.join(" ")}`); process.exit(1); }
if (!check && !lpc) { console.error("Cách dùng: lpc-parts.mjs --lpc <repo LPC> [--only <mã,mã>] [--out <thư mục>] [--credits <file.md>] | --check"); process.exit(1); }

const OUT = outOpt || path.join(ROOT, "shared", "assets", "lpcparts");
const CREDITS = creditsOpt || path.join(ROOT, "art", "CREDITS.md");
const SRC_FILE = path.join(ROOT, "art", "src", "lpc-parts.json");
const START = "<!-- lpc:start -->", END = "<!-- lpc:end -->", SECTION = "### lpc-parts (lpc-parts.mjs, hồn sư chế độ Tự tạo)";
let errors = 0;
const err = (m) => { console.error(`✗ ${m}`); errors++; };
const warn = (m) => console.warn(`⚠ ${m}`);
const fail = (m) => { console.error(`✗ ${m}`); process.exit(1); };

// ---------- Đọc shared/data.ts (các khối viết dạng JSON) ----------
const DATA = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
/** Giá trị của `export const <name>[: kiểu] = <JSON>` (đọc đến ngoặc đóng khớp, bỏ dấu phẩy thừa). */
function dataJson(name) {
  const m = new RegExp(`export const ${name}\\b[^=]*=\\s*`).exec(DATA);
  if (!m) fail(`shared/data.ts không có ${name}`);
  let i = m.index + m[0].length;
  const open = DATA[i], close = open === "{" ? "}" : open === "[" ? "]" : fail(`${name}: cần { hoặc [`);
  let depth = 0, inStr = false, j = i;
  for (; j < DATA.length; j++) {
    const c = DATA[j];
    if (inStr) { if (c === "\\") j++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true; else if (c === open) depth++; else if (c === close && --depth === 0) break;
  }
  try { return JSON.parse(DATA.slice(i, j + 1).replace(/,(\s*[\]}])/g, "$1")); } catch (e) { fail(`${name} trong shared/data.ts không phải JSON hợp lệ (${e.message})`); }
}
const SLOTS = dataJson("LPC_SLOTS"), SHEET = dataJson("LPC_SHEET"), RAMPS = dataJson("LPC_RAMPS"), PARTS = dataJson("LPC_PARTS");
const SRC = JSON.parse(readFileSync(SRC_FILE, "utf8"));
const F = SHEET.frame, [OX, OY] = SHEET.origin;
const SEXES = { m: "male", f: "female" };
const STRIPS = Object.entries(SHEET.strips);
const COLS = Math.max(...STRIPS.map(([, s]) => s.col + s.frames.length)), ROWS = Math.max(...Object.values(SHEET.rows)) + 1;
const sexList = (s) => [...s]; // "mf" → ["m", "f"]
const keyOf = (p, sex, z, color) => `lpcp_${p.id.replace(".", "_")}_${sex}_${z}${color ? `_${color}` : ""}`;

/** Các sheet cần có của một món: { key, sex, layer, z, color, dir } (lớp không có cho thể hình đó thì bỏ). */
function sheetsOf(p) {
  const out = [], s = SRC[p.id];
  p.z.forEach((z, li) => sexList(p.sex).forEach((sex) => {
    const dir = s?.[sex]?.[li];
    if (!dir) return;
    for (const color of p.colors.length ? p.colors : [""]) out.push({ key: keyOf(p, sex, z, color), sex, layer: li, z, color, dir });
  }));
  return out;
}

// ---------- Soát danh mục (cả hai chế độ) ----------
const ids = new Set();
for (const p of PARTS) {
  const at = `LPC_PARTS ${p.id}`;
  if (ids.has(p.id)) err(`${at}: trùng mã`);
  ids.add(p.id);
  if (!/^[a-z]+\.[a-z0-9_]+$/.test(p.id) || p.id.split(".")[0] !== p.slot) err(`${at}: mã phải dạng "<ô>.<tên>" khớp slot ${p.slot}`);
  if (!SLOTS[p.slot]) err(`${at}: slot ${p.slot} không có trong LPC_SLOTS`);
  if (!["m", "f", "mf"].includes(p.sex)) err(`${at}: sex ${p.sex}`);
  if (p.idle && !sexList(p.idle).every((x) => p.sex.includes(x))) err(`${at}: idle ${p.idle} ngoài sex ${p.sex}`);
  if (p.mats.length && p.colors.length) err(`${at}: vừa đổi màu (mats) vừa màu vẽ sẵn (colors)`);
  for (const m of p.mats) {
    const [mat, base] = m.split(":");
    if (!RAMPS[mat]?.ramps[base]) err(`${at}: mats ${m} không có trong LPC_RAMPS`);
  }
  if (p.colors.some((c) => !/^[a-z_]+$/.test(c)) || new Set(p.colors).size !== p.colors.length) err(`${at}: colors sai dạng hoặc trùng`);
  if (!p.z.length || !p.lic.length) err(`${at}: thiếu z hoặc lic`);
  const s = SRC[p.id];
  if (!s) err(`${at}: art/src/lpc-parts.json không có nguồn`);
  else for (const sex of sexList(p.sex)) if (s[sex]?.length !== p.z.length || s[sex].every((d) => !d)) err(`${at}: nguồn thể hình ${sex} không khớp z (${p.z.length} lớp)`);
}
for (const id of Object.keys(SRC)) if (!ids.has(id)) err(`art/src/lpc-parts.json: ${id} không có trong LPC_PARTS`);
for (const [mat, r] of Object.entries(RAMPS)) for (const n of r.allow) if (!r.ramps[n]) err(`LPC_RAMPS ${mat}: allow ${n} thiếu dải`);

// ---------- PNG-8 ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (name, body) => {
  const head = Buffer.alloc(8), tail = Buffer.alloc(4), t = Buffer.from(name);
  head.writeUInt32BE(body.length, 0); t.copy(head, 4); tail.writeUInt32BE(crc32(Buffer.concat([t, body])), 0);
  return Buffer.concat([head, body, tail]);
};
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
/** PNG ≤ 256 màu (bảng màu + tRNS, độ sâu 1 / 2 / 4 / 8 bit), không thì RGBA. Điểm trong suốt hẳn thành (0,0,0,0). */
function encodeSmall(img) {
  const pal = new Map(), list = [];
  const idx = new Uint16Array(img.w * img.h);
  for (let i = 0; i < idx.length; i++) {
    const d = img.data, o = i * 4, a = d[o + 3], k = a ? (d[o] << 24 | d[o + 1] << 16 | d[o + 2] << 8 | a) >>> 0 : 0;
    let n = pal.get(k);
    if (n === undefined) { n = list.length; pal.set(k, n); list.push(k); if (list.length > 256) return encodePng(img); }
    idx[i] = n;
  }
  const depth = list.length <= 2 ? 1 : list.length <= 4 ? 2 : list.length <= 16 ? 4 : 8, perByte = 8 / depth, stride = Math.ceil(img.w / perByte);
  const rows = [];
  for (let y = 0; y < img.h; y++) {
    const r = Buffer.alloc(stride);
    for (let x = 0; x < img.w; x++) r[(x / perByte) | 0] |= idx[y * img.w + x] << (8 - depth - (x % perByte) * depth);
    rows.push(r);
  }
  const filtered = (type) => Buffer.concat(rows.map((r, y) => {
    const out = Buffer.alloc(stride + 1); out[0] = type;
    for (let i = 0; i < stride; i++) out[i + 1] = (r[i] - (type === 1 ? (i ? r[i - 1] : 0) : type === 2 ? (y ? rows[y - 1][i] : 0) : 0)) & 255;
    return out;
  }));
  const idat = [0, 1, 2].map((t) => deflateSync(filtered(t), { level: 9 })).reduce((a, b) => (b.length < a.length ? b : a));
  const plte = Buffer.alloc(list.length * 3), trns = Buffer.alloc(list.length);
  list.forEach((k, i) => { plte[i * 3] = k >>> 24; plte[i * 3 + 1] = (k >>> 16) & 255; plte[i * 3 + 2] = (k >>> 8) & 255; trns[i] = k & 255; });
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4); ihdr[8] = depth; ihdr[9] = 3;
  return Buffer.concat([SIG, chunk("IHDR", ihdr), chunk("PLTE", plte), ...(trns.some((a) => a !== 255) ? [chunk("tRNS", trns)] : []), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
const sameImg = (a, b) => { if (a.w !== b.w || a.h !== b.h) return false; for (let i = 0; i < a.data.length; i += 4) { if (a.data[i + 3] !== b.data[i + 3] || (a.data[i + 3] && (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]))) return false; } return true; };

// ---------- Ghi công ----------
const credits = new Map();
function loadCredits(file) {
  for (const line of readFileSync(file, "utf8").split(/\r?\n/).slice(1)) {
    const cells = [...line.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1].replace(/""/g, '"'));
    if (cells.length >= 5) credits.set(cells[0], { authors: cells[2].split(",").map((s) => s.trim()).filter(Boolean), licenses: cells[3].split(",").map((s) => s.trim()).filter(Boolean), urls: cells[4].split(",").map((s) => s.trim()).filter(Boolean) });
  }
}
function creditOf(rel, dir, anim) {
  const plain = `${dir}${anim}.png`, c = credits.get(rel) ?? credits.get(plain);
  if (!c) fail(`[lpc] ${rel}: CREDITS.csv không có mục ${rel === plain ? rel : `${rel} hay ${plain}`}, không rõ tác giả / giấy phép nên không dùng được`);
  const bad = c.licenses.filter((l) => !LICENSE_KNOWN.test(l));
  if (!c.licenses.length || bad.length) fail(`[lpc] ${rel}: không đọc được giấy phép ${c.licenses.join(", ") || "(trống)"} (ngoài CC0 / CC-BY / CC-BY-SA / CC-BY-NC / OGA-BY / OGA-SA / GPL), chọn lớp khác`);
  return c;
}
const rank = (l) => { const f = licenseFlags(l); return (f.includes("NC") ? 3 : 0) + (f.includes("SA") ? 1 : 0) + (f.includes("GPL") ? 2 : 0); };
const cell = (s) => s.replace(/\|/g, "\\|");
/** Dòng ghi công có cờ SA (cờ ghi dạng "(cờ SA)" hoặc "(cờ SA, GPL)"). */
const hasSa = (l) => /\(cờ [^)]*\bSA\b/.test(l);
const uniq = (a) => [...new Set(a)];

// ---------- Chế độ kiểm ----------
if (check) {
  const manifestFile = path.join(OUT, "manifest.json");
  if (!existsSync(manifestFile)) { err(`${path.relative(ROOT, manifestFile)} chưa có: chạy lpc-parts.mjs --lpc <kho LPC>`); process.exit(1); }
  const M = JSON.parse(readFileSync(manifestFile, "utf8"));
  for (const k of ["frame", "origin", "rows", "strips"]) if (JSON.stringify(M[k]) !== JSON.stringify(SHEET[k])) err(`manifest.${k} lệch LPC_SHEET (đóng gói lại)`);
  const want = new Map();
  for (const p of PARTS) for (const s of sheetsOf(p)) want.set(s.key, { p, s });
  let total = 0;
  for (const [key, { p, s }] of want) {
    const m = M.sheets[key];
    if (!m) { err(`manifest thiếu sheet ${key} (món ${p.id})`); continue; }
    const file = path.join(OUT, `${key}.png`);
    if (!existsSync(file)) { err(`thiếu file ${key}.png`); continue; }
    const buf = readFileSync(file);
    if (buf.length !== m.bytes) err(`${key}.png: ${buf.length} byte, manifest ghi ${m.bytes}`);
    if (!buf.subarray(0, 8).equals(SIG) || buf.readUInt32BE(16) !== COLS * F || buf.readUInt32BE(20) !== ROWS * F) err(`${key}.png: cỡ phải ${COLS * F}×${ROWS * F}`);
    if (m.part !== p.id || m.sex !== s.sex || m.z !== s.z || (m.color ?? "") !== s.color) err(`manifest ${key}: part / sex / z / color lệch LPC_PARTS`);
    if (m.idle !== sexList(p.idle).includes(s.sex)) err(`manifest ${key}: idle ${m.idle}, LPC_PARTS.idle của ${p.id} là "${p.idle}"`);
    total += buf.length;
  }
  for (const key of Object.keys(M.sheets)) if (!want.has(key)) err(`manifest có sheet thừa ${key}`);
  if (existsSync(OUT)) for (const f of readdirSync(OUT)) if (f.endsWith(".png") && !want.has(f.slice(0, -4))) err(`${f}: ảnh không thuộc LPC_PARTS`);
  if (M.totalBytes !== total) err(`manifest.totalBytes ${M.totalBytes} ≠ tổng thật ${total}`);
  // Ghi công: mỗi món một dòng, cờ SA khớp.
  const doc = existsSync(CREDITS) ? readFileSync(CREDITS, "utf8") : "", si = doc.indexOf(SECTION);
  if (si < 0 || !doc.includes(START)) err(`art/CREDITS.md chưa có mục "${SECTION}" (chạy lpc-parts.mjs --lpc <kho LPC>)`);
  else {
    const sec = doc.slice(si, doc.indexOf(END, si)).split(/(?=^### )/m)[0];
    const lines = new Map(sec.split("\n").filter((l) => l.startsWith("| `")).map((l) => [l.slice(3, l.indexOf("`", 3)), l]));
    for (const p of PARTS) {
      const l = lines.get(p.id);
      if (!l) err(`art/CREDITS.md: thiếu dòng ghi công của ${p.id}`);
      else if (hasSa(l) !== p.sa) err(`art/CREDITS.md ${p.id}: cờ SA ${hasSa(l)} ≠ LPC_PARTS.sa ${p.sa}`);
      else if (!p.lic.every((x) => l.includes(x))) err(`art/CREDITS.md ${p.id}: giấy phép không khớp LPC_PARTS.lic (${p.lic.join(", ")})`);
    }
    for (const id of lines.keys()) if (!ids.has(id)) err(`art/CREDITS.md: dòng ${id} không có trong LPC_PARTS`);
  }
  const kb = (total / 1024).toFixed(0), mb = (total / 1048576).toFixed(2);
  if (total > SHEET.budgetBytes) warn(`LPC: ${mb} MB vượt mục tiêu ${(SHEET.budgetBytes / 1048576).toFixed(0)} MB (LPC_SHEET.budgetBytes)`);
  console.log(`[lpc-parts] ${PARTS.length} món, ${want.size} sheet, ${kb} KB (${mb} MB; mục tiêu ≤ ${(SHEET.budgetBytes / 1048576).toFixed(0)} MB), ${errors} lỗi`);
  process.exit(errors ? 1 : 0);
}

// ---------- Đóng gói ----------
const SHEETS_DIR = path.join(lpc, "spritesheets");
if (!existsSync(SHEETS_DIR) || !existsSync(path.join(lpc, "CREDITS.csv"))) fail(`--lpc ${lpc}: không thấy spritesheets/ và CREDITS.csv`);
loadCredits(path.join(lpc, "CREDITS.csv"));
// Nếu `--credits` có sẵn thì soát dấu mục LPC trước khi ghi ảnh (như lpc-compose.mjs).
const creditsDoc = existsSync(CREDITS) ? readFileSync(CREDITS, "utf8") : "";
const nS = creditsDoc.split(START).length - 1, nE = creditsDoc.split(END).length - 1;
if (nS > 1 || nS !== nE || (nS && creditsDoc.indexOf(END) < creditsDoc.indexOf(START))) fail(`${CREDITS}: cần đúng một cặp ${START} … ${END} theo thứ tự (đang có ${nS} start, ${nE} end)`);
const wanted = only ? new Set(only.split(",")) : null;
if (wanted) for (const id of wanted) if (!ids.has(id)) fail(`--only: ${id} không có trong LPC_PARTS`);
if (errors) fail(`danh mục sai (${errors} lỗi ở trên), không đóng gói`);

const cache = new Map();
const readSheet = (rel) => { if (!cache.has(rel)) cache.set(rel, existsSync(path.join(SHEETS_DIR, rel)) ? readPng(path.join(SHEETS_DIR, rel)) : null); return cache.get(rel); };
const relOf = (dir, anim, color) => (color ? `${dir}${anim}/${color}.png` : `${dir}${anim}.png`);
const footY = (img, row, col) => { for (let y = F - 1; y >= 0; y--) for (let x = 0; x < F; x++) if (img.alpha(col * F + x, row * F + y) >= 128) return y; fail("khung thân trống, không đo được chân"); };
/** Số điểm dời theo chiều dọc của từng thể hình × hướng: chân thân ở khung đứng của walk chạm origin.y. */
const shift = {};
for (const sex of ["m", "f"]) {
  const body = readSheet(relOf(SRC["body.body"][sex][0], "walk", ""));
  if (!body) fail(`thiếu sheet walk của thân ${sex}`);
  shift[sex] = Object.fromEntries(["s", "e", "n"].map((d) => [d, OY - footY(body, SHEET.srcRows[d], 0)]));
}
const prev = existsSync(path.join(OUT, "manifest.json")) ? JSON.parse(readFileSync(path.join(OUT, "manifest.json"), "utf8")) : null;
const sheets = {}, creditRows = new Map();
if (prev && wanted) Object.assign(sheets, prev.sheets);
if (!wanted && existsSync(OUT)) { // chỉ xóa file của chính công cụ, không đụng file lạ (kẻo --out nhầm thư mục)
  const stray = readdirSync(OUT).filter((f) => f !== "manifest.json" && !/^lpcp_.*.png$/.test(f));
  if (stray.length) fail(`${OUT}: có file lạ (${stray.slice(0, 3).join(", ")}…), không phải thư mục sheet LPC; kiểm --out`);
  for (const f of readdirSync(OUT)) rmSync(path.join(OUT, f));
}
mkdirSync(OUT, { recursive: true });
const ROWS_PX_GUARD = F; // điểm tràn ra ngoài khung (trên hoặc dưới) bị cắt, không tràn sang hàng bên
const clipped = new Map(); // món → số điểm mép trên bị cắt khi dời (khung 64 cố định)
const partCredits = new Map(); // id → { dirs, authors, licenses, urls, uses[] }
const todo = PARTS.filter((p) => !wanted || wanted.has(p.id));
// Ghi công cần cả món không đóng gói lại khi --only: bỏ qua, chỉ cập nhật dòng của món được chọn.
for (const p of todo) {
  const pc = { dirs: [], authors: [], licenses: [], urls: [], use: null, flags: [] };
  partCredits.set(p.id, pc);
  const idleAll = Object.fromEntries(sexList(p.sex).map((sex) => [sex, true]));
  for (const s of sheetsOf(p)) {
    const img = new Img(COLS * F, ROWS * F);
    let hasIdle = true;
    for (const [name, st] of STRIPS) {
      const rel = relOf(s.dir, st.src, s.color), sh = readSheet(rel);
      if (!sh) { if (name === "idle") { hasIdle = false; continue; } fail(`[lpc] ${p.id} (${s.key}): thiếu ${rel}`); }
      const c = creditOf(rel, s.dir, st.src);
      pc.dirs.push(s.dir); pc.authors.push(...c.authors); pc.licenses.push(...c.licenses); pc.urls.push(...c.urls);
      const u = licenseUse(c.licenses);
      if (!pc.use || Math.max(...u.use.map(rank)) > Math.max(...pc.use.map(rank))) pc.use = u.use;
      pc.flags.push(...u.flags);
      for (const dir of name === "hurt" ? ["hurt"] : ["s", "e", "n"]) {
        const sr = SHEET.srcRows[dir], dr = SHEET.rows[dir], dy = shift[s.sex][dir === "hurt" ? "s" : dir];
        st.frames.forEach((fr, i) => {
          if ((fr + 1) * F > sh.w || (sr + 1) * F > sh.h) fail(`[lpc] ${rel}: không có khung ${fr} hàng ${sr} (ảnh ${sh.w}×${sh.h})`);
          let solid = 0;
          for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) {
            const px = sh.get(fr * F + x, sr * F + y);
            if (!px[3]) continue;
            if (px[3] >= 128) solid++;
            if (y + dy < 0 || y + dy >= ROWS_PX_GUARD) { clipped.set(p.id, (clipped.get(p.id) ?? 0) + 1); continue; }
            img.set((st.col + i) * F + x, dr * F + y + dy, px);
          }
          // File màu sẵn hỏng (khung phủ kín điểm đặc, hộp đen / trắng che nhân vật, L0 mục 8).
          if (solid > 0.6 * F * F) fail(`[lpc] ${rel}: khung ${fr} phủ ${solid} / ${F * F} điểm đặc, file hỏng (loại màu này khỏi colors)`);
        });
      }
    }
    const buf = encodeSmall(img);
    if (!sameImg(decodePng(buf), img)) fail(`${s.key}: PNG-8 giải mã không khớp ảnh gốc`);
    writeFileSync(path.join(OUT, `${s.key}.png`), buf);
    sheets[s.key] = { part: p.id, sex: s.sex, z: s.z, ...(s.color ? { color: s.color } : {}), idle: hasIdle, bytes: buf.length };
    idleAll[s.sex] = idleAll[s.sex] && hasIdle;
  }
  const idleNow = sexList(p.sex).filter((x) => idleAll[x]).join("");
  if (idleNow !== p.idle) err(`${p.id}: LPC_PARTS.idle = "${p.idle}", kho LPC có idle cho "${idleNow}"`);
  const calc = uniq(pc.use), calcSa = pc.flags.includes("SA");
  if (calcSa !== p.sa) err(`${p.id}: LPC_PARTS.sa = ${p.sa}, CREDITS.csv cho ${calcSa}`);
  if (calc.join(",") !== p.lic.join(",")) err(`${p.id}: LPC_PARTS.lic = [${p.lic.join(", ")}], CREDITS.csv cho [${calc.join(", ")}]`);
  const flags = uniq(pc.flags);
  creditRows.set(p.id, `| \`${p.id}\` | ${cell(uniq(pc.dirs).map((d) => d.replace(/\/$/, "")).join(", "))} | ${cell(uniq(pc.authors).join(", "))} | ${cell(uniq(pc.licenses).join(", "))} | ${cell(calc.join(", "))}${flags.length ? ` (cờ ${flags.join(", ")})` : ""} | ${uniq(pc.urls).map((u) => `<${u}>`).join(" ")} |`);
}
if (errors) fail(`${errors} lỗi: sửa shared/data.ts rồi chạy lại`);
for (const [id, n] of clipped) warn(`${id}: ${n} điểm ở mép trên khung bị cắt khi dời gốc (đỉnh món chạm y < ${-Math.min(...Object.values(shift.m), ...Object.values(shift.f))})`);

const total = Object.values(sheets).reduce((a, s) => a + s.bytes, 0);
const sorted = Object.fromEntries(Object.entries(sheets).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({
  about: "Sheet LPC của chế độ Tự tạo hồn sư (tools/assets/lpc-parts.mjs, GAME_DESIGN.md mục 5.11). Khóa texture = khóa sheet, file <khóa>.png; bố cục khớp LPC_SHEET trong shared/data.ts. `shift` = số điểm đã dời theo chiều dọc để chân thân chạm gốc, từng thể hình × hướng.",
  frame: SHEET.frame, origin: SHEET.origin, rows: SHEET.rows, strips: SHEET.strips, shift, totalBytes: total, sheets: sorted,
}, null, 1) + "\n");

// ---------- Ghi art/CREDITS.md ----------
const rowsAll = new Map();
if (wanted && creditsDoc.includes(SECTION)) {
  const old = creditsDoc.slice(creditsDoc.indexOf(SECTION), creditsDoc.indexOf(END, creditsDoc.indexOf(SECTION))).split(/(?=^### )/m)[0];
  for (const l of old.split("\n").filter((l) => l.startsWith("| `"))) rowsAll.set(l.slice(3, l.indexOf("`", 3)), l);
}
for (const [id, r] of creditRows) rowsAll.set(id, r);
const body = PARTS.filter((p) => rowsAll.has(p.id)).map((p) => rowsAll.get(p.id));
const nSa = PARTS.filter((p) => p.sa).length;
const block = [SECTION, "",
  "Sheet `shared/assets/lpcparts/lpcp_*.png` (kèm `manifest.json`) đóng gói từ các lớp LPC bằng `tools/assets/lpc-parts.mjs`: chỉ chọn khung và dời gốc, không sửa màu; tác giả, giấy phép, nguồn lấy từ `CREDITS.csv` của kho cho đúng từng file đã đọc (một dòng mỗi món, gộp mọi thể hình / màu / animation của món). Client ghép nhiều lớp thành ảnh nhân vật chế độ Tự tạo nên **ảnh ghép theo giấy phép nghiêm nhất của các món đang mặc**.",
  "", `**Cờ SA (${nSa} món):** ${PARTS.filter((p) => p.sa).map((p) => `\`${p.id}\``).join(", ") || "không có"}. Ảnh ghép có món cờ SA thì cả ảnh theo giấy phép SA của món đó (đã cho phép, mục 5.11 "Asset bên ngoài").`,
  "", "| Món (`LPC_PARTS`) | Lớp LPC (`spritesheets/`) | Tác giả | Giấy phép | Game dùng theo | Nguồn |", "|---|---|---|---|---|---|", ...body, ""].join("\n");
let doc = creditsDoc;
if (!doc.includes(START)) doc = `${doc}${doc && !doc.endsWith("\n") ? "\n" : ""}\n## Asset LPC (Universal LPC Spritesheet Character Generator)\n\n${START}\n${END}\n`;
const [pre, rest] = doc.split(START), [mid, post] = rest.split(END);
const others = mid.split(/(?=^### )/m).filter((s) => s.trim() && !s.startsWith(SECTION));
writeFileSync(CREDITS, `${pre}${START}\n${[...others.map((s) => s.trimEnd() + "\n"), block].join("\n")}${END}${post}`);

const biggest = Object.entries(sheets).sort(([, a], [, b]) => b.bytes - a.bytes).slice(0, 5).map(([k, s]) => `${k} ${(s.bytes / 1024).toFixed(0)} KB`).join(", ");
console.log(`[lpc-parts] ${todo.length} món, ${Object.keys(sheets).length} sheet, ${(total / 1024).toFixed(0)} KB (${(total / 1048576).toFixed(2)} MB; mục tiêu ≤ ${(SHEET.budgetBytes / 1048576).toFixed(0)} MB)`);
console.log(`[lpc-parts] dời gốc ${JSON.stringify(shift)}; lớn nhất: ${biggest}; ghi công → ${path.relative(ROOT, CREDITS)}`);
if (total > SHEET.budgetBytes) warn(`vượt mục tiêu ${(SHEET.budgetBytes / 1048576).toFixed(0)} MB`);
