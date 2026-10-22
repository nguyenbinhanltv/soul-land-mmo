// Hỏa Đàn (#163, mục 5.4): đống lửa trong hang của thú vương có Cực Hàn (BossPhase.cold). Chỗ đặt tính từ hình chữ nhật `boss` của
// file Tiled, dùng chung cho server (map.ts) và client (GameScene), nên không cần object riêng trong bản đồ và hai bên luôn ra cùng một chỗ.
import { MAPS, BOSSES, bossIndex, TILE, type ColdDef } from "./data.ts";
import { solidGrid, hits, type SolidGrid } from "./move.ts";

/** Bước quét điểm trong hang (pixel). */
const STEP = TILE / 2;

/**
 * Hỏa Đàn của bản đồ `mapId` (file Tiled thô `raw`): chỗ đặt và luật Cực Hàn của thú vương, hoặc null nếu thú vương của bản đồ không
 * có `phase2.cold` hay không có hang (object `boss` mang đúng mã thú vương). Xét các điểm lưới trong hang mà ô vuông nửa cạnh
 * `fire.clear` quanh điểm đều đi được (lửa không nằm sát vách, người đứng quanh được); chọn điểm gần điểm tỉ lệ `fire.at` của hang
 * nhất, bằng nhau thì điểm quét trước (trên, trái). `g`: lưới ô chặn của `raw` nếu đã dựng (server truyền lưới của loadMap).
 */
export function hoaDanSpot(raw: any, mapId: string, g?: SolidGrid): { x: number; y: number; cold: ColdDef } | null {
  const king = MAPS[mapId]?.king, cold = king ? BOSSES[bossIndex(king)]?.phase2?.cold : undefined;
  if (!king || !cold) return null;
  const objs: any[] = (raw.layers ?? []).flatMap((l: any) => (l.type === "objectgroup" ? l.objects ?? [] : []));
  const o = objs.find((x) => x.type === "boss" && (x.properties as any[] | undefined)?.find((p) => p.name === "boss")?.value === king);
  if (!o) return null;
  const r = { x: o.x, y: o.y, w: o.width ?? 0, h: o.height ?? 0 }, c = cold.fire.clear;
  const tx = r.x + r.w * cold.fire.at[0], ty = r.y + r.h * cold.fire.at[1];
  g ??= solidGrid(raw);
  let best: { x: number; y: number; cold: ColdDef } | null = null, bd = Infinity;
  for (let y = r.y + c; y <= r.y + r.h - c; y += STEP)
    for (let x = r.x + c; x <= r.x + r.w - c; x += STEP) {
      if (hits(g, x, y, c, c)) continue;
      const d = Math.hypot(x - tx, y - ty);
      if (d < bd) { bd = d; best = { x, y, cold }; }
    }
  return best;
}
