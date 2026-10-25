// Trang xem trước hoạt ảnh vẽ thật của hồn thú (#688): GIF từng hoạt ảnh × hướng, đặt cạnh ảnh tĩnh hiện tại.
//   node tools/assets/beast-sheet-preview.mjs --species phong_lang --dir <thư mục beast-sheet-cut> [--scale 3]
// Đọc <dir>/<loài>_anim.png + manifest-entry.json, ghi <dir>/preview/index.html, gif/<hoạt ảnh>_<hướng>.gif, tinh/<hướng>.png.
// Hướng tây (sw / w / nw) hiện bằng lật ngang bằng CSS như client sẽ làm.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Img, readPng, encodePng } from "./lib.mjs";
import { DIRS, DIR_VI, ANIMS, ANIM_VI, speciesInfo } from "./beast-sheet-lib.mjs";

/** Số ms mỗi khung theo hoạt ảnh (xem trước, không phải số cân bằng; nhịp thật do client đặt). */
const MS = { idle: 170, walk: 100, attack: 90, hurt: 120, die: 170 };
/** Khung tĩnh theo hướng 5 (STATIC_DIR_MAP trong client/src/sprites.ts: se → đông, ne → bắc). */
const STATIC_COL = { s: 0, se: 1, e: 1, ne: 2, n: 2 };
const FLIPPED = [["sw", "se"], ["w", "e"], ["nw", "ne"]];

function lzw(idx, minBits) {
  const clear = 1 << minBits, eoi = clear + 1, out = []; let bits = minBits + 1, cur = 0, n = 0, next = eoi + 1, dict = new Map();
  const emit = (code) => { cur |= code << n; n += bits; while (n >= 8) { out.push(cur & 255); cur >>= 8; n -= 8; } };
  emit(clear);
  let prefix = idx[0];
  for (let i = 1; i < idx.length; i++) {
    const k = prefix * 256 + idx[i], hit = dict.get(k);
    if (hit !== undefined) { prefix = hit; continue; }
    emit(prefix);
    if (next < 4096) { dict.set(k, next++); if (next > (1 << bits) && bits < 12) bits++; }
    else { emit(clear); dict = new Map(); next = eoi + 1; bits = minBits + 1; }
    prefix = idx[i];
  }
  emit(prefix); emit(eoi);
  if (n) out.push(cur & 255);
  return out;
}

/** GIF89a lặp vô hạn, nền trong suốt (chỉ số 0), phóng nguyên `k` lần; `hold` ms giữ khung cuối. */
export function encodeGif(frames, ms, k, hold = 0) {
  const w = frames[0].w * k, h = frames[0].h * k, colors = new Map([["t", 0]]);
  for (const f of frames) for (let i = 0; i < f.data.length; i += 4) if (f.data[i + 3]) { const c = (f.data[i] << 16) | (f.data[i + 1] << 8) | f.data[i + 2]; if (!colors.has(c)) colors.set(c, colors.size); }
  if (colors.size > 256) throw new Error(`quá ${colors.size} màu cho GIF`);
  let bpp = 1; while (1 << bpp < colors.size) bpp++;
  const pal = Buffer.alloc((1 << bpp) * 3);
  for (const [c, i] of colors) if (c !== "t") { pal[i * 3] = c >> 16; pal[i * 3 + 1] = (c >> 8) & 255; pal[i * 3 + 2] = c & 255; }
  const b = [Buffer.from("GIF89a"), Buffer.from([w & 255, w >> 8, h & 255, h >> 8, 0x80 | (bpp - 1), 0, 0]), pal,
    Buffer.from([0x21, 0xff, 0x0b, ...Buffer.from("NETSCAPE2.0"), 3, 1, 0, 0, 0])];
  frames.forEach((f, fi) => {
    const idx = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = (((y / k) | 0) * f.w + ((x / k) | 0)) * 4;
      idx[y * w + x] = f.data[o + 3] ? colors.get((f.data[o] << 16) | (f.data[o + 1] << 8) | f.data[o + 2]) : 0;
    }
    const cs = Math.max(2, Math.round((ms + (fi === frames.length - 1 ? hold : 0)) / 10)), minBits = Math.max(2, bpp), data = lzw(idx, minBits);
    b.push(Buffer.from([0x21, 0xf9, 4, 0x09, cs & 255, cs >> 8, 0, 0, 0x2c, 0, 0, 0, 0, w & 255, w >> 8, h & 255, h >> 8, 0, minBits]));
    for (let i = 0; i < data.length; i += 255) { const part = data.slice(i, i + 255); b.push(Buffer.from([part.length, ...part])); }
    b.push(Buffer.from([0]));
  });
  b.push(Buffer.from([0x3b]));
  return Buffer.concat(b);
}

const crop = (src, x0, y0, w, h) => { const im = new Img(w, h); im.blit(src, x0, y0, w, h, 0, 0); return im; };
const bigger = (im, k) => { const o = new Img(im.w * k, im.h * k); for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.set(x, y, im.get((x / k) | 0, (y / k) | 0)); return o; };

/** Dựng trang xem trước vào `<dir>/preview`; trả đường dẫn index.html. */
export function buildPreview(species, dir, scaleArg) {
  const info = speciesInfo(species), entry = JSON.parse(readFileSync(path.join(dir, "manifest-entry.json"), "utf8")), F = entry.frame[0];
  const sheet = readPng(path.join(dir, `${species}_anim.png`)), A = entry.anim, k = scaleArg ?? Math.max(1, Math.round(300 / F));
  const root = path.join(dir, "preview");
  mkdirSync(path.join(root, "gif"), { recursive: true }); mkdirSync(path.join(root, "tinh"), { recursive: true });
  for (const [anim, n] of ANIMS) for (const dir5 of DIRS) {
    const { band, col } = A.anims[anim], row = DIRS.indexOf(dir5) * A.rowsPerDir + band;
    const fr = [...Array(n).keys()].map((f) => crop(sheet, (col + f) * F, row * F, F, F));
    writeFileSync(path.join(root, "gif", `${anim}_${dir5}.gif`), encodeGif(fr, MS[anim], k, anim === "die" ? 900 : 0));
  }
  let staticOk = false;
  if (info.staticFile) {
    const st = readPng(info.staticFile), sf = st.h;
    for (const d of DIRS) writeFileSync(path.join(root, "tinh", `${d}.png`), encodePng(bigger(crop(st, STATIC_COL[d] * sf, 0, sf, sf), Math.max(1, Math.round((F * k) / sf)))));
    staticOk = true;
  }
  const cols = [...DIRS.map((d) => [d, d, false]), ...FLIPPED.map(([d, src]) => [d, src, true])];
  const cell = (anim, [d, src, flip]) => `<td><img class="g${flip ? " f" : ""}" src="gif/${anim}_${src}.gif" width="${F * k}" height="${F * k}" alt="${anim} ${d}"></td>`;
  const staticRow = staticOk ? `<tr class="st"><th>ảnh tĩnh hiện tại</th>${cols.map(([d, src, flip]) => `<td><img class="g${flip ? " f" : ""}" src="tinh/${src}.png" width="${F * k}" height="${F * k}" alt="tĩnh ${d}"></td>`).join("")}</tr>` : "";
  const html = `<!doctype html><html lang="vi"><meta charset="utf-8"><title>Hoạt ảnh ${info.name}</title>
<style>body{background:#2a2430;color:#e8dfc8;font:13px/1.4 sans-serif;margin:16px}h1{font-size:18px}table{border-collapse:collapse}th,td{border:1px solid #4a4050;padding:4px;text-align:center;vertical-align:bottom}th{background:#1a1020;font-weight:600}td{background:repeating-conic-gradient(#352d3d 0 25%,#2f2837 0 50%) 0 0/16px 16px}img.g{image-rendering:pixelated;display:block}img.f{transform:scaleX(-1)}tr.st td{background:#1a1424}.n{color:#9a8fa8;margin:6px 0 12px}</style>
<h1>${info.name} <small>(${species}, khung ${F}×${F}, phóng ×${k})</small></h1>
<p class="n">Cột: 5 hướng vẽ thật (nam, đông-nam, đông, đông-bắc, bắc) rồi 3 hướng tây (lật ngang: tây-nam, tây, tây-bắc). Hàng "ảnh tĩnh hiện tại": khung tĩnh đang dùng trong game cho cùng hướng.</p>
<table><tr><th></th>${cols.map(([d]) => `<th>${DIR_VI[d] ?? { sw: "tây-nam", w: "tây", nw: "tây-bắc" }[d]} <small>(${d})</small></th>`).join("")}</tr>
${staticRow}
${ANIMS.map(([anim]) => `<tr><th>${ANIM_VI[anim]}<br><small>${anim}</small></th>${cols.map((c) => cell(anim, c)).join("")}</tr>`).join("\n")}
</table></html>
`;
  writeFileSync(path.join(root, "index.html"), html);
  return path.join(root, "index.html");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2), val = (n) => { const i = a.indexOf(n); return i < 0 ? undefined : a[i + 1]; };
  if (!val("--species") || !val("--dir")) { console.error("Dùng: node tools/assets/beast-sheet-preview.mjs --species <loài> --dir <thư mục beast-sheet-cut> [--scale 3]"); process.exit(2); }
  console.log(buildPreview(val("--species"), val("--dir"), val("--scale") && +val("--scale")));
}
