// Ngẫu nhiên có hạt giống và nhiễu cho công cụ dựng bản đồ (tools/maps). Mọi hàm thuần: cùng hạt giống ra cùng kết quả trên mọi máy
// (chỉ dùng phép nguyên 32 bit và Math.imul, không Math.random).

/** Băm (x, y, kênh) → số nguyên không âm 32 bit. */
export function hash3(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}
/** Băm → số thực [0, 1). */
export const hashF = (x, y, s = 0) => hash3(x, y, s) / 4294967296;

/** Băm chuỗi (tên tính năng) → số nguyên, để mỗi tính năng có dòng ngẫu nhiên riêng: thêm / bớt tính năng không làm xô lệch cái khác. */
export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Dòng ngẫu nhiên mulberry32: `r()` trả [0, 1); `r.int(a, b)` nguyên trong [a, b]; `r.pick(list)`. */
export function rng(seed) {
  let s = seed >>> 0;
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = (a, b) => a + Math.floor(r() * (b - a + 1));
  r.range = (a, b) => a + r() * (b - a);
  r.pick = (list) => list[Math.floor(r() * list.length)];
  return r;
}

const smooth = (t) => t * t * (3 - 2 * t);
/** Nhiễu giá trị 2D trơn [0, 1), bước lưới `scale` ô. */
export function valueNoise(x, y, scale, seed) {
  const fx = x / scale, fy = y / scale, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = smooth(fx - x0), ty = smooth(fy - y0);
  const a = hashF(x0, y0, seed), b = hashF(x0 + 1, y0, seed), c = hashF(x0, y0 + 1, seed), d = hashF(x0 + 1, y0 + 1, seed);
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
}
/** Nhiễu nhiều quãng (fbm) [0, 1): `octaves` lớp, mỗi lớp nhỏ đi một nửa. */
export function fbm(x, y, scale, seed, octaves = 3) {
  let sum = 0, amp = 1, norm = 0;
  for (let o = 0; o < octaves; o++) { sum += valueNoise(x, y, scale, seed + o * 7919) * amp; norm += amp; amp *= 0.5; scale /= 2; }
  return sum / norm;
}
