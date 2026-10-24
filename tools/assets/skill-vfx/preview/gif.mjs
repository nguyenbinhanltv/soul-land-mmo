// Ghép khung quay (frames/<job>/*.png + times.json) thành GIF động: lấy mẫu đều theo thời gian từ lúc phát chiêu, cắt vùng, lượng tử một bảng màu chung (255 màu), LZW.
//   node gif.mjs --frames <thư mục> --out <thư mục gif> --names a,b,c [--from -150 --to 1900 --fps 20 --crop 100,20,440,280 --scale 1]
// Không phụ thuộc thư viện ngoài (chỉ lib.mjs của repo để đọc PNG).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { decodePng } from "../../lib.mjs";

const a = process.argv.slice(2), g = (n, d) => { const i = a.indexOf(n); return i >= 0 ? a[i + 1] : d; };
const dir = g("--frames"), out = g("--out"), names = g("--names").split(","), from = +g("--from", "-150"), to = +g("--to", "1900"), fps = +g("--fps", "20");
const [cx, cy, cw, ch] = g("--crop", "100,20,440,280").split(",").map(Number), K = +g("--scale", "1");
mkdirSync(out, { recursive: true });

/** Bảng màu chung: đếm màu 4 bit / kênh trên các khung lấy mẫu, giữ 255 màu thường gặp nhất (+ màu trong suốt không dùng). */
function palette(imgs) {
  const cnt = new Map();
  for (const im of imgs) for (let i = 0; i < im.data.length; i += 4 * 3) { const k = (im.data[i] >> 3 << 10) | (im.data[i + 1] >> 3 << 5) | (im.data[i + 2] >> 3); cnt.set(k, (cnt.get(k) ?? 0) + 1); }
  const top = [...cnt].sort((x, y) => y[1] - x[1]).slice(0, 255).map(([k]) => [((k >> 10) & 31) << 3 | 4, ((k >> 5) & 31) << 3 | 4, (k & 31) << 3 | 4]);
  while (top.length < 256) top.push([0, 0, 0]);
  return top;
}
function indexer(pal) {
  const cache = new Map();
  return (r, g2, b) => {
    const key = (r >> 2 << 12) | (g2 >> 2 << 6) | (b >> 2); let v = cache.get(key); if (v !== undefined) return v;
    let best = 0, bd = 1e9; for (let i = 0; i < 256; i++) { const d = (pal[i][0] - r) ** 2 + (pal[i][1] - g2) ** 2 + (pal[i][2] - b) ** 2; if (d < bd) { bd = d; best = i; } }
    cache.set(key, best); return best;
  };
}
function lzw(idx, minBits = 8) {
  const clear = 1 << minBits, eoi = clear + 1, out2 = []; let bits = 0, nb = 0;
  const put = (code, size) => { bits |= code << nb; nb += size; while (nb >= 8) { out2.push(bits & 255); bits >>= 8; nb -= 8; } };
  let dict = new Map(), next = eoi + 1, size = minBits + 1; put(clear, size);
  let w = idx[0];
  for (let i = 1; i < idx.length; i++) {
    const c = idx[i], key = (w << 8) | c, v = dict.get(key);
    if (v !== undefined) { w = v; continue; }
    put(w, size);
    if (next < 4096) { dict.set(key, next++); if (next > (1 << size) && size < 12) size++; }
    else { put(clear, size); dict = new Map(); next = eoi + 1; size = minBits + 1; }
    w = c;
  }
  put(w, size); put(eoi, size); if (nb > 0) out2.push(bits & 255);
  return out2;
}
function gif(frames, W, H, delay, pal) {
  const b = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, W & 255, W >> 8, H & 255, H >> 8, 0xf7, 0, 0];
  for (const c of pal) b.push(c[0], c[1], c[2]);
  b.push(0x21, 0xff, 0x0b, ...Buffer.from("NETSCAPE2.0"), 3, 1, 0, 0, 0); // lặp vô hạn
  for (const f of frames) {
    b.push(0x21, 0xf9, 4, 0, delay & 255, delay >> 8, 0, 0, 0x2c, 0, 0, 0, 0, W & 255, W >> 8, H & 255, H >> 8, 0, 8);
    const d = lzw(f); for (let i = 0; i < d.length; i += 255) { const n = Math.min(255, d.length - i); b.push(n); for (let j = 0; j < n; j++) b.push(d[i + j]); }
    b.push(0);
  }
  b.push(0x3b); return Buffer.from(b);
}

for (const n of names) {
  const T = JSON.parse(readFileSync(`${dir}/${n}/times.json`, "utf8")).frames, dt = 1000 / fps, picks = [];
  for (let t = from; t <= to; t += dt) { let best = T[0]; for (const f of T) if (Math.abs(f.t - t) < Math.abs(best.t - t)) best = f; picks.push(best.f); }
  const imgs = picks.map((f) => { const im = decodePng(readFileSync(`${dir}/${n}/${f}`)), W = cw * K, H = ch * K, o = { w: W, h: H, data: Buffer.alloc(W * H * 4) };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const s = ((cy + ((y / K) | 0)) * im.w + cx + ((x / K) | 0)) * 4, d = (y * W + x) * 4; o.data[d] = im.data[s]; o.data[d + 1] = im.data[s + 1]; o.data[d + 2] = im.data[s + 2]; o.data[d + 3] = 255; } return o; });
  const pal = palette(imgs), ix = indexer(pal), W = cw * K, H = ch * K;
  const frames = imgs.map((im) => { const f = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) f[i] = ix(im.data[i * 4], im.data[i * 4 + 1], im.data[i * 4 + 2]); return f; });
  const buf = gif(frames, W, H, Math.round(100 / fps), pal);
  writeFileSync(`${out}/${n}.gif`, buf); console.log(`[gif] ${n}: ${frames.length} khung ${W}x${H} ${(buf.length / 1024) | 0} KB`);
}
