// Đọc bản đồ Tiled dùng chung với client (shared/assets/<mapId>.json) để server tự kiểm tra va chạm.
// Ô nào có thuộc tính "collides" = true trong tileset sẽ chặn đường.
import { readFileSync, existsSync } from "node:fs";
import { solidGrid, hits as gridHits, moveEnt as gridMove, isSolidTile as gridSolid } from "../../shared/move.ts";
import { campMerchantSpot } from "../../shared/camp.ts";
import { TILE, TIERS, MAPS, MAX_YEARS, SPAWN_CLEAR, BOSSES, beastIndex, bossIndex, npcDef, parseLevelRange, type MapKind } from "../../shared/data.ts";

/** Loài sinh trong vùng: chỉ số trong BEASTS và trọng số. */
export interface ZoneBeast { species: number; w: number; }
export interface Zone {
  name: string; hint: string; x0: number; x1: number; y0: number; y1: number; count: number;
  years: [number, number] | null; // khoảng niên hạn hồn thú (thuộc tính `years`, bảng 5.3); null = vùng chưa khai báo
  weights: number[];   // trọng số theo bậc TIERS: chỉ dùng khi vùng thiếu `years`
  beasts: ZoneBeast[]; // loài khai báo ở thuộc tính `beasts` của vùng
}
export interface Rect { x: number; y: number; w: number; h: number; }
/**
 * Cổng (object `portal`): vùng chữ nhật, bản đồ đích, điểm xuất hiện ở bản đồ đích (đã đổi ra tọa độ), cấp đề xuất. `boat` (BĐ6d,
 * thuộc tính bool `boat`): bến thuyền, "đi thuyền" BOAT_CAST giây thay cho TRAVEL_CAST.
 */
export interface Portal extends Rect { name: string; to: string; arrive: string; ax: number; ay: number; level: [number, number] | null; boat: boolean; }
/** Chỗ sinh tinh anh (object `elite`, từ BĐ4): vùng chữ nhật, chỉ số trong BOSSES, chỉ số vùng (`zones`) chứa nó. */
export interface EliteSpot extends Rect { boss: number; zone: number; }
/** Hang thú vương (object `boss`, từ BĐ5): vùng chữ nhật (cũng là bán kính giao chiến), chỉ số trong BOSSES, chỉ số vùng chứa tâm hang. */
export interface BossSpot extends Rect { boss: number; zone: number; }
/**
 * Truyền tống trận (object `waypoint`, 11.2): vùng chữ nhật, `key` = `<mapId>:<tên object>` (lưu ở bảng `waypoints`), `label` = tên hiện
 * trên bản đồ thế giới (thuộc tính `label`, thiếu thì lấy tên object), điểm xuất hiện là tâm trận (`cx`, `cy`).
 */
export interface Waypoint extends Rect { key: string; map: string; name: string; label: string; cx: number; cy: number; }
/** NPC (object `npc`, từ 6.1): mã trong NPCS và chỗ đứng (chân). */
export interface NpcSpot { id: string; x: number; y: number; }

export interface GameMap {
  mapId: string;
  MW: number; MH: number;
  solid: Uint8Array;
  kind: MapKind;
  zones: Zone[];
  spawn: Rect;
  safe: Rect[];        // vùng an toàn (object `safe`); bản đồ `town` thì cả bản đồ an toàn
  portals: Portal[];
  elites: EliteSpot[];  // mỗi vùng tối đa 1 tinh anh (mục 5.4)
  lair: BossSpot | null; // hang tà hóa thú vương (BĐ5): tối đa 1 mỗi bản đồ, đúng thú vương của MAPS[mapId].king
  npcs: NpcSpot[];       // NPC (6.1): mỗi mã tối đa một chỗ trong bản đồ
  waypoints: Waypoint[]; // truyền tống trận (11.2)
  waypointAt(x: number, y: number): Waypoint | undefined;
  inLair(x: number, y: number): boolean;
  isSolidTile(tx: number, ty: number): boolean;
  hits(x: number, y: number, hw: number, hh: number): boolean;
  moveEnt(e: { x: number; y: number }, dx: number, dy: number, hw: number, hh: number): void;
  inSpawn(x: number, y: number): boolean;
  /** Trong vùng an toàn: không sinh hồn thú, hồn thú không đuổi vào, không giao chiến (mục 5.3, 5.8). */
  inSafe(x: number, y: number): boolean;
  portalAt(x: number, y: number): Portal | undefined;
  /** Cách trại cổng (`spawn`), một cổng, một truyền tống trận hoặc một điểm `arrive` của bản đồ này dưới SPAWN_CLEAR pixel theo cả hai
   *  trục: không sinh hồn thú ở đây (mục 5.8). */
  nearGate(x: number, y: number): boolean;
  /** Vị trí đứng được: trong bản đồ và không kẹt trong ô chặn (dùng khi nạp vị trí đã lưu). */
  standable(x: number, y: number): boolean;
}

const inRect = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

/**
 * Tên file Tiled (không đuôi) của bản đồ: `<mapId>`, hoặc bản dựng lại `<mapId>.v2` (tools/maps, 11.3) khi biến môi trường
 * `MAP_V2` liệt kê mapId đó (cách nhau bằng dấu phẩy, `all` = mọi bản đồ có bản v2) và file có thật. Client đọc tên này ở
 * `MapState.mapFile` để tải đúng file (va chạm, dự đoán chuyển động dùng chung lưới).
 */
const V2 = new Set((process.env.MAP_V2 ?? "").split(",").map((s) => s.trim()).filter(Boolean));
const fileCache = new Map<string, string>();
export function mapFile(mapId: string): string {
  let f = fileCache.get(mapId);
  if (f === undefined) {
    const v2 = (V2.has(mapId) || V2.has("all")) && existsSync(new URL(`../../shared/assets/${mapId}.v2.json`, import.meta.url));
    fileCache.set(mapId, (f = v2 ? `${mapId}.v2` : mapId));
    if (v2) console.log(`[map] ${mapId}: dùng bản dựng lại shared/assets/${f}.json (MAP_V2)`);
  }
  return f;
}

/** Object của file Tiled, đọc thô (dùng để kiểm tra cổng trỏ sang bản đồ khác mà không nạp hẳn bản đồ đó). */
const rawCache = new Map<string, any[]>();
function rawObjects(mapId: string): any[] {
  let objs = rawCache.get(mapId);
  if (!objs) {
    const raw = JSON.parse(readFileSync(new URL(`../../shared/assets/${mapFile(mapId)}.json`, import.meta.url), "utf8"));
    objs = raw.layers.filter((l: any) => l.type === "objectgroup").flatMap((l: any) => l.objects);
    rawCache.set(mapId, objs!);
  }
  return objs!;
}
const propOf = (o: any, n: string) => (o.properties ?? []).find((p: any) => p.name === n)?.value;
const rectOf = (o: any): Rect => ({ x: o.x, y: o.y, w: o.width, h: o.height });

/**
 * Chỉ đường giữa các bản đồ (nhiệm vụ hằng ngày, chấm trên bản đồ nhỏ): với mỗi bản đồ đích, bản đồ kề nên đi tới trước (qua cổng
 * `portal` của `from` trỏ sang nó), theo số lần đi cổng ít nhất. Đọc thô object Tiled của mọi bản đồ, tính một lần mỗi `from`.
 */
const routeCache = new Map<string, Record<string, string>>();
export function mapRoute(from: string): Record<string, string> {
  const hit = routeCache.get(from); if (hit) return hit;
  const next = (id: string) => [...new Set(rawObjects(id).filter((o) => o.type === "portal").map((o) => String(propOf(o, "to") ?? ""))
    .filter((to) => Object.hasOwn(MAPS, to) && MAPS[to].kind !== "arena"))];
  const out: Record<string, string> = {};
  if (Object.hasOwn(MAPS, from)) {
    const q = next(from).map((n) => { out[n] = n; return n; });
    while (q.length) { const at = q.shift()!; for (const n of next(at)) if (n !== from && !out[n]) { out[n] = out[at]; q.push(n); } }
  }
  routeCache.set(from, out);
  return out;
}

/**
 * Số lần đi cổng ít nhất từ `from` tới mọi bản đồ đi tới được (chính nó: 0), theo cổng `portal` của các file Tiled. Dùng cho phí
 * truyền tống (waypointFee) và tìm thành gần nhất (Hồi Thành Phù), 11.2.
 */
const hopCache = new Map<string, Record<string, number>>();
export function mapHops(from: string): Record<string, number> {
  const hit = hopCache.get(from); if (hit) return hit;
  const out: Record<string, number> = {};
  if (Object.hasOwn(MAPS, from)) {
    out[from] = 0;
    const q = [from];
    while (q.length) {
      const at = q.shift()!;
      for (const o of rawObjects(at)) {
        const to = o.type === "portal" ? String(propOf(o, "to") ?? "") : "";
        if (Object.hasOwn(MAPS, to) && MAPS[to].kind !== "arena" && out[to] === undefined) { out[to] = out[at] + 1; q.push(to); }
      }
    }
  }
  hopCache.set(from, out);
  return out;
}

/** Các cặp bản đồ nối nhau bằng cổng (không lặp, không hướng), cho nét đường trên bản đồ thế giới (11.2). */
let linkCache: [string, string][] | null = null;
export function mapLinks(): [string, string][] {
  if (linkCache) return linkCache;
  const seen = new Set<string>(), out: [string, string][] = [];
  for (const a of Object.keys(MAPS)) {
    if (MAPS[a].kind === "arena") continue;
    for (const o of rawObjects(a)) {
      const b = o.type === "portal" ? String(propOf(o, "to") ?? "") : "";
      if (!Object.hasOwn(MAPS, b) || MAPS[b].kind === "arena") continue;
      const k = [a, b].sort().join("|");
      if (!seen.has(k)) { seen.add(k); out.push([a, b]); }
    }
  }
  return (linkCache = out);
}

/** Mọi truyền tống trận hợp lệ của mọi bản đồ (theo thứ tự MAPS), cho bản đồ thế giới và kiểm tra trận đích (11.2). */
export function allWaypoints(): Waypoint[] {
  return Object.keys(MAPS).filter((id) => MAPS[id].kind !== "arena").flatMap((id) => loadMap(id).waypoints);
}

/**
 * Nơi Hồi Thành Phù đưa về (11.2): bản đồ thành (`town`) ít lần đi cổng nhất từ `from` (bằng nhau thì theo thứ tự MAPS), xuất hiện ở
 * truyền tống trận đầu tiên của thành đó, không có thì giữa trại `spawn`. Đang ở thành thì về chính thành đó.
 */
export function nearestTown(from: string): { mapId: string; x: number; y: number; label: string } | null {
  const hops = mapHops(from);
  const town = Object.keys(MAPS).filter((id) => MAPS[id].kind === "town" && hops[id] !== undefined).sort((a, b) => hops[a] - hops[b])[0];
  if (!town) return null;
  const m = loadMap(town), w = m.waypoints[0];
  return w ? { mapId: town, x: w.cx, y: w.cy, label: w.label } : { mapId: town, x: m.spawn.x + m.spawn.w / 2, y: m.spawn.y + m.spawn.h / 2, label: MAPS[town].name };
}

/** Bản đồ đã nạp, dùng chung cho mọi kênh (phòng) của cùng `mapId`. */
const cache = new Map<string, GameMap>();

/** Nạp bản đồ theo `mapId` (phải có trong MAPS). Lỗi thì ném ra để phòng không mở được. */
export function loadMap(mapId: string): GameMap {
  const hit = cache.get(mapId); if (hit) return hit;
  if (!Object.hasOwn(MAPS, mapId)) throw new Error(`Bản đồ không tồn tại: ${mapId}`);
  const raw = JSON.parse(readFileSync(new URL(`../../shared/assets/${mapFile(mapId)}.json`, import.meta.url), "utf8"));
  // Lưới ô chặn đọc bằng hàm dùng chung với client (shared/move.ts): client dự đoán chuyển động trên đúng lưới này.
  const grid = solidGrid(raw), { MW, MH, solid } = grid;

  const zones: Zone[] = [], safe: Rect[] = [], portals: Portal[] = [], arrives: { x: number; y: number }[] = [], eliteObjs: any[] = [], bossObjs: any[] = [], npcObjs: any[] = [], wpObjs: any[] = [];
  let spawn: Rect = { x: 3 * TILE, y: 28 * TILE, w: 4 * TILE, h: 4 * TILE };
  for (const layer of raw.layers) if (layer.type === "objectgroup") for (const o of layer.objects) {
    const prop = (n: string) => (o.properties ?? []).find((p: any) => p.name === n)?.value;
    if (o.type === "zone") {
      const z: Zone = {
        name: o.name, hint: prop("hint") ?? "", x0: o.x, x1: o.x + o.width, y0: o.y, y1: o.y + o.height,
        years: parseZoneYears(mapId, o.name, prop("years")),
        weights: String(prop("weights") ?? "1").split(",").map(Number), count: Number(prop("count") ?? 8),
        beasts: parseBeasts(mapId, o.name, String(prop("beasts") ?? "")),
      };
      // Thiếu loài thì vẫn giữ vùng: hồn thú lấy loài bất kỳ trong BEASTS.
      if (!z.beasts.length) console.warn(`[map ${mapId}] Vùng "${o.name}" không khai báo loài hợp lệ; dùng loài bất kỳ.`);
      zones.push(z);
    }
    if (o.type === "spawn") spawn = rectOf(o);
    if (o.type === "safe") safe.push(rectOf(o));
    if (o.type === "arrive") arrives.push({ x: o.x, y: o.y });
    if (o.type === "elite") eliteObjs.push(o);
    if (o.type === "boss") bossObjs.push(o);
    if (o.type === "npc") npcObjs.push(o);
    if (o.type === "waypoint") wpObjs.push(o);
    if (o.type === "portal") {
      // Client gửi tên cổng khi xin đi, nên tên phải duy nhất trong bản đồ.
      const p = parsePortal(mapId, o);
      if (p && portals.some((q) => q.name === p.name)) console.warn(`[map ${mapId}] Bỏ cổng trùng tên "${p.name}".`);
      else if (p) portals.push(p);
    }
  }

  const elites = parseElites(mapId, eliteObjs, zones), lair = parseLair(mapId, bossObjs, zones), npcs = parseNpcs(mapId, npcObjs);
  const camp = campMerchantSpot(raw, mapId); // #111: thương nhân lưu động ở trại cổng bản đồ săn
  if (camp && !npcs.some((n) => n.id === camp.id)) npcs.push(camp);
  else if (!camp && MAPS[mapId].kind === "hunt" && !safe.some((r) => inRect(r, spawn.x + spawn.w / 2, spawn.y + spawn.h / 2)))
    console.warn(`[map ${mapId}] Không có chỗ đứng cho thương nhân lưu động trong trại cổng "spawn" (#111).`);

  const isSolidTile = (tx: number, ty: number) => gridSolid(grid, tx, ty);
  const hits = (x: number, y: number, hw: number, hh: number) => gridHits(grid, x, y, hw, hh);
  const waypoints = parseWaypoints(mapId, wpObjs, portals, (x, y) => x > 0 && y > 0 && x < MW * TILE && y < MH * TILE && !hits(x, y, 5, 4));
  const kind = MAPS[mapId].kind;
  const map: GameMap = {
    mapId, MW, MH, solid, kind, zones, spawn, safe, portals, elites, lair, npcs, waypoints, isSolidTile, hits,
    waypointAt: (x, y) => waypoints.find((w) => inRect(w, x, y)),
    inLair: (x, y) => !!lair && inRect(lair, x, y),
    moveEnt: (e, dx, dy, hw, hh) => gridMove(grid, e, dx, dy, hw, hh),
    inSpawn: (x, y) => inRect(spawn, x, y),
    inSafe: (x, y) => kind === "town" || safe.some((r) => inRect(r, x, y)),
    portalAt: (x, y) => portals.find((p) => inRect(p, x, y)),
    nearGate: (x, y) => [spawn, ...portals, ...waypoints, ...arrives.map((a) => ({ ...a, w: 0, h: 0 }))]
      .some((r) => x > r.x - SPAWN_CLEAR && x < r.x + r.w + SPAWN_CLEAR && y > r.y - SPAWN_CLEAR && y < r.y + r.h + SPAWN_CLEAR),
    standable: (x, y) => Number.isFinite(x) && Number.isFinite(y) && x > 0 && y > 0 && x < MW * TILE && y < MH * TILE && !hits(x, y, 5, 4),
  };
  cache.set(mapId, map);
  return map;
}

/**
 * Thuộc tính `years` của vùng ("300-700"): khoảng niên hạn hồn thú, phải nằm trong 10–100.000 năm. Thiếu hoặc sai thì cảnh báo,
 * vùng đó tung bậc theo `weights` rồi tung tuổi trong bậc (cách cũ, cho tới khi mọi vùng có `years`).
 */
function parseZoneYears(mapId: string, zone: string, v: unknown): [number, number] | null {
  const r = v === undefined || v === "" ? null : parseLevelRange(v);
  if (r && r[0] >= TIERS[0].years && r[1] <= MAX_YEARS) return r;
  console.warn(`[map ${mapId}] Vùng "${zone}": niên hạn ${v === undefined ? "chưa khai báo" : `sai "${v}"`}; tung bậc theo weights.`);
  return null;
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
  try { objs = rawObjects(to); } catch { return bad(`không đọc được shared/assets/${mapFile(to)}.json`); }
  const a = objs.find((x) => x.type === "arrive" && x.name === arrive);
  if (!a) return bad(`điểm "${arrive}" không có ở ${to}`);
  if (objs.some((x) => x.type === "portal" && inRect(rectOf(x), a.x, a.y))) return bad(`điểm "${arrive}" nằm trong một cổng của ${to}`);
  const lv = propOf(o, "level");
  const level = lv === undefined || lv === "" ? MAPS[to].level : parseLevelRange(lv);
  if (lv !== undefined && lv !== "" && !level) console.warn(`[map ${mapId}] Cổng "${name}": cấp đề xuất sai "${lv}", bỏ qua.`);
  return { ...rectOf(o), name, to, arrive, ax: a.x, ay: a.y, level, boat: propOf(o, "boat") === true };
}

/**
 * Object `elite` (mục 6, BĐ4): `boss` phải là mã tinh anh trong BOSSES, tâm phải nằm trong một `zone`, mỗi vùng (theo tên) tối đa
 * 1 tinh anh (mục 5.4), mỗi loài tinh anh tối đa 1 vùng (khóa thưởng tinh anh nhiều kênh theo loài, #119). Sai thì cảnh báo và bỏ. Bản đồ
 * `town` không có tinh anh.
 */
function parseElites(mapId: string, objs: any[], zones: Zone[]): EliteSpot[] {
  const out: EliteSpot[] = [];
  for (const o of objs) {
    const id = String(propOf(o, "boss") ?? ""), boss = bossIndex(id), r = rectOf(o), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const bad = (why: string) => console.warn(`[map ${mapId}] Bỏ tinh anh "${o.name ?? id}": ${why}`);
    if (MAPS[mapId].kind === "town") { bad("bản đồ thành không có hồn thú"); continue; }
    if (boss < 0 || BOSSES[boss].rank !== 1) { bad(`mã không phải tinh anh trong BOSSES: ${id}`); continue; }
    const zone = zones.findIndex((z) => cx >= z.x0 && cx < z.x1 && cy >= z.y0 && cy < z.y1);
    if (zone < 0) { bad("không nằm trong vùng nào"); continue; }
    if (out.some((e) => zones[e.zone].name === zones[zone].name)) { bad(`vùng "${zones[zone].name}" đã có tinh anh`); continue; }
    if (out.some((e) => e.boss === boss)) { bad(`loài ${id} đã có ở vùng khác (khóa thưởng tinh anh theo loài)`); continue; }
    out.push({ ...r, boss, zone });
  }
  return out;
}

/**
 * Object `boss` (mục 6, BĐ5): hang tà hóa thú vương. `boss` phải là mã thú vương (bậc 2) trong BOSSES và đúng MAPS[mapId].king, tâm
 * nằm trong một `zone` và đứng được, mỗi bản đồ tối đa 1 hang. Sai thì cảnh báo và bỏ; bản đồ có `king` mà thiếu hang cũng cảnh báo.
 * Từ BĐ6e: sàn đấu boss thế giới của bản đồ có MAPS[mapId].world (Lõi Tinh Đấu): `boss` là một mã boss thế giới (bậc 3) trong danh
 * sách đó; boss của ngày (luân phiên) do lịch quyết định, không theo thuộc tính này.
 */
function parseLair(mapId: string, objs: any[], zones: Zone[]): BossSpot | null {
  let out: BossSpot | null = null;
  const king = MAPS[mapId].king, world = MAPS[mapId].world ?? [];
  for (const o of objs) {
    const id = String(propOf(o, "boss") ?? ""), boss = bossIndex(id), r = rectOf(o), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const bad = (why: string) => console.warn(`[map ${mapId}] Bỏ hang thú vương "${o.name ?? id}": ${why}`);
    if (world.length) { if (boss < 0 || BOSSES[boss].rank !== 3 || !world.includes(id)) { bad(`mã không phải boss thế giới của MAPS.${mapId}.world: ${id}`); continue; } }
    else if (boss < 0 || BOSSES[boss].rank !== 2) { bad(`mã không phải thú vương trong BOSSES: ${id}`); continue; }
    else if (id !== king) { bad(`MAPS.${mapId}.king là ${king ?? "(không có)"}`); continue; }
    const zone = zones.findIndex((z) => cx >= z.x0 && cx < z.x1 && cy >= z.y0 && cy < z.y1);
    if (zone < 0) { bad("không nằm trong vùng nào"); continue; }
    if (out) { bad("bản đồ đã có hang thú vương"); continue; }
    out = { ...r, boss, zone };
  }
  if ((king || world.length) && !out) console.warn(`[map ${mapId}] Thiếu object \`boss\` (hang) cho thú vương ${king}: thú vương không xuất hiện.`);
  return out;
}

/**
 * Object `waypoint` (11.2): chữ nhật có tên (duy nhất trong bản đồ, là phần sau của mã lưu DB), thuộc tính `label` là tên hiện trên
 * bản đồ thế giới. Tâm trận phải đứng được và không nằm trong cổng nào (xuất hiện ở tâm). Không có ở sân đấu. Sai thì cảnh báo và bỏ.
 */
function parseWaypoints(mapId: string, objs: any[], portals: Portal[], standable: (x: number, y: number) => boolean): Waypoint[] {
  const out: Waypoint[] = [];
  for (const o of objs) {
    const name = String(o.name ?? ""), r = rectOf(o), cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const bad = (why: string) => console.warn(`[map ${mapId}] Bỏ truyền tống trận "${name}": ${why}`);
    if (MAPS[mapId].kind === "arena") { bad("sân đấu không có truyền tống trận"); continue; }
    if (!/^[a-z0-9_]+$/.test(name)) { bad("tên phải là mã chữ thường không dấu (a-z, 0-9, _)"); continue; }
    if (out.some((w) => w.name === name)) { bad("trùng tên"); continue; }
    if (!(r.w > 0 && r.h > 0)) { bad("phải là chữ nhật"); continue; }
    if (!standable(cx, cy)) { bad("tâm trận nằm trong ô chặn hoặc ngoài bản đồ"); continue; }
    if (portals.some((p) => inRect(p, cx, cy))) { bad("tâm trận nằm trong một cổng"); continue; }
    out.push({ ...r, key: `${mapId}:${name}`, map: mapId, name, label: String(propOf(o, "label") ?? "") || name, cx, cy });
  }
  return out;
}

/**
 * Object `npc` (mục 6, bước 6.1): thuộc tính `npc` phải là mã trong NPCS, mỗi mã tối đa một chỗ trong bản đồ (client gửi mã khi nói
 * chuyện). Sai thì cảnh báo và bỏ. NPC nên đứng trong vùng an toàn (cảnh báo nếu không).
 */
function parseNpcs(mapId: string, objs: any[]): NpcSpot[] {
  const out: NpcSpot[] = [];
  const kind = MAPS[mapId].kind, safe = objs.length ? rawObjects(mapId).filter((o) => o.type === "safe").map(rectOf) : [];
  for (const o of objs) {
    const id = String(propOf(o, "npc") ?? "");
    const bad = (why: string) => console.warn(`[map ${mapId}] Bỏ NPC "${o.name ?? id}": ${why}`);
    if (!npcDef(id)) { bad(`mã không có trong NPCS: ${id}`); continue; }
    if (out.some((n) => n.id === id)) { bad(`mã ${id} đã đặt ở chỗ khác`); continue; }
    if (kind !== "town" && !safe.some((r) => inRect(r, o.x, o.y))) console.warn(`[map ${mapId}] NPC "${id}" đứng ngoài vùng an toàn.`);
    out.push({ id, x: o.x, y: o.y });
  }
  return out;
}
