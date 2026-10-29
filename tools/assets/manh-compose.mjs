// Ghép biểu tượng "mảnh võ hồn" của từng võ hồn (#1305, Part of #877): khung mảnh vỡ chung + icon_<mã>_24 của võ hồn, viền theo `col`.
//   node tools/assets/manh-compose.mjs [--only mã,mã] [--check]
//
// Ra `shared/assets/sprites/iso/item/manh_<mã>.png` (khóa `item_manh_<mã>`, 32×32, id ITEMS `manh_<mã>` = shardCode) và ghi key vào
// manifest.json ("iso": true). Thiếu ảnh của mã nào thì client rơi về `item_manh_vo_hon` (tô theo `col`, uiArt.shardImg).
//   - Hình khung theo độ hiếm của võ hồn (SR / SSR / UR = 3 hình dạng); viền = `col` của võ hồn (gốc ở cạnh trên-trái, tối hơn ở cạnh
//     dưới-phải), nền tối pha từ `col`, ngoài cùng viền #1a1020.
//   - KHUNG TẠM: chưa có tờ I (kit Giấy / Mực) do model vẽ, nên khung dựng bằng code, tất định (cùng đầu vào → cùng ảnh). Có tờ khung
//     thật thì thay `buildMask` / `frameTone` bằng khung cắt từ tờ, giữ nguyên phần ghép và viền màu.
//   - Icon 24×24 căn giữa, chỉ giữ phần nằm trong ruột khung.
// Không ghi CREDITS.md: ảnh sinh bằng mã từ icon sẵn có (đã ghi nguồn ở mục icon võ hồn); dòng nguồn chung ở docs/art/nguon-giay-phep.md.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, SPRITES, MANIFEST, readPng, encodePng, Img, hex, OUTLINE, ISO_ITEM_ICON, PORTRAIT_MAX_COLORS } from "./lib.mjs";

/** Màu tối đa của icon sau giảm: chừa 5 màu cho khung (gốc / tối / nền / viền ngoài, dư một). */
const ICON_COLORS = PORTRAIT_MAX_COLORS - 5;
const S = ISO_ITEM_ICON, ICON = 24, OUT_RGB = hex(OUTLINE);

/** Đa giác khung (toạ độ trong ô 32×32, chừa 1 điểm cho viền ngoài) theo độ hiếm. */
export const SHAPES = {
  SR: [[6, 3], [26, 4], [29, 10], [28, 25], [22, 29], [5, 28], [3, 20], [3, 9]],
  SSR: [[16, 2], [28, 9], [29, 23], [16, 30], [3, 23], [4, 9]],
  UR: [[16, 2], [23, 6], [29, 5], [28, 14], [30, 22], [24, 29], [16, 30], [8, 29], [2, 22], [4, 14], [3, 5], [9, 6]],
};

/** Đọc VOHON trong shared/data.ts: [{ id, rarity, col }] (vh("id", "tên", hệ, "độ hiếm", …, "col", "robe")). */
export function readVohon(src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8")) {
  return [...src.matchAll(/^\s*vh\("([a-z_]+)",\s*"[^"]*",\s*"[^"]*",\s*"(SR|SSR|UR)"[\s\S]*?"(#[0-9a-fA-F]{6})",\s*"#[0-9a-fA-F]{6}"/gm)]
    .map((m) => ({ id: m[1], rarity: m[2], col: m[3].toLowerCase() }));
}

const inside = (poly, x, y) => { // tâm điểm ảnh (x + .5, y + .5), even-odd
  let c = false; const px = x + 0.5, py = y + 0.5;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
/** Mặt nạ khung: Uint8Array S×S (1 = trong khung). */
export function buildMask(rarity) {
  const poly = SHAPES[rarity]; if (!poly) throw new Error(`độ hiếm lạ: ${rarity}`);
  const m = new Uint8Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) m[y * S + x] = inside(poly, x, y) ? 1 : 0;
  return m;
}
const at = (m, x, y) => (x >= 0 && y >= 0 && x < S && y < S ? m[y * S + x] : 0);
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
/** Sắc viền theo màu võ hồn: `col` gốc (cạnh trên-trái), tối hơn (dưới-phải) + nền ruột. */
export function frameTone(col) {
  const c = hex(col);
  return { mid: c, lo: mix(c, OUT_RGB, 0.45), bg: mix(OUT_RGB, c, 0.18) };
}

const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
/**
 * Giảm icon còn tối đa `max` màu (median cut theo số điểm, mỗi hộp thay bằng điểm thật gần trung bình nhất, không sinh màu mới) để
 * cộng 5 màu khung + viền vẫn không quá PORTRAIT_MAX_COLORS. Trả Img mới, không sửa bản gốc.
 */
export function quantizeIcon(icon, max) {
  const out = new Img(icon.w, icon.h, Uint8Array.from(icon.data)), count = new Map();
  for (let i = 0; i < out.data.length; i += 4) if (out.data[i + 3] >= 128) { const k = (out.data[i] << 16) | (out.data[i + 1] << 8) | out.data[i + 2]; count.set(k, (count.get(k) ?? 0) + 1); }
  if (count.size <= max) return out;
  let boxes = [[...count].map(([k, n]) => ({ k, n, p: [k >> 16, (k >> 8) & 255, k & 255] }))];
  while (boxes.length < max) {
    let bi = -1, best = 0, axis = 0;
    boxes.forEach((b, i) => {
      if (b.length < 2) return;
      const span = [0, 1, 2].map((a) => Math.max(...b.map((x) => x.p[a])) - Math.min(...b.map((x) => x.p[a])));
      const a = span.indexOf(Math.max(...span)), score = span[a] * b.reduce((s, x) => s + x.n, 0);
      if (score > best) { best = score; bi = i; axis = a; }
    });
    if (bi < 0) break;
    const b = boxes[bi].sort((x, y) => x.p[axis] - y.p[axis] || x.k - y.k), half = b.reduce((s, x) => s + x.n, 0) / 2;
    let acc = 0, cut = 1; for (let i = 0; i < b.length - 1; i++) { acc += b[i].n; if (acc >= half) { cut = i + 1; break; } }
    boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut));
  }
  const map = new Map();
  for (const b of boxes) {
    const N = b.reduce((s, x) => s + x.n, 0), mean = [0, 1, 2].map((a) => b.reduce((s, x) => s + x.p[a] * x.n, 0) / N);
    const rep = b.reduce((a, x) => (dist(x.p, mean) < dist(a.p, mean) ? x : a)).p;
    for (const x of b) map.set(x.k, rep);
  }
  for (let i = 0; i < out.data.length; i += 4) if (out.data[i + 3] >= 128) [out.data[i], out.data[i + 1], out.data[i + 2]] = map.get((out.data[i] << 16) | (out.data[i + 1] << 8) | out.data[i + 2]);
  return out;
}

/** Ghép một ô: mặt nạ độ hiếm + màu + icon 24×24 (Img). Trả Img 32×32. */
export function composeShard({ rarity, col }, icon) {
  if (icon.w !== ICON || icon.h !== ICON) throw new Error(`icon phải ${ICON}×${ICON}, nhận ${icon.w}×${icon.h}`);
  icon = quantizeIcon(icon, ICON_COLORS);
  const m = buildMask(rarity), tone = frameTone(col), t = new Img(S, S), off = (S - ICON) / 2;
  const ring = (x, y) => at(m, x, y) && N4.some(([dx, dy]) => !at(m, x + dx, y + dy));
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (at(m, x, y)) {
      if (ring(x, y)) {
        const c = !at(m, x - 1, y) || !at(m, x, y - 1) ? tone.mid : tone.lo;
        t.set(x, y, [...c, 255]);
      } else {
        const ix = x - off, iy = y - off, p = ix >= 0 && iy >= 0 && ix < ICON && iy < ICON ? icon.get(ix, iy) : [0, 0, 0, 0];
        t.set(x, y, p[3] >= 128 ? [p[0], p[1], p[2], 255] : [...tone.bg, 255]);
      }
    } else if (N4.some(([dx, dy]) => at(m, x + dx, y + dy))) t.set(x, y, [...OUT_RGB, 255]);
  }
  return t;
}
export const colorCount = (t) => { const s = new Set(); for (let i = 0; i < t.data.length; i += 4) if (t.data[i + 3]) s.add((t.data[i] << 16) | (t.data[i + 1] << 8) | t.data[i + 2]); return s.size; };

/**
 * Chèn key vào manifest.json dạng văn bản (giữ nguyên định dạng tay của các dòng khác), ngay sau khối `item_manh_vo_hon` và các key
 * `item_manh_*` đã có theo thứ tự mã; theo kiểu xuống dòng của file. Trả văn bản mới (không đổi nếu đủ key).
 */
export function addManifestKeys(text, keys) {
  const nl = text.includes("\r\n") ? "\r\n" : "\n", have = new Set([...text.matchAll(/"key":\s*"([^"]+)"/g)].map((m) => m[1]));
  const block = (k) => ["    {", `      "key": "${k}",`, '      "iso": true', "    },"].join(nl) + nl;
  const anchor = ["    {", '      "key": "item_manh_vo_hon",', '      "iso": true', "    },"].join(nl) + nl;
  if (!text.includes(anchor)) throw new Error("manifest.json không có khối item_manh_vo_hon để chèn sau");
  const add = [...keys].filter((k) => !have.has(k)).sort();
  return add.length ? text.replace(anchor, anchor + add.map(block).join("")) : text;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null, check = args.includes("--check");
  const fail = (m) => { console.error(`[manh-compose] ${m}`); process.exit(1); };
  const vohon = readVohon().filter((v) => !only || only.includes(v.id));
  if (!vohon.length) fail("không đọc được võ hồn nào từ shared/data.ts");
  const manifestText = readFileSync(MANIFEST, "utf8"), keys = [];
  let stale = 0;
  for (const v of vohon) {
    const src = path.join(SPRITES, "iso", "portrait", `${v.id}_icon24.png`);
    if (!existsSync(src)) { console.warn(`[manh-compose] ${v.id}: thiếu ${path.relative(ROOT, src)}, bỏ qua (client rơi về item_manh_vo_hon)`); continue; }
    const img = composeShard(v, readPng(src)), n = colorCount(img);
    if (n > PORTRAIT_MAX_COLORS) fail(`${v.id}: ${n} màu, tối đa ${PORTRAIT_MAX_COLORS}`);
    const out = path.join(SPRITES, "iso", "item", `manh_${v.id}.png`), buf = Buffer.from(encodePng(img));
    if (check) { if (!existsSync(out) || !readFileSync(out).equals(buf)) { console.error(`[manh-compose] cũ: ${path.relative(ROOT, out)}`); stale++; } }
    else { writeFileSync(out, buf); console.log(`[manh-compose] ${v.id} (${v.rarity}, ${v.col}): ${n} màu → ${path.relative(ROOT, out)}`); }
    keys.push(`item_manh_${v.id}`);
  }
  if (check) process.exit(stale ? 1 : 0);
  const next = addManifestKeys(manifestText, keys);
  if (check ? false : next !== manifestText) writeFileSync(MANIFEST, next);
}
