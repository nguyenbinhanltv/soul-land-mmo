// Biểu tượng pixel từ game-icons.net (CC BY 3.0, ghi tác giả từng icon ở art/CREDITS.md, #625), không dùng AI, không phụ thuộc thư viện:
//   node tools/assets/game-icons-pixel.mjs --import <thư mục icons-master>   chép đúng các SVG trong map vào art/src/game-icons/svg/
//   node tools/assets/game-icons-pixel.mjs [--only <key,key>]   vẽ vào shared/assets/sprites/iso/{item,gi}/ và thêm key còn thiếu vào manifest.json
//   node tools/assets/game-icons-pixel.mjs --out <thư mục> [--preview <thư mục>]   vẽ phẳng vào <thư mục> (không đụng manifest), kèm trang xem trước
//   node tools/assets/game-icons-pixel.mjs --credits   in các dòng CREDITS (tác giả, giấy phép, link) của mọi icon trong map
// Map `art/src/game-icons/icons.json`: { "icons": [{ "key", "src": "<tác giả>/<tên>", "col": "#rrggbb", "frame": "round|square|none", "size": 32|48,
//   "fit": số điểm cạnh tối đa của hình chính (mặc định 20 khi có khung, 28 khi không), "compare": "key sprite hiện có để so (chỉ trang xem trước)" }] }.
// Cách làm (đồng bộ một kiểu với skill-icon.mjs): SVG một màu → tô điểm (lấy mẫu 4×4, ngưỡng 50%, không khử răng cưa) → tô 3 sắc độ từ `col`
// (sáng ở mép trên trái, tối ở mép dưới phải, thân gốc; vùng dày thêm dải sáng→tối theo đường chéo) → viền ngoài #1a1020 → khung tròn / vuông vát
// cùng kiểu skill-icon (nền tối pha màu, vòng màu hệ). Mỗi icon tối đa 5 màu (3 sắc độ + viền + nền khung), không còn màu nào ngoài `col`.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { encodePng, hex, Img, MANIFEST, OUTLINE, ROOT, SPRITES } from "./lib.mjs";

const SRC_DIR = path.join(ROOT, "art", "src", "game-icons");
const SVG_DIR = path.join(SRC_DIR, "svg"), ISO = path.join(SPRITES, "iso");
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); if (i >= 0) args.splice(i, 1); return i >= 0; };
const importDir = opt("--import", ""), outDir = opt("--out", ""), only = opt("--only", ""), preview = opt("--preview", "");
const credits = flag("--credits");

const map = JSON.parse(readFileSync(path.join(SRC_DIR, "icons.json"), "utf8"));
const sel = only ? map.icons.filter((i) => only.split(",").includes(i.key)) : map.icons;
const AUTHORS = JSON.parse(readFileSync(path.join(SRC_DIR, "authors.json"), "utf8")); // thư mục → { name, url, license }
const title = (s) => s.split("-").join(" ");
const credit = (i) => {
  const [a, n] = i.src.split("/"), au = AUTHORS[a];
  return `| \`${i.key}\` | game-icons.net: [${title(n)}](https://game-icons.net/1x1/${a}/${n}.html) | ${au.name} (${au.url}), ${au.license}; tô màu, viền, khung bằng \`tools/assets/game-icons-pixel.mjs\` | 2026-10-25 |`;
};

if (credits) { for (const i of map.icons) console.log(credit(i)); process.exit(0); }
if (importDir) {
  for (const i of map.icons) {
    const from = path.join(importDir, `${i.src}.svg`), to = path.join(SVG_DIR, `${i.src}.svg`);
    if (!existsSync(from)) { console.error(`Thiếu ${from}`); process.exit(1); }
    mkdirSync(path.dirname(to), { recursive: true }); copyFileSync(from, to);
  }
  console.log(`Đã chép ${map.icons.length} SVG vào ${SVG_DIR}`); process.exit(0);
}

// ---------- Vẽ SVG (chỉ lệnh path, một màu) thành mặt nạ ----------
/** Chia đường cong thành đoạn thẳng; trả về các đa giác (mảng điểm [x,y]) trong toạ độ viewBox. */
function flatten(d) {
  const toks = d.match(/[a-zA-Z]|-?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/g) ?? [], polys = [];
  let i = 0, cur = null, x = 0, y = 0, sx = 0, sy = 0, cmd = "", lcx = 0, lcy = 0, lastC = "";
  const num = () => parseFloat(toks[i++]);
  const flag01 = () => { const t = toks[i]; if (t.length > 1 && /^[01]/.test(t)) { toks[i] = t.slice(1); return +t[0]; } i++; return +t; };
  const add = (px, py) => { cur.push([px, py]); x = px; y = py; };
  const cubic = (x1, y1, x2, y2, x3, y3) => { const x0 = x, y0 = y; for (let k = 1; k <= 16; k++) { const t = k / 16, u = 1 - t;
    add(u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3); } lcx = x2; lcy = y2; };
  const quad = (x1, y1, x2, y2) => { const x0 = x, y0 = y; for (let k = 1; k <= 12; k++) { const t = k / 12, u = 1 - t; add(u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2); } lcx = x1; lcy = y1; };
  const arc = (rx, ry, rot, large, sweep, ex, ey) => {
    if (!rx || !ry) return add(ex, ey);
    rx = Math.abs(rx); ry = Math.abs(ry); const ph = rot * Math.PI / 180, c = Math.cos(ph), s = Math.sin(ph);
    const dx = (x - ex) / 2, dy = (y - ey) / 2, x1 = c * dx + s * dy, y1 = -s * dx + c * dy, lam = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const sg = large === sweep ? -1 : 1, q = Math.max(0, (rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1) / (rx * rx * y1 * y1 + ry * ry * x1 * x1));
    const co = sg * Math.sqrt(q), cx1 = co * rx * y1 / ry, cy1 = -co * ry * x1 / rx, cx = c * cx1 - s * cy1 + (x + ex) / 2, cy = s * cx1 + c * cy1 + (y + ey) / 2;
    const ang = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const th = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry); let dth = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
    if (!sweep && dth > 0) dth -= 2 * Math.PI; else if (sweep && dth < 0) dth += 2 * Math.PI;
    const n = Math.max(8, Math.ceil(Math.abs(dth) / (Math.PI / 16)));
    for (let k = 1; k <= n; k++) { const a = th + dth * k / n, ex2 = rx * Math.cos(a), ey2 = ry * Math.sin(a); add(c * ex2 - s * ey2 + cx, s * ex2 + c * ey2 + cy); }
    x = ex; y = ey;
  };
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === "M") { x = ox + num(); y = oy + num(); cur = [[x, y]]; polys.push(cur); sx = x; sy = y; cmd = rel ? "l" : "L"; lastC = ""; continue; }
    if (C === "Z") { if (cur) { cur.push([sx, sy]); x = sx; y = sy; } lastC = ""; continue; }
    if (!cur) throw new Error("path không bắt đầu bằng M");
    if (C === "L") add(ox + num(), oy + num());
    else if (C === "H") add((rel ? x : 0) + num(), y);
    else if (C === "V") add(x, (rel ? y : 0) + num());
    else if (C === "C") { const a = [ox + num(), oy + num(), ox + num(), oy + num(), ox + num(), oy + num()]; cubic(...a); }
    else if (C === "S") { const rx1 = lastC === "C" || lastC === "S" ? 2 * x - lcx : x, ry1 = lastC === "C" || lastC === "S" ? 2 * y - lcy : y; cubic(rx1, ry1, ox + num(), oy + num(), ox + num(), oy + num()); }
    else if (C === "Q") quad(ox + num(), oy + num(), ox + num(), oy + num());
    else if (C === "T") { const qx = lastC === "Q" || lastC === "T" ? 2 * x - lcx : x, qy = lastC === "Q" || lastC === "T" ? 2 * y - lcy : y; quad(qx, qy, ox + num(), oy + num()); }
    else if (C === "A") { const rx = num(), ry = num(), rot = num(), lg = flag01(), sw = flag01(); arc(rx, ry, rot, lg, sw, ox + num(), oy + num()); }
    else throw new Error(`lệnh path lạ: ${cmd}`);
    lastC = C;
  }
  return polys;
}

/** Đọc SVG game-icons: bỏ hình nền đen đầu tiên, gộp mọi path còn lại. Trả về các đa giác toạ độ 0..512. */
function loadSvg(file) {
  const svg = readFileSync(file, "utf8");
  if (/<(g|use)\b[^>]*transform=|<(circle|rect|ellipse|polygon|line)\b/.test(svg.replace(/<path d="M0 0h512v512H0z"\/>/, ""))) throw new Error(`${file}: có phần tử ngoài path / transform, chưa hỗ trợ`);
  const ds = [...svg.matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)].map((m) => m[1]).filter((d) => d.trim() !== "M0 0h512v512H0z");
  return ds.flatMap(flatten);
}

/** Mặt nạ S×S (true = đặc): thu 512 → `fit` điểm, đặt giữa ô, lấy mẫu 4×4, nonzero. */
function rasterize(polys, S, fit) {
  const SS = 4, W = S * SS, k = fit * SS / 512, off = (W - fit * SS) / 2;
  const cov = new Float32Array(S * S);
  for (let sy = 0; sy < W; sy++) {
    const yy = sy + 0.5, xs = [];
    for (const p of polys) for (let j = 0; j + 1 < p.length; j++) {
      const [ax, ay] = p[j], [bx, by] = p[j + 1], y0 = ay * k + off, y1 = by * k + off;
      if ((y0 <= yy) === (y1 <= yy)) continue;
      xs.push([ax * k + off + (yy - y0) / (y1 - y0) * (bx - ax) * k, y1 > y0 ? 1 : -1]);
    }
    xs.sort((a, b) => a[0] - b[0]);
    let wind = 0;
    for (let j = 0; j + 1 < xs.length; j++) {
      wind += xs[j][1];
      if (!wind) continue;
      const from = Math.max(0, Math.round(xs[j][0])), to = Math.min(W, Math.round(xs[j + 1][0]));
      for (let sx = from; sx < to; sx++) cov[(sy / SS | 0) * S + (sx / SS | 0)] += 1 / (SS * SS);
    }
  }
  return Array.from(cov, (c) => c >= 0.5);
}

// ---------- Tô màu, viền, khung ----------
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
function render(def, polys) {
  const S = def.size ?? 32, frame = def.frame ?? "round", k = S / 32, fit = def.fit ?? Math.round((frame === "none" ? 28 : 20) * k);
  const base = hex(def.col), ink = hex(OUTLINE);
  const lo = mix(base, ink, 0.45), hi = mix(base, [255, 255, 255], 0.45);
  const m = rasterize(polys, S, fit), at = (x, y) => x >= 0 && y >= 0 && x < S && y < S && m[y * S + x];
  const img = new Img(S, S), c0 = (S - 1) / 2, R = S / 2;
  const inside = (x, y, r) => {
    if (frame === "round") return Math.hypot(x - c0, y - c0) <= r;
    const q = 5 * k * (r / R), dx = Math.abs(x - c0), dy = Math.abs(y - c0), h = r - 0.5;
    return dx <= h && dy <= h && !(dx > h - q && dy > h - q && dx + dy > 2 * h - q + 0.5);
  };
  if (frame !== "none") {
    const fillC = mix(ink, base, 0.22), ringLo = mix(base, ink, 0.35), ringHi = mix(base, [255, 255, 255], 0.35);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (inside(x, y, R)) img.set(x, y, [...ink, 255]);
      if (inside(x, y, R - k)) img.set(x, y, [...((x + y) < S - 1 ? ringHi : ringLo), 255]);
      if (inside(x, y, R - 2.2 * k)) img.set(x, y, [...ink, 255]);
      if (inside(x, y, R - 3.2 * k)) img.set(x, y, [...fillC, 255]);
    }
  }
  // Độ sâu (khoảng cách tới ngoài) để thêm dải sáng→tối ở vùng dày; hộp bao để chia theo đường chéo.
  let x0 = S, y0 = S, x1 = 0, y1 = 0;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (at(x, y)) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < x0) throw new Error(`${def.key}: hình rỗng`);
  const depth = (x, y) => { let d = 0; while (d < 3 && at(x - d - 1, y) && at(x + d + 1, y) && at(x, y - d - 1) && at(x, y + d + 1)) d++; return d; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (!at(x, y)) { if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) img.set(x, y, [...ink, 255]); continue; }
    let c = base;
    if (!at(x - 1, y) || !at(x, y - 1)) c = hi;
    else if (!at(x + 1, y) || !at(x, y + 1)) c = lo;
    else if (depth(x, y) >= 2) { const t = ((x - x0) + (y - y0)) / Math.max(1, (x1 - x0) + (y1 - y0)); c = t < 0.3 ? hi : t > 0.7 ? lo : base; }
    img.set(x, y, [...c, 255]);
  }
  return img;
}

/** Key `item_<mã>` → iso/item/, key `gi_<tên>` → iso/gi/ (sheetSpec trong lib.mjs); có --out thì ghi phẳng. */
const fileOf = (key) => outDir ? path.join(outDir, `${key}.png`)
  : key.startsWith("item_") ? path.join(ISO, "item", `${key.slice(5)}.png`) : path.join(ISO, "gi", `${key.replace(/^gi_/, "")}.png`);
const done = [];
for (const def of sel) {
  const file = path.join(SVG_DIR, `${def.src}.svg`);
  if (!existsSync(file)) { console.error(`Thiếu ${file}; chạy --import trước.`); process.exit(1); }
  const png = encodePng(render(def, loadSvg(file)));
  mkdirSync(path.dirname(fileOf(def.key)), { recursive: true });
  writeFileSync(fileOf(def.key), png);
  done.push(def);
}
console.log(`Đã vẽ ${done.length} biểu tượng${outDir ? ` vào ${outDir}` : ""}`);
if (!outDir) { // đăng ký key còn thiếu (đường dẫn suy ra từ key, sheetSpec)
  const man = JSON.parse(readFileSync(MANIFEST, "utf8")), have = new Set(man.sprites.map((e) => e.key));
  const add = done.filter((d) => !have.has(d.key));
  if (add.length) { // chèn văn bản ở cuối mảng để giữ nguyên định dạng cả file
    const raw = readFileSync(MANIFEST, "utf8"), eol = raw.includes("\r\n") ? "\r\n" : "\n", end = raw.lastIndexOf(`${eol}  ]`);
    const text = add.map((d) => `    {${eol}      "key": "${d.key}",${eol}      "iso": true${eol}    }`).join(`,${eol}`);
    writeFileSync(MANIFEST, `${raw.slice(0, end)},${eol}${text}${raw.slice(end)}`);
    console.log(`Manifest: thêm ${add.length} key`);
  }
}

if (preview && outDir) {
  mkdirSync(preview, { recursive: true });
  const groups = new Map();
  for (const d of done) { if (!groups.has(d.group)) groups.set(d.group, []); groups.get(d.group).push(d); }
  let html = `<!doctype html><meta charset="utf-8"><title>game-icons: xem trước</title><style>body{background:#d8caa8;font:12px sans-serif;margin:16px;color:#3a3440}h2{margin:18px 0 4px}.g{display:flex;flex-wrap:wrap;gap:10px}.c{background:#ece2c8;padding:6px;text-align:center;width:120px;border:1px solid #b8a888}.c img{image-rendering:pixelated;width:96px;height:96px;object-fit:contain;display:block;margin:0 auto}.c .s img{width:32px;height:32px}.c .p{display:flex;justify-content:center;gap:4px;margin-top:4px}.c .p img{width:auto;height:auto;image-rendering:pixelated}.cmp{outline:1px dashed #8a2018}b{display:block;margin-top:3px;font-size:11px}small{color:#6a6470}</style><h1>Biểu tượng game-icons.net (đề xuất)</h1><p>Ô đỏ nét đứt = biểu tượng hiện có để so. Dưới mỗi ô: bản thật (1×).</p>`;
  for (const [g, list] of groups) {
    html += `<h2>${g ?? ""}</h2><div class="g">`;
    for (const d of list) {
      const S = d.size ?? 32;
      html += `<div class="c">${d.compare ? `<img class="cmp" src="cmp/${d.compare}.png" title="hiện có: ${d.compare}">` : ""}<img src="${path.basename(outDir)}/${d.key}.png"><div class="p"><img src="${path.basename(outDir)}/${d.key}.png" width="${S}" height="${S}"></div><b>${d.label ?? d.key}</b><small>${d.src}</small></div>`;
    }
    html += `</div>`;
  }
  writeFileSync(path.join(preview, "index.html"), html);
  console.log(`Trang xem trước: ${path.join(preview, "index.html")}`);
}
