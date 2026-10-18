// Thư viện dùng chung cho dây chuyền asset (tools/assets/*): đọc/ghi PNG, bảng màu, quy cách 5.11.
// Không phụ thuộc thư viện ngoài (chỉ node:zlib) để chạy được trong `npm run check` mà không cần cài gì.
import { inflateSync, deflateSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
export const SPRITES = path.join(ROOT, "shared", "assets", "sprites");
export const MANIFEST = path.join(SPRITES, "manifest.json");

// ---------- Quy cách GAME_DESIGN.md mục 5.11 (khớp client/src/sprites.ts) ----------
export const SHEET_COLS = 16, SHEET_ROWS = 4;
export const HS_FRAME = 32, VH_FRAME = 48;
/** Gốc tại chân: hồn sư (16,30), phụ thể (24,38). */
export const HS_ORIGIN = [16, 30], VH_ORIGIN = [24, 38];
export const OUTLINE = "#1a1020";
/** Dải 4 xám chuẩn (tối → sáng) của lớp tóc và áo. */
export const GRAY_RAMP = ["#3a3a3a", "#6a6a6a", "#9a9a9a", "#cacaca"];
/** Hồn thú theo bậc: rộng × cao (một hàng 13 khung, hướng phải). */
export const BEAST_FRAMES = [[16, 16], [32, 32], [48, 32], [48, 48], [64, 64]];
export const BEAST_COLS = 13;
/** Cột bắt đầu và số khung của từng animation hồn sư; hàng 0–2 = xuống, phải, lên. */
export const HS_ANIMS = { idle: [0, 2], walk: [2, 4], attack: [6, 3], cast: [9, 3], hurt: [12, 1], die: [13, 3] };
export const DIRS = ["down", "right", "up"];

// ---------- Màu ----------
export const hex = (c) => { const n = parseInt(c.replace("#", ""), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
export const toHex = ([r, g, b]) => "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

/** Đọc art/palette.gpl → mảng { hex, name }. */
export function readGplNamed(file = path.join(ROOT, "art", "palette.gpl")) {
  const out = [];
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(\d+)\s*(.*)$/);
    if (m) out.push({ hex: toHex([+m[1], +m[2], +m[3]]), name: m[4].trim() });
  }
  return out;
}
/** Đọc art/palette.gpl → mảng hex. */
export const readGpl = (file) => readGplNamed(file).map((c) => c.hex);
/** Màu trong palette.gpl có tên bắt đầu bằng `prefix` (ví dụ "Da " → 3 sắc da tối, gốc, sáng). */
export const paletteGroup = (prefix) => readGplNamed().filter((c) => c.name.startsWith(prefix)).map((c) => c.hex);

/** Đọc `col`/`robe` của VOHON và `col`/`glow` của TIERS từ shared/data.ts (không chép số ra chỗ khác). */
export function readDataColors() {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
  const pick = (re) => [...src.matchAll(re)].map((m) => m[1].toLowerCase());
  // VOHON khai báo bằng vh("id", …, col, robe, trait): col/robe là hai mã màu liền nhau đầu tiên sau id.
  const vohon = [...src.matchAll(/vh\("[a-z_]+"[\s\S]*?"(#[0-9a-fA-F]{6})",\s*"(#[0-9a-fA-F]{6})"/g)].flatMap((m) => [m[1], m[2]].map((c) => c.toLowerCase()));
  // TIERS ghi theo tên trường: col (thân vòng) và glow (viền sáng).
  return { vohon, tiers: [...pick(/\bcol:\s*"(#[0-9a-fA-F]{6})"/g), ...pick(/\bglow:\s*"(#[0-9a-fA-F]{6})"/g)] };
}

/** `col` và `robe` của một võ hồn trong VOHON (shared/data.ts), hoặc null nếu không có id đó. */
export function vohonColors(id) {
  const src = readFileSync(path.join(ROOT, "shared", "data.ts"), "utf8");
  const m = src.match(new RegExp(`vh\\("${id}"[\\s\\S]*?"(#[0-9a-fA-F]{6})",\\s*"(#[0-9a-fA-F]{6})"`));
  return m ? [m[1].toLowerCase(), m[2].toLowerCase()] : null;
}

/** Một sắc tối và một sắc sáng suy ra từ màu gốc (cho phép theo 5.11). */
export function shadesOf(c) {
  const [r, g, b] = hex(c);
  const dark = toHex([r, g, b].map((v) => Math.round(v * 0.62)));
  const light = toHex([r, g, b].map((v) => Math.round(v + (255 - v) * 0.45)));
  return [dark, light];
}

/** Bảng màu cho phép: palette.gpl + col/robe võ hồn (kèm 1 tối, 1 sáng) + màu hồn hoàn. */
export function allowedColors() {
  const set = new Set(readGpl());
  const { vohon, tiers } = readDataColors();
  for (const c of vohon) { set.add(c); for (const s of shadesOf(c)) set.add(s); }
  for (const c of tiers) set.add(c);
  return set;
}

// ---------- PNG ----------
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }

/** Ảnh RGBA trong bộ nhớ. */
export class Img {
  constructor(w, h, data) { this.w = w; this.h = h; this.data = data ?? new Uint8Array(w * h * 4); }
  idx(x, y) { return (y * this.w + x) * 4; }
  get(x, y) { const i = this.idx(x, y), d = this.data; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; }
  set(x, y, [r, g, b, a]) { const i = this.idx(x, y), d = this.data; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a; }
  alpha(x, y) { return this.data[this.idx(x, y) + 3]; }
  /** Chép vùng (sx,sy,w,h) của `src` vào (dx,dy), bỏ qua điểm trong suốt nếu `over`. */
  blit(src, sx, sy, w, h, dx, dy, over = false) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = dx + x, Y = dy + y, u = sx + x, v = sy + y;
      if (X < 0 || Y < 0 || X >= this.w || Y >= this.h || u < 0 || v < 0 || u >= src.w || v >= src.h) continue;
      const p = src.get(u, v);
      if (over && p[3] === 0) continue;
      this.set(X, Y, p);
    }
  }
}

export function decodePng(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error("Không phải PNG");
  let pos = 8, w = 0, h = 0, depth = 0, type = 0, interlace = 0, plte = null, trns = null;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), name = buf.toString("ascii", pos + 4, pos + 8), body = buf.subarray(pos + 8, pos + 8 + len);
    if (name === "IHDR") { w = body.readUInt32BE(0); h = body.readUInt32BE(4); depth = body[8]; type = body[9]; interlace = body[12]; }
    else if (name === "PLTE") plte = body;
    else if (name === "tRNS") trns = body;
    else if (name === "IDAT") idat.push(body);
    else if (name === "IEND") break;
    pos += 12 + len;
  }
  if (interlace) throw new Error("PNG interlace chưa hỗ trợ");
  if (depth === 16 || (depth < 8 && type !== 3 && type !== 0)) throw new Error(`PNG bit depth ${depth} chưa hỗ trợ`);
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[type];
  const raw = inflateSync(Buffer.concat(idat));
  const bitsPP = ch * depth, stride = Math.ceil((w * bitsPP) / 8), bpp = Math.max(1, bitsPP >> 3);
  const px = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = px.subarray(y * stride, (y + 1) * stride), prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0, b = prev ? prev[i] : 0, c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[i] = v & 255;
    }
  }
  const img = new Img(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const row = px.subarray(y * stride);
    let r, g, b, al = 255;
    if (depth < 8) {
      const bit = x * depth, v = (row[bit >> 3] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
      if (type === 3) { r = plte[v * 3]; g = plte[v * 3 + 1]; b = plte[v * 3 + 2]; al = trns && v < trns.length ? trns[v] : 255; }
      else { r = g = b = Math.round((v * 255) / ((1 << depth) - 1)); }
    } else {
      const i = x * ch;
      if (type === 0) { r = g = b = row[i]; }
      else if (type === 4) { r = g = b = row[i]; al = row[i + 1]; }
      else if (type === 2) { r = row[i]; g = row[i + 1]; b = row[i + 2]; }
      else if (type === 6) { r = row[i]; g = row[i + 1]; b = row[i + 2]; al = row[i + 3]; }
      else { const v = row[i]; r = plte[v * 3]; g = plte[v * 3 + 1]; b = plte[v * 3 + 2]; al = trns && v < trns.length ? trns[v] : 255; }
    }
    img.set(x, y, [r, g, b, al]);
  }
  return img;
}

function chunk(name, body) {
  const len = Buffer.alloc(4); len.writeUInt32BE(body.length);
  const nb = Buffer.concat([Buffer.from(name, "ascii"), body]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(nb));
  return Buffer.concat([len, nb, crc]);
}

/** Ghi PNG RGBA 8 bit (điểm trong suốt chuẩn hóa về 0,0,0,0 để file ổn định). */
export function encodePng(img) {
  const { w, h, data } = img, stride = w * 4, raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    for (let x = 0; x < stride; x += 4) {
      const s = y * stride + x, d = y * (stride + 1) + 1 + x;
      if (data[s + 3] === 0) continue;
      raw[d] = data[s]; raw[d + 1] = data[s + 1]; raw[d + 2] = data[s + 2]; raw[d + 3] = data[s + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIG, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

export const readPng = (file) => decodePng(readFileSync(file));

// ---------- Key ↔ đường dẫn, khung (khớp sheetSpec trong client/src/sprites.ts) ----------
/** Trả về { file, frame:[w,h], kind } cho một key manifest, hoặc null nếu key sai quy ước. */
export function sheetSpec(key, frame) {
  let m;
  if ((m = key.match(/^hs_((?:body|hair|outfit)_[mf](?:_\d+)?)$/))) return { file: `honsu/${m[1]}.png`, frame: [HS_FRAME, HS_FRAME], size: [HS_FRAME * SHEET_COLS, HS_FRAME * SHEET_ROWS], kind: "honsu" };
  if ((m = key.match(/^vh_([a-z_]+_[bf])$/))) return { file: `vohon/${m[1]}.png`, frame: [VH_FRAME, VH_FRAME], size: [VH_FRAME * SHEET_COLS, VH_FRAME * SHEET_ROWS], kind: "vohon" };
  if ((m = key.match(/^b(\d)$/)) && BEAST_FRAMES[+m[1]]) { const f = frame ?? BEAST_FRAMES[+m[1]]; return { file: `beast/${key}.png`, frame: f, size: [f[0] * BEAST_COLS, f[1]], kind: "beast" }; }
  if ((m = key.match(/^beast_([a-z_]+)$/)) && frame) return { file: `beast/${m[1]}.png`, frame, size: [frame[0] * BEAST_COLS, frame[1]], kind: "beast" };
  if (/^ring\d$/.test(key)) return { file: `ring/${key}.png`, kind: "ring" };
  if (/^halo\d$/.test(key)) return { file: `ring/${key}.png`, frame: [24, 10], kind: "ring" };
  return null;
}
