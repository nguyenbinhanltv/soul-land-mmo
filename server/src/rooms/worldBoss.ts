// Chỗ đứng trên sàn đấu boss thế giới (mục 5.4, #118): vòng an toàn của chiêu toàn sàn và chỗ nổi lên của Du Thủy. Hàm của server
// (tung bằng `rnd`, server truyền Math.random); tách khỏi MapRoom.ts để giảm xung đột. Luật dùng các chỗ này nằm trong MapRoom.
import { LAIR_SPOT, type Tele } from "../../../shared/data.ts";
import { PLAYER_HW, PLAYER_HH } from "../../../shared/move.ts";
import { type GameMap } from "../map.ts";

/** Hộp va chạm khi xét chỗ đứng: vòng an toàn theo hộp hồn sư; chỗ nổi lên và chỗ sinh của boss (spawnKing) theo hộp boss. */
type Box = { hw: number; hh: number };
const PLAYER_BOX: Box = { hw: PLAYER_HW, hh: PLAYER_HH };
export const BOSS_BOX: Box = { hw: 8, hh: 4 };

/** Đi thẳng từ (ax, ay) tới (bx, by) với hộp `box` không vướng ô chặn (lấy mẫu mỗi 8 pixel). */
function clearLine(map: GameMap, ax: number, ay: number, bx: number, by: number, box: Box) {
  const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 8));
  for (let k = 0; k <= n; k++) if (map.hits(ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n, box.hw, box.hh)) return false;
  return true;
}

/** Gốc để xét đi thẳng tới được: chỗ sinh của boss trong sàn (đã tránh ô chặn ở spawnKing). */
export type Anchor = { x: number; y: number };

/**
 * Một chỗ ngẫu nhiên trong sàn đấu (object `boss`), trong dải cột `col` / `cols` theo bề ngang, cách mép sàn `pad`, dọc trong dải
 * LAIR_SPOT.band, đi thẳng từ `at` tới được với hộp `box`, thỏa `ok`. Thử LAIR_SPOT.tries lần; không được thì null.
 */
function lairSpot(map: GameMap, rnd: () => number, at: Anchor, col: number, cols: number, pad: number, box: Box, ok: (x: number, y: number) => boolean) {
  const l = map.lair; if (!l) return null;
  const cw = l.w / cols, [b0, b1] = LAIR_SPOT.band;
  // Lấy mẫu đều trong phần cột nằm cách mép sàn `pad` (không kẹp: kẹp dồn nhiều mẫu về đúng mép).
  const x0 = Math.max(l.x + pad, l.x + col * cw), x1 = Math.min(l.x + l.w - pad, l.x + (col + 1) * cw); if (x1 < x0) return null;
  for (let i = 0; i < LAIR_SPOT.tries; i++) {
    const x = x0 + (x1 - x0) * rnd(), y = l.y + l.h * (b0 + (b1 - b0) * rnd());
    if (ok(x, y) && clearLine(map, at.x, at.y, x, y, box)) return { x: Math.round(x), y: Math.round(y) };
  }
  return null;
}

/**
 * Vòng an toàn của chiêu toàn sàn (BeastSkillDef.safe): `n` vòng bán kính `r`, mỗi vòng một dải cột theo bề ngang sàn (rải đều), tâm
 * đi thẳng tới được từ chỗ sinh của boss `at`, phần lớn trong vòng đứng được (4 điểm cách tâm nửa bán kính), hai vòng không chồng nhau. Dải nào không tìm được
 * chỗ thì thử cả bề ngang sàn; vẫn thiếu thì cảnh báo log.
 */
export function floorSafeZones(map: GameMap, at: Anchor, n: number, r: number, rnd: () => number): Tele[] {
  const out: Tele[] = [], h = r / 2;
  const apart = (x: number, y: number) => out.every((s) => Math.hypot(x - s.x, y - s.y) >= 2 * r)
    && [[h, 0], [-h, 0], [0, h], [0, -h]].every(([dx, dy]) => !map.hits(x + dx, y + dy, PLAYER_HW, PLAYER_HH));
  for (let k = 0; k < n; k++) {
    const p = lairSpot(map, rnd, at, k, n, r, PLAYER_BOX, apart) ?? lairSpot(map, rnd, at, 0, 1, r, PLAYER_BOX, apart);
    if (p) out.push({ shape: "circle", x: p.x, y: p.y, ang: 0, r, w: 0, arc: 0 });
  }
  if (map.lair && out.length < n) console.warn(`[map ${map.mapId}] Chiêu toàn sàn: chỉ đặt được ${out.length}/${n} vòng an toàn.`);
  return out;
}

/**
 * Chỗ nổi lên của Du Thủy: trong sàn, đi thẳng tới được từ chỗ sinh `at`, cách (fx, fy) ít nhất `away` pixel nếu được (không thì chỗ
 * bất kỳ trong sàn), boss đứng được; null nếu không có sàn hoặc không tìm được (nơi gọi cho nổi lên ở chỗ lặn).
 */
export function surfaceSpot(map: GameMap, at: Anchor, fx: number, fy: number, away: number, rnd: () => number) {
  return lairSpot(map, rnd, at, 0, 1, LAIR_SPOT.pad, BOSS_BOX, (x, y) => Math.hypot(x - fx, y - fy) >= away)
    ?? lairSpot(map, rnd, at, 0, 1, LAIR_SPOT.pad, BOSS_BOX, () => true);
}
