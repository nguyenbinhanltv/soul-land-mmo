// Ghép biểu tượng "mảnh võ hồn" của từng võ hồn (#1305, Part of #877): khung mảnh vỡ chung + icon_<mã>_24 của võ hồn, viền theo `col`.
//   node tools/assets/manh-compose.mjs [--only mã,mã] [--check]
//
// Ra `shared/assets/sprites/iso/item/manh_<mã>.png` (khóa `item_manh_<mã>`, 32×32, id ITEMS `manh_<mã>` = shardCode) và ghi key vào
// manifest.json ("iso": true). Thiếu ảnh của mã nào thì client rơi về `item_manh_vo_hon` (tô theo `col`, uiArt.shardImg).
//   - Hình khung theo độ hiếm của võ hồn (SR / SSR / UR = 3 hình dạng); viền = `col` của võ hồn (gốc ở cạnh trên-trái, tối hơn ở cạnh
//     dưới-phải), nền tối pha từ `col`, ngoài cùng viền #1a1020.
//   - Khung thật từ tờ Codex image_gen toI-manh.png; manh-sheet.mjs kiểm / cắt mẫu 32×32, giữ mảng giấy và đổi sắc đồng theo col.
//   - Icon 24×24 căn giữa, chỉ giữ phần nằm trong ruột khung.
// Nguồn tờ khung Codex và icon có sẵn: docs/art/nguon-giay-phep.md.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, SPRITES, MANIFEST, readPng, encodePng, Img, hex, OUTLINE, ISO_ITEM_ICON, PORTRAIT_MAX_COLORS } from "./lib.mjs";
import { FRAME_DIR, FRAME_PALETTE, RARITIES } from "./manh-sheet.mjs";

/** Màu tối đa của icon sau giảm: chừa 5 màu cho khung (gốc / tối / nền / viền ngoài, dư một). */
const ICON_COLORS = PORTRAIT_MAX_COLORS - 5;
const S = ISO_ITEM_ICON, ICON = 24, OUT_RGB = hex(OUTLINE);

/** Mẫu khung model đã cắt theo độ hiếm, chừa lề trong ô 32×32. */
export const FRAMES = Object.fromEntries(RARITIES.map((r) => [r, readPng(path.join(FRAME_DIR, `${r}.png`))]));

/** Đọc VOHON trong shared/data.ts: [{ id, rarity, col }] (vh("id", "tên", hệ, "độ hiếm", …, "col", "robe")). */
export function readVohon(src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8")) {
  return [...src.matchAll(/^\s*vh\("([a-z_]+)",\s*"[^"]*",\s*"[^"]*",\s*"(SR|SSR|UR)"[\s\S]*?"(#[0-9a-fA-F]{6})",\s*"#[0-9a-fA-F]{6}"/gm)]
    .map((m) => ({ id: m[1], rarity: m[2], col: m[3].toLowerCase() }));
}

/** Mặt nạ alpha từ khung model đã cắt (không dựng lại đa giác). */
export function buildMask(rarity) {
  const frame = FRAMES[rarity]; if (!frame) throw new Error(`độ hiếm lạ: ${rarity}`);
  return Uint8Array.from({ length: S * S }, (_, i) => frame.data[i * 4 + 3] >= 128 ? 1 : 0);
}
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

/** Ghép một ô: khung model theo độ hiếm + màu + icon 24×24 trong ruột Mực. Trả Img 32×32. */
export function composeShard({ rarity, col }, icon) {
  if (icon.w !== ICON || icon.h !== ICON) throw new Error(`icon phải ${ICON}×${ICON}, nhận ${icon.w}×${icon.h}`);
  icon = quantizeIcon(icon, ICON_COLORS);
  const frame = FRAMES[rarity]; if (!frame) throw new Error(`độ hiếm lạ: ${rarity}`);
  const tone = frameTone(col), t = new Img(S, S), off = (S - ICON) / 2;
  const palette = [OUT_RGB, tone.bg, tone.lo, tone.mid, FRAME_PALETTE[4]];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const p = frame.get(x, y); if (p[3] < 128) continue;
    const role = FRAME_PALETTE.findIndex((c) => c.every((v, i) => v === p[i]));
    if (role < 0) throw new Error(`khung ${rarity}: màu lạ tại ${x},${y}; chạy lại manh-sheet cut`);
    const ix = x - off, iy = y - off, ic = ix >= 0 && iy >= 0 && ix < ICON && iy < ICON ? icon.get(ix, iy) : [0, 0, 0, 0];
    t.set(x, y, role === 1 && ic[3] >= 128 ? [ic[0], ic[1], ic[2], 255] : [...palette[role], 255]);
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
