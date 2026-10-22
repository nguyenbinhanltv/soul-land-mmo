// Ảnh toàn cảnh isometric của một file Tiled, vẽ bằng đúng ảnh ô / vật của shared/assets/iso/tiles.json như client (bước 11.3):
// ô nền chọn biến thể và lật theo băm vị trí, vật đứng đặt chân ở tâm ô và sắp theo độ sâu x + y, nhân màu `~#rrggbb` / sáng `~x1.3`.
// Nhà / tường thành (gid 14 / 15, client dựng bằng code) vẽ thành khối đơn giản theo màu `build` của vùng. Không có lớp phủ mép,
// công trình ảnh, ánh sáng và hồn thú (chỉ để duyệt bố cục cả bản đồ); ảnh trong game chụp bằng Chrome.
//   node tools/maps/preview.mjs <file Tiled .json> <ra.png> [--map <mapId>] [--scale 0.25] [--tint #eef4dc]
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readPng, encodePng, Img, hex } from "../assets/lib.mjs";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const ISO = path.join(ROOT, "shared", "assets", "iso"), PROPS = path.join(ROOT, "shared", "assets", "sprites", "iso", "props");
const TW = 32, TH = 16; // thoi một ô logic (client/src/iso.ts)

/** Băm vị trí giống client/src/isoMap.ts (chọn biến thể, lật, vật trong danh sách). */
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0; };

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : d; };
const mapArg = opt("--map", ""), scale = +opt("--scale", "0.25"), tintArg = opt("--tint", "");
const [src, out] = args;
if (!src || !out) { console.error("Cách dùng: preview.mjs <file Tiled .json> <ra.png> [--map <mapId>] [--scale 0.25] [--tint #rrggbb]"); process.exit(1); }
const mapId = mapArg || path.basename(src).replace(/(\.v\d+)?\.json$/, "");
const raw = JSON.parse(readFileSync(src, "utf8")), MW = raw.width, MH = raw.height;
const data = JSON.parse(readFileSync(path.join(ISO, "tiles.json"), "utf8"));
const set = { ground: { ...data.maps["*"]?.ground, ...data.maps[mapId]?.ground }, props: { ...data.maps["*"]?.props, ...data.maps[mapId]?.props } };
const layer = (n) => raw.layers.find((l) => l.type === "tilelayer" && l.name === n)?.data ?? [];
const ground = layer("ground"), trees = layer("trees");

/** Ảnh đã nhân màu theo tham chiếu "tên~#rrggbb" / "tên~x1.3" (cache theo đường dẫn + màu). */
const cache = new Map();
function image(file, tint) {
  const k = file + "|" + tint; if (cache.has(k)) return cache.get(k);
  const img = readPng(file), d = img.data;
  const mul = tint.startsWith("#") ? hex(tint).map((v) => v / 255) : tint.startsWith("x") ? [+tint.slice(1), +tint.slice(1), +tint.slice(1)] : null;
  const amb = tintArg ? hex(tintArg).map((v) => v / 255) : [1, 1, 1];
  for (let i = 0; i < d.length; i += 4) for (let c = 0; c < 3; c++) d[i + c] = Math.min(255, Math.round(d[i + c] * (mul ? mul[c] : 1) * amb[c]));
  cache.set(k, img); return img;
}
const ref = (r) => { const [name, tint] = r.split("~"); return { name, tint: tint ?? "" }; };

// Khung ảnh: tâm ô (x, y) ở màn hình ((x − y)·16, (x + y)·8); chừa lề trên cho vật cao.
const RISE = 170, W = (MW + MH) * (TW / 2) + TW, H = (MW + MH) * (TH / 2) + RISE + TH * 2, OX = MH * (TW / 2) + TW / 2, OY = RISE;
const canvas = new Img(W, H);
for (let i = 0; i < W * H; i++) canvas.data.set([26, 16, 32, 255], i * 4);
/** Dán `img` (nhân alpha, có lật) sao cho điểm (ax, ay) của ảnh nằm ở (sx, sy). */
function paste(img, ax, ay, sx, sy, flip = false) {
  const x0 = Math.round(sx - (flip ? img.w - ax : ax)), y0 = Math.round(sy - ay), s = img.data, d = canvas.data;
  for (let y = 0; y < img.h; y++) {
    const Y = y0 + y; if (Y < 0 || Y >= H) continue;
    for (let x = 0; x < img.w; x++) {
      const X = x0 + x; if (X < 0 || X >= W) continue;
      const u = flip ? img.w - 1 - x : x, si = (y * img.w + u) * 4, a = s[si + 3]; if (!a) continue;
      const di = (Y * W + X) * 4, f = a / 255;
      for (let c = 0; c < 3; c++) d[di + c] = Math.round(s[si + c] * f + d[di + c] * (1 - f));
    }
  }
}
const center = (x, y) => [OX + (x - y) * (TW / 2), OY + (x + y) * (TH / 2) + TH / 2];

// Nền: từ sau ra trước (x + y tăng dần) để đáy ô trước che ô sau.
let missing = new Set();
for (let s = 0; s < MW + MH - 1; s++) for (let y = Math.max(0, s - MW + 1); y <= Math.min(MH - 1, s); y++) {
  const x = s - y, gid = ground[y * MW + x]; if (!gid) continue;
  const r = set.ground[gid]; const g = r && data.ground[ref(r).name];
  if (!g) { missing.add(`nền ${gid}`); continue; }
  const h = hash(x, y), file = path.join(ISO, g.img[h % g.img.length]), [cx, cy] = center(x, y);
  paste(image(file, ref(r).tint), g.c[0], g.c[1], cx, cy, g.flip !== false && !!(h & 0x100));
}
// Vật đứng: sắp theo độ sâu của chân (tâm ô), cùng độ sâu thì theo x.
const props = [];
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const gid = trees[y * MW + x]; if (!gid) continue;
  if (gid === 14 || gid === 15) { props.push({ x, y, d: x + y, block: gid }); continue; }
  const r = set.props[gid]; if (!r) { missing.add(`vật ${gid}`); continue; }
  const list = [].concat(r), pick = ref(list[hash(x, y, 7) % list.length]), p = data.props[pick.name];
  if (!p) { missing.add(`vật ${pick.name}`); continue; }
  props.push({ x, y, d: x + y, file: path.join(PROPS, `${p.key.replace(/^prop_/, "")}.png`), tint: pick.tint, foot: p.foot, flip: p.flip === true || (p.flip !== false && hash(x, y, 3) % 2 === 1) });
}
props.sort((a, b) => a.d - b.d || a.x - b.x);
// Khối nhà: mái (gid 14) cao hơn tường (gid 15); tường đứng riêng (không có mái ngay phía trên) là tường thành, màu `fence`.
const build = data.maps[mapId]?.build ?? data.maps["*"]?.build;
const rgb = (h) => hex(h ?? "#888888").slice(0, 3), shade = (c, k) => c.map((v) => Math.min(255, Math.round(v * k)));
function block(x, y, gid) {
  const roofAbove = y > 0 && trees[(y - 1) * MW + x] === 14, house = gid === 14 || roofAbove;
  const h = gid === 14 ? (build?.wallH ?? 30) + 10 : house ? (build?.wallH ?? 30) : (build?.fence?.h ?? 26);
  const top = rgb(gid === 14 ? build?.roof?.[0] : house ? build?.wall?.[2] : build?.fence?.top), side = rgb(gid === 14 ? build?.roof?.[1] : house ? build?.wall?.[0] : build?.fence?.wall?.[0]);
  const [cx, cy] = center(x, y), put = (X, Y, c) => { if (X >= 0 && Y >= 0 && X < W && Y < H) canvas.data.set([...c, 255], (Y * W + X) * 4); };
  // Mặt bên trái / phải (thẳng đứng dưới hai cạnh dưới của thoi), rồi mặt trên ở độ cao h.
  for (let dx = -TW / 2; dx < TW / 2; dx++) {
    const yEdge = cy + TH / 2 - Math.abs(dx) * (TH / TW) * 1;
    for (let k = 0; k < h; k++) put(Math.round(cx + dx), Math.round(yEdge - k), shade(side, dx < 0 ? 0.85 : 0.65));
  }
  for (let dy = -TH / 2; dy <= TH / 2; dy++) { const half = (TW / 2) * (1 - Math.abs(dy) / (TH / 2)); for (let dx = -half; dx < half; dx++) put(Math.round(cx + dx), Math.round(cy + dy - h), top); }
}
for (const p of props) {
  if (p.block) { block(p.x, p.y, p.block); continue; }
  const [cx, cy] = center(p.x, p.y); paste(image(p.file, p.tint), p.foot[0], p.foot[1], cx, cy, p.flip);
}
if (missing.size) console.warn("[preview] bỏ qua:", [...missing].join(", "));

// Thu nhỏ bằng lọc hộp (trung bình các điểm), giữ màu đọc được ở cỡ duyệt.
const k = Math.max(1, Math.round(1 / scale)), OW = Math.floor(W / k), OH = Math.floor(H / k), small = new Img(OW, OH);
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) {
  const acc = [0, 0, 0];
  for (let v = 0; v < k; v++) for (let u = 0; u < k; u++) { const i = ((y * k + v) * W + x * k + u) * 4; acc[0] += canvas.data[i]; acc[1] += canvas.data[i + 1]; acc[2] += canvas.data[i + 2]; }
  small.set(x, y, [acc[0] / (k * k), acc[1] / (k * k), acc[2] / (k * k), 255].map(Math.round));
}
writeFileSync(out, encodePng(small));
console.log(`[preview] ${out} ${OW}×${OH} (khung gốc ${W}×${H}, ${props.length} vật đứng)`);
