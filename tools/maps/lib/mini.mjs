// Ảnh nền bản đồ thủy mặc (R1 #428, theo dõi #426): shared/assets/mini/<mapId>.png, MINI_BASE.px điểm mỗi ô logic, sinh từ kết quả
// build() (lớp ground / trees đã gồm lớp chỉnh tay) và bố cục. Hàm thuần: không đọc giờ, không Math.random; màu nền lấy từ trung bình
// ảnh ô isometric thật (tiles.json) nên mỗi vùng đúng bảng màu của mình, rồi pha sắc giấy / mực. Client (R2) cắt ảnh này làm nền.
//   đất, rừng ─ màu ô nền / cây theo vùng niên hạn, chuyển màu nhẹ giữa các vùng (làm nhòe tầng bằng lọc hộp)
//   đường, cầu ─ nâu đất sáng; suối, ao ─ lam nhạt, viền mực mảnh ở mép bờ; vách ─ mực đậm
//   nhà, tường thành, tàn tích ─ nền sáng viền mực 1 điểm quanh khối
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Img, decodePng, hex } from "../../assets/lib.mjs";
import { hashF, hashStr, fbm } from "./rand.mjs";
import { MINI_BASE } from "../../../shared/data.ts";

const ROOT = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const ISO = path.join(ROOT, "shared", "assets", "iso");
const TILES = JSON.parse(readFileSync(path.join(ISO, "tiles.json"), "utf8"));

/** Sắc giấy bản đồ (pha vào mọi màu cho dịu) và mực viền. */
const PAPER = [236, 226, 200], INK = [38, 30, 36];
/** Sắc nhẹ theo tầng niên hạn (nông → sâu): vàng nhạt, xanh lá, lam, hồng, tím. Chuyển giữa các tầng đã làm nhòe. */
const TIER_TINT = [[232, 224, 168], [190, 214, 150], [150, 200, 200], [214, 150, 150], [184, 150, 214]];
const TIER_MIX = 0.16, BLUR = 5;
const gidsOf = (v) => (typeof v === "number" ? [v] : Array.isArray(v) ? v : Object.keys(v ?? {}).map(Number));
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const scale = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// ---------- Màu trung bình của ô nền ----------
const avgCache = new Map();
/** Trung bình các điểm đục của ảnh ô `name` (tiles.json ground[name].img[0]). */
function tileAvg(name) {
  if (!avgCache.has(name)) {
    const def = TILES.ground[name];
    if (!def) throw new Error(`mini: tiles.json không có ô nền "${name}"`);
    const img = decodePng(readFileSync(path.join(ISO, def.img[0])));
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3] > 128) { r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++; }
    avgCache.set(name, n ? [r / n, g / n, b / n] : [128, 128, 128]);
  }
  return avgCache.get(name);
}
/** "tên", "tên~#rrggbb" (nhân màu), "tên~x1.3" (sáng lên) như tiles.json. */
function specColor(spec) {
  const [name, mod] = spec.split("~"), c = tileAvg(name);
  if (!mod) return c;
  if (mod[0] === "x") return scale(c, +mod.slice(1));
  const t = hex(mod);
  return [c[0] * t[0] / 255, c[1] * t[1] / 255, c[2] * t[2] / 255];
}

/** Loại ô nền theo tên ô (khi gid không thuộc khóa nào của bố cục, ví dụ gid riêng của `area`). */
function classByTileName(name) {
  if (/nuoc_sau|nuoc_bien|ho_than/.test(name)) return "deep";
  if (/nuoc|suoi|ho_bang|bang_nut/.test(name)) return "water";
  if (/duong|cau/.test(name)) return "road";
  return "land";
}

/**
 * Ảnh nền bản đồ nhỏ. `r`: kết quả build() ({ map, zoneOf }), `L`: bố cục. Trả Img rộng MW×px, cao MH×px, mọi điểm đục.
 */
export function miniImage(r, L) {
  const { map, zoneOf } = r, MW = map.width, MH = map.height, N = MW * MH, px = MINI_BASE.px, mapId = L.map;
  const ground = map.layers.find((l) => l.name === "ground").data, trees = map.layers.find((l) => l.name === "trees").data;
  const gmap = { ...TILES.maps["*"].ground, ...TILES.maps[mapId]?.ground }, GG = L.gids.ground, GO = L.gids.objects ?? {};
  const build = TILES.maps[mapId]?.build ?? TILES.maps["*"].build ?? {};
  const seed = hashStr(`mini:${mapId}`);

  // gid nền → loại (theo khóa bố cục) và màu; gid vật → loại.
  const gClass = new Map(), set = (gid, cls) => { if (!gClass.has(gid)) gClass.set(gid, cls); };
  const kindOfGround = { water: "water", deep: "deep", ford: "ford", bank: "land", path: "road", pathDark: "road", bridge: "road", stony: "stone", pave: "stone", crack: "stone", camp: "land" };
  for (const [k, v] of Object.entries(GG)) if (kindOfGround[k]) for (const g of gidsOf(v)) set(g, kindOfGround[k]);
  for (const t of L.tiers) for (const [k, v] of Object.entries(t.ground ?? {})) if (kindOfGround[k]) for (const g of gidsOf(v)) set(g, kindOfGround[k]);
  const walk = new Set(["plant", ...(L.gids.walk ?? [])]);
  const oClass = new Map(); // gid vật → loại
  for (const t of L.tiers) for (const g of [...gidsOf(t.trees), ...gidsOf(t.denseTrees ?? [])]) oClass.set(g, "tree");
  const kindOfObj = { rock: "rock", cliff: "cliff", ruin: "wall", stele: "wall", arch: "wall", wall: "wall", roof: "roof", log: "log", ancient: "tree", tent: "wall", fire: "fire", sign: "sign", skull: "sign" };
  for (const [k, v] of Object.entries(GO)) for (const g of gidsOf(v)) {
    if (walk.has(k)) oClass.set(g, k === "plant" ? "plant" : "bridge");
    else if (!oClass.has(g)) oClass.set(g, kindOfObj[k] ?? "wall"); // vật riêng của bản đồ (giếng, hải đăng…): khối có viền mực
  }

  // Màu nền từng ô: trung bình ảnh ô + hạt nhiễu nhẹ.
  const gColor = new Map(), colorOfGround = (g) => {
    if (!gColor.has(g)) {
      const spec = gmap[g]; gColor.set(g, spec ? specColor(spec) : [120, 140, 100]);
      if (spec && !gClass.has(g)) gClass.set(g, classByTileName(spec.split("~")[0]));
    }
    return gColor.get(g);
  };

  // ---------- Tầng niên hạn nhòe ----------
  const nTier = L.tiers.length, tierOf = new Uint8Array(N);
  for (let i = 0; i < N; i++) tierOf[i] = zoneOf[i] < 0 ? 0 : L.zones[zoneOf[i]].tier;
  const tint = new Float32Array(N * 3).fill(0), hasTint = L.zones.length > 0 && nTier > 1;
  if (hasTint) {
    const tmp = new Float32Array(N), out = new Float32Array(N);
    for (let t = 0; t < nTier; t++) {
      for (let i = 0; i < N; i++) tmp[i] = tierOf[i] === t ? 1 : 0;
      boxBlur(tmp, out, MW, MH, BLUR);
      const c = TIER_TINT[Math.min(t, TIER_TINT.length - 1)];
      for (let i = 0; i < N; i++) { tint[i * 3] += out[i] * c[0]; tint[i * 3 + 1] += out[i] * c[1]; tint[i * 3 + 2] += out[i] * c[2]; }
    }
  }

  // ---------- Phân loại từng ô ----------
  const cls = new Array(N), col = new Array(N);
  const TREE = [[84, 128, 76], [68, 112, 66], [52, 92, 56], [40, 72, 48]];
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = y * MW + x, g = ground[i], t = trees[i];
    let c = colorOfGround(g), k = gClass.get(g) ?? "land";
    // Nhiễu: mảng loang tần thấp + hạt, như vết nước loang trên giấy.
    const wash = 0.94 + 0.12 * fbm(x, y, 7, seed, 2) + 0.04 * (hashF(x, y, seed + 1) - 0.5);
    const o = t ? oClass.get(t) ?? "wall" : null;
    if (o && o !== "plant" && o !== "bridge" && k !== "water" && k !== "deep") {
      k = o;
      if (o === "tree") { const idx = t >= 17 && t <= 20 ? t - 17 : 1; c = mix(TREE[idx], c, 0.3); }
      else if (o === "rock") c = mix(c, [120, 116, 108], 0.7);
      else if (o === "cliff") c = [72, 68, 74];
      else if (o === "roof") c = build.roof ? hex(build.roof[0]).slice(0, 3) : [140, 74, 58];
      else if (o === "wall") c = mix([188, 176, 150], c, 0.2);
      else if (o === "log") c = mix(c, [96, 72, 48], 0.6);
      else if (o === "fire") c = [226, 140, 60];
      else if (o === "sign") c = [200, 170, 110];
    } else if (o === "bridge") { k = "road"; c = [150, 116, 78]; }
    else if (o === "plant") c = mix(c, [78, 130, 84], 0.35);
    if (k === "road") c = mix(c, [196, 170, 120], 0.6);
    else if (k === "water") c = mix(c, [150, 190, 214], 0.45);
    else if (k === "deep") c = mix(c, [86, 130, 168], 0.4);
    // Pha sắc tầng niên hạn (chỉ đất, rừng), rồi sắc giấy cho dịu.
    if (hasTint && (k === "land" || k === "tree" || k === "stone" || k === "plant" || k === "log")) c = mix(c, [tint[i * 3], tint[i * 3 + 1], tint[i * 3 + 2]], TIER_MIX);
    c = mix(c, PAPER, k === "cliff" || k === "roof" ? 0.05 : 0.2);
    cls[i] = k; col[i] = scale(c, wash);
  }

  // ---------- Vẽ, viền mực ở mức điểm ảnh ----------
  // Khối có viền: điểm ảnh nằm sát ô lân cận khác loại thì tô mực. Ô ngoài bản đồ tính là cùng loại (không viền mép ảnh).
  const solidInk = new Set(["roof", "wall", "cliff"]);
  const img = new Img(MW * px, MH * px), px2 = (v) => [Math.round(Math.min(255, Math.max(0, v[0]))), Math.round(Math.min(255, Math.max(0, v[1]))), Math.round(Math.min(255, Math.max(0, v[2]))), 255];
  const kindAt = (x, y) => (x < 0 || y < 0 || x >= MW || y >= MH ? null : cls[y * MW + x]);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = y * MW + x, k = cls[i], solid = solidInk.has(k), wet = k === "water" || k === "deep";
    for (let sy = 0; sy < px; sy++) for (let sx = 0; sx < px; sx++) {
      let c = col[i];
      // Ô lân cận mà điểm ảnh này sát: trái / phải theo sx, trên / dưới theo sy (px 2: mỗi điểm ảnh sát hai ô lân cận).
      const nx = sx === 0 ? x - 1 : sx === px - 1 ? x + 1 : x, ny = sy === 0 ? y - 1 : sy === px - 1 ? y + 1 : y;
      const a = kindAt(nx, y), b = kindAt(x, ny);
      if (solid) { if ((a !== null && a !== k && !(k === "wall" && a === "roof")) || (b !== null && b !== k && !(k === "wall" && b === "roof"))) c = mix(c, INK, 0.85); }
      else if (wet) { if ((a !== null && a !== "water" && a !== "deep") || (b !== null && b !== "water" && b !== "deep")) c = mix(c, INK, 0.45); }
      img.set(x * px + sx, y * px + sy, px2(c));
    }
  }
  return img;
}

/** Lọc hộp phân tách bán kính `rad` (nhanh nhờ tổng cộng dồn); mép lấy giá trị biên. */
function boxBlur(src, dst, W, H, rad) {
  const tmp = new Float32Array(src.length), n = 2 * rad + 1;
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let k = -rad; k <= rad; k++) s += src[y * W + Math.min(W - 1, Math.max(0, k))];
    for (let x = 0; x < W; x++) {
      tmp[y * W + x] = s / n;
      s += src[y * W + Math.min(W - 1, x + rad + 1)] - src[y * W + Math.max(0, x - rad)];
    }
  }
  for (let x = 0; x < W; x++) {
    let s = 0;
    for (let k = -rad; k <= rad; k++) s += tmp[Math.min(H - 1, Math.max(0, k)) * W + x];
    for (let y = 0; y < H; y++) {
      dst[y * W + x] = s / n;
      s += tmp[Math.min(H - 1, y + rad + 1) * W + x] - tmp[Math.max(0, y - rad) * W + x];
    }
  }
}

/** So hai ảnh theo điểm ảnh (check: không so byte PNG vì đầu ra zlib phụ thuộc phiên bản). Trả null nếu khớp, hoặc lời báo. */
export function diffImg(a, b) {
  if (a.w !== b.w || a.h !== b.h) return `cỡ ${a.w}×${a.h}, bản sinh ${b.w}×${b.h}`;
  for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) { const p = i >> 2; return `khác tại điểm (${p % a.w}, ${(p / a.w) | 0})`; }
  return null;
}
