// Nhập ảnh "giả pixel" từ Gemini (hoặc công cụ ảnh AI khác vẽ nhiều vật trên nền đặc) vào dây chuyền asset isometric.
//   node tools/assets/gemini-import.mjs --kind tile|tile-block|honsu|vohon|beast|object|portrait --out <thư mục> <ảnh> [tùy chọn]
//
// Các bước:
//   1. Xóa logo Gemini (ngôi sao trắng mờ ở góc dưới phải): dò phần sao nằm trên nền, dựng lại hình sao và
//      gỡ lớp trắng mờ (tách alpha) cả ở phần đè lên vật; --logo x,y,w,h thì vá vùng đó bằng màu lân cận.
//   2. Xóa nền màu khóa (mặc định màu ở 4 góc, thường #FF00FF) theo ngưỡng, rồi gỡ 2 lớp điểm viền nhiễm hồng.
//   3. Tách vật: thành phần liên thông (mảnh nhỏ gần vật lớn gộp vào vật đó) hoặc lưới --grid cột x hàng.
//   4. Dò cỡ "điểm ảnh giả" theo chu kỳ cạnh (phổ của tổng chênh lệch giữa hai cột / hai hàng kề nhau), cắt lưới
//      thích nghi theo đỉnh cạnh gần nhất (ô AI không đều 5–7 px), mỗi ô lấy màu chủ đạo (medoid: một điểm thật
//      của ô, không nội suy) → ảnh "pixel thật".
//   5. Lượng tử màu: art/palette.gpl (mặc định), auto (median cut ~--colors màu riêng của cả lô) hoặc none.
//   6. Đưa về khung đích bằng lấy mẫu 4×4 điểm mỗi pixel đích rồi chọn màu nhiều phiếu nhất (không nội suy):
//      - tile:       mặt trên hình thoi (bỏ bề dày khối) về đúng --size (mặc định 64x32, tỉ lệ 2:1). Đỉnh thoi dò bằng
//                    cách khớp đường thẳng vào mép trên (bỏ ngọn cỏ nhô lên); thu vào --inset điểm để bỏ viền đen;
//                    --seamless trộn (dither có thứ tự) vùng mép với bản dời nửa chu kỳ để ô ghép liền với chính nó.
//      - tile-block: giữ cả bề dày khối (mép vách, bờ nước), cùng phép chiếu với tile, viền tối về #1a1020.
//      - sprite (honsu 64x64 gốc 32,58; vohon 96x96 gốc 48,74; beast / object 96x96 / 64x64 chân chạm đáy;
//        portrait 64x64 căn giữa): mọi vật trong một lần chạy dùng CHUNG hệ số thu, chân (đáy hộp bao) đặt vào gốc,
//        viền ngoài tối về #1a1020 và thêm viền nơi còn thiếu.
//   7. Ghi <out>/<tên>.png, <out>/_preview.png (phóng --preview, mặc định ×4) và <out>/_report.json (cỡ ô giả,
//      độ phân giải gốc, tỉ lệ thoi, điểm lệch mép ghép); --palette auto ghi thêm <out>/_palette.gpl.
//
// Tùy chọn:
//   --names a,b,…          tên file theo thứ tự đọc (hàng trên → dưới, trái → phải); thiếu thì <kind>_<i>.
//   --grid CxR             tách theo lưới đều C cột × R hàng thay vì thành phần liên thông.
//   --cell auto|<số>       cỡ điểm ảnh giả; số thì dùng lưới đều cỡ đó (1 = ảnh đã là pixel thật).
//   --size WxH             khung đích (tile-block chỉ dùng W và tỉ lệ 2:1 của mặt trên).
//   --anchor x,y           gốc chân trong khung sprite.
//   --palette gpl|auto|none|<file.gpl>   --colors 32 (cho auto).
//   --logo auto|off|x,y,w,h               --key #rrggbb (màu nền; mặc định đọc ở góc ảnh)   --tol 60
//   --inset 1.5            (tile) số điểm ảnh gốc thu vào từ mép thoi để bỏ viền.
//   --seamless on|off      (tile, mặc định on)   --seam-band 0.3 (bề rộng dải trộn, phần của bán kính thoi).
//   --preview 4            hệ số phóng ảnh xem trước (0 = không ghi).
//   --debug                ghi thêm <out>/_native/<tên>.png (ảnh pixel thật trước khi đưa về khung).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { decodePng, encodePng, Img, hex, toHex, readGpl, OUTLINE } from "./lib.mjs";

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const kind = opt("--kind", "tile"), outDir = opt("--out", ""), names = opt("--names", "").split(",").filter(Boolean);
const gridOpt = opt("--grid", ""), cellOpt = opt("--cell", "auto"), sizeOpt = opt("--size", ""), anchorOpt = opt("--anchor", "");
const paletteOpt = opt("--palette", "gpl"), nColors = +opt("--colors", "32"), logoOpt = opt("--logo", "auto");
const keyOpt = opt("--key", ""), tol = +opt("--tol", "60"), inset = +opt("--inset", "1.5");
const seamless = opt("--seamless", "on") === "on", seamBand = +opt("--seam-band", "0.3"), previewScale = +opt("--preview", "4");
const debug = flag("--debug");
const file = args[0];
const KINDS = ["tile", "tile-block", "honsu", "vohon", "beast", "object", "portrait"];
if (!outDir || !file || !KINDS.includes(kind)) {
  console.error(`Cách dùng: gemini-import.mjs --kind ${KINDS.join("|")} --out <thư mục> <ảnh> [--names a,b] [--grid CxR] [--cell auto|N] [--size WxH] [--palette gpl|auto|none]`);
  process.exit(1);
}
const isTile = kind === "tile" || kind === "tile-block";
const DEFAULT_SIZE = { tile: [64, 32], "tile-block": [64, 32], honsu: [64, 64], vohon: [96, 96], beast: [96, 96], object: [64, 64], portrait: [64, 64] };
const [FW, FH] = sizeOpt ? sizeOpt.split("x").map(Number) : DEFAULT_SIZE[kind];
const DEFAULT_ANCHOR = { honsu: [32, 58], vohon: [48, 74] };
const [AX, AY] = anchorOpt ? anchorOpt.split(",").map(Number) : DEFAULT_ANCHOR[kind] ?? [FW >> 1, FH - 2];

// ---------- Màu ----------
const lum = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;
/** Khoảng cách RGB có trọng số (giống normalize.mjs). */
const dist = (a, b) => { const r = (a[0] + b[0]) / 2, dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return (2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db; };
const maxDiff = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
const OUT_RGB = hex(OUTLINE);

// ---------- 1. Logo ----------
/** Màu nền: màu nhiều nhất trong 4 ô 8×8 ở góc ảnh. */
function keyColor(img) {
  if (keyOpt) return hex(keyOpt);
  const votes = new Map();
  for (const [x0, y0] of [[0, 0], [img.w - 8, 0], [0, img.h - 8], [img.w - 8, img.h - 8]])
    for (let y = y0; y < y0 + 8; y++) for (let x = x0; x < x0 + 8; x++) { const p = img.get(x, y), k = `${p[0] >> 3},${p[1] >> 3},${p[2] >> 3}`; votes.set(k, [...(votes.get(k) ?? []), p]); }
  const best = [...votes.values()].sort((a, b) => b.length - a.length)[0];
  return [0, 1, 2].map((i) => Math.round(best.reduce((s, p) => s + p[i], 0) / best.length));
}

/** Alpha nếu điểm là "màu nền trộn trắng" (mọi kênh khớp cùng một alpha 0,15–0,9), không thì −1. */
function paleKey(p, K) {
  const ch = [0, 1, 2].filter((i) => K[i] < 200); // kênh đủ tối để đo alpha (nền #FF00FF: kênh G)
  if (!ch.length) return -1;
  const al = ch.reduce((s, i) => s + (p[i] - K[i]) / (255 - K[i]), 0) / ch.length;
  return al >= 0.15 && al <= 0.9 && [0, 1, 2].every((i) => Math.abs(p[i] - (K[i] + al * (255 - K[i]))) < 22) ? al : -1;
}

/**
 * Logo Gemini: ngôi sao 4 cánh trắng, alpha cố định, góc dưới phải. Điểm trên nền = màu nền trộn trắng theo alpha.
 * Dựng hình sao (|dx|^½ + |dy|^½ ≤ R^½) từ cánh trái / phải / dưới nằm trên nền, rồi gỡ trắng: c = (quan sát − 255α) / (1 − α).
 */
function removeLogo(img, K) {
  if (logoOpt === "off") return null;
  if (logoOpt !== "auto") {
    const [bx, by, bw, bh] = logoOpt.split(",").map(Number);
    return inpaintBox(img, K, bx, by, bw, bh);
  }
  const x0 = Math.floor(img.w * 0.82), y0 = Math.floor(img.h * 0.75), pts = [];
  const overKey = (p) => paleKey(p, K);
  for (let y = y0; y < img.h; y++) for (let x = x0; x < img.w; x++) { const al = overKey(img.get(x, y)); if (al >= 0) pts.push([x, y, al]); }
  if (pts.length < 40) return null;
  const xs = pts.map((p) => p[0]), xL = Math.min(...xs), xR = Math.max(...xs);
  const R = (xR - xL + 1) / 2, cx = (xL + xR + 1) / 2;
  // Tâm dọc: hàng của mũi cánh trái / phải.
  const tips = pts.filter((p) => p[0] <= xL + 2 || p[0] >= xR - 2), cy = tips.reduce((s, p) => s + p[1], 0) / tips.length + 0.5;
  const shape = (x, y) => Math.sqrt(Math.abs(x + 0.5 - cx) / R) + Math.sqrt(Math.abs(y + 0.5 - cy) / R);
  const core = pts.filter((p) => shape(p[0], p[1]) < 0.75).map((p) => p[2]).sort((a, b) => a - b);
  if (core.length < 10) return null;
  const alpha = core[core.length >> 1];
  let n = 0;
  for (let y = Math.floor(cy - R - 2); y <= cy + R + 2; y++) for (let x = Math.floor(cx - R - 2); x <= cx + R + 2; x++) {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
    const v = shape(x, y);
    if (v > 1.12) continue;
    const a = v <= 1 ? alpha : alpha * (1.12 - v) / 0.12; // mép sao khử răng cưa: alpha giảm dần
    const p = img.get(x, y);
    img.set(x, y, [0, 1, 2].map((i) => Math.max(0, Math.min(255, Math.round((p[i] - 255 * a) / (1 - a))))).concat(255));
    n++;
  }
  // Điểm logo trên nền nằm ngoài hình sao dựng lại (mép khử răng cưa, mũi cánh dài hơn) → về màu nền.
  for (let y = Math.floor(cy - R * 1.4); y <= cy + R * 1.4; y++) for (let x = Math.floor(cx - R * 1.4); x <= cx + R * 1.4; x++) {
    if (x >= 0 && y >= 0 && x < img.w && y < img.h && overKey(img.get(x, y)) >= 0) { img.set(x, y, [...K, 255]); n++; }
  }
  return { mode: "auto", center: [Math.round(cx), Math.round(cy)], radius: Math.round(R), alpha: +alpha.toFixed(2), pixels: n };
}

/**
 * Vá một hộp: điểm logo trên nền (nền trộn trắng) về màu nền; điểm nền giữ nguyên làm điểm đã biết (để màu vật
 * không loang ra nền); các điểm còn lại lấy dần màu chủ đạo của điểm kề đã biết (từ ngoài vào trong).
 */
function inpaintBox(img, K, bx, by, bw, bh) {
  const unknown = new Set();
  for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
    const p = img.get(x, y);
    if (paleKey(p, K) >= 0) img.set(x, y, [...K, 255]);
    else if (maxDiff(p, K) > tol) unknown.add(y * img.w + x);
  }
  const total = unknown.size;
  while (unknown.size) {
    const fill = [];
    for (const i of unknown) {
      const x = i % img.w, y = (i / img.w) | 0, nb = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy;
        if ((dx || dy) && X >= 0 && Y >= 0 && X < img.w && Y < img.h && !unknown.has(Y * img.w + X)) nb.push(img.get(X, Y));
      }
      if (nb.length >= 2) fill.push([i, medoid(nb)]);
    }
    if (!fill.length) break;
    for (const [i, c] of fill) { img.set(i % img.w, (i / img.w) | 0, c); unknown.delete(i); }
  }
  return { mode: "box", box: [bx, by, bw, bh], pixels: total, key: toHex(K) };
}

// ---------- 2. Nền ----------
/** Trả về ảnh chỉ còn alpha 0 / 255. */
function removeBackground(img, K) {
  const out = new Img(img.w, img.h, Uint8Array.from(img.data));
  let hasAlpha = false;
  for (let i = 3; i < out.data.length; i += 4) if (out.data[i] < 250) { hasAlpha = true; break; }
  if (hasAlpha) { for (let i = 3; i < out.data.length; i += 4) out.data[i] = out.data[i] >= 128 ? 255 : 0; return out; }
  // "Độ khóa" của điểm: với nền magenta là min(R, B) − G; điểm bị nén JPEG hay sáng tối lệch vẫn bắt được.
  const keyAxis = [0, 1, 2].map((i) => (K[i] > 127 ? 1 : -1));
  const keyness = (p) => Math.min(...[0, 1, 2].filter((i) => keyAxis[i] > 0).map((i) => p[i])) - Math.max(...[0, 1, 2].filter((i) => keyAxis[i] < 0).map((i) => p[i]), 0);
  const kRef = keyness(K);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const p = img.get(x, y);
    if (maxDiff(p, K) <= tol || keyness(p) > kRef * 0.55) out.set(x, y, [0, 0, 0, 0]);
  }
  // Viền nhiễm màu nền: 2 lượt gỡ điểm còn ánh màu khóa nằm sát nền.
  for (let pass = 0; pass < 2; pass++) {
    const drop = [];
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
      if (!out.alpha(x, y) || keyness(out.get(x, y)) <= kRef * 0.15) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X < 0 || Y < 0 || X >= img.w || Y >= img.h || !out.alpha(X, Y); })) drop.push([x, y]);
    }
    for (const [x, y] of drop) out.set(x, y, [0, 0, 0, 0]);
  }
  return out;
}

// ---------- 3. Tách vật ----------
function components(img) {
  const W = img.w, H = img.h, lab = new Int32Array(W * H).fill(-1), comps = [];
  for (let i = 0; i < W * H; i++) {
    if (lab[i] >= 0 || !img.data[i * 4 + 3]) continue;
    const c = { id: comps.length, n: 0, x0: W, y0: H, x1: -1, y1: -1 }, stack = [i];
    lab[i] = c.id;
    while (stack.length) {
      const j = stack.pop(), x = j % W, y = (j / W) | 0;
      c.n++; c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy, k = Y * W + X;
        if (X >= 0 && Y >= 0 && X < W && Y < H && lab[k] < 0 && img.data[k * 4 + 3]) { lab[k] = c.id; stack.push(k); }
      }
    }
    comps.push(c);
  }
  return { lab, comps };
}

/** Danh sách vật: { img (cắt theo hộp bao, chỉ điểm của vật), x0, y0 }. */
function splitItems(img) {
  const W = img.w, H = img.h;
  const crop = (x0, y0, x1, y1, keep) => {
    const out = new Img(x1 - x0 + 1, y1 - y0 + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (keep(x, y)) out.set(x - x0, y - y0, img.get(x, y));
    return { img: out, x0, y0, x1, y1 };
  };
  if (gridOpt) {
    const [C, R] = gridOpt.split("x").map(Number), items = [];
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const cx0 = Math.floor((c * W) / C), cx1 = Math.floor(((c + 1) * W) / C) - 1, cy0 = Math.floor((r * H) / R), cy1 = Math.floor(((r + 1) * H) / R) - 1;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) if (img.alpha(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      if (x1 < 0) { console.warn(`[gemini] ô lưới (${c},${r}) trống, bỏ qua`); continue; }
      items.push(crop(x0, y0, x1, y1, (x, y) => img.alpha(x, y)));
    }
    return items;
  }
  const { lab, comps } = components(img);
  const big = Math.max(...comps.map((c) => c.n));
  const main = comps.filter((c) => c.n >= big * 0.05);
  // Mảnh nhỏ (ngọn cỏ rời, hạt bụi) nằm trong hộp bao nới rộng của một vật lớn thì gộp vào vật đó, còn lại bỏ.
  const owner = new Int32Array(comps.length).fill(-1);
  for (const m of main) owner[m.id] = m.id;
  for (const c of comps) {
    if (owner[c.id] >= 0) continue;
    const m = main.find((m) => { const px = (m.x1 - m.x0) * 0.08, py = (m.y1 - m.y0) * 0.08; return c.x0 >= m.x0 - px && c.x1 <= m.x1 + px && c.y0 >= m.y0 - py && c.y1 <= m.y1 + py; });
    if (m) { owner[c.id] = m.id; m.x0 = Math.min(m.x0, c.x0); m.x1 = Math.max(m.x1, c.x1); m.y0 = Math.min(m.y0, c.y0); m.y1 = Math.max(m.y1, c.y1); }
  }
  // Thứ tự đọc: gom hàng theo tâm dọc (lệch < nửa chiều cao trung vị), trong hàng xếp trái → phải.
  const medH = main.map((m) => m.y1 - m.y0).sort((a, b) => a - b)[main.length >> 1];
  main.sort((a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2);
  const rows = [];
  for (const m of main) { const row = rows.find((r) => Math.abs((r[0].y0 + r[0].y1) / 2 - (m.y0 + m.y1) / 2) < medH / 2); if (row) row.push(m); else rows.push([m]); }
  return rows.flatMap((r) => r.sort((a, b) => a.x0 - b.x0)).map((m) => crop(m.x0, m.y0, m.x1, m.y1, (x, y) => owner[lab[y * W + x]] === m.id));
}

// ---------- 4. Điểm ảnh giả → pixel thật ----------
/** Tổng chênh lệch giữa cột x−1 và x (hoặc hàng) trên các cặp điểm cùng đục. */
function edgeProfile(img, vertical) {
  const n = vertical ? img.h : img.w, m = vertical ? img.w : img.h, sig = new Float64Array(n);
  for (let a = 1; a < n; a++) for (let b = 0; b < m; b++) {
    const [x, y, X, Y] = vertical ? [b, a, b, a - 1] : [a, b, a - 1, b];
    if (!img.alpha(x, y) || !img.alpha(X, Y)) continue;
    sig[a] += maxDiff(img.get(x, y), img.get(X, Y));
  }
  return sig;
}
const PERIODS = Array.from({ length: 441 }, (_, i) => 2 + i * 0.05);
/** Phổ công suất của tín hiệu cạnh theo chu kỳ 2–24 px (chuẩn hóa theo năng lượng để các vật cộng được với nhau). */
function spectrum(sig) {
  const mean = sig.reduce((s, v) => s + v, 0) / sig.length, norm = Math.sqrt(sig.reduce((s, v) => s + (v - mean) ** 2, 0) * sig.length) || 1;
  return PERIODS.map((P) => {
    let re = 0, im = 0;
    for (let i = 0; i < sig.length; i++) { const v = sig[i] - mean, t = (2 * Math.PI * i) / P; re += v * Math.cos(t); im += v * Math.sin(t); }
    return Math.hypot(re, im) / norm;
  });
}
/** Chu kỳ cơ bản: chu kỳ thật P có họa âm ở P/2, P/3…, nên chọn đỉnh mạnh (≥ 45% đỉnh lớn nhất) có chu kỳ lớn nhất. */
function pickPeriod(power) {
  const peaks = PERIODS.map((P, i) => [P, power[i]]).filter(([, v], i) => i > 0 && i < power.length - 1 && v >= power[i - 1] && v >= power[i + 1]);
  const best = Math.max(...peaks.map((p) => p[1]));
  const strong = peaks.filter((p) => p[1] >= best * 0.45 && p[0] >= 3);
  return strong.length ? Math.max(...strong.map((p) => p[0])) : 1;
}
/**
 * Cỡ ô giả chung của cả ảnh (một ảnh AI dùng một cỡ): cộng phổ cột và hàng của mọi vật rồi chọn đỉnh.
 * Vật ít chi tiết (ô tuyết) tự dò riêng hay ra họa âm sai, dò chung thì ổn định.
 */
function commonPeriod(imgs) {
  const sum = PERIODS.map(() => 0);
  for (const img of imgs) for (const v of [false, true]) spectrum(edgeProfile(img, v)).forEach((p, i) => (sum[i] += p));
  return pickPeriod(sum);
}
/**
 * Đường cắt thích nghi: mỗi bước tìm đỉnh cạnh trong [0,7P; 1,35P] kể từ đường cắt trước, ưu tiên đỉnh gần đúng P
 * (trọng số Gauss), không có đỉnh rõ thì đi đúng P. Vùng ít chi tiết nhờ vậy không bị kéo giãn theo nhiễu.
 */
function cuts(sig, P, fixed) {
  const n = sig.length, out = [0];
  if (fixed) { for (let x = P; x < n; x += P) out.push(Math.round(x)); out.push(n); return [...new Set(out)]; }
  const thr = (sig.reduce((s, v) => s + v, 0) / n) * 0.5;
  let x = 0;
  while (x + P * 1.35 < n) {
    const lo = Math.max(x + 1, Math.round(x + 0.7 * P)), hi = Math.min(n - 1, Math.round(x + 1.35 * P));
    let best = -1, bv = -1;
    for (let i = lo; i <= hi; i++) { const v = sig[i] * Math.exp(-(((i - x - P) / (0.3 * P)) ** 2)); if (v > bv) { bv = v; best = i; } }
    x = sig[best] > thr ? best : Math.round(x + P);
    out.push(x);
  }
  out.push(n);
  return out;
}
/** Medoid: điểm có tổng khoảng cách tới các điểm khác nhỏ nhất (màu chủ đạo, là màu thật của ô). */
function medoid(ps) {
  if (ps.length <= 2) return ps[0];
  let best = ps[0], bd = Infinity;
  for (const p of ps) { let d = 0; for (const q of ps) d += Math.sqrt(dist(p, q)); if (d < bd) { bd = d; best = p; } }
  return best;
}
function defake(img, P) {
  const fixed = cellOpt !== "auto";
  if (P <= 1) return { img, cell: [1, 1] };
  const cx = cuts(edgeProfile(img, false), P, fixed), cy = cuts(edgeProfile(img, true), P, fixed);
  const out = new Img(cx.length - 1, cy.length - 1);
  for (let j = 0; j < out.h; j++) for (let i = 0; i < out.w; i++) {
    const x0 = cx[i], x1 = cx[i + 1], y0 = cy[j], y1 = cy[j + 1];
    // Bỏ 1 điểm sát mép ô (vùng nhòe giữa hai ô) khi ô đủ lớn.
    const sx = x1 - x0 >= 4 ? 1 : 0, sy = y1 - y0 >= 4 ? 1 : 0, ps = [];
    let opaque = 0, total = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      total++;
      if (!img.alpha(x, y)) continue;
      opaque++;
      if (x >= x0 + sx && x < x1 - sx && y >= y0 + sy && y < y1 - sy) ps.push(img.get(x, y));
    }
    if (opaque * 2 <= total) continue;
    if (!ps.length) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (img.alpha(x, y)) ps.push(img.get(x, y));
    out.set(i, j, medoid(ps));
  }
  return { img: out, cell: [+(img.w / out.w).toFixed(2), +(img.h / out.h).toFixed(2)] };
}

// ---------- 5. Bảng màu ----------
/** Median cut rồi tinh chỉnh k-means 6 vòng. */
function medianCut(pixels, n) {
  let boxes = [pixels];
  while (boxes.length < n) {
    let bi = -1, bc = 0, br = 0;
    boxes.forEach((b, i) => { if (b.length < 2) return; for (let c = 0; c < 3; c++) { let lo = 255, hi = 0; for (const p of b) { lo = Math.min(lo, p[c]); hi = Math.max(hi, p[c]); } if (hi - lo > br) { br = hi - lo; bi = i; bc = c; } } });
    if (bi < 0) break;
    const b = boxes[bi].sort((p, q) => p[bc] - q[bc]), mid = b.length >> 1;
    boxes.splice(bi, 1, b.slice(0, mid), b.slice(mid));
  }
  let cents = boxes.map((b) => [0, 1, 2].map((c) => Math.round(b.reduce((s, p) => s + p[c], 0) / b.length)));
  for (let it = 0; it < 6; it++) {
    const acc = cents.map(() => [0, 0, 0, 0]);
    for (const p of pixels) { const k = nearestIdx(p, cents); acc[k][0] += p[0]; acc[k][1] += p[1]; acc[k][2] += p[2]; acc[k][3]++; }
    cents = cents.map((c, k) => (acc[k][3] ? [0, 1, 2].map((i) => Math.round(acc[k][i] / acc[k][3])) : c));
  }
  return cents;
}
function nearestIdx(p, pal) { let bi = 0, bd = Infinity; for (let i = 0; i < pal.length; i++) { const d = dist(p, pal[i]); if (d < bd) { bd = d; bi = i; } } return bi; }
function buildPalette(natives) {
  if (paletteOpt === "none") return null;
  if (paletteOpt === "auto") {
    const px = [];
    for (const img of natives) for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3]) px.push([img.data[i], img.data[i + 1], img.data[i + 2]]);
    const pal = medianCut(px, nColors);
    if (!isTile || kind === "tile-block") pal.push(OUT_RGB);
    return pal;
  }
  return (paletteOpt === "gpl" ? readGpl() : readGpl(paletteOpt)).map(hex);
}
function quantize(img, pal) {
  if (!pal) return img;
  const out = new Img(img.w, img.h), memo = new Map();
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!img.alpha(x, y)) continue;
    const p = img.get(x, y), k = (p[0] << 16) | (p[1] << 8) | p[2];
    if (!memo.has(k)) memo.set(k, pal[nearestIdx(p, pal)]);
    out.set(x, y, [...memo.get(k), 255]);
  }
  return out;
}

// ---------- 6. Đưa về khung ----------
const SS = 4; // lấy mẫu 4×4 điểm mỗi pixel đích
/** Màu nhiều phiếu nhất trong vùng nguồn của pixel đích; `map(u, v)` → điểm nguồn (số thực). */
function voteSample(src, u0, v0, map, needOpaque) {
  const votes = new Map();
  let clear = 0;
  for (let j = 0; j < SS; j++) for (let i = 0; i < SS; i++) {
    const [sx, sy] = map(u0 + (i + 0.5) / SS, v0 + (j + 0.5) / SS), X = Math.floor(sx), Y = Math.floor(sy);
    if (X < 0 || Y < 0 || X >= src.w || Y >= src.h || !src.alpha(X, Y)) { clear++; continue; }
    const p = src.get(X, Y), k = (p[0] << 16) | (p[1] << 8) | p[2];
    votes.set(k, (votes.get(k) ?? 0) + 1);
  }
  if (!votes.size || (!needOpaque && clear * 2 > SS * SS)) return null;
  const k = [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return [k >> 16, (k >> 8) & 255, k & 255, 255];
}

/** Mặt trên thoi: khớp đường thẳng vào mép trên hai nửa (bỏ ngọn cỏ nhô lên), suy ra 4 đỉnh và bề dày khối. */
function tileGeometry(img) {
  const top = [], bot = [];
  let xmin = img.w, xmax = -1;
  for (let x = 0; x < img.w; x++) {
    let t = -1, b = -1;
    for (let y = 0; y < img.h; y++) if (img.alpha(x, y)) { if (t < 0) t = y; b = y; }
    top.push(t); bot.push(b);
    if (t >= 0) { xmin = Math.min(xmin, x); xmax = Math.max(xmax, x); }
  }
  const half = (xmax + 1 - xmin) / 2, xc = xmin + half;
  const fit = (x0, x1, prof, above) => {
    let pts = [];
    for (let x = Math.ceil(x0); x <= x1; x++) if (prof[x] >= 0) pts.push([x + 0.5, prof[x] + (above ? 0 : 1)]);
    let m = 0, c = 0;
    for (let it = 0; it < 5; it++) {
      const n = pts.length, sx = pts.reduce((s, p) => s + p[0], 0), sy = pts.reduce((s, p) => s + p[1], 0);
      const sxx = pts.reduce((s, p) => s + p[0] * p[0], 0), sxy = pts.reduce((s, p) => s + p[0] * p[1], 0);
      m = (n * sxy - sx * sy) / (n * sxx - sx * sx); c = (sy - m * sx) / n;
      // Ngọn cỏ / đá nhô ra khỏi mép (trên mép trên, dưới mép dưới) là điểm ngoại lai.
      const keep = pts.filter(([x, y]) => { const r = (y - (m * x + c)) * (above ? 1 : -1); return r > -1.2 && r < 2.5; });
      if (keep.length < 4 || keep.length === pts.length) break;
      pts = keep;
    }
    return [m, c];
  };
  const [mL, cL] = fit(xmin + 0.15 * half, xc - 0.15 * half, top, true), [mR, cR] = fit(xc + 0.15 * half, xmax - 0.15 * half, top, true);
  const tx = (cR - cL) / (mL - mR), T = [tx, mL * tx + cL];
  const L = [xmin, mL * xmin + cL], R = [xmax + 1, mR * (xmax + 1) + cR], B = [L[0] + R[0] - T[0], L[1] + R[1] - T[1]];
  // Bề dày: mép dưới khối so với cạnh dưới mặt trên (L→B và B→R), lấy trung vị trên cả hai nửa.
  const th = [];
  for (let x = Math.ceil(xmin + 0.15 * half); x <= xmax - 0.15 * half; x++) {
    if (bot[x] < 0 || (x > xc - 0.15 * half && x < xc + 0.15 * half)) continue;
    const X = x + 0.5, edge = X < B[0] ? L[1] + ((B[1] - L[1]) * (X - L[0])) / (B[0] - L[0]) : B[1] + ((R[1] - B[1]) * (X - B[0])) / (R[0] - B[0]);
    th.push(bot[x] + 1 - edge);
  }
  th.sort((a, b) => a - b);
  return { L, T, R, B, thick: Math.max(0, th[th.length >> 1] ?? 0) };
}

/** Thoi pixel đích: tâm điểm ảnh (x+0,5; y+0,5) nằm hẳn trong thoi W×H (không bao giờ nằm đúng mép nên các ô lát kín không chồng). */
const inDiamond = (x, y, W, H) => Math.abs(x + 0.5 - W / 2) / (W / 2) + Math.abs(y + 0.5 - H / 2) / (H / 2) < 1;
/** Tọa độ thoi (a: trục xuống phải, b: trục xuống trái), mỗi trục −1…1. */
const isoAB = (x, y, W, H) => { const dx = (x + 0.5 - W / 2) / (W / 2), dy = (y + 0.5 - H / 2) / (H / 2); return [dx + dy, dy - dx]; };
/** Lấy điểm (x,y) trên mặt phẳng lát kín bằng chính ô (gói a, b về −1…1). */
function wrapGet(t, x, y) {
  const W = t.w, H = W / 2;
  let [a, b] = isoAB(x, y, W, H);
  a = ((((a + 1) % 2) + 2) % 2) - 1; b = ((((b + 1) % 2) + 2) % 2) - 1;
  const X = Math.floor(W / 2 + ((a - b) * W) / 4), Y = Math.floor(H / 2 + ((a + b) * H) / 4);
  return t.get(Math.max(0, Math.min(W - 1, X)), Math.max(0, Math.min(H - 1, Y)));
}
/** Độ lệch mép ghép: chênh màu trung bình qua mép ô (lát với chính nó) chia cho chênh màu giữa hai điểm kề bên trong. */
function seamScore(t) {
  const W = t.w, H = W / 2;
  let se = 0, sn = 0, ie = 0, iN = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inDiamond(x, y, W, H)) continue;
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const X = x + dx, Y = y + dy, d = Math.sqrt(dist(t.get(x, y), inDiamond(X, Y, W, H) ? t.get(X, Y) : wrapGet(t, X, Y)));
      if (inDiamond(X, Y, W, H)) { ie += d; iN++; } else { se += d; sn++; }
    }
  }
  return +((se / sn) / (ie / iN || 1)).toFixed(2);
}
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
/**
 * Làm liền mép: mỗi trục (a rồi b) trộn ô với bản dời nửa chu kỳ theo trục đó; dải sát mép lấy bản dời (liền
 * qua mép vì đó là phần giữa ô), vào trong lấy dần ô gốc theo dither Bayer 4×4 (không tạo màu mới).
 */
function makeSeamless(t) {
  const W = t.w, H = W / 2;
  for (const axis of [0, 1]) {
    const src = new Img(W, H, Uint8Array.from(t.data));
    // Dời nửa chu kỳ theo trục a là (W/4, H/4), theo trục b là (−W/4, H/4).
    const ox = axis ? -W / 4 : W / 4, oy = H / 4;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!inDiamond(x, y, W, H)) continue;
      const v = Math.abs(isoAB(x, y, W, H)[axis]), w = Math.min(1, Math.max(0, (v - (1 - seamBand)) / seamBand));
      if (w > BAYER[(y & 3) * 4 + (x & 3)]) t.set(x, y, wrapGet(src, x + ox, y + oy));
    }
  }
}
/** Điểm rất tối sát mép thoi (sót viền đen) lấy màu nhiều nhất của điểm kề không tối. */
function scrubOutline(t) {
  const W = t.w, H = t.h, med = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (t.alpha(x, y)) med.push(lum(t.get(x, y)));
  med.sort((a, b) => a - b);
  const dark = Math.min(50, med[med.length >> 1] * 0.45);
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!t.alpha(x, y) || lum(t.get(x, y)) >= dark) continue;
    const [a, b] = isoAB(x, y, W, H);
    if (Math.max(Math.abs(a), Math.abs(b)) < 0.85) continue;
    const nb = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && t.alpha(X, Y) && lum(t.get(X, Y)) >= dark) nb.push(t.get(X, Y)); }
    if (nb.length) t.set(x, y, medoid(nb));
  }
}

function renderTile(nat, g) {
  const C = [(g.L[0] + g.R[0]) / 2, (g.L[1] + g.R[1]) / 2];
  // Thu vào `inset` điểm theo khoảng cách vuông góc từ tâm tới cạnh thoi.
  const hw = (g.R[0] - g.L[0]) / 2, hh = (g.B[1] - g.T[1]) / 2, edge = (hw * hh) / Math.hypot(hw, hh);
  const s = kind === "tile" ? 1 - inset / edge : 1;
  const [L, T, R] = [g.L, g.T, g.R].map((v) => [C[0] + (v[0] - C[0]) * s, C[1] + (v[1] - C[1]) * s]);
  const W = FW, H = FW / 2;
  // Điểm đích (u, v) = L + α(T − L) + β(R − T), với α = u/W − (v − H/2)/H, β = u/W + (v − H/2)/H.
  const map = (u, v) => { const al = u / W - (v - H / 2) / H, be = u / W + (v - H / 2) / H; return [L[0] + al * (T[0] - L[0]) + be * (R[0] - T[0]), L[1] + al * (T[1] - L[1]) + be * (R[1] - T[1])]; };
  if (kind === "tile") {
    const t = new Img(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inDiamond(x, y, W, H)) { const c = voteSample(nat, x, y, map, true); if (c) t.set(x, y, c); }
    fillHoles(t);
    scrubOutline(t);
    const before = seamScore(t);
    if (seamless) makeSeamless(t);
    return { out: t, seam: { before, after: seamless ? seamScore(t) : before } };
  }
  // Khối: thoi trên + hai mặt bên cao `th` pixel đích (cùng hệ số dọc với mặt trên).
  const th = Math.round((g.thick * H) / (g.B[1] - g.T[1])), t = new Img(W, H + th);
  for (let y = 0; y < H + th; y++) for (let x = 0; x < W; x++) {
    const dy = y + 0.5 - H / 2, down = Math.max(0, Math.min(th, dy));
    if (Math.abs(x + 0.5 - W / 2) / (W / 2) + Math.abs(dy - down) / (H / 2) >= 1) continue;
    const c = voteSample(nat, x, y, map, true);
    if (c) t.set(x, y, lum(c) < 40 ? [...OUT_RGB, 255] : c);
  }
  return { out: t, thickPx: th };
}
/** Điểm trống trong thoi (lấy mẫu rơi vào lỗ) lấy màu nhiều nhất của điểm kề. */
function fillHoles(t) {
  const W = t.w, H = t.h;
  for (let pass = 0; pass < 4; pass++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (t.alpha(x, y) || !inDiamond(x, y, W, H)) continue;
    const nb = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && t.alpha(X, Y)) nb.push(t.get(X, Y)); }
    if (nb.length) t.set(x, y, medoid(nb));
  }
}

function bboxOf(img) {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.alpha(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}
/** Sprite: chân (đáy hộp bao, giữa ngang) vào gốc, hệ số thu `s` chung cả lô; portrait căn giữa khung. */
function renderSprite(nat, s) {
  const b = bboxOf(nat), t = new Img(FW, FH);
  const portrait = kind === "portrait";
  const cx = (b.x0 + b.x1 + 1) / 2, cy = portrait ? (b.y0 + b.y1 + 1) / 2 : b.y1 + 1, ax = portrait ? FW / 2 : AX, ay = portrait ? FH / 2 : AY + 1;
  const map = (u, v) => [cx + (u - ax) / s, cy + (v - ay) / s];
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const c = voteSample(nat, x, y, map, false); if (c) t.set(x, y, c); }
  addOutline(t);
  const lost = cx - (ax / s) > b.x0 + 0.5 || cx + (FW - ax) / s < b.x1 + 0.5 || cy - ay / s > b.y0 + 0.5;
  return { out: t, lost };
}
/** Điểm tối ở mép ngoài → #1a1020; mép ngoài còn sáng thì thêm viền #1a1020 ra ngoài 1 điểm. */
function addOutline(t) {
  const W = t.w, H = t.h, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const clear = (x, y) => x < 0 || y < 0 || x >= W || y >= H || !t.alpha(x, y);
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (clear(x, y) || !N4.some(([dx, dy]) => clear(x + dx, y + dy))) continue;
    if (lum(t.get(x, y)) < 70) { t.set(x, y, [...OUT_RGB, 255]); continue; }
    for (const [dx, dy] of N4) if (clear(x + dx, y + dy) && x + dx >= 0 && y + dy >= 0 && x + dx < W && y + dy < H) add.push([x + dx, y + dy]);
  }
  for (const [x, y] of add) t.set(x, y, [...OUT_RGB, 255]);
}

// ---------- 7. Xuất ----------
function contactSheet(imgs, scale) {
  const gap = 4, cols = Math.min(imgs.length, isTile ? 4 : 8);
  const cw = Math.max(...imgs.map((i) => i.w)), chh = Math.max(...imgs.map((i) => i.h)), rows = Math.ceil(imgs.length / cols);
  const W = (cols * (cw + gap) + gap) * scale, H = (rows * (chh + gap) + gap) * scale, out = new Img(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out.set(x, y, (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? [200, 200, 200, 255] : [235, 235, 235, 255]);
  imgs.forEach((img, n) => {
    const ox = gap + (n % cols) * (cw + gap), oy = gap + Math.floor(n / cols) * (chh + gap);
    for (let y = 0; y < img.h * scale; y++) for (let x = 0; x < img.w * scale; x++) {
      const p = img.get(Math.floor(x / scale), Math.floor(y / scale));
      if (p[3]) out.set(ox * scale + x, oy * scale + y, p);
    }
  });
  return out;
}

// ---------- Chạy ----------
const raw = decodePng(readFileSync(file));
const K = keyColor(raw);
const logo = removeLogo(raw, K);
const clean = removeBackground(raw, K);
const items = splitItems(clean);
if (!items.length) { console.error(`${file}: không tìm thấy vật nào sau khi xóa nền`); process.exit(1); }
const P = cellOpt === "auto" ? commonPeriod(items.map((it) => it.img)) : +cellOpt;
const nat = items.map((it) => ({ ...it, ...defake(it.img, P) }));
const pal = buildPalette(nat.map((n) => n.img));
const q = nat.map((n) => quantize(n.img, pal));

// Sprite: hệ số thu chung = vừa vật lớn nhất (cao tới đỉnh khung trừ 2 điểm, rộng trừ 2 điểm mỗi bên); không phóng to.
let s = 1;
if (!isTile) {
  const bs = q.map(bboxOf), maxW = Math.max(...bs.map((b) => b.w)), maxH = Math.max(...bs.map((b) => b.h));
  const room = kind === "portrait" ? FH - 4 : AY + 1 - 2;
  s = Math.min(1, room / maxH, (FW - 4) / maxW);
}

mkdirSync(outDir, { recursive: true });
const report = { source: path.resolve(file), kind, size: [FW, FH], key: toHex(K), logo, period: +P.toFixed(2), palette: paletteOpt === "auto" ? `auto ${pal.length} màu` : paletteOpt, items: [] };
const outs = [];
q.forEach((img, n) => {
  const name = names[n] ?? `${kind}_${n}`, it = nat[n];
  const info = { name, box: [it.x0, it.y0, it.x1 - it.x0 + 1, it.y1 - it.y0 + 1], cell: it.cell, native: [img.w, img.h] };
  let res;
  if (isTile) {
    const g = tileGeometry(img);
    info.face = { width: +(g.R[0] - g.L[0]).toFixed(1), height: +(g.B[1] - g.T[1]).toFixed(1), ratio: +((g.R[0] - g.L[0]) / (g.B[1] - g.T[1])).toFixed(2), thick: +g.thick.toFixed(1) };
    res = renderTile(img, g);
    if (res.seam) info.seam = res.seam;
    if (res.thickPx !== undefined) info.thickPx = res.thickPx;
  } else {
    res = renderSprite(img, s);
    if (res.lost) info.warning = "hình tràn khung, bị cắt";
  }
  const colors = new Set();
  for (let i = 0; i < res.out.data.length; i += 4) if (res.out.data[i + 3]) colors.add((res.out.data[i] << 16) | (res.out.data[i + 1] << 8) | res.out.data[i + 2]);
  info.colors = colors.size;
  writeFileSync(path.join(outDir, `${name}.png`), encodePng(res.out));
  if (debug) { mkdirSync(path.join(outDir, "_native"), { recursive: true }); writeFileSync(path.join(outDir, "_native", `${name}.png`), encodePng(img)); }
  outs.push(res.out);
  report.items.push(info);
  const face = info.face ? `  mặt trên ${info.face.width}×${info.face.height} (tỉ lệ ${info.face.ratio}:1), dày ${info.face.thick}` : "";
  const seam = info.seam ? `  mép ghép ${info.seam.before}→${info.seam.after}` : "";
  console.log(`[gemini] ${name}: ô giả ${it.cell.join("×")} px → gốc ${img.w}×${img.h}${face}${seam}, ${info.colors} màu${info.warning ? `  (CẢNH BÁO: ${info.warning})` : ""}`);
});
if (!isTile) report.scale = +s.toFixed(3);
writeFileSync(path.join(outDir, "_report.json"), JSON.stringify(report, null, 2) + "\n");
// Bảng auto ghi ra .gpl để duyệt và chọn màu bổ sung cho art/palette.gpl.
if (paletteOpt === "auto") writeFileSync(path.join(outDir, "_palette.gpl"), `GIMP Palette\nName: ${path.basename(file)} auto\nColumns: 8\n#\n` + pal.map((c) => `${c.map((v) => String(v).padStart(3)).join(" ")}\t${toHex(c)}`).join("\n") + "\n");
if (previewScale > 0) writeFileSync(path.join(outDir, "_preview.png"), encodePng(contactSheet(outs, previewScale)));
console.log(`[gemini] ${outs.length} vật → ${outDir}${logo ? `; logo đã gỡ (${logo.mode}, ${logo.pixels} điểm)` : ""}${isTile ? "" : `; hệ số thu ${s.toFixed(3)}`}`);
