// Chỗ đứng trên sàn đấu boss thế giới (mục 5.4, #118): vòng an toàn của chiêu toàn sàn và chỗ nổi lên của Du Thủy. Hàm của server
// (tung bằng `rnd`, server truyền Math.random); tách khỏi MapRoom.ts để giảm xung đột. Luật dùng các chỗ này nằm trong MapRoom.
import { type Tele } from "../../../shared/data.ts";
import { PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { type GameMap } from "../map.ts";

/** Đi thẳng từ (ax, ay) tới (bx, by) không vướng ô chặn (lấy mẫu mỗi 8 pixel theo hộp hồn sư). */
function clearLine(map: GameMap, ax: number, ay: number, bx: number, by: number) {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 8));
  for (let k = 0; k <= n; k++) if (map.hits(ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, PLAYER_HW, PLAYER_HH)) return false;
  return true;
}

/**
 * Một chỗ ngẫu nhiên trong sàn đấu (object `boss`), trong dải cột `col` / `cols` theo bề ngang, cách mép sàn `pad`, dọc trong khoảng
 * 20–80% bề cao, tới được bằng đường thẳng từ tâm sàn, thỏa `ok`. Thử `tries` lần; không được thì null.
 */
function lairSpot(map: GameMap, rnd: () => number, col: number, cols: number, pad: number, ok: (x: number, y: number) => boolean, tries = 30) {
  const l = map.lair; if (!l) return null;
  const cx = l.x + l.w / 2, cy = l.y + l.h / 2, cw = l.w / cols;
  for (let i = 0; i < tries; i++) {
    const x = Math.min(l.x + l.w - pad, Math.max(l.x + pad, l.x + (col + rnd()) * cw)), y = l.y + l.h * (0.2 + 0.6 * rnd());
    if (ok(x, y) && clearLine(map, cx, cy, x, y)) return { x: Math.round(x), y: Math.round(y) };
  }
  return null;
}

/**
 * Vòng an toàn của chiêu toàn sàn (BeastSkillDef.safe): `n` vòng bán kính `r`, mỗi vòng một dải cột theo bề ngang sàn (rải đều), tâm
 * tới được từ tâm sàn, hai vòng không chồng nhau. Dải không tìm được chỗ thì thiếu vòng đó.
 */
export function floorSafeZones(map: GameMap, n: number, r: number, rnd: () => number): Tele[] {
  const out: Tele[] = [];
  for (let k = 0; k < n; k++) {
    const p = lairSpot(map, rnd, k, n, r, (x, y) => out.every((s) => Math.hypot(x - s.x, y - s.y) >= 2 * r));
    if (p) out.push({ shape: "circle", x: p.x, y: p.y, ang: 0, r, w: 0, arc: 0 });
  }
  return out;
}

/** Chỗ nổi lên của Du Thủy: trong sàn, cách (fx, fy) ít nhất `away` pixel nếu được (không thì chỗ bất kỳ trong sàn), null nếu không có sàn. */
export function surfaceSpot(map: GameMap, fx: number, fy: number, away: number, rnd: () => number) {
  return lairSpot(map, rnd, 0, 1, 16, (x, y) => Math.hypot(x - fx, y - fy) >= away) ?? lairSpot(map, rnd, 0, 1, 16, () => true);
}
