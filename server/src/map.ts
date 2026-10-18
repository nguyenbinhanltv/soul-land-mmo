// Đọc bản đồ Tiled dùng chung với client (shared/assets/<mapId>.json) để server tự kiểm tra va chạm.
// Ô nào có thuộc tính "collides" = true trong tileset sẽ chặn đường.
import { readFileSync } from "node:fs";
import { TILE, TIERS, BEASTS, MAPS, beastIndex } from "../../shared/data.ts";

/** Loài sinh trong vùng: chỉ số trong BEASTS và trọng số. */
export interface ZoneBeast { species: number; w: number; }
export interface Zone {
  name: string; hint: string; x0: number; x1: number; y0: number; y1: number; count: number;
  weights: number[];   // trọng số theo bậc TIERS (giữ đến bước 3.2)
  beasts: ZoneBeast[]; // loài khai báo ở thuộc tính `beasts` của vùng
}
export interface Rect { x: number; y: number; w: number; h: number; }

export interface GameMap {
  mapId: string;
  MW: number; MH: number;
  solid: Uint8Array;
  zones: Zone[];
  spawn: Rect;
  isSolidTile(tx: number, ty: number): boolean;
  hits(x: number, y: number, hw: number, hh: number): boolean;
  moveEnt(e: { x: number; y: number }, dx: number, dy: number, hw: number, hh: number): void;
  inSpawn(x: number, y: number): boolean;
}

/** Bản đồ đã nạp, dùng chung cho mọi kênh (phòng) của cùng `mapId`. */
const cache = new Map<string, GameMap>();

/** Nạp bản đồ theo `mapId` (phải có trong MAPS). Lỗi thì ném ra để phòng không mở được. */
export function loadMap(mapId: string): GameMap {
  const hit = cache.get(mapId); if (hit) return hit;
  if (!Object.hasOwn(MAPS, mapId)) throw new Error(`Bản đồ không tồn tại: ${mapId}`);
  const raw = JSON.parse(readFileSync(new URL(`../../shared/assets/${mapId}.json`, import.meta.url), "utf8"));
  const MW: number = raw.width, MH: number = raw.height;

  const solidGids = new Set<number>();
  for (const ts of raw.tilesets) for (const t of ts.tiles ?? [])
    if ((t.properties ?? []).some((p: any) => p.name === "collides" && p.value)) solidGids.add(ts.firstgid + t.id);

  const solid = new Uint8Array(MW * MH);
  for (const layer of raw.layers) if (layer.type === "tilelayer")
    layer.data.forEach((gid: number, i: number) => { if (solidGids.has(gid)) solid[i] = 1; });

  const zones: Zone[] = [];
  let spawn: Rect = { x: 3 * TILE, y: 28 * TILE, w: 4 * TILE, h: 4 * TILE };
  for (const layer of raw.layers) if (layer.type === "objectgroup") for (const o of layer.objects) {
    const prop = (n: string) => (o.properties ?? []).find((p: any) => p.name === n)?.value;
    if (o.type === "zone") {
      const z: Zone = {
        name: o.name, hint: prop("hint") ?? "", x0: o.x, x1: o.x + o.width, y0: o.y, y1: o.y + o.height,
        weights: String(prop("weights") ?? "1").split(",").map(Number), count: Number(prop("count") ?? 8),
        beasts: parseBeasts(mapId, o.name, String(prop("beasts") ?? "")),
      };
      if (!z.beasts.length) { console.warn(`[map ${mapId}] Vùng "${o.name}" không khai báo loài hợp lệ, bỏ qua vùng.`); continue; }
      z.weights.forEach((w, t) => {
        if (w > 0 && !z.beasts.some((b) => BEASTS[b.species].tier === t))
          console.warn(`[map ${mapId}] Vùng "${o.name}" không có loài bậc ${TIERS[t]?.age ?? t}; dùng loài bất kỳ cùng bậc.`);
      });
      zones.push(z);
    }
    if (o.type === "spawn") spawn = { x: o.x, y: o.y, w: o.width, h: o.height };
  }

  const isSolidTile = (tx: number, ty: number) => tx < 0 || ty < 0 || tx >= MW || ty >= MH || solid[ty * MW + tx] === 1;
  const hits = (x: number, y: number, hw: number, hh: number) => {
    const x0 = Math.floor((x - hw) / TILE), x1 = Math.floor((x + hw) / TILE);
    const y0 = Math.floor((y - hh) / TILE), y1 = Math.floor((y + hh) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isSolidTile(tx, ty)) return true;
    return false;
  };
  const map: GameMap = {
    mapId, MW, MH, solid, zones, spawn, isSolidTile, hits,
    moveEnt(e, dx, dy, hw, hh) {
      if (!hits(e.x + dx, e.y, hw, hh)) e.x += dx;
      if (!hits(e.x, e.y + dy, hw, hh)) e.y += dy;
    },
    inSpawn: (x, y) => x >= spawn.x && x <= spawn.x + spawn.w && y >= spawn.y && y <= spawn.y + spawn.h,
  };
  cache.set(mapId, map);
  return map;
}

/** `phong_lang:3,man_da_la_xa:1` -> danh sách loài; loài không có trong BEASTS thì cảnh báo và bỏ. */
function parseBeasts(mapId: string, zone: string, s: string): ZoneBeast[] {
  const out: ZoneBeast[] = [];
  for (const part of s.split(",").map((x) => x.trim()).filter(Boolean)) {
    const [id, w] = part.split(":"), species = beastIndex(id.trim());
    if (species < 0) { console.warn(`[map ${mapId}] Vùng "${zone}": loài không có trong BEASTS: ${id}`); continue; }
    out.push({ species, w: w === undefined ? 1 : Math.max(0, Number(w) || 0) });
  }
  return out;
}
