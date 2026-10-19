// Đọc bản đồ Tiled dùng chung với client (shared/assets/<mapId>.json) để server tự kiểm tra va chạm.
// Ô nào có thuộc tính "collides" = true trong tileset sẽ chặn đường.
import { readFileSync } from "node:fs";
import { TILE, TIERS, BEASTS, MAPS, beastIndex, parseLevelRange, type MapKind } from "../../shared/data.ts";

/** Loài sinh trong vùng: chỉ số trong BEASTS và trọng số. */
export interface ZoneBeast { species: number; w: number; }
export interface Zone {
  name: string; hint: string; x0: number; x1: number; y0: number; y1: number; count: number;
  weights: number[];   // trọng số theo bậc TIERS (giữ đến bước 3.2)
  beasts: ZoneBeast[]; // loài khai báo ở thuộc tính `beasts` của vùng
}
export interface Rect { x: number; y: number; w: number; h: number; }
/** Cổng (object `portal`): vùng chữ nhật, bản đồ đích, điểm xuất hiện ở bản đồ đích (đã đổi ra tọa độ), cấp đề xuất. */
export interface Portal extends Rect { name: string; to: string; arrive: string; ax: number; ay: number; level: [number, number] | null; }

export interface GameMap {
  mapId: string;
  MW: number; MH: number;
  solid: Uint8Array;
  kind: MapKind;
  zones: Zone[];
  spawn: Rect;
  safe: Rect[];        // vùng an toàn (object `safe`); bản đồ `town` thì cả bản đồ an toàn
  portals: Portal[];
  isSolidTile(tx: number, ty: number): boolean;
  hits(x: number, y: number, hw: number, hh: number): boolean;
  moveEnt(e: { x: number; y: number }, dx: number, dy: number, hw: number, hh: number): void;
  inSpawn(x: number, y: number): boolean;
  /** Trong vùng an toàn: không sinh hồn thú, hồn thú không đuổi vào, không giao chiến (mục 5.3, 5.8). */
  inSafe(x: number, y: number): boolean;
  portalAt(x: number, y: number): Portal | undefined;
  /** Vị trí đứng được: trong bản đồ và không kẹt trong ô chặn (dùng khi nạp vị trí đã lưu). */
  standable(x: number, y: number): boolean;
}

const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/** Object của file Tiled, đọc thô (dùng để kiểm tra cổng trỏ sang bản đồ khác mà không nạp hẳn bản đồ đó). */
const rawCache = new Map<string, any[]>();
function rawObjects(mapId: string): any[] {
  let objs = rawCache.get(mapId);
  if (!objs) {
    const raw = JSON.parse(readFileSync(new URL(`../../shared/assets/${mapId}.json`, import.meta.url), "utf8"));
    objs = raw.layers.filter((l: any) => l.type === "objectgroup").flatMap((l: any) => l.objects);
    rawCache.set(mapId, objs!);
  }
  return objs!;
}
const propOf = (o: any, n: string) => (o.properties ?? []).find((p: any) => p.name === n)?.value;
const rectOf = (o: any): Rect => ({ x: o.x, y: o.y, w: o.width, h: o.height });

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

  const zones: Zone[] = [], safe: Rect[] = [], portals: Portal[] = [];
  let spawn: Rect = { x: 3 * TILE, y: 28 * TILE, w: 4 * TILE, h: 4 * TILE };
  for (const layer of raw.layers) if (layer.type === "objectgroup") for (const o of layer.objects) {
    const prop = (n: string) => (o.properties ?? []).find((p: any) => p.name === n)?.value;
    if (o.type === "zone") {
      const z: Zone = {
        name: o.name, hint: prop("hint") ?? "", x0: o.x, x1: o.x + o.width, y0: o.y, y1: o.y + o.height,
        weights: String(prop("weights") ?? "1").split(",").map(Number), count: Number(prop("count") ?? 8),
        beasts: parseBeasts(mapId, o.name, String(prop("beasts") ?? "")),
      };
      // Thiếu loài thì vẫn giữ vùng (không đổi luật sinh hồn thú): pickSpecies lấy loài bất kỳ cùng bậc.
      if (!z.beasts.length) console.warn(`[map ${mapId}] Vùng "${o.name}" không khai báo loài hợp lệ; dùng loài bất kỳ cùng bậc.`);
      else z.weights.forEach((w, t) => {
        if (w > 0 && !z.beasts.some((b) => BEASTS[b.species].tier === t))
          console.warn(`[map ${mapId}] Vùng "${o.name}" không có loài bậc ${TIERS[t]?.age ?? t}; dùng loài bất kỳ cùng bậc.`);
      });
      zones.push(z);
    }
    if (o.type === "spawn") spawn = rectOf(o);
    if (o.type === "safe") safe.push(rectOf(o));
    if (o.type === "portal") {
      // Client gửi tên cổng khi xin đi, nên tên phải duy nhất trong bản đồ.
      const p = parsePortal(mapId, o);
      if (p && portals.some((q) => q.name === p.name)) console.warn(`[map ${mapId}] Bỏ cổng trùng tên "${p.name}".`);
      else if (p) portals.push(p);
    }
  }

  const isSolidTile = (tx: number, ty: number) => tx < 0 || ty < 0 || tx >= MW || ty >= MH || solid[ty * MW + tx] === 1;
  const hits = (x: number, y: number, hw: number, hh: number) => {
    const x0 = Math.floor((x - hw) / TILE), x1 = Math.floor((x + hw) / TILE);
    const y0 = Math.floor((y - hh) / TILE), y1 = Math.floor((y + hh) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isSolidTile(tx, ty)) return true;
    return false;
  };
  const kind = MAPS[mapId].kind;
  const map: GameMap = {
    mapId, MW, MH, solid, kind, zones, spawn, safe, portals, isSolidTile, hits,
    moveEnt(e, dx, dy, hw, hh) {
      if (!hits(e.x + dx, e.y, hw, hh)) e.x += dx;
      if (!hits(e.x, e.y + dy, hw, hh)) e.y += dy;
    },
    inSpawn: (x, y) => inRect(spawn, x, y),
    inSafe: (x, y) => kind === "town" || safe.some((r) => inRect(r, x, y)),
    portalAt: (x, y) => portals.find((p) => inRect(p, x, y)),
    standable: (x, y) => Number.isFinite(x) && Number.isFinite(y) && x > 0 && y > 0 && x < MW * TILE && y < MH * TILE && !hits(x, y, 5, 4),
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

/**
 * Cổng `portal` (mục 6): `to` phải có trong MAPS, `arrive` phải là điểm có thật ở bản đồ đích và nằm ngoài mọi cổng của
 * bản đồ đó (vừa tới nơi không bị hiện lại hộp đi cổng). Sai thì cảnh báo và bỏ cổng.
 */
function parsePortal(mapId: string, o: any): Portal | null {
  const name = String(o.name ?? ""), to = String(propOf(o, "to") ?? ""), arrive = String(propOf(o, "arrive") ?? "");
  const bad = (why: string) => { console.warn(`[map ${mapId}] Bỏ cổng "${name}": ${why}`); return null; };
  if (!name) return bad("thiếu tên");
  if (!Object.hasOwn(MAPS, to)) return bad(`bản đồ đích không có trong MAPS: ${to}`);
  let objs: any[];
  try { objs = rawObjects(to); } catch { return bad(`không đọc được shared/assets/${to}.json`); }
  const a = objs.find((x) => x.type === "arrive" && x.name === arrive);
  if (!a) return bad(`điểm "${arrive}" không có ở ${to}`);
  if (objs.some((x) => x.type === "portal" && inRect(rectOf(x), a.x, a.y))) return bad(`điểm "${arrive}" nằm trong một cổng của ${to}`);
  const lv = propOf(o, "level");
  const level = lv === undefined || lv === "" ? MAPS[to].level : parseLevelRange(lv);
  if (lv !== undefined && lv !== "" && !level) console.warn(`[map ${mapId}] Cổng "${name}": cấp đề xuất sai "${lv}", bỏ qua.`);
  return { ...rectOf(o), name, to, arrive, ax: a.x, ay: a.y, level };
}
