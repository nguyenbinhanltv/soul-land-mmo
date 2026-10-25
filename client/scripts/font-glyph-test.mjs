// Bài kiểm (#698): mọi ký tự không phải chữ Latin / Việt trong chuỗi của client + shared/data.ts phải có trong cmap của phông nhúng
// (Galmuri 11 / 9, Ark Symbols 12 / 10, Be Vietnam Pro), nếu không trình duyệt rơi về phông hệ thống (ô vuông, lệch cỡ).
// Ký tự thiếu có chủ đích ghi ở ALLOW kèm lý do. Chạy: node client/scripts/font-glyph-test.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { brotliDecompressSync, inflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const FONT_DIR = path.join(root, "client/src/fonts");

/** Ký tự cho phép thiếu: mã -> lý do (chỉ khi có đường lùi khác hoặc không hiện trên giao diện). */
const ALLOW = new Map([]);

/** Tệp vẽ chữ bằng Phaser Text / canvas với chuỗi phông Be Vietnam Pro + Galmuri 11. */
const SCENE_FILES = ["client/src/scenes/GameScene.ts", "client/src/radar.ts", "client/src/mapview.ts"];

/**
 * Biểu tượng hồn kỹ `icon: "…"` ở shared/data.ts hiện còn thiếu glyph (mốc ngày 2026-10-25). Chữ này chỉ hiện khi chưa có ảnh kỹ năng
 * (skillImg / skillart) nên hạ thành mốc: thêm biểu tượng mới thiếu glyph thì lỗi, sửa xong một ký tự thì phải bỏ khỏi mốc (không để thừa).
 * Cách dứt điểm: thêm ảnh cho kỹ năng đó hoặc đổi sang ký tự có trong Galmuri.
 */
const ICON_BASELINE = new Set("✦✹✿⌘✶➤✳✺➹≋✥➶➠✧✋✸❀✾ϟ⌗❂✚⧉✵⚡➰✪✷❄☣∿⋔❁✂➵➳✴✊".split(""));

/** Đọc bảng cmap (định dạng 4 và 12) của woff2 / woff / ttf, trả về Set mã ký tự. */
export function cmapOf(buf) {
  let tables = new Map();
  const sig = buf.toString("latin1", 0, 4);
  if (sig === "wOF2") tables = woff2Tables(buf);
  else if (sig === "wOFF") tables = woffTables(buf);
  else {
    const n = buf.readUInt16BE(4);
    for (let i = 0; i < n; i++) {
      const o = 12 + i * 16, off = buf.readUInt32BE(o + 8);
      tables.set(buf.toString("latin1", o, o + 4), buf.subarray(off, off + buf.readUInt32BE(o + 12)));
    }
  }
  return parseCmap(tables.get("cmap"));
}

function readBase128(buf, p) {
  let v = 0;
  for (let i = 0; i < 5; i++) { const b = buf[p.o++]; v = v * 128 + (b & 0x7f); if (!(b & 0x80)) return v; }
  throw new Error("UIntBase128 sai");
}
const WOFF2_KNOWN = ["cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca", "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea", "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL", "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar", "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat", "Gloc", "Feat", "Sill"];
function woff2Tables(buf) {
  const n = buf.readUInt16BE(12), compSize = buf.readUInt32BE(20);
  const p = { o: 48 }, dir = [];
  for (let i = 0; i < n; i++) {
    const flags = buf[p.o++], idx = flags & 0x3f;
    let tag;
    if (idx === 63) { tag = buf.toString("latin1", p.o, p.o + 4); p.o += 4; } else tag = WOFF2_KNOWN[idx];
    const transform = (flags >> 6) & 3;
    const origLen = readBase128(buf, p);
    const hasTransformLen = (tag === "glyf" || tag === "loca") ? transform === 0 : transform !== 0;
    dir.push({ tag, len: hasTransformLen ? readBase128(buf, p) : origLen });
  }
  const data = brotliDecompressSync(buf.subarray(p.o, p.o + compSize));
  const tables = new Map();
  let off = 0;
  for (const t of dir) { tables.set(t.tag, data.subarray(off, off + t.len)); off += t.len; }
  return tables;
}
function woffTables(buf) {
  const n = buf.readUInt16BE(12), tables = new Map();
  for (let i = 0; i < n; i++) {
    const o = 44 + i * 20, off = buf.readUInt32BE(o + 4), comp = buf.readUInt32BE(o + 8), orig = buf.readUInt32BE(o + 12);
    const raw = buf.subarray(off, off + comp);
    tables.set(buf.toString("latin1", o, o + 4), comp === orig ? raw : inflateSync(raw));
  }
  return tables;
}
function parseCmap(t) {
  const set = new Set(), n = t.readUInt16BE(2);
  for (let i = 0; i < n; i++) {
    const so = t.readUInt32BE(4 + i * 8 + 4), fmt = t.readUInt16BE(so);
    if (fmt === 4) {
      const segX2 = t.readUInt16BE(so + 6), end = so + 14, start = end + segX2 + 2;
      for (let s = 0; s < segX2 / 2; s++) {
        const e = t.readUInt16BE(end + s * 2), b = t.readUInt16BE(start + s * 2);
        if (b === 0xffff) continue;
        for (let c = b; c <= e; c++) set.add(c);
      }
    } else if (fmt === 12) {
      const g = t.readUInt32BE(so + 12);
      for (let k = 0; k < g; k++) {
        const b = t.readUInt32BE(so + 16 + k * 12), e = t.readUInt32BE(so + 20 + k * 12);
        for (let c = b; c <= e; c++) set.add(c);
      }
    }
  }
  return set;
}

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    if (f === "node_modules" || f === "dist") continue;
    const p = path.join(dir, f), s = statSync(p);
    if (s.isDirectory()) walk(p, out); else if (/\.ts$/.test(f) && !/\.d\.ts$/.test(f)) out.push(p);
  }
  return out;
}
/** Bỏ chú thích (// và block) nhưng giữ chuỗi: chỉ ký tự trong code / chuỗi mới có thể hiện lên màn hình. */
function stripComments(src) {
  let out = "", i = 0, q = null;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (q) { out += c; if (c === "\\") { out += d ?? ""; i += 2; continue; } if (c === q) q = null; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; out += c; i++; continue; }
    if (c === "/" && d === "/") { while (i < src.length && src[i] !== "\n") i++; continue; }
    if (c === "/" && d === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue; }
    out += c; i++;
  }
  return out;
}
/** Chữ Latin / tiếng Việt / dấu câu thường: kiểm riêng ở bước 1 (phông chính đủ chữ Việt), không xét từng ký tự ở đây. */
const isPlain = (c) => c < 0x250 || (c >= 0x300 && c <= 0x36f) || (c >= 0x1e00 && c <= 0x1eff) || (c >= 0x2000 && c <= 0x206f) || c === 0xfe0f || c === 0x200d;
/** Chữ Hán / toàn rộng: tên riêng trong dữ liệu, không vẽ bằng phông nhúng của game. */
const isCjk = (c) => (c >= 0x3000 && c <= 0x9fff) || (c >= 0xff00 && c <= 0xffef);

export function run() {
  const fonts = readdirSync(FONT_DIR).filter((f) => /^(galmuri-\d+|ark-symbols-\d+|bvp-\d+)\.woff2$/.test(f));
  if (fonts.length < 7) throw new Error(`Thiếu phông nhúng (thấy ${fonts.length}/7): ${fonts.join(", ")}`);
  const cmaps = new Map(fonts.map((f) => [f, cmapOf(readFileSync(path.join(FONT_DIR, f)))]));
  const viet = "ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặẸẹẺẻẼẽẾếỀềỂểỄễỆệỈỉỊịỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợỤụỦủỨứỪừỬửỮữỰựỲỳỴỵỶỷỸỹ";
  const problems = [];
  // 1) Phông chính phải đủ chữ Việt: Be Vietnam Pro ở cả 3 độ đậm, Galmuri 11 / 9.
  for (const [f, set] of cmaps) {
    if (/ark-symbols/.test(f)) continue;
    const miss = [...viet].filter((ch) => !set.has(ch.codePointAt(0)));
    if (miss.length) problems.push(`${f} thiếu chữ Việt: ${miss.join(" ")}`);
  }
  // 2) Ký tự ngoài Latin dùng trong code phải có ở ít nhất một phông của chuỗi dự phòng.
  const union = new Set();
  for (const s of cmaps.values()) for (const c of s) union.add(c);
  const files = [...walk(path.join(root, "client/src")), path.join(root, "shared/data.ts")];
  const used = new Map(); // mã -> tệp đầu tiên dùng
  const icons = new Set(); // ký tự của `icon:` ở data.ts (đối chiếu với ICON_BASELINE)
  for (const f of files) {
    const rel = path.relative(root, f).replaceAll("\\", "/");
    let raw = readFileSync(f, "utf8");
    // Chuỗi ngắn chỉ gồm ký tự biểu tượng ở data.ts là `icon` hồn kỹ (dạng `icon: "✹"` hoặc đối số của ba() / ctSkill()); đối chiếu riêng với ICON_BASELINE.
    if (rel === "shared/data.ts") raw = raw.replace(/(?:icon:\s*|,\s*)"([^"\n]{1,3})"(?=\s*[,)])/g, (m, v) => { const cs = [...v].map((ch) => ch.codePointAt(0)); if (!cs.every((c) => !isPlain(c) && !isCjk(c))) return m; for (const c of cs) icons.add(c); return ","; });
    const text = stripComments(raw);
    for (const ch of text) {
      const c = ch.codePointAt(0);
      if (isPlain(c) || isCjk(c)) continue;
      if (!used.has(c)) used.set(c, rel);
    }
  }
  const hex = (c) => `U+${c.toString(16).toUpperCase().padStart(4, "0")}`;
  // 3) Chữ Phaser / canvas dùng chuỗi `"Be Vietnam Pro", "Galmuri 11", system-ui`: ký tự ngoài Latin ở các tệp này phải có trong bvp-* hoặc galmuri-11
  //    (không tính Galmuri 9 / Ark Symbols, vì chuỗi phông của chữ này không có chúng), và mọi chuỗi có Be Vietnam Pro phải kèm Galmuri 11 ngay sau.
  const sceneFonts = new Set();
  for (const [f, set] of cmaps) if (/^(bvp-\d+|galmuri-11)\.woff2$/.test(f)) for (const c of set) sceneFonts.add(c);
  for (const rel of SCENE_FILES) {
    const src = readFileSync(path.join(root, rel), "utf8");
    // Mỗi dòng nhắc Be Vietnam Pro (chuỗi phông nằm trọn trên một dòng) phải có cả Galmuri 11.
    for (const [n, line] of src.split(/\r?\n/).entries()) {
      if (line.includes("Be Vietnam Pro") && !line.includes("Galmuri 11")) problems.push(`${rel}:${n + 1}: chuỗi phông có "Be Vietnam Pro" nhưng không có "Galmuri 11" (ký tự như → ◆ sẽ rơi về phông hệ thống)`);
    }
    const seen = new Set();
    for (const ch of stripComments(src)) {
      const c = ch.codePointAt(0);
      if (isPlain(c) || isCjk(c) || sceneFonts.has(c) || ALLOW.has(c) || seen.has(c)) continue;
      seen.add(c);
      problems.push(`${hex(c)} "${ch}" (${rel}) vẽ bằng Be Vietnam Pro / Galmuri 11 mà cả hai đều không có glyph`);
    }
  }
  for (const [c, rel] of used) {
    if (union.has(c) || ALLOW.has(c)) continue;
    problems.push(`${hex(c)} "${String.fromCodePoint(c)}" (${rel}) không có trong phông nhúng nào`);
  }
  const baseline = new Set([...ICON_BASELINE].map((ch) => ch.codePointAt(0)));
  for (const c of icons) {
    if (isPlain(c) || isCjk(c) || union.has(c) || baseline.has(c)) continue;
    problems.push(`icon hồn kỹ ${hex(c)} "${String.fromCodePoint(c)}" (shared/data.ts) không có trong phông nhúng nào: đổi ký tự hoặc thêm ảnh, không thêm vào mốc`);
  }
  for (const c of baseline) if (!icons.has(c) || union.has(c)) problems.push(`ICON_BASELINE thừa: ${hex(c)} "${String.fromCodePoint(c)}" đã hết dùng hoặc đã có glyph, bỏ khỏi mốc`);
  for (const c of ALLOW.keys()) if (!used.has(c)) problems.push(`ALLOW thừa: ${hex(c)} không còn dùng`);
  return { problems, checked: used.size, fonts: fonts.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = run();
  if (r.problems.length) { console.error(r.problems.map((p) => "✗ " + p).join("\n")); process.exit(1); }
  console.log(`OK: ${r.checked} ký tự ngoài Latin đều có trong ${r.fonts} phông nhúng`);
}
