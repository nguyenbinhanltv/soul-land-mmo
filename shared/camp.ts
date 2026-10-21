// Thương nhân lưu động ở trại cổng bản đồ săn (#111, mục 5.8): chỗ đứng tính từ file Tiled, dùng chung cho server (map.ts) và client
// (GameScene), nên không cần object `npc` trong bản đồ và hai bên luôn ra cùng một chỗ.
import { MAPS, TILE, CAMP_MERCHANT } from "./data.ts";
import { solidGrid, hits, PLAYER_HW, PLAYER_HH } from "./move.ts";

/** Cách mép cổng, truyền tống trận ít nhất CAMP_GAP pixel, cách điểm `arrive`, NPC khác CAMP_PT_GAP pixel; xét lưới CAMP_STEP pixel. */
const CAMP_GAP = 16, CAMP_PT_GAP = 28, CAMP_STEP = 8;
type R = { x: number; y: number; w: number; h: number };
const inR = (r: R, x: number, y: number, m = 0) => x >= r.x - m && x < r.x + r.w + m && y >= r.y - m && y < r.y + r.h + m;

/**
 * Chỗ đứng (chân) của thương nhân lưu động ở bản đồ `mapId` (file Tiled thô `raw`), hoặc null nếu không có: chỉ bản đồ săn, và trại
 * (object `spawn`) không nằm trong vùng an toàn `safe` (quảng trường làng Thánh Hồn Thôn không phải trại cổng). Xét các điểm lưới trong
 * trại, lấy điểm gần tâm trại nhất (giữa trại, không bị cây mép trại che) đứng được, ngoài mọi cổng / truyền tống trận (nới CAMP_GAP),
 * cách mọi `arrive` / NPC khác CAMP_PT_GAP (người vừa tới không đứng chồng lên); bằng nhau thì điểm quét trước (trên, trái).
 */
export function campMerchantSpot(raw: any, mapId: string): { id: string; x: number; y: number } | null {
  if (MAPS[mapId]?.kind !== "hunt") return null;
  const objs: any[] = (raw.layers ?? []).flatMap((l: any) => (l.type === "objectgroup" ? l.objects : []));
  const rect = (o: any): R => ({ x: o.x, y: o.y, w: o.width ?? 0, h: o.height ?? 0 });
  const sp = objs.find((o) => o.type === "spawn"); if (!sp) return null;
  const spawn = rect(sp), safe = objs.filter((o) => o.type === "safe").map(rect);
  if (safe.some((r) => inR(r, spawn.x + spawn.w / 2, spawn.y + spawn.h / 2))) return null;
  const avoid = objs.filter((o) => o.type === "portal" || o.type === "waypoint").map(rect);
  const pts = objs.filter((o) => o.type === "arrive" || o.type === "npc").map((o) => ({ x: o.x, y: o.y }));
  const g = solidGrid(raw), W = g.MW * TILE, H = g.MH * TILE, cx = spawn.x + spawn.w / 2, cy = spawn.y + spawn.h / 2;
  let best: { id: string; x: number; y: number } | null = null, bd = Infinity;
  for (let y = spawn.y + CAMP_STEP; y < spawn.y + spawn.h; y += CAMP_STEP)
    for (let x = spawn.x + CAMP_STEP; x < spawn.x + spawn.w; x += CAMP_STEP) {
      if (x <= 0 || y <= 0 || x >= W || y >= H || hits(g, x, y, PLAYER_HW, PLAYER_HH)) continue;
      if (avoid.some((r) => inR(r, x, y, CAMP_GAP)) || pts.some((p) => Math.hypot(p.x - x, p.y - y) < CAMP_PT_GAP)) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d < bd) { bd = d; best = { id: CAMP_MERCHANT, x, y }; }
    }
  return best;
}
