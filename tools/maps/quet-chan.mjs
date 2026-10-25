// Quét lệch giữa vật được VẼ và ô chặn của từng bản đồ (#747, "đi xuyên hàng rào"). Lệch là lỗi (thoát mã 1).
//   node tools/maps/quet-chan.mjs [mapId…]    quét mọi file Tiled trong shared/assets (bản mới `.v2` và bản cũ), in danh sách lệch
//
// Ô chặn của game là `collides` trong tileset (shared/move.ts `solidGrid`: gid ở MỌI lớp chặn đường). Client lại vẽ vật từ lớp `trees`
// (client/src/isoMap.ts `place`, `buildHouses`, `addCompound`). Ba loại lệch:
//   nhà      ô thuộc chân nhà (khối mái + hàng tường mặt tiền, đúng cách client gom trong `buildHouses`) được vẽ nhà / tường cung uyển
//            nhưng không chặn → hồn sư đi xuyên tường nhà.
//   vật      ô lớp `trees` có vật vẽ (cây, đá, tường thành, cột…) mà không chặn, và gid đó không nằm trong danh sách đi xuyên có chủ ý
//            của bố cục (`gids.walk` + `plant`: cỏ, bụi hoa, cầu).
//   ma       ô chặn (trong `trees`) mà không vẽ được gì: gid vật không có ảnh trong tiles.json / sprites → tường vô hình.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const ASSETS = path.join(ROOT, "shared", "assets"), LAYOUTS = path.join(ROOT, "tools", "maps", "layouts");
const ROOF = 14, WALL = 15; // client/src/isoMap.ts

const json = (f) => JSON.parse(readFileSync(f, "utf8"));
const gidsOf = (v) => (typeof v === "number" ? [v] : Array.isArray(v) ? v : Object.keys(v).map(Number));
const T = json(path.join(ASSETS, "iso", "tiles.json"));
/** Mỗi gid vật của bản đồ có ít nhất một ảnh công khai trong repo (vật riêng `private` có thể chưa tải: không tính). */
const drawable = (ref) => ref.split("|").some((r) => {
  const d = T.props[r.split("~")[0]];
  return d && !d.private && existsSync(path.join(ASSETS, "sprites", "iso", "props", `${d.key.replace(/^prop_/, "")}.png`));
});

/** Danh sách lệch của một file Tiled: [{ map, file, tx, ty, loai, ghi }]. */
export function scanMap(mapId, file, layout) {
  const raw = json(path.join(ASSETS, file)), MW = raw.width, MH = raw.height;
  const solidGids = new Set();
  for (const ts of raw.tilesets) for (const t of ts.tiles ?? [])
    if ((t.properties ?? []).some((p) => p.name === "collides" && p.value)) solidGids.add(ts.firstgid + t.id);
  const layerOf = (n) => raw.layers.find((l) => l.type === "tilelayer" && l.name === n)?.data ?? [];
  const trees = layerOf("trees"), ground = layerOf("ground");
  const solid = (i) => solidGids.has(trees[i]) || solidGids.has(ground[i]);
  const out = [], add = (i, loai, ghi) => out.push({ map: mapId, file, tx: i % MW, ty: Math.floor(i / MW), loai, ghi });

  // Nhà: cùng cách gom với client (khối ROOF liền nhau + tối đa 2 hàng WALL phủ kín bề ngang ngay dưới).
  const inHouse = new Set(), seen = new Set();
  for (let i = 0; i < trees.length; i++) {
    if (trees[i] !== ROOF || seen.has(i)) continue;
    let x0 = i % MW, x1 = x0, y0 = Math.floor(i / MW), y1 = y0;
    const stack = [i]; seen.add(i);
    while (stack.length) {
      const j = stack.pop(), x = j % MW, y = Math.floor(j / MW);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const X = x + dx, Y = y + dy, k = Y * MW + X;
        if (X >= 0 && Y >= 0 && X < MW && Y < MH && trees[k] === ROOF && !seen.has(k)) { seen.add(k); stack.push(k); }
      }
    }
    for (let n = 0; n < 2 && y1 + 1 < MH; n++) {
      if (!Array.from({ length: x1 - x0 + 1 }, (_, k) => trees[(y1 + 1) * MW + x0 + k]).every((g) => g === WALL)) break;
      y1++;
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const k = y * MW + x; inHouse.add(k);
      if (!solid(k)) add(k, "nhà", `chân nhà ${x0},${y0}–${x1},${y1} được vẽ nhưng ô không chặn`);
    }
  }

  // Vật: gid đi xuyên có chủ ý theo bố cục; không có bố cục (bản đồ không dựng bằng tools/maps) thì chỉ xét nhà.
  const walk = new Set();
  if (layout) for (const k of ["plant", ...(layout.gids.walk ?? [])]) for (const g of gidsOf(layout.gids.objects?.[k] ?? [])) walk.add(g);
  const props = { ...T.maps["*"]?.props, ...T.maps[mapId]?.props };
  for (let i = 0; i < trees.length; i++) {
    const g = trees[i];
    if (!g || inHouse.has(i)) continue;
    if (layout && !solidGids.has(g) && !walk.has(g) && !solidGids.has(ground[i])) add(i, "vật", `gid ${g}${props[g] ? ` (${[].concat(props[g]).join(", ")})` : ""} được vẽ nhưng không chặn`);
    if (solidGids.has(g) && props[g] && ![].concat(props[g]).some(drawable)) add(i, "ma", `gid ${g} chặn nhưng không có ảnh công khai (${[].concat(props[g]).join(", ")})`);
  }
  return out;
}

/** Mọi file Tiled của một bản đồ: bản dựng lại `.v2` (nếu có) và bản cũ. */
function filesOf(mapId) {
  return [`${mapId}.v2.json`, `${mapId}.json`].filter((f) => existsSync(path.join(ASSETS, f)));
}

export function scanAll(only) {
  const out = [];
  for (const mapId of Object.keys(T.maps).filter((k) => k !== "*" && (!only.length || only.includes(k)))) {
    const lf = path.join(LAYOUTS, `${mapId}.json`), layout = existsSync(lf) ? json(lf) : null;
    for (const f of filesOf(mapId)) out.push(...scanMap(mapId, f, f.endsWith(".v2.json") ? layout : null));
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const bad = scanAll(process.argv.slice(2));
  if (bad.length) {
    const groups = new Map();
    for (const b of bad) { const k = `${b.file} [${b.loai}] ${b.ghi}`; (groups.get(k) ?? groups.set(k, []).get(k)).push(`${b.tx},${b.ty}`); }
    console.error(`[quet-chan] ${bad.length} ô lệch giữa vật vẽ và ô chặn (bản đồ, loại, ô tx,ty):`);
    for (const [k, cells] of groups) console.error(`  ${k}: ${cells.slice(0, 8).join(" ")}${cells.length > 8 ? ` … (+${cells.length - 8})` : ""}`);
    process.exit(1);
  }
  console.log("[quet-chan] OK: vật vẽ khớp ô chặn ở mọi bản đồ");
}
