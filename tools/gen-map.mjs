// Sinh bản đồ Tiled khởi đầu: shared/assets/forest.json
// Sau khi sinh, mở file bằng Tiled (https://www.mapeditor.org) để vẽ tiếp bằng tay.
// Chạy: node tools/gen-map.mjs
import { writeFileSync } from "node:fs";

const MW = 90, MH = 60;
// gid = id ô trong tileset + 1
const GID = { grass: [1, 2, 3, 4], flower: [5, 6], path: 7, pathDark: 8, water: 9, camp: 10, tent: 11, fire: 12, tree: [17, 18, 19, 20], canopy: [21, 22, 23, 24] };
const zoneOf = (x) => (x < 22 ? 0 : x < 45 ? 1 : x < 68 ? 2 : 3);

let s = 20261019;
const r = () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 4294967296);
// ô logic: 0 cỏ, 1 cây, 2 nước, 3 đường, 4 hoa, 5 trại
const m = new Uint8Array(MW * MH);
const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MW && y < MH) m[y * MW + x] = v; };
const dens = [0.05, 0.09, 0.13, 0.17];
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const z = zoneOf(x);
  if (r() < dens[z]) set(x, y, 1); else if (z < 2 && r() < 0.05) set(x, y, 4);
}
for (let i = 0; i < 70; i++) {
  const cx = (r() * MW) | 0, cy = (r() * MH) | 0, rad = 1 + r() * (1 + zoneOf(cx));
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (Math.hypot(x, y) < rad && r() < 0.65) set(cx + x, cy + y, 1);
}
for (let i = 0; i < 13; i++) {
  const cx = 10 + r() * (MW - 14), cy = 4 + r() * (MH - 8), rad = 1.6 + r() * 2.6;
  for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++)
    if (Math.hypot(x, y) < rad * (0.8 + r() * 0.35)) set(Math.round(cx + x), Math.round(cy + y), 2);
}
let py = 30;
for (let x = 1; x < MW - 1; x++) { set(x, py, 3); set(x, py + 1, 3); if (r() < 0.3) py = Math.max(6, Math.min(MH - 8, py + (r() < 0.5 ? -1 : 1))); }
for (const x0 of [14, 33, 55, 76]) { let x = x0; for (let y = 2; y < MH - 2; y++) { set(x, y, 3); set(x + 1, y, 3); if (r() < 0.25) x += r() < 0.5 ? -1 : 1; } }
for (let y = 25; y <= 35; y++) for (let x = 1; x <= 8; x++) set(x, y, 5);
for (let x = 0; x < MW; x++) { set(x, 0, 1); set(x, MH - 1, 1); }
for (let y = 0; y < MH; y++) { set(0, y, 1); set(MW - 1, y, 1); }

const ground = new Array(MW * MH).fill(0), trees = new Array(MW * MH).fill(0), canopy = new Array(MW * MH).fill(0);
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
  const i = y * MW + x, t = m[i], z = zoneOf(x);
  ground[i] = t === 2 ? GID.water : t === 3 ? (z >= 3 ? GID.pathDark : GID.path) : t === 5 ? GID.camp : t === 4 ? GID.flower[Math.min(z, 1)] : GID.grass[z];
  if (t === 1) { trees[i] = GID.tree[z]; if (y > 0) canopy[i - MW] = GID.canopy[z]; }
}
trees[27 * MW + 2] = GID.tent;
trees[30 * MW + 4] = GID.fire;

const T = 16;
const prop = (name, type, value) => ({ name, type, value });
let oid = 1;
const zoneObj = (name, hint, x0, x1, weights, count) => ({
  id: oid++, name, type: "zone", x: x0 * T, y: 0, width: (x1 - x0) * T, height: MH * T, rotation: 0, visible: true,
  properties: [prop("hint", "string", hint), prop("weights", "string", weights.join(",")), prop("count", "int", count)],
});
const objects = [
  zoneObj("Bìa rừng", "Hồn thú 10 – 100 năm", 9, 22, [0.85, 0.15, 0, 0, 0], 14),
  zoneObj("Rừng thưa", "Hồn thú 100 – 1.000 năm", 22, 45, [0.2, 0.65, 0.15, 0, 0], 12),
  zoneObj("Rừng sâu", "Hồn thú 1.000 – 10.000 năm", 45, 68, [0, 0.25, 0.6, 0.15, 0], 10),
  zoneObj("Lõi rừng cổ", "Cẩn thận: hồn thú vạn năm", 68, 89, [0, 0, 0.35, 0.63, 0.02], 9),
  { id: oid++, name: "Doanh trại", type: "spawn", x: 1 * T, y: 25 * T, width: 8 * T, height: 11 * T, rotation: 0, visible: true, properties: [] },
];

const layer = (id, name, data) => ({ id, name, type: "tilelayer", data, width: MW, height: MH, opacity: 1, visible: true, x: 0, y: 0 });
const collides = [8, 10, 11, 16, 17, 18, 19].map((id) => ({ id, properties: [prop("collides", "bool", true)] }));

const map = {
  compressionlevel: -1, type: "map", version: "1.10", tiledversion: "1.10.2",
  orientation: "orthogonal", renderorder: "right-down", infinite: false,
  width: MW, height: MH, tilewidth: T, tileheight: T,
  nextlayerid: 5, nextobjectid: oid,
  layers: [
    layer(1, "ground", ground),
    layer(2, "trees", trees),
    { id: 3, name: "zones", type: "objectgroup", draworder: "topdown", objects, opacity: 1, visible: true, x: 0, y: 0 },
    layer(4, "canopy", canopy),
  ],
  tilesets: [{
    firstgid: 1, name: "tiles", image: "tiles.png", imagewidth: 128, imageheight: 48,
    tilewidth: T, tileheight: T, columns: 8, tilecount: 24, margin: 0, spacing: 0, tiles: collides,
  }],
};
writeFileSync(new URL("../shared/assets/forest.json", import.meta.url), JSON.stringify(map));
console.log("Đã sinh shared/assets/forest.json", MW, "x", MH);
