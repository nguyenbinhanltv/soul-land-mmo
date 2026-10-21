// Thương nhân lưu động ở trại cổng bản đồ săn (#111, mục 5.8): chỗ đứng tính từ file Tiled, dùng chung cho server (map.ts) và client
// (GameScene), nên không cần object `npc` trong bản đồ và hai bên luôn ra cùng một chỗ.
import { MAPS, CAMP_MERCHANT, CAMP_GAP, CAMP_PT_GAP, CAMP_STEP, NPC_RANGE } from "./data.ts";
import { solidGrid, hits, PLAYER_HW, PLAYER_HH } from "./move.ts";

type R = { x: number; y: number; w: number; h: number };
const inR = (r: R, x: number, y: number, m = 0) => x >= r.x - m && x < r.x + r.w + m && y >= r.y - m && y < r.y + r.h + m;

/**
 * Chỗ đứng (chân) của thương nhân lưu động ở bản đồ `mapId` (file Tiled thô `raw`), hoặc null nếu không có: chỉ bản đồ săn, và trại
 * (object `spawn`) không nằm trong vùng an toàn `safe` (quảng trường làng Thánh Hồn Thôn không phải trại cổng). Xét các điểm lưới trong
 * trại đứng được (ô chặn và ngoài bản đồ đều bị `hits` loại), ngoài mọi cổng / truyền tống trận (nới CAMP_GAP), cách mọi `arrive` / NPC
 * khác ít nhất CAMP_PT_GAP. Ưu tiên điểm trong NPC_RANGE của một điểm `arrive` (người vừa tới nói chuyện được ngay), rồi điểm gần tâm
 * trại nhất (giữa trại, không bị cây mép trại che); bằng nhau thì điểm quét trước (trên, trái).
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
  const arrives = objs.filter((o) => o.type === "arrive");
  const g = solidGrid(raw), cx = spawn.x + spawn.w / 2, cy = spawn.y + spawn.h / 2, far = spawn.w + spawn.h;
  let best: { id: string; x: number; y: number } | null = null, bd = Infinity;
  for (let y = spawn.y + CAMP_STEP; y < spawn.y + spawn.h; y += CAMP_STEP)
    for (let x = spawn.x + CAMP_STEP; x < spawn.x + spawn.w; x += CAMP_STEP) {
      if (hits(g, x, y, PLAYER_HW, PLAYER_HH)) continue;
      if (avoid.some((r) => inR(r, x, y, CAMP_GAP)) || pts.some((p) => Math.hypot(p.x - x, p.y - y) < CAMP_PT_GAP)) continue;
      const talk = arrives.some((a) => Math.hypot(a.x - x, a.y - y) <= NPC_RANGE);
      const d = Math.hypot(x - cx, y - cy) + (talk ? 0 : far); // `far` lớn hơn mọi khoảng cách trong trại: điểm trong tầm luôn thắng
      if (d < bd) { bd = d; best = { id: CAMP_MERCHANT, x, y }; }
    }
  return best;
}
