// Công cụ dựng bản đồ lớn (bước 11.3, GAME_DESIGN.md mục 5.3, 6): sinh file Tiled shared/assets/<out> từ MÔ TẢ BỐ CỤC
// tools/maps/layouts/<mapId>.json (kích thước, vùng niên hạn, điểm chính, đường nối, sông suối, rừng, vách, tàn tích, điểm nhấn) và
// lớp chỉnh tay tools/maps/hand/<mapId>.json (nếu có). Cùng bố cục, cùng hạt giống, cùng lớp tay thì ra đúng cùng một file.
// Chỉ dùng gid có trong shared/assets/iso/tiles.json (bộ "*" và bộ của mapId). Cách viết bố cục: tools/maps/README.md.
//
//   node tools/maps/build.mjs <mapId>… [--seed N] [--preview <ảnh.png>]   sinh file Tiled (và ảnh nhìn thẳng có vùng, điểm chính)
//   node tools/maps/build.mjs --check                                      sinh lại mọi bố cục trong bộ nhớ, so với file đang có
//   node tools/maps/build.mjs <mapId> --hand-init                          tạo lớp chỉnh tay rỗng để mở bằng Tiled
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashF, hashStr, fbm, rng } from "./lib/rand.mjs";
import { shapeTest, rectsOf, spline, astar } from "./lib/geom.mjs";
import { topdownPreview } from "./lib/preview.mjs";
import { miniImage, diffImg } from "./lib/mini.mjs";
import { decodePng, encodePng } from "../assets/lib.mjs";
import { BEAST_DENSITY, MAPS, BOSSES, TIERS, MAX_YEARS, MINI_BASE, SPAWN_CLEAR, beastIndex, bossIndex, parseLevelRange, TILE } from "../../shared/data.ts";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const LAYOUTS = path.join(ROOT, "tools", "maps", "layouts"), HAND = path.join(ROOT, "tools", "maps", "hand");
const ASSETS = path.join(ROOT, "shared", "assets");

// ---------- Loại ô logic ----------
/** Nền: mỗi loại ứng với một khóa trong `gids.ground` của bố cục. */
const G = { grass: 0, path: 1, camp: 2, pave: 3, crack: 4, water: 5, ford: 6, bank: 7, deep: 8, stony: 9, glow: 10, bridge: 11 };
const G_NAMES = Object.keys(G);
/**
 * Vật trên lớp `trees`: mỗi loại ứng với một khóa trong `gids.objects` (cây theo tầng ở `tiers[].trees`). `plant` đi xuyên được.
 * Khóa khác trong `gids.objects` của bố cục là loại vật riêng của bản đồ đó (giếng, hải đăng…, #333), dùng như các loại ở đây;
 * loại riêng có trong `gids.walk` thì đi xuyên được như `plant`.
 */
const O = { none: 0, tree: 1, rock: 2, cliff: 3, ruin: 4, stele: 5, arch: 6, log: 7, ancient: 8, tent: 9, fire: 10, plant: 11, sign: 12, skull: 13,
  roof: 14, wall: 15 };
const WET = new Set([G.water, G.deep]);

const prop = (name, type, value) => ({ name, type, value });

/** Đọc bố cục và kiểm tra các trường bắt buộc. */
export function readLayout(mapId) {
  const file = path.join(LAYOUTS, `${mapId}.json`);
  if (!existsSync(file)) throw new Error(`Không có bố cục ${path.relative(ROOT, file)}`);
  const L = JSON.parse(readFileSync(file, "utf8"));
  if (L.map !== mapId) throw new Error(`${mapId}.json: trường "map" phải là "${mapId}"`);
  if (!Object.hasOwn(MAPS, mapId)) throw new Error(`${mapId}: không có trong MAPS (shared/data.ts)`);
  if (!Array.isArray(L.size) || L.size.length !== 2) throw new Error(`${mapId}: thiếu "size": [rộng, cao]`);
  for (const k of ["seed", "out", "tiers", "zones", "gids"]) if (L[k] === undefined) throw new Error(`${mapId}: thiếu "${k}"`);
  return L;
}

/**
 * Dựng bản đồ từ bố cục `L` (đã đọc), lớp tay `hand` (Tiled thô hoặc null). Trả { json, stats, preview } với `json` là chuỗi file
 * Tiled. Hàm thuần: không đọc giờ, không Math.random.
 */
export function build(L, hand = null, seedOverride = null) {
  const [MW, MH] = L.size, N = MW * MH, seed = (seedOverride ?? L.seed) >>> 0, mapId = L.map;
  const sub = (name) => (seed ^ hashStr(name)) >>> 0; // mỗi tính năng một dòng ngẫu nhiên riêng
  const gnd = new Uint8Array(N), obj = new Uint8Array(N), lock = new Uint8Array(N);
  // Loại vật của bố cục: loại chung (O) rồi loại riêng khai trong `gids.objects`; tên loại không có thì báo lỗi (không bỏ lặng lẽ).
  const K = { ...O }; for (const k of Object.keys(L.gids.objects ?? {})) if (!Object.hasOwn(K, k)) K[k] = Object.keys(K).length;
  const K_NAMES = Object.keys(K), WALK = new Set(["plant", ...(L.gids.walk ?? [])]);
  if (K_NAMES.length > 255) throw new Error(`${mapId}: quá nhiều loại vật`);
  for (const k of WALK) if (k !== "plant" && !Object.hasOwn(L.gids.objects ?? {}, k)) throw new Error(`${mapId}: gids.walk có "${k}" không khai trong gids.objects`);
  const kind = (k) => { if (!Object.hasOwn(K, k)) throw new Error(`${mapId}: không có loại vật "${k}" (khai trong gids.objects)`); return K[k]; };
  // Gid nền riêng của ô (tính năng `area` có `gid`): chỉ dùng khi ô còn đúng loại nền `overType` lúc ra gid.
  const overGid = new Uint16Array(N), overType = new Uint8Array(N), wetOver = new Set();
  const inside = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
  const at = (x, y) => y * MW + x;
  const setO = (x, y, v, force = false) => { if (inside(x, y) && (force || !lock[at(x, y)])) obj[at(x, y)] = v; };
  const disc = (cx, cy, r, fn) => {
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++)
      if (inside(x, y)) { const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d < r) fn(x, y, d); }
  };
  const warn = [];

  // ---------- Vùng: mỗi ô thuộc vùng đầu tiên trong danh sách có hình chứa nó ----------
  const zoneTests = L.zones.map((z) => shapeTest(z));
  const zoneOf = new Int16Array(N).fill(-1);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) zoneOf[at(x, y)] = zoneTests.findIndex((t) => t(x, y));
  const tierOf = (i) => { const z = zoneOf[i]; return z < 0 ? 0 : L.zones[z].tier; };
  // Rừng, nền, loài cây theo tầng của ô lệch đi tối đa `blend` ô theo nhiễu (mép tầng loang, không thành đường thẳng); vùng hồn thú
  // vẫn theo hình đúng. `blend` 0 (mặc định): đúng tầng của ô.
  const blend = L.blend ?? 0, sJ = sub("blend");
  const tierVis = new Uint8Array(N);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (!blend) { tierVis[at(x, y)] = tierOf(at(x, y)); continue; }
    const jx = Math.min(MW - 1, Math.max(0, Math.round(x + (fbm(x, y, 9, sJ, 2) - 0.5) * 2 * blend)));
    const jy = Math.min(MH - 1, Math.max(0, Math.round(y + (fbm(x, y, 9, sJ + 1, 2) - 0.5) * 2 * blend)));
    tierVis[at(x, y)] = tierOf(at(jx, jy));
  }
  const tier = (i) => L.tiers[tierVis[i]];
  // Sắc nền riêng của tầng (`tiers[].ground`) không được đè nước / lòng sâu: ô chặn tính theo `gids.ground.water` / `deep`.
  for (const t of L.tiers) if (t.ground?.water !== undefined || t.ground?.deep !== undefined) throw new Error(`${mapId}: tầng "${t.name}": ground không được đè water / deep`);

  // ---------- 1. Rừng nền: mật độ theo tầng, cụm rậm theo nhiễu ----------
  const sF = sub("forest"), sC = sub("cluster");
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = at(x, y), t = tier(i), c = fbm(x, y, t.clusterScale ?? 16, sC, 3);
    const p = t.density + (c > t.cluster ? (c - t.cluster) / (1 - t.cluster) * (t.clusterDensity ?? 0.8) : 0);
    if (hashF(x, y, sF) < p) obj[i] = O.tree;
  }

  // ---------- 2. Tính năng theo thứ tự trong bố cục ----------
  const F = {
    /** Sông / suối theo spline qua `pts`: rộng `width` ± `wobble`, bờ `bank` ô, chỗ lội nông quanh `fords`. */
    river(f) {
      const s = sub(`river:${f.name ?? ""}`), pts = spline(f.pts, 0.4);
      pts.forEach(([px, py], k) => {
        const w = Math.max(1.2, f.width + (fbm(k, 0, 18, s, 2) - 0.5) * 2 * (f.wobble ?? 0)), r = w / 2;
        disc(px, py, r + (f.bank ?? 1), (x, y, d) => {
          const i = at(x, y); if (lock[i]) return;
          if (d < r) { gnd[i] = G.water; obj[i] = O.none; }
          else if (!WET.has(gnd[i])) { gnd[i] = G.bank; if (hashF(x, y, s + 1) < 0.85) obj[i] = O.none; }
        });
      });
      for (const [fx, fy, fr = 2.5] of f.fords ?? []) disc(fx, fy, fr, (x, y) => { const i = at(x, y); if (WET.has(gnd[i])) gnd[i] = G.ford; });
    },
    /** Ao / hồ hình loang quanh `at` bán kính `r`: lòng sâu (chặn), mép nước nông chặn, bờ đất. */
    pond(f) {
      const s = sub(`pond:${f.at}`), [cx, cy] = f.at;
      disc(cx, cy, f.r + 2.5, (x, y, d) => {
        const i = at(x, y); if (lock[i]) return;
        const rr = f.r * (0.75 + 0.5 * fbm(x, y, 4, s, 2));
        if (d < rr - 1.6) { gnd[i] = G.deep; obj[i] = O.none; }
        else if (d < rr) { gnd[i] = G.water; obj[i] = O.none; }
        else if (d < rr + 1 && !WET.has(gnd[i])) { gnd[i] = G.bank; obj[i] = O.none; }
      });
    },
    /**
     * Vách nhiều tầng: `rows` dải khối đá song song cách nhau `spacing` ô (lệch về phía `side` = ±1 so với hướng đi của `pts`),
     * mỗi dải chừa lối lên `gapLen` ô sau mỗi `gap` ô (lệch pha giữa các tầng để đường lên ngoằn ngoèo); mặt bậc giữa các dải là
     * nền đá, cây thưa.
     */
    cliff(f) {
      const s = sub(`cliff:${f.pts[0]}`), pts = spline(f.pts, 0.35), rows = f.rows ?? 2, sp = f.spacing ?? 3, side = f.side ?? 1;
      let len = 0;
      for (let k = 0; k < pts.length; k++) {
        const [px, py] = pts[k], [qx, qy] = pts[Math.min(k + 1, pts.length - 1)], [ox, oy] = pts[Math.max(k - 1, 0)];
        const dx = qx - ox, dy = qy - oy, dl = Math.hypot(dx, dy) || 1, nx = (-dy / dl) * side, ny = (dx / dl) * side;
        if (k) len += Math.hypot(px - pts[k - 1][0], py - pts[k - 1][1]);
        for (let row = 0; row < rows; row++) {
          const off = row * sp, cx = px + nx * off, cy = py + ny * off, phase = (len + row * (f.gap ?? 14) * 0.5 + (s % 7)) % (f.gap ?? 14);
          if (phase < (f.gapLen ?? 3)) continue;
          const x = Math.floor(cx), y = Math.floor(cy);
          if (inside(x, y) && !lock[at(x, y)] && !WET.has(gnd[at(x, y)])) obj[at(x, y)] = O.cliff;
          // Mặt bậc phía trên dải (giữa dải này và dải sau): nền đá, bớt cây.
          if (row < rows - 1 || f.top) for (let t = 1; t < sp; t++) {
            const tx = Math.floor(cx + nx * t), ty = Math.floor(cy + ny * t);
            if (!inside(tx, ty) || lock[at(tx, ty)] || WET.has(gnd[at(tx, ty)])) continue;
            gnd[at(tx, ty)] = G.stony; if (obj[at(tx, ty)] === O.tree && hashF(tx, ty, s) < 0.7) obj[at(tx, ty)] = O.none;
          }
        }
      }
    },
    /** Khoảng trống tròn loang (bỏ vật, giữ nền), `ground` tùy chọn: tên loại nền phủ lên. */
    clearing(f) {
      const s = sub(`clearing:${f.at}`), [cx, cy] = f.at;
      disc(cx, cy, f.r + 2, (x, y, d) => {
        const i = at(x, y); if (d > f.r * (0.8 + 0.4 * fbm(x, y, 5, s, 2))) return;
        if (!WET.has(gnd[i])) { obj[i] = O.none; if (f.ground) gnd[i] = G[f.ground]; }
        if (f.lock) lock[i] = 1;
      });
    },
    /** Trại: nền trại trong `rect` (mép loang), lều, lửa trại, khúc gỗ, biển chỉ đường; khóa cả khu. */
    camp(f) {
      const s = sub(`camp:${f.rect}`), [x0, y0, w, h] = f.rect;
      for (let y = y0 - 2; y < y0 + h + 2; y++) for (let x = x0 - 2; x < x0 + w + 2; x++) {
        if (!inside(x, y)) continue;
        const ex = Math.max(x0 - x, x - (x0 + w - 1), 0), ey = Math.max(y0 - y, y - (y0 + h - 1), 0), e = Math.hypot(ex, ey);
        if (e > 2.2 * fbm(x, y, 3, s, 2)) continue;
        const i = at(x, y); gnd[i] = e > 0 ? G.grass : G.camp; obj[i] = O.none; lock[i] = 1;
      }
      place(f.tents, O.tent); place(f.fires, O.fire); place(f.logs, O.log); place(f.signs, O.sign);
    },
    /**
     * Tàn tích: sân đá (lẫn ô nứt, cỏ mọc xen) trong `rect`, tường đổ dọc chu vi (khuyết ngẫu nhiên, chừa `gates`), bia đá `steles`,
     * vòm đá `arches`, đá rơi; khóa cả khu.
     */
    ruins(f) {
      const s = sub(`ruins:${f.rect}`), [x0, y0, w, h] = f.rect, gates = f.gates ?? [];
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        if (!inside(x, y)) continue;
        const i = at(x, y), n = fbm(x, y, 4, s, 2), edge = x === x0 || y === y0 || x === x0 + w - 1 || y === y0 + h - 1;
        gnd[i] = n > 0.66 ? G.grass : fbm(x, y, 3, s + 3, 2) > 0.58 ? G.crack : G.pave; obj[i] = O.none; lock[i] = 1;
        const nearGate = gates.some(([gx, gy]) => Math.abs(gx - x) <= 1 && Math.abs(gy - y) <= 1);
        if (edge && !nearGate && hashF(x, y, s + 1) > (f.broken ?? 0.25)) obj[i] = O.ruin;
        else if (!edge && hashF(x, y, s + 2) < (f.rubble ?? 0.03)) obj[i] = O.rock;
      }
      place(f.steles, O.stele); place(f.arches, O.arch); place(f.walls, O.ruin);
    },
    /** Điểm nhấn cây cổ thụ: khoảng trống `r`, rêu phát quang loang, cây ở tâm, rễ lớn quanh gốc, dương xỉ / nấm rải vòng ngoài. */
    ancient(f) {
      const s = sub(`ancient:${f.at}`), [cx, cy] = f.at;
      disc(cx, cy, f.r, (x, y, d) => {
        const i = at(x, y); obj[i] = O.none; lock[i] = 1;
        if (!WET.has(gnd[i])) gnd[i] = d < f.r * 0.7 && fbm(x, y, 3, s, 2) > 0.5 ? G.glow : G.grass;
        if (d > f.r * 0.55 && d < f.r * 0.9 && hashF(x, y, s) < (f.plants ?? 0.12)) obj[i] = O.plant;
      });
      setO(Math.floor(cx), Math.floor(cy), O.ancient, true);
      for (const [dx, dy] of f.roots ?? [[-2, 1], [2, -1], [1, 2], [-1, -2]]) setO(Math.floor(cx) + dx, Math.floor(cy) + dy, O.log, true);
    },
    /**
     * Hang thú vương: bãi trống bầu dục tâm `at`, bán trục `rx` × `ry`, vây bằng vòng vách (`wall`: cliff | tree) dày khoảng 2 ô, chừa
     * lối vào rộng `door` ô ở phía `entrance` (n / s / e / w); xương thú `skulls` sát vách. Khóa cả khu.
     */
    lair(f) {
      const [cx, cy] = f.at, door = (f.door ?? 4) / 2, s = sub(`lair:${f.at}`), wall = kind(f.wall ?? "cliff");
      for (let y = Math.floor(cy - f.ry - 3); y <= Math.ceil(cy + f.ry + 3); y++) for (let x = Math.floor(cx - f.rx - 3); x <= Math.ceil(cx + f.rx + 3); x++) {
        if (!inside(x, y)) continue;
        const i = at(x, y), d = Math.hypot((x + 0.5 - cx) / f.rx, (y + 0.5 - cy) / f.ry);
        const inDoor = { n: y < cy && Math.abs(x + 0.5 - cx) < door, s: y > cy && Math.abs(x + 0.5 - cx) < door,
          w: x < cx && Math.abs(y + 0.5 - cy) < door, e: x > cx && Math.abs(y + 0.5 - cy) < door }[f.entrance ?? "n"];
        if (d < 1) { obj[i] = O.none; gnd[i] = fbm(x, y, 4, s, 2) > 0.55 ? G.stony : G.grass; lock[i] = 1; }
        else if (d < 1.4) { lock[i] = 1; obj[i] = inDoor ? O.none : wall; if (inDoor) gnd[i] = G.grass; }
      }
      place(f.skulls, O.skull);
    },
    /** Vật đặt thẳng: `kind` (tên loại vật) tại các ô `at`. */
    objects(f) { place(f.at, kind(f.kind)); },
    /**
     * Vùng nền: phủ loại nền `ground` lên hình `rect` / `poly` / `circle` (`invert`: phần ngoài hình), mép loang `edge` ô theo nhiễu;
     * `on`: chỉ phủ lên các loại nền này. Nền ướt (nước, lòng sâu) hoặc `clear` thì bỏ vật; `lock` khóa ô. `gid`: dùng gid nền này thay
     * gid của loại nền (ví dụ hồ băng / hồ lửa cạnh nhau); loại nền ướt thì gid đó chặn như nước.
     */
    area(f) {
      const s = sub(`area:${f.name ?? JSON.stringify(f.rect ?? f.poly ?? f.circle)}`), test = shapeTest(f), e = f.edge ?? 0, g = G[f.ground];
      if (g === undefined) throw new Error(`${mapId}: vùng nền: không có loại nền "${f.ground}"`);
      const on = f.on ? new Set(f.on.map((n) => G[n])) : null;
      if (f.gid && WET.has(g)) wetOver.add(f.gid);
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
        const i = at(x, y); if (lock[i] || (on && !on.has(gnd[i]))) continue;
        const dx = e ? (fbm(x, y, 7, s, 2) - 0.5) * 2 * e : 0, dy = e ? (fbm(x, y, 7, s + 1, 2) - 0.5) * 2 * e : 0;
        if (test(x + dx, y + dy) === !!f.invert) continue;
        gnd[i] = g; if (WET.has(g) || f.clear) obj[i] = O.none; if (f.lock) lock[i] = 1;
        if (f.gid) { overGid[i] = f.gid; overType[i] = g; } else overGid[i] = 0;
      }
    },
    /**
     * Nhà / đền: khối `rect` [x, y, w, h], mái `h - 1` hàng, hàng dưới cùng là tường (chặn); quanh nhà `margin` ô (mặc định 1) trống nền
     * `ground` (mặc định giữ nền). Client dựng nhà theo kiểu nhà của vùng, hoặc công trình `build.compounds` trong tiles.json khóa theo góc
     * trên trái "x,y". Khóa cả khu.
     */
    house(f) {
      for (const r of f.rects ?? [f.rect]) houseAt(r, f.margin ?? 1, f.ground);
    },
    /**
     * Tường thành: hàng ô `wall` (gid 15) đứng riêng dọc chu vi `rect` [x, y, w, h], chừa cổng rộng `gate` ô (mặc định 4) quanh các ô
     * `gates` [[x, y]…] nằm trên chu vi; client dựng khối tường thành theo kiểu nhà của vùng (tháp ở góc / hai bên cổng nếu có
     * `build.tower`). Ô cổng lát `ground` (mặc định "pave"). Khóa cả hàng.
     */
    fence(f) {
      const [x0, y0, w, h] = f.rect, half = (f.gate ?? 4) / 2, gates = f.gates ?? [];
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        if (!inside(x, y) || !(x === x0 || y === y0 || x === x0 + w - 1 || y === y0 + h - 1)) continue;
        const i = at(x, y), gate = gates.some(([gx, gy]) => Math.abs(x + 0.5 - gx) <= half && Math.abs(y + 0.5 - gy) <= half);
        obj[i] = gate ? O.none : O.wall; lock[i] = 1;
        if (gate || WET.has(gnd[i])) gnd[i] = G[f.ground ?? "pave"];
      }
    },
    /**
     * Khu nhà: nền `ground` (mặc định "pave") trong `rect`, nhà xếp thành hàng (cao `h` [min, max], rộng `w` [min, max] ô) cách nhau
     * ngõ `gap` ô (mặc định 2), hàng cách hàng `alley` ô (mặc định 3); `skip` xác suất bỏ trống một lô (sân, vườn). Theo hạt giống.
     */
    district(f) {
      const [x0, y0, W, H] = f.rect, r = rng(sub(`district:${f.rect}`)), gap = f.gap ?? 2, alley = f.alley ?? 3;
      const [wMin, wMax] = f.w ?? [4, 7], [hMin, hMax] = f.h ?? [3, 5];
      for (let y = y0; y < y0 + H; y++) for (let x = x0; x < x0 + W; x++) {
        if (!inside(x, y)) continue; const i = at(x, y); obj[i] = O.none; gnd[i] = G[f.ground ?? "pave"]; lock[i] = 1;
      }
      for (let y = y0 + 1; ;) {
        const rh = r.int(hMin, hMax); if (y + rh > y0 + H - 1) break;
        for (let x = x0 + 1; ;) {
          const rw = r.int(wMin, wMax); if (x + rw > x0 + W - 1) break;
          if (r() >= (f.skip ?? 0.12)) houseAt([x, y, rw, r.int(Math.max(hMin, rh - 1), rh)], 0);
          else if (f.yard) for (let yy = y; yy < y + rh; yy++) for (let xx = x; xx < x + rw; xx++) if (r() < 0.25) obj[at(xx, yy)] = kind(f.yard);
          x += rw + gap;
        }
        y += rh + alley;
      }
    },
    /** Hàng vật `kind` (ví dụ cây, đèn) từ ô `from` tới ô `to`, mỗi `step` ô; khóa các ô đó. */
    row(f) {
      const [ax, ay] = f.from, [bx, by] = f.to, n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / (f.step ?? 4)));
      const list = []; for (let k = 0; k <= n; k++) list.push([Math.round(ax + (bx - ax) * k / n), Math.round(ay + (by - ay) * k / n)]);
      place(list, kind(f.kind));
    },
    /** Rải vật `kind` trong hình (`rect` / `poly` / `circle`) với xác suất `p` mỗi ô trống chưa khóa, không ướt; `on`: chỉ trên các loại nền này. */
    scatter(f) {
      const s = sub(`scatter:${f.kind}:${JSON.stringify(f.rect ?? f.poly ?? f.circle)}`), test = shapeTest(f), on = f.on ? new Set(f.on.map((n) => G[n])) : null, k = kind(f.kind);
      for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
        const i = at(x, y);
        if (lock[i] || obj[i] !== O.none || WET.has(gnd[i]) || (on && !on.has(gnd[i])) || !test(x, y)) continue;
        if (hashF(x, y, s) < f.p) obj[i] = k;
      }
    },
  };
  function houseAt([x0, y0, w, h], m, ground) {
    for (let y = y0 - m; y < y0 + h + m; y++) for (let x = x0 - m; x < x0 + w + m; x++) {
      if (!inside(x, y)) continue;
      const i = at(x, y), inH = x >= x0 && x < x0 + w && y >= y0 && y < y0 + h;
      obj[i] = inH ? (y === y0 + h - 1 ? O.wall : O.roof) : O.none; lock[i] = 1;
      if (inH || WET.has(gnd[i]) || ground) gnd[i] = inH ? (WET.has(gnd[i]) ? G.grass : gnd[i]) : G[ground ?? "grass"] ?? G.grass;
    }
  }
  function place(list, kind) {
    for (const [x, y] of list ?? []) { if (!inside(x, y)) continue; const i = at(x, y); obj[i] = kind; lock[i] = 1; if (WET.has(gnd[i])) gnd[i] = G.grass; }
  }
  for (const f of L.features ?? []) {
    if (!F[f.type]) throw new Error(`${mapId}: tính năng không có: ${f.type}`);
    F[f.type](f);
  }

  // ---------- 3. Đường nối: A* trên lưới chi phí qua các điểm `via` ----------
  const P = L.points ?? {};
  const pt = (v) => { const p = typeof v === "string" ? P[v] : v; if (!p) throw new Error(`${mapId}: không có điểm "${v}"`); return [Math.floor(p[0]), Math.floor(p[1])]; };
  const sR = sub("roads"), roadsOut = [];
  const HARD = new Set([O.ruin, O.stele, O.arch, O.ancient, O.tent, O.fire, O.sign, O.skull, O.roof, O.wall]);
  for (const road of L.roads ?? []) {
    const w = road.width ?? 2, lo = -Math.floor((w - 1) / 2), hi = Math.ceil((w - 1) / 2);
    for (let k = 0; k + 1 < road.via.length; k++) {
      const a = pt(road.via[k]), b = pt(road.via[k + 1]);
      const cost = (x, y) => {
        if (x < 1 || y < 1 || x >= MW - 1 || y >= MH - 1) return Infinity;
        const i = at(x, y);
        if (gnd[i] === G.deep || (lock[i] && HARD.has(obj[i])) || (lock[i] && obj[i] === O.cliff)) return Infinity;
        let c = 1 + 2.2 * fbm(x, y, road.wiggle ?? 10, sR + k, 2);
        if (gnd[i] === G.path || gnd[i] === G.bridge) c -= 0.8;
        if (obj[i] === O.tree) c += 1.5;
        if (obj[i] === O.cliff) c += 40;
        if (gnd[i] === G.water || gnd[i] === G.ford) c += road.waterCost ?? 30;
        return Math.max(0.3, c);
      };
      const route = astar(MW, MH, a, b, cost);
      if (!route) throw new Error(`${mapId}: không tìm được đường từ ${road.via[k]} tới ${road.via[k + 1]}`);
      for (const [x, y] of route) for (let dy = lo; dy <= hi; dy++) for (let dx = lo; dx <= hi; dx++) {
        const X = x + dx, Y = y + dy; if (X < 1 || Y < 1 || X >= MW - 1 || Y >= MH - 1) continue;
        const i = at(X, Y);
        if (lock[i] && HARD.has(obj[i])) continue;
        if (WET.has(gnd[i]) || gnd[i] === G.ford || gnd[i] === G.bridge) gnd[i] = G.bridge;
        else if (gnd[i] !== G.pave && gnd[i] !== G.crack && gnd[i] !== G.camp) gnd[i] = G.path;
        obj[i] = O.none; lock[i] = 1;
      }
      roadsOut.push(route);
    }
  }

  // ---------- 4. Rải đá, gỗ đổ, cây cỏ nhỏ theo mật độ tầng (chỉ ô chưa khóa, đất trống) ----------
  const sS = sub("scatter");
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    const i = at(x, y), t = tier(i);
    if (lock[i] || obj[i] !== O.none || WET.has(gnd[i]) || gnd[i] === G.path) continue;
    const r = hashF(x, y, sS), stony = gnd[i] === G.stony ? 3 : 1;
    if (r < (t.rock ?? 0) * stony) obj[i] = O.rock;
    else if (r < (t.rock ?? 0) * stony + (t.log ?? 0)) obj[i] = O.log;
    else if (r < (t.rock ?? 0) * stony + (t.log ?? 0) + (t.plant ?? 0)) obj[i] = O.plant;
  }

  // ---------- 5. Object Tiled: cổng, điểm đến, trại hồi sinh, truyền tống trận; dọn chỗ đứng quanh chúng ----------
  let oid = 1;
  const list = [];
  const rectObj = (type, name, x, y, w, h, props = []) =>
    list.push({ id: oid++, name, type, x: x * TILE, y: y * TILE, width: w * TILE, height: h * TILE, rotation: 0, visible: true, properties: props });
  const pointObj = (type, name, x, y, props = []) =>
    list.push({ id: oid++, name, type, point: true, x: x * TILE, y: y * TILE, width: 0, height: 0, rotation: 0, visible: true, properties: props });
  const clearRect = (x0, y0, w, h, m, ground) => {
    for (let y = Math.floor(y0 - m); y < Math.ceil(y0 + h + m); y++) for (let x = Math.floor(x0 - m); x < Math.ceil(x0 + w + m); x++) {
      if (x < 1 || y < 1 || x >= MW - 1 || y >= MH - 1) continue;
      const i = at(x, y); obj[i] = O.none; if (WET.has(gnd[i]) || ground !== undefined) gnd[i] = ground ?? G.grass; lock[i] = 1;
    }
  };
  for (const p of L.portals ?? []) {
    clearRect(p.rect[0], p.rect[1], p.rect[2], p.rect[3], 1, G.path);
    rectObj("portal", p.name, ...p.rect, [prop("to", "string", p.to), prop("arrive", "string", p.arrive),
      ...(p.level ? [prop("level", "string", p.level)] : []), ...(p.boat ? [prop("boat", "bool", true)] : [])]);
  }
  for (const a of L.arrives ?? []) { clearRect(a.at[0] - 1, a.at[1] - 1, 2, 2, 0.5); pointObj("arrive", a.name, ...a.at); }
  if (L.spawn) rectObj("spawn", L.spawn.name, ...L.spawn.rect);
  for (const w of L.waypoints ?? []) {
    clearRect(w.at[0], w.at[1], 2, 2, 2, w.ground ? G[w.ground] : undefined);
    rectObj("waypoint", w.name, w.at[0], w.at[1], 2, 2, [prop("label", "string", w.label)]);
  }
  for (const s of L.safe ?? []) rectObj("safe", s.name, ...s.rect);

  // Viền bản đồ: cây (trừ ô cổng sát mép); `border` là tên loại nền ướt (ví dụ "deep" cho đảo giữa biển) thì viền là nền đó.
  const edgeSet = L.border ? (i) => { obj[i] = O.none; gnd[i] = G[L.border]; } : (i) => { obj[i] = O.tree; gnd[i] = G.grass; };
  if (L.border && !WET.has(G[L.border])) throw new Error(`${mapId}: "border" phải là loại nền ướt (water / deep)`);
  for (let x = 0; x < MW; x++) for (const y of [0, MH - 1]) if (!lock[at(x, y)]) edgeSet(at(x, y));
  for (let y = 0; y < MH; y++) for (const x of [0, MW - 1]) if (!lock[at(x, y)]) edgeSet(at(x, y));

  // Nhà bị khoét (cổng, điểm đến, trại dọn chỗ đứng) không còn hình chữ nhật: client vẫn vẽ nhà / tường cung uyển cả hình chữ nhật bao
  // (isoMap.ts buildHouses) nên chỗ khoét thành tường vẽ mà đi xuyên được (#747). Gỡ cả nhà đó, đúng như client gom nhà.
  {
    const seenH = new Set();
    for (let i0 = 0; i0 < N; i0++) {
      if (obj[i0] !== O.roof || seenH.has(i0)) continue;
      const comp = [i0], inC = new Set([i0]); seenH.add(i0);
      for (let n = 0; n < comp.length; n++) {
        const x = comp[n] % MW, y = Math.floor(comp[n] / MW);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (!inside(x + dx, y + dy)) continue; const k = at(x + dx, y + dy);
          if (obj[k] === O.roof && !seenH.has(k)) { seenH.add(k); inC.add(k); comp.push(k); }
        }
      }
      let x0 = MW, x1 = 0, y0 = MH, y1 = 0;
      for (const i of comp) { x0 = Math.min(x0, i % MW); x1 = Math.max(x1, i % MW); y0 = Math.min(y0, Math.floor(i / MW)); y1 = Math.max(y1, Math.floor(i / MW)); }
      const row = (y) => Array.from({ length: x1 - x0 + 1 }, (_, k) => (inside(x0 + k, y) ? at(x0 + k, y) : -1));
      let yEnd = y1;
      for (let n = 0; n < 2 && yEnd + 1 < MH; n++) { if (!row(yEnd + 1).every((i) => i >= 0 && obj[i] === O.wall)) break; yEnd++; }
      let full = true;
      for (let y = y0; y <= yEnd && full; y++) full = row(y).every((i) => obj[i] === O.roof || obj[i] === O.wall);
      if (full) continue;
      for (const i of comp) obj[i] = O.none;
      for (let y = y1 + 1; y <= Math.min(yEnd + 2, MH - 1); y++) for (const i of row(y)) if (i >= 0 && obj[i] === O.wall && inC.has(i - MW)) { obj[i] = O.none; inC.add(i); }
    }
  }

  // ---------- 6. Ra gid: biến thể nền theo nhiễu (không lặp mẫu), cây theo tầng ----------
  const GG = L.gids.ground, GO = L.gids.objects;
  for (const n of G_NAMES) if (GG[n] === undefined) throw new Error(`${mapId}: gids.ground thiếu "${n}"`);
  const ground = new Array(N).fill(0), trees = new Array(N).fill(0), canopy = new Array(N).fill(0);
  const sV = sub("variant"), pickW = (w, x, y, s) => { // w: { gid: trọng số }
    const e = Object.entries(w), tot = e.reduce((a, [, v]) => a + v, 0); let r = hashF(x, y, s) * tot;
    for (const [g, v] of e) { r -= v; if (r < 0) return +g; }
    return +e[e.length - 1][0];
  };
  const pickGid = (v, x, y, s) => (typeof v === "number" ? v : Array.isArray(v) ? v[Math.floor(hashF(x, y, s) * v.length)] : pickW(v, x, y, s));
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const i = at(x, y), t = tier(i), g = gnd[i], TG = t.ground ? { ...GG, ...t.ground } : GG; // `tiers[].ground`: sắc nền riêng của tầng
    if (g === G.grass) {
      // Thảm lá dưới cây, rêu loang, hai sắc cỏ theo nhiễu tần thấp.
      let nTree = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, y + dy) && obj[at(x + dx, y + dy)] === O.tree) nTree++;
      const leaf = fbm(x, y, 9, sV + 1, 3) + nTree * 0.05, moss = fbm(x, y, 13, sV + 2, 3), shade = fbm(x, y, 22, sV + 3, 2);
      ground[i] = moss > (t.moss ?? 0.7) ? TG.moss : leaf > (t.leaf ?? 0.65) ? pickGid(TG.leaf, x, y, sV + 4) : shade > 0.5 ? TG.grass[1] : TG.grass[0];
    } else if (g === G.path) ground[i] = t.path !== undefined ? TG[t.path] ?? t.path : TG.path;
    else ground[i] = pickGid(TG[G_NAMES[g]], x, y, sV + 5 + g);
    if (overGid[i] && overType[i] === g) ground[i] = overGid[i];
    const o = obj[i];
    if (o === O.tree) trees[i] = pickGid(fbm(x, y, t.clusterScale ?? 16, sC, 3) > t.cluster && t.denseTrees ? t.denseTrees : t.trees, x, y, sV + 20);
    else if (o !== O.none) {
      if (GO[K_NAMES[o]] === undefined) throw new Error(`${mapId}: gids.objects thiếu "${K_NAMES[o]}"`);
      trees[i] = pickGid(GO[K_NAMES[o]], x, y, sV + 30 + o);
    }
  }

  // ---------- 7. Lớp chỉnh tay (tools/maps/hand/<mapId>.json): tay_nen đè nền, tay_vat đè vật (gid nền ở tay_vat = xóa vật) ----------
  const groundGids = new Set(G_NAMES.flatMap((n) => [].concat(typeof GG[n] === "object" && !Array.isArray(GG[n]) ? Object.keys(GG[n]).map(Number) : GG[n])));
  groundGids.add(GG.moss); for (const g of [].concat(GG.leaf)) groundGids.add(g); for (const g of GG.grass) groundGids.add(g);
  for (const t of L.tiers) for (const v of Object.values(t.ground ?? {})) for (const g of gidsOf(v)) groundGids.add(g);
  for (const g of overGid) if (g) groundGids.add(g);
  let handN = 0;
  if (hand) {
    if (hand.width !== MW || hand.height !== MH) throw new Error(`${mapId}: lớp tay ${hand.width}×${hand.height}, bản đồ ${MW}×${MH}`);
    const layer = (n) => hand.layers.find((l) => l.type === "tilelayer" && l.name === n)?.data;
    const hn = layer("tay_nen"), hv = layer("tay_vat");
    if (hn) hn.forEach((g, i) => { if (g) { ground[i] = g; handN++; } });
    if (hv) hv.forEach((g, i) => { if (g) { trees[i] = groundGids.has(g) ? 0 : g; handN++; } });
  }

  // ---------- 8. Ô chặn, nối thông: ô đi được không tới được từ trại thì trồng cây (không sinh hồn thú ở chỗ kẹt) ----------
  const collides = new Set([GG.water, GG.deep, ...wetOver, ...Object.entries(GO).filter(([k]) => !WALK.has(k)).flatMap(([, v]) => gidsOf(v)),
    ...L.tiers.flatMap((t) => [...gidsOf(t.trees), ...gidsOf(t.denseTrees ?? [])])]);
  // Ô chặn tính theo gid ở mọi lớp (shared/move.ts): một gid không được vừa là nền vừa là vật.
  const wetG = (g) => g === GG.water || g === GG.deep || wetOver.has(g);
  for (const g of collides) if (groundGids.has(g) && !wetG(g)) throw new Error(`${mapId}: gid ${g} vừa là nền vừa là vật`);
  for (const g of [...WALK].flatMap((k) => gidsOf(GO[k] ?? []))) { if (groundGids.has(g)) throw new Error(`${mapId}: gid ${g} vừa là nền vừa là vật`); collides.delete(g); }
  for (const g of groundGids) if (!wetG(g)) collides.delete(g);
  const solid = (i) => collides.has(ground[i]) || collides.has(trees[i]);
  const start = L.spawn ? [Math.floor(L.spawn.rect[0] + L.spawn.rect[2] / 2), Math.floor(L.spawn.rect[1] + L.spawn.rect[3] / 2)] : pt(Object.keys(P)[0]);
  const reach = new Uint8Array(N), q = [at(...start)];
  if (solid(q[0])) throw new Error(`${mapId}: tâm trại ${start} bị chặn`);
  reach[q[0]] = 1;
  while (q.length) {
    const i = q.pop(), x = i % MW, y = (i / MW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const X = x + dx, Y = y + dy; if (!inside(X, Y)) continue;
      const j = at(X, Y); if (!reach[j] && !solid(j)) { reach[j] = 1; q.push(j); }
    }
  }
  let filled = 0;
  for (let i = 0; i < N; i++) if (!reach[i] && !solid(i)) { trees[i] = pickGid(tier(i).trees, i % MW, (i / MW) | 0, sV + 20); filled++; }
  const reachable = (x, y) => reach[at(Math.floor(x), Math.floor(y))] === 1;
  for (const [name, p] of Object.entries(P)) if (!reachable(...p)) warn.push(`điểm "${name}" ${p} không tới được từ trại`);
  for (let i = 0; i < N; i++) if (trees[i] && L.gids.canopy?.[trees[i]] && i >= MW) canopy[i - MW] = L.gids.canopy[trees[i]];

  // ---------- 9. Vùng hồn thú: tách hình vùng thành chữ nhật, số con theo mật độ × ô đi được ----------
  // Thành (không vùng hồn thú nào): không cần mật độ.
  const density = L.zones.length ? BEAST_DENSITY[mapId] : [];
  if (L.zones.length && (!density || density.length < L.tiers.length)) throw new Error(`${mapId}: BEAST_DENSITY (shared/data.ts) thiếu mật độ cho ${L.tiers.length} tầng`);
  const zoneStats = [];
  L.zones.forEach((z, zi) => {
    const t = L.tiers[z.tier], years = z.years ?? t.years, beasts = z.beasts ?? t.beasts, yr = parseLevelRange(years);
    if (!yr || yr[0] < TIERS[0].years || yr[1] > MAX_YEARS) throw new Error(`${mapId}: vùng "${z.name}" niên hạn sai "${years}"`);
    for (const part of beasts.split(",")) if (beastIndex(part.split(":")[0].trim()) < 0) throw new Error(`${mapId}: vùng "${z.name}": loài không có trong BEASTS: ${part}`);
    const rects = rectsOf((x, y) => zoneOf[at(x, y)] === zi, MW, MH, L.zoneCell ?? 10);
    const walk = rects.map((r) => { let n = 0; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) if (reach[at(x, y)]) n++; return n; });
    const total = walk.reduce((a, b) => a + b, 0), want = Math.round((density[z.tier] * total) / 1000);
    // Chia số con cho các mảnh theo số ô đi được (phần dư lớn nhất), tổng đúng bằng `want`.
    const raw = walk.map((n) => (total ? (want * n) / total : 0)), cnt = raw.map(Math.floor);
    raw.map((v, k) => [v - cnt[k], k]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).slice(0, want - cnt.reduce((a, b) => a + b, 0)).forEach(([, k]) => cnt[k]++);
    rects.forEach((r, k) => rectObj("zone", z.name, r.x, r.y, r.w, r.h, [prop("hint", "string", z.hint ?? t.hint), prop("weights", "string", "1"),
      prop("count", "int", cnt[k]), prop("beasts", "string", beasts), prop("years", "string", years)]));
    zoneStats.push({ name: z.name, tier: z.tier, rects: rects.length, walk: total, count: want });
  });

  // ---------- 10. Tinh anh, hang thú vương, NPC (kiểm mã như server) ----------
  const zoneAt = (x, y) => zoneOf[at(Math.floor(x), Math.floor(y))];
  for (const e of L.elites ?? []) {
    const b = bossIndex(e.boss), [x, y, w, h] = e.rect, z = zoneAt(x + w / 2, y + h / 2);
    if (b < 0 || BOSSES[b].rank !== 1) throw new Error(`${mapId}: tinh anh "${e.name}": mã không phải tinh anh: ${e.boss}`);
    if (z < 0) throw new Error(`${mapId}: tinh anh "${e.name}" không nằm trong vùng nào`);
    if (!reachable(x + w / 2, y + h / 2)) warn.push(`tinh anh "${e.name}": tâm không tới được`);
    // Server không sinh hồn thú (kể cả tinh anh) trong SPAWN_CLEAR pixel quanh trại, cổng, điểm đến, truyền tống trận (mục 5.8).
    const cx = (x + w / 2) * TILE, cy = (y + h / 2) * TILE, gates = list.filter((o) => ["spawn", "portal", "arrive", "waypoint"].includes(o.type));
    const g = gates.find((o) => cx > o.x - SPAWN_CLEAR && cx < o.x + o.width + SPAWN_CLEAR && cy > o.y - SPAWN_CLEAR && cy < o.y + o.height + SPAWN_CLEAR);
    if (g) throw new Error(`${mapId}: tinh anh "${e.name}" cách ${g.type} "${g.name}" dưới SPAWN_CLEAR (${SPAWN_CLEAR} pixel): server không sinh được`);
    rectObj("elite", e.name, x, y, w, h, [prop("boss", "string", e.boss)]);
  }
  if (L.lair) {
    const { name, boss, at: [cx, cy], rx, ry } = L.lair;
    if (boss !== MAPS[mapId].king) throw new Error(`${mapId}: hang "${name}": MAPS.${mapId}.king là ${MAPS[mapId].king}`);
    rectObj("boss", name, cx - rx, cy - ry, rx * 2, ry * 2, [prop("boss", "string", boss)]);
  }
  // Sàn đấu boss thế giới (Lõi Tinh Đấu): object `boss` với mã trong MAPS.world (không phải thú vương).
  if (L.worldBoss) {
    const { name, boss, rect } = L.worldBoss;
    if (!(MAPS[mapId].world ?? []).includes(boss)) throw new Error(`${mapId}: sàn "${name}": ${boss} không có trong MAPS.${mapId}.world`);
    rectObj("boss", name, ...rect, [prop("boss", "string", boss)]);
  }
  // Giữa hồ (object `lake`, điểm): boss thế giới có Du Thủy lặn ra đây; thiếu thì server cảnh báo và boss lặn tại chỗ, nên báo lỗi luôn.
  if (L.lake) pointObj("lake", L.lake.name, ...L.lake.at);
  else if ((MAPS[mapId].world ?? []).some((id) => BOSSES[bossIndex(id)]?.world?.dive)) throw new Error(`${mapId}: boss thế giới có Du Thủy nhưng bố cục thiếu \`lake\` (giữa hồ)`);
  for (const n of L.npcs ?? []) {
    // Người chơi đứng cạnh NPC để nói chuyện (thường ngay phía nam): ô NPC và ô phía nam phải đi tới được.
    if (!reachable(n.at[0], n.at[1]) || !reachable(n.at[0], n.at[1] + 1)) throw new Error(`${mapId}: NPC "${n.name}" ${n.at}: ô đứng hoặc ô phía nam không tới được`);
    pointObj("npc", n.name, ...n.at, [prop("npc", "string", n.npc)]);
  }

  // ---------- 11. File Tiled (cùng định dạng tools/gen-map.mjs: server và client đọc như cũ) ----------
  const layer = (id, name, data) => ({ id, name, type: "tilelayer", data, width: MW, height: MH, opacity: 1, visible: true, x: 0, y: 0 });
  const rows = L.tileRows ?? 5;
  const map = {
    compressionlevel: -1, type: "map", version: "1.10", tiledversion: "1.10.2",
    orientation: "orthogonal", renderorder: "right-down", infinite: false,
    width: MW, height: MH, tilewidth: TILE, tileheight: TILE, nextlayerid: 5, nextobjectid: oid,
    properties: [prop("generator", "string", `tools/maps/build.mjs ${mapId}`), prop("seed", "int", seed)],
    layers: [
      layer(1, "ground", ground), layer(2, "trees", trees),
      { id: 3, name: "zones", type: "objectgroup", draworder: "topdown", objects: list, opacity: 1, visible: true, x: 0, y: 0 },
      layer(4, "canopy", canopy),
    ],
    tilesets: [{
      firstgid: 1, name: "tiles", image: "tiles.png", imagewidth: 128, imageheight: rows * TILE, tilewidth: TILE, tileheight: TILE,
      columns: 8, tilecount: 8 * rows, margin: 0, spacing: 0,
      tiles: [...collides].sort((a, b) => a - b).map((g) => ({ id: g - 1, properties: [prop("collides", "bool", true)] })),
    }],
  };
  for (const g of collides) if (g < 1 || g > 8 * rows) throw new Error(`${mapId}: gid ${g} ngoài tileset (${8 * rows} ô)`);
  let walkN = 0; for (let i = 0; i < N; i++) if (reach[i]) walkN++;
  const stats = { mapId, size: `${MW}×${MH}`, seed, walkable: walkN, walkPct: +(walkN / N * 100).toFixed(1), filled, hand: handN,
    beasts: zoneStats.reduce((a, z) => a + z.count, 0), zoneRects: zoneStats.reduce((a, z) => a + z.rects, 0), zones: zoneStats, objects: list.length, warn };
  return { json: JSON.stringify(map), map, stats, roads: roadsOut, zoneOf };
}
function gidsOf(v) { return typeof v === "number" ? [v] : Array.isArray(v) ? v : Object.keys(v ?? {}).map(Number); }

/** Ảnh nền bản đồ nhỏ của mapId (R1): shared/assets/mini/<mapId>.png. */
const miniFile = (mapId) => path.join(ASSETS, MINI_BASE.dir, `${mapId}.png`);

/** Lớp tay của mapId nếu có. */
function readHand(mapId) {
  const f = path.join(HAND, `${mapId}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
}

// ---------- Dòng lệnh ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
  const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
  const seedArg = opt("--seed"), previewArg = opt("--preview"), check = flag("--check"), handInit = flag("--hand-init");
  const all = readdirSync(LAYOUTS).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  const ids = args.length ? args : all;
  let bad = 0;
  for (const id of ids) {
    const L = readLayout(id), out = path.join(ASSETS, L.out), t0 = performance.now();
    if (handInit) {
      const f = path.join(HAND, `${id}.json`);
      if (existsSync(f)) { console.error(`[maps] ${path.relative(ROOT, f)} đã có, không ghi đè.`); process.exit(1); }
      const { map } = build(L, null);
      // Lớp tham khảo (khóa, mờ) để thấy bản sinh khi vẽ; công cụ chỉ đọc tay_nen, tay_vat.
      const ref = (n, id2, name) => ({ ...map.layers.find((l) => l.name === n), id: id2, name, locked: true, opacity: 0.6 });
      const empty = (id2, name) => ({ id: id2, name, type: "tilelayer", data: new Array(map.width * map.height).fill(0), width: map.width, height: map.height, opacity: 1, visible: true, x: 0, y: 0 });
      mkdirSync(HAND, { recursive: true });
      writeFileSync(f, JSON.stringify({ ...map, nextlayerid: 5, layers: [ref("ground", 1, "tham_khao_nen"), ref("trees", 2, "tham_khao_vat"), empty(3, "tay_nen"), empty(4, "tay_vat")],
        tilesets: map.tilesets.map((t) => ({ ...t, image: "../../../shared/assets/tiles.png" })) }));
      console.log(`[maps] Đã tạo ${path.relative(ROOT, f)}: vẽ vào lớp tay_nen / tay_vat rồi chạy lại node tools/maps/build.mjs ${id}`);
      continue;
    }
    const r = build(L, readHand(id), seedArg === undefined ? null : Number(seedArg)), ms = Math.round(performance.now() - t0);
    for (const w of r.stats.warn) console.warn(`[maps] ${id}: CẢNH BÁO ${w}`);
    if (check) {
      const same = existsSync(out) && readFileSync(out, "utf8") === r.json;
      if (!same) { bad++; console.error(`[maps] ${id}: ${path.relative(ROOT, out)} khác bản sinh từ bố cục (chạy node tools/maps/build.mjs ${id}; sửa tay thì vẽ vào tools/maps/hand)`); }
      // Ảnh nền bản đồ nhỏ: so theo điểm ảnh (byte PNG phụ thuộc phiên bản zlib).
      const mini = miniFile(id), why = !existsSync(mini) ? "chưa có file" : diffImg(decodePng(readFileSync(mini)), miniImage(r, L));
      if (why) { bad++; console.error(`[maps] ${id}: ${path.relative(ROOT, mini)} khác bản sinh (${why}; chạy node tools/maps/build.mjs ${id})`); }
      else if (same) console.log(`[maps] ${id}: OK (${ms} ms)`);
      continue;
    }
    writeFileSync(out, r.json);
    mkdirSync(path.dirname(miniFile(id)), { recursive: true });
    writeFileSync(miniFile(id), encodePng(miniImage(r, L)));
    const s = r.stats;
    console.log(`[maps] Đã sinh ${path.relative(ROOT, out)} ${s.size}, hạt giống ${s.seed}, ${ms} ms: ${s.walkPct}% ô đi được, ${s.beasts} hồn thú thường ` +
      `trong ${s.zoneRects} mảnh vùng, ${s.objects} object, lấp ${s.filled} ô kẹt, ${s.hand} ô chỉnh tay`);
    for (const z of s.zones) console.log(`  ${z.name} (tầng ${z.tier}): ${z.rects} mảnh, ${z.walk} ô đi được, ${z.count} con`);
    if (previewArg) { writeFileSync(previewArg, topdownPreview(r, L)); console.log(`[maps] Ảnh nhìn thẳng: ${previewArg}`); }
  }
  if (bad) process.exit(1);
}
